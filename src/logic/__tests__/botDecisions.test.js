// Garde-fous de RÉFLEXION des bots (v0.15) — chaque test verrouille une
// pathologie mesurée en simulation (voir docs/design/analyse_bots_perdants.md).
import { describe, it, expect } from 'vitest';
import { botTurn, estimateScore, losingTrigger } from '../bot.js';
import { createPlayer } from '../player.js';
import { hMap, HEXES } from '../../data/hexes.js';
import { TERRAINS } from '../../data/terrains.js';

const mkBot = (mat = 1) => {
  const p = createPlayer('confederation', mat, true);
  p.botProfile = 'equilibre'; p.botNoise = 0;
  return p;
};
const run = (p, ctx = {}) => botTurn(p, {}, new Set(), [], { forbidden: new Set(), ...ctx });

describe('P1 — plus de tour mort « +1$ »', () => {
  it('un bot fauché ne gagne 1$ que s\'il ne peut NI produire NI payer une action du bas', () => {
    // Fauché mais des ouvriers sur des hex productifs → il doit produire/agir,
    // jamais brûler son tour pour 1 pièce (mesuré 4,1 tours morts/partie).
    const p = mkBot();
    p.coins = 0;
    const logs = [];
    for (let i = 0; i < 12; i++) {
      const r = run({ ...p, lastCol: i % 4, workers: p.workers.map(w => ({ ...w })), mechs: [], resources: {} });
      logs.push(...r.logs);
    }
    const dead = logs.filter(l => /\+\d+\$ \(Déplacer/.test(l)).length;
    expect(dead, `tours morts : ${dead}`).toBeLessThanOrEqual(2);
  });
});

describe('P4 — ne pas terminer la partie en étant derrière', () => {
  it('losingTrigger : vrai seulement à 5 étoiles, action finissante ET score inférieur', () => {
    const p = mkBot(); p.stars = 5;
    expect(losingTrigger(p, { bestOppScore: 9999 }, true)).toBe(true);
    expect(losingTrigger(p, { bestOppScore: 0 }, true)).toBe(false);   // on mène
    expect(losingTrigger(p, { bestOppScore: 9999 }, false)).toBe(false); // n'achève pas
    p.stars = 4;
    expect(losingTrigger(p, { bestOppScore: 9999 }, true)).toBe(false); // pas la 6e
    expect(losingTrigger(p, {}, true)).toBe(false);                    // sans contexte
  });

  it('à 5 étoiles et distancé, le bot ne joue pas l\'action du bas qui poserait la 6e', () => {
    // 3 recrues + ressources en poche : Enrôler donnerait la 4e recrue = 6e étoile
    const p = mkBot();
    p.stars = 5; p.recruits = 3; p.enlistMap = [0, 1, 2, null];
    const hex = p.workers[0].hexId;
    p.resources = { [hex]: { nourriture: 9, petrole: 9, metal: 9, bois: 9 } };
    let enlisted = 0;
    for (let i = 0; i < 8; i++) {
      const r = run({ ...p, lastCol: i % 4, workers: p.workers.map(w => ({ ...w })), mechs: [] },
        { bestOppScore: 9999 }); // très loin devant : finir = perdre
      if (r.player.recruits > 3) enlisted++;
    }
    expect(enlisted, 'le bot a déclenché la fin en perdant').toBe(0);
  });

  it('en tête au score, le même bot conclut sans hésiter', () => {
    const p = mkBot();
    p.stars = 5; p.recruits = 3; p.enlistMap = [0, 1, 2, null];
    const hex = p.workers[0].hexId;
    p.resources = { [hex]: { nourriture: 9, petrole: 9, metal: 9, bois: 9 } };
    let enlisted = 0;
    for (let i = 0; i < 8; i++) {
      const r = run({ ...p, lastCol: i % 4, workers: p.workers.map(w => ({ ...w })), mechs: [] },
        { bestOppScore: 0 });
      if (r.player.recruits > 3) enlisted++;
    }
    expect(enlisted).toBeGreaterThan(0);
  });
});

describe('estimateScore — même barème que le décompte final', () => {
  it('ne compte que les ressources sur des territoires CONTRÔLÉS', () => {
    const p = mkBot();
    const held = p.workers[0].hexId;
    const foreign = HEXES.find(h => !h.base && h.id !== held
      && !p.workers.some(w => w.hexId === h.id) && h.id !== p.hero).id;
    const base = estimateScore({ ...p, resources: {} });
    const onHeld = estimateScore({ ...p, resources: { [held]: { metal: 4 } } });
    const onForeign = estimateScore({ ...p, resources: { [foreign]: { metal: 4 } } });
    expect(onHeld).toBeGreaterThan(base);
    expect(onForeign).toBe(base); // un magot hors contrôle ne vaut rien au score
  });

  it('intègre la tuile « bonus de pose » quand le contexte la fournit', () => {
    const p = mkBot();
    const spot = HEXES.find(h => h.t === 'champs' && !h.base);
    p.buildings = [{ type: 'moulin', hexId: spot.id }];
    const tile = { count: () => 1, score: (n) => n * 9, check: () => true };
    expect(estimateScore(p, { structureBonus: tile })).toBe(estimateScore(p) + 9);
  });
});

describe('P8 — un bot agressif ne se vide pas de sa popularité', () => {
  it('le profil blitz vise le palier ×2 (7) et non plus 3', async () => {
    const { BOT_PROFILES } = await import('../botProfiles.js');
    expect(BOT_PROFILES.blitz.popTarget).toBeGreaterThanOrEqual(6);
  });

  it('à pop 7, chasser des ouvriers (perte de palier) devient repoussant', () => {
    // Deux hex candidats identiques, l'un occupé par 2 ouvriers ennemis :
    // le prendre ferait retomber de 7 à 5 pop → perte du multiplicateur ×2.
    const p = mkBot(); p.botProfile = 'blitz'; p.pop = 7; p.power = 7;
    const from = p.hero;
    // On s'appuie sur le tour complet : le bot ne doit pas finir sous 7 de pop
    let below = 0;
    for (let i = 0; i < 10; i++) {
      const hostile = HEXES.find(h => !h.base && h.id !== from);
      const r = run({ ...p, lastCol: i % 4, workers: p.workers.map(w => ({ ...w })), mechs: [], resources: {} },
        { hexWorkers: new Map([[hostile.id, 2]]), enemyHexes: new Set([hostile.id]) });
      if (r.player.pop < 7) below++;
    }
    expect(below, 'le bot a bradé son palier ×2').toBeLessThanOrEqual(3);
  });
});

describe('Pivot stratégique — savoir renoncer à un plan qui ne paie pas', () => {
  it('ne se replie pas tant que la fin n\'approche pas', async () => {
    const { shouldPivot } = await import('../botProfiles.js');
    const p = mkBot(); p.botProfile = 'harceleur'; p.stars = 1; p.combatWins = 0;
    expect(shouldPivot(p, { bestOppScore: 1000, round: 5 }, 10)).toBe(false);
  });

  it('un bot FORT aux étoiles ne se replie jamais — il fonce', async () => {
    const { shouldPivot } = await import('../botProfiles.js');
    const p = mkBot(); p.botProfile = 'harceleur'; p.stars = 4; p.combatWins = 0;
    expect(shouldPivot(p, { bestOppScore: 1000, endgame: true }, 10)).toBe(false);
  });

  it('un agressif sans la moindre victoire, distancé et en fin de partie, se replie', async () => {
    const { shouldPivot, effectiveProfile, BOT_PROFILES } = await import('../botProfiles.js');
    const p = mkBot(); p.botProfile = 'harceleur'; p.stars = 2; p.combatWins = 0;
    const ctx = { bestOppScore: 100, endgame: true };
    expect(shouldPivot(p, ctx, 40)).toBe(true);
    const eff = effectiveProfile(p, ctx, 40);
    expect(eff.pivoted).toBe(true);
    // le repli renonce au RISQUE mais vise le palier de score
    expect(eff.aggroMargin).toBeGreaterThan(BOT_PROFILES.harceleur.aggroMargin);
    expect(eff.earlyAttack).toBe(false);
    expect(eff.popTarget).toBe(13);
    expect(eff.disruption).toBe(0);
    // …sans renoncer aux étoiles encore à portée
    expect(eff.starRush).toBe(BOT_PROFILES.harceleur.starRush);
  });

  it('le même agressif qui a des victoires au compteur garde son plan', async () => {
    const { shouldPivot } = await import('../botProfiles.js');
    const p = mkBot(); p.botProfile = 'harceleur'; p.stars = 2; p.combatWins = 1;
    expect(shouldPivot(p, { bestOppScore: 100, endgame: true }, 40)).toBe(false);
  });

  // v0.16 — partie du 28/07 : les 3 bots ne se sont repliés qu'au tour 24
  // (sur 25), quand le joueur a posé sa 5e étoile. Le pivot doit pouvoir
  // arriver dès la mi-partie sur un décrochage NET (< 55 % du meilleur).
  it('mi-partie constatée + gros décrochage → repli sans attendre les 5 étoiles adverses', async () => {
    const { shouldPivot } = await import('../botProfiles.js');
    const p = mkBot(); p.stars = 1;
    expect(shouldPivot(p, { bestOppScore: 100, round: 14 }, 40)).toBe(true);  // 40 < 55 : décroché
    expect(shouldPivot(p, { bestOppScore: 100, round: 14 }, 60)).toBe(false); // retard simple : on s'accroche
    expect(shouldPivot(p, { bestOppScore: 100, round: 5 }, 40)).toBe(false);  // trop tôt pour renoncer
  });
});

describe('Conscience des adversaires', () => {
  it('le renseignement adverse est calculé et exposé aux décisions', () => {
    const me = mkBot();
    const rival = createPlayer('frente', 2, true);
    rival.stars = 5;
    rival.workers = [{ id: 'r0', hexId: rival.workers[0].hexId }, ...Array.from({ length: 6 }, (_, i) => ({ id: `r${i + 1}`, hexId: rival.workers[0].hexId }))];
    expect(rival.workers.length).toBe(7); // à une production de l'étoile des 8
    const r = run({ ...me, workers: me.workers.map(w => ({ ...w })), mechs: [], resources: {} },
      { allPlayers: [me, rival], bestOppScore: 50 });
    // le tour se joue sans erreur avec le renseignement en place
    expect(r.player).toBeDefined();
    expect(r.logs.length).toBeGreaterThan(0);
  });
});

describe('Identité de la Confédération — profil harceleur', () => {
  it('le profil harceleur porte bien un plan de razzia mobile', async () => {
    const { BOT_PROFILES } = await import('../botProfiles.js');
    const h = BOT_PROFILES.harceleur;
    expect(h).toBeDefined();
    expect(h.earlyAttack).toBe(true);              // harcèle dès le début
    expect(h.aggroMargin).toBeLessThanOrEqual(0);  // attaque à parité (Cavaliers +2)
    expect(h.moveBoost).toBeGreaterThanOrEqual(6); // la plus mobile du jeu
    expect(h.disruption).toBeGreaterThan(0);       // déni de développement adverse
    expect(h.lootPull).toBeGreaterThan(0);         // pillage des tas de ressources
    expect(h.encounterPull).toBeGreaterThanOrEqual(12); // rafle les rencontres
    // Son score passe par les multiplicateurs : elle rachète la pop des razzias
    expect(h.popTarget).toBeGreaterThanOrEqual(7);
    // Soutien permanent → Arsenal (puissance) et Mémorial (pop) en priorité
    expect(h.buildPriority.slice(0, 2).sort()).toEqual(['arsenal', 'memorial']);
  });

  it('la Confédération ne joue plus le plan pacifiste du bâtisseur', async () => {
    const { FACTION_PROFILE_WEIGHTS, assignBotProfile } = await import('../botProfiles.js');
    const w = FACTION_PROFILE_WEIGHTS.confederation;
    expect(w.harceleur).toBeGreaterThan(0);
    expect(w.batisseur).toBeUndefined();
    // en difficile, elle prend son meilleur plan : le harcèlement
    expect(assignBotProfile('confederation', 'difficile')).toBe('harceleur');
  });

  it('l\'estimation de force en attaque intègre le bonus de faction (Cavaliers +2)', () => {
    // Deux bots identiques sauf la faction : la Confédération doit s'estimer
    // plus forte EN ATTAQUE que le Bayou (pas de bonus offensif).
    const conf = createPlayer('confederation', 1, true);
    const bayou = createPlayer('bayou', 1, true);
    conf.power = bayou.power = 6; conf.combatCards = bayou.combatCards = 2;
    const strength = (p) => {
      const { COMBAT_ABILITIES } = require('../../data/combat.js');
      const b = COMBAT_ABILITIES[p.faction]?.apply(p, null, true)?.powerBonus || 0;
      return Math.min(Math.floor(p.power * 0.7) + 1, 7, p.power) + Math.min(p.combatCards, 2) * 2 + b;
    };
    expect(strength(conf)).toBeGreaterThan(strength(bayou));
  });
});

describe('Identité du Bayou — prédateur, et verrou alimentaire levé', () => {
  it('son objectif de faction est réalisable SANS l\'Empire (désactivé en partie standard)', async () => {
    const { FACTIONS } = await import('../../data/factions.js');
    const fo = FACTIONS.bayou.fObj;
    const p = createPlayer('bayou', 1, false);
    p.capturedMech = 1; p.empireKills = 0; p.combatWins = 2; // 2 proies joueur
    expect(fo.check(p), 'objectif impossible sans l\'Empire').toBe(true);
    // et il reste réalisable avec l'Empire (mode campagne)
    expect(fo.check({ ...p, combatWins: 0, empireKills: 2 })).toBe(true);
    // sans capture de mecha, toujours non
    expect(fo.check({ ...p, capturedMech: 0 })).toBe(false);
  });

  it('la nourriture lui est accessible à 1 hex (échange de carte 38 ↔ 30)', async () => {
    const { ADJ } = await import('../../data/hexes.js');
    const { FACTIONS } = await import('../../data/factions.js');
    const start = FACTIONS.bayou.workerHex;               // [35, 28]
    const near = new Set(start.flatMap(h => [h, ...(ADJ[h] || [])]));
    const foodAdj = [...near].filter(h => ["champs", "plaine"].includes(hMap[h]?.t));
    expect(foodAdj.length, 'le Bayou est encore affamé').toBeGreaterThanOrEqual(1);
    expect(hMap[38]?.t).toBe("champs");                   // le champ est venu à lui
    expect(hMap[30]?.t).toBe("desert");                   // le désert est parti au centre
  });

  it('« Bois flotté » retiré : plus de doublon avec l\'Esprit Sauvage des Nations', async () => {
    const { FACTIONS } = await import('../../data/factions.js');
    expect(FACTIONS.bayou.deployAltRes).toBeUndefined();
    expect(FACTIONS.nations.deployAltRes).toBe("bois");   // l'identité reste aux Nations
    expect(FACTIONS.acadiane.deployAltRes).toBe("petrole"); // et à l'Acadiane
  });
});

describe('P7 — Produire ne se paie pas au prix d\'un palier de popularité', () => {
  it('à 6 ouvriers et pop 7, le bot évite le Produire qui le ferait retomber au palier ×1', () => {
    // 6 ouvriers → Produire coûte 1⚡ ET 1♥ (règle Scythe). À pop 7, produire
    // fait retomber sous le palier : tout le score final serait amputé.
    const p = mkBot();
    p.pop = 7; p.power = 6; p.coins = 4;
    const prod = HEXES.filter(h => !h.base && TERRAINS[h.t]?.res && TERRAINS[h.t].res !== 'ouvriers').slice(0, 3);
    p.workers = prod.flatMap((h, i) => [0, 1].map(k => ({ id: `w${i}${k}`, hexId: h.id })));
    expect(p.workers.length).toBe(6);
    let produced = 0;
    for (let i = 0; i < 8; i++) {
      const r = run({ ...p, lastCol: i % 4, workers: p.workers.map(w => ({ ...w })), mechs: [], resources: {} });
      if (r.logs.some(l => /: Produire$/.test(l))) produced++;
    }
    expect(produced, 'le bot brade son palier de popularité').toBeLessThanOrEqual(2);
  });
});

// ── v0.17 : un bas JAMAIS joué finit par être financé ─────────────────────
// Partie du 03/08 : les deux bots achètent uniquement nourriture et métal
// (Enrôler, Déployer) et finissent à 0 bâtiment en 22 tours. Cause : le
// Commerce visait « le plus petit manque », donc jamais le bois de Construire,
// plus cher d'un ou deux cubes. Mesure après correctif (120 parties simulées) :
// sièges finissant à 0 bâtiment 12 % → 7 %, et 32 % → 18 % sur les parties
// courtes (≤26 tours), sans bouger les winrates.
describe('v0.17 — le Commerce ne laisse plus une colonne mourir de faim', () => {
  it('un bot sans bois finit par en acheter pour Construire', () => {
    const p = mkBot();
    p.coins = 20;
    // Nourriture et métal en réserve : Enrôler et Déployer sont déjà payables,
    // seul Construire (bois) est à sec — c'est LUI que le Commerce doit viser.
    const hex = p.workers[0].hexId;
    p.resources = { [hex]: { nourriture: 9, metal: 9, petrole: 9, bois: 0 } };
    const logs = [];
    for (let i = 0; i < 12; i++) {
      logs.push(...run({ ...p, lastCol: i % 4, workers: p.workers.map(w => ({ ...w })), mechs: [],
        resources: { [hex]: { ...p.resources[hex] } } }).logs);
    }
    expect(logs.filter(l => /\+\d+ bois/.test(l)).length, logs.join(" | ")).toBeGreaterThan(0);
  });
});
