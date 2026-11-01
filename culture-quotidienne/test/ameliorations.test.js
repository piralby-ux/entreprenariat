// Tests des améliorations : 👍/👎, quiz, séries, statistiques, export, préparation automatique.
import { test } from 'node:test';
import assert from 'node:assert/strict';

process.env.MOCK_AI = '1';
const { openDb } = await import('../src/db.js');
const { createApp } = await import('../server.js');
const { createService } = await import('../src/service.js');
const { setToday } = await import('../src/clock.js');
const { RECURRING_THEMES } = await import('../src/themes.js');

const db = openDb(':memory:');
const { app, service } = createApp(db);
const server = app.listen(0);
const base = `http://127.0.0.1:${server.address().port}`;
const get = (p) => fetch(base + p).then(async (r) => ({ status: r.status, body: await r.json() }));
const post = (p, body) =>
  fetch(base + p, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body || {}) })
    .then(async (r) => ({ status: r.status, body: await r.json() }));
test.after(() => server.close());

test('👍/👎 : changent la priorité des thèmes', () => {
  // Base isolée : les 8 thèmes récurrents vus le même jour, Vin détesté, Tech adoré.
  const db2 = openDb(':memory:');
  const s2 = createService(db2);
  const ins = db2.prepare(`INSERT INTO topics(title, theme, hook, read_minutes, status, proposed_date, first_proposed_date, feedback)
                           VALUES (?, ?, 'h', 5, 'read', '2026-11-01', '2026-11-01', ?)`);
  let n = 0;
  for (const t of RECURRING_THEMES) {
    const fb = t.name === 'Vin' ? -1 : t.name === 'Tech' ? 1 : null;
    for (let i = 0; i < 4; i++) ins.run(`${t.name} ${n++}`, t.name, fb);
  }
  const w = s2.themeWeights();
  assert.ok(Math.abs(w.Vin.weight - 0.2) < 1e-9);
  assert.ok(Math.abs(w.Tech.weight - 1.8) < 1e-9);
  for (let i = 0; i < 20; i++) {
    const picks = s2.chooseThemes(5, new Set(), '2026-11-06').filter((p) => !p.isJoker).map((p) => p.name);
    assert.equal(picks[0], 'Tech', 'le thème aimé passe en premier');
    assert.ok(!picks.includes('Vin'), 'le thème détesté passe son tour');
  }
});

test('👍/👎 via l’API, visibles dans l’historique', async () => {
  setToday('2026-11-09');
  const { body } = await get('/api/today');
  const id = body.topics[0].id;
  assert.equal((await post(`/api/topics/${id}/feedback`, { value: 1 })).status, 200);
  assert.equal((await post(`/api/topics/${id}/feedback`, { value: 5 })).status, 400);
  await post(`/api/topics/${id}/read`);
  const h = await get('/api/history');
  assert.equal(h.body.items.find((t) => t.id === id).feedback, 1);
  await post(`/api/topics/${id}/feedback`, { value: 0 });
  assert.equal((await get('/api/history')).body.items.find((t) => t.id === id).feedback, 0);
});

test('quiz : seule la première réponse compte, et elle est restituée', async () => {
  const { body } = await get('/api/today');
  const id = body.topics[1].id;
  const article = (await get(`/api/topics/${id}/article`)).body;
  const good = article.quiz[0].answer;
  const bad = (good + 1) % article.quiz[0].choices.length;
  assert.equal((await post(`/api/topics/${id}/quiz`, { question: 0, choice: good })).body.correct, true);
  await post(`/api/topics/${id}/quiz`, { question: 0, choice: bad }); // ignorée
  await post(`/api/topics/${id}/quiz`, { question: 1, choice: (article.quiz[1].answer + 1) % 4 });
  assert.equal((await post(`/api/topics/${id}/quiz`, { question: 7, choice: 0 })).status, 400);
  const again = (await get(`/api/topics/${id}/article`)).body;
  assert.deepEqual(again.answers, { 0: good, 1: (article.quiz[1].answer + 1) % 4 });
  await post(`/api/topics/${id}/read`);
  const stats = (await get('/api/stats')).body;
  assert.deepEqual(stats.quiz, { answered: 2, correct: 1 });
});

test('série de jours consécutifs (en cours et record)', async () => {
  // Lus : 09/11. Puis 10/11 et 11/11 → série de 3.
  for (const d of ['2026-11-10', '2026-11-11']) {
    setToday(d);
    const { body } = await get('/api/today');
    await post(`/api/topics/${body.topics[0].id}/read`);
  }
  let s = (await get('/api/stats')).body;
  assert.equal(s.current, 3);
  assert.equal(s.best, 3);
  assert.equal((await get('/api/today')).body.streak, 3);
  setToday('2026-11-12'); // rien lu encore aujourd'hui : la série tient toujours
  assert.equal((await get('/api/stats')).body.current, 3);
  setToday('2026-11-14'); // un jour sauté : série cassée, record conservé
  s = (await get('/api/stats')).body;
  assert.equal(s.current, 0);
  assert.equal(s.best, 3);
  assert.equal(s.totalRead, 4);
  assert.ok(s.totalMinutes > 0);
  assert.ok(s.byTheme.length >= 1);
});

test('export flashcards : Anki et CSV', async () => {
  const cards = service.flashcards();
  const withArticle = db.prepare(`SELECT COUNT(*) AS n FROM topics WHERE status = 'read' AND article_md IS NOT NULL`).get().n;
  assert.equal(cards.length, withArticle * 4, '1 carte « À retenir » + 3 cartes quiz par article lu');
  const retenir = cards.find((c) => c.front.includes('Que faut-il retenir'));
  assert.match(retenir.back, /• Point clé numéro un\./);

  const anki = await fetch(`${base}/api/export/flashcards?format=anki`);
  assert.match(anki.headers.get('content-disposition'), /anki\.txt/);
  const txt = await anki.text();
  assert.ok(txt.startsWith('#separator:tab\n#html:true\n#tags column:3\n'));
  assert.equal(txt.trim().split('\n').length, 3 + cards.length);
  assert.ok(txt.split('\n')[3].split('\t').length === 3);

  const raw = Buffer.from(await (await fetch(`${base}/api/export/flashcards?format=csv`)).arrayBuffer());
  assert.deepEqual([...raw.subarray(0, 3)], [0xef, 0xbb, 0xbf], 'BOM UTF-8 pour Excel');
  assert.ok(raw.toString('utf8').slice(1).startsWith('Thème;Recto;Verso'));
});

test('préparation automatique : liste du jour + articles rédigés à l’avance', async () => {
  setToday('2026-11-20');
  const res = await service.prepareDay({ articles: true });
  assert.equal(res.generated, 6);
  const { body } = await get('/api/today');
  assert.ok(body.topics.every((t) => t.hasArticle));
  const again = await service.prepareDay({ articles: true });
  assert.equal(again.generated, 0, 'rien n’est regénéré');
});

test('service worker et manifeste servis', async () => {
  const sw = await fetch(`${base}/sw.js`);
  assert.equal(sw.status, 200);
  const manifest = await (await fetch(`${base}/manifest.webmanifest`)).json();
  assert.equal(manifest.display, 'standalone');
  for (const icon of manifest.icons) assert.equal((await fetch(base + icon.src)).status, 200);
});
