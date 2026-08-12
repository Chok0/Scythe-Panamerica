// ═══ ATELIER — GÉNÉRATEUR DE PLATEAUX JOUEUR INÉDITS ═══
// Les 13 plateaux du jeu (6 Panamerica + 7 originaux) ne sont pas des objets
// libres : ils obéissent tous à la MÊME grammaire, vérifiée par les tests
// (logic/__tests__/mats.test.js). Cette grammaire décrit un espace fini de
// configurations — dont les 13 plateaux publiés ne sont qu'un échantillon
// minuscule. L'atelier tire dans le RESTE de cet espace : chaque plateau
// forgé est structurellement valide (mêmes invariants, donc jouable tel quel)
// et n'a encore jamais été publié.
//
// La grammaire, article par article :
//   1. rangée HAUT — une permutation des 4 actions ; le nombre de cubes est
//      dicté par l'ACTION, pas par la position (Déplacer 2, Soutien 2,
//      Commerce 1, Produire 1) → 6 cubes, toujours ;
//   2. coûts du BAS — 4 bases dans [2,4], Σ = 13 (le rythme du jeu original),
//      dans l'ordre IMPOSÉ Améliorer/pétrole · Déployer/métal ·
//      Construire/bois · Enrôler/nourriture (seule la rangée du haut bouge
//      d'un plateau à l'autre) ;
//   3. bonus $ du bas — 4 valeurs dans [0,3], Σ = 6$ pile ;
//   4. cases d'amélioration — Σ = 6 (l'étoile des 6 Améliorations), chaque
//      colonne plafonnée à (base − 1) : un coût ne descend jamais sous 1 ;
//   5. départ ♥/$ — l'un des 7 échelons du jeu original (2♥4$ → 4♥7$), qui
//      forment l'échelle pauvre→riche du plateau.
//
// Ce que l'atelier NE touche pas : la piste des ouvriers (produceStart /
// produceCosts), propre aux plateaux de campagne, et les capacités de
// faction — un plateau reste un plateau, jouable par n'importe qui.
import { ALL_MATS } from './mats.js';

/** Ordre imposé des ressources du bas — jamais permuté (article 2). */
export const BOTTOM_RES = ["petrole", "metal", "bois", "nourriture"];

/** Cubes de la rangée du haut, dictés par l'action (article 1). */
export const TOP_CUBES_BY_ACTION = { Move: 2, Bolster: 2, Trade: 1, Produce: 1 };

/** Les 7 échelons de départ du jeu original, dans l'ordre pauvre→riche des
 *  plateaux 1 à 7 (Industrie 2♥4$ … Militant 3♥4$). Le couple ♥/$ n'est pas
 *  libre : c'est lui qui compense la puissance du reste du plateau. */
export const WEALTH_TIERS = [
  { pop: 2, coins: 4 }, { pop: 2, coins: 5 }, { pop: 2, coins: 6 },
  { pop: 3, coins: 6 }, { pop: 4, coins: 7 }, { pop: 3, coins: 5 },
  { pop: 3, coins: 4 },
];

// ── Énumération de l'espace ───────────────────────────────────────────────
const permute = (xs) => xs.length <= 1 ? [xs]
  : xs.flatMap((x, i) => permute([...xs.slice(0, i), ...xs.slice(i + 1)]).map(p => [x, ...p]));

/** Tous les vecteurs d'entiers respectant des bornes par case et une somme. */
const vectors = (bounds, sum) => {
  const out = [];
  const walk = (i, rest, acc) => {
    if (i === bounds.length) { if (rest === 0) out.push(acc); return; }
    const [lo, hi] = bounds[i];
    for (let v = lo; v <= Math.min(hi, rest); v++) walk(i + 1, rest - v, [...acc, v]);
  };
  walk(0, sum, []);
  return out;
};

/** 24 ordres possibles de la rangée du haut. */
export const TOP_ORDERS = permute(["Move", "Bolster", "Trade", "Produce"]);
/** 16 répartitions de coûts (bases 2-4, Σ13). */
export const BASE_COMBOS = vectors([[2, 4], [2, 4], [2, 4], [2, 4]], 13);
/** 44 répartitions de bonus $ (0-3, Σ6). */
export const BONUS_COMBOS = vectors([[0, 3], [0, 3], [0, 3], [0, 3]], 6);

/** Cases d'amélioration compatibles avec CES coûts : Σ6, aucune colonne
 *  au-delà de (base − 1). Le nombre dépend donc des coûts (17 combinaisons
 *  quand aucun coût ne vaut 2, 15 sinon). */
export const slotCombos = (bases) => vectors(bases.map(b => [0, b - 1]), 6);

/** Les 248 couples (coûts, cases) valides — tirer dans cette liste plutôt que
 *  dans les coûts puis les cases garantit un tirage UNIFORME sur l'espace :
 *  un jeu de coûts à 17 dispositions n'est pas aussi probable qu'un jeu à 15. */
export const BASE_SLOT_PAIRS = BASE_COMBOS.flatMap(bases =>
  slotCombos(bases).map(slots => ({ bases, slots })));

/** Le compte : 24 × 7 × 44 × 248 = 1 833 216 plateaux structurellement
 *  distincts. `published` = ceux qui existent déjà (donc exclus du tirage),
 *  `remaining` = ce qui reste à explorer. */
export const MAT_SPACE = {
  topOrders: TOP_ORDERS.length,
  wealth: WEALTH_TIERS.length,
  bases: BASE_COMBOS.length,
  bonuses: BONUS_COMBOS.length,
  baseSlotPairs: BASE_SLOT_PAIRS.length,
  total: TOP_ORDERS.length * WEALTH_TIERS.length * BONUS_COMBOS.length * BASE_SLOT_PAIRS.length,
};

// ── Signature : l'identité STRUCTURELLE d'un plateau ──────────────────────
// Deux plateaux de même signature se jouent exactement pareil (seul le nom
// change) — c'est elle qui sert à ne jamais reforger du déjà-vu. Les cases
// d'amélioration sont ramenées à leur capacité UTILE (min(case, base − 1)) :
// une case au-delà du plafond ne réduit rien, elle ne distingue pas deux
// plateaux.
export const matSignature = (m) => {
  const bases = (m?.bottomCosts || []).map(bc => bc.base);
  const bonus = (m?.bottomCosts || []).map(bc => bc.bonus || 0);
  const slots = (m?.bottomSlots || []).map((s, i) => Math.min(s, (bases[i] ?? 1) - 1));
  return [(m?.topRow || []).join(">"), bases.join(""), bonus.join(""), slots.join(""), `${m?.pop}/${m?.coins}`].join("|");
};

const sameVec = (a, b) => a.length === b.length && a.every((v, i) => v === b[i]);

/** Ce plateau appartient-il à l'espace décrit par la grammaire ? Sert autant
 *  au test (les 13 plateaux publiés doivent y être : sinon l'atelier ne parle
 *  pas la même langue que le jeu) qu'au filtrage d'une sauvegarde relue. */
export const inMatSpace = (m) => {
  if (!m || !Array.isArray(m.topRow) || !Array.isArray(m.bottomCosts) || !Array.isArray(m.bottomSlots) || !Array.isArray(m.topCubes)) return false;
  if (m.bottomCosts.length !== 4 || m.bottomSlots.length !== 4 || m.topRow.length !== 4 || m.topCubes.length !== 4) return false;
  if (!m.bottomCosts.every((bc, i) => bc?.res === BOTTOM_RES[i])) return false;
  const bases = m.bottomCosts.map(bc => bc.base);
  const bonus = m.bottomCosts.map(bc => bc.bonus || 0);
  const slots = m.bottomSlots.map((s, i) => Math.min(s, bases[i] - 1));
  return TOP_ORDERS.some(o => sameVec(o, m.topRow))
    && WEALTH_TIERS.some(w => w.pop === m.pop && w.coins === m.coins)
    && BASE_COMBOS.some(b => sameVec(b, bases))
    && BONUS_COMBOS.some(b => sameVec(b, bonus))
    && slotCombos(bases).some(s => sameVec(s, slots))
    && m.topCubes.every((c, i) => c === TOP_CUBES_BY_ACTION[m.topRow[i]]);
};

/** Les plateaux DÉJÀ PUBLIÉS qui vivent dans cet espace — tous sauf « Le
 *  Réseau », dont le départ 4♥/3$ et la piste d'ouvriers à 4 cases sortent
 *  volontairement de la grammaire standard (plateau de campagne dédié). */
export const PUBLISHED_IN_SPACE = ALL_MATS.filter(inMatSpace);
/** Signatures interdites au tirage : TOUS les plateaux publiés. */
export const PUBLISHED_SIGNATURES = new Set(ALL_MATS.map(matSignature));

/** Ce qui reste à explorer une fois le déjà-publié retiré : 1 833 203. */
export const UNEXPLORED = MAT_SPACE.total - PUBLISHED_IN_SPACE.length;

// ── Noms ──────────────────────────────────────────────────────────────────
// Un plateau sans nom ne se retient pas et ne se discute pas. Le NOM est tiré
// de la colonne la moins chère — la vocation réelle du plateau, ce pour quoi
// on le choisira — et le complément situe l'atelier quelque part sur le
// continent : « Fonderie du Delta » se lit comme un plateau du jeu, pas comme
// un identifiant.
// L'emblème est celui de l'action fondatrice (mêmes pictos que le reste de
// l'UI, rendus en SVG par `Glyph`) — un plateau d'atelier s'identifie d'un
// coup d'œil à ce pour quoi il est bon.
const VOCATION_NAMES = {
  Upgrade: { icon: "⬆", nouns: ["Laboratoire", "Institut", "Académie", "Bureau d'Études", "Observatoire"] },
  Deploy: { icon: "⬡", nouns: ["Arsenal", "Fonderie", "Garnison", "Aciérie", "Bastion"] },
  Build: { icon: "🏗", nouns: ["Chantier", "Scierie", "Comptoir", "Coopérative", "Manufacture"] },
  Enlist: { icon: "🤝", nouns: ["Syndicat", "Fraternité", "Ligue", "Commune", "Confrérie"] },
};
const PLACES = [
  "du Rail", "d'Acier", "du Delta", "des Prairies", "du Bayou", "de la Cordillère",
  "des Grands Lacs", "du Pacifique", "de l'Isthme", "des Andes", "du Rio Grande",
  "de la Sierra", "des Plaines", "de la Vapeur", "du Charbon", "des Mesas",
  "du Yukon", "de la Pampa", "des Caraïbes", "de la Frontière", "du Nord",
  "du Sud", "de l'Ouest", "des Hauts-Plateaux", "du Golfe", "de la Toundra",
];

const pick = (arr, rng) => arr[Math.floor(rng() * arr.length)];

/** Colonne du bas la moins chère (à égalité : la mieux dotée en cases
 *  d'amélioration, puis en bonus $) — la vocation du plateau. */
export const vocationCol = (mat) => {
  const cols = (mat.bottomCosts || []).map((bc, i) => ({ i, base: bc.base, slots: (mat.bottomSlots || [])[i] || 0, bonus: bc.bonus || 0 }));
  cols.sort((a, b) => a.base - b.base || b.slots - a.slots || b.bonus - a.bonus || a.i - b.i);
  return cols[0]?.i ?? 0;
};

const BOTTOM_ACTIONS = ["Upgrade", "Deploy", "Build", "Enlist"];

/** Nom + emblème d'un plateau forgé, en évitant les noms déjà pris. */
export const forgeName = (mat, taken = new Set(), rng = Math.random) => {
  const vocation = VOCATION_NAMES[BOTTOM_ACTIONS[vocationCol(mat)]];
  for (let i = 0; i < 60; i++) {
    const name = `${pick(vocation.nouns, rng)} ${pick(PLACES, rng)}`;
    if (!taken.has(name)) return { name, icon: vocation.icon };
  }
  // Toutes les combinaisons de ce registre sont prises : on numérote plutôt
  // que de rendre un doublon silencieux.
  const base = `${pick(vocation.nouns, rng)} ${pick(PLACES, rng)}`;
  let n = 2;
  while (taken.has(`${base} ${n}`)) n++;
  return { name: `${base} ${n}`, icon: vocation.icon };
};

// ── Tirage ────────────────────────────────────────────────────────────────
/** Première case d'id des plateaux d'atelier — au-dessus des originaux (101+)
 *  et du plateau de campagne (200), pour qu'aucune sauvegarde ne confonde. */
export const WORKSHOP_ID_BASE = 900;

/** Une configuration tirée uniformément dans l'espace (sans nom ni id). */
export const drawConfig = (rng = Math.random) => {
  const topRow = pick(TOP_ORDERS, rng);
  const { bases, slots } = pick(BASE_SLOT_PAIRS, rng);
  const bonuses = pick(BONUS_COMBOS, rng);
  const { pop, coins } = pick(WEALTH_TIERS, rng);
  return {
    pop, coins, topRow: [...topRow],
    topCubes: topRow.map(a => TOP_CUBES_BY_ACTION[a]),
    bottomSlots: [...slots],
    bottomCosts: BOTTOM_RES.map((res, i) => ({ res, base: bases[i], bonus: bonuses[i] })),
  };
};

/** Forge un plateau INÉDIT : ni l'un des 14 publiés, ni l'un de ceux déjà
 *  forgés (`existing`). L'espace étant 140 000 fois plus grand que tout ce
 *  qu'une session peut produire, le rejet ne coûte rien en pratique — la
 *  boucle est bornée par prudence, pas par nécessité. */
export const forgeMat = (existing = [], rng = Math.random) => {
  const seen = new Set([...PUBLISHED_SIGNATURES, ...existing.map(matSignature)]);
  const takenNames = new Set([...ALL_MATS.map(m => m.name), ...existing.map(m => m.name)]);
  let cfg = null;
  for (let i = 0; i < 500 && !cfg; i++) {
    const c = drawConfig(rng);
    if (!seen.has(matSignature(c))) cfg = c;
  }
  if (!cfg) return null; // espace épuisé : inatteignable en pratique
  const { name, icon } = forgeName(cfg, takenNames, rng);
  const nextId = existing.reduce((max, m) => Math.max(max, m.id), WORKSHOP_ID_BASE - 1) + 1;
  return { id: nextId, name, icon, workshop: true, ...cfg };
};

// ── Lecture d'un plateau : ce qu'il raconte ───────────────────────────────
const RES_ICON = { petrole: "🛢", metal: "⚙", bois: "🪵", nourriture: "🌽" };
const FR_BOTTOM = ["Améliorer", "Déployer", "Construire", "Enrôler"];
const FR_TOP_LABEL = { Move: "Déplacer", Bolster: "Soutien", Trade: "Commerce", Produce: "Produire" };

/** Traits saillants d'un plateau, prêts à afficher : sa vocation, son gros
 *  investissement, sa meilleure paye, son ouverture. Un plateau généré doit
 *  se LIRE aussi vite qu'un plateau écrit à la main — sinon l'atelier ne
 *  produit que du bruit. */
export const matTraits = (mat) => {
  const cols = (mat.bottomCosts || []).map((bc, i) => ({ i, ...bc, slots: (mat.bottomSlots || [])[i] || 0 }));
  const voc = cols[vocationCol(mat)];
  const dear = [...cols].sort((a, b) => b.base - a.base || a.bonus - b.bonus || a.i - b.i)[0];
  const rich = [...cols].sort((a, b) => b.bonus - a.bonus || a.base - b.base || a.i - b.i)[0];
  const tier = WEALTH_TIERS.findIndex(w => w.pop === mat.pop && w.coins === mat.coins);
  const out = [
    { label: "Vocation", text: `${FR_BOTTOM[voc.i]} à ${voc.base}${RES_ICON[voc.res]}${voc.slots > 0 ? ` (réductible à ${Math.max(1, voc.base - voc.slots)})` : " — non réductible"}` },
    { label: "Investissement", text: `${FR_BOTTOM[dear.i]} à ${dear.base}${RES_ICON[dear.res]}${dear.bonus > 0 ? ` mais +${dear.bonus}$` : ", sans le moindre $"}` },
    { label: "Trésorerie", text: rich.bonus > 0 ? `${FR_BOTTOM[rich.i]} paie le mieux (+${rich.bonus}$)` : "aucune colonne ne paie" },
    { label: "Ouverture", text: `${FR_TOP_LABEL[mat.topRow[0]] || mat.topRow[0]} en tête de rangée` },
    { label: "Départ", text: `${mat.pop}♥ / ${mat.coins}$${tier >= 0 ? ` — échelon ${tier + 1}/7` : ""}` },
  ];
  return out;
};

/** Le plateau en JSON prêt à coller dans data/mats.js — l'atelier sert aussi
 *  à ÉCRIRE le jeu : un plateau qui tourne bien en partie doit pouvoir passer
 *  de l'atelier au fichier source sans ressaisie. */
export const matSource = (mat) => {
  const costs = mat.bottomCosts.map(bc => `{ res: "${bc.res}", base: ${bc.base}, bonus: ${bc.bonus} }`).join(", ");
  return `{ id: ${mat.id}, name: ${JSON.stringify(mat.name)}, pop: ${mat.pop}, coins: ${mat.coins}, topRow: ${JSON.stringify(mat.topRow)},\n  topCubes: ${JSON.stringify(mat.topCubes)}, bottomSlots: ${JSON.stringify(mat.bottomSlots)},\n  bottomCosts: [${costs}] },`;
};
