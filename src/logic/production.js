import { matById } from '../data/mats.js';

// ── Coût croissant de Produire (règle Scythe) ─────────────────────────────
// Le coût n'est PAS attaché au nombre d'ouvriers possédés : il est IMPRIMÉ
// sur le plateau joueur, sous les cases de la piste des ouvriers. Chaque
// ouvrier SORTI libère sa case et révèle le coût qui dort dessous. Sur les
// plateaux standard (départ à 2 ouvriers, 6 à sortir) : ⚡ sous la 2e case,
// ♥ sous la 4e, 💰 sous la 6e —
//   2-3 ouvriers : gratuit          (0-1 sorti)
//   4-5 ouvriers : 1 Puissance      (2-3 sortis)
//   6-7 ouvriers : + 1 Popularité   (4-5 sortis)
//   8   ouvriers : + 1 Pièce        (6 sortis)
//
// La distinction « possédés » vs « SORTIS » n'était pas neutre : la formule
// lisait le total absolu (`nWorkers >= 4`), ce qui convenait tant que tout le
// monde démarrait à 2. « Le Réseau » (Internationale Noire) démarre à QUATRE
// ouvriers, un par base — et payait donc 1⚡ à chaque Produire dès le tour 1,
// sur la trésorerie la plus basse du jeu (3$). Partie du 11/08 : plus d'argent
// pour Soutien ni Commerce, donc plus de puissance, donc plus de production —
// la seule sortie restante était Déplacer/+1$, un tour sur deux.
// La piste vit désormais sur le PLATEAU (`produceStart` / `produceCosts`),
// comme sur le carton : elle se lit, elle se règle, et aucune faction ne subit
// une règle écrite pour le départ d'une autre.
export const DEFAULT_PRODUCE_START = 2;
export const DEFAULT_PRODUCE_COSTS = { 1: "pui", 3: "pop", 5: "coins" };
/** Nombre maximum d'ouvriers, toutes factions confondues. */
export const MAX_WORKERS = 8;

/** Piste des ouvriers d'un plateau : départ, coûts imprimés, nombre de cases. */
export const produceTrackOf = (mat) => {
  const start = mat?.produceStart ?? DEFAULT_PRODUCE_START;
  return { start, costs: mat?.produceCosts ?? DEFAULT_PRODUCE_COSTS, slots: MAX_WORKERS - start };
};

/** Coût de Produire : somme des coûts imprimés sous les cases LIBÉRÉES. */
export const getProduceCost = (nWorkers, mat) => {
  const { start, costs, slots } = produceTrackOf(mat);
  const freed = Math.max(0, Math.min(slots, nWorkers - start));
  const c = { pui: 0, pop: 0, coins: 0 };
  for (let k = 0; k < freed; k++) { const r = costs[k]; if (r) c[r] += 1; }
  return c;
};

/** Coût pour CE joueur — son plateau porte sa piste. */
export const produceCostOf = (player) => getProduceCost(player.workers.length, matById(player.matId));

export const canPayProduce = (player) => {
  const c = produceCostOf(player);
  return player.power >= c.pui && player.pop >= c.pop && player.coins >= c.coins;
};

export const payProduce = (player) => {
  const c = produceCostOf(player);
  player.power -= c.pui;
  player.pop -= c.pop;
  player.coins -= c.coins;
};

export const produceCostLabel = (nWorkers, mat) => {
  const c = getProduceCost(nWorkers, mat);
  if (c.pui === 0 && c.pop === 0 && c.coins === 0) return "Gratuit";
  const parts = [];
  if (c.pui) parts.push(`${c.pui} Pui`);
  if (c.pop) parts.push(`${c.pop} Pop`);
  if (c.coins) parts.push(`${c.coins}$`);
  return parts.join(" + ");
};
