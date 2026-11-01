import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { openDb } from './src/db.js';
import { createService } from './src/service.js';
import { MOCK, TOPICS_MODEL, ARTICLE_MODEL } from './src/ai.js';

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
  app.get('/api/history', wrap((req) => service.history({ q: String(req.query.q || ''), theme: String(req.query.theme || '') })));
  app.get('/api/queue', wrap(() => service.queue()));

  return { app, service };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { app } = createApp();
  app.listen(PORT, HOST, () => {
    console.log(`Culture quotidienne → http://localhost:${PORT}`);
    console.log(MOCK ? 'Mode simulé (MOCK_AI=1) : aucun appel API.' : `Modèles : ${TOPICS_MODEL} (sujets), ${ARTICLE_MODEL} (articles)`);
    if (!MOCK && !process.env.ANTHROPIC_API_KEY) console.warn('⚠️  ANTHROPIC_API_KEY absente : renseigne-la dans .env');
  });
}
