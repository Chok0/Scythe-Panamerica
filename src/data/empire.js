export const EMPIRE_START = [
  { id: "E1", hexId: 22 }, { id: "E2", hexId: 15 }, { id: "E3", hexId: 23 },
  { id: "E4", hexId: 26 }, { id: "E5", hexId: 30 }, { id: "E6", hexId: 27 },
];

export const EMPIRE_RAILS = [[27, 30], [11, 15]];

// ── Comportement des patrouilles (correctifs du 03/08) ────────────────────
// Une seule patrouille s'active par tour de table, et elle choisissait sa
// destination au hasard PUR parmi ses voisins + tout le réseau ferré. Une
// fois le réseau achevé, un nœud offrait ~14 destinations contre ~5 voisins :
// 6 des 8 derniers déplacements de la partie du 03/08 étaient des sauts de
// rail d'un bout à l'autre de la carte, sans jamais menacer personne
// (« déplacement de mecha Empire sans interaction », deux fois).
/** Probabilité que le réseau ferré entre dans le tirage de la destination. */
export const EMPIRE_RAIL_CHANCE = 0.25;
/** Probabilité de préférer un hex « qui vaut le détour » (unités, ouvriers,
 *  butin) quand il y en a un à portée — la patrouille chasse, elle n'erre pas. */
export const EMPIRE_HUNT_CHANCE = 0.75;

export const EMPIRE_DECK = [
  { power: 1, name: "Écho Rouillé" }, { power: 2, name: "Sentinelle Aveugle" }, { power: 2, name: "Patrouilleur Usé" },
  { power: 3, name: "Gardien de Route" }, { power: 4, name: "Broyeur de Fer" }, { power: 5, name: "Marcheur d'Acier" },
  { power: 6, name: "Titan Errant" }, { power: 7, name: "Colosse de l'Aube" }, { power: 8, name: "Vengeur de l'Empire" },
  { power: 9, name: "Bête de Wardenclyffe" }, { power: 10, name: "Le Dernier Ordre" }, { power: 12, name: "Golem Fantôme" },
];

export const drawEmpireCombat = () => EMPIRE_DECK[Math.floor(Math.random() * EMPIRE_DECK.length)];

// Fourchette du deck impérial. Le joueur mise à l'aveugle contre un bot mais
// voyait la force EXACTE de l'Empire avant d'engager (constaté en partie
// réelle le 01/08) : asymétrie non voulue. On n'annonce plus que la
// fourchette, la valeur n'est révélée qu'à la résolution.
export const EMPIRE_POWER_MIN = Math.min(...EMPIRE_DECK.map(c => c.power));
export const EMPIRE_POWER_MAX = Math.max(...EMPIRE_DECK.map(c => c.power));
/** Fourchette affichable pour `n` patrouilles liguées sur un même hex. */
export const empirePowerRange = (n = 1) => `${EMPIRE_POWER_MIN * n} à ${EMPIRE_POWER_MAX * n}`;
