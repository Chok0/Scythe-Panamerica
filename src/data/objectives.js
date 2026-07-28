// ═══ OBJECTIFS SECRETS ═══
// Chaque joueur reçoit 2 cartes objectif ; en révéler une accomplie pose une
// étoile (une seule mission révélable par partie, choix du moment).
//
// Philosophie du deck STANDARD (refonte v0.13) : l'ancien deck se validait en
// jouant naturellement (« 2+ bâtiments », « 13 popularité »…). Comme dans le
// jeu original, chaque objectif combine désormais 2-3 conditions dont souvent
// une CONTRAINTE (plafond de pièces, zéro mecha…) : l'étoile se construit.
// Les propositions sont volontairement DIFFÉRENTES du deck original —
// celui-ci est transcrit plus bas (OBJECTIVES_ORIGINAL) et réservé au mode
// campagne (non mélangé aux parties standards).
//
// check(p, ctx) : ctx est optionnel — { players } (liste des joueurs en
// partie) alimente les objectifs relatifs aux adversaires. Sans ctx, ces
// checks restent prudents (pas d'étoile gratuite).
import { hMap, ADJ } from './hexes.js';
import { FACTORY_RR_HEX } from './plans.js';
import { nearEnemyBase, walkDistToBase } from './structureBonus.js';

// ── Helpers ──
// Territoires contrôlés : hex portant une unité OU un bâtiment (hors bases)
const ctrl = (p) => {
  const s = new Set([p.hero, ...p.workers.map(w => w.hexId), ...p.mechs.map(m => m.hexId),
    ...(p.buildings || []).map(b => b.hexId)]);
  return [...s].filter(h => hMap[h] && !hMap[h].base);
};
const ctrlOfTerrain = (p, types) => ctrl(p).filter(h => types.includes(hMap[h].t)).length;
const resOnHex = (p, hid) => p.resources[String(hid)] || {};
const resTotalOnHex = (p, hid) => Object.values(resOnHex(p, hid)).reduce((a, b) => a + b, 0);
const RES_TYPES = ["metal", "bois", "nourriture", "petrole"];
const resByType = (p) => {
  const t = { metal: 0, bois: 0, nourriture: 0, petrole: 0 };
  Object.values(p.resources || {}).forEach(r => Object.entries(r).forEach(([k, v]) => { if (t[k] != null) t[k] += v; }));
  return t;
};

// ── DECK STANDARD — 12 objectifs (2 par joueur, jusqu'à 6 joueurs) ──
export const OBJECTIVES = [
  { id: "n01", name: "Le Gardien de l'Usine", desc: "Avoir une carte d'usine ET un mecha posté sur la Rouge River",
    check: (p) => !!p.factoryCard && p.mechs.some(m => m.hexId === FACTORY_RR_HEX) },
  { id: "n02", name: "Autarcie", desc: "Posséder au moins 2 ressources de CHAQUE type (métal, bois, nourriture, pétrole)",
    check: (p) => { const t = resByType(p); return RES_TYPES.every(r => t[r] >= 2); } },
  { id: "n03", name: "Guerre Éclair", desc: "1 étoile de combat, 2+ mechas déployés et 5 pièces ou moins",
    check: (p) => !!p.starCombat1 && p.mechs.length >= 2 && p.coins <= 5 },
  { id: "n04", name: "Le Prolétariat", desc: "7+ ouvriers, 11+ popularité et AUCUN mecha déployé",
    check: (p) => p.workers.length >= 7 && p.pop >= 11 && p.mechs.length === 0 },
  { id: "n05", name: "La Flotte des Lacs", desc: "Contrôler 3 territoires adjacents à un lac",
    check: (p) => ctrl(p).filter(h => (ADJ[h] || []).some(a => hMap[a]?.t === "lac")).length >= 3 },
  { id: "n06", name: "Doctrine de Fer", desc: "10+ puissance, 2+ améliorations et AUCUNE étoile de combat (dissuader sans frapper)",
    check: (p) => p.power >= 10 && (p.upgrades || 0) >= 2 && !p.starCombat1 },
  { id: "n07", name: "La Diagonale", desc: "Contrôler des territoires sur 4 types de terrains différents",
    check: (p) => new Set(ctrl(p).map(h => hMap[h].t)).size >= 4 },
  { id: "n08", name: "L'Émissaire", desc: "Votre héros adjacent à une base ADVERSE et 10+ popularité",
    check: (p, ctx) => p.pop >= 10 && nearEnemyBase(p.hero, p, ctx?.players) },
  { id: "n09", name: "Le Magnat", desc: "12+ pièces et 3+ bâtiments construits",
    check: (p) => p.coins >= 12 && (p.buildings || []).length >= 3 },
  { id: "n10", name: "La Ruée aux Reliques", desc: "3+ rencontres résolues et 1+ Fragment Tesla en réserve",
    check: (p) => (p.encounters || 0) >= 3 && (p.fragments || 0) >= 1 },
  { id: "n11", name: "Place Forte", desc: "Un même territoire portant un de vos bâtiments, un mecha et 2+ ressources",
    check: (p) => (p.buildings || []).some(b => p.mechs.some(m => m.hexId === b.hexId) && resTotalOnHex(p, b.hexId) >= 2) },
  { id: "n12", name: "Les Estafettes", desc: "2 ouvriers chacun à 4+ hex de marche de votre base",
    check: (p) => p.workers.filter(w => walkDistToBase(w.hexId, p) >= 4).length >= 2 },
];

// ── DECK ORIGINAL — les 21 objectifs du Scythe de base, à l'identique.
// RÉSERVÉ AU MODE CAMPAGNE : non mélangé au deck standard (déblocage prévu).
// « Faire fuir un ouvrier » : compteur p.scaredWorkers (déplacements qui
// renvoient des ouvriers ennemis seuls à leur base, hors combats).
export const OBJECTIVES_ORIGINAL = [
  { id: "o01", name: "Bâtir sans Bruit", desc: "3 bâtiments, moins de 7 popularité et 0 mecha",
    check: (p) => (p.buildings || []).length >= 3 && p.pop < 7 && p.mechs.length === 0 },
  { id: "o02", name: "L'Intimidation", desc: "7+ puissance et avoir fait fuir au moins 1 ouvrier ennemi (déplacement, hors combat)",
    check: (p) => p.power >= 7 && (p.scaredWorkers || 0) >= 1 },
  { id: "o03", name: "La Main Pleine", desc: "1 étoile de combat et 8+ cartes de combat en main",
    check: (p) => !!p.starCombat1 && (p.combatCards || 0) >= 8 },
  { id: "o04", name: "L'Usine d'Abord", desc: "1 carte d'usine, 1+ mecha et 3 ouvriers maximum",
    check: (p) => !!p.factoryCard && p.mechs.length >= 1 && p.workers.length <= 3 },
  { id: "o05", name: "Les Bûcherons", desc: "Contrôler 3 forêts",
    check: (p) => ctrlOfTerrain(p, ["foret"]) >= 3 },
  { id: "o06", name: "Le Grand Entrepôt", desc: "Contrôler 1 territoire portant 9+ ressources, dont au moins 1 de chaque type",
    check: (p) => ctrl(p).some(h => { const r = resOnHex(p, h); return resTotalOnHex(p, h) >= 9 && RES_TYPES.every(t => (r[t] || 0) >= 1); }) },
  { id: "o07", name: "L'Or Noir", desc: "Contrôler 3 sites de production de pétrole (toundra ou désert)",
    check: (p) => ctrlOfTerrain(p, ["toundra", "desert"]) >= 3 },
  { id: "o08", name: "Le Monopole", desc: "Posséder 9+ ressources identiques",
    check: (p) => { const t = resByType(p); return RES_TYPES.some(r => t[r] >= 9); } },
  { id: "o09", name: "La Charité du Peuple", desc: "2 pièces ou moins, 4+ ouvriers et 7+ popularité",
    check: (p) => p.coins <= 2 && p.workers.length >= 4 && p.pop >= 7 },
  { id: "o10", name: "Le Désarmement", desc: "0 puissance, 13+ popularité et 5+ ouvriers",
    check: (p) => p.power === 0 && p.pop >= 13 && p.workers.length >= 5 },
  { id: "o11", name: "L'Équilibre Social", desc: "Autant d'ouvriers que de recrues (au moins 2 de chaque)",
    check: (p) => p.workers.length >= 2 && p.workers.length === (p.recruits || 0) },
  { id: "o12", name: "Les Bourgmestres", desc: "Contrôler 3 villages",
    check: (p) => ctrlOfTerrain(p, ["village"]) >= 3 },
  { id: "o13", name: "La Fortune", desc: "Avoir 20+ pièces",
    check: (p) => p.coins >= 20 },
  { id: "o14", name: "Le Généraliste", desc: "1+ amélioration, 1+ mecha, 1+ bâtiment, 1+ recrue et 1 ressource de chaque type",
    check: (p) => (p.upgrades || 0) >= 1 && p.mechs.length >= 1 && (p.buildings || []).length >= 1
      && (p.recruits || 0) >= 1 && (() => { const t = resByType(p); return RES_TYPES.every(r => t[r] >= 1); })() },
  { id: "o15", name: "Le Pur Produit", desc: "1 carte d'usine et 0 amélioration",
    check: (p) => !!p.factoryCard && (p.upgrades || 0) === 0 },
  { id: "o16", name: "Le Rassemblement", desc: "6+ unités et pièces sur un même territoire (héros, mechas, ouvriers, bâtiment)",
    check: (p) => ctrl(p).some(h =>
      (p.hero === h ? 1 : 0) + p.mechs.filter(m => m.hexId === h).length
      + p.workers.filter(w => w.hexId === h).length
      + ((p.buildings || []).some(b => b.hexId === h) ? 1 : 0) >= 6) },
  { id: "o17", name: "Le Relais Parfait", desc: "Contrôler 1 territoire avec EXACTEMENT 1 ouvrier, 1 mecha et 5 ressources",
    check: (p) => ctrl(p).some(h =>
      p.workers.filter(w => w.hexId === h).length === 1
      && p.mechs.filter(m => m.hexId === h).length === 1
      && resTotalOnHex(p, h) === 5) },
  { id: "o18", name: "Le Siège de l'Usine", desc: "AUCUNE carte d'usine mais contrôler 2 territoires adjacents à l'Usine",
    check: (p) => !p.factoryCard && ctrl(p).filter(h => (ADJ[h] || []).includes(FACTORY_RR_HEX)).length >= 2 },
  { id: "o19", name: "Les Moissonneurs", desc: "Contrôler 3 fermes (champs)",
    check: (p) => ctrlOfTerrain(p, ["champs"]) >= 3 },
  { id: "o20", name: "Le Trône de la Rouge River", desc: "Contrôler l'Usine et avoir la plus grande puissance (égalité acceptée)",
    check: (p, ctx) => {
      if (!ctrl(p).includes(FACTORY_RR_HEX)) return false;
      const opps = (ctx?.players || []).filter(o => o.faction !== p.faction);
      if (opps.length === 0) return false; // sans contexte adverse, pas d'étoile gratuite
      return opps.every(o => (o.power || 0) <= p.power);
    } },
  { id: "o21", name: "Les Hauteurs", desc: "Contrôler 3 montagnes (montagne ou sierra)",
    check: (p) => ctrlOfTerrain(p, ["montagne", "sierra"]) >= 3 },
];

// Toutes les cartes (réhydratation des sauvegardes par id, campagne incluse)
export const ALL_OBJECTIVES = [...OBJECTIVES, ...OBJECTIVES_ORIGINAL];
