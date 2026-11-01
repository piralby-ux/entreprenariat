import express from 'express';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { openDb } from './src/db.js';
import { createService } from './src/service.js';
import { MOCK, TOPICS_MODEL, ARTICLE_MODEL } from './src/ai.js';
import { today } from './src/clock.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || '127.0.0.1';

export function createApp(db = openDb()) {
  const service = createService(db);
  const app = express();
  app.use(express.json());
  app.use(express.static(path.join(__dirname, 'public')));

  const wrap = (fn) => async (req, res) => {
    try {
      res.json(await fn(req));
    } catch (err) {
      if (!err.status || err.status >= 500) console.error(err);
      res.status(err.status || 500).json({ error: err.message || 'Erreur serveur' });
    }
  };
  const idOf = (req) => Number(req.params.id);

  app.get('/api/today', wrap(() => service.getToday()));
  app.get('/api/topics/:id/article', wrap((req) => service.getArticle(idOf(req))));
  app.post('/api/topics/:id/archive', wrap((req) => service.archive(idOf(req))));
  app.post('/api/topics/:id/read', wrap((req) => service.markRead(idOf(req))));
  app.post('/api/topics/:id/feedback', wrap((req) => service.setFeedback(idOf(req), req.body?.value)));
  app.post('/api/topics/:id/quiz', wrap((req) => service.answerQuiz(idOf(req), Number(req.body?.question), Number(req.body?.choice))));
  app.get('/api/history', wrap((req) => service.history({ q: String(req.query.q || ''), theme: String(req.query.theme || '') })));
  app.get('/api/queue', wrap(() => service.queue()));
  app.get('/api/stats', wrap(() => service.stats()));

  app.get('/api/export/flashcards', (req, res) => {
    const file = service.exportFlashcards(req.query.format === 'anki' ? 'anki' : 'csv');
    res.setHeader('Content-Type', file.type);
    res.setHeader('Content-Disposition', `attachment; filename="${file.filename}"`);
    res.send(file.body);
  });

  return { app, service };
}

/* ---------- Préparation automatique de la journée ---------- */
// Chaque jour à PREPARE_AT (et au démarrage si l'heure est passée), la liste du jour est
// générée ; avec PREGENERATE_ARTICLES=1, les 6 articles sont aussi rédigés à l'avance.
export function startDailyPreparation(service) {
  if (process.env.PREPARE === '0') return;
  const at = /^\d{1,2}:\d{2}$/.test(process.env.PREPARE_AT || '') ? process.env.PREPARE_AT : '05:00';
  const [h, m] = at.split(':').map(Number);
  const articles = process.env.PREGENERATE_ARTICLES === '1';
  let lastDone = null;
  let running = false;

  const tick = async () => {
    const now = new Date();
    const date = today();
    if (running || lastDone === date || now.getHours() * 60 + now.getMinutes() < h * 60 + m) return;
    running = true;
    try {
      const res = await service.prepareDay({ articles, log: (msg) => console.log(`[préparation] ${msg}`) });
      console.log(`[préparation] Journée du ${res.date} prête${articles ? ` (${res.generated} article(s) rédigé(s))` : ''}.`);
      lastDone = date;
    } catch (e) {
      console.error(`[préparation] Échec : ${e.message} (nouvel essai dans 10 min)`);
    } finally {
      running = false;
    }
  };
  setTimeout(tick, 2000);
  setInterval(tick, 10 * 60 * 1000).unref();
  console.log(`Préparation automatique chaque jour à ${at}${articles ? ', articles compris' : ' (liste du jour seulement)'}.`);
}

function lanUrls() {
  return Object.values(os.networkInterfaces())
    .flat()
    .filter((i) => i && i.family === 'IPv4' && !i.internal)
    .map((i) => `http://${i.address}:${PORT}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { app, service } = createApp();
  app.listen(PORT, HOST, () => {
    console.log(`Culture quotidienne → http://localhost:${PORT}`);
    if (HOST === '0.0.0.0') for (const u of lanUrls()) console.log(`Depuis ton téléphone (même Wi-Fi) → ${u}`);
    console.log(MOCK ? 'Mode simulé (MOCK_AI=1) : aucun appel API.' : `Modèles : ${TOPICS_MODEL} (sujets), ${ARTICLE_MODEL} (articles)`);
    if (!MOCK && !process.env.ANTHROPIC_API_KEY) console.warn('⚠️  ANTHROPIC_API_KEY absente : renseigne-la dans .env');
    startDailyPreparation(service);
  });
}
