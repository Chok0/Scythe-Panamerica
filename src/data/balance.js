// Réglages d'équilibrage centralisés.
// Le simulateur peut les modifier au lancement (--ab wf1, --ab bayouBois…)
// pour mesurer l'impact d'un nerf/buff avant de changer la valeur par défaut ici.
export const BALANCE = {
  // Pop gagnée par l'Acadiane quand elle refuse un combat (White Flag).
  // Était 2 : moteur de popularité illimité identifié comme driver principal
  // de son winrate (65,7%) par la simulation — voir RAPPORT_SIMULATION.md.
  whiteFlagPop: 2,
  // Servitude (Confédération) : capture aussi lors d'un simple déplacement
  // d'ouvriers ennemis (pas seulement après une victoire de combat).
  servitudeOnDisplace: true,
  // Commerce Impérial (Dominion) : conversions de surplus par tour.
  // (--ab dom2 le passe à 2 pour mesure avant application)
  imperialRate: 1,
  // Plafond de scoring des ressources contrôlées : au-delà, le surplus ne
  // rapporte plus de points. Mesuré : sans plafond, la stratégie « coffre-fort »
  // (Acadiane 61% de winrate, 33 pts de ressources) domine tout le reste.
  // Avec : Acadiane 41-44%, toutes les autres remontent.
  resScoringCap: 12,
};
