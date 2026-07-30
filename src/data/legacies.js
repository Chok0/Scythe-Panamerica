// ── Les legs de Wardenclyffe ──────────────────────────────────────────────
// Cinq objets HORS CATALOGUE (voir docs/campagne.md §« legs de Wardenclyffe »):
// ce ne sont pas des Plans à piocher à l'Usine mais des récompenses de
// campagne, débloquées à la fin d'un chapitre dont la condition canon a été
// remplie. Ils vivent donc dans leur propre table, séparée de `plans.js`.
//
// ⚠ ÉTAT : données seules. `implemented: false` sur les cinq — la campagne
// enregistre le déblocage (progression persistante), mais aucun effet n'est
// encore branché au moteur. C'est volontaire : le déblocage est la première
// brique, l'effet en jeu se fera legs par legs (chacun touche un système
// différent : mecha supplémentaire, bâtiment, Produce, vol de ressource).
export const LEGACIES = {
  golem: {
    id: "golem", name: "Le Golem", icon: "🗿", kind: "mecha",
    chapter: "ch1",
    desc: "Mecha supplémentaire alimenté sans fil : aucune ressource Énergie, déplaçable à distance depuis n'importe quelle case où se trouve le héros.",
    // Systèmes instables sans leur créateur — le grain de sable qui l'empêche
    // d'être un 5e mecha gratuit sans contrepartie.
    drawback: "1 sur un dé à chaque combat : il s'arrête.",
    implemented: false,
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
