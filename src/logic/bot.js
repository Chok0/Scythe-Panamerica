import { FACTIONS } from '../data/factions.js';
import { TERRAINS } from '../data/terrains.js';
import { hMap, ADJ, HEXES, HOME_BASES } from '../data/hexes.js';
import { MATS, BOTTOM, BUILDING_TYPES, ENLIST_ONGOING, getBottomCost } from '../data/mats.js';
import { countRes, spendRes, getWorkerHexes } from './resources.js';
import { canPayProduce, payProduce } from './production.js';
import { getValidMoves, findPathWaypoints, marshToll } from './movement.js';
import { transportUnits } from './transport.js';
import { BOT_PROFILES } from './botProfiles.js';
import { BALANCE } from '../data/balance.js';
import { getMechAbilities } from '../data/mechAbilities.js';
import { getPlanBottomBonus } from './planEffects.js';

// ══════════════════════════════════════════════════════
// Strategic Bot AI — based on Scythe competitive strategy
// Priority: Enlist > Deploy Speed > 5 Workers > Produce+Bottom > Expand territory
// ══════════════════════════════════════════════════════

// Evaluate game phase: early (0-2 stars), mid (3-4), late (5+)
const getPhase = (p) => p.stars >= 5 ? "late" : p.stars >= 3 ? "mid" : "early";

// Bottom action maxed out? (no more stars/progress from it)
const isBottomMaxed = (p, bottomAction) =>
  bottomAction === "Upgrade" ? (p.upgrades || 0) >= 6
    : bottomAction === "Deploy" ? p.mechs.length >= 4
    : bottomAction === "Build" ? (p.buildings || []).length >= 4
    : (p.recruits || 0) >= 4;

// Ressources manquantes pour les actions bottom encore utiles → { resType: qtyManquante }
// C'est le coeur de la planification : production et déplacements d'ouvriers visent ces types
const neededResources = (p) => {
  const costs = getBottomCost(p);
  const need = {};
  BOTTOM.forEach((ba, ci) => {
    if (isBottomMaxed(p, ba)) return;
    const bc = costs[ci];
    if (!bc) return;
    const missing = bc.qty - countRes(p, bc.res);
    if (missing > 0) need[bc.res] = Math.max(need[bc.res] || 0, missing);
  });
  return need;
};

// Score a column choice based on strategic value
const scoreColumn = (p, col, empire, enemyHexes, rails, prof) => {
  const action = p.topRow[col];
  const f = FACTIONS[p.faction];
  const phase = getPhase(p);
  const costs = getBottomCost(p);
  const bc = costs[col];
  const bottomAction = BOTTOM[col];
  let score = 0;

  // Can we afford the bottom action?
  const altRes = FACTIONS[p.faction]?.deployAltRes;
  const canBottom = bc && (countRes(p, bc.res) >= bc.qty || (bottomAction === "Deploy" && altRes && countRes(p, altRes) >= bc.qty));
  const bottomMaxed = bottomAction === "Upgrade" ? (p.upgrades || 0) >= 6
    : bottomAction === "Deploy" ? p.mechs.length >= 4
    : bottomAction === "Build" ? (p.buildings || []).length >= 4
    : (p.recruits || 0) >= 4;

  // Corpus stratégie : l'étoile Amélioration est un piège de tempo — 2 upgrades
  // suffisent (réduction de coût) ; en fin de course (4+ étoiles) l'étoile
  // 6-upgrades redevient une source valable pour boucler la partie
  const upgradeWorthIt = (p.upgrades || 0) < 2 || p.stars >= 4;
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
    else if (bottomAction === "Upgrade") { if (upgradeWorthIt) score += 5; else score -= 20; }
    // Blitz : priorité absolue aux bottoms à une action de leur étoile
    if (prof.starRush) {
      const oneAway = bottomAction === "Upgrade" ? (p.upgrades || 0) === 5
        : bottomAction === "Deploy" ? p.mechs.length === 3
        : bottomAction === "Build" ? (p.buildings || []).length === 3
        : (p.recruits || 0) === 3;
      if (oneAway) score += prof.starRush;
    }
  } else if (bottomMaxed) {
    // Colonne au bottom épuisé : le top seul doit vraiment valoir le coup
    score -= 8;
  }

  // Top action value
  if (action === "Produce") {
    if (canPayProduce(p)) {
      score += 10 + prof.produceBoost;
      // High value early game for resource generation
      if (phase === "early") score += 8;
      // More workers = more production value
      const wHexes = new Set(p.workers.map(w => w.hexId));
      score += Math.min(wHexes.size, 2) * 3;
      // Planification : produire vaut plus si nos ouvriers sont sur des hex
      // qui produisent les ressources dont nos bottoms ont besoin
      const need = neededResources(p);
      for (const hid of wHexes) {
        const h = hMap[hid];
        const res = h && TERRAINS[h.t]?.res;
        if (res && need[res]) { score += 5; break; }
      }
    }
  } else if (action === "Trade") {
    if (p.coins >= 1) {
      score += 6;
      // Trade is good when we need resources for a bottom action
      if (canBottom && !bottomMaxed) score += 4;
      // Also good for getting pop in late game
      if (phase === "late") score += 3;
      // Maintenir le palier de pop du profil — sous le palier 7, tout le score
      // final est amputé (multiplicateurs ×3/×2/×1) et Produce à 5+ ouvriers
      // coûte 1 pop (à 0 pop l'économie se bloque)
      if (p.pop < prof.popTarget && (p.stars >= 1 || p.workers.length >= 5)) score += prof.tradePopBoost;
      if (prof.chasePopStar && p.pop >= 13 && !p.starPop) score += 6;
    }
  } else if (action === "Bolster") {
    if (p.coins >= 1) {
      score += 5 + prof.bolsterBoost;
      // Value increases if we have Arsenal/Memorial buildings
      if ((p.buildings || []).some(b => b.type === "arsenal")) score += 3;
      if ((p.buildings || []).some(b => b.type === "memorial")) score += 3;
      // Need power for combat
      if (p.power < 4) score += 4;
      // Star potential at 16 power
      if (p.power >= 13) score += 5;
    }
  } else if (action === "Move") {
    score += 7 + (prof.moveBoost || 0);
    // Ouvriers empilés (≥3 sur un hex) : le Move de désempilage est prioritaire
    const stacks = {};
    p.workers.forEach(w => { stacks[w.hexId] = (stacks[w.hexId] || 0) + 1; });
    if (Object.values(stacks).some(n => n >= 3)) score += 5;
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
// ctx: { attackable:Set (hex des unités combattantes d'autres BOTS), forbidden:Set
// (hex des unités combattantes du joueur humain — jamais ciblées), encounterHexes:Set }
const pickMoveTarget = (validMoves, p, empire, enemyHexes, purpose, ctx, prof) => {
  if (validMoves.length === 0) return null;

  // Estimation de notre force de combat pour décider d'attaquer
  const myStrength = p.power + (p.combatCards || 0) * 3;
  const wantCombatStar = (p.combatWins || 0) < 2;
  // Planification : les ouvriers convergent vers les ressources manquantes des bottoms
  const need = neededResources(p);
  // Aimant à magot : le plus gros tas ennemi (≥6) attire les profils agressifs
  // sur PLUSIEURS tours (convergence vers la cible, pas seulement l'adjacence)
  let hoardHex = null, hoardQty = 0;
  if ((purpose === "hero" || purpose === "mech") && ctx && ctx.hexLoot && prof.aggroMargin <= 2) {
    ctx.hexLoot.forEach((q, hid) => { if (q > hoardQty) { hoardQty = q; hoardHex = hid; } });
    if (hoardQty < 6) hoardHex = null;
  }

  let bestHex = null, bestScore = -999;
  for (const hexId of validMoves) {
    const hex = hMap[hexId];
    if (!hex) continue;
    let s = 0;
    const t = TERRAINS[hex.t];

    // Resource hex value
    if (t && t.res && t.res !== "ouvriers") s += 3;
    if (t && t.res === "ouvriers" && p.workers.length < 5) s += 4;
    // Hex produisant une ressource dont un bottom a besoin : priorité forte pour les ouvriers
    if (purpose === "worker" && t && t.res && need[t.res]) s += 8;

    // Avoid enemy hexes for workers (displacement risk)
    if (purpose === "worker" && enemyHexes && enemyHexes.has(hexId)) s -= 15;
    if (purpose === "hero" || purpose === "mech") {
      if (ctx && ctx.attackable && ctx.attackable.has(hexId)) {
        // Combat PvP : l'agressivité dépend du profil — l'équilibré attaque
        // sur avantage réel (corpus : unités isolées / 2v1), le blitz à force
        // égale et dès le début, le bâtisseur/thésauriseur presque jamais
        const defStrength = ctx.attackable.get ? (ctx.attackable.get(hexId) || 0) : 0;
        // Butin : le vainqueur prend les ressources du hex — plus le magot est
        // gros, plus il attire (motivation au combat voulue par le design :
        // les empilements déclenchent des chaînes de batailles)
        const loot = ctx.hexLoot ? Math.min(12, ctx.hexLoot.get(hexId) || 0) : 0;
        // Méta : harceler la faction avantagée sur cette carte / le leader
        // de la partie (« attaquer la Crimée tôt pour la ralentir »)
        const threat = ctx.hexThreat ? (ctx.hexThreat.get(hexId) || 0) : 0;
        // Couvrir ses arrières : à court de puissance, une attaque expose à la
        // contre-attaque (on ne pourra pas défendre le terrain gagné)
        const overextended = p.power <= 4 && !prof.earlyAttack;
        // Un gros magot (≥4) justifie le combat même sans étoile à la clé
        if (!overextended && myStrength >= defStrength + prof.aggroMargin && (wantCombatStar || prof.earlyAttack || loot >= 4) && (prof.earlyAttack || getPhase(p) !== "early"))
          s += (wantCombatStar ? prof.attackReward : Math.floor(prof.attackReward / 2)) + Math.min(4, myStrength - defStrength) + loot + threat;
        else s -= 12;
      } else if (enemyHexes && enemyHexes.has(hexId)) {
        // Hex avec seulement des ouvriers ennemis : déplacement possible mais coûte de la pop
        // Servitude : la Confédération y gagne un ouvrier → elle les chasse activement
        if (p.faction === "confederation" && (p.capturedWorkers || 0) < 2 && p.pop >= 2) s += 6;
        else s -= 4;
        // Raid : un gros tas de ressources sur un hex d'ouvriers vaut le coût en
        // pop pour les profils agressifs — prendre le hex neutralise le magot
        // du thésauriseur au scoring ; ralentir l'économie du leader compte aussi
        const wLoot = ctx && ctx.hexLoot ? (ctx.hexLoot.get(hexId) || 0) : 0;
        const wThreat = ctx && ctx.hexThreat ? (ctx.hexThreat.get(hexId) || 0) : 0;
        if (wLoot >= 3 && prof.aggroMargin <= 2 && p.pop >= 3) s += Math.min(12, wLoot);
        if (wThreat >= 3 && prof.aggroMargin <= 2 && p.pop >= 3) s += Math.floor(wThreat / 2);
      }
    }

    // Move toward uncontrolled resource hexes
    const myHexes = new Set([p.hero, ...p.workers.map(w => w.hexId), ...p.mechs.map(m => m.hexId)]);
    if (!myHexes.has(hexId)) s += 2; // new territory

    // Move toward encounter tokens (hero only — rule: seuls les personnages font des rencontres)
    // Le bâtisseur fait la course aux jetons (gains de pop des rencontres)
    if (purpose === "hero" && ctx && ctx.encounterHexes && ctx.encounterHexes.has(hexId)) s += prof.encounterPull;

    // Rouge River : plan d'usine (gros avantage permanent) + l'hex vaut
    // 3 territoires au score → destination majeure du héros tant qu'il n'a
    // pas visité — forte prise sur l'hex, convergence progressive sinon
    if (purpose === "hero" && !p.visitedRR && !p.factoryCard) {
      if (hexId === 22) s += 14;
      else {
        const rr = hMap[22];
        if (rr) {
          const d = Math.sqrt((hex.rx - rr.rx) ** 2 + (hex.ry - rr.ry) ** 2);
          s += Math.max(0, 4 - Math.round(d / 180));
        }
      }
    }
    // L'Usine reste un territoire triple : y camper garde de la valeur
    if (hexId === 22 && p.visitedRR) s += 3;

    // Aimant à magot : se rapprocher du gros tas vaut des points (raid en 2-3 tours)
    if (hoardHex !== null && hexId !== hoardHex) {
      const hh = hMap[hoardHex];
      if (hh) {
        const d = Math.sqrt((hex.rx - hh.rx) ** 2 + (hex.ry - hh.ry) ** 2);
        s += Math.max(0, 3 - Math.round(d / 200));
      }
    }

    // Avoid lakes/swamps for non-appropriate factions
    if (hex.t === "lac" || hex.t === "marecage") s -= 5;

    if (s > bestScore) { bestScore = s; bestHex = hexId; }
  }
  return bestHex || validMoves[Math.floor(Math.random() * validMoves.length)];
};

// Choose which building to construct based on phase (or profile order)
const pickBuilding = (p, availBuildings, prof) => {
  const phase = getPhase(p);
  // Priority: Moulin early, Gare mid, Arsenal/Memorial late — sauf ordre imposé
  // par le profil (ex. bâtisseur : Mémorial d'abord pour la pop au Bolster)
  const priority = (prof && prof.buildPriority) || (phase === "early" ? ["moulin", "gare", "arsenal", "memorial"]
    : phase === "mid" ? ["gare", "moulin", "memorial", "arsenal"]
    : ["memorial", "arsenal", "gare", "moulin"]);
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

export const botTurn = (player, empire, enemyHexes, rails, ctx) => {
  const f = FACTIONS[player.faction];
  // Hex des unités combattantes du joueur humain : jamais ciblés (le PvP bot↔humain
  // nécessiterait une défense interactive — seul le PvP bot↔bot est auto-résolu)
  const forbidden = (ctx && ctx.forbidden) || new Set();
  const p = { ...player, workers: [...player.workers], mechs: [...player.mechs], resources: { ...player.resources } };
  const logs = [];

  // ── Profil stratégique + bruit décisionnel (niveau de difficulté) ──
  const prof = BOT_PROFILES[p.botProfile] || BOT_PROFILES.equilibre;
  const noise = p.botNoise || 0;

  // ── STRATEGIC COLUMN SELECTION ──
  // Dominion « Relentless » (test Rusviet) : peut rejouer la même colonne
  const canRepeat = p.faction === "dominion" && BALANCE.dominionRelentless;
  const cols = [0, 1, 2, 3].filter(c => canRepeat || c !== p.lastCol);
  let bestCol = cols[0], bestScore = -999;
  for (const col of cols) {
    const s = scoreColumn(p, col, empire, enemyHexes, rails, prof)
      + (noise ? (Math.random() * 2 - 1) * noise : 0);
    if (s > bestScore) { bestScore = s; bestCol = col; }
  }
  const col = bestCol;
  const action = p.topRow[col];

  // ── EXECUTE TOP ACTION ──
  if (action === "Move" && p.coins <= 0) {
    // Scythe rule: Move's alternative is "gain 1$" — prevents the economic
    // deadlock (0 coins + 0 power = no Produce/Bolster/Trade possible)
    p.coins++;
    logs.push(`🤖 ${f.name}: +1$ (Move)`);
  } else if (action === "Move") {
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
    const validHero = getValidMoves(p.hero, p.faction, p.unlockedAbilities || [], p, rails).filter(id => !forbidden.has(id));
    if (validHero.length > 0) {
      const fromHex = p.hero;
      const target = pickMoveTarget(validHero, p, empire, enemyHexes, "hero", ctx, prof);
      p.hero = target;
      const tr = transportUnits(p, fromHex, target, "hero");
      Object.assign(p, { resources: tr.player.resources });
      const tl = tr.carried.resTypes.length > 0 ? ` 📦${tr.carried.resTypes.join(",")}` : "";
      logs.push(`🤖 ${f.name}: ${f.hero} → #${target}${tl}`);
      const heroToll = marshToll(p, target, "hero");
      if (heroToll) logs.push(`🤖${heroToll}`);
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

    // ── 2e unité : mech OU ouvrier — le mech est prioritaire s'il a une
    // vraie cible (attaque, butin, leader, expansion late) ; sinon c'était
    // toujours l'ouvrier qui bougeait et les mechs restaient plantés
    let mechMoved = false;
    if (p.mechs.length > 0) {
      const mi = Math.floor(Math.random() * p.mechs.length);
      const fromHexM = p.mechs[mi].hexId;
      const mv = getValidMoves(fromHexM, p.faction, p.unlockedAbilities || [], p, rails).filter(id => !forbidden.has(id));
      if (mv.length > 0) {
        const mt = pickMoveTarget(mv, p, empire, enemyHexes, "mech", ctx, prof);
        const worthIt = mt !== null && (
          (ctx && ctx.attackable && ctx.attackable.has(mt))
          || (ctx && ctx.hexLoot && (ctx.hexLoot.get(mt) || 0) >= 3)
          || (ctx && ctx.hexThreat && (ctx.hexThreat.get(mt) || 0) >= 3)
          || (enemyHexes && enemyHexes.has(mt))
          || getPhase(p) === "late");
        if (worthIt) {
          p.mechs = [...p.mechs];
          p.mechs[mi] = { ...p.mechs[mi], hexId: mt };
          // Expansion : vers un combat, le mech n'embarque jamais d'ouvriers.
          // En late, deux modes : s'il y a ≥2 ouvriers au départ ET un trajet à
          // étapes, il les embarque et les ÉGRÈNE le long du trajet (1 par hex
          // de passage — expansion maximale de territoire) ; sinon il les
          // laisse tenir le terrain et continue seul.
          const isAttack = ctx && ctx.attackable && ctx.attackable.has(mt);
          const isLate = getPhase(p) === "late";
          const wAtOrigin = p.workers.filter(w => w.hexId === fromHexM).length;
          const waypoints = isAttack ? [] : findPathWaypoints(fromHexM, mt, p.faction, p.unlockedAbilities || [], p, rails)
            .filter(hid => { const h = hMap[hid]; return h && h.t !== "lac" && h.t !== "marecage" && !(enemyHexes && enemyHexes.has(hid)); });
          const dropRun = getPhase(p) !== "early" && !isAttack && wAtOrigin >= 2 && waypoints.length > 0;
          const carryWorkers = !isAttack && (!isLate || dropRun);
          const tr = transportUnits(p, fromHexM, mt, "mech", { carryWorkers });
          Object.assign(p, { workers: tr.player.workers, resources: tr.player.resources });
          if (dropRun && tr.carried.workers >= 2) {
            p.workers = [...p.workers];
            let toDrop = Math.min(waypoints.length, tr.carried.workers - 1);
            for (const dropHex of waypoints) {
              if (toDrop <= 0) break;
              const wi2 = p.workers.findIndex(w => w.hexId === mt);
              if (wi2 < 0) break;
              p.workers[wi2] = { ...p.workers[wi2], hexId: dropHex };
              logs.push(`🤖📦 ${f.name}: dépose 1 ouvrier sur #${dropHex} au passage`);
              toDrop--;
            }
          }
          let tl = "";
          if (tr.carried.workers > 0) tl += ` 👷×${tr.carried.workers}`;
          if (tr.carried.resTypes.length > 0) tl += ` 📦${tr.carried.resTypes.join(",")}`;
          logs.push(`🤖 ${f.name}: Mech → #${mt}${tl}`);
          const mechToll = marshToll(p, mt, "mech", tr.carried.workers);
          if (mechToll) logs.push(`🤖${mechToll}`);
          mechMoved = true;
        }
      }
    }
    if (!mechMoved && p.workers.length > 0) {
      // Corpus : « sortir les ouvriers du village » — déplacer un ouvrier du
      // hex le plus peuplé plutôt qu'un ouvrier au hasard
      const byHexW = {};
      p.workers.forEach((w, i) => { (byHexW[w.hexId] = byHexW[w.hexId] || []).push(i); });
      const crowded = Object.values(byHexW).sort((a, b) => b.length - a.length)[0];
      const wi = crowded.length >= 2 ? crowded[0] : Math.floor(Math.random() * p.workers.length);
      let wv = getValidMoves(p.workers[wi].hexId, p.faction, p.unlockedAbilities || [], p, rails);
      // Workers avoid enemies
      if (enemyHexes) wv = wv.filter(id => !enemyHexes.has(id));
      if (wv.length > 0) {
        const wt = pickMoveTarget(wv, p, empire, enemyHexes, "worker", ctx, prof);
        const fromW = p.workers[wi].hexId;
        p.workers[wi] = { ...p.workers[wi], hexId: wt };
        // L'ouvrier emporte les ressources de son hex s'il est la dernière
        // unité à le quitter (sinon elles seraient perdues au scoring)
        const lastOnHex = p.hero !== fromW
          && !p.workers.some((w, j) => j !== wi && w.hexId === fromW)
          && !p.mechs.some(m => m.hexId === fromW);
        if (lastOnHex) {
          const tr = transportUnits(p, fromW, wt, "worker");
          Object.assign(p, { resources: tr.player.resources });
          if (tr.carried.resTypes.length > 0) logs.push(`🤖 ${f.name}: Ouv. → #${wt} 📦${tr.carried.resTypes.join(",")}`);
          else logs.push(`🤖 ${f.name}: Ouv. → #${wt}`);
        } else {
          logs.push(`🤖 ${f.name}: Ouv. → #${wt}`);
        }
        const wToll = marshToll(p, wt, "worker");
        if (wToll) logs.push(`🤖${wToll}`);
      }
    }
  } else if (action === "Bolster") {
    if (p.coins >= 1) {
      p.coins--;
      const hasArsenal = (p.buildings || []).some(b => b.type === "arsenal");
      const hasMemorial = (p.buildings || []).some(b => b.type === "memorial");
      // Strategic choice: power if low or pushing toward the 16-power star
      const needPower = p.power < 8 || (p.power >= 12 && !p.starPower);
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
      // Pick best 2 hexes : d'abord ceux qui produisent une ressource MANQUANTE
      // pour un bottom, puis villages (si sous le cap), puis autres ressources
      const needP = neededResources(p);
      const prodCap = getPhase(p) === "early" ? prof.maxWorkersEarly : 8;
      const hexScore = (hidStr) => {
        const h = hMap[parseInt(hidStr)];
        if (!h) return 0;
        const res = TERRAINS[h.t]?.res;
        let s = 0;
        if (res && needP[res]) s += 10;
        else if (res === "ouvriers" && p.workers.length < prodCap) s += 6;
        else if (res && res !== "ouvriers") s += 3;
        return s + byHex[hidStr].length;
      };
      const hexIds = Object.keys(byHex)
        .sort((a, b) => hexScore(b) - hexScore(a))
        .slice(0, 2);
      // Régime d'ouvriers : 5 en early (règle du corpus), puis 8 pour l'étoile
      // — le thésauriseur sort tous ses ouvriers tout de suite
      const workerCap = getPhase(p) === "early" ? prof.maxWorkersEarly : 8;
      hexIds.forEach(hidStr => {
        const hid = parseInt(hidStr); const hex = hMap[hid]; const t = TERRAINS[hex?.t]; let wc = byHex[hidStr].length;
        if (!t) return; // hex de base (ouvrier retraité) ou hex invalide : pas de production
        const hasMoulin = (p.buildings || []).some(b => b.type === "moulin" && b.hexId === hid);
        if (hasMoulin) wc++;
        if (hex.t === "village" && p.workers.length < workerCap) {
          const toAdd = Math.min(wc, workerCap - p.workers.length);
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
    if (p.coins >= 1 && ((prof.chasePopStar && p.pop >= 13 && !p.starPop) || (p.pop < prof.popTarget && (p.stars >= 1 || p.workers.length >= 5)))) {
      // Push toward the 18-pop star once in the top popularity tier
      p.coins--; p.pop = Math.min(p.pop + 1, 18);
      logs.push(`🤖 ${f.name}: +1 Pop`);
    } else if (p.coins >= 1) {
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
  // Bonus du plan d'usine (Rouge River) : réduction de coût appliquée AVANT
  // le test de solvabilité ; pièces/puissance créditées après l'action
  const planB = getPlanBottomBonus(p, bottomAction);
  if (bc && planB.costReduction > 0) bc.qty = Math.max(0, bc.qty - planB.costReduction);
  const altResB = FACTIONS[p.faction]?.deployAltRes;
  const canAffordBottom = bc && (countRes(p, bc.res) >= bc.qty || (bottomAction === "Deploy" && altResB && countRes(p, altResB) >= bc.qty));
  let bottomDone = false;
  if (canAffordBottom) {
    if (bottomAction === "Upgrade" && (p.upgrades || 0) < 6 && ((p.upgrades || 0) < 2 || p.stars >= 4)) {
      const mat = MATS.find(m => m.id === p.matId);
      const validTop = []; const validBottom = [];
      if (mat) {
        (p.cubesOnTop || []).forEach((c, i) => { if (c > 0) validTop.push(i); });
        (mat.bottomSlots || []).forEach((s, i) => { if ((p.cubesOnBottom || [])[i] < s) validBottom.push(i); });
      }
      if (validTop.length > 0 && validBottom.length > 0) {
        const sp = spendRes(p, bc.res, bc.qty); Object.assign(p, { resources: sp.resources });
        const fromC = pickUpgradeSource(p, validTop);
        const toC = pickUpgradeDest(p, validBottom, mat);
        p.cubesOnTop = [...(p.cubesOnTop || [])]; p.cubesOnTop[fromC]--;
        p.cubesOnBottom = [...(p.cubesOnBottom || [])]; p.cubesOnBottom[toC]++;
        p.coins += (mat.bottomCosts[toC].bonus || 0);
        p.upgrades = (p.upgrades || 0) + 1;
        bottomDone = true;
        if (p.upgrades >= 6 && !p.starUpgrades) { p.stars++; p.starUpgrades = true; logs.push(`⭐ ${f.name}: 6 upgrades !`); }
        logs.push(`🤖 ${f.name}: Upgrade ${p.upgrades}/6`);
      }
    } else if (bottomAction === "Deploy" && p.mechs.length < 4) {
      const wh = getWorkerHexes(p);
      if (wh.length > 0) {
        const deployRes = (altResB && countRes(p, bc.res) < bc.qty) ? altResB : bc.res;
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
        const abilityNames = getMechAbilities(p.faction).map(a => a.name);
        p.mechs.push({ id: `${p.faction}_m${p.mechs.length}`, hexId: th });
        p.unlockedAbilities = [...(p.unlockedAbilities || []), abilityIdx];
        bottomDone = true;
        if (p.mechs.length >= 4 && !p.starMechs) { p.stars++; p.starMechs = true; logs.push(`⭐ ${f.name}: 4 mechas !`); }
        logs.push(`🤖 ${f.name}: Deploy #${th} → 🔓 ${abilityNames[abilityIdx]}`);
      }
    } else if (bottomAction === "Build" && (p.buildings || []).length < 4) {
      const wh = getWorkerHexes(p).filter(h => !(p.buildings || []).some(b => b.hexId === h));
      const avail = BUILDING_TYPES.filter(bt => !(p.buildings || []).some(b => b.type === bt.type));
      if (wh.length > 0 && avail.length > 0) {
        const sp = spendRes(p, bc.res, bc.qty); Object.assign(p, { resources: sp.resources });
        const building = pickBuilding(p, avail, prof);
        p.buildings = [...(p.buildings || []), { type: building.type, hexId: wh[0] }];
        bottomDone = true;
        if (p.buildings.length >= 4 && !p.starBuildings) { p.stars++; p.starBuildings = true; logs.push(`⭐ ${f.name}: 4 bâtiments !`); }
        logs.push(`🤖 ${f.name}: Build ${building.name} #${wh[0]}`);
        // Gare: place rails
        if (building.type === "gare") {
          let railFrom = wh[0];
          for (let ri = 0; ri < 3; ri++) {
            const adjH = (ADJ[railFrom] || []).filter(id => {
              const h = hMap[id]; if (!h) return false;
              if (h.t === "lac" || h.t === "marecage") return false; // R6: pas de rail sur l'eau
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
      bottomDone = true;
      // Priorité d'enlist du profil (équilibré : puissance > pièces > pop > cartes ;
      // bâtisseur : pop d'abord ; blitz : puissance puis cartes)
      const priority = prof.enlistPriority || [0, 1, 2, 3];
      p.enlistMap = [...(p.enlistMap || [null, null, null, null])];
      // Colonne libre = bonus immédiat de section ; recrue libre = bonus permanent.
      // Les deux sont choisis INDÉPENDAMMENT (décorrélés, règle Scythe).
      const freeCols = priority.filter(ci => p.enlistMap[ci] == null);
      const freeRecruits = priority.filter(ri => !p.enlistMap.includes(ri));
      if (freeCols.length > 0 && freeRecruits.length > 0) {
        const col = freeCols[0];            // section prioritaire (bonus immédiat)
        const recruit = freeRecruits[0];    // recrue prioritaire (bonus permanent)
        p.enlistMap[col] = recruit;
        // Bonus immédiat de la section (décorrélé de la recrue) : voir ENLIST_BONUSES
        const imm = [
          pp => { pp.coins += 2; },                          // Upgrade → 💰
          pp => { pp.pop = Math.min(pp.pop + 2, 18); },      // Deploy → ❤
          pp => { pp.combatCards += 2; },                    // Build → 🃏
          pp => { pp.power = Math.min(pp.power + 2, 16); },  // Enlist → ⚡
        ][col];
        if (imm) imm(p);
        logs.push(`🤖 ${f.name}: Enlist ${BOTTOM[col]} → recrue ${ENLIST_ONGOING[recruit].icon}`);
      }
      if (p.recruits >= 4 && !p.starRecruits) { p.stars++; p.starRecruits = true; logs.push(`⭐ ${f.name}: 4 recrues !`); }
    }
  }
  // Gains du plan d'usine une fois l'action bottom réellement effectuée
  if (bottomDone && (planB.bonusCoins > 0 || planB.bonusPower > 0)) {
    p.coins += planB.bonusCoins;
    p.power = Math.min(p.power + planB.bonusPower, 16);
    logs.push(`🤖⚙ ${f.name}: ${p.factoryCard.name} → ${planB.bonusCoins > 0 ? `+${planB.bonusCoins}$ ` : ""}${planB.bonusPower > 0 ? `+${planB.bonusPower}⚡` : ""}`.trim());
  }

  // ── AUTOMATIC STARS ──
  if (p.pop >= 18 && !p.starPop) { p.stars++; p.starPop = true; logs.push(`⭐ ${f.name}: Popularité max !`); }

  // ── OBJECTIVE CHECK ──
  if (p.objective && !p.objectiveRevealed && p.objective.check(p)) { p.objectiveRevealed = true; p.stars++; logs.push(`⭐ ${f.name}: objectif !`); }
  const fObj = FACTIONS[p.faction]?.fObj;
  if (fObj && !p.fObjRevealed && fObj.check(p)) { p.fObjRevealed = true; p.stars++; logs.push(`🏛⭐ ${f.name}: obj. faction !`); }

  // ── DOMINION COMMERCE IMPÉRIAL ──
  if (p.faction === "dominion") {
    // Import Impérial : 2$ → 1 ressource manquante (1×/tour) — l'empire
    // commerçant achète ce que sa péninsule (pétrole+métal) ne produit pas.
    // Gardé pour finir un bottom PRESQUE payable (≤2 manquants), avec un
    // matelas de pièces (les pièces scorent : ne pas se ruiner en imports)
    if (BALANCE.imperialImport && p.coins >= 5) {
      const needI = neededResources(p);
      const buy = Object.keys(needI).find(r => needI[r] <= 2);
      if (buy) {
        p.coins -= 2;
        const wHexI = p.workers.length > 0 ? String(p.workers[0].hexId) : String(p.hero);
        p.resources = { ...p.resources, [wHexI]: { ...(p.resources[wHexI] || {}) } };
        p.resources[wHexI][buy] = (p.resources[wHexI][buy] || 0) + 1;
        logs.push(`🤖🏛 ${f.name}: Import -2$→+1${buy}`);
      }
    }
    const resTypes = ["metal", "bois", "nourriture", "petrole"];
    // Ne convertir QUE le surplus : jamais une ressource requise par un bottom
    // non maxé (sinon le Dominion cannibalise sa propre course aux étoiles)
    const reserved = new Set();
    const costsD = getBottomCost(p);
    BOTTOM.forEach((ba, ci) => {
      if (isBottomMaxed(p, ba)) return;
      const bc = costsD[ci];
      if (bc && countRes(p, bc.res) <= bc.qty) reserved.add(bc.res);
    });
    const available = resTypes.filter(r => countRes(p, r) >= 1 && !reserved.has(r));
    // Débit du comptoir : 2 conversions/tour (BALANCE.imperialRate) — le
    // Dominion transforme son surplus en pièces, qui scorent directement
    let conversions = BALANCE.imperialRate || 1;
    while (conversions-- > 0 && available.length > 0) {
      const pick = available[available.length - 1];
      if (countRes(p, pick) < 1) { available.pop(); conversions++; continue; }
      const sp = spendRes(p, pick, 1); Object.assign(p, { resources: sp.resources });
      // Strategic choice: coins early/mid, cards if combat imminent
      if (p.combatCards < 2 && Math.random() < 0.4) {
        p.combatCards++; logs.push(`🤖🏛 ${f.name}: Commerce -1${pick}→+1CC`);
      } else {
        p.coins += 1; p.imperialCoins = (p.imperialCoins || 0) + 1; logs.push(`🤖🏛 ${f.name}: Commerce -1${pick}→+1$`);
      }
    }
  }

  return { player: p, logs, bottomCol: bottomDone ? col : -1 };
};
