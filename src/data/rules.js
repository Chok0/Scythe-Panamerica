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
          "Gagner un combat (max 2 étoiles)",
          "Compléter un Objectif secret",
          "Compléter l'Objectif de Faction"
        ]
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
          "Marécage ≋ — terrain spécial, pas de ressource"
        ]
      },
      {
        title: "L'Empire Mécanique (PvE)",
        content: "Contrairement au Scythe original, Panamerica ajoute des mechas de l'Empire comme ennemis PvE. 6 colosses rouillés occupent la carte au début. Ils tirent une carte de combat aléatoire (puissance 1-12). Les vaincre rapporte des récompenses et contribue à certains objectifs de faction."
      },
      {
        title: "Réseau de Rails",
        content: "Un réseau ferroviaire partagé entre tous les joueurs. Construire une Gare pose 3 segments de rails. Les rails permettent le déplacement instantané entre hex connectés. L'Empire possède aussi ses propres rails."
      },
      {
        title: "Rouge River & Plans",
        content: "L'Usine centrale (Rouge River) propose 2 types de plans au lieu d'un :",
        list: [
          "Plans Ford — 5 plans utilitaires, toujours accessibles",
          "Plans Tesla — 5 plans puissants, accessibles uniquement avec 2 Fragments Tesla",
          "Fragments Tesla — obtenus via rencontres ou récompenses de combat PvE"
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
        content: "Chaque unité peut se déplacer d'1 hex par action Move. Vous ne pouvez pas traverser les rivières sauf avec Riverwalk (capacité de mecha) ou certains plans. Les lacs sont infranchissables."
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
        content: "Les rails (réseau partagé) permettent le déplacement instantané entre les hex reliés. Construire une Gare pose 3 segments de rails."
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
        title: "Bonus Ongoing",
        content: "Quand vous recrutez un enrôlé, vous choisissez une colonne du bas. Désormais, chaque fois que vous OU un voisin de table effectuez cette action du bas, vous recevez le bonus :",
        list: [
          "Colonne Upgrade — +1 Puissance",
          "Colonne Deploy — +1 Pièce",
          "Colonne Build — +1 Popularité",
          "Colonne Enlist — +1 Carte Combat"
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
        content: "L'hex central (Rouge River, id 22) est l'ancienne usine de l'Empire. Quand votre héros y arrive, vous pouvez choisir un Plan parmi 2 catégories :"
      },
      {
        title: "Plans Ford",
        content: "5 plans utilitaires inspirés de la production de masse :",
        list: [
          "Model M — Produce ×2 par ouvrier / Deploy à prix réduit",
          "Trimotor — Move 3 hex (ignore rivières) / Upgrade à prix réduit",
          "River Rouge Special — Téléport ressources / Build à prix réduit",
          "Iron Horse — Move → Mine gratuit / Enlist à prix réduit",
          "Five Dollar Day — Pop + ouvrier / Upgrade profitable"
        ]
      },
      {
        title: "Plans Tesla",
        content: "5 plans puissants inspirés de la technologie Tesla :",
        list: [
          "Golem — Move mecha à distance / Deploy + Puissance",
          "L'Onde Tesla — Aura de puissance / Build sans ouvrier",
          "Éclair — Move mecha 4 hex / Bolster gratuit",
          "Le Blueprint Perdu — Copie action du haut / Enlist étendu",
          "Réseau Neuronal — Move tous mechas / Deploy adjacence"
        ]
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
