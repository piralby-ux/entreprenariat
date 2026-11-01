import { marked } from 'marked';
import { today, daysBetween } from './clock.js';
import { getSetting, setSetting } from './db.js';
import { generateTopics, generateArticle } from './ai.js';
import {
  RECURRING_THEMES, JOKER_THEMES, HISTORY_PERIODS, HISTORY_EVENTS_PER_PERIOD, themeInfo,
} from './themes.js';

export const TOPICS_PER_DAY = 6;
export const MAX_CARRIED_PER_DAY = 3;

// Le HTML brut éventuellement produit par le modèle est échappé, pas interprété.
const escapeHtml = (s) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
marked.use({ renderer: { html: (token) => escapeHtml(token.text) } });

const normalize = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
const shuffle = (arr) => arr.map((v) => [Math.random(), v]).sort((a, b) => a[0] - b[0]).map((x) => x[1]);

export function createService(db) {
  const inflightDays = new Map();
  const inflightArticles = new Map();

  /* ---------------- Choix des thèmes ---------------- */

  function lastSeenByTheme() {
    const rows = db.prepare('SELECT theme, MAX(first_proposed_date) AS last FROM topics GROUP BY theme').all();
    return Object.fromEntries(rows.map((r) => [r.theme, r.last]));
  }

  // Thèmes distincts, les moins récemment proposés en premier, + 1 joker par jour.
  function chooseThemes(count, excluded) {
    if (count <= 0) return [];
    const seen = lastSeenByTheme();
    const byOldest = (list) =>
      shuffle(list.filter((t) => !excluded.has(t.name))).sort((a, b) => (seen[a.name] || '').localeCompare(seen[b.name] || ''));

    const picks = [];
    if (count >= 2) {
      const joker = byOldest(JOKER_THEMES)[0];
      if (joker) picks.push({ ...joker, isJoker: true });
    }
    for (const t of byOldest(RECURRING_THEMES)) {
      if (picks.length >= count) break;
      picks.push({ ...t, isJoker: false });
    }
    // Garde-fou : compléter avec d'autres jokers si nécessaire.
    for (const t of byOldest(JOKER_THEMES)) {
      if (picks.length >= count) break;
      if (!picks.some((p) => p.name === t.name)) picks.push({ ...t, isJoker: true });
    }
    return picks;
  }

  /* ---------------- Fil rouge histoire ---------------- */

  function nextHistoryStep() {
    const s = getSetting(db, 'history', { periodIndex: 0, overviewDone: false, eventsDone: 0 });
    const period = HISTORY_PERIODS[s.periodIndex % HISTORY_PERIODS.length];
    const firstPass = s.periodIndex < HISTORY_PERIODS.length;
    return { period, kind: !s.overviewDone && firstPass ? 'overview' : 'event' };
  }

  function advanceHistory(kind) {
    const s = getSetting(db, 'history', { periodIndex: 0, overviewDone: false, eventsDone: 0 });
    if (kind === 'overview') s.overviewDone = true;
    else s.eventsDone += 1;
    if (s.eventsDone >= HISTORY_EVENTS_PER_PERIOD) {
      s.periodIndex += 1;
      s.overviewDone = false;
      s.eventsDone = 0;
    }
    setSetting(db, 'history', s);
  }

  /* ---------------- Construction de la journée ---------------- */

  async function buildDay(date) {
    // 1. Sujets reportés (les plus anciens d'abord), 3 max ; les autres restent en file.
    const carried = db
      .prepare(`SELECT * FROM topics WHERE status = 'archived' AND archived_date < ?
                ORDER BY postponed_since ASC, archived_date ASC, id ASC LIMIT ?`)
      .all(date, MAX_CARRIED_PER_DAY);

    // 2. Nouveaux thèmes, distincts de ceux des sujets reportés.
    const needed = TOPICS_PER_DAY - carried.length;
    const themes = chooseThemes(needed, new Set(carried.map((t) => t.theme)));
    const slots = themes.map((t) => ({
      theme: t.name, brief: t.brief, isJoker: t.isJoker,
      history: t.name === 'Histoire' ? nextHistoryStep() : null,
    }));

    // 3. Génération (modèle rapide), avec exclusion de tous les titres déjà proposés.
    const pastTitles = db.prepare('SELECT title, theme FROM topics ORDER BY id').all();
    const known = new Set(pastTitles.map((t) => normalize(t.title)));
    const accepted = new Map(); // index de créneau -> sujet

    for (let attempt = 0; attempt < 2 && accepted.size < slots.length; attempt++) {
      const missing = slots.map((s, i) => i).filter((i) => !accepted.has(i));
      const generated = await generateTopics({
        date,
        slots: missing.map((i) => slots[i]),
        pastTitles: [...pastTitles, ...[...accepted.values()].map((t) => ({ title: t.title, theme: t.theme }))],
      });
      generated.forEach((g, k) => {
        const idx = missing[(g.slot ? g.slot - 1 : k)] ?? missing[k];
        if (idx === undefined || accepted.has(idx) || !g.title) return;
        const key = normalize(g.title);
        if (known.has(key)) return; // doublon : on redemandera
        known.add(key);
        accepted.set(idx, { ...g, theme: slots[idx].theme });
      });
    }

    // 4. Écriture en base (transaction).
    db.exec('BEGIN');
    try {
      const markCarried = db.prepare(`UPDATE topics SET status = 'proposed', proposed_date = ? WHERE id = ?`);
      const insertSlot = db.prepare('INSERT INTO daily_slots(date, topic_id, position, carried) VALUES (?, ?, ?, ?)');
      const insertTopic = db.prepare(`INSERT INTO topics
        (title, theme, hook, read_minutes, angle, is_joker, history_period, history_kind, status, proposed_date, first_proposed_date)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'proposed', ?, ?)`);

      let pos = 0;
      for (const t of carried) {
        markCarried.run(date, t.id);
        insertSlot.run(date, t.id, pos++, 1);
      }
      for (let i = 0; i < slots.length; i++) {
        const g = accepted.get(i);
        if (!g) continue;
        const s = slots[i];
        const minutes = Math.min(10, Math.max(3, Math.round(Number(g.read_minutes) || 6)));
        const { lastInsertRowid } = insertTopic.run(
          g.title.trim(), s.theme, g.hook.trim(), minutes, g.angle || null, s.isJoker ? 1 : 0,
          s.history?.period ?? null, s.history?.kind ?? null, date, date
        );
        insertSlot.run(date, Number(lastInsertRowid), pos++, 0);
        if (s.history) advanceHistory(s.history.kind);
      }
      db.exec('COMMIT');
    } catch (e) {
      db.exec('ROLLBACK');
      throw e;
    }
  }

  async function ensureDay(date) {
    const exists = db.prepare('SELECT 1 FROM daily_slots WHERE date = ? LIMIT 1').get(date);
    if (exists) return;
    if (!inflightDays.has(date)) {
      inflightDays.set(date, buildDay(date).finally(() => inflightDays.delete(date)));
    }
    await inflightDays.get(date);
  }

  /* ---------------- Lecture publique ---------------- */

  function cardOf(t, date, carried) {
    return {
      id: t.id,
      title: t.title,
      theme: t.theme,
      hook: t.hook,
      readMinutes: t.read_minutes,
      isJoker: !!t.is_joker,
      status: t.status,
      carried: !!carried,
      waitingDays: carried && t.postponed_since ? daysBetween(t.postponed_since, date) : 0,
      hasArticle: !!t.article_md,
    };
  }

  async function getToday() {
    const date = today();
    await ensureDay(date);
    const rows = db
      .prepare(`SELECT t.*, s.carried FROM daily_slots s JOIN topics t ON t.id = s.topic_id
                WHERE s.date = ? ORDER BY s.position`)
      .all(date);
    // Un sujet archivé aujourd'hui est retiré de la journée.
    const visible = rows.filter((t) => !(t.status === 'archived'));
    const queue = db.prepare(`SELECT COUNT(*) AS n FROM topics WHERE status = 'archived'`).get().n;
    return {
      date,
      topics: visible.map((t) => cardOf(t, date, t.carried)),
      queued: queue,
      readToday: visible.filter((t) => t.status === 'read').length,
    };
  }

  function getTopicRow(id) {
    const t = db.prepare('SELECT * FROM topics WHERE id = ?').get(id);
    if (!t) throw httpError(404, 'Sujet introuvable');
    return t;
  }

  function articlePayload(t) {
    return {
      ...cardOf(t, today(), false),
      html: marked.parse(t.article_md),
      quiz: JSON.parse(t.quiz_json),
      sources: JSON.parse(t.sources_json || '[]'),
      readDate: t.read_date,
      proposedDate: t.first_proposed_date,
    };
  }

  // Généré au premier clic, puis stocké : jamais regénéré.
  async function getArticle(id) {
    let t = getTopicRow(id);
    if (!t.article_md) {
      if (!inflightArticles.has(id)) {
        const job = (async () => {
          const res = await generateArticle(t, { useWeb: themeInfo(t.theme).web });
          db.prepare(`UPDATE topics SET article_md = ?, quiz_json = ?, sources_json = ?, article_model = ?,
                      article_generated_at = datetime('now') WHERE id = ? AND article_md IS NULL`)
            .run(res.markdown, JSON.stringify(res.quiz), JSON.stringify(res.sources), res.model, id);
        })().finally(() => inflightArticles.delete(id));
        inflightArticles.set(id, job);
      }
      await inflightArticles.get(id);
      t = getTopicRow(id);
    }
    return articlePayload(t);
  }

  function archive(id) {
    const t = getTopicRow(id);
    if (t.status === 'read') throw httpError(409, 'Ce sujet est déjà lu.');
    const date = today();
    db.prepare(`UPDATE topics SET status = 'archived', archived_date = ?, postponed_since = COALESCE(postponed_since, ?)
                WHERE id = ?`).run(date, date, id);
    return { ok: true };
  }

  function markRead(id) {
    getTopicRow(id);
    db.prepare(`UPDATE topics SET status = 'read', read_date = ? WHERE id = ?`).run(today(), id);
    return { ok: true };
  }

  function history({ q = '', theme = '' } = {}) {
    const rows = db
      .prepare(`SELECT * FROM topics WHERE status = 'read'
                AND (? = '' OR theme = ?)
                AND (? = '' OR title LIKE ? OR hook LIKE ?)
                ORDER BY read_date DESC, id DESC`)
      .all(theme, theme, q, `%${q}%`, `%${q}%`);
    const themes = db.prepare(`SELECT theme, COUNT(*) AS n FROM topics WHERE status = 'read' GROUP BY theme ORDER BY theme`).all();
    return {
      items: rows.map((t) => ({ ...cardOf(t, today(), false), readDate: t.read_date })),
      themes,
    };
  }

  function queue() {
    const date = today();
    return db
      .prepare(`SELECT * FROM topics WHERE status = 'archived' ORDER BY postponed_since, archived_date, id`)
      .all()
      .map((t) => cardOf(t, date, true));
  }

  return { getToday, getArticle, archive, markRead, history, queue, chooseThemes };
}

export function httpError(status, message) {
  const e = new Error(message);
  e.status = status;
  return e;
}
