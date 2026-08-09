// ── Disposition du contenu d'un hex ───────────────────────────────────────
// Constaté en partie le 09/08 : sur un hex chargé, plus rien n'est lisible.
// Les ouvriers montaient sur le badge de ressource du terrain et sur les tas
// de ressources (« on ne perçoit pas que le métal est là »), les mechas —
// deux fois plus larges qu'un ouvrier pour un même pas de 24 px — passaient
// par-dessus les ouvriers, et le bâtiment écrasait la rangée.
//
// Trois causes, pas une :
//   1. les pions étaient dessinés trop gros pour l'hexagone (un mecha faisait
//      40 px de diamètre dans un hex de 111 px de haut) ;
//   2. le pas de la grille de pions était FIXE, quelle que soit la taille des
//      pions posés dessus ;
//   3. la pastille du terrain, les tas de ressources et les pions se
//      partageaient la même bande verticale, chacun placé indépendamment.
//
// Ce module donne le gabarit : trois bandes qui ne se recouvrent jamais.
//
//        ┌──────── bande HAUTE (y = -40) ────────┐   ce que dit la CARTE
//        │  terrain · rencontre · ancrage · $    │   (pastilles, largeur
//        │  · pièges · comptoirs                 │    répartie dynamiquement)
//        ├──────── bande des PIONS ──────────────┤   rangées de pions, les
//        │  lourds (héros/mechas/patrouilles)    │   gros au-dessus des
//        │  légers (ouvriers)                    │   petits, jamais mêlés
//        ├──────── bande BASSE (y = +42) ────────┤   ce qui est POSÉ au sol
//        │  bâtiment · tas de ressources         │   (structure + ressources)
//        └───────────────────────────────────────┘
//
// Tout est exprimé en coordonnées RELATIVES au centre de l'hex, dans l'unité
// de la carte (HS = 64). `hexLayout.test.js` vérifie qu'aucune paire de pions
// ne se recouvre et que rien ne déborde de l'hexagone.

export const HEX_R = 64;
/** Demi-hauteur de l'hexagone (sommets à 0°, 60°, … : 64·sin 60°). */
export const HEX_HALF_H = HEX_R * Math.sin(Math.PI / 3);

/** Demi-largeur de l'hexagone à la hauteur `y` — 64 au centre, 32 aux bords
 *  plat du haut et du bas. Sert à ne rien laisser déborder. */
export const halfWidthAt = (y) => HEX_R * (1 - Math.min(1, Math.abs(y) / HEX_HALF_H) / 2);

// Rayons de dessin des pions (svg/MapComponents.jsx suit ces valeurs).
// Un mecha reste nettement plus imposant qu'un ouvrier, mais trois mechas
// tiennent désormais côte à côte dans un hex — ce n'était pas le cas.
export const UNIT_R = { hero: 15, mech: 15, empire: 15, worker: 10 };
export const unitR = (type) => UNIT_R[type] || UNIT_R.worker;

/** Bande réservée aux pions : ni la bande haute ni la bande basse n'y entrent. */
export const BAND = { top: -24, bottom: 32 };
export const STRIP_TOP_Y = -40;
export const STRIP_BOTTOM_Y = 42;

const GAP = 2;              // jeu minimal entre deux pions voisins
const MARGIN = 5;           // marge intérieure de l'hexagone
const HEAVY = new Set(["hero", "mech", "empire"]);

/** Répartit des éléments de largeurs données sur une bande HORIZONTALE
 *  centrée : renvoie les abscisses des centres. Les pastilles absentes ne
 *  prennent pas de place — la bande se recompose selon ce qui est là. */
export const layoutStrip = (widths, y = STRIP_TOP_Y, gap = 3) => {
  if (!widths.length) return [];
  const sum = widths.reduce((a, w) => a + w, 0);
  const room = 2 * (halfWidthAt(y) - MARGIN);
  // On resserre le JEU entre pastilles, jamais les pastilles elles-mêmes :
  // l'appelant les dessine à leur taille, les rétrécir ici les ferait se
  // chevaucher — exactement ce qu'on cherche à éviter. Au-delà de jeu nul, la
  // bande déborde légèrement dans la gouttière entre hexes, ce qui reste
  // lisible (et ne se produit qu'à partir de quatre pastilles sur un hex).
  const g = widths.length > 1
    ? Math.max(0, Math.min(gap, (room - sum) / (widths.length - 1)))
    : 0;
  const total = sum + g * (widths.length - 1);
  let x = -total / 2;
  return widths.map(w => { const c = x + w / 2; x += w + g; return c; });
};

/** Découpe une liste en rangées d'au plus `perRow` éléments. */
const chunk = (arr, perRow) => {
  const out = [];
  for (let i = 0; i < arr.length; i += perRow) out.push(arr.slice(i, i + perRow));
  return out;
};

/**
 * Place les pions d'un hex.
 * @param units [{id, type}] — bâtiments EXCLUS (ils ont leur propre emplacement)
 * @returns [{id, cx, cy, scale}] centres relatifs au centre de l'hex
 *
 * Deux blocs, jamais mélangés : les LOURDS (héros, mechas, patrouilles
 * impériales) forment les rangées du haut, les LÉGERS (ouvriers) celles du
 * bas. Un mecha ne peut donc plus se poser sur un ouvrier — au pire ils sont
 * côte à côte. L'échelle est commune et descend juste assez pour que tout
 * tienne dans la bande, en hauteur comme en largeur.
 */
export const layoutUnits = (units) => {
  if (!units || units.length === 0) return [];
  const heavy = units.filter(u => HEAVY.has(u.type));
  const light = units.filter(u => !HEAVY.has(u.type));
  // Les lourds tiennent à 3 par rangée, les légers à 4 : on préfère élargir
  // une rangée qu'en ajouter une (la hauteur est la ressource rare).
  const rows = [...chunk(heavy, 3), ...chunk(light, 4)];
  const rowR = rows.map(r => unitR(r[0].type));
  const bandH = BAND.bottom - BAND.top;

  // Plus grande échelle (par pas de 2 %) qui satisfait hauteur ET largeur.
  let scale = 1;
  for (let s = 100; s >= 40; s -= 2) {
    const k = s / 100;
    const h = rowR.reduce((a, r) => a + 2 * r * k + GAP, 0) - GAP;
    if (h > bandH) continue;
    // Hauteurs de rangée connues → on peut vérifier la largeur à la bonne
    // hauteur (l'hexagone se rétrécit vers le haut et vers le bas).
    let y = BAND.top + (bandH - h) / 2;
    const fits = rows.every((row, i) => {
      const r = rowR[i] * k;
      const cy = y + r; y += 2 * r + GAP;
      const w = row.length * (2 * r + GAP) - GAP;
      return w <= 2 * (halfWidthAt(Math.abs(cy) + r) - MARGIN);
    });
    if (fits) { scale = k; break; }
    scale = k;                                   // dernier essai : au plus serré
  }

  const h = rowR.reduce((a, r) => a + 2 * r * scale + GAP, 0) - GAP;
  let y = BAND.top + (bandH - h) / 2;
  const out = [];
  rows.forEach((row, i) => {
    const r = rowR[i] * scale;
    const cy = y + r;
    const step = 2 * r + GAP;
    row.forEach((u, j) => out.push({ id: u.id, cx: (j - (row.length - 1) / 2) * step, cy, scale }));
    y += 2 * r + GAP;
  });
  return out;
};
