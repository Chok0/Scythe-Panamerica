// ═══ Logique des cartes d'usine (Rouge River) — partagée UI joueur + bots ═══
// La carte d'usine est une 5e colonne d'action : HAUT = 1 coût + 1 gain,
// BAS = déplacer 1 unité de 2 hex (+1 si Vitesse). Voir data/plans.js.
import { MATS, maxBottomCubes, ENLIST_ONGOING, BUILDING_TYPES } from '../data/mats.js';
import { TERRAINS } from '../data/terrains.js';
import { hMap } from '../data/hexes.js';
import { getWorkerHexes } from './resources.js';
import { spendLowCards } from './cards.js';
import { shuffleArray } from './hexMath.js';

// ── Offre de l'Usine : (nb joueurs + 1) cartes tirées au hasard du deck ──
export const drawFactoryOffer = (deck, count) =>
  shuffleArray(deck).slice(0, Math.min(deck.length, Math.max(1, count)));

// ── Coût du HAUT : payable sur les pistes (pièces/puissance/pop/cartes) ──
const trackValue = (p, res) =>
  res === "coins" ? p.coins : res === "power" ? p.power : res === "pop" ? p.pop : (p.combatCards || 0);

export const canPayFactoryCost = (p, card) =>
  !!card && card.cost.every(c => trackValue(p, c.res) >= c.qty);

// Mute p (copie de l'appelant). Les cartes de combat dépensées sont les plus
// FAIBLES de la main (dépense hors combat).
export const payFactoryCost = (p, card) => {
  card.cost.forEach(c => {
    if (c.res === "coins") p.coins -= c.qty;
    else if (c.res === "power") p.power = Math.max(0, p.power - c.qty);
    else if (c.res === "pop") p.pop = Math.max(0, p.pop - c.qty);
    else spendLowCards(p, c.qty);
  });
};

// ── Hex ouvriers « sur le plateau » (hors bases) : cibles des gains physiques ──
export const factoryWorkerHexes = (p) =>
  getWorkerHexes(p).filter(h => hMap[h] && !hMap[h].base);

// Hex ouvriers PRODUCTIFS (terrain à ressource) — cibles de produce2
export const factoryProduceHexes = (p) =>
  factoryWorkerHexes(p).filter(h => !!TERRAINS[hMap[h]?.t]?.res);

// ── Un effet de gain est-il résoluble dans l'état actuel du joueur ? ──
// (les gains impossibles sont passés : « si ouvrier » sans ouvrier, piste maxée…)
export const factoryEffectPossible = (p, eff) => {
  const mat = MATS.find(m => m.id === p.matId);
  switch (eff.type) {
    case "coins": case "power": case "pop": case "cards":
      return true;
    case "upgrade":
      return (p.upgrades || 0) < 6
        && (p.cubesOnTop || []).some(c => c > 0)
        && !!mat && (mat.bottomSlots || []).some((s, i) => ((p.cubesOnBottom || [])[i] || 0) < maxBottomCubes(mat, i));
    case "enlist":
      return (p.recruits || 0) < 4
        && (p.enlistMap || []).some(r => r == null)
        && ENLIST_ONGOING.some((_, ri) => !(p.enlistMap || []).includes(ri));
    case "building":
      return (p.buildings || []).length < 4
        && BUILDING_TYPES.some(bt => !(p.buildings || []).some(b => b.type === bt.type))
        && factoryWorkerHexes(p).some(h => !(p.buildings || []).some(b => b.hexId === h));
    case "mech":
      return p.mechs.length < 4 && factoryWorkerHexes(p).length > 0;
    case "produce2":
      return factoryProduceHexes(p).length > 0;
    case "resources":
      return factoryWorkerHexes(p).length > 0;
    case "choice":
      return eff.options.some(o => factoryEffectPossible(p, o));
    default:
      return false;
  }
};

// Hex d'atterrissage des ressources gagnées : un hex ouvrier GARDÉ par le
// héros ou un mecha si possible (protection anti-raid), sinon le premier.
export const factoryResourceHex = (p) => {
  const hexes = factoryWorkerHexes(p);
  if (hexes.length === 0) return null;
  const guards = new Set([p.hero, ...p.mechs.map(m => m.hexId)]);
  return hexes.find(h => guards.has(h)) ?? hexes[0];
};
