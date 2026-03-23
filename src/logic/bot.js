import { FACTIONS } from '../data/factions.js';
import { TERRAINS } from '../data/terrains.js';
import { hMap, ADJ, HEXES, HOME_BASES } from '../data/hexes.js';
import { MATS, BOTTOM, BUILDING_TYPES, ENLIST_ONGOING, getBottomCost } from '../data/mats.js';
import { countRes, spendRes, getWorkerHexes } from './resources.js';
import { canPayProduce, payProduce } from './production.js';
import { getValidMoves } from './movement.js';
import { transportUnits } from './transport.js';

// ══════════════════════════════════════════════════════
// Strategic Bot AI — based on Scythe competitive strategy
// Priority: Enlist > Deploy Speed > 5 Workers > Produce+Bottom > Expand territory
// ══════════════════════════════════════════════════════

// Evaluate game phase: early (0-2 stars), mid (3-4), late (5+)
const getPhase = (p) => p.stars >= 5 ? "late" : p.stars >= 3 ? "mid" : "early";

// Score a column choice based on strategic value
const scoreColumn = (p, col, empire, enemyHexes, rails) => {
  const action = p.topRow[col];
  const f = FACTIONS[p.faction];
  const phase = getPhase(p);
  const costs = getBottomCost(p);
  const bc = costs[col];
  const bottomAction = BOTTOM[col];
  let score = 0;

  // Can we afford the bottom action?
  const canBottom = bc && (countRes(p, bc.res) >= bc.qty || (bottomAction === "Deploy" && p.faction === "nations" && countRes(p, "bois") >= bc.qty));
  const bottomMaxed = bottomAction === "Upgrade" ? (p.upgrades || 0) >= 6
    : bottomAction === "Deploy" ? p.mechs.length >= 4
    : bottomAction === "Build" ? (p.buildings || []).length >= 4
    : (p.recruits || 0) >= 4;

  // HUGE bonus for being able to do a bottom action (it's the main way to get stars)
  if (canBottom && !bottomMaxed) {
    score += 25;
    // Priority order for bottom actions based on strategy guide:
    // Enlist > Deploy > Build > Upgrade
    if (bottomAction === "Enlist") score += 15;
    else if (bottomAction === "Deploy") {
      score += 12;
      // Speed mech first is critical
      if (p.mechs.length === 0) score += 10;
    }
    else if (bottomAction === "Build") score += 8;
    else if (bottomAction === "Upgrade") score += 5;
  }

  // Top action value
  if (action === "Produce") {
    if (canPayProduce(p)) {
      score += 10;
      // High value early game for resource generation
      if (phase === "early") score += 8;
      // More workers = more production value
      const wHexes = new Set(p.workers.map(w => w.hexId));
      score += Math.min(wHexes.size, 2) * 3;
    }
  } else if (action === "Trade") {
    if (p.coins >= 1) {
      score += 6;
      // Trade is good when we need resources for a bottom action
      if (canBottom && !bottomMaxed) score += 4;
      // Also good for getting pop in late game
      if (phase === "late") score += 3;
    }
  } else if (action === "Bolster") {
    if (p.coins >= 1) {
      score += 5;
      // Value increases if we have Arsenal/Memorial buildings
      if ((p.buildings || []).some(b => b.type === "arsenal")) score += 3;
      if ((p.buildings || []).some(b => b.type === "memorial")) score += 3;
      // Need power for combat
      if (p.power < 4) score += 4;
      // Star potential at 16 power
      if (p.power >= 13) score += 5;
    }
  } else if (action === "Move") {
    score += 7;
    // Move is critical in late game for territory
    if (phase === "late") score += 8;
    // Early game: spread workers
    if (phase === "early" && p.workers.length >= 3) score += 3;
    // Move toward encounters
    if (!p.encDone) score += 2;
  }

  return score;
};

// Choose best hex to move toward (strategic targeting)
const pickMoveTarget = (validMoves, p, empire, enemyHexes, purpose) => {
  if (validMoves.length === 0) return null;

  let bestHex = null, bestScore = -999;
  for (const hexId of validMoves) {
    const hex = hMap[hexId];
    if (!hex) continue;
    let s = 0;
    const t = TERRAINS[hex.t];

    // Resource hex value
    if (t && t.res && t.res !== "ouvriers") s += 3;
    if (t && t.res === "ouvriers" && p.workers.length < 5) s += 4;

    // Avoid enemy hexes for workers (displacement risk)
    if (purpose === "worker" && enemyHexes && enemyHexes.has(hexId)) s -= 15;

    // Move toward uncontrolled resource hexes
    const myHexes = new Set([p.hero, ...p.workers.map(w => w.hexId), ...p.mechs.map(m => m.hexId)]);
    if (!myHexes.has(hexId)) s += 2; // new territory

    // Move toward encounters
    if (purpose === "hero" && hex.encounter && !p.encDone) s += 5;

    // Move toward Rouge River if haven't visited
    if (purpose === "hero" && hexId === 22 && !p.rrVisited) s += 4;

    // Avoid lakes/swamps for non-appropriate factions
    if (hex.t === "lac" || hex.t === "marecage") s -= 5;

    if (s > bestScore) { bestScore = s; bestHex = hexId; }
  }
  return bestHex || validMoves[Math.floor(Math.random() * validMoves.length)];
};

// Choose which building to construct based on phase
const pickBuilding = (p, availBuildings) => {
  const phase = getPhase(p);
  // Priority: Moulin early, Gare mid, Arsenal/Memorial late
  const priority = phase === "early" ? ["moulin", "gare", "arsenal", "memorial"]
    : phase === "mid" ? ["gare", "moulin", "memorial", "arsenal"]
    : ["memorial", "arsenal", "gare", "moulin"];
  for (const t of priority) {
    const b = availBuildings.find(bt => bt.type === t);
    if (b) return b;
  }
  return availBuildings[0];
};

// Choose which top cube to remove for upgrade (prefer less useful actions)
const pickUpgradeSource = (p, validTops) => {
  // Prefer removing cubes from Trade/Bolster (less critical) over Move/Produce
  const actionPriority = { Trade: 0, Bolster: 1, Produce: 2, Move: 3 };
  return validTops.sort((a, b) => (actionPriority[p.topRow[a]] || 2) - (actionPriority[p.topRow[b]] || 2))[0];
};

// Choose which bottom slot for upgrade destination (prefer highest value)
const pickUpgradeDest = (p, validBottoms, mat) => {
  // Prefer Enlist > Deploy > Build > Upgrade cost reduction
  const priority = { 3: 0, 1: 1, 2: 2, 0: 3 }; // Enlist=3, Deploy=1, Build=2, Upgrade=0
  return validBottoms.sort((a, b) => (priority[a] ?? 2) - (priority[b] ?? 2))[0];
};

export const botTurn = (player, empire, enemyHexes, rails) => {
  const f = FACTIONS[player.faction];
  const p = { ...player, workers: [...player.workers], mechs: [...player.mechs], resources: { ...player.resources } };
  const logs = [];

  // ── STRATEGIC COLUMN SELECTION ──
  const cols = [0, 1, 2, 3].filter(c => c !== p.lastCol);
  let bestCol = cols[0], bestScore = -999;
  for (const col of cols) {
    const s = scoreColumn(p, col, empire, enemyHexes, rails);
    if (s > bestScore) { bestScore = s; bestCol = col; }
  }
  const col = bestCol;
  const action = p.topRow[col];

  // ── EXECUTE TOP ACTION ──
  if (action === "Move") {
    // Nations Pack Up (strategic building repositioning)
    if (p.faction === "nations" && (p.unlockedAbilities || []).includes(3) && (p.buildings || []).length > 0 && Math.random() < 0.3) {
      const bi = Math.floor(Math.random() * (p.buildings || []).length);
      const bld = p.buildings[bi];
      const adjTargets = (ADJ[bld.hexId] || []).filter(id => { const h = hMap[id]; return h && h.t !== "lac" && h.t !== "marecage" && !(p.buildings || []).some(b => b.hexId === id); });
      if (adjTargets.length > 0) {
        const target = adjTargets[Math.floor(Math.random() * adjTargets.length)];
        p.buildings = [...(p.buildings || [])];
        p.buildings[bi] = { ...p.buildings[bi], hexId: target };
        const bt = BUILDING_TYPES.find(t => t.type === bld.type);
        logs.push(`🤖📦 ${f.name}: Pack Up ${bt ? bt.name : bld.type} #${bld.hexId}→#${target}`);
      }
    }

    // Move hero strategically
    const validHero = getValidMoves(p.hero, p.faction, p.unlockedAbilities || [], p, rails);
    if (validHero.length > 0) {
      const fromHex = p.hero;
      const target = pickMoveTarget(validHero, p, empire, enemyHexes, "hero");
      p.hero = target;
      const tr = transportUnits(p, fromHex, target, "hero");
      Object.assign(p, { resources: tr.player.resources });
      const tl = tr.carried.resTypes.length > 0 ? ` 📦${tr.carried.resTypes.join(",")}` : "";
      logs.push(`🤖 ${f.name}: ${f.hero} → #${target}${tl}`);
      // Frente trap placement
      if (p.faction === "frente" && (p.trapTokens || []).length < 4 && !(p.trapTokens || []).some(t => t.hexId === target)) {
        p.trapTokens = [...(p.trapTokens || []), { hexId: target, disarmed: false }];
        logs.push(`🤖🪤 ${f.name}: Trap #${target} (${p.trapTokens.length}/4)`);
      }
      // Acadiane flag placement
      if (p.faction === "acadiane" && (p.flagTokens || []).length < 4 && !(p.flagTokens || []).some(fl => fl.hexId === target)) {
        p.flagTokens = [...(p.flagTokens || []), { hexId: target }];
        logs.push(`🤖🏴 ${f.name}: Comptoir #${target} (${p.flagTokens.length}/4)`);
      }
    }

    // Move workers or mechs strategically
    if (p.workers.length > 0) {
      // Move worker most in need of repositioning
      const wi = Math.floor(Math.random() * p.workers.length);
      let wv = getValidMoves(p.workers[wi].hexId, p.faction, p.unlockedAbilities || [], p, rails);
      // Workers avoid enemies
      if (enemyHexes) wv = wv.filter(id => !enemyHexes.has(id));
      if (wv.length > 0) {
        const wt = pickMoveTarget(wv, p, empire, enemyHexes, "worker");
        p.workers[wi] = { ...p.workers[wi], hexId: wt };
        logs.push(`🤖 ${f.name}: Ouv. → #${wt}`);
      }
    } else if (p.mechs.length > 0) {
      const mi = Math.floor(Math.random() * p.mechs.length);
      const fromHex = p.mechs[mi].hexId;
      const mv = getValidMoves(fromHex, p.faction, p.unlockedAbilities || [], p, rails);
      if (mv.length > 0) {
        const mt = pickMoveTarget(mv, p, empire, enemyHexes, "mech");
        p.mechs[mi] = { ...p.mechs[mi], hexId: mt };
        const tr = transportUnits(p, fromHex, mt, "mech");
        Object.assign(p, { workers: tr.player.workers, resources: tr.player.resources });
        let tl = "";
        if (tr.carried.workers > 0) tl += ` 👷×${tr.carried.workers}`;
        if (tr.carried.resTypes.length > 0) tl += ` 📦${tr.carried.resTypes.join(",")}`;
        logs.push(`🤖 ${f.name}: Mech → #${mt}${tl}`);
      }
    }
  } else if (action === "Bolster") {
    if (p.coins >= 1) {
      p.coins--;
      const hasArsenal = (p.buildings || []).some(b => b.type === "arsenal");
      const hasMemorial = (p.buildings || []).some(b => b.type === "memorial");
      // Strategic choice: power if low or near star, cards if combat likely
      const needPower = p.power < 8 || p.power >= 14;
      if (needPower) {
        const bonus = hasArsenal ? 1 : 0;
        p.power = Math.min(p.power + 2 + bonus, 16);
        logs.push(`🤖 ${f.name}: +${2 + bonus} pui${hasArsenal ? " (Arsenal)" : ""}`);
      } else {
        p.combatCards++;
        logs.push(`🤖 ${f.name}: +1 CC`);
      }
      if (hasMemorial) { p.pop = Math.min(p.pop + 1, 18); logs.push(`🤖🪦 ${f.name}: +1 Pop (Mémorial)`); }
      // Star check: power 16
      if (p.power >= 16 && !p.starPower) { p.stars++; p.starPower = true; logs.push(`⭐ ${f.name}: Puissance max !`); }
    } else logs.push(`🤖 ${f.name}: (pas d'$)`);
  } else if (action === "Produce") {
    if (!canPayProduce(p)) { logs.push(`🤖 ${f.name}: (coût prod.)`); } else {
      payProduce(p);
      const byHex = {}; p.workers.forEach(w => { if (!byHex[w.hexId]) byHex[w.hexId] = []; byHex[w.hexId].push(w); });
      // Pick best 2 hexes (prefer resource hexes, limit workers to 5 total)
      const hexIds = Object.keys(byHex)
        .sort((a, b) => {
          const ha = hMap[parseInt(a)], hb = hMap[parseInt(b)];
          const ra = ha && TERRAINS[ha.t]?.res ? 1 : 0;
          const rb = hb && TERRAINS[hb.t]?.res ? 1 : 0;
          return rb - ra || byHex[b].length - byHex[a].length;
        })
        .slice(0, 2);
      hexIds.forEach(hidStr => {
        const hid = parseInt(hidStr); const hex = hMap[hid]; const t = TERRAINS[hex.t]; let wc = byHex[hidStr].length;
        const hasMoulin = (p.buildings || []).some(b => b.type === "moulin" && b.hexId === hid);
        if (hasMoulin) wc++;
        // Strategic worker cap at 5 (Stegmaier's rule)
        if (hex.t === "village" && p.workers.length < 5) {
          const toAdd = Math.min(wc, 5 - p.workers.length);
          for (let i = 0; i < toAdd; i++) p.workers.push({ id: `${p.faction}_w${p.workers.length}`, hexId: hid });
          if (toAdd > 0) logs.push(`🤖 ${f.name}: +${toAdd} ouv. #${hid}`);
          // Star check: 8 workers
          if (p.workers.length >= 8 && !p.starWorkers) { p.stars++; p.starWorkers = true; logs.push(`⭐ ${f.name}: 8 ouvriers !`); }
        }
        else if (t.res && t.res !== "ouvriers") { if (!p.resources[hidStr]) p.resources[hidStr] = {}; p.resources[hidStr][t.res] = (p.resources[hidStr][t.res] || 0) + wc; }
      });
      logs.push(`🤖 ${f.name}: Produce`);
    }
  } else if (action === "Trade") {
    if (p.coins >= 1) {
      // Strategic resource choice: pick what we need for upcoming bottom action
      const costs = getBottomCost(p);
      const bc = costs[col];
      let targetRes = null;

      // Check which bottom action we're saving for
      for (let ci = 0; ci < 4; ci++) {
        if (ci === p.lastCol) continue;
        const bCosts = costs[ci];
        const bAction = BOTTOM[ci];
        const bMaxed = bAction === "Upgrade" ? (p.upgrades || 0) >= 6
          : bAction === "Deploy" ? p.mechs.length >= 4
          : bAction === "Build" ? (p.buildings || []).length >= 4
          : (p.recruits || 0) >= 4;
        if (!bMaxed && bCosts && countRes(p, bCosts.res) < bCosts.qty) {
          targetRes = bCosts.res;
          break;
        }
      }
      if (!targetRes) {
        const types = ["metal", "bois", "nourriture", "petrole"];
        targetRes = types[Math.floor(Math.random() * types.length)];
      }

      const wHex = p.workers.length > 0 ? String(p.workers[0].hexId) : String(p.hero);
      if (!p.resources[wHex]) p.resources[wHex] = {};
      p.resources[wHex][targetRes] = (p.resources[wHex][targetRes] || 0) + 2; p.coins--;
      logs.push(`🤖 ${f.name}: +2 ${targetRes}`);
    } else {
      // No coins: take pop instead if possible (shouldn't happen often)
      logs.push(`🤖 ${f.name}: (pas d'$)`);
    }
  }
  p.lastCol = col;

  // ── BOTTOM ACTION ──
  const bottomAction = BOTTOM[col];
  const botCosts = getBottomCost(p);
  const bc = botCosts[col];
  const canAffordBottom = bc && (countRes(p, bc.res) >= bc.qty || (bottomAction === "Deploy" && p.faction === "nations" && countRes(p, "bois") >= bc.qty));
  if (canAffordBottom) {
    if (bottomAction === "Upgrade" && (p.upgrades || 0) < 6) {
      const sp = spendRes(p, bc.res, bc.qty); Object.assign(p, { resources: sp.resources });
      const mat = MATS.find(m => m.id === p.matId);
      const validTop = []; const validBottom = [];
      if (mat) {
        (p.cubesOnTop || []).forEach((c, i) => { if (c > 0) validTop.push(i); });
        (mat.bottomSlots || []).forEach((s, i) => { if ((p.cubesOnBottom || [])[i] < s) validBottom.push(i); });
      }
      if (validTop.length > 0 && validBottom.length > 0) {
        const fromC = pickUpgradeSource(p, validTop);
        const toC = pickUpgradeDest(p, validBottom, mat);
        p.cubesOnTop = [...(p.cubesOnTop || [])]; p.cubesOnTop[fromC]--;
        p.cubesOnBottom = [...(p.cubesOnBottom || [])]; p.cubesOnBottom[toC]++;
        p.coins += (mat.bottomCosts[toC].bonus || 0);
      }
      p.upgrades = (p.upgrades || 0) + 1;
      if (p.upgrades >= 6 && !p.starUpgrades) { p.stars++; p.starUpgrades = true; logs.push(`⭐ ${f.name}: 6 upgrades !`); }
      logs.push(`🤖 ${f.name}: Upgrade ${p.upgrades}/6`);
    } else if (bottomAction === "Deploy" && p.mechs.length < 4) {
      const wh = getWorkerHexes(p);
      if (wh.length > 0) {
        const deployRes = (p.faction === "nations" && countRes(p, bc.res) < bc.qty) ? "bois" : bc.res;
        const sp = spendRes(p, deployRes, bc.qty); Object.assign(p, { resources: sp.resources });
        // Deploy on worker hex closest to center (strategic position)
        const centerX = 500, centerY = 500;
        const th = wh.sort((a, b) => {
          const ha = hMap[a], hb = hMap[b];
          if (!ha || !hb) return 0;
          const da = Math.sqrt((ha.rx - centerX) ** 2 + (ha.ry - centerY) ** 2);
          const db = Math.sqrt((hb.rx - centerX) ** 2 + (hb.ry - centerY) ** 2);
          return da - db;
        })[0];
        const abilityIdx = p.mechs.length;
        const abilityNames = ["Speed", "Riverwalk", "Combat", "Position"];
        p.mechs.push({ id: `${p.faction}_m${p.mechs.length}`, hexId: th });
        p.unlockedAbilities = [...(p.unlockedAbilities || []), abilityIdx];
        if (p.mechs.length >= 4 && !p.starMechs) { p.stars++; p.starMechs = true; logs.push(`⭐ ${f.name}: 4 mechas !`); }
        logs.push(`🤖 ${f.name}: Deploy #${th} → 🔓 ${abilityNames[abilityIdx]}`);
      }
    } else if (bottomAction === "Build" && (p.buildings || []).length < 4) {
      const wh = getWorkerHexes(p).filter(h => !(p.buildings || []).some(b => b.hexId === h));
      const avail = BUILDING_TYPES.filter(bt => !(p.buildings || []).some(b => b.type === bt.type));
      if (wh.length > 0 && avail.length > 0) {
        const sp = spendRes(p, bc.res, bc.qty); Object.assign(p, { resources: sp.resources });
        const building = pickBuilding(p, avail);
        p.buildings = [...(p.buildings || []), { type: building.type, hexId: wh[0] }];
        if (p.buildings.length >= 4 && !p.starBuildings) { p.stars++; p.starBuildings = true; logs.push(`⭐ ${f.name}: 4 bâtiments !`); }
        logs.push(`🤖 ${f.name}: Build ${building.name} #${wh[0]}`);
        // Gare: place rails
        if (building.type === "gare") {
          let railFrom = wh[0];
          for (let ri = 0; ri < 3; ri++) {
            const adjH = (ADJ[railFrom] || []).filter(id => {
              const h = hMap[id]; if (!h) return false;
              return !rails.some(([a, b]) => (a === railFrom && b === id) || (a === id && b === railFrom));
            });
            if (adjH.length > 0) {
              const to = adjH[Math.floor(Math.random() * adjH.length)];
              if (!p._pendingRails) p._pendingRails = [];
              p._pendingRails.push([railFrom, to]);
              logs.push(`🤖🛤 ${f.name}: Rail #${railFrom}↔#${to}`);
              railFrom = to;
            }
          }
        }
      }
    } else if (bottomAction === "Enlist" && (p.recruits || 0) < 4) {
      const sp = spendRes(p, bc.res, bc.qty); Object.assign(p, { resources: sp.resources });
      p.recruits = (p.recruits || 0) + 1;
      // Strategic enlist: prioritize power > coins > pop > cards
      const priority = [0, 1, 2, 3]; // power, coins, pop, cards
      const freeSlots = priority.filter(ci => !(p.enlistMap || [])[ci]);
      if (freeSlots.length > 0) {
        const pick = freeSlots[0]; // highest priority available
        p.enlistMap = [...(p.enlistMap || [false, false, false, false])];
        p.enlistMap[pick] = true;
        const imm = [
          pp => { pp.power = Math.min(pp.power + 2, 16); },
          pp => { pp.coins += 2; },
          pp => { pp.pop = Math.min(pp.pop + 2, 18); },
          pp => { pp.combatCards += 2; },
        ][pick];
        if (imm) imm(p);
        logs.push(`🤖 ${f.name}: Enlist → ${BOTTOM[pick]} (${ENLIST_ONGOING[pick].icon})`);
      }
      if (p.recruits >= 4 && !p.starRecruits) { p.stars++; p.starRecruits = true; logs.push(`⭐ ${f.name}: 4 recrues !`); }
    }
  }

  // ── OBJECTIVE CHECK ──
  if (p.objective && !p.objectiveRevealed && p.objective.check(p)) { p.objectiveRevealed = true; p.stars++; logs.push(`⭐ ${f.name}: objectif !`); }
  const fObj = FACTIONS[p.faction]?.fObj;
  if (fObj && !p.fObjRevealed && fObj.check(p)) { p.fObjRevealed = true; p.stars++; logs.push(`🏛⭐ ${f.name}: obj. faction !`); }

  // ── DOMINION COMMERCE IMPÉRIAL ──
  if (p.faction === "dominion") {
    const resTypes = ["metal", "bois", "nourriture", "petrole"];
    const available = resTypes.filter(r => countRes(p, r) >= 1);
    if (available.length > 0) {
      // Prefer spending least useful resource
      const pick = available[available.length - 1];
      const sp = spendRes(p, pick, 1); Object.assign(p, { resources: sp.resources });
      // Strategic choice: coins early/mid, cards if combat imminent
      if (p.combatCards < 2 && Math.random() < 0.4) {
        p.combatCards++; logs.push(`🤖🏛 ${f.name}: Commerce -1${pick}→+1CC`);
      } else {
        p.coins += 2; p.imperialCoins = (p.imperialCoins || 0) + 2; logs.push(`🤖🏛 ${f.name}: Commerce -1${pick}→+2$`);
      }
    }
  }

  return { player: p, logs, bottomCol: canAffordBottom ? col : -1 };
};
