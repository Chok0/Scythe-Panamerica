// ── Récompenses de campagne ────────────────────────────────────────────────
// Cinq récompenses débloquées à la fin d'un chapitre dont la condition canon
// a été remplie. Quatre sont des « legs de Wardenclyffe » — objets HORS
// CATALOGUE, pas des Plans à piocher à l'Usine (voir docs/campagne.md). La
// cinquième (railCards, chapitre 1) est de nature différente : un lot de
// cartes rencontre injectées dans le deck des chapitres suivants, décidé au
// cadrage « Le rail avance » — le Golem qui l'occupait avant est retiré du
// périmètre, réintégré plus tard avec sa propre logique de scénario.
//
// ⚠ ÉTAT : `implemented: false` sur les quatre legs Wardenclyffe restants —
// la campagne enregistre le déblocage, mais aucun effet n'est encore branché
// au moteur (un par un, chacun touche un système différent). `railCards` est
// la seule des cinq à avoir un effet RÉEL en jeu (logic/campaign.js +
// injection du deck dans App.jsx).
export const LEGACIES = {
  railCards: {
    id: "railCards", name: "Chantier ferroviaire", icon: "🛤", kind: "cartes",
    chapter: "ch1",
    desc: "3 cartes rencontre « Chantier ferroviaire » rejoignent le deck de tous les chapitres suivants : le rail que l'Empire imposait devient un outil que les factions s'approprient.",
    implemented: true,
  },
  tour: {
    id: "tour", name: "La Tour Wardenclyffe", icon: "🗼", kind: "batiment",
    chapter: "ch7",
    desc: "Structure fixe qui alimente sans fil tous vos mechas dans un rayon de 3 cases : +1 mouvement, +1 puissance.",
    implemented: false,
  },
  eclair: {
    id: "eclair", name: "L'Éclair", icon: "⚡", kind: "mecha",
    chapter: "ch5",
    desc: "Mecha léger de reconnaissance : 4 cases de mouvement (le double de la norme), pensé pour le vol de ressources.",
    implemented: false,
  },
  amplificateur: {
    id: "amplificateur", name: "L'Amplificateur", icon: "📡", kind: "batiment",
    chapter: "ch3",
    // Nom de travail repris du « magnifying transmitter » de Colorado Springs.
    desc: "Produit 1 pétrole supplémentaire à chaque Produce, sans lien avec aucun gisement — une prise d'énergie libre.",
    implemented: false,
  },
  relais: {
    id: "relais", name: "Le Relais", icon: "📻", kind: "effet",
    chapter: "ch6",
    desc: "Capte ce que fait tout autre joueur sur son propre Plan de Rouge River et en détourne 1 ressource au choix à chaque fois.",
    implemented: false,
  },
};

export const LEGACY_IDS = Object.keys(LEGACIES);
export const legacyById = (id) => LEGACIES[id] || null;
