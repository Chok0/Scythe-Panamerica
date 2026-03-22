export const EMPIRE_START = [
  { id: "E1", hexId: 22 }, { id: "E2", hexId: 15 }, { id: "E3", hexId: 23 },
  { id: "E4", hexId: 26 }, { id: "E5", hexId: 30 }, { id: "E6", hexId: 27 },
];

export const EMPIRE_RAILS = [[22, 26], [22, 23], [26, 30], [15, 22]];

export const EMPIRE_DECK = [
  { power: 1, name: "Écho Rouillé" }, { power: 2, name: "Sentinelle Aveugle" }, { power: 2, name: "Patrouilleur Usé" },
  { power: 3, name: "Gardien de Route" }, { power: 4, name: "Broyeur de Fer" }, { power: 5, name: "Marcheur d'Acier" },
  { power: 6, name: "Titan Errant" }, { power: 7, name: "Colosse de l'Aube" }, { power: 8, name: "Vengeur de l'Empire" },
  { power: 9, name: "Bête de Wardenclyffe" }, { power: 10, name: "Le Dernier Ordre" }, { power: 12, name: "Golem Fantôme" },
];

export const drawEmpireCombat = () => EMPIRE_DECK[Math.floor(Math.random() * EMPIRE_DECK.length)];
