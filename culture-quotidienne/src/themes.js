// Thèmes récurrents, jokers et fil rouge de l'histoire.

export const RECURRING_THEMES = [
  { name: 'Histoire', brief: "périodes expliquées, conflits, civilisations, géopolitique historique", web: false },
  { name: 'Économie', brief: "théories et modèles, paramètres qui influencent l'économie, politiques économiques", web: true },
  { name: 'Politique', brief: "actualité, organisation du pouvoir, acteurs et institutions", web: true },
  { name: 'Psychologie', brief: "études marquantes, biais cognitifs, réflexions sur le comportement humain", web: false },
  { name: 'IA et futur', brief: "intelligence artificielle, ses usages, ses limites, ses impacts sur la société et le travail", web: true },
  { name: 'Hôtellerie-restauration', brief: "le secteur de l'hôtellerie et de la restauration, ses modèles économiques et son futur", web: true },
  { name: 'Vin', brief: "cépages, vignobles, terroirs, vinification, dégustation", web: false },
  { name: 'Tech', brief: "technologies, entreprises tech, innovations, infrastructures numériques", web: true },
];

export const JOKER_THEMES = [
  { name: 'Philosophie', brief: "grands courants, concepts et penseurs, appliqués à des questions concrètes", web: false },
  { name: 'Échecs', brief: "ouvertures, stratégie, parties célèbres, histoire du jeu", web: false },
  { name: 'Rhétorique', brief: "rhétorique et argumentation : figures, sophismes, techniques de persuasion", web: false },
  { name: 'Géographie', brief: "géographie physique et humaine, territoires, ressources, frontières", web: false },
  { name: 'Sciences', brief: "physique, biologie, chimie, astronomie : découvertes et mécanismes", web: false },
  { name: 'Art et architecture', brief: "mouvements, œuvres, architectes, comment regarder une œuvre", web: false },
  { name: 'Littérature', brief: "œuvres, auteurs, mouvements littéraires et ce qu'ils disent de leur époque", web: false },
  { name: 'Marketing et consommateur', brief: "comportement du consommateur, marques, stratégies marketing marquantes", web: false },
  { name: 'Neurosciences', brief: "fonctionnement du cerveau, mémoire, attention, émotions", web: false },
  { name: 'Droit', brief: "grands principes juridiques, institutions judiciaires, affaires célèbres", web: false },
  { name: 'Musique', brief: "histoire de la musique, genres, théorie accessible, œuvres marquantes", web: false },
  { name: 'Gastronomie', brief: "histoire des cuisines, produits, techniques et grands chefs", web: false },
  { name: 'Mythologie et religions', brief: "mythes fondateurs, religions du monde, leur influence culturelle", web: false },
  { name: 'Négociation', brief: "techniques de négociation, théorie des jeux appliquée, cas célèbres", web: false },
  { name: 'Sport et société', brief: "histoire et économie du sport, grands événements, enjeux sociaux", web: false },
];

export const ALL_THEMES = [...RECURRING_THEMES, ...JOKER_THEMES];

export function themeInfo(name) {
  return ALL_THEMES.find((t) => t.name === name) || { name, brief: '', web: false };
}

// Fil rouge chronologique. Pour chaque période : 1 sujet "vue d'ensemble",
// puis HISTORY_EVENTS_PER_PERIOD sujets précis, puis période suivante.
export const HISTORY_PERIODS = [
  'La Préhistoire et la révolution néolithique',
  'Les premières civilisations : Mésopotamie et Égypte ancienne',
  'La Grèce antique',
  'Rome, de la République à l’Empire',
  'La fin de l’Antiquité et la chute de l’Empire romain d’Occident',
  'Le haut Moyen Âge : royaumes barbares, Byzance et naissance de l’Islam',
  'Le Moyen Âge central : féodalité, croisades et essor des villes',
  'Le bas Moyen Âge : crises, peste noire et guerre de Cent Ans',
  'La Renaissance et les grandes découvertes',
  'Réformes et guerres de religion',
  'L’âge des monarchies absolues et des Lumières',
  'L’ère des révolutions (1765-1848)',
  'Le XIXe siècle : révolution industrielle, nations et empires coloniaux',
  'La Première Guerre mondiale',
  'L’entre-deux-guerres et la montée des totalitarismes',
  'La Seconde Guerre mondiale',
  'La guerre froide et la décolonisation',
  'Le monde depuis 1991',
];
export const HISTORY_EVENTS_PER_PERIOD = 4;
