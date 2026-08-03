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
    buildBoost: 0,       // poids ajouté à la colonne Construire (v0.17)
    enlistPriority: [0, 1, 2, 3],   // puissance, pièces, pop, cartes
    buildPriority: null,            // ordre par phase (défaut de bot.js)
  },
  // v0.15 : le bâtisseur perdait structurellement (40 % de dernières places,
  // 21 % de victoires) — il achetait de la pop au goutte-à-goutte jusqu'à
  // s'assécher, sans jamais construire son moteur d'étoiles. Palier visé
  // ramené à 10 (le palier ×2 commence à 7 ; 13 se joue en sprint de fin,
  // cf. P3 dans bot.js) et boost d'achat réduit : la pop se prend sur les
  // rencontres et le Mémorial, pas en brûlant sa trésorerie.
  batisseur: {
    key: "batisseur", name: "Bâtisseur", icon: "🏛",
    desc: "Moteur de popularité : enlist pop, Mémorial+Bolster, course aux rencontres, sprint de palier",
    popTarget: 10,
    tradePopBoost: 4,
    chasePopStar: true,  // pousse jusqu'à l'étoile 18 pop
    aggroMargin: 4,      // évite les combats (mauvais pour l'image)
    attackReward: 6,
    earlyAttack: false,
    encounterPull: 12,   // fonce sur les jetons rencontre (gains de pop)
    bolsterBoost: 2,     // Bolster nourrit le Mémorial (+1 pop)
    produceBoost: 1,     // v0.15 : il lui manquait des ressources pour bâtir
    maxWorkersEarly: 5,
    starRush: 0,
    // v0.17 : un profil nommé « Bâtisseur » construisait MOINS que le Blitz
    // (1,80 bâtiment contre 2,70 en simulation) — rien ne pesait sur la
    // colonne Construire. Le Mémorial est en plus son moteur de popularité.
    buildBoost: 8,
    teslaHunter: true,   // patient par nature : bon candidat à la quête Tesla
    enlistPriority: [2, 1, 0, 3],   // pop d'abord
    buildPriority: ["memorial", "moulin", "gare", "arsenal"],
  },
  blitz: {
    key: "blitz", name: "Blitzkrieg", icon: "⚔",
    desc: "Remplir ses étoiles vitesse grand V et massacrer les camarades — la pop attendra",
    // v0.15 : à popTarget 3, le blitz finissait à pop 0 — palier ×1, ses
    // 5 étoiles ne valaient plus que 15 points au lieu de 25 (partie de test
    // mesurée). Il vise désormais le palier ×2 (7) : rapide, pas suicidaire.
    popTarget: 6,
    tradePopBoost: 4,
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
  // v0.15 : le thésauriseur perdait aussi (37 % de dernières places) — sortir
  // 8 ouvriers tout de suite coûte 1 pop par Produce dès le 5e (règle Scythe)
  // et sature le plateau sans débouché : régime ramené à 6 ouvriers en early,
  // production légèrement calmée au profit du tempo (actions du bas).
  // v0.15 — Profil HARCELEUR, écrit pour la Confédération (l'équivalent
  // Saxonie de Panamerica) : faction violente et MOBILE dont le plan n'est pas
  // de bâtir mais de vivre sur le dos des autres. Elle prend les ouvriers
  // adverses (Servitude), pille leurs tas de ressources, rafle les rencontres
  // très vite, et — le point clé — empêche les autres de se déployer
  // naturellement en chassant leurs ouvriers de leurs hubs de production.
  // Son score vient des TERRITOIRES et des ressources VOLÉES, pas de la
  // popularité. Elle exige une expertise en déplacement et en gestion de la
  // puissance : ses atouts sont Cavaliers (+2 puissance en attaque) et le
  // riverwalk plaine/village, qui la mène droit sur les hubs d'ouvriers.
  harceleur: {
    key: "harceleur", name: "Harceleur", icon: "🐎",
    desc: "Razzia permanente : voler les ouvriers et les ressources, rafler les rencontres, étouffer le développement adverse",
    // Son score vient des territoires et du butin, tous deux MULTIPLIÉS par le
    // palier de popularité : elle doit donc racheter la pop que ses razzias
    // lui coûtent (mesuré sans ça : pop finale 4-5, tout son score en ×1).
    popTarget: 8,
    tradePopBoost: 5,
    chasePopStar: false,
    aggroMargin: -1,     // attaque même à parité : Cavaliers lui donne +2 en attaque
    attackReward: 14,    // le combat EST son moteur de score
    earlyAttack: true,   // harcèle dès le premier tour
    encounterPull: 14,   // rafle les rencontres avant tout le monde
    bolsterBoost: 3,     // la puissance est son carburant : à gérer en continu
    produceBoost: -1,    // elle vole plus qu'elle ne produit
    maxWorkersEarly: 4,  // peu d'ouvriers : mobilité maximale, pop préservée
    starRush: 4,
    moveBoost: 7,        // la faction la plus mobile du jeu
    disruption: 9,       // valeur d'un hub d'ouvriers adverse chassé (déni de Deploy/Produce)
    lootPull: 8,         // valeur d'un magot à piller
    enlistPriority: [0, 2, 3, 1],   // puissance, puis POPULARITÉ (razzias à payer)
    // Elle joue Soutien en permanence (puissance = carburant) : l'Arsenal
    // (+1 puissance) et le Mémorial (+1 pop) transforment chaque Soutien en
    // moteur double — c'est SA combinaison, avant la Gare et le Moulin.
    buildPriority: ["arsenal", "memorial", "gare", "moulin"],
  },
  // v0.15 — Profil PRÉDATEUR, écrit pour le Bayou : un pirate des marais qui
  // chasse les MACHINES. Son butin tient tout entier dans le mecha de combat
  // (slot 2) : Flibuste lui verse 2 pièces à chaque victoire et la Chimère lui
  // remorque une épave adverse, une fois par partie, pour en faire son 5e
  // mecha. Il démarre à 2 puissance mais 3 cartes : c'est un combattant aux
  // CARTES, pas à la puissance brute. Son plan : sortir la meute D'ABORD —
  // avant le slot 2, une chasse ne rapporte rien (voir mechHunter dans
  // bot.js) — puis traquer les mechas isolés. Le Sang du Marais lui donne les
  // raccourcis : il surgit du marécage là où personne ne l'attend.
  predateur: {
    key: "predateur", name: "Prédateur", icon: "🐊",
    desc: "Meute de mechas bon marché, chasse aux machines (Chimère) et rançon des vaincus (Flibuste)",
    // v0.15 — profil mesuré le PIRE du jeu (19,6 % de victoires, 3,25 étoiles
    // contre 4,68 au harceleur). Diagnostic : il chassait bien, mais ne
    // CONVERTISSAIT pas. Trois corrections, toutes calquées sur ce qui avait
    // redressé le harceleur :
    //  · la popularité passe 4e → 2e à l'enrôlement. Ses combats déplacent des
    //    ouvriers et lui coûtent de la pop ; or le palier de pop MULTIPLIE
    //    étoiles, territoires et ressources. Il finissait tout son score en ×1.
    //  · starRush 3 → 4 et encounterPull 8 → 12 : il traînait au lieu de
    //    fermer la partie, et laissait les jetons rencontre aux autres.
    //  · lootPull : Flibuste est littéralement du pillage — les tas de
    //    ressources adverses valent autant que les machines.
    popTarget: 8,
    tradePopBoost: 5,    // racheter la pop que ses razzias lui coûtent
    chasePopStar: false,
    aggroMargin: 1,      // attaque sur avantage léger — ses cartes font le reste
    attackReward: 12,    // Flibuste : chaque victoire rapporte aussi 2 pièces
    earlyAttack: false,  // il lui faut d'abord ses mechas (Flibuste = slot 2)
    encounterPull: 12,
    bolsterBoost: 2,     // Soutien → CARTES de combat (son vrai carburant)
    produceBoost: 2,     // le métal de sa meute ne tombe pas du ciel
    maxWorkersEarly: 5,
    starRush: 4,
    moveBoost: 5,        // la chasse demande de la mobilité (+ Sang du Marais)
    mechHunter: true,    // cible en priorité les mechas (Chimère + objectif)
    lootPull: 6,         // rançon : les magots adverses valent le détour
    enlistPriority: [3, 2, 0, 1],   // cartes, PUIS popularité, puis puissance
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
    // 8 ouvriers reste son identité — mais la production est désormais
    // « consciente du palier » (P7 dans bot.js) : le 6e ouvrier n'est sorti
    // que s'il existe un moteur de pop, sinon on plafonne à 5.
    maxWorkersEarly: 8,
    starRush: 0,
    teslaHunter: true,   // il thésaurise… y compris les fragments
    enlistPriority: [1, 2, 0, 3],   // pièces puis pop
    buildPriority: ["moulin", "memorial", "gare", "arsenal"],
  },
};

// ═══ PIVOT STRATÉGIQUE — savoir renoncer à son plan ═══════════════════
// Scythe demande de RÉADAPTER sa stratégie : un plan agressif qui n'a rien
// donné au milieu du jeu doit céder la place à un repli qui sauve le score
// final. Les bots s'entêtaient dans leur profil de départ du premier au
// dernier tour ; un humain, lui, mesure la proximité de la fin, constate que
// son plan ne paie pas, et bascule sur ce qu'il peut encore engranger :
// palier de popularité, territoires tenus, ressources en main.
//
// Diagnostic (`shouldPivot`) : la fin approche ET je suis nettement distancé
// ET mon plan n'a rien produit de tangible (pas d'étoiles de combat pour un
// agressif, pas de moteur pour les autres).
// Seuil calibré en simulation : à 0,65 le repli arrivait trop tard (les bots
// s'obstinaient et finissaient au palier ×1) ; à 0,75 il attrape les plans
// réellement compromis sans déclencher au moindre retard. Le repli conserve
// `starRush` : renoncer aux RISQUES, pas aux étoiles encore à portée.
export const PIVOT_RATIO = 0.75;
// v0.16 — le pivot n'arrivait qu'avec `endgame` (un adversaire à 5 étoiles) :
// partie du 28/07, les 3 bots se replient au tour 24… sur 25. Un humain
// constate dès la MI-PARTIE que son plan ne paie pas. Le repli de mi-partie
// exige un décrochage plus net (0,55) pour ne pas paniquer au premier retard.
export const PIVOT_MID_RATIO = 0.55;

export const shouldPivot = (p, ctx, myScore) => {
  if (!ctx || ctx.bestOppScore == null) return false;
  // 1. Le repli se justifie : fin imminente (quelqu'un est à une étoile de
  //    conclure, ou la partie s'éternise), OU mi-partie constatée (tour 12+,
  //    ou un joueur déjà à 3 étoiles). (Attention : « J'AI 4 étoiles » ne
  //    doit PAS déclencher le repli — un bot fort aux étoiles doit foncer,
  //    pas battre en retraite ; cette confusion coûtait des étoiles gratuites.)
  const endNear = !!ctx.endgame || (ctx.round || 0) >= 30;
  const tableStars = Math.max(0, ...((ctx.allPlayers || []).map(op => (op && op.stars) || 0)));
  const midGame = (ctx.round || 0) >= 12 || tableStars >= 3;
  if (!endNear && !midGame) return false;
  // 2. Je n'ai plus de route vers la victoire aux étoiles : à 4-5 étoiles la
  //    course reste jouable, on ne se replie pas.
  if ((p.stars || 0) >= 4) return false;
  // 3. Je suis nettement distancé au score (seuil plus dur en mi-partie)
  if (myScore >= ctx.bestOppScore * (endNear ? PIVOT_RATIO : PIVOT_MID_RATIO)) return false;
  // 4. Et mon plan n'a rien produit de tangible : un agressif sans la moindre
  //    victoire au combat s'obstine dans le vide ; un constructif sans étoiles
  //    n'a pas de moteur.
  const prof = BOT_PROFILES[p.botProfile] || BOT_PROFILES.equilibre;
  const aggressive = prof.earlyAttack || (prof.aggroMargin ?? 2) <= 0;
  if (aggressive) return (p.combatWins || 0) === 0;
  return (p.stars || 0) <= 2;
};

// Profil EFFECTIF du tour : le profil de base, éventuellement replié.
// Le repli ne change pas de personnalité, il change d'OBJECTIF : ne plus
// courir après des étoiles hors d'atteinte, mais maximiser ce qui se compte
// à la fin — palier de popularité (multiplie tout), territoires, ressources.
export const effectiveProfile = (p, ctx, myScore) => {
  const base = BOT_PROFILES[p.botProfile] || BOT_PROFILES.equilibre;
  if (!shouldPivot(p, ctx, myScore)) return base;
  return {
    ...base,
    pivoted: true,
    name: `${base.name} (repli)`,
    popTarget: 13,                       // viser le palier ×3
    tradePopBoost: (base.tradePopBoost || 0) + 5,
    chasePopStar: false,                 // l'étoile 18 pop reste hors sujet
    aggroMargin: (base.aggroMargin ?? 2) + 5, // on ne cherche plus le combat
    attackReward: Math.floor((base.attackReward || 6) / 2),
    earlyAttack: false,
    // Attention à la cohérence interne : Produire coûte 1 popularité dès
    // 6 ouvriers et Déplacer expose aux péages — sur-booster ces deux actions
    // annulait le gain de palier que le repli vient précisément chercher
    // (mesuré : palier ×1 des derniers 9,7 % → 18 %). On reste sobre.
    produceBoost: (base.produceBoost || 0) + 1,
    moveBoost: (base.moveBoost || 0) + 1,       // étaler pour tenir du terrain
    disruption: 0,                       // plus de razzia coûteuse en pop
    lootPull: 0,
    // starRush conservé : une étoile reste la meilleure affaire du jeu
    // (×3 à ×5 points selon le palier) — le repli renonce aux RISQUES, pas
    // aux étoiles encore à portée de main.
  };
};

// Pondérations par faction (mesurées/ajustées au simulateur) : chaque partie
// tire un profil au sort → d'une partie à l'autre, la même faction ne joue
// pas pareil.
export const FACTION_PROFILE_WEIGHTS = {
  // Confédération : v0.15 — le profil « bâtisseur » (pacifiste, moteur de
  // popularité) était l'exact contraire de son identité et lui était attribué
  // dans ~40 % de ses parties : mesurée 41 % de dernières places. Elle joue
  // désormais son plan — harcèlement mobile, razzia, déni de développement.
  confederation: { harceleur: 3, blitz: 2, equilibre: 1 },
  // Frente : guérilla — le héros sème 4 pièges (territoires gratuits + déni),
  // ses ouvriers tiennent sierras et déserts, et Peuple Armé lui donne +1 carte
  // quand elle défend SUR ses propres ouvriers. Elle tient son terrain plus
  // qu'elle ne conquiert : profils patients, pas de razzia.
  frente: { equilibre: 2, thesauriseur: 1, batisseur: 1 },
  // Nations : expansion sur plaines et forêts (son objectif de faction), avec
  // Ronin (+1 carte quand un mecha est SEUL) et des mechas en bois.
  nations: { equilibre: 2, batisseur: 1, blitz: 1 },
  // Acadiane : commerçante insaisissable — White Flag lui permet de REFUSER
  // le combat (retraite + 2 pop), donc elle ne se bat jamais volontairement ;
  // elle essaime ses comptoirs et thésaurise. Le bâtisseur (course à la pop)
  // reste cohérent avec elle, contrairement aux factions guerrières.
  acadiane: { thesauriseur: 2, batisseur: 2, equilibre: 1 },
  // Bayou : le prédateur (v0.15) — le profil « bâtisseur » pacifiste n'avait
  // aucun sens pour une faction dont l'ability, le combat et l'objectif
  // tournent tous autour de la chasse aux mechas.
  bayou: { predateur: 3, blitz: 2, equilibre: 1 },
  dominion: { equilibre: 2, thesauriseur: 2, blitz: 1 },
};

// ── Méta-stratégie de plateau ──
// Comme les joueurs qui savent que « la Crimée est avantagée sur ce plateau »
// et l'attaquent tôt pour ralentir son développement : a priori de menace par
// faction sur la carte physique, mesuré par simulation (winrates). S'ajoute au
// leader dynamique (étoiles/pop/pièces en cours de partie) dans le ciblage.
export const MAP_META_THREAT = {
  acadiane: 3, frente: 2, nations: 2,
  // Confédération : voisine dangereuse qu'on ne laisse pas prospérer — les
  // autres factions la traitent comme une menace (elle vit de leurs ouvriers)
  confederation: 3,
  bayou: 0, dominion: 0,
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
