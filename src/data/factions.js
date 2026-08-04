import { hMap, ADJ } from './hexes.js';
import { heldHexes } from './control.js';

// Règle Scythe respectée à la lettre : la fiche de faction ne porte QUE le
// militaire (puissance et cartes de combat). Popularité et pièces de départ
// viennent exclusivement du plateau joueur (mats.js). Des compensations par
// puissance/cartes ont été testées en A/B (RAPPORT_SIMULATION.md §v10) :
// effet ≤ bruit statistique — les valeurs ci-dessous restent donc celles de
// l'identité de chaque faction ; l'écart de winrate restant est structurel
// (économie/géographie), pas une affaire de stats de départ.
export const FACTIONS = {
  confederation: {
    name: "Confédération", color: "#808080", hero: "J. Cole", companion: "Dixie",
    power: 4, cards: 1, workerHex: [36, 32],
    // v0.15 — check-up des riverwalks (scripts/riverwalkAudit.mjs). Critère :
    // un riverwalk doit ouvrir au moins une SORTIE de l'îlot de départ, sinon
    // c'est une capacité morte. Îlot Confédération = {29 forêt, 32 sierra,
    // 36 village} ; ses seules sorties par rivière sont #29→#26 (plaine, qui
    // mène à l'Usine) et #36→#40 (désert, qui mène au village #46). Le Gué
    // ouvre donc exactement les deux axes de razzia du harceleur.
    riverwalk: ["plaine", "desert"], rwName: "Gué",
    ability: "Servitude", abilityDesc: "Capture les ouvriers ennemis vaincus (-2 Pop, max 2)",
    fObj: {
      name: "Le Joug", desc: "2 ouvriers capturés + 3+ hex avec ouvriers",
      check: p => (p.capturedWorkers || 0) >= 2 && p.workers.length >= 3,
    },
  },
  frente: {
    name: "Frente Libre", color: "#A05020", hero: "E. Rojas", companion: "Trueno",
    power: 2, cards: 3, workerHex: [41, 45],
    // v0.15 — « sierra » n'ouvrait aucune sortie depuis son îlot {41, 45, 46}
    // (la sierra, elle l'a déjà chez elle) : le Sentier passe aux montagnes
    // (2 sorties : #41→#37, #46→#37) et garde le désert (#46→#40).
    riverwalk: ["montagne", "desert"], rwName: "Sentier",
    ability: "Tierra Minada", abilityDesc: "Le héros pose un piège sur chaque hex atteint (max 4)",
    // v0.15 — mesuré à 8 % de réussite. L'échange d'hexes 38 ↔ 30 (hexes.js)
    // a transformé #38 en champs : le plateau ne compte plus que DEUX sierras
    // (#32 et #45) et trois déserts, et #38 était justement la sierra voisine
    // de son départ. Poser 3 ouvriers dessus était devenu hors de portée.
    // Le seuil descend à 2 — les 4 pièges restent le vrai travail.
    fObj: {
      name: "Terre Libérée", desc: "4 Traps + 2 ouvriers sur Sierras/Déserts",
      check: p => (p.trapTokens || []).length >= 4 && p.workers.filter(w => {
        const h = hMap[w.hexId];
        return h && (h.t === "sierra" || h.t === "desert");
      }).length >= 2,
    },
  },
  nations: {
    name: "Nations Souv.", color: "#20B2AA", hero: "Aiyana", companion: "Koda",
    power: 3, cards: 2, workerHex: [10, 17],
    // v0.15 — capacité MORTE mesurée : depuis son îlot {10 forêt, 14 village,
    // 17 plaine}, NI la forêt NI le désert n'ouvrent le moindre passage (elle
    // a déjà sa forêt chez elle, et aucun désert ne touche sa frontière). Ses
    // trois seules sorties sont la plaine (#10→#7, #14→#7), la montagne
    // (#17→#21, #14→#21) et la toundra (#14→#11). La Piste prend la plaine —
    // le terrain même de son objectif « Le Grand Retour » — et la toundra,
    // son unique accès au pétrole (elle a déjà le bois, et l'Esprit Sauvage
    // lui épargne le métal pour ses mechas).
    riverwalk: ["plaine", "toundra"], rwName: "Piste",
    ability: "Esprit Sauvage", abilityDesc: "Déploie ses mechas avec du bois ou du métal",
    deployAltRes: "bois", deployAltName: "Esprit Sauvage",
    // v0.15 — mesuré à 2 % de réussite, l'objectif le plus mort du jeu. Un
    // joueur contrôle 5,5 hexes en moyenne en fin de partie : en exiger 5 d'un
    // couple de terrains précis revenait à demander un plateau parfait. Le
    // seuil passe à 4, ce qui reste un vrai plan (elle en tient 2 au départ,
    // #10 forêt et #17 plaine) mais devient atteignable — d'autant que la
    // Piste ouvre désormais la plaine (#10→#7, #14→#7), sa voie naturelle.
    fObj: {
      name: "Le Grand Retour", desc: "4+ hex Plaine/Forêt contrôlés",
      check: p => {
        const u = new Set([p.hero, ...p.workers.map(w => w.hexId), ...p.mechs.map(m => m.hexId)]);
        return [...u].filter(id => {
          const h = hMap[id];
          return h && (h.t === "plaine" || h.t === "foret");
        }).length >= 4;
      },
    },
  },
  acadiane: {
    name: "Acadiane", color: "#228B22", hero: "M. Thibodeau", companion: "Brume",
    // Profil « Pologne » : commerçante polyvalente. Pas de métal sur sa
    // péninsule → elle doit financer ses premiers Trade (métal pour déployer
    // et sortir par Portage, ou Gare) : les pièces de départ viennent du
    // plateau joueur comme pour tout le monde (l'ancien départ absolu
    // 2$/1♥ la laissait hors jeu : 9% de winrate mesuré).
    // Départ militaire aligné sur la Pologne de Scythe (2 Pui / 3 cartes) :
    // à 1/1 elle était le sac de frappe du plateau
    power: 2, cards: 3, workerHex: [2, 6],
    // v0.15 — capacité MORTE : ni forêt ni village n'ouvraient de passage
    // depuis sa péninsule {2 toundra, 6 village, 9 forêt}. Elle n'a QUE deux
    // sorties terrestres sur tout le plateau — #9→#12 (plaine) et #9→#16
    // (montagne, son métal) — et le Portage ouvre désormais les deux. C'est
    // la faction la plus enclavée du jeu : sortir de l'îlot EST son enjeu,
    // par le Portage, par un Trade ou par une Gare.
    riverwalk: ["plaine", "montagne"], rwName: "Portage",
    // Vapeur des Lacs (v0.12) : réponse au verrou structurel mesuré en
    // simulation — pas de métal natif sur la péninsule {2,6,9} → mechas
    // 1,6/4 et ~18 % de winrate. Sa toundra (#2) produit du pétrole dès le
    // tour 1 : les machines lacustres se déploient à la vapeur.
    ability: "Comptoir & Vapeur des Lacs",
    abilityDesc: "Comptoir : le héros pose un comptoir sur chaque hex atteint (max 4, +1 territoire et +2$ chacun au scoring) · Vapeur des Lacs : déploie ses mechas avec du pétrole au lieu du métal",
    deployAltRes: "petrole", deployAltName: "Vapeur des Lacs",
    // v0.15 — mesuré à 3 % de réussite, puis 2 % après un premier assouplis-
    // sement : le vrai verrou n'était pas le nombre de comptoirs mais la
    // condition « héros SUR un lac », un INSTANTANÉ de fin de partie. Il
    // fallait que le héros se trouve encore sur un lac au décompte, alors
    // qu'il n'y entre qu'avec le Batelier (slot 3) et qu'il a mille raisons
    // d'en repartir. On garde les deux piliers de l'identité — un réseau
    // ÉTALÉ et la maîtrise des lacs — mais sous forme d'ACQUIS durable :
    // un comptoir posé sur un lac reste posé.
    fObj: {
      name: "Réseau Invisible", desc: "4 Comptoirs non adjacents entre eux, dont 1 sur un Lac",
      check: p => {
        const flags = p.flagTokens || [];
        if (flags.length < 4) return false;
        if (!flags.some(fl => hMap[fl.hexId]?.t === "lac")) return false;
        const ids = flags.map(f => f.hexId);
        return !ids.some((a, i) => ids.slice(i + 1).some(b => (ADJ[a] || []).includes(b)));
      },
    },
  },
  bayou: {
    name: "Bayou", color: "#7B2D8B", hero: "Cap. Zeke", companion: "Croc",
    power: 2, cards: 3, workerHex: [35, 28],
    // v0.15 — le désert (#23) restait accessible, mais GRATUITEMENT par le
    // marécage #20 depuis que le Sang du Marais existe : le mettre dans le
    // riverwalk revenait à payer un mecha pour un passage déjà ouvert. La
    // Mangrove prend donc les champs — dont le #38 déplacé juste en face de
    // son village de départ (voir hexes.js) — et garde le village. Sa
    // nourriture est accessible, mais il faut la MÉRITER : déployer le mecha
    // Riverwalk ou poser une Gare (la forêt de son îlot lui donne le bois).
    riverwalk: ["champs", "village"], rwName: "Mangrove",
    // v0.15 — « Bois flotté » RETIRÉ : il faisait doublon avec l'Esprit
    // Sauvage des Nations (mêmes mechas en bois), diluant l'identité des deux
    // factions. Le verrou alimentaire du Bayou est réglé sur la CARTE
    // (échange des hexes 38 ↔ 30, voir hexes.js) et non par une capacité :
    // comme un joueur humain, il doit sortir de son îlot — commercer, poser
    // une Gare (la forêt de son départ le permet) ou déployer un mecha.
    //
    // v0.15 — ARBITRAGE de la capacité de faction. Trois candidates étaient
    // restées en suspens ; voici pourquoi c'est le marais qui l'emporte :
    //  · « Vol d'argent » est DÉJÀ la capacité de combat du mecha (Flibuste,
    //    slot 2) — la remonter en capacité de faction ferait doublon interne.
    //  · « Vol de mecha » (Chimère) est calquée sur la Servitude de la
    //    Confédération (capturer une unité sur victoire) : même reproche que
    //    Bois flotté / Esprit Sauvage. Elle est donc RÉTROGRADÉE au slot 2,
    //    fusionnée avec Flibuste : le pirate rançonne le vaincu (2 pièces) et,
    //    une fois par partie, remorque son épave.
    //  · Reste « circulation libre sur les marais » : active dès le tour 1
    //    comme toutes les vraies capacités de faction (Servitude, Tierra
    //    Minada, Esprit Sauvage, Comptoir), unique sur le plateau, et c'est
    //    l'analogue direct du « Seaworthy » nordique du jeu original.
    // Elle donne surtout au Bayou la sortie d'îlot que la carte lui promet :
    // le marécage #20 touche son #28 de départ SANS rivière, et ouvre #16
    // (montagne/métal) puis #23 (désert/pétrole) — également sans rivière.
    // Le mecha Pirogue (slot 3) devient l'étage supérieur de la même idée :
    // du marais on saute à N'IMPORTE quel autre marais du plateau.
    ability: "Sang du Marais",
    abilityDesc: "Vos unités traversent les marécages sans payer le péage (-1♥/-1⚡) et sans arrêt forcé, dès le tour 1 — c'est par là que le Bayou quitte son îlot sans franchir de rivière",
    // v0.15 — CORRECTIF : « 2 Empire détruits » rendait cet objectif
    // IMPOSSIBLE en partie standard, l'Empire étant désactivé par défaut
    // (mécanique réservée au mode campagne). Le Bayou perdait donc d'office
    // une étoile que toutes les autres factions pouvaient décrocher — première
    // cause de son 19 % de victoires. La prédation compte désormais les
    // mechas de l'Empire ET les victoires en combat contre les joueurs :
    // même esprit (le chasseur), jouable dans les deux modes.
    fObj: {
      name: "Le Prédateur", desc: "1 mecha capturé + 2 proies vaincues (Empire ou joueur)",
      check: p => (p.capturedMech || 0) >= 1 && ((p.empireKills || 0) + (p.combatWins || 0)) >= 2,
    },
  },
  dominion: {
    name: "Dominion", color: "#CC2222", hero: "Col. Whitfield", companion: "Sterling",
    power: 3, cards: 2, workerHex: [0, 4],
    // v0.15 — « montagne » n'ouvrait rien depuis son îlot {0 toundra,
    // 1 montagne, 4 village} : il a déjà la sienne à domicile. La Queen's
    // Road garde la forêt (#4→#8, #1→#8) et reprend la plaine (#0→#7,
    // #4→#7) : 4 passages, la route coloniale vers le centre du plateau.
    riverwalk: ["foret", "plaine"], rwName: "Queen's Road",
    ability: "Commerce Impérial", abilityDesc: "1×/tour : 1 ressource → 1💰 ou 1🃏 · Import : 2💰 → 1 ressource",
    isExtension: true,
    // v0.15 — à l'opposé exact : 76 % de réussite, une étoile quasi offerte.
    // Le Commerce Impérial rapporte 16,1$ en moyenne sur la partie, le seuil
    // de 10 était donc franchi passivement, sans le moindre plan. Il passe
    // au-dessus de la moyenne : il faut désormais BÂTIR son commerce.
    fObj: {
      name: "Le Tribut", desc: "20+ pièces via Commerce Impérial",
      check: p => (p.imperialCoins || 0) >= 20,
    },
  },

  // ═══ INTERNATIONALE NOIRE — faction de CAMPAGNE (chapitres 2 et 8) ═══
  // Spec : docs/design/internationale_noire.md · lore : lore_1920_plus.md §II.
  // Exclue de FACTION_IDS (voir plus bas) : elle n'entre jamais dans une
  // partie standard ni dans un tirage de bot — pas de héros, pas de base,
  // pas de mecha de série, une écologie de jeu entièrement différente.
  //
  // Les quatre chiffres ci-dessous suivent la fiche : la plus faible en duel
  // (2⚡, 1🃏), la plus nombreuse au départ (4 ouvriers), et un coussin de
  // popularité (plateau « Le Réseau », 4♥/3$) qui est sa monnaie de survie —
  // elle perd des ouvriers en permanence.
  internationale: {
    name: "Internationale Noire", color: "#9E3B4E",
    // Sans héros : c'est LA singularité de la faction. `hero: null` est lu
    // partout comme « cette faction n'en a pas » (createPlayer, contrôle,
    // combats, rencontres, visite de l'Usine).
    hero: null, companion: null, noHero: true,
    power: 2, cards: 1,
    // 4 ouvriers au lieu de 2, sur les quatre points d'ancrage du réseau.
    workerHex: [3, 20, 25, 40],
    // Points d'ancrage : PAS des hex de base (ce sont des hex de terrain
    // normaux, praticables par tout le monde — les transformer en base
    // casserait la carte pour les six autres factions). Ils servent de
    // points de RÉENTRÉE : un ouvrier vaincu part hors-plateau, dans une
    // réserve jamais capturable, et revient adjacent à un ancrage.
    anchors: [3, 20, 25, 40],
    campaignOnly: true,
    // Le plateau joueur est imposé (pas de tirage) : « Le Réseau », id 200.
    fixedMat: 200,
    // La Nage REMPLACE le riverwalk (le slot 1 de mecha est libéré, voir
    // mechAbilities.js) : toutes les unités, ouvriers compris, traversent
    // toutes les rivières dès le tour 1.
    riverwalk: null, rwName: null, swim: true,
    // Ouvriers combattants : chaque ouvrier présent autorise une carte de
    // combat de plus (voir combatUnitCount, data/combat.js). C'est le pic de
    // puissance le plus haut du jeu — freiné par la lenteur du regroupement,
    // par la main de cartes (départ à 1) et par le plafond de 2 étoiles de
    // combat.
    workersFight: true,
    // Vol de mecha : elle n'en construit aucun, elle les prend (max 4).
    stealMechs: 4,
    ability: "La Nage",
    abilityDesc: "Toutes vos unités, ouvriers compris, traversent toutes les rivières dès le tour 1 · vos ouvriers COMBATTENT (1 carte chacun) · vous ne déployez aucun mecha : vous les VOLEZ en battant un mecha adverse (max 4) · un ouvrier vaincu part en réserve hors-plateau et revient près d'un ancrage",
    // Objectif de faction — l'inverse exact de la manœuvre de masse : il
    // force l'étalement (l'Usine plus trois villages, répartis nord et sud).
    fObj: {
      name: "L'Usine aux Ouvriers", desc: "Usine (hex 22) + 3 villages contrôlés",
      check: (p, ctx) => {
        const held = heldHexes(p, ctx);
        return held.has(22) && [...held].filter(id => hMap[id]?.t === "village").length >= 3;
      },
    },
  },
};

// Factions de la ROTATION STANDARD : choix du joueur au setup et tirage des
// bots. L'Internationale Noire (campagne, chapitres 2 et 8) en est exclue —
// elle n'a ni héros ni base, et ses règles n'ont de sens que dans son
// scénario. `ALL_FACTION_IDS` reste disponible pour l'UI de campagne.
export const ALL_FACTION_IDS = Object.keys(FACTIONS);
export const FACTION_IDS = ALL_FACTION_IDS.filter(id => !FACTIONS[id].campaignOnly);
