# Culture quotidienne

Mini app web locale pour apprendre un peu chaque jour : 6 sujets de culture générale par jour (≥ 4 thèmes différents), des articles creusés mais accessibles générés par Claude, un mini-quiz pour fixer les idées et un historique de lecture.

## Installation

Prérequis : **Node.js 22.13 ou plus récent** (SQLite est intégré à Node, rien à compiler).

```bash
cd culture-quotidienne
npm install
```

## Configuration de la clé API

1. Crée une clé sur <https://console.anthropic.com/settings/keys>.
2. Copie le modèle de configuration et colle ta clé :

```bash
cp .env.example .env
# puis édite .env : ANTHROPIC_API_KEY=sk-ant-...
```

Le fichier `.env` est ignoré par git : ta clé ne sera jamais commitée.

## Lancement

```bash
npm start
```

Puis ouvre <http://localhost:3000>. Les données sont dans `data/culture.db` (SQLite).

- `npm run demo` : lance l'app avec du contenu simulé, sans clé ni coût (base séparée `data/demo.db`).
- `npm test` : tests de bout en bout en mode simulé (génération, cache, archivage, report au lendemain avec changement de date simulé, historique).

## Comment ça marche

- **Liste du jour** : générée à la première ouverture de la journée par Claude Haiku 5.5 (rapide et peu coûteux), puis mise en cache en base. Les thèmes sont choisis par l'app (les moins récemment vus + 1 joker) pour garantir la variété. Tous les titres déjà proposés sont transmis au modèle pour éviter les doublons.
- **Articles** : générés au premier clic par Claude Opus 5.5, puis stockés et jamais regénérés. Pour Politique, Économie, Tech, IA et Hôtellerie-restauration, le modèle fait des recherches web et les sources s'affichent en bas de l'article. La première ouverture d'un article prend une à deux minutes.
- **À lire plus tard** : le sujet quitte la journée et revient le lendemain en tête de liste, avec un badge « Reporté · N jours d'attente ». 3 reportés maximum par jour, les autres restent en file d'attente.
- **Histoire** : fil rouge chronologique (18 périodes, de la Préhistoire à aujourd'hui). Pour chaque période, une vue d'ensemble puis 4 sujets précis.

## Options (`.env`)

| Variable | Défaut | Rôle |
|---|---|---|
| `PORT` | `3000` | Port local |
| `TOPICS_MODEL` | `claude-haiku-5-5` | Modèle pour la liste du jour |
| `ARTICLE_MODEL` | `claude-opus-5-5` | Modèle pour les articles |
| `ARTICLE_EFFORT` | `medium` | `low` / `medium` / `high` : profondeur de réflexion (qualité vs coût) |
| `HOST` | `127.0.0.1` | Mets `0.0.0.0` pour y accéder depuis ton téléphone sur le même Wi-Fi |
