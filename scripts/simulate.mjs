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
import { applyBotPvpAfterMove } from '../src/logic/pvpBots.js';
import { resolveBotEncounter } from '../src/logic/botEncounters.js';
import { ENCOUNTER_HEXES } from '../src/data/encounters.js';
import { createPlayer } from '../src/logic/player.js';
import { FACTIONS, FACTION_IDS } from '../src/data/factions.js';
import { MATS, applyEnlistOngoing, BOTTOM } from '../src/data/mats.js';
import { HEXES, HOME_BASES, hMap, ADJ } from '../src/data/hexes.js';
import { EMPIRE_START, EMPIRE_RAILS, drawEmpireCombat } from '../src/data/empire.js';
import { getCombatBonus } from '../src/data/combat.js';
import { OBJECTIVES } from '../src/data/objectives.js';
import { shuffleArray } from '../src/logic/hexMath.js';

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
// Expérience A/B : --ab noFlagBonus → les comptoirs Acadiane ne comptent plus au scoring
const AB = getArg('ab', null);

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
  if (AB === 'noFlagBonus') flagBonus = 0;
  const territories = unitHexes.size;
  const factoryBonus = unitHexes.has(22) ? 3 : 0;
  // Règle : seules les ressources sur des territoires contrôlés comptent au scoring
  let totalRes = 0;
  Object.entries(p.resources).forEach(([hid, r]) => {
    if (unitHexes.has(parseInt(hid))) Object.values(r).forEach(n => totalRes += n);
  });
  const resPairs = Math.floor(totalRes / 2);
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
  const nPlayers = 2 + Math.floor(Math.random() * 4); // 2-5 joueurs
  const factions = shuffleArray(FACTION_IDS).slice(0, nPlayers);
  const mats = shuffleArray(MATS.map(m => m.id)).slice(0, nPlayers);
  const players = factions.map((f, i) => createPlayer(f, mats[i % mats.length], true));
  const shuffledObj = shuffleArray(OBJECTIVES);
  players.forEach((p, i) => {
    const o1 = shuffledObj[(i * 2) % shuffledObj.length], o2 = shuffledObj[(i * 2 + 1) % shuffledObj.length];
    p.objectives = [o1, o2];
    p.objective = Math.random() > 0.5 ? o1 : o2;
  });
  let empire = Object.fromEntries(EMPIRE_START.map(e => [e.id, e.hexId]));
  let rails = [...EMPIRE_RAILS];
  let encounterTokens = new Set(ENCOUNTER_HEXES);
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

      // Tous les joueurs sont des bots : tout hex combattant adverse est attaquable
      const attackable = new Set();
      players.forEach((op, oi) => {
        if (oi === cp) return;
        attackable.add(op.hero);
        op.mechs.forEach(m => attackable.add(m.hexId));
      });
      const result = botTurn(players[cp], empire, enemyHexes, rails, { attackable, forbidden: new Set(), encounterHexes: encounterTokens });
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
          players[oi] = { ...players[oi], workers: players[oi].workers.map(w => botHexes.has(w.hexId) && !defended(w.hexId) ? { ...w, hexId: ohb.id } : w) };
          players[cp] = { ...players[cp], pop: Math.max(0, (players[cp].pop || 0) - displaced.length) };
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
    faction: p.faction, mat: p.matName, isTrigger: p.stars >= 6,
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

const byFaction = {}; const byMat = {};
FACTION_IDS.forEach(f => { byFaction[f] = { games: 0, wins: 0, triggers: 0, scores: [], stars: [], abilities: [], gares: 0, traps: [], flags: [], flagPts: [], imperial: [], chimeres: 0, captured: [], encounters: [] }; });
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
