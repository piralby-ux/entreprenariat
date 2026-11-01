# Culture quotidienne

Mini app web locale pour apprendre un peu chaque jour : 6 sujets de culture générale par jour (au moins 4 thèmes différents), des articles creusés mais accessibles rédigés par Claude, un mini-quiz pour fixer les idées, un historique, une page « Progrès » et l'export en flashcards.

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

- `npm run demo` : contenu simulé, sans clé ni coût (base séparée `data/demo.db`).
- `npm test` : tests de bout en bout en mode simulé.

## Lancement automatique au démarrage

```bash
npm run autostart:install   # l'app démarre à chaque ouverture de session (et tout de suite)
npm run autostart:remove    # pour désactiver
```

Fonctionne sur macOS (agent launchd), Windows (dossier Démarrage) et Linux (service systemd utilisateur). Journal : `data/server.log`. Pour voir ce qui serait installé sans rien toucher : `node scripts/autostart.js install --dry-run`.

Si tu déplaces le dossier ou changes de version de Node, relance `npm run autostart:install`.

## Préparation automatique de la journée

Quand l'app tourne, elle prépare la liste du jour chaque matin à `PREPARE_AT` (5 h par défaut), ou dès son démarrage si l'heure est passée : la page s'ouvre alors instantanément.

Avec `PREGENERATE_ARTICLES=1` dans `.env`, les 6 articles sont aussi rédigés à l'avance. C'est confortable, mais **chaque article rédigé est payé, même si tu ne le lis pas** : si tu lis 1 ou 2 sujets par jour, le coût des articles est multiplié par 3 à 6. C'est donc désactivé par défaut.

## Sur ton téléphone

1. Dans `.env`, ajoute `HOST=0.0.0.0` puis relance l'app : elle affiche l'adresse à ouvrir depuis ton téléphone (ex. `http://192.168.1.20:3000`), sur le même Wi-Fi que l'ordinateur.
2. Dans le navigateur du téléphone : menu Partager › « Sur l'écran d'accueil » (iPhone) ou ⋮ › « Ajouter à l'écran d'accueil » (Android).

⚠️ **Lecture hors connexion** : les navigateurs ne l'autorisent qu'en HTTPS (ou sur `localhost`). Avec l'adresse `http://192.168…`, l'app marche normalement sur le Wi-Fi, mais pas hors connexion. Pour avoir aussi le hors connexion et l'accès hors de chez toi, le plus simple est [Tailscale](https://tailscale.com) (gratuit) : installe-le sur l'ordinateur et le téléphone, puis lance `tailscale serve 3000` sur l'ordinateur et ouvre l'adresse `https://…ts.net` indiquée. Dans ce cas, `HOST=0.0.0.0` n'est pas nécessaire.

Sur l'ordinateur (`localhost`), le hors connexion fonctionne directement : tout article déjà ouvert reste lisible.

## Comment ça marche

- **Liste du jour** : générée par Claude Haiku 5.5 (rapide, peu coûteux) puis mise en cache. Les thèmes sont choisis par l'app : les moins récemment vus, pondérés par tes goûts, + 1 joker. Tous les titres déjà proposés sont transmis au modèle pour éviter les doublons.
- **👍 / 👎** (en bas de chaque article et dans l'historique) : un thème aimé revient plus souvent (jusqu'à ×1,8), un thème rejeté plus rarement (jusqu'à ×0,2, il ne disparaît jamais complètement). Les titres aimés ou rejetés sont aussi transmis au modèle pour orienter le choix des sujets.
- **Articles** : rédigés au premier clic par Claude Opus 5.5, puis stockés et jamais regénérés. Pour Politique, Économie, Tech, IA et Hôtellerie-restauration, recherche web et sources en bas de l'article. La première ouverture prend une à deux minutes.
- **Quiz** : seule ta première réponse compte pour les statistiques ; elle est réaffichée si tu rouvres l'article.
- **Progrès** : série de jours consécutifs avec au moins un sujet lu (et ton record), sujets lus, temps de lecture cumulé, taux de bonnes réponses, détail par thème.
- **Flashcards** (page Progrès) : pour chaque article lu, une carte « À retenir » et une carte par question du quiz.
  - *Anki* : Fichier › Importer › choisir le `.txt` (les colonnes et les étiquettes par thème sont reconnues automatiquement).
  - *CSV* : s'ouvre dans Excel ou Google Sheets, importable dans Quizlet.
- **À lire plus tard** : le sujet revient le lendemain en tête de liste avec un badge « Reporté · N jours d'attente ». 3 maximum par jour, les autres restent en file d'attente.
- **Histoire** : fil rouge chronologique (18 périodes). Pour chaque période, une vue d'ensemble puis 4 sujets précis.

## Options (`.env`)

| Variable | Défaut | Rôle |
|---|---|---|
| `PORT` | `3000` | Port local |
| `HOST` | `127.0.0.1` | `0.0.0.0` pour l'accès depuis le téléphone |
| `PREPARE_AT` | `05:00` | Heure de préparation automatique de la journée |
| `PREGENERATE_ARTICLES` | désactivé | `1` pour rédiger les 6 articles à l'avance |
| `PREPARE` | activé | `0` pour désactiver la préparation automatique |
| `TOPICS_MODEL` | `claude-haiku-5-5` | Modèle pour la liste du jour |
| `ARTICLE_MODEL` | `claude-opus-5-5` | Modèle pour les articles |
| `ARTICLE_EFFORT` | `medium` | `low` / `medium` / `high` : profondeur de réflexion (qualité vs coût) |
