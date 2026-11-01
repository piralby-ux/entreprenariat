import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';

const SCHEMA = `
CREATE TABLE IF NOT EXISTS topics (
  id                   INTEGER PRIMARY KEY AUTOINCREMENT,
  title                TEXT NOT NULL,
  theme                TEXT NOT NULL,
  hook                 TEXT NOT NULL,
  read_minutes         INTEGER NOT NULL,
  angle                TEXT,                 -- consigne de fond transmise au rédacteur
  is_joker             INTEGER NOT NULL DEFAULT 0,
  history_period       TEXT,                 -- fil rouge (thème Histoire uniquement)
  history_kind         TEXT,                 -- 'overview' | 'event'
  status               TEXT NOT NULL DEFAULT 'proposed'
                       CHECK (status IN ('proposed','archived','read')),
  proposed_date        TEXT NOT NULL,        -- dernière date de proposition
  first_proposed_date  TEXT NOT NULL,
  postponed_since      TEXT,                 -- date du premier report
  archived_date        TEXT,                 -- date du dernier report
  read_date            TEXT,
  article_md           TEXT,
  quiz_json            TEXT,
  sources_json         TEXT,
  article_model        TEXT,
  article_generated_at TEXT,
  created_at           TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_topics_status ON topics(status);

CREATE TABLE IF NOT EXISTS daily_slots (
  date      TEXT NOT NULL,
  topic_id  INTEGER NOT NULL REFERENCES topics(id),
  position  INTEGER NOT NULL,
  carried   INTEGER NOT NULL DEFAULT 0,       -- 1 = sujet reporté
  PRIMARY KEY (date, topic_id)
);

CREATE TABLE IF NOT EXISTS settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
`;

export function openDb(file = process.env.DB_PATH || path.resolve('data/culture.db')) {
  if (file !== ':memory:') fs.mkdirSync(path.dirname(file), { recursive: true });
  const db = new DatabaseSync(file);
  db.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
  db.exec(SCHEMA);
  return db;
}

export function getSetting(db, key, fallback = null) {
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key);
  return row ? JSON.parse(row.value) : fallback;
}

export function setSetting(db, key, value) {
  db.prepare(
    'INSERT INTO settings(key, value) VALUES(?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value'
  ).run(key, JSON.stringify(value));
}
