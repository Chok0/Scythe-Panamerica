// ═══ CARTES D'USINE (Rouge River) — modèle Scythe ═══
// Une carte d'usine est une 5e COLONNE D'ACTION (FACTORY_COL) sur le plateau
// du joueur qui la détient :
//   HAUT : 1 coût + 1 gain (comme toute action top, la jouer est optionnel)
//   BAS  : déplacer 1 unité de 2 hex (+1 si la capacité Vitesse est débloquée)
// Le joueur peut faire le haut seul (s'il peut payer), le bas seul, ou les
// deux — en commençant par le haut.
//
// L'OFFRE (course à l'Usine, règle Scythe) : au départ de la partie,
// (nb joueurs + 1) cartes du deck Ford sont tirées au hasard et posées FACE
// CACHÉE sur l'Usine — on ne les découvre qu'en y arrivant. Chaque visiteur
// en choisit UNE parmi les restantes : le premier arrivé a l'embarras du
// choix, le dernier se contente de ce qui reste. UNE carte par joueur :
// prendre une Ford ferme définitivement l'accès aux prototypes Tesla.

export const FACTORY_RR_HEX = 22;

// Indice de la colonne d'action apportée par la carte d'usine (0-3 = plateau)
export const FACTORY_COL = 4;

// Fragments Tesla requis pour PRENDRE un prototype Tesla à la Rouge River —
// ils sont CONSOMMÉS à la prise. C'est une vraie quête : 2 récompenses de
// rencontre/combat PvE à sécuriser en retardant sa propre visite de l'Usine.
// (Pas d'étoile pour l'accomplir dans le jeu de base — piste retenue : un
// scénario dédié du mode campagne pourra la récompenser.)
export const TESLA_FRAGMENTS_REQUIRED = 2;

// Prototypes Tesla exposés en plus de l'offre Ford. VISIBLES DE TOUS (la
// vitrine de l'Usine se consulte en cliquant l'hex #22) pour motiver la
// quête des fragments — mais choisissables uniquement avec les fragments.
export const TESLA_OFFER_SIZE = 2;

// ── Modèle de carte ──
// cost : [{res:"coins"|"power"|"pop"|"cards", qty}] — payé sur les pistes
// gain : liste d'effets, résolus dans l'ordre :
//   {type:"coins"|"power"|"pop"|"cards", qty}      — gain direct
//   {type:"upgrade"}                                — 1 Améliorer gratuite (cube haut→bas)
//   {type:"enlist"}                                 — 1 Enrôler gratuit (recrue + bonus immédiat)
//   {type:"building"}                               — 1 Bâtiment gratuit (hex ouvrier)
//   {type:"mech"}                                   — 1 Mecha gratuit (hex ouvrier)
//   {type:"produce2"}                               — Produire sur 2 territoires (hex ouvriers)
//   {type:"resources", qty}                         — ressources au choix (hex ouvrier)
//   {type:"choice", options:[effet, effet]}         — l'un OU l'autre
// building/mech/produce2/resources exigent un ouvrier sur le plateau (règle
// « si ouvrier » des cartes originales : le gain se matérialise chez un ouvrier).

// ── DECK FORD — 12 cartes (variations sur la logique du deck original) ──
export const PLANS_FORD = [
  { id: "F01", deck: "ford", name: "Chaîne de Montage",
    cost: [{ res: "coins", qty: 2 }], gain: [{ type: "upgrade" }, { type: "power", qty: 1 }] },
  { id: "F02", deck: "ford", name: "Bureau d'Embauche",
    cost: [{ res: "coins", qty: 2 }], gain: [{ type: "enlist" }, { type: "pop", qty: 1 }] },
  { id: "F03", deck: "ford", name: "Hangar Préfabriqué",
    cost: [{ res: "coins", qty: 2 }], gain: [{ type: "building" }, { type: "power", qty: 1 }] },
  { id: "F04", deck: "ford", name: "Prototype de Série",
    cost: [{ res: "coins", qty: 2 }], gain: [{ type: "mech" }, { type: "pop", qty: 1 }] },
  { id: "F05", deck: "ford", name: "Contrat Fédéral",
    cost: [{ res: "power", qty: 1 }], gain: [{ type: "coins", qty: 2 }, { type: "pop", qty: 1 }] },
  { id: "F06", deck: "ford", name: "Parade Motorisée",
    cost: [{ res: "power", qty: 1 }], gain: [{ type: "pop", qty: 1 }, { type: "cards", qty: 1 }] },
  { id: "F07", deck: "ford", name: "Stock de Guerre",
    cost: [{ res: "cards", qty: 1 }], gain: [{ type: "coins", qty: 2 }, { type: "power", qty: 1 }] },
  { id: "F08", deck: "ford", name: "Tournée des Comtés",
    cost: [{ res: "cards", qty: 1 }], gain: [{ type: "pop", qty: 2 }] },
  { id: "F09", deck: "ford", name: "Convoi de Ravitaillement",
    cost: [{ res: "cards", qty: 1 }], gain: [{ type: "resources", qty: 2 }, { type: "coins", qty: 1 }] },
  { id: "F10", deck: "ford", name: "Plan Directeur",
    cost: [{ res: "pop", qty: 1 }], gain: [{ type: "choice", options: [{ type: "upgrade" }, { type: "enlist" }] }, { type: "coins", qty: 1 }] },
  { id: "F11", deck: "ford", name: "Réquisition Industrielle",
    cost: [{ res: "pop", qty: 1 }], gain: [{ type: "choice", options: [{ type: "mech" }, { type: "upgrade" }] }] },
  { id: "F12", deck: "ford", name: "Heures Supplémentaires",
    cost: [{ res: "coins", qty: 2 }], gain: [{ type: "produce2" }] },
];

// ── DECK TESLA — 5 prototypes plus puissants (accès : 1 Fragment Tesla) ──
export const PLANS_TESLA = [
  { id: "T01", deck: "tesla", name: "Générateur à Induction",
    cost: [{ res: "power", qty: 1 }], gain: [{ type: "coins", qty: 4 }] },
  { id: "T02", deck: "tesla", name: "Bobine de Choc",
    cost: [{ res: "cards", qty: 1 }], gain: [{ type: "power", qty: 3 }, { type: "pop", qty: 1 }] },
  { id: "T03", deck: "tesla", name: "Automate de Chantier",
    cost: [{ res: "coins", qty: 2 }], gain: [{ type: "choice", options: [{ type: "mech" }, { type: "building" }] }, { type: "power", qty: 1 }] },
  { id: "T04", deck: "tesla", name: "Transmission sans Fil",
    cost: [{ res: "pop", qty: 1 }], gain: [{ type: "upgrade" }, { type: "coins", qty: 2 }] },
  { id: "T05", deck: "tesla", name: "Usine Portative",
    cost: [{ res: "coins", qty: 1 }], gain: [{ type: "produce2" }, { type: "pop", qty: 1 }] },
];

// ── DECK ORIGINAL — les 12 actions top du Scythe de base, à l'identique.
// GARDÉ DE CÔTÉ pour l'instant : non mélangé à l'offre de la partie de base,
// il sera débloqué comme récompense dans le mode campagne.
export const PLANS_ORIGINAL = [
  { id: "O01", deck: "original", name: "Ligne Pilote",
    cost: [{ res: "coins", qty: 2 }], gain: [{ type: "upgrade" }, { type: "pop", qty: 1 }] },
  { id: "O02", deck: "original", name: "Conscription",
    cost: [{ res: "coins", qty: 2 }], gain: [{ type: "enlist" }, { type: "power", qty: 1 }] },
  { id: "O03", deck: "original", name: "Vente d'Actifs",
    cost: [{ res: "power", qty: 1 }], gain: [{ type: "coins", qty: 3 }] },
  { id: "O04", deck: "original", name: "Jour de Fête",
    cost: [{ res: "power", qty: 1 }], gain: [{ type: "pop", qty: 2 }] },
  { id: "O05", deck: "original", name: "Entrepôt Central",
    cost: [{ res: "coins", qty: 2 }], gain: [{ type: "building" }, { type: "pop", qty: 1 }] },
  { id: "O06", deck: "original", name: "Décret de Mobilisation",
    cost: [{ res: "pop", qty: 1 }], gain: [{ type: "choice", options: [{ type: "enlist" }, { type: "upgrade" }] }] },
  { id: "O07", deck: "original", name: "Les Trois-Huit",
    cost: [{ res: "coins", qty: 1 }, { res: "cards", qty: 1 }], gain: [{ type: "produce2" }] },
  { id: "O08", deck: "original", name: "Char d'Essai",
    cost: [{ res: "coins", qty: 2 }], gain: [{ type: "mech" }, { type: "power", qty: 1 }] },
  { id: "O09", deck: "original", name: "Munitions",
    cost: [{ res: "cards", qty: 1 }], gain: [{ type: "power", qty: 2 }] },
  { id: "O10", deck: "original", name: "Contrebande",
    cost: [{ res: "cards", qty: 1 }], gain: [{ type: "coins", qty: 3 }] },
  { id: "O11", deck: "original", name: "Wagon de Marchandises",
    cost: [{ res: "cards", qty: 1 }], gain: [{ type: "resources", qty: 3 }] },
  { id: "O12", deck: "original", name: "Expropriation",
    cost: [{ res: "pop", qty: 1 }], gain: [{ type: "choice", options: [{ type: "mech" }, { type: "building" }] }] },
];

// Toutes les cartes (réhydratation des sauvegardes par id, campagne incluse)
export const ALL_FACTORY_CARDS = [...PLANS_FORD, ...PLANS_TESLA, ...PLANS_ORIGINAL];

// ── Libellés partagés (UI + journal) ──
export const COST_ICONS = { coins: "💰", power: "⚡", pop: "♥", cards: "🃏" };

export const factoryEffectLabel = (e) => {
  switch (e.type) {
    case "coins": return `+${e.qty}💰`;
    case "power": return `+${e.qty}⚡`;
    case "pop": return `+${e.qty}♥`;
    case "cards": return `+${e.qty}🃏`;
    case "upgrade": return "1 Améliorer gratuite";
    case "enlist": return "1 Enrôler gratuit";
    case "building": return "1 Bâtiment (hex ouvrier)";
    case "mech": return "1 Mecha (hex ouvrier)";
    case "produce2": return "Produire sur 2 territoires";
    case "resources": return `+${e.qty} ressources au choix (hex ouvrier)`;
    case "choice": return e.options.map(factoryEffectLabel).join(" OU ");
    default: return "?";
  }
};

export const factoryCostLabel = (card) =>
  card.cost.map(c => `${c.qty}${COST_ICONS[c.res] || c.res}`).join(" + ");

export const factoryGainLabel = (card) =>
  card.gain.map(factoryEffectLabel).join(" + ");

// Description de l'action du BAS, commune à toutes les cartes d'usine
export const FACTORY_BOTTOM_DESC = "Déplacer 1 unité de 2 hex (+1 si Vitesse)";
