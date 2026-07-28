/**
 * Structured game rules data for Scythe: Panamerica
 */

export const RULES = [
  {
    id: "overview",
    title: "Aperçu",
    icon: "📜",
    sections: [
      {
        title: "Contexte",
        content: "Dans un passé alternatif, l'Empire mécanique s'est effondré, laissant derrière lui des colosses rouillés et une terre marquée par la guerre. Les factions du Nouveau Monde s'affrontent pour le contrôle des territoires, des ressources et de l'héritage technologique de Wardenclyffe."
      },
      {
        title: "Objectif",
        content: "Être le joueur avec le plus de pièces à la fin de la partie. La partie se termine lorsqu'un joueur place sa 6ème étoile sur le plateau de triomphes."
      },
      {
        title: "Étoiles (Triomphes)",
        content: "Vous gagnez des étoiles en accomplissant ces exploits :",
        list: [
          "Atteindre 16 Puissance",
          "Atteindre 18 Popularité",
          "Compléter les 6 Upgrades",
          "Déployer les 4 Mechas",
          "Construire les 4 Bâtiments",
          "Recruter les 4 Enrôlés",
          "Avoir 8 Ouvriers sur le plateau",
          "Gagner un combat (max 2 étoiles)",
          "Compléter un Objectif secret",
          "Compléter l'Objectif de Faction"
        ]
      },
      {
        title: "Fin de tour & révélation d'objectifs",
        content: "Chaque tour se conclut par une étape de validation (« Terminer le tour »). C'est à ce moment — et seulement là — que se révèlent la Mission secrète et l'Objectif de faction dont la condition est remplie : révéler pose l'étoile et termine le tour au passage. Un « ! » sur la barre des triomphes signale qu'un objectif est prêt. Les missions secrètes combinent 2-3 conditions, souvent avec une contrainte (plafond de pièces, zéro mecha…) : l'étoile se construit, elle ne tombe pas toute seule. Le deck de missions du Scythe original existe en réserve — déblocage prévu dans le mode campagne."
      }
    ]
  },
  {
    id: "panamerica",
    title: "Spécificités Panamerica",
    icon: "🌎",
    sections: [
      {
        title: "Nouveau Monde",
        content: "Scythe: Panamerica transpose le conflit dans les Amériques. La carte, les factions, les terrains et les mécaniques sont adaptés à ce nouveau cadre uchronique."
      },
      {
        title: "Terrains Uniques",
        list: [
          "Sierra 🏔 — produit du Métal (remplace Montagne)",
          "Désert 🏜 — produit du Pétrole (remplace Toundra)",
          "Plaine 🌿 — produit de la Nourriture",
          "Forêt 🌲 — produit du Bois",
          "Village 🏘 — recrute des Ouvriers",
          "Lac 〰 — infranchissable (sauf capacités spéciales)",
          "Marécage ≋ — pas de ressource. Franchissable par tous, mais la traversée se paie : -1 Popularité par ouvrier, -1 Puissance par héros/mecha, et l'unité doit s'y arrêter"
        ]
      },
      {
        title: "L'Empire Mécanique (PvE)",
        content: "Contrairement au Scythe original, Panamerica ajoute des mechas de l'Empire comme ennemis PvE. 6 colosses rouillés occupent la carte au début. Ils tirent une carte de combat aléatoire (puissance 1-12). Les vaincre rapporte des récompenses et contribue à certains objectifs de faction."
      },
      {
        title: "Réseau de Rails",
        content: "Un réseau ferroviaire partagé entre tous les joueurs. La carte démarre sans aucun rail : construire une Gare pose 3 segments de rails, chaque segment devant partir de la Gare ou d'un rail existant (réseau connexe), jamais sur un lac ou un marécage. Une unité qui COMMENCE son déplacement sur le réseau peut rouler vers n'importe quel hex relié : le trajet en train coûte 1 PAS de déplacement (avec Vitesse, il reste donc 1 pas pour sortir du réseau). Entrer sur un rail en cours de déplacement ne donne pas accès au réseau ce tour-ci : on monte à bord un tour, on roule au suivant."
      },
      {
        title: "Rouge River & Cartes d'Usine",
        content: "L'Usine centrale (Rouge River) expose au départ (nb joueurs + 1) cartes du deck Ford. Chaque visiteur en choisit UNE : elle devient une 5e action sur son plateau (haut : 1 coût → 1 gain · bas : déplacer 1 unité de 2 hex).",
        list: [
          "Deck Ford — 12 cartes d'action ; l'offre (joueurs + 1) est FACE CACHÉE et ne se découvre qu'en arrivant à l'Usine",
          "Prototypes Tesla — 2 cartes plus puissantes, EN VITRINE (visibles de tous) ; les prendre CONSOMME 2 Fragments Tesla",
          "Vitrine — cliquer l'Usine (hex central) montre les prototypes Tesla et le nombre de cartes Ford restantes",
          "Fragments Tesla — rencontres (🔬) ou combats contre l'Empire (si présent). Une seule carte par joueur : prendre une Ford ferme définitivement l'accès Tesla"
        ]
      },
      {
        title: "Jetons de Faction",
        content: "Certaines factions possèdent des jetons spéciaux posés automatiquement :",
        list: [
          "Frente Libre — Traps (Tierra Minada) : posés quand le héros se déplace. Infligent -3 Puissance aux ennemis qui marchent dessus (max 4)",
          "Acadiane — Comptoirs : posés quand le héros se déplace. Comptent comme territoire au scoring (max 4)",
          "Les deux types de jetons contribuent aux Objectifs de Faction respectifs"
        ]
      },
      {
        title: "Capture & Méchas",
        content: "Le Bayou peut capturer des mechas ennemis. La Confédération peut capturer des ouvriers ennemis. Ces mécaniques uniques alimentent leurs objectifs de faction respectifs."
      }
    ]
  },
  {
    id: "turn",
    title: "Tour de Jeu",
    icon: "🔄",
    sections: [
      {
        title: "Structure d'un Tour",
        content: "À votre tour, choisissez UNE colonne de votre plateau joueur. Exécutez l'action du haut (optionnel), puis l'action du bas (optionnel). Vous ne pouvez pas choisir la même colonne deux tours de suite."
      },
      {
        title: "Actions du Haut",
        list: [
          "Move — Déplacer jusqu'à 2 unités d'1 hex chacune",
          "Bolster — Payer 1$ pour +2 Puissance OU +1 Carte Combat",
          "Produce — Payer le coût et produire des ressources sur 2 hex avec ouvriers",
          "Trade — Payer 1$ pour +2 ressources au choix OU +1 Popularité"
        ]
      },
      {
        title: "Actions du Bas",
        list: [
          "Upgrade — Déplacer un cube du haut vers le bas (améliore les deux)",
          "Deploy — Déployer un mecha sur un hex avec un ouvrier",
          "Build — Construire un bâtiment sur un hex avec un ouvrier",
          "Enlist — Recruter un enrôlé (bonus ongoing pour vous et vos voisins)"
        ]
      }
    ]
  },
  {
    id: "movement",
    title: "Mouvement",
    icon: "🚶",
    sections: [
      {
        title: "Règles de Base",
        content: "Chaque unité peut se déplacer d'1 hex par action Move. Vous ne pouvez pas traverser les rivières sauf avec Riverwalk (capacité de mecha) ou certains plans. Les lacs sont infranchissables. Exception : l'Usine Rouge River a ses ponts — on peut toujours y entrer malgré les rivières."
      },
      {
        title: "Marécages (péage)",
        content: "Tout le monde peut entrer sur un marécage, mais la traversée coûte -1 Popularité par ouvrier et -1 Puissance par unité de combat (héros ou mecha) qui y entre — les ouvriers transportés par un mecha paient aussi. Impossible de le traverser sans s'arrêter : même avec un déplacement de 2 hex, l'unité est stoppée sur le marécage."
      },
      {
        title: "La Base (drapeau)",
        content: "Votre héros démarre sur votre base — un « hex invisible » sous votre drapeau, hors du plateau. Il en sort au 1er déplacement (vers l'hex terrestre adjacent). Toute unité vaincue au combat y retourne (sauf capacité spéciale de recul). Seul le propriétaire peut entrer sur sa base ; elle ne compte pas comme territoire au score."
      },
      {
        title: "Riverwalk",
        content: "Chaque faction a une capacité de traversée de rivière spécifique, débloquée avec un mecha :",
        list: [
          "Confédération (Gué) — Plaine ↔ Village",
          "Frente Libre (Sentier) — Sierra ↔ Désert",
          "Nations Souv. (Piste) — Plaine ↔ Forêt",
          "Acadiane (Portage) — Forêt ↔ Village",
          "Bayou (Mangrove) — Désert ↔ Village",
          "Dominion (Queen's Road) — Forêt ↔ Plaine"
        ]
      },
      {
        title: "Transport",
        content: "Les ouvriers présents sur le même hex qu'un mecha ou le héros sont transportés lors du déplacement de cette unité."
      },
      {
        title: "Rails",
        content: "Les rails (réseau partagé) permettent de rejoindre n'importe quel hex relié pour 1 pas de déplacement, à condition de COMMENCER son déplacement sur le réseau (entrer sur un rail en cours de route ne donne l'accès qu'au tour suivant). Construire une Gare pose 3 segments de rails, connectés à la Gare ou au réseau existant, jamais sur lac/marécage."
      }
    ]
  },
  {
    id: "combat",
    title: "Combat",
    icon: "⚔",
    sections: [
      {
        title: "Déclenchement",
        content: "Le combat se déclenche quand votre héros ou mecha entre sur un hex occupé par une unité adverse (héros ou mecha). Les ouvriers ne déclenchent pas de combat."
      },
      {
        title: "Résolution",
        content: "Chaque joueur dépense secrètement de la Puissance (0 à 7) et des Cartes Combat (valeur 2-5 chacune). Le total le plus élevé gagne. En cas d'égalité, l'attaquant gagne."
      },
      {
        title: "Conséquences",
        content: "Le perdant retire toutes ses unités (héros, mechas, ouvriers) de l'hex. Les ouvriers retournent sur la base. Le vainqueur gagne une étoile de combat (max 2). Le perdant gagne +1 Carte Combat par unité retirée."
      },
      {
        title: "Capacités de Combat (Mecha #3)",
        content: "Chaque faction a une capacité de combat unique, débloquée avec le 3ème mecha :",
        list: [
          "Confédération — Cavaliers : +2 Puissance si attaquant",
          "Frente Libre — Peuple Armé : +1 Carte si ≥1 ouvrier allié sur l'hex",
          "Nations Souv. — Ronin : +1 Carte si mecha seul (0 ouvrier allié)",
          "Acadiane — White Flag : Peut refuser le combat (retraite + 2 Pop)",
          "Bayou — Flibuste : Victoire → perdant donne 2 pièces",
          "Dominion — Discipline : +2 Puissance si plus de Cartes Combat que l'adversaire"
        ]
      }
    ]
  },
  {
    id: "empire",
    title: "L'Empire",
    icon: "🏛",
    sections: [
      {
        title: "Mechas de l'Empire",
        content: "6 mechas de l'Empire commencent sur la carte. Ils ne bougent pas sauf via les Rails de l'Empire. Attaquer un mecha de l'Empire déclenche un combat spécial."
      },
      {
        title: "Combat PvE",
        content: "L'Empire tire une carte de combat (puissance 1-12). Vous dépensez Puissance + Cartes Combat pour le vaincre. Si vous gagnez, le mecha est détruit et vous gagnez une récompense. Si vous perdez, votre unité est repoussée."
      },
      {
        title: "Cartes de l'Empire",
        list: [
          "Écho Rouillé (1) — Sentinelle Aveugle (2) — Patrouilleur Usé (2)",
          "Gardien de Route (3) — Broyeur de Fer (4) — Marcheur d'Acier (5)",
          "Titan Errant (6) — Colosse de l'Aube (7) — Vengeur de l'Empire (8)",
          "Bête de Wardenclyffe (9) — Le Dernier Ordre (10) — Golem Fantôme (12)"
        ]
      }
    ]
  },
  {
    id: "resources",
    title: "Ressources & Production",
    icon: "⚙",
    sections: [
      {
        title: "Types de Ressources",
        list: [
          "Bois 🪵 — produit en Forêt",
          "Métal ⚙ — produit en Sierra",
          "Pétrole 🛢 — produit en Désert",
          "Nourriture 🌽 — produit en Plaine"
        ]
      },
      {
        title: "Production",
        content: "L'action Produce vous permet de produire sur jusqu'à 2 hex où vous avez des ouvriers. Chaque ouvrier sur l'hex produit 1 ressource du type du terrain. Le coût de production augmente avec le nombre d'ouvriers sur le plateau (0-1: gratuit, 2-3: -1 Pui/-1$/−1 Pop, etc.)."
      },
      {
        title: "Ressources sur la Carte",
        content: "Les ressources restent sur leur hex. Vous les contrôlez tant que vous avez une unité sur l'hex. Si un adversaire prend l'hex, il contrôle vos ressources."
      }
    ]
  },
  {
    id: "buildings",
    title: "Bâtiments",
    icon: "🏗",
    sections: [
      {
        title: "Types de Bâtiments",
        list: [
          "Arsenal 🏰 — +1 Puissance quand Bolster",
          "Mémorial 🪦 — +1 Popularité quand Bolster",
          "Gare 🚂 — Pose 3 rails (réseau partagé entre tous les joueurs)",
          "Moulin 🌀 — L'hex produit +1 ressource lors de Produce"
        ]
      },
      {
        title: "Règles de Construction",
        content: "Construisez sur un hex où vous avez un ouvrier. Un seul bâtiment par hex. Les bâtiments comptent comme territoire pour le scoring final. Le bâtiment reste même si vos unités quittent l'hex."
      }
    ]
  },
  {
    id: "enlist",
    title: "Enrôlement",
    icon: "🤝",
    sections: [
      {
        title: "Bonus immédiat + Bonus permanent",
        content: "Recruter sur une colonne donne DEUX bonus (comme dans Scythe) : un bonus immédiat une fois, puis un bonus permanent d'un type différent. Le bonus permanent se déclenche chaque fois que vous OU un voisin de table effectuez cette action du bas :",
        list: [
          "Upgrade — immédiat +2 Pièces, puis permanent +1 Puissance",
          "Deploy — immédiat +2 Popularité, puis permanent +1 Pièce",
          "Build — immédiat +2 Cartes, puis permanent +1 Popularité",
          "Enlist — immédiat +2 Puissance, puis permanent +1 Carte Combat"
        ]
      }
    ]
  },
  {
    id: "encounters",
    title: "Rencontres",
    icon: "❓",
    sections: [
      {
        title: "Fonctionnement",
        content: "Des jetons de rencontre sont disséminés sur la carte. Quand votre héros s'arrête sur un hex avec un jeton, vous résolvez une rencontre : 3 choix vous sont proposés, chacun avec un effet différent (ressources, puissance, popularité, pièces, etc.)."
      },
      {
        title: "Emplacements",
        content: "9 hex de rencontre sont répartis sur la carte. Chaque jeton ne peut être résolu qu'une seule fois."
      }
    ]
  },
  {
    id: "rouge_river",
    title: "Rouge River (Usine)",
    icon: "🏭",
    sections: [
      {
        title: "L'Usine Centrale",
        content: "L'hex central (Rouge River, id 22) est l'ancienne usine de l'Empire. Au début de la partie, (nb joueurs + 1) cartes du deck Ford sont tirées au hasard et posées FACE CACHÉE sur l'Usine — on ne les découvre qu'en y arrivant. La première fois que votre héros y arrive, vous choisissez UNE carte parmi celles qui restent — course à l'Usine : le premier arrivé a l'embarras du choix, le dernier prend ce qui reste."
      },
      {
        title: "La carte d'usine = une 5e action",
        content: "Votre carte d'usine s'ajoute à votre plateau comme une colonne d'action supplémentaire, jouable au lieu des 4 autres (et comme elles, pas deux tours de suite) :",
        list: [
          "HAUT — payer 1 coût (pièces, puissance, popularité ou carte de combat) → recevoir 1 gain (pièces, pop, puissance, amélioration/recrue/bâtiment/mecha gratuits, production…)",
          "BAS — déplacer 1 unité de 2 hex (+1 si la capacité Vitesse est débloquée)",
          "Comme les autres colonnes : haut seul (si payable), bas seul, ou les deux — en commençant par le haut",
          "Les gains « si ouvrier » (bâtiment, mecha, ressources, production) se posent sur un hex portant un de vos ouvriers"
        ]
      },
      {
        title: "Prototypes Tesla",
        content: "2 cartes du deck Tesla (5 cartes plus puissantes, même structure) sont EN VITRINE : contrairement à l'offre Ford face cachée, elles sont VISIBLES DE TOUS dès le début (cliquer l'Usine) — c'est la carotte de la quête des fragments. Les prendre exige 2 Fragments Tesla, CONSOMMÉS à la prise (rencontres 🔬, combats contre l'Empire s'il est présent). Et comme chaque joueur ne choisit qu'UNE carte à sa première visite, prendre une carte Ford ferme définitivement l'accès aux prototypes : la quête Tesla, c'est réunir 2 fragments en évitant l'Usine tout ce temps."
      },
      {
        title: "Le deck original",
        content: "Les 12 cartes d'usine du jeu original existent dans les données (deck « original ») mais restent de côté pour l'instant — elles seront débloquées comme récompense dans le mode campagne."
      }
    ]
  },
  {
    id: "factions",
    title: "Factions",
    icon: "🏴",
    sections: [
      {
        title: "Confédération",
        content: "Héros: J. Cole & Dixie | ⚡4 🃏1",
        list: [
          "Ability: Servitude — capacité spéciale de faction",
          "Riverwalk (Gué): Plaine ↔ Village",
          "Combat: Cavaliers (+2 Pui si attaquant)",
          "Objectif de Faction: Le Joug — 2 ouvriers capturés + 3+ hex avec ouvriers"
        ]
      },
      {
        title: "Frente Libre",
        content: "Héros: E. Rojas & Trueno | ⚡2 🃏3",
        list: [
          "Ability: Tierra Minada — pose des pièges sur la carte",
          "Riverwalk (Sentier): Sierra ↔ Désert",
          "Combat: Peuple Armé (+1 Carte si ouvrier allié sur hex)",
          "Objectif de Faction: Terre Libérée — 4 Traps + 3 ouvriers sur Sierras/Déserts"
        ]
      },
      {
        title: "Nations Souveraines",
        content: "Héros: Aiyana & Koda | ⚡3 🃏2",
        list: [
          "Ability: Esprit Sauvage — affinité avec la nature",
          "Riverwalk (Piste): Plaine ↔ Forêt",
          "Combat: Ronin (+1 Carte si mecha seul)",
          "Objectif de Faction: Le Grand Retour — 5+ hex Plaine/Forêt contrôlés"
        ]
      },
      {
        title: "Acadiane",
        content: "Héros: M. Thibodeau & Brume | ⚡1 🃏3",
        list: [
          "Ability: Comptoir — pose des comptoirs commerciaux",
          "Riverwalk (Portage): Forêt ↔ Village",
          "Combat: White Flag (peut refuser → retraite + 2 Pop)",
          "Objectif de Faction: Réseau Invisible — 4 Comptoirs + héros sur un Lac"
        ]
      },
      {
        title: "Bayou",
        content: "Héros: Cap. Zeke & Croc | ⚡2 🃏3",
        list: [
          "Ability: Chimère — capacité spéciale liée aux créatures",
          "Riverwalk (Mangrove): Désert ↔ Village",
          "Combat: Flibuste (victoire → perdant donne 2 pièces)",
          "Objectif de Faction: Le Prédateur — 1 mecha capturé + 2 Empire détruits"
        ]
      },
      {
        title: "Dominion (Extension)",
        content: "Héros: Col. Whitfield & Sterling | ⚡3 🃏2",
        list: [
          "Ability: Commerce Impérial — génère des pièces via le commerce",
          "Riverwalk (Queen's Road): Forêt ↔ Plaine",
          "Combat: Discipline (+2 Pui si plus de Cartes Combat que l'adversaire)",
          "Objectif de Faction: Le Tribut — 10+ pièces via Commerce Impérial"
        ]
      }
    ]
  },
  {
    id: "scoring",
    title: "Scoring Final",
    icon: "🏆",
    sections: [
      {
        title: "Paliers de Popularité",
        content: "Votre popularité détermine le multiplicateur pour vos étoiles, territoires et ressources :",
        list: [
          "Palier 1 (0-6 Pop) — Étoiles ×3 | Territoires ×2 | Ressources ×1",
          "Palier 2 (7-12 Pop) — Étoiles ×4 | Territoires ×3 | Ressources ×2",
          "Palier 3 (13-18 Pop) — Étoiles ×5 | Territoires ×4 | Ressources ×3"
        ]
      },
      {
        title: "Calcul du Score",
        list: [
          "Étoiles × multiplicateur de popularité",
          "Territoires (hex avec unités/bâtiments) × multiplicateur",
          "Paires de ressources × multiplicateur",
          "+ Pièces en main",
          "= Score Total"
        ]
      },
      {
        title: "Territoire",
        content: "Un hex que vous contrôlez (avec une unité ou un bâtiment). L'Usine (Rouge River) compte pour 3 territoires. Les pièges du Frente et les comptoirs d'Acadiane comptent aussi."
      }
    ]
  }
];
