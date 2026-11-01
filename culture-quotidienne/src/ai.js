import Anthropic from '@anthropic-ai/sdk';

// Modèle rapide pour la liste du jour, modèle costaud pour les articles.
export const TOPICS_MODEL = process.env.TOPICS_MODEL || 'claude-haiku-5-5';
export const ARTICLE_MODEL = process.env.ARTICLE_MODEL || 'claude-opus-5-5';
const ARTICLE_EFFORT = process.env.ARTICLE_EFFORT || 'medium';

export const MOCK = process.env.MOCK_AI === '1';

let client = null;
function getClient() {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error(
      "ANTHROPIC_API_KEY manquante : crée un fichier .env (voir .env.example) ou lance avec MOCK_AI=1 pour tester sans API."
    );
  }
  client ??= new Anthropic();
  return client;
}

/* ------------------------------------------------------------------ */
/* 1. Propositions du jour                                             */
/* ------------------------------------------------------------------ */

const TOPICS_SCHEMA = {
  type: 'object',
  properties: {
    topics: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          slot: { type: 'integer', description: 'Numéro du créneau demandé' },
          title: { type: 'string' },
          hook: { type: 'string' },
          read_minutes: { type: 'integer' },
          angle: { type: 'string' },
        },
        required: ['slot', 'title', 'hook', 'read_minutes', 'angle'],
        additionalProperties: false,
      },
    },
  },
  required: ['topics'],
  additionalProperties: false,
};

const TOPICS_SYSTEM = `Tu es l'éditeur en chef d'une revue quotidienne de culture générale destinée à Pierre, étudiant en marketing curieux de tout.
Chaque jour, tu proposes des sujets variés, creusés mais accessibles.

Règles pour chaque sujet :
- Un sujet précis et bien délimité (pas « L'histoire de l'économie » mais « Pourquoi l'hyperinflation de Weimar a-t-elle explosé en 1923 ? »).
- title : un titre accrocheur en français, 12 mots maximum.
- hook : exactement 2 phrases qui donnent envie de lire, sans promesse mensongère.
- read_minutes : entre 3 et 10, selon la richesse réelle du sujet.
- angle : 2 à 4 phrases pour le rédacteur : la question centrale, les notions clés à expliquer, les exemples concrets à mobiliser.
- Ne repropose JAMAIS un sujet figurant dans la liste des sujets déjà traités, même reformulé ou très proche.
- N'invente aucun fait. Pour les thèmes d'actualité, choisis des enjeux de fond durables plutôt qu'un événement précis dont tu n'es pas certain : le rédacteur vérifiera l'actualité récente par recherche web.
- Respecte strictement le thème et les consignes de chaque créneau.`;

export async function generateTopics({ date, slots, pastTitles }) {
  if (MOCK) return mockTopics({ slots, pastTitles });

  const slotLines = slots
    .map((s, i) => {
      let line = `Créneau ${i + 1} — thème « ${s.theme} » (${s.brief})`;
      if (s.history) {
        line +=
          s.history.kind === 'overview'
            ? `\n   Fil rouge histoire : propose une VUE D'ENSEMBLE de la période « ${s.history.period} » (repères chronologiques, dynamiques principales, pourquoi elle compte).`
            : `\n   Fil rouge histoire : propose un ÉVÉNEMENT, un personnage ou un phénomène PRÉCIS de la période « ${s.history.period} », qui n'a pas encore été traité.`;
      }
      return line;
    })
    .join('\n');

  const past = pastTitles.length
    ? pastTitles.map((t) => `- [${t.theme}] ${t.title}`).join('\n')
    : '(aucun pour l’instant)';

  const response = await getClient().messages.create({
    model: TOPICS_MODEL,
    max_tokens: 8000,
    output_config: {
      effort: 'low',
      format: { type: 'json_schema', schema: TOPICS_SCHEMA },
    },
    system: TOPICS_SYSTEM,
    messages: [
      {
        role: 'user',
        content: `Date du jour : ${date}.

Sujets déjà traités (à ne jamais reproposer) :
${past}

Propose exactement ${slots.length} sujets, un par créneau :
${slotLines}`,
      },
    ],
  });

  if (response.stop_reason === 'refusal') throw new Error('Génération des sujets refusée par le modèle.');
  const text = response.content.filter((b) => b.type === 'text').map((b) => b.text).join('');
  const parsed = JSON.parse(text);
  return parsed.topics;
}

/* ------------------------------------------------------------------ */
/* 2. Article complet                                                   */
/* ------------------------------------------------------------------ */

const ARTICLE_SYSTEM = `Tu es un rédacteur de vulgarisation de haut niveau. Tu écris pour Pierre, étudiant en marketing qui veut développer sa culture générale.

Exigences de fond :
- On creuse, on ne survole pas : contexte, mécanismes, causes, exemples concrets, nuances, débats entre spécialistes.
- Langage simple. Quand une notion est complexe, commence par une analogie ou un exemple du quotidien, puis entre dans le détail.
- Ton clair et vivant, sérieux sans être scolaire. Français impeccable.
- Rigueur absolue : n'invente jamais un fait, un chiffre, une date ou une citation. Si tu n'es pas sûr d'un chiffre, donne un ordre de grandeur en le signalant, ou n'en donne pas. Ne cite entre guillemets que des phrases dont tu es certain. Signale les points qui font débat.
- Si la recherche web est disponible, utilise-la pour vérifier les faits récents et t'appuyer sur des sources fiables et datées (presse de référence, institutions, publications académiques). Mentionne les dates des informations d'actualité.

Format de sortie (Markdown), et RIEN d'autre (aucune phrase avant ou après, aucun commentaire sur tes recherches) :
# Titre
Un paragraphe d'accroche percutant.
## Intertitre
... (3 à 6 sections avec intertitres ##, paragraphes courts, listes si utile, **gras** pour les notions clés)
## À retenir
- 3 à 5 points clés, une phrase chacun.

Puis, tout à la fin, un bloc de code \`\`\`json contenant le mini-quiz : un tableau de 3 objets
{"question": "...", "choices": ["A", "B", "C", "D"], "answer": <index 0-3 de la bonne réponse>, "explanation": "1 à 2 phrases"}.
Les questions vérifient la compréhension des idées clés de l'article (pas des détails anecdotiques).
N'écris pas de section « Sources » : elles sont ajoutées automatiquement.`;

export async function generateArticle(topic, { useWeb }) {
  if (MOCK) return mockArticle(topic, { useWeb });

  const words = Math.round(topic.read_minutes * 220);
  const userPrompt = `Écris l'article suivant.

Thème : ${topic.theme}
Titre proposé : ${topic.title}
Accroche annoncée : ${topic.hook}
Angle éditorial : ${topic.angle || '—'}
${topic.history_period ? `Fil rouge histoire : période « ${topic.history_period} » (${topic.history_kind === 'overview' ? "vue d'ensemble de la période" : 'événement précis, à resituer dans la période'}).\n` : ''}Longueur visée : environ ${words} mots (${topic.read_minutes} min de lecture), hors quiz.
Date du jour : ${topic.proposed_date}.${useWeb ? '\nC’est un thème lié à l’actualité : fais des recherches web pour t’appuyer sur des sources récentes.' : ''}`;

  const params = {
    model: ARTICLE_MODEL,
    max_tokens: 32000,
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default', // reroute automatique si le modèle principal refuse
    output_config: { effort: ARTICLE_EFFORT },
    system: ARTICLE_SYSTEM,
    messages: [{ role: 'user', content: userPrompt }],
  };
  if (useWeb) params.tools = [{ type: 'web_search_20260209', name: 'web_search', max_uses: 6 }];

  let message;
  const allContent = [];
  for (let i = 0; i < 5; i++) {
    message = await getClient().beta.messages.stream(params).finalMessage();
    allContent.push(...message.content);
    if (message.stop_reason !== 'pause_turn') break;
    // Tour serveur mis en pause (recherche web longue) : on renvoie la réponse telle quelle pour reprendre.
    params.messages = [...params.messages, { role: 'assistant', content: message.content }];
  }

  if (message.stop_reason === 'refusal') throw new Error('Génération de l’article refusée par le modèle.');
  if (message.stop_reason === 'max_tokens') throw new Error('Article tronqué (limite de tokens atteinte), réessaie.');

  const text = message.content.filter((b) => b.type === 'text').map((b) => b.text).join('');
  const { markdown, quiz } = parseArticle(text);
  return { markdown, quiz, sources: extractSources(allContent), model: message.model };
}

export function parseArticle(text) {
  const fences = [...text.matchAll(/```json\s*([\s\S]*?)```/g)];
  if (!fences.length) throw new Error('Quiz introuvable dans la réponse du modèle.');
  const last = fences[fences.length - 1];
  const quiz = JSON.parse(last[1]);
  if (!Array.isArray(quiz) || quiz.length < 3) throw new Error('Quiz invalide.');
  for (const q of quiz) {
    if (!q.question || !Array.isArray(q.choices) || typeof q.answer !== 'number' || !q.choices[q.answer]) {
      throw new Error('Question de quiz mal formée.');
    }
  }
  let markdown = text.slice(0, last.index).trim();
  const h1 = markdown.search(/^# /m);
  if (h1 > 0) markdown = markdown.slice(h1); // supprime un éventuel préambule
  return { markdown, quiz: quiz.slice(0, 3) };
}

function extractSources(content) {
  const cited = new Map();
  const found = new Map();
  for (const block of content) {
    if (block.type === 'text' && Array.isArray(block.citations)) {
      for (const c of block.citations) if (c.url) cited.set(c.url, c.title || c.url);
    }
    if (block.type === 'web_search_tool_result' && Array.isArray(block.content)) {
      for (const r of block.content) if (r.url) found.set(r.url, { title: r.title || r.url, age: r.page_age || null });
    }
  }
  if (cited.size) {
    return [...cited].map(([url, title]) => ({ url, title, age: found.get(url)?.age || null }));
  }
  return [...found].slice(0, 8).map(([url, v]) => ({ url, title: v.title, age: v.age }));
}

/* ------------------------------------------------------------------ */
/* Mode simulé (MOCK_AI=1) : pour tester sans clé ni coût               */
/* ------------------------------------------------------------------ */

let mockCounter = 0;
function mockTopics({ slots, pastTitles }) {
  const used = new Set(pastTitles.map((t) => t.title));
  return slots.map((s, i) => {
    let title;
    do {
      mockCounter++;
      title = `${s.theme} : sujet simulé n°${mockCounter}`;
    } while (used.has(title));
    return {
      slot: i + 1,
      title: s.history ? `${title} (${s.history.kind === 'overview' ? "vue d'ensemble" : 'événement'} : ${s.history.period})` : title,
      hook: `Première phrase d’accroche simulée. Seconde phrase pour donner envie de lire.`,
      read_minutes: 3 + (mockCounter % 8),
      angle: 'Angle simulé.',
    };
  });
}

function mockArticle(topic, { useWeb }) {
  const markdown = `# ${topic.title}

Ceci est un article **simulé** (mode MOCK_AI) pour tester l'interface.

## Le contexte

Imagine une analogie simple avant d'entrer dans le détail. Lorem ipsum, mais en français.

## Les mécanismes

- Premier mécanisme
- Second mécanisme

## À retenir

- Point clé numéro un.
- Point clé numéro deux.
- Point clé numéro trois.`;
  const quiz = [1, 2, 3].map((n) => ({
    question: `Question simulée n°${n} ?`,
    choices: ['Réponse A', 'Réponse B', 'Réponse C', 'Réponse D'],
    answer: n % 4,
    explanation: `Explication simulée pour la question ${n}.`,
  }));
  const sources = useWeb ? [{ url: 'https://example.org/source', title: 'Source simulée', age: null }] : [];
  return { markdown, quiz, sources, model: 'mock' };
}
