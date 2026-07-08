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
};
