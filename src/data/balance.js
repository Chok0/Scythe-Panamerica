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
  // Import Impérial (Dominion) : le commerce dans l'AUTRE sens — 2$ → 1
  // ressource au choix, 1×/tour. Corrige le goulot structurel mesuré : sa
  // péninsule produit pétrole+métal, donc ni Build (bois) ni Enlist
  // (nourriture), le bottom le plus fort du jeu. (--ab noDomImport pour contrôle)
  imperialImport: true,
  // Plafond de scoring des ressources contrôlées. DÉSACTIVÉ (décision de
  // design) : un gros magot doit rester une MOTIVATION AU COMBAT — plus le
  // tas est gros, plus il attire les raids (et les chaînes de batailles où
  // chacun se jette sur l'empilement en profitant des combattants épuisés).
  // Le contre de la thésaurisation est le pillage, pas la règle.
  // (--ab resCap12 le réactive à 12 pour comparaison au simulateur)
  resScoringCap: 9999,
};
