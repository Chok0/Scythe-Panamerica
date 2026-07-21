#!/usr/bin/env node
/**
 * Simulateur headless de parties bot-vs-bot — Scythe: Panamerica
 *
 * Rejoue la boucle de jeu d'App.jsx (tours de bots, Empire, déplacement
 * d'ouvriers, pièges, enlist ongoing, fin à 6 étoiles, scoring) sans UI,
 * en réutilisant la vraie logique du jeu (src/logic, src/data).
 *
 * Usage :
 *   node scripts/simulate.mjs                      # 200 parties, seed 1
 *   node scripts/simulate.mjs --games 1000 --seed 42
 *   node scripts/simulate.mjs --games 50 --verbose # journal d'une partie
 *   node scripts/simulate.mjs --dump games.ndjson  # une ligne JSON par partie
 *
 * Sert à : analyser l'équilibrage (winrate par faction/plateau, durée,
 * provenance des étoiles) et détecter les bugs (invariants vérifiés à
 * chaque tour, exceptions capturées avec seed reproductible).
 */
import { writeFileSync } from 'node:fs';
import { botTurn } from '../src/logic/bot.js';
import { applyBotPvpAfterMove, servitudeOnDisplace, transferHexResources } from '../src/logic/pvpBots.js';
import { resolveBotEncounter } from '../src/logic/botEncounters.js';
import { FACTORY_RR_HEX, PLANS_FORD, PLANS_TESLA, TESLA_FRAGMENTS_REQUIRED } from '../src/data/plans.js';
import { CURRENT_MAP, loadMap, DEFAULT_MAP, LEGACY_MAP } from '../src/data/hexes.js';
import { generateAcceptedMap, validateMap } from '../src/data/mapGen.js';
import { createPlayer } from '../src/logic/player.js';
import { FACTIONS, FACTION_IDS } from '../src/data/factions.js';
import { BALANCE } from '../src/data/balance.js';
import { MATS, applyEnlistOngoing, BOTTOM } from '../src/data/mats.js';
import { HEXES, HOME_BASES, hMap, ADJ } from '../src/data/hexes.js';
import { EMPIRE_START, EMPIRE_RAILS, drawEmpireCombat } from '../src/data/empire.js';
import { getCombatBonus } from '../src/data/combat.js';
import { OBJECTIVES } from '../src/data/objectives.js';
import { shuffleArray } from '../src/logic/hexMath.js';
import { BOT_PROFILES, assignBotProfile, BOT_NOISE, MAP_META_THREAT, playerStanding } from '../src/logic/botProfiles.js';

// ── CLI ──
const args = process.argv.slice(2);
const getArg = (name, def) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : def;
};
const N_GAMES = parseInt(getArg('games', '200'), 10);
const SEED = parseInt(getArg('seed', '1'), 10);
const MAX_ROUNDS = parseInt(getArg('maxRounds', '150'), 10);
const VERBOSE = args.includes('--verbose');
const DUMP = getArg('dump', null);
// Expériences A/B :
//   --ab noFlagBonus → comptoirs Acadiane retirés du scoring
//   --ab wf1         → White Flag rapporte +1 pop (au lieu de 2)
//   --ab bayouBois   → le Bayou peut déployer ses mechas en bois (comme Nations)
const AB = getArg('ab', null);
// Plusieurs expériences combinables : --ab resCap,trioBoost
const ABS = new Set((AB || '').split(',').filter(Boolean));
if (ABS.has('wf1')) BALANCE.whiteFlagPop = 1;
if (ABS.has('bayouBois')) FACTIONS.bayou.deployAltRes = 'bois';
//   --ab dom2        → Commerce Impérial : 2 conversions de surplus par tour
if (ABS.has('dom2')) BALANCE.imperialRate = 2;
//   --ab noDomImport → désactive l'Import Impérial du Dominion (contrôle)
if (ABS.has('noDomImport')) BALANCE.imperialImport = false;
//   --ab resCap12    → réactive le plafond de scoring des ressources à 12 (comparaison)
if (ABS.has('resCap12')) BALANCE.resScoringCap = 12;
//   --ab wfOff       → désactive complètement le White Flag (diagnostic Acadiane)
if (ABS.has('wfOff')) BALANCE.whiteFlagEnabled = false;
//   --ab domSame     → Dominion façon Rusviet : peut rejouer la même colonne
if (ABS.has('domSame')) BALANCE.dominionRelentless = true;
// (acadRestore / noTrioBoost supprimés : les startBonus de popularité n'existent
//  plus — la pop de départ vient du plateau joueur seul, règle Scythe. La
//  compensation des factions se joue sur puissance/cartes dans factions.js.)
//   --ab legacyMap   → carte v1 d'origine (avant retouches péninsules)
if (ABS.has('legacyMap')) loadMap(LEGACY_MAP);
// (le nerf acadianeHard testé en A/B est désormais le comportement par défaut — factions.js)
// Cartes procédurales :
//   --randomMap    → une carte générée+acceptée différente PAR PARTIE
//   --mapSearch K  → évalue K cartes acceptées (N_GAMES parties chacune) et les classe
const RANDOM_MAP = args.includes('--randomMap');
const MAP_SEARCH = parseInt(getArg('mapSearch', '0'), 10);
// Profils stratégiques des bots :
//   --difficulty facile|normal|difficile  → assignation + bruit (défaut : normal)
//   --uniformBots                         → tous en profil « équilibré » (contrôle A/B)
const DIFFICULTY = getArg('difficulty', 'normal');
const UNIFORM_BOTS = args.includes('--uniformBots');

// ── RNG seedé (remplace Math.random pour la reproductibilité) ──
const mulberry32 = (a) => () => {
  a |= 0; a = (a + 0x6D2B79F5) | 0;
  let t = Math.imul(a ^ (a >>> 15), 1 | a);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

// ── Helpers répliqués d'App.jsx ──
const hbHexOf = (factionId) => {
  const hb = HOME_BASES[factionId];
  return HEXES.reduce((best, h) => {
    const d = Math.sqrt((h.rx - hb.rx) ** 2 + (h.ry - hb.ry) ** 2);
    const db = best ? Math.sqrt((best.rx - hb.rx) ** 2 + (best.ry - hb.ry) ** 2) : Infinity;
    return d < db && h.t !== "lac" && h.t !== "marecage" ? h : best;
  }, null);
};

// Scoring — réplique du calcul de fin de partie d'App.jsx
const scorePlayer = (p) => {
  const popTier = p.pop <= 6 ? 0 : p.pop <= 12 ? 1 : 2;
  const starMult = [3, 4, 5][popTier];
  const terMult = [2, 3, 4][popTier];
  const resMult = [1, 2, 3][popTier];
  const unitHexes = new Set([p.hero, ...p.workers.map(w => w.hexId), ...p.mechs.map(m => m.hexId)]);
  (p.buildings || []).forEach(b => unitHexes.add(b.hexId));
  (p.trapTokens || []).forEach(t => { if (!t.disarmed) unitHexes.add(t.hexId); });
  let flagBonus = 0;
  const hbh = hbHexOf(p.faction);
  (p.flagTokens || []).forEach(fl => {
    const isAdjHB = hbh && (ADJ[hbh.id] || []).includes(fl.hexId);
    if (!isAdjHB) flagBonus++;
  });
  if (ABS.has('noFlagBonus')) flagBonus = 0;
  const territories = unitHexes.size;
  // Règle originale : l'Usine compte 3 territoires EN TOUT (1 + bonus 2)
  const factoryBonus = unitHexes.has(22) ? 2 : 0;
  // Règle : seules les ressources sur des territoires contrôlés comptent au scoring
  let totalRes = 0;
  Object.entries(p.resources).forEach(([hid, r]) => {
    if (unitHexes.has(parseInt(hid))) Object.values(r).forEach(n => totalRes += n);
  });
  // Plafond de scoring des ressources : DÉSACTIVÉ par défaut (9999, voir
  // balance.js — le contre du magot est le pillage) ; --ab resCap12 pour A/B
  const resPairs = Math.floor(Math.min(totalRes, BALANCE.resScoringCap) / 2);
  const starScore = p.stars * starMult;
  const terScore = (territories + factoryBonus + flagBonus) * terMult;
  const resScore = resPairs * resMult;
  return { total: starScore + terScore + resScore + p.coins, starScore, terScore, resScore, coins: p.coins, territories, totalRes, popTier, flagBonus, flagBonusPts: flagBonus * terMult };
};

// Types d'étoiles pour l'analyse
const STAR_FLAGS = [
  ['starUpgrades', 'upgrades'], ['starMechs', 'mechs'], ['starBuildings', 'buildings'],
  ['starRecruits', 'recruits'], ['starWorkers', 'workers8'], ['starPower', 'power16'],
  ['starPop', 'pop18'], ['objectiveRevealed', 'objectif'], ['fObjRevealed', 'obj_faction'],
  ['starLiberator', 'liberateur'], ['starCombat1', 'combat1'], ['starCombat2', 'combat2'],
];

// ── Invariants — détection de bugs d'état ──
const checkInvariants = (p, round, issues) => {
  const flag = (msg) => issues.push(`[R${round}] ${FACTIONS[p.faction].name}: ${msg}`);
  if (p.power < 0 || p.power > 16) flag(`power hors bornes: ${p.power}`);
  if (p.pop < 0 || p.pop > 18) flag(`pop hors bornes: ${p.pop}`);
  if (p.coins < 0) flag(`coins négatif: ${p.coins}`);
  if (p.combatCards < 0) flag(`cartes combat négatives: ${p.combatCards}`);
  if (p.workers.length > 8 + (p.capturedWorkers || 0)) flag(`${p.workers.length} ouvriers > 8+captures`);
  if (p.mechs.length > 5) flag(`${p.mechs.length} mechas > 5`);
  if ((p.upgrades || 0) > 6) flag(`${p.upgrades} upgrades > 6`);
  if ((p.recruits || 0) > 4) flag(`${p.recruits} recrues > 4`);
  if ((p.buildings || []).length > 4) flag(`${p.buildings.length} bâtiments > 4`);
  for (const [hid, res] of Object.entries(p.resources)) {
    if (!hMap[hid]) flag(`ressources sur hex inexistant #${hid}`);
    for (const [rt, n] of Object.entries(res)) if (n < 0) flag(`ressource négative ${rt}@${hid}: ${n}`);
  }
  if (!hMap[p.hero]) flag(`héros sur hex inexistant #${p.hero}`);
  p.workers.forEach(w => { if (!hMap[w.hexId]) flag(`ouvrier sur hex inexistant #${w.hexId}`); });
  p.mechs.forEach(m => { if (!hMap[m.hexId]) flag(`mecha sur hex inexistant #${m.hexId}`); });
  // Conservation des cubes d'upgrade (6 au total par plateau)
  const cubes = (p.cubesOnTop || []).reduce((a, b) => a + b, 0) + (p.cubesOnBottom || []).reduce((a, b) => a + b, 0);
  if (cubes !== 6) flag(`cubes upgrade non conservés: ${cubes} != 6`);
  if (p.stars > 8) flag(`étoiles improbables: ${p.stars}`);
};

// ── Une partie complète ──
const playGame = (gameIdx, log) => {
  if (RANDOM_MAP) {
    const g = generateAcceptedMap(Math.random);
    loadMap(g.map);
  }
  const nPlayers = 2 + Math.floor(Math.random() * 4); // 2-5 joueurs
  const factions = shuffleArray(FACTION_IDS).slice(0, nPlayers);
  const mats = shuffleArray(MATS.map(m => m.id)).slice(0, nPlayers);
  const players = factions.map((f, i) => createPlayer(f, mats[i % mats.length], true));
  // Profils stratégiques : pondérés par faction (diversité de comportements)
  players.forEach(p => {
    p.botProfile = UNIFORM_BOTS ? 'equilibre' : assignBotProfile(p.faction, DIFFICULTY);
    p.botNoise = BOT_NOISE[DIFFICULTY] ?? 3;
  });
  const shuffledObj = shuffleArray(OBJECTIVES);
  players.forEach((p, i) => {
    const o1 = shuffledObj[(i * 2) % shuffledObj.length], o2 = shuffledObj[(i * 2 + 1) % shuffledObj.length];
    p.objectives = [o1, o2];
    p.objective = Math.random() > 0.5 ? o1 : o2;
  });
  let empire = Object.fromEntries(EMPIRE_START.map(e => [e.id, e.hexId]));
  // Aligné sur le jeu de base : plus de rails initiaux (EMPIRE_RAILS = campagne)
  let rails = [];
  let encounterTokens = new Set(CURRENT_MAP.encounterHexes);
  let rrVisitors = 0;
  const issues = [];
  const combatStats = { pveAttacks: 0, pveWins: 0, defenses: 0, defWins: 0, pvp: 0, encounters: 0 };
  let round = 0, endedBy = 'cap';

  const someoneWon = () => players.some(p => p.stars >= 6);

  outer:
  for (round = 1; round <= MAX_ROUNDS; round++) {
    for (let cp = 0; cp < players.length; cp++) {
      // hexes ennemis pour ce bot
      const enemyHexes = new Set();
      players.forEach((op, oi) => {
        if (oi === cp) return;
        enemyHexes.add(op.hero);
        op.mechs.forEach(m => enemyHexes.add(m.hexId));
        op.workers.forEach(w => enemyHexes.add(w.hexId));
      });

      // Hex combattants adverses → force défensive estimée (attaque sur avantage)
      // + butin par hex (le vainqueur prend les ressources : les gros tas de
      // ressources attirent les raids — contre naturel des thésauriseurs)
      const attackable = new Map();
      const hexLoot = new Map();
      // Méta-stratégie : menace par hex = a priori de la faction sur CETTE
      // carte + bonus si son propriétaire est le leader actuel de la partie
      const hexThreat = new Map();
      const standings = players.map((op, oi) => oi === cp ? -1 : playerStanding(op));
      const leaderIdx = standings.indexOf(Math.max(...standings));
      players.forEach((op, oi) => {
        if (oi === cp) return;
        const strength = op.power + (op.combatCards || 0) * 2;
        attackable.set(op.hero, Math.max(attackable.get(op.hero) || 0, strength));
        op.mechs.forEach(m => attackable.set(m.hexId, Math.max(attackable.get(m.hexId) || 0, strength)));
        Object.entries(op.resources || {}).forEach(([hid, res]) => {
          const total = Object.values(res).reduce((a, b) => a + b, 0);
          if (total > 0) hexLoot.set(parseInt(hid), (hexLoot.get(parseInt(hid)) || 0) + total);
        });
        const threat = Math.min(6, (MAP_META_THREAT[op.faction] || 0) + (oi === leaderIdx ? 3 : 0));
        if (threat > 0) {
          [op.hero, ...op.mechs.map(m => m.hexId), ...op.workers.map(w => w.hexId)]
            .forEach(hid => hexThreat.set(hid, Math.max(hexThreat.get(hid) || 0, threat)));
        }
      });
      const result = botTurn(players[cp], empire, enemyHexes, rails, { attackable, hexLoot, hexThreat, forbidden: new Set(), encounterHexes: encounterTokens });
      let p = result.player;
      if (log) result.logs.forEach(l => log(`  ${l}`));

      // ── PvE : le bot attaque l'Empire s'il a bougé sur son hex (App.jsx) ──
      const empireOnHero = Object.entries(empire).find(([, hid]) => hid === p.hero);
      if (empireOnHero && p.power >= 2) {
        combatStats.pveAttacks++;
        const card = drawEmpireCombat();
        const cb = getCombatBonus(p, p.hero, true);
        const botSpend = Math.min(Math.floor(p.power * 0.6), 7, p.power);
        const units = 1 + p.mechs.filter(m => m.hexId === p.hero).length;
        const botCC = Math.min(Math.floor(Math.random() * (p.combatCards + 1)), units + cb.cardBonus);
        const botTotal = botSpend + cb.powerBonus + botCC * 2;
        p.power -= botSpend; p.combatCards -= botCC;
        if (botTotal >= card.power) {
          combatStats.pveWins++;
          delete empire[empireOnHero[0]];
          p.empireKills = (p.empireKills || 0) + 1;
          if (Math.random() < 0.4) p.pop = Math.min(p.pop + 2, 18);
          else {
            const hid = String(p.hero);
            if (!p.resources[hid]) p.resources[hid] = {};
            p.resources[hid].metal = (p.resources[hid].metal || 0) + 2;
          }
          if (p.empireKills >= 3 && !p.starLiberator) { p.stars++; p.starLiberator = true; }
          if (p.faction === 'bayou' && !p.chimereUsed) {
            p.mechs = [...p.mechs, { id: `${p.faction}_chimere`, hexId: p.hero }];
            p.chimereUsed = true; p.capturedMech = (p.capturedMech || 0) + 1;
          }
        } else {
          p.hero = hbHexOf(p.faction).id;
        }
      }
      players[cp] = p;

      // ── Déplacement des ouvriers ennemis + pièges (App.jsx) ──
      const botHexes = new Set([p.hero, ...p.mechs.map(m => m.hexId)]);
      for (let oi = 0; oi < players.length; oi++) {
        if (oi === cp) continue;
        // Règle : les ouvriers ne battent en retraite que s'ils sont SEULS —
        // si héros/mechs défendent le hex, c'est le combat qui tranche
        const defended = (hid) => players[oi].hero === hid || players[oi].mechs.some(m => m.hexId === hid);
        const displaced = players[oi].workers.filter(w => botHexes.has(w.hexId) && !defended(w.hexId));
        if (displaced.length > 0) {
          const ohb = hbHexOf(players[oi].faction);
          const dispHexes = [...new Set(displaced.map(w => w.hexId))];
          players[oi] = { ...players[oi], workers: players[oi].workers.map(w => botHexes.has(w.hexId) && !defended(w.hexId) ? { ...w, hexId: ohb.id } : w) };
          players[cp] = { ...players[cp], pop: Math.max(0, (players[cp].pop || 0) - displaced.length) };
          // Pillage : les ressources des hexes pris passent au nouvel occupant
          const deepRes = (pl) => { const r = {}; Object.entries(pl.resources).forEach(([k, v]) => { r[k] = { ...v }; }); return r; };
          const loserC = { ...players[oi], resources: deepRes(players[oi]) };
          const winnerC = { ...players[cp], resources: deepRes(players[cp]) };
          dispHexes.forEach(hid => transferHexResources(loserC, winnerC, hid));
          players[oi] = loserC; players[cp] = winnerC;
          // Servitude (Confédération) : capture lors du déplacement d'ouvriers
          const serv = servitudeOnDisplace(players[cp], displaced[0].hexId);
          if (serv.captured) players[cp] = serv.player;
        }
        if (players[oi].faction === 'frente') {
          (players[oi].trapTokens || []).forEach((trap, ti) => {
            if (botHexes.has(trap.hexId) && !trap.disarmed) {
              const penalty = Math.min(players[cp].power || 0, 3);
              players[cp] = { ...players[cp], power: Math.max(0, (players[cp].power || 0) - penalty) };
              players[oi] = { ...players[oi], trapTokens: [...players[oi].trapTokens] };
              players[oi].trapTokens[ti] = { ...players[oi].trapTokens[ti], disarmed: true };
            }
          });
        }
      }

      // ── PVP entre bots : combats à la fin de l'action Move (règle p.22) ──
      const pvpRes = applyBotPvpAfterMove(players, cp, () => true);
      if (pvpRes.logs.length > 0) {
        combatStats.pvp += pvpRes.logs.filter(l => l.includes('⚔🤖') || l.includes('🏳')).length;
        // Psychologie du combat : feintes tentées/réussies, folds
        combatStats.feints = (combatStats.feints || 0) + pvpRes.logs.filter(l => l.includes('🃏')).length;
        combatStats.feintsWon = (combatStats.feintsWon || 0) + pvpRes.logs.filter(l => l.includes('ça passe')).length;
        combatStats.folds = (combatStats.folds || 0) + pvpRes.logs.filter(l => l.includes('🫱')).length;
        for (let ei = 0; ei < pvpRes.players.length; ei++) players[ei] = pvpRes.players[ei];
        if (log) pvpRes.logs.forEach(l => log(`  ${l}`));
      }

      // ── Rencontre bot : héros sur un jeton, après les combats (règle p.24) ──
      if (encounterTokens.has(players[cp].hero)) {
        combatStats.encounters++;
        encounterTokens.delete(players[cp].hero);
        const er = resolveBotEncounter(players[cp]);
        players[cp] = er.player;
        if (log) log(`  ${er.log}`);
      }

      // ── Rouge River bot : héros sur l'Usine (1re visite) → plan auto (miroir App.jsx) ──
      if (players[cp].hero === FACTORY_RR_HEX && !players[cp].visitedRR) {
        const hasFrag = (players[cp].fragments || 0) >= TESLA_FRAGMENTS_REQUIRED;
        const pool = hasFrag ? [...PLANS_FORD, ...PLANS_TESLA] : [...PLANS_FORD];
        const seeCount = Math.max(1, Math.min(pool.length, pool.length - rrVisitors));
        const visible = pool.sort(() => Math.random() - 0.5).slice(0, seeCount);
        const card = visible.find(c => c.type === "tesla") || visible[Math.floor(Math.random() * visible.length)];
        players[cp] = { ...players[cp], visitedRR: true, factoryCard: card };
        rrVisitors++;
        if (log) log(`  ⚙ ${players[cp].faction} visite la Rouge River → ${card.name}`);
      }

      // ── Enlist ongoing (soi + voisins) ──
      if (result.bottomCol >= 0) {
        const er = applyEnlistOngoing(players, cp, result.bottomCol, FACTIONS);
        for (let ei = 0; ei < er.players.length; ei++) players[ei] = er.players[ei];
      }

      // ── Rails posés par une Gare ──
      if (players[cp]._pendingRails && players[cp]._pendingRails.length > 0) {
        combatStats.railsBuilt = (combatStats.railsBuilt || 0) + players[cp]._pendingRails.length;
        rails = [...rails, ...players[cp]._pendingRails];
        delete players[cp]._pendingRails;
      }

      players.forEach(pl => checkInvariants(pl, round, issues));
      if (someoneWon()) { endedBy = 'stars'; break outer; }
    }

    // ── Fin de round : l'Empire bouge (App.jsx) ──
    const empireIds = Object.keys(empire);
    if (empireIds.length > 0) {
      const eid = empireIds[Math.floor(Math.random() * empireIds.length)];
      const fromId = empire[eid];
      const validEmpire = (ADJ[fromId] || []).filter(toId => { const h = hMap[toId]; return h && h.t !== 'lac' && h.t !== 'marecage'; });
      if (validEmpire.length > 0) {
        const toId = validEmpire[Math.floor(Math.random() * validEmpire.length)];
        empire[eid] = toId;
        for (let pi = 0; pi < players.length; pi++) {
          const pl = players[pi];
          if (pl.hero === toId || pl.mechs.some(m => m.hexId === toId)) {
            combatStats.defenses++;
            const card = drawEmpireCombat();
            const cb = getCombatBonus(pl, toId, false);
            const botSpend = Math.min(Math.floor(pl.power * 0.5), 5, pl.power);
            const units = (pl.hero === toId ? 1 : 0) + pl.mechs.filter(m => m.hexId === toId).length;
            const botCC = Math.min(Math.floor(Math.random() * (pl.combatCards + 1)), units + cb.cardBonus);
            const botTotal = botSpend + cb.powerBonus + botCC * 2;
            const bp = { ...pl };
            bp.power -= botSpend; bp.combatCards -= botCC;
            if (botTotal >= card.power) { // le défenseur gagne l'égalité (même règle que l'humain)
              combatStats.defWins++;
              delete empire[eid];
              bp.empireKills = (bp.empireKills || 0) + 1;
              if (bp.empireKills >= 3 && !bp.starLiberator) { bp.stars++; bp.starLiberator = true; }
            } else {
              const hbh = hbHexOf(pl.faction);
              if (bp.hero === toId) bp.hero = hbh.id;
              bp.mechs = bp.mechs.map(m => m.hexId === toId ? { ...m, hexId: hbh.id } : m);
            }
            players[pi] = bp;
            break;
          }
        }
      }
    }
    if (someoneWon()) { endedBy = 'stars'; break; }
  }

  // ── Scoring final ──
  const scored = players.map(p => ({
    faction: p.faction, mat: p.matName, profile: p.botProfile, isTrigger: p.stars >= 6,
    stars: p.stars, pop: p.pop, power: p.power,
    starFlags: Object.fromEntries(STAR_FLAGS.map(([k, label]) => [label, !!p[k]])),
    empireKills: p.empireKills || 0,
    workers: p.workers.length, mechs: p.mechs.length,
    buildings: (p.buildings || []).length, upgrades: p.upgrades || 0, recruits: p.recruits || 0,
    // Instrumentation : usage des capacités et infrastructures
    abilities: (p.unlockedAbilities || []).length,
    builtGare: (p.buildings || []).some(b => b.type === 'gare'),
    traps: (p.trapTokens || []).length, flags: (p.flagTokens || []).length,
    imperialCoins: p.imperialCoins || 0, chimere: !!p.chimereUsed, capturedWorkers: p.capturedWorkers || 0,
    encounters: p.encounters || 0,
    ...scorePlayer(p),
  })).sort((a, b) => b.total - a.total);

  return { gameIdx, nPlayers, rounds: Math.min(round, MAX_ROUNDS), endedBy, scored, issues, combatStats, empireLeft: Object.keys(empire).length, railsBuilt: combatStats.railsBuilt || 0 };
};

// ── Boucle principale ──
Math.random = mulberry32(SEED);

// Mode recherche de carte : K cartes acceptées x N_GAMES parties, classées par équilibre
if (MAP_SEARCH > 0) {
  const results = [];
  const evalMap = (map, label) => {
    loadMap(map);
    const gs = [];
    for (let g = 0; g < N_GAMES; g++) {
      try { gs.push(playGame(g, null)); } catch (e) { /* crash = carte disqualifiée */ return null; }
    }
    const fin = gs.filter(g => g.endedBy === 'stars');
    const winByF = {}; const seatByF = {};
    gs.forEach(g => g.scored.forEach((s, r) => {
      seatByF[s.faction] = (seatByF[s.faction] || 0) + 1;
      if (r === 0) winByF[s.faction] = (winByF[s.faction] || 0) + 1;
    }));
    const rates = Object.keys(seatByF).map(f => (winByF[f] || 0) / seatByF[f]);
    const mean = rates.reduce((a, b) => a + b, 0) / rates.length;
    const stddev = Math.sqrt(rates.reduce((a, r) => a + (r - mean) ** 2, 0) / rates.length);
    const med = fin.length ? [...fin.map(g => g.rounds)].sort((a, b) => a - b)[Math.floor(fin.length / 2)] : 999;
    return { label, pctFinished: fin.length / gs.length, medianRounds: med, winrateStddev: stddev,
      spread: `${(100 * Math.min(...rates)).toFixed(0)}–${(100 * Math.max(...rates)).toFixed(0)}%`, map };
  };
  console.log(`\n════ MAP SEARCH — ${MAP_SEARCH} cartes générées × ${N_GAMES} parties (+ carte actuelle) ════`);
  const base = evalMap(DEFAULT_MAP, 'panamerica (actuelle)');
  if (base) results.push(base);
  for (let k = 0; k < MAP_SEARCH; k++) {
    const gen = generateAcceptedMap(Math.random);
    const r = evalMap(gen.map, `carte-${k + 1} (${gen.tries} essais)`);
    if (r) results.push(r);
  }
  // Classement : équilibre (stddev) d'abord, puis % parties finies, puis durée
  results.sort((a, b) => (a.winrateStddev - b.winrateStddev) || (b.pctFinished - a.pctFinished) || (a.medianRounds - b.medianRounds));
  console.log(`\n${'Carte'.padEnd(26)} | équilibre σ | winrates | finies | médiane`);
  results.forEach((r, i) => {
    console.log(`${(i + 1 + '. ' + r.label).padEnd(26)} |    ${r.winrateStddev.toFixed(3)}  | ${r.spread.padStart(8)} | ${(100 * r.pctFinished).toFixed(0).padStart(4)}%  | ${String(r.medianRounds).padStart(3)} rounds`);
  });
  if (DUMP) {
    writeFileSync(DUMP, JSON.stringify({ ranking: results.map(({ map, ...rest }) => rest), bestMap: results[0].map }, null, 2));
    console.log(`\nMeilleure carte + classement → ${DUMP}`);
  }
  process.exit(0);
}

const games = [];
const crashes = [];
for (let g = 0; g < N_GAMES; g++) {
  const log = VERBOSE && g === 0 ? (m) => console.log(m) : null;
  try {
    games.push(playGame(g, log));
  } catch (e) {
    crashes.push({ game: g, seed: SEED, error: e.message, stack: (e.stack || '').split('\n').slice(0, 4).join(' | ') });
  }
}

// ── Agrégation ──
const pct = (a, b) => b > 0 ? (100 * a / b).toFixed(1) + '%' : '—';
const avg = (arr) => arr.length ? (arr.reduce((a, b) => a + b, 0) / arr.length) : 0;

const byFaction = {}; const byMat = {}; const byProfile = {}; const byFactionProfile = {};
Object.keys(BOT_PROFILES).forEach(k => { byProfile[k] = { games: 0, wins: 0, scores: [], stars: [], pops: [] }; });
FACTION_IDS.forEach(f => { byFaction[f] = { games: 0, wins: 0, triggers: 0, scores: [], stars: [], abilities: [], gares: 0, traps: [], flags: [], flagPts: [], imperial: [], chimeres: 0, captured: [], encounters: [], pops: [], terrs: [], coins: [], starScores: [], terScores: [], resScores: [] }; });
MATS.forEach(m => { byMat[m.name] = { games: 0, wins: 0, scores: [] }; });
const starCounts = {}; STAR_FLAGS.forEach(([, l]) => { starCounts[l] = { all: 0, winners: 0 }; });
let stalemates = 0; const allIssues = []; const roundsArr = [];
let pveAttacks = 0, pveWins = 0, defenses = 0, defWins = 0, pvpTotal = 0, encountersTotal = 0;

games.forEach(g => {
  roundsArr.push(g.rounds);
  if (g.endedBy === 'cap') stalemates++;
  g.issues.forEach(i => allIssues.push(`[G${g.gameIdx}] ${i}`));
  pveAttacks += g.combatStats.pveAttacks; pveWins += g.combatStats.pveWins;
  defenses += g.combatStats.defenses; defWins += g.combatStats.defWins;
  pvpTotal += g.combatStats.pvp || 0; encountersTotal += g.combatStats.encounters || 0;
  g.scored.forEach((s, rank) => {
    const bf = byFaction[s.faction];
    bf.games++; byMat[s.mat].games++;
    bf.scores.push(s.total); byMat[s.mat].scores.push(s.total);
    bf.stars.push(s.stars);
    bf.abilities.push(s.abilities); if (s.builtGare) bf.gares++;
    bf.traps.push(s.traps); bf.flags.push(s.flags); bf.flagPts.push(s.flagBonusPts || 0);
    bf.imperial.push(s.imperialCoins); if (s.chimere) bf.chimeres++;
    bf.captured.push(s.capturedWorkers); bf.encounters.push(s.encounters);
    bf.pops.push(s.pop); bf.terrs.push(s.territories); bf.coins.push(s.coins);
    bf.starScores.push(s.starScore); bf.terScores.push(s.terScore); bf.resScores.push(s.resScore);
    const bp = byProfile[s.profile];
    if (bp) {
      bp.games++; bp.scores.push(s.total); bp.stars.push(s.stars); bp.pops.push(s.pop);
      if (rank === 0) bp.wins++;
      const fpKey = `${s.faction}|${s.profile}`;
      const fp = byFactionProfile[fpKey] || (byFactionProfile[fpKey] = { games: 0, wins: 0 });
      fp.games++; if (rank === 0) fp.wins++;
    }
    if (rank === 0) { bf.wins++; byMat[s.mat].wins++; }
    if (s.isTrigger) bf.triggers++;
    STAR_FLAGS.forEach(([, l]) => {
      if (s.starFlags[l]) { starCounts[l].all++; if (rank === 0) starCounts[l].winners++; }
    });
  });
});

const report = [];
const P = (s) => { report.push(s); console.log(s); };
P(`\n════════ SIMULATION — ${games.length} parties (seed ${SEED}, cap ${MAX_ROUNDS} rounds) ════════\n`);
P(`Durée: moyenne ${avg(roundsArr).toFixed(1)} rounds, min ${Math.min(...roundsArr)}, max ${Math.max(...roundsArr)}`);
P(`Fins de partie: ${games.length - stalemates} à 6 étoiles (${pct(games.length - stalemates, games.length)}), ${stalemates} au cap (${pct(stalemates, games.length)})`);
P(`Combats PvE (bot attaque Empire): ${pveAttacks}, gagnés ${pct(pveWins, pveAttacks)}`);
P(`Défenses vs Empire: ${defenses}, gagnées ${pct(defWins, defenses)}`);
P(`Combats PvP entre bots: ${pvpTotal} (${(pvpTotal / games.length).toFixed(1)}/partie)`);
const feints = games.reduce((a, g) => a + (g.combatStats.feints || 0), 0);
const feintsWon = games.reduce((a, g) => a + (g.combatStats.feintsWon || 0), 0);
const folds = games.reduce((a, g) => a + (g.combatStats.folds || 0), 0);
P(`Psychologie: ${feints} feintes (${pct(feintsWon, feints)} réussies), ${folds} folds défensifs`);
P(`Rencontres résolues par les bots: ${encountersTotal} (${(encountersTotal / games.length).toFixed(1)}/partie, 9 jetons max)`);
P(`Rails posés par les bots (Gares): ${games.reduce((a, g) => a + (g.railsBuilt || 0), 0)} (${(games.reduce((a, g) => a + (g.railsBuilt || 0), 0) / games.length).toFixed(1)}/partie, +2 rails Empire au setup)`);
if (AB) P(`⚗ Mode A/B actif: ${AB}`);
P(`Crashs: ${crashes.length}`);
crashes.slice(0, 5).forEach(c => P(`  💥 G${c.game}: ${c.error}\n     ${c.stack}`));
P(`Violations d'invariants: ${allIssues.length}`);
[...new Set(allIssues.map(i => i.replace(/\[G\d+\] \[R\d+\]/, '')))].slice(0, 12).forEach(i => P(`  ⚠ ${i}`));

P(`\n── Win rate par faction (1er au score) ──`);
FACTION_IDS.forEach(f => {
  const d = byFaction[f];
  P(`  ${FACTIONS[f].name.padEnd(16)} ${String(d.games).padStart(4)} parties | win ${pct(d.wins, d.games).padStart(6)} | déclenche fin ${pct(d.triggers, d.games).padStart(6)} | score moy ${avg(d.scores).toFixed(1).padStart(6)} | étoiles moy ${avg(d.stars).toFixed(2)}`);
});
P(`\n── Win rate par profil stratégique (difficulté: ${DIFFICULTY}${UNIFORM_BOTS ? ', uniformBots' : ''}) ──`);
Object.entries(byProfile).forEach(([k, d]) => {
  if (d.games === 0) return;
  const pr = BOT_PROFILES[k];
  P(`  ${(pr.icon + ' ' + pr.name).padEnd(16)} ${String(d.games).padStart(4)} sièges | win ${pct(d.wins, d.games).padStart(6)} | score moy ${avg(d.scores).toFixed(1).padStart(6)} | étoiles ${avg(d.stars).toFixed(2)} | pop ${avg(d.pops).toFixed(1)}`);
});
P(`\n── Meilleur profil par faction (win% par profil, ≥30 sièges) ──`);
FACTION_IDS.forEach(f => {
  const rows = Object.keys(BOT_PROFILES)
    .map(k => ({ k, ...(byFactionProfile[`${f}|${k}`] || { games: 0, wins: 0 }) }))
    .filter(r => r.games >= 30)
    .sort((a, b) => b.wins / b.games - a.wins / a.games);
  if (rows.length === 0) return;
  P(`  ${FACTIONS[f].name.padEnd(16)} ${rows.map(r => `${BOT_PROFILES[r.k].icon}${BOT_PROFILES[r.k].name} ${pct(r.wins, r.games)} (${r.games})`).join(' · ')}`);
});

P(`\n── Décomposition du score final (moyennes) ──`);
FACTION_IDS.forEach(f => {
  const d = byFaction[f];
  if (d.games === 0) return;
  P(`  ${FACTIONS[f].name.padEnd(16)} pop ${avg(d.pops).toFixed(1).padStart(4)} | terr ${avg(d.terrs).toFixed(1).padStart(4)} | ⭐pts ${avg(d.starScores).toFixed(1).padStart(5)} | 🗺pts ${avg(d.terScores).toFixed(1).padStart(5)} | 📦pts ${avg(d.resScores).toFixed(1).padStart(4)} | 💰 ${avg(d.coins).toFixed(1).padStart(5)}`);
});

P(`\n── Usage des capacités par faction ──`);
FACTION_IDS.forEach(f => {
  const d = byFaction[f];
  if (d.games === 0) return;
  const extra = f === 'frente' ? `traps ${avg(d.traps).toFixed(1)}/4`
    : f === 'acadiane' ? `comptoirs ${avg(d.flags).toFixed(1)}/4 (+${avg(d.flagPts).toFixed(1)} pts scoring)`
    : f === 'dominion' ? `commerce ${avg(d.imperial).toFixed(1)}$ cumulés`
    : f === 'bayou' ? `chimère ${pct(d.chimeres, d.games)}`
    : f === 'confederation' ? `ouvriers capturés ${avg(d.captured).toFixed(2)}`
    : `—`;
  P(`  ${FACTIONS[f].name.padEnd(16)} abilities mech ${avg(d.abilities).toFixed(1)}/4 | gare ${pct(d.gares, d.games).padStart(6)} | rencontres ${avg(d.encounters).toFixed(1)} | ${extra}`);
});

P(`\n── Win rate par plateau joueur ──`);
MATS.forEach(m => {
  const d = byMat[m.name];
  P(`  ${m.name.padEnd(10)} ${String(d.games).padStart(4)} parties | win ${pct(d.wins, d.games).padStart(6)} | score moy ${avg(d.scores).toFixed(1).padStart(6)}`);
});
P(`\n── Provenance des étoiles (% des joueurs qui l'obtiennent / % des vainqueurs) ──`);
const totalSeats = games.reduce((a, g) => a + g.scored.length, 0);
STAR_FLAGS.forEach(([, l]) => {
  P(`  ${l.padEnd(12)} ${pct(starCounts[l].all, totalSeats).padStart(6)} des joueurs | ${pct(starCounts[l].winners, games.length).padStart(6)} des vainqueurs`);
});

if (DUMP) {
  writeFileSync(DUMP, games.map(g => JSON.stringify(g)).join('\n'));
  P(`\nDump NDJSON → ${DUMP}`);
}
if (crashes.length > 0 || allIssues.length > 0) process.exitCode = 1;
