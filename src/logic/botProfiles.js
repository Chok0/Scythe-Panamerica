// Profils stratégiques des bots — réponse à la grande limite des bots de la
// version Steam de Scythe : ils jouent toujours pareil. Chaque bot reçoit un
// profil (pondéré par faction) qui oriente TOUTES ses décisions : colonnes,
// cibles de déplacement, agressivité, bâtiments, enlists, gestion de la pop.
// Combiné au niveau de difficulté (bruit décisionnel), on obtient des parties
// variées et plusieurs niveaux de challenge.

export const BOT_PROFILES = {
  equilibre: {
    key: "equilibre", name: "Équilibré", icon: "⚖",
    desc: "Le plan du corpus : enlist tôt, Speed mech, économie, palier de pop 7+",
    popTarget: 7,        // achète de la pop sous ce seuil
    tradePopBoost: 5,    // poids de Trade quand sous le seuil
    chasePopStar: false, // ne vise pas l'étoile 18 pop
    aggroMargin: 2,      // n'attaque qu'avec cet avantage de force
    attackReward: 9,     // valeur d'une attaque gagnable
    earlyAttack: false,  // pas de combat avant 3 étoiles
    encounterPull: 7,    // attraction du héros vers les jetons rencontre
    bolsterBoost: 0,
    produceBoost: 0,
    maxWorkersEarly: 5,  // régime d'ouvriers du corpus : 5 puis 8
    starRush: 0,         // bonus pour un bottom à 1 action de l'étoile
    enlistPriority: [0, 1, 2, 3],   // puissance, pièces, pop, cartes
    buildPriority: null,            // ordre par phase (défaut de bot.js)
  },
  batisseur: {
    key: "batisseur", name: "Bâtisseur", icon: "🏛",
    desc: "Moteur de popularité : enlist pop, Mémorial+Bolster, course aux rencontres, palier 13+",
    popTarget: 13,
    tradePopBoost: 7,
    chasePopStar: true,  // pousse jusqu'à l'étoile 18 pop
    aggroMargin: 4,      // évite les combats (mauvais pour l'image)
    attackReward: 6,
    earlyAttack: false,
    encounterPull: 12,   // fonce sur les jetons rencontre (gains de pop)
    bolsterBoost: 2,     // Bolster nourrit le Mémorial (+1 pop)
    produceBoost: 0,
    maxWorkersEarly: 5,
    starRush: 0,
    enlistPriority: [2, 1, 0, 3],   // pop d'abord
    buildPriority: ["memorial", "moulin", "gare", "arsenal"],
  },
  blitz: {
    key: "blitz", name: "Blitzkrieg", icon: "⚔",
    desc: "Remplir ses étoiles vitesse grand V et massacrer les camarades — la pop attendra",
    popTarget: 3,        // juste assez pour ne pas bloquer Produce à 5+ ouvriers
    tradePopBoost: 3,
    chasePopStar: false,
    aggroMargin: 0,      // attaque à force égale
    attackReward: 12,
    earlyAttack: true,   // cherche le combat dès le début
    encounterPull: 5,
    bolsterBoost: 3,     // stocke puissance et cartes
    produceBoost: 0,
    maxWorkersEarly: 5,
    starRush: 6,         // priorité aux bottoms à 1 action d'une étoile
    moveBoost: 3,        // toujours en mouvement (attaques, territoire)
    enlistPriority: [0, 3, 1, 2],   // puissance puis cartes de combat
    buildPriority: ["gare", "arsenal", "moulin", "memorial"],
  },
  thesauriseur: {
    key: "thesauriseur", name: "Thésauriseur", icon: "📦",
    desc: "Produire, empiler, éviter les coups — les ressources et le palier de pop font le score",
    popTarget: 9,
    tradePopBoost: 5,
    chasePopStar: false,
    aggroMargin: 5,      // pacifiste
    attackReward: 4,
    earlyAttack: false,
    encounterPull: 7,
    bolsterBoost: 0,
    produceBoost: 5,     // produit dès que possible
    maxWorkersEarly: 8,  // tous les ouvriers, tout de suite
    starRush: 0,
    enlistPriority: [1, 2, 0, 3],   // pièces puis pop
    buildPriority: ["moulin", "memorial", "gare", "arsenal"],
  },
};

// Pondérations par faction (mesurées/ajustées au simulateur) : chaque partie
// tire un profil au sort → d'une partie à l'autre, la même faction ne joue
// pas pareil.
export const FACTION_PROFILE_WEIGHTS = {
  confederation: { blitz: 2, batisseur: 2, equilibre: 1 },
  frente: { equilibre: 2, blitz: 1, thesauriseur: 1 },
  nations: { equilibre: 2, batisseur: 1, blitz: 1 },
  acadiane: { thesauriseur: 2, batisseur: 1, equilibre: 1 },
  bayou: { blitz: 2, batisseur: 1, equilibre: 1 },
  dominion: { equilibre: 2, thesauriseur: 2, blitz: 1 },
};

// ── Méta-stratégie de plateau ──
// Comme les joueurs qui savent que « la Crimée est avantagée sur ce plateau »
// et l'attaquent tôt pour ralentir son développement : a priori de menace par
// faction sur la carte physique, mesuré par simulation (winrates). S'ajoute au
// leader dynamique (étoiles/pop/pièces en cours de partie) dans le ciblage.
export const MAP_META_THREAT = {
  acadiane: 3, frente: 2, nations: 2,
  bayou: 0, confederation: 0, dominion: 0,
};

/** Standing dynamique d'un joueur (détection du leader à harceler). */
export const playerStanding = (p) =>
  (p.stars || 0) * 3
  + (p.pop >= 13 ? 6 : p.pop >= 7 ? 3 : 0)
  + Math.min(6, Math.floor((p.coins || 0) / 3))
  + (p.mechs?.length || 0);

// Bruit décisionnel ajouté au score des colonnes : plus il est fort, plus le
// bot dévie du plan optimal → niveaux de difficulté sans triche.
export const BOT_NOISE = { facile: 8, normal: 3, difficile: 0 };

/**
 * Assigne un profil à un bot selon sa faction et la difficulté.
 * - facile : profil au hasard uniforme (souvent inadapté à la faction) + gros bruit
 * - normal : tirage pondéré par faction (diversité) + bruit léger
 * - difficile : meilleur profil connu de la faction, sans bruit
 */
export const assignBotProfile = (factionId, difficulty = "normal", rnd = Math.random) => {
  const weights = FACTION_PROFILE_WEIGHTS[factionId] || { equilibre: 1 };
  if (difficulty === "facile") {
    const keys = Object.keys(BOT_PROFILES);
    return keys[Math.floor(rnd() * keys.length)];
  }
  if (difficulty === "difficile") {
    return Object.entries(weights).sort((a, b) => b[1] - a[1])[0][0];
  }
  const entries = Object.entries(weights);
  const total = entries.reduce((a, [, v]) => a + v, 0);
  let r = rnd() * total;
  for (const [k, v] of entries) { r -= v; if (r <= 0) return k; }
  return entries[0][0];
};
