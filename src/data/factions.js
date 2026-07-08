import { hMap, ADJ } from './hexes.js';

export const FACTIONS = {
  confederation: {
    name: "Confédération", color: "#808080", hero: "J. Cole", companion: "Dixie",
    power: 4, cards: 1, workerHex: [36, 32], riverwalk: ["plaine", "village"], rwName: "Gué",
    ability: "Servitude",
    // Compensation asymétrique (façon Scythe original) mesurée par simulation :
    // sans elle, le trio Conf/Bayou/Dominion finit pauvre (≈2,5$) et à pop de
    // palier 1 → tout son score est amputé. Voir RAPPORT_SIMULATION.md.
    startBonus: { coins: 4, pop: 3 },
    fObj: {
      name: "Le Joug", desc: "2 ouvriers capturés + 3+ hex avec ouvriers",
      check: p => (p.capturedWorkers || 0) >= 2 && p.workers.length >= 3,
    },
  },
  frente: {
    name: "Frente Libre", color: "#A05020", hero: "E. Rojas", companion: "Trueno",
    power: 2, cards: 3, workerHex: [41, 45], riverwalk: ["sierra", "desert"], rwName: "Sentier",
    ability: "Tierra Minada",
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
    ability: "Esprit Sauvage", deployAltRes: "bois", deployAltName: "Esprit Sauvage",
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
    power: 1, cards: 3, workerHex: [2, 6], riverwalk: ["foret", "village"], rwName: "Portage",
    ability: "Comptoir",
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
    ability: "Chimère", deployAltRes: "bois", deployAltName: "Bois flotté",
    startBonus: { coins: 3, pop: 2 },
    fObj: {
      name: "Le Prédateur", desc: "1 mecha capturé + 2 Empire détruits",
      check: p => (p.capturedMech || 0) >= 1 && (p.empireKills || 0) >= 2,
    },
  },
  dominion: {
    name: "Dominion", color: "#CC2222", hero: "Col. Whitfield", companion: "Sterling",
    power: 3, cards: 2, workerHex: [0, 4], riverwalk: ["foret", "plaine"], rwName: "Queen's Road",
    ability: "Commerce Impérial", isExtension: true,
    startBonus: { coins: 3, pop: 2 },
    fObj: {
      name: "Le Tribut", desc: "10+ pièces via Commerce Impérial",
      check: p => (p.imperialCoins || 0) >= 10,
    },
  },
};

export const FACTION_IDS = Object.keys(FACTIONS);
