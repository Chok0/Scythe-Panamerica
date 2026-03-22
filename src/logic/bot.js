import { FACTIONS } from '../data/factions.js';
import { TERRAINS } from '../data/terrains.js';
import { hMap, ADJ, HEXES, HOME_BASES } from '../data/hexes.js';
import { MATS, BOTTOM, BUILDING_TYPES, ENLIST_ONGOING, getBottomCost } from '../data/mats.js';
import { countRes, spendRes, getWorkerHexes } from './resources.js';
import { canPayProduce, payProduce } from './production.js';
import { getValidMoves } from './movement.js';
import { transportUnits } from './transport.js';

export const botTurn = (player, empire, enemyHexes, rails) => {
  const f = FACTIONS[player.faction];
  const p = { ...player, workers: [...player.workers], mechs: [...player.mechs], resources: { ...player.resources } };
  const logs = [];
  const cols = [0, 1, 2, 3].filter(c => c !== p.lastCol);
  const col = cols[Math.floor(Math.random() * cols.length)];
  const action = p.topRow[col];

  if (action === "Move") {
    // Nations Pack Up
    if (p.faction === "nations" && (p.unlockedAbilities || []).includes(3) && (p.buildings || []).length > 0 && Math.random() < 0.5) {
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
    const valid = getValidMoves(p.hero, p.faction, p.unlockedAbilities || [], p, rails);
    if (valid.length > 0) {
      const fromHex = p.hero;
      const target = valid[Math.floor(Math.random() * valid.length)];
      p.hero = target;
      const tr = transportUnits(p, fromHex, target, "hero");
      Object.assign(p, { resources: tr.player.resources });
      const tl = tr.carried.resTypes.length > 0 ? ` 📦${tr.carried.resTypes.join(",")}` : "";
      logs.push(`🤖 ${f.name}: ${f.hero} → #${target}${tl}`);
      if (p.faction === "frente" && (p.trapTokens || []).length < 4 && !(p.trapTokens || []).some(t => t.hexId === target)) {
        p.trapTokens = [...(p.trapTokens || []), { hexId: target, disarmed: false }];
        logs.push(`🤖🪤 ${f.name}: Trap #${target} (${p.trapTokens.length}/4)`);
      }
      if (p.faction === "acadiane" && (p.flagTokens || []).length < 4 && !(p.flagTokens || []).some(fl => fl.hexId === target)) {
        p.flagTokens = [...(p.flagTokens || []), { hexId: target }];
        logs.push(`🤖🏴 ${f.name}: Comptoir #${target} (${p.flagTokens.length}/4)`);
      }
    }
    if (p.workers.length > 0) {
      const wi = Math.floor(Math.random() * p.workers.length);
      let wv = getValidMoves(p.workers[wi].hexId, p.faction, p.unlockedAbilities || [], p, rails);
      if (enemyHexes) wv = wv.filter(id => !enemyHexes.has(id));
      if (wv.length > 0) { const wt = wv[Math.floor(Math.random() * wv.length)]; p.workers[wi] = { ...p.workers[wi], hexId: wt }; logs.push(`🤖 ${f.name}: Ouv. → #${wt}`); }
    } else if (p.mechs.length > 0) {
      const mi = Math.floor(Math.random() * p.mechs.length);
      const fromHex = p.mechs[mi].hexId;
      const mv = getValidMoves(fromHex, p.faction, p.unlockedAbilities || [], p, rails);
      if (mv.length > 0) {
        const mt = mv[Math.floor(Math.random() * mv.length)];
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
      if (Math.random() > 0.5) { const bonus = hasArsenal ? 1 : 0; p.power = Math.min(p.power + 2 + bonus, 16); logs.push(`🤖 ${f.name}: +${2 + bonus} pui${hasArsenal ? " (Arsenal)" : ""}`); }
      else { p.combatCards++; logs.push(`🤖 ${f.name}: +1 CC`); }
      if (hasMemorial) { p.pop = Math.min(p.pop + 1, 18); logs.push(`🤖🪦 ${f.name}: +1 Pop (Mémorial)`); }
    } else logs.push(`🤖 ${f.name}: (pas d'$)`);
  } else if (action === "Produce") {
    if (!canPayProduce(p)) { logs.push(`🤖 ${f.name}: (coût prod.)`); } else {
      payProduce(p);
      const byHex = {}; p.workers.forEach(w => { if (!byHex[w.hexId]) byHex[w.hexId] = []; byHex[w.hexId].push(w); });
      const hexIds = Object.keys(byHex).slice(0, 2);
      hexIds.forEach(hidStr => {
        const hid = parseInt(hidStr); const hex = hMap[hid]; const t = TERRAINS[hex.t]; let wc = byHex[hidStr].length;
        const hasMoulin = (p.buildings || []).some(b => b.type === "moulin" && b.hexId === hid);
        if (hasMoulin) wc++;
        if (hex.t === "village" && p.workers.length < 8) { for (let i = 0; i < wc && p.workers.length < 8; i++) p.workers.push({ id: `${p.faction}_w${p.workers.length}`, hexId: hid }); logs.push(`🤖 ${f.name}: +ouv. #${hid}`); }
        else if (t.res && t.res !== "ouvriers") { if (!p.resources[hidStr]) p.resources[hidStr] = {}; p.resources[hidStr][t.res] = (p.resources[hidStr][t.res] || 0) + wc; }
      });
      logs.push(`🤖 ${f.name}: Produce`);
    }
  } else if (action === "Trade") {
    if (p.coins >= 1) {
      const types = ["metal", "bois", "nourriture", "petrole"];
      const rt = types[Math.floor(Math.random() * types.length)];
      const wHex = p.workers.length > 0 ? String(p.workers[0].hexId) : String(p.hero);
      if (!p.resources[wHex]) p.resources[wHex] = {};
      p.resources[wHex][rt] = (p.resources[wHex][rt] || 0) + 2; p.coins--;
      logs.push(`🤖 ${f.name}: +2 ${rt}`);
    } else logs.push(`🤖 ${f.name}: (pas d'$)`);
  }
  p.lastCol = col;

  // Bot attempts bottom-row action
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
        const fromC = validTop[Math.floor(Math.random() * validTop.length)];
        const toC = validBottom[Math.floor(Math.random() * validBottom.length)];
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
        const th = wh[Math.floor(Math.random() * wh.length)];
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
        p.buildings = [...(p.buildings || []), { type: avail[0].type, hexId: wh[0] }];
        if (p.buildings.length >= 4 && !p.starBuildings) { p.stars++; p.starBuildings = true; logs.push(`⭐ ${f.name}: 4 bâtiments !`); }
        logs.push(`🤖 ${f.name}: Build ${avail[0].name} #${wh[0]}`);
        if (avail[0].type === "gare") {
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
      const freeSlots = [0, 1, 2, 3].filter(ci => !(p.enlistMap || [])[ci]);
      if (freeSlots.length > 0) {
        const pick = freeSlots[Math.floor(Math.random() * freeSlots.length)];
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
  if (p.objective && !p.objectiveRevealed && p.objective.check(p)) { p.objectiveRevealed = true; p.stars++; logs.push(`⭐ ${f.name}: objectif !`); }
  const fObj = FACTIONS[p.faction]?.fObj;
  if (fObj && !p.fObjRevealed && fObj.check(p)) { p.fObjRevealed = true; p.stars++; logs.push(`🏛⭐ ${f.name}: obj. faction !`); }
  // Dominion Commerce Impérial
  if (p.faction === "dominion") {
    const resTypes = ["metal", "bois", "nourriture", "petrole"];
    const available = resTypes.filter(r => countRes(p, r) >= 1);
    if (available.length > 0) {
      const pick = available[Math.floor(Math.random() * available.length)];
      const sp = spendRes(p, pick, 1); Object.assign(p, { resources: sp.resources });
      if (Math.random() < 0.6) { p.coins += 2; p.imperialCoins = (p.imperialCoins || 0) + 2; logs.push(`🤖🏛 ${f.name}: Commerce -1${pick}→+2$`); }
      else { p.combatCards++; logs.push(`🤖🏛 ${f.name}: Commerce -1${pick}→+1CC`); }
    }
  }
  return { player: p, logs, bottomCol: canAffordBottom ? col : -1 };
};
