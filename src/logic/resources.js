import { heldHexes } from '../data/control.js';
// Libellés FR des ressources pour les logs (les CLÉS restent metal/bois/
// nourriture/petrole ; c'est l'affichage qui s'uniformise — avant, « +2 metal »
// côtoyait « +3 nourriture »). Terminologie alignée sur les règles (rules.js).
export const RES_FR = { metal: "métal", bois: "bois", nourriture: "nourriture", petrole: "pétrole", ouvriers: "ouvriers" };
export const resFR = (r) => RES_FR[r] || r;
export const resListFR = (arr) => (arr || []).map(resFR).join(", ");

// ── Ressources DISPONIBLES : celles des territoires qu'on tient ───────────
// Règle du jeu original, mot pour mot : « Vous ne pouvez dépenser que les
// ressources présentes sur les territoires que vous contrôlez. »
// Jusqu'ici on comptait TOUT le tableau `resources`, contrôlé ou non : un
// joueur chassé d'un territoire continuait de dépenser le bois qu'il y avait
// laissé, alors que ce même bois ne lui rapportait aucun point au décompte
// final (qui, lui, filtrait déjà par le contrôle). Le jeu se contredisait
// d'un bout à l'autre de la partie.
//
// C'est aussi LA tension du plateau : un ouvrier seul assis sur dix pétrole
// est une aubaine pour quiconque passe par là — le pillage prend enfin ce
// qu'il promet, et laisser sa production sans garde a un coût immédiat.
//
// `heldHexes(player)` sans contexte : unités + bâtiments/pièges du joueur.
// La contestation par une unité adverse n'est pas évaluée ici (elle exige de
// connaître les autres joueurs) — le décompte final, lui, la prend en compte.
const availableHexes = (player) => heldHexes(player);

/** Ressources d'un type, sur les seuls hex tenus. */
export const countRes = (player, resType) => {
  const held = availableHexes(player);
  let total = 0;
  Object.entries(player.resources).forEach(([hid, r]) => {
    if (r[resType] && held.has(Number(hid))) total += r[resType];
  });
  return total;
};

/** Ressources d'un type posées sur des hex qu'on NE tient PLUS : inutilisables
 *  et invisibles au score, mais toujours sur le plateau — c'est le magot que
 *  l'adversaire vient chercher. Sert à l'affichage (HUD, journal). */
export const strandedRes = (player, resType) => {
  const held = availableHexes(player);
  let total = 0;
  Object.entries(player.resources).forEach(([hid, r]) => {
    if (r[resType] && !held.has(Number(hid))) total += r[resType];
  });
  return total;
};

export const spendRes = (player, resType, qty) => {
  const p = { ...player, resources: {} };
  Object.entries(player.resources).forEach(([hid, r]) => { p.resources[hid] = { ...r }; });
  const held = availableHexes(player);
  let left = qty;
  // On ne dépense QUE sur les hex tenus (même filtre que countRes)
  for (const hid of Object.keys(p.resources).filter(h => held.has(Number(h)))) {
    if (left <= 0) break;
    const avail = p.resources[hid][resType] || 0;
    if (avail > 0) {
      const take = Math.min(avail, left);
      p.resources[hid][resType] -= take;
      if (p.resources[hid][resType] <= 0) delete p.resources[hid][resType];
      if (Object.keys(p.resources[hid]).length === 0) delete p.resources[hid];
      left -= take;
    }
  }
  return p;
};

export const getWorkerHexes = (player) => [...new Set(player.workers.map(w => w.hexId))];

// ── Paiement MIXTE d'un coût (Esprit Sauvage / Vapeur des Lacs) ───────────
// Arbitrage du 01/08 : une faction à ressource alternative (`deployAltRes`)
// peut remplacer AUTANT d'unités qu'elle veut de la ressource primaire par
// l'alternative — donc payer un Deploy à 4 avec 3 métal + 1 bois. Auparavant
// le choix était exclusif (4 métal OU 4 bois) et un joueur à 3+1 se voyait
// refuser l'action, alors que sa capacité est censée l'y autoriser.

/** Le coût est-il payable en mélangeant les deux ressources ? */
export const canPayMixed = (player, resA, resB, qty) =>
  countRes(player, resA) + (resB ? countRes(player, resB) : 0) >= qty;

/** Répartition effective : `first` servie en priorité, le reliquat sur `second`.
 *  Renvoie `{ [res]: n }` — utile pour l'annoncer avant validation. */
export const mixedSplit = (player, first, second, qty) => {
  const a = Math.min(countRes(player, first), qty);
  const b = Math.max(0, qty - a);
  const split = {};
  if (a > 0) split[first] = a;
  if (b > 0 && second) split[second] = b;
  return split;
};

/** Dépense un coût réparti sur deux ressources. Pur (renvoie un nouveau p). */
export const spendMixed = (player, first, second, qty) => {
  const split = mixedSplit(player, first, second, qty);
  return Object.entries(split).reduce((p, [res, n]) => spendRes(p, res, n), player);
};
