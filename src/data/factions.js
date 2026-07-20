import { hMap, ADJ } from './hexes.js';

export const FACTIONS = {
  confederation: {
    name: "Confédération", color: "#808080", hero: "J. Cole", companion: "Dixie",
    power: 4, cards: 1, workerHex: [36, 32], riverwalk: ["plaine", "village"], rwName: "Gué",
    ability: "Servitude", abilityDesc: "Capture les ouvriers ennemis vaincus (-2 Pop, max 2)",
    // Compensation asymétrique (façon Scythe original) mesurée par simulation —
    // POPULARITÉ uniquement : les pièces de départ viennent exclusivement du
    // plateau joueur (règle Scythe). Voir RAPPORT_SIMULATION.md.
    startBonus: { pop: 6 },
    fObj: {
      name: "Le Joug", desc: "2 ouvriers capturés + 3+ hex avec ouvriers",
      check: p => (p.capturedWorkers || 0) >= 2 && p.workers.length >= 3,
    },
  },
  frente: {
    name: "Frente Libre", color: "#A05020", hero: "E. Rojas", companion: "Trueno",
    power: 2, cards: 3, workerHex: [41, 45], riverwalk: ["sierra", "desert"], rwName: "Sentier",
    ability: "Tierra Minada", abilityDesc: "Le héros pose un piège sur chaque hex atteint (max 4)",
    startBonus: { pop: 2 },
    fObj: {
      name: "Terre Libérée", desc: "4 Traps + 3 ouvriers sur Sierras/Déserts",
      check: p => (p.trapTokens || []).length >= 4 && p.workers.filter(w => {
        const h = hMap[w.hexId];
        return h && (h.t === "sierra" || h.t === "desert");
      }).length >= 3,
    },
  },
  nations: {
    name: "Nations Souv.", color: "#20B2AA", hero: "Aiyana", companion: "Koda",
    power: 3, cards: 2, workerHex: [10, 17], riverwalk: ["plaine", "foret"], rwName: "Piste",
    ability: "Esprit Sauvage", abilityDesc: "Déploie ses mechas avec du bois ou du métal",
    deployAltRes: "bois", deployAltName: "Esprit Sauvage",
        fObj: {
      name: "Le Grand Retour", desc: "5+ hex Plaine/Forêt contrôlés",
      check: p => {
        const u = new Set([p.hero, ...p.workers.map(w => w.hexId), ...p.mechs.map(m => m.hexId)]);
        return [...u].filter(id => {
          const h = hMap[id];
          return h && (h.t === "plaine" || h.t === "foret");
        }).length >= 5;
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
    power: 2, cards: 3, workerHex: [2, 6], riverwalk: ["foret", "village"], rwName: "Portage",
    ability: "Comptoir", abilityDesc: "Le héros pose un comptoir sur chaque hex atteint (max 4, +1 territoire chacun)",
    // Faction « populaire » façon Pologne : bonus de POPULARITÉ de départ
    // (comme les autres factions compensées — les pièces restent au plateau).
    // Sans lui elle plafonnait au palier 1 (pop ~6,7) : tout son score était
    // amputé par les multiplicateurs ×3/×2/×1.
    startBonus: { pop: 4 },
        fObj: {
      name: "Réseau Invisible", desc: "4 Comptoirs non adjacents entre eux + héros sur un Lac",
      // Nerf mesuré par simulation (65,6% → 58,1% de winrate) : le réseau doit être étalé
      check: p => {
        if ((p.flagTokens || []).length < 4 || hMap[p.hero]?.t !== "lac") return false;
        const ids = (p.flagTokens || []).map(f => f.hexId);
        return !ids.some((a, i) => ids.slice(i + 1).some(b => (ADJ[a] || []).includes(b)));
      },
    },
  },
  bayou: {
    name: "Bayou", color: "#7B2D8B", hero: "Cap. Zeke", companion: "Croc",
    power: 2, cards: 3, workerHex: [35, 28], riverwalk: ["desert", "village"], rwName: "Mangrove",
    ability: "Chimère", abilityDesc: "Capture un mecha de l'Empire détruit (1×/partie) · déploie avec du bois",
    deployAltRes: "bois", deployAltName: "Bois flotté",
    startBonus: { pop: 6 },
    fObj: {
      name: "Le Prédateur", desc: "1 mecha capturé + 2 Empire détruits",
      check: p => (p.capturedMech || 0) >= 1 && (p.empireKills || 0) >= 2,
    },
  },
  dominion: {
    name: "Dominion", color: "#CC2222", hero: "Col. Whitfield", companion: "Sterling",
    power: 3, cards: 2, workerHex: [0, 4], riverwalk: ["foret", "plaine"], rwName: "Queen's Road",
    ability: "Commerce Impérial", abilityDesc: "1×/tour : 1 ressource → 1💰 ou 1🃏 · Import : 2💰 → 1 ressource",
    isExtension: true,
    startBonus: { pop: 5 },
    fObj: {
      name: "Le Tribut", desc: "10+ pièces via Commerce Impérial",
      check: p => (p.imperialCoins || 0) >= 10,
    },
  },
};

export const FACTION_IDS = Object.keys(FACTIONS);
