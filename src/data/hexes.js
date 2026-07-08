// Carte du jeu — supporte le chargement dynamique (cartes procédurales).
// Les exports HEXES/RIVERS/hMap/ADJ/RSET sont des bindings ES vivants :
// loadMap() les réassigne et TOUTE la logique (mouvement, bots, scoring…)
// voit la nouvelle carte sans autre changement.

// ── Géométrie fixe : 43 hexagones (ids et coordonnées immuables) ──
const DEFAULT_HEXES = [
  { id: 0, rx: 265, ry: 103, t: "toundra" }, { id: 1, rx: 501, ry: 103, t: "montagne" }, { id: 2, rx: 737, ry: 103, t: "toundra" },
  { id: 3, rx: 146, ry: 171, t: "marecage" }, { id: 4, rx: 382, ry: 171, t: "village" }, { id: 5, rx: 618, ry: 171, t: "lac" }, { id: 6, rx: 855, ry: 171, t: "plaine" },
  { id: 7, rx: 265, ry: 240, t: "plaine" }, { id: 8, rx: 501, ry: 240, t: "toundra" }, { id: 9, rx: 737, ry: 240, t: "foret" },
  { id: 10, rx: 146, ry: 308, t: "foret" }, { id: 11, rx: 382, ry: 308, t: "foret" }, { id: 12, rx: 618, ry: 308, t: "village" }, { id: 13, rx: 855, ry: 308, t: "lac" },
  { id: 14, rx: 265, ry: 376, t: "village" }, { id: 15, rx: 501, ry: 376, t: "montagne" }, { id: 16, rx: 737, ry: 376, t: "champs" },
  { id: 17, rx: 146, ry: 445, t: "plaine" }, { id: 18, rx: 382, ry: 445, t: "lac" }, { id: 19, rx: 618, ry: 445, t: "lac" }, { id: 20, rx: 855, ry: 445, t: "marecage" },
  { id: 21, rx: 265, ry: 513, t: "montagne" }, { id: 22, rx: 501, ry: 513, t: "factory" }, { id: 23, rx: 737, ry: 513, t: "desert" },
  { id: 25, rx: 146, ry: 581, t: "marecage" }, { id: 26, rx: 382, ry: 581, t: "plaine" }, { id: 27, rx: 618, ry: 581, t: "village" }, { id: 28, rx: 855, ry: 581, t: "foret" },
  { id: 29, rx: 265, ry: 650, t: "foret" }, { id: 30, rx: 501, ry: 650, t: "champs" }, { id: 31, rx: 737, ry: 650, t: "montagne" },
  { id: 32, rx: 146, ry: 718, t: "sierra" }, { id: 33, rx: 382, ry: 718, t: "lac" }, { id: 34, rx: 618, ry: 718, t: "foret" }, { id: 35, rx: 855, ry: 718, t: "village" },
  { id: 36, rx: 265, ry: 786, t: "village" }, { id: 37, rx: 501, ry: 786, t: "desert" }, { id: 38, rx: 737, ry: 786, t: "sierra" },
  { id: 40, rx: 382, ry: 855, t: "desert" }, { id: 41, rx: 618, ry: 855, t: "champs" }, { id: 45, rx: 737, ry: 923, t: "sierra" },
  { id: 46, rx: 500, ry: 923, t: "village" }, { id: 47, rx: 855, ry: 855, t: "lac" },
];

// v2 « carte physique » : péninsules de départ pour TOUTES les factions
// (retouches mesurées par simulation — voir RAPPORT_SIMULATION.md) :
//   - [9,12] ajoutée → l'Acadiane démarre en péninsule {2,6,9} à 3 ressources
//     (toundra/plaine/forêt, façon Nordiques de l'original) au lieu d'un
//     « îlot » de 19 hexes qui lui offrait la moitié du plateau dès le tour 1
//   - hex 31 marécage→montagne, [31,35] retirée, [27,31]+[31,34] ajoutées →
//     le Bayou démarre en péninsule {35,28,31} village+bois+MÉTAL (il n'avait
//     que 2 hexes et une seule ressource)
const DEFAULT_RIVERS = [
  [0, 3], [0, 7], [4, 7], [4, 8], [3, 10], [7, 10], [17, 21], [17, 25],
  [23, 28], [23, 31], [27, 31], [31, 34], [31, 38], [35, 38], [38, 45], [7, 14], [14, 21],
  [25, 32], [25, 29], [21, 29], [26, 29], [29, 33], [33, 36], [36, 40], [40, 46],
  [37, 41], [37, 46], [38, 41], [34, 41], [20, 23], [16, 20], [9, 16], [9, 12],
  [1, 8], [4, 11], [11, 14], [14, 18], [1, 5], [22, 26], [28, 31], [6, 13],
];

// Carte v1 d'origine (avant retouches) — conservée pour les A/B du simulateur
export const LEGACY_RIVERS = [
  [0, 3], [0, 7], [4, 7], [4, 8], [3, 10], [7, 10], [17, 21], [17, 25],
  [23, 28], [31, 35], [35, 38], [38, 45], [7, 14], [14, 21],
  [25, 32], [25, 29], [21, 29], [26, 29], [29, 33], [33, 36], [36, 40], [40, 46],
  [37, 41], [37, 46], [38, 41], [34, 41], [20, 23], [16, 20], [9, 16],
  [1, 8], [4, 11], [11, 14], [14, 18], [1, 5], [22, 26], [28, 31], [6, 13],
];

export const HOME_BASES = {
  confederation: { rx: 172, ry: 829 },
  frente: { rx: 610, ry: 944 },
  nations: { rx: 61, ry: 356 },
  acadiane: { rx: 834, ry: 79 },
  bayou: { rx: 945, ry: 683 },
  dominion: { rx: 395, ry: 65 },
};

const computeAdj = (hexes) => {
  const a = {};
  hexes.forEach(h => { a[h.id] = []; });
  for (let i = 0; i < hexes.length; i++) {
    for (let j = i + 1; j < hexes.length; j++) {
      const ha = hexes[i], hb = hexes[j];
      if (Math.sqrt((ha.rx - hb.rx) ** 2 + (ha.ry - hb.ry) ** 2) < 160) {
        a[ha.id].push(hb.id);
        a[hb.id].push(ha.id);
      }
    }
  }
  return a;
};

export const LEGACY_MAP = {
  name: "panamerica-v1",
  hexes: DEFAULT_HEXES.map(h => h.id === 31 ? { ...h, t: "marecage" } : h),
  rivers: LEGACY_RIVERS,
  encounterHexes: [2, 4, 14, 16, 20, 27, 29, 35, 41],
  starts: null,
};

// ── Carte par défaut (dessinée à la main, retouches v2) ──
export const DEFAULT_MAP = {
  name: "panamerica",
  hexes: DEFAULT_HEXES,
  rivers: DEFAULT_RIVERS,
  encounterHexes: [2, 4, 14, 16, 20, 27, 29, 35, 41],
  // starts: null → workerHex statiques de factions.js
  starts: null,
};

// ── Bindings vivants (réassignés par loadMap) ──
export let HEXES = [];
export let RIVERS = [];
export let hMap = {};
export let ADJ = {};
export let RSET = new Set();
export let CURRENT_MAP = DEFAULT_MAP;

export const hasR = (a, b) => RSET.has(`${Math.min(a, b)}-${Math.max(a, b)}`);

/** Charge une carte (par défaut ou générée) — toute la logique suit via les bindings. */
export const loadMap = (map) => {
  CURRENT_MAP = map;
  HEXES = map.hexes;
  RIVERS = map.rivers;
  hMap = Object.fromEntries(map.hexes.map(h => [h.id, h]));
  ADJ = computeAdj(map.hexes);
  RSET = new Set(map.rivers.map(([a, b]) => `${Math.min(a, b)}-${Math.max(a, b)}`));
};

loadMap(DEFAULT_MAP);
