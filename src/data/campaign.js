// ═══ MODE CAMPAGNE — « La Chute de l'Empire » ═══
//
// Une campagne = une suite de 5 missions. Chaque mission est une PARTIE
// COMPLÈTE de Panamerica, jouée avec une configuration imposée (adversaires,
// carte, patrouilles de l'Empire, tuile de pose…) et un OBJECTIF DE MISSION
// distinct de la victoire aux points : la partie se termine comme d'habitude
// (6 étoiles), puis l'objectif est évalué sur l'état final.
//
// Réussir une mission débloque du CONTENU réservé — les trois ensembles
// transcrits du Scythe original qui dormaient dans les données (plateaux
// joueur, plans d'usine, missions secrètes) plus l'étoile de la quête Tesla.
// Le contenu débloqué reste disponible dans les missions suivantes ET en
// partie libre (case à cocher sur l'écran de setup).
//
// Chaque mission porte aussi des HONNEURS : un second objectif facultatif,
// plus dur, sans autre récompense qu'une mention au tableau de campagne.
//
// ── Contrat des objectifs ──
// check(me, ctx) — `me` est le joueur humain en fin de partie ; `ctx` porte :
//   players     : tous les joueurs (bots inclus)
//   rank         : rang du joueur au score final (1 = vainqueur)
//   score        : score final du joueur
//   sbCoins      : pièces gagnées via la tuile « bonus de pose »
//   turn         : numéro du tour à la fin de la partie
// Les checks sont PURS : aucun accès au state React, testables isolément.

import { MATS_ORIGINAL } from './mats.js';

// ── Déblocages : ce que chaque mission réussie ajoute au jeu ──
export const UNLOCKS = {
  mats_pionniers: {
    id: "mats_pionniers", icon: "🗂",
    name: "Plateaux des Pionniers",
    desc: "Industrie, Ingénierie et Patriotisme — 3 plateaux joueur du jeu original",
    matIds: [101, 102, 103],
  },
  mats_empire: {
    id: "mats_empire", icon: "🗄",
    name: "Archives de l'Empire",
    desc: "Mécanique, Agriculture, Innovation et Militant — les 4 derniers plateaux originaux",
    matIds: [104, 105, 106, 107],
  },
  plans_original: {
    id: "plans_original", icon: "📐",
    name: "Plans d'usine originaux",
    desc: "Les 12 plans du deck original rejoignent l'offre de la Rouge River",
  },
  tesla_star: {
    id: "tesla_star", icon: "🔬",
    name: "Étoile de la quête Tesla",
    desc: "Prendre un prototype Tesla pose désormais une étoile",
  },
  objectives_original: {
    id: "objectives_original", icon: "🗝",
    name: "Missions secrètes originales",
    desc: "Les 21 objectifs secrets du jeu original rejoignent le deck",
  },
};

// Plateaux originaux rendus disponibles par un ensemble de déblocages
export const unlockedMatIds = (unlocked) =>
  Object.values(UNLOCKS)
    .filter(u => u.matIds && unlocked.includes(u.id))
    .flatMap(u => u.matIds)
    .filter(id => MATS_ORIGINAL.some(m => m.id === id));

// ── Helpers d'objectif ──
const hasTeslaCard = (p) => p.factoryCard?.deck === "tesla";
const buildings = (p) => (p.buildings || []).length;

// ── Les 5 missions ──
// `setup` est la configuration IMPOSÉE de la partie (l'écran de setup verrouille
// ces réglages ; la faction et le plateau restent au choix du joueur).
export const CAMPAIGN = [
  {
    id: "m1", num: 1, act: "Acte I — Les Cendres",
    name: "Le Dernier Convoi",
    icon: "🚂",
    intro: "L'Empire Panaméricain n'envoie plus d'ordres depuis onze mois. Sur la ligne " +
      "de l'Ouest, un convoi de ravitaillement attend encore un chef de gare qui ne " +
      "viendra pas. Votre faction est la première à le comprendre.",
    brief: "Prenez pied sur le continent avant vos rivaux : terminez la partie en tête.",
    setup: { bots: 1, difficulty: "facile", map: "v3", empire: false, structureBonus: "random" },
    goal: {
      label: "Terminer 1er au score final",
      check: (me, ctx) => ctx.rank === 1,
    },
    honors: {
      label: "Sans perdre un seul combat : 3 étoiles ou plus et 12+ popularité",
      check: (me) => (me.stars || 0) >= 3 && me.pop >= 12,
    },
    reward: "mats_pionniers",
  },
  {
    id: "m2", num: 2, act: "Acte I — Les Cendres",
    name: "La Ruée vers l'Or",
    icon: "🏦",
    intro: "La rumeur court plus vite que les trains : les caisses impériales des " +
      "territoires frontaliers n'ont plus de garde. Qui plante sa scierie sous le nez " +
      "du voisin encaisse — s'il tient le terrain jusqu'au bout.",
    brief: "Tuile de pose imposée : Avant-Postes. Construisez au moins un bâtiment " +
      "adjacent à une base adverse et tenez-le, puis bâtissez ailleurs pour empiler la prime.",
    setup: { bots: 2, difficulty: "normal", map: "v3", empire: false, structureBonus: "avant_postes" },
    goal: {
      label: "Encaisser 12$ ou plus de bonus de pose (avant-poste + 1 autre bâtiment)",
      check: (me, ctx) => ctx.sbCoins >= 12,
    },
    honors: {
      label: "Le trésor de guerre : 12$ de bonus de pose ET terminer 1er",
      check: (me, ctx) => ctx.sbCoins >= 12 && ctx.rank === 1,
    },
    reward: "mats_empire",
  },
  {
    id: "m3", num: 3, act: "Acte II — Les Ordres Fantômes",
    name: "Les Machines Fantômes",
    icon: "🤖",
    intro: "Six mechas impériaux patrouillent encore, fidèles à des ordres que plus " +
      "personne n'a donnés. Les rails qu'ils gardent traversent tout le continent. " +
      "Tant qu'ils marchent, personne ne bâtit en paix.",
    brief: "Les patrouilles de l'Empire sont actives et ses rails historiques sont posés. " +
      "Détruisez trois de ces machines — l'étoile du Libérateur vous attend.",
    setup: { bots: 2, difficulty: "normal", map: "v3", empire: true, empireRails: true, structureBonus: "random" },
    goal: {
      label: "Détruire 3 mechas de l'Empire",
      check: (me) => (me.empireKills || 0) >= 3,
    },
    honors: {
      label: "Nettoyage complet : 4 mechas de l'Empire détruits et terminer 1er",
      check: (me, ctx) => (me.empireKills || 0) >= 4 && ctx.rank === 1,
    },
    reward: "plans_original",
  },
  {
    id: "m4", num: 4, act: "Acte II — Les Ordres Fantômes",
    name: "Le Blueprint Perdu",
    icon: "⚡",
    intro: "Dans les ruines de Wardenclyffe, les carnets de Tesla n'ont jamais été " +
      "retrouvés — seulement des fragments, dispersés dans les épaves impériales et " +
      "les mains des voyageurs. L'Usine de la Rouge River sait encore les lire.",
    brief: "Réunissez les fragments (rencontres 🔬 et combats contre l'Empire) SANS " +
      "visiter l'Usine, puis repartez de la Rouge River avec un prototype Tesla. " +
      "Dans cette mission, le prototype pose une étoile.",
    setup: { bots: 2, difficulty: "normal", map: "v3", empire: true, structureBonus: "random", teslaStar: true },
    goal: {
      label: "Terminer la partie en possession d'un prototype Tesla",
      check: (me) => hasTeslaCard(me),
    },
    honors: {
      label: "Le prototype ET la victoire : prototype Tesla en main et 1er au score",
      check: (me, ctx) => hasTeslaCard(me) && ctx.rank === 1,
    },
    reward: "tesla_star",
  },
  {
    id: "m5", num: 5, act: "Acte III — La Chute",
    name: "La Chute de l'Empire",
    icon: "👑",
    intro: "Trois factions marchent sur la Rouge River en même temps que vous, et les " +
      "dernières machines impériales défendent une capitale vide. Le continent aura " +
      "un maître avant l'hiver.",
    brief: "Trois adversaires au meilleur niveau, l'Empire debout, tout le contenu " +
      "débloqué en jeu. Gagnez la partie avec six étoiles au compteur.",
    setup: { bots: 3, difficulty: "difficile", map: "v3", empire: true, empireRails: true, structureBonus: "random" },
    goal: {
      label: "Terminer 1er avec 6 étoiles",
      check: (me, ctx) => ctx.rank === 1 && (me.stars || 0) >= 6,
    },
    honors: {
      label: "Le maître du continent : 1er, 6 étoiles et 4 bâtiments posés",
      check: (me, ctx) => ctx.rank === 1 && (me.stars || 0) >= 6 && buildings(me) >= 4,
    },
    reward: "objectives_original",
  },
];

export const missionById = (id) => CAMPAIGN.find(m => m.id === id) || null;

// Une mission est jouable si la précédente est réussie (la 1re l'est toujours)
export const missionIsOpen = (mission, doneIds) => {
  const idx = CAMPAIGN.findIndex(m => m.id === mission.id);
  if (idx <= 0) return true;
  return doneIds.includes(CAMPAIGN[idx - 1].id);
};
