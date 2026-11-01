// Tests de bout en bout en mode simulé (aucun appel API), avec changement de date simulé.
import { test } from 'node:test';
import assert from 'node:assert/strict';

process.env.MOCK_AI = '1';
const { openDb } = await import('../src/db.js');
const { createApp } = await import('../server.js');
const { setToday } = await import('../src/clock.js');
const { parseArticle } = await import('../src/ai.js');

const db = openDb(':memory:');
const { app } = createApp(db);
const server = app.listen(0);
const base = `http://127.0.0.1:${server.address().port}`;
const get = (p) => fetch(base + p).then(async (r) => ({ status: r.status, body: await r.json() }));
const post = (p) => fetch(base + p, { method: 'POST' }).then(async (r) => ({ status: r.status, body: await r.json() }));
test.after(() => server.close());

const distinctThemes = (topics) => new Set(topics.map((t) => t.theme)).size;
const day1 = {};

test('jour 1 : 6 propositions, ≥ 4 thèmes, 1 joker, mises en cache', async () => {
  setToday('2026-11-02');
  const { body } = await get('/api/today');
  assert.equal(body.topics.length, 6);
  assert.ok(distinctThemes(body.topics) >= 4);
  assert.equal(body.topics.filter((t) => t.isJoker).length, 1);
  for (const t of body.topics) {
    assert.ok(t.readMinutes >= 3 && t.readMinutes <= 10);
    assert.equal(t.carried, false);
  }
  const again = await get('/api/today');
  assert.deepEqual(again.body.topics.map((t) => t.id), body.topics.map((t) => t.id), 'liste du jour mise en cache');
  day1.ids = body.topics.map((t) => t.id);
});

test('fil rouge histoire : la première proposition est une vue d’ensemble de la première période', () => {
  const row = db.prepare(`SELECT * FROM topics WHERE theme = 'Histoire' ORDER BY id LIMIT 1`).get();
  if (!row) return; // Histoire pas tiré ce jour-là
  assert.equal(row.history_kind, 'overview');
  assert.match(row.history_period, /Préhistoire/);
});

test('article généré au premier clic puis stocké (jamais regénéré)', async () => {
  const id = day1.ids[0];
  const [a1, a2] = await Promise.all([get(`/api/topics/${id}/article`), get(`/api/topics/${id}/article`)]);
  assert.equal(a1.status, 200);
  assert.match(a1.body.html, /À retenir/);
  assert.equal(a1.body.quiz.length, 3);
  assert.equal(a2.body.html, a1.body.html);
  const stamp = db.prepare('SELECT article_generated_at FROM topics WHERE id = ?').get(id).article_generated_at;
  await get(`/api/topics/${id}/article`);
  assert.equal(db.prepare('SELECT article_generated_at FROM topics WHERE id = ?').get(id).article_generated_at, stamp);
});

test('jour 1 : archiver retire de la journée, marquer lu', async () => {
  const [a, b, c, d, e] = day1.ids;
  for (const id of [a, b, c, d]) assert.equal((await post(`/api/topics/${id}/archive`)).status, 200);
  assert.equal((await post(`/api/topics/${e}/read`)).status, 200);
  const { body } = await get('/api/today');
  assert.equal(body.topics.length, 2);
  assert.ok(!body.topics.some((t) => [a, b, c, d].includes(t.id)));
  assert.equal(body.topics.find((t) => t.id === e).status, 'read');
  assert.equal(body.queued, 4);
  assert.equal((await post(`/api/topics/${e}/archive`)).status, 409, 'un sujet lu ne peut pas être reporté');
});

test('jour 2 : 3 reportés en tête avec badge, le 4e reste en file', async () => {
  setToday('2026-11-03');
  const { body } = await get('/api/today');
  const [a, b, c, d, e] = day1.ids;
  assert.equal(body.topics.length, 6);
  assert.deepEqual(body.topics.slice(0, 3).map((t) => t.id), [a, b, c]);
  for (const t of body.topics.slice(0, 3)) {
    assert.equal(t.carried, true);
    assert.equal(t.waitingDays, 1);
  }
  assert.ok(body.topics.slice(3).every((t) => !t.carried));
  assert.ok(!body.topics.some((t) => t.id === d), 'le 4e reporté attend son tour');
  assert.ok(!body.topics.some((t) => t.id === e), 'un sujet lu ne revient jamais');
  assert.equal(body.queued, 1);
  assert.ok(distinctThemes(body.topics) >= 4);
  // Les nouveaux thèmes ne recoupent pas ceux des reportés
  const carriedThemes = new Set(body.topics.slice(0, 3).map((t) => t.theme));
  assert.ok(body.topics.slice(3).every((t) => !carriedThemes.has(t.theme)));
  // On reporte à nouveau un sujet déjà reporté
  await post(`/api/topics/${a}/archive`);
  day1.a = a;
  day1.d = d;
});

test('jour 4 (un jour sauté) : le compteur d’attente part du premier report', async () => {
  setToday('2026-11-05');
  const { body } = await get('/api/today');
  const carried = body.topics.filter((t) => t.carried);
  assert.deepEqual(carried.map((t) => t.id), [day1.d, day1.a]);
  assert.ok(carried.every((t) => t.waitingDays === 3));
  assert.equal(body.topics.length, 6);
});

test('aucun titre n’est jamais reproposé', () => {
  const rows = db.prepare('SELECT title FROM topics').all();
  assert.equal(new Set(rows.map((r) => r.title)).size, rows.length);
});

test('historique : liste des lus, filtre par thème et recherche', async () => {
  const { body: today } = await get('/api/today');
  for (const t of today.topics.slice(0, 2)) await post(`/api/topics/${t.id}/read`);
  const { body } = await get('/api/history');
  assert.equal(body.items.length, 3);
  const theme = body.items[0].theme;
  const filtered = await get(`/api/history?theme=${encodeURIComponent(theme)}`);
  assert.ok(filtered.body.items.length >= 1 && filtered.body.items.every((t) => t.theme === theme));
  const search = await get(`/api/history?q=${encodeURIComponent(body.items[0].title.slice(0, 12))}`);
  assert.ok(search.body.items.some((t) => t.id === body.items[0].id));
});

test('rotation des thèmes : tous les thèmes récurrents apparaissent en quelques jours', async () => {
  for (const d of ['2026-11-06', '2026-11-07', '2026-11-08']) {
    setToday(d);
    await get('/api/today');
  }
  const themes = new Set(db.prepare('SELECT DISTINCT theme FROM topics WHERE is_joker = 0').all().map((r) => r.theme));
  assert.equal(themes.size, 8);
});

test('parseArticle : retire le préambule et extrait le quiz', () => {
  const text = `Je vais chercher des sources.\n# Titre\nAccroche.\n## À retenir\n- a\n\n\`\`\`json\n[{"question":"Q1","choices":["a","b"],"answer":1,"explanation":"x"},{"question":"Q2","choices":["a","b"],"answer":0},{"question":"Q3","choices":["a","b"],"answer":0}]\n\`\`\``;
  const { markdown, quiz } = parseArticle(text);
  assert.ok(markdown.startsWith('# Titre'));
  assert.ok(!markdown.includes('```'));
  assert.equal(quiz.length, 3);
});
