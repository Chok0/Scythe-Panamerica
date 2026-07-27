import { FACTIONS } from '../data/factions.js';
import { TERRAINS } from '../data/terrains.js';
import { hMap, ADJ, HEXES, HOME_BASES, homeBaseHex } from '../data/hexes.js';
import { MATS, BOTTOM, BUILDING_TYPES, ENLIST_ONGOING, ENLIST_IMMEDIATE, getBottomCost, topUpgradeCount, maxBottomCubes, frBot } from '../data/mats.js';
import { countRes, spendRes, getWorkerHexes, resFR, resListFR } from './resources.js';
import { canPayProduce, payProduce } from './production.js';
import { getValidMoves, findPathWaypoints, marshToll } from './movement.js';
import { transportUnits } from './transport.js';
import { BOT_PROFILES } from './botProfiles.js';
import { BALANCE } from '../data/balance.js';
import { getMechAbilities } from '../data/mechAbilities.js';
import { FACTORY_COL, factoryCostLabel, factoryEffectLabel } from '../data/plans.js';
import { canPayFactoryCost, payFactoryCost, factoryEffectPossible, factoryResourceHex } from './factory.js';

// ══════════════════════════════════════════════════════
// Strategic Bot AI — based on Scythe competitive strategy
// Priority: Enlist > Deploy Speed > 5 Workers > Produce+Bottom > Expand territory
// ══════════════════════════════════════════════════════

// Evaluate game phase: early (0-2 stars), mid (3-4), late (5+)
const getPhase = (p) => p.stars >= 5 ? "late" : p.stars >= 3 ? "mid" : "early";

// Estimation du score final (approximation de la table de scoring) : étoiles,
// territoires (unités + bâtiments, Usine = 3), paires de ressources, pièces —
// multipliés par le palier de popularité. Sert au « end-game trigger
// management » du corpus : finir si en tête, engranger sinon.
export const estimateScore = (p) => {
  const tier = p.pop >= 13 ? 2 : p.pop >= 7 ? 1 : 0;
  const sm = [3, 4, 5][tier], tm = [2, 3, 4][tier], rm = [1, 2, 3][tier];
  const hexes = new Set([p.hero, ...p.workers.map(w => w.hexId), ...p.mechs.map(m => m.hexId),
    ...(p.buildings || []).map(b => b.hexId)].filter(h => hMap[h] && !hMap[h].base));
  let res = 0;
  Object.values(p.resources || {}).forEach(r => Object.values(r).forEach(n => { res += n; }));
  return (p.stars || 0) * sm + (hexes.size + (hexes.has(22) ? 2 : 0) + (p.flagTokens || []).length) * tm
    + Math.floor(res / 2) * rm + (p.coins || 0) + (p.flagTokens || []).length * 2;
};

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

// ── Colonne 4 : carte d'usine (HAUT 1 coût → 1 gain, BAS move 2 hex) ──
const scoreFactoryColumn = (p, prof, ctx) => {
  const card = p.factoryCard;
  if (!card) return -999;
  let score = 0;
  if (canPayFactoryCost(p, card)) {
    score += 14;
    // Gains « physiques » (mech/bâtiment/recrue/amélioration) = progrès
    // d'étoile GRATUIT → priorité forte tant que la piste n'est pas maxée
    const flat = card.gain.flatMap(g => g.type === "choice" ? g.options : [g]);
    if (flat.some(g => ["mech", "building", "enlist", "upgrade"].includes(g.type) && factoryEffectPossible(p, g))) score += 10;
    if (flat.some(g => g.type === "produce2" && factoryEffectPossible(p, g))) score += 6;
    if (flat.some(g => g.type === "resources" && factoryEffectPossible(p, g))) score += 4;
  } else {
    score += 3; // bas seul : repositionnement 2 hex, utile mais pas prioritaire
  }
  if (getPhase(p) === "late" || (ctx && ctx.endgame)) score += 4; // 2 hex = territoires
  return score;
};

// Score a column choice based on strategic value
const scoreColumn = (p, col, empire, enemyHexes, rails, prof, ctx) => {
  if (col === FACTORY_COL) return scoreFactoryColumn(p, prof, ctx);
  const action = p.topRow[col];
  const f = FACTIONS[p.faction];
  const phase = getPhase(p);
  // Fin imminente : un ADVERSAIRE est à 5+ étoiles — le scoring final approche
  // même si nous ne sommes qu'à 2 étoiles (corpus : « spread out when the end
  // is imminent »). Sans ce flag, le bot ne pivotait que sur SES étoiles.
  const endNear = phase === "late" || !!(ctx && ctx.endgame);
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
    const oneAway = bottomAction === "Upgrade" ? (p.upgrades || 0) === 5
      : bottomAction === "Deploy" ? p.mechs.length === 3
      : bottomAction === "Build" ? (p.buildings || []).length === 3
      : (p.recruits || 0) === 3;
    // « End-game trigger management » (corpus avancé) : cette action donnerait
    // la 6e ÉTOILE → finir seulement si on est en tête au score estimé ;
    // sinon retarder le déclenchement et engranger territoires/pop d'abord
    // (« delaying your final star to prevent an opponent victory »).
    if (oneAway && (p.stars || 0) === 5 && ctx && ctx.bestOppScore != null) {
      if (estimateScore(p) >= ctx.bestOppScore) score += 30;
      else score -= 18;
    } else if (prof.starRush && oneAway) {
      // Blitz : priorité absolue aux bottoms à une action de leur étoile
      score += prof.starRush;
    }
  } else if (bottomMaxed) {
    // Colonne au bottom épuisé : le top seul doit vraiment valoir le coup
    score -= 8;
  }

  // Top action value
  if (action === "Produce") {
    if (canPayProduce(p)) {
      // Seuls les hex PRODUCTIFS comptent : un ouvrier renvoyé à la base
      // (t:"base", hors TERRAINS) ne produit rien — sans ce filtre le bot
      // enchaînait des Produce à vide après une invasion subie (mesuré en
      // partie réelle : tous ses ouvriers en base, Produce quand même)
      const wHexes = new Set(p.workers.map(w => w.hexId).filter(hid => TERRAINS[hMap[hid]?.t]?.res));
      if (wHexes.size === 0) {
        score -= 12; // rien à produire : Move (évacuation) doit gagner
      } else {
      score += 10 + prof.produceBoost;
      // High value early game for resource generation
      if (phase === "early") score += 8;
      // More workers = more production value
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
    }
  } else if (action === "Trade") {
    if (p.coins >= 1) {
      score += 6;
      // Trade is good when we need resources for a bottom action
      if (canBottom && !bottomMaxed) score += 4;
      // Manque STRUCTUREL : un bottom réclame une ressource qu'AUCUN hex
      // ouvrier ne produit — le commerce est alors la seule voie (Acadiane :
      // ni métal ni nourriture chez elle → Trade pour Deploy/Enlist, sinon
      // la Gare). Volontairement limité à ce cas : un boost générique fait
      // sur-échanger tous les bots (mesuré : -14 pts de winrate Confédération)
      {
        const need = neededResources(p);
        const wRes = new Set(p.workers.map(w => TERRAINS[hMap[w.hexId]?.t]?.res).filter(Boolean));
        const structural = Object.entries(need).filter(([r]) => !wRes.has(r));
        if (structural.length > 0) {
          const minGap = Math.min(...structural.map(([, m]) => m));
          score += minGap <= 2 ? 8 : 5;
        }
      }
      // Also good for getting pop in late game
      if (endNear) score += 3;
      // Fin imminente sous un palier de pop : chaque point de pop peut changer
      // les multiplicateurs du score final (×2/×3 territoires et paires)
      if (ctx && ctx.endgame && (p.pop === 6 || p.pop === 12)) score += 6;
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
    if (endNear) score += 8;
    // Early game: spread workers
    if (phase === "early" && p.workers.length >= 3) score += 3;
    // Move toward encounters — la PREMIÈRE rencontre pèse le plus (corpus :
    // gains majeurs quand on n'a encore rien) ; `encDone` n'était jamais posé
    if ((p.encounters || 0) === 0) score += 3;
  }

  return score;
};

// Choose best hex to move toward (strategic targeting)
// ctx: { attackable:Set (hex des unités combattantes d'autres BOTS), forbidden:Set
// (hex des unités combattantes du joueur humain — jamais ciblées), encounterHexes:Set }
const pickMoveTarget = (validMoves, p, empire, enemyHexes, purpose, ctx, prof) => {
  if (validMoves.length === 0) return null;

  // Estimation de notre force pour décider d'attaquer : ce qu'on ENGAGERA
  // vraiment, pas notre stock. L'engagement d'attaque est floor(power×0.7)+1
  // (plafond 7) + 1-2 cartes — même formule que la résolution (App.jsx /
  // pvpBots). L'ancienne estimation min(power,7) comptait tout le stock :
  // décision d'attaque « à parité » → engagement inférieur → défaite offerte
  // (corpus : « attack when you can put together enough power to GUARANTEE a
  // win » ; mesuré en partie réelle : Nations a perdu 8 v 10 puis 8 v 12,
  // offrant les 2 étoiles de combat du défenseur humain)
  const myStrength = Math.min(Math.floor(p.power * 0.7) + 1, 7, p.power) + Math.min(p.combatCards || 0, 2) * 2;
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
        // Riposte / défense du territoire : un envahisseur campé près de NOTRE
        // base est attaquable MÊME en early game — sans quoi l'envahi ne
        // réagit jamais (mesuré en partie réelle : invasion early impunie)
        const homeH = homeBaseHex(p.faction);
        const nearHome = homeH ? Math.sqrt((hex.rx - homeH.rx) ** 2 + (hex.ry - homeH.ry) ** 2) < 320 : false;
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
        // Arbre de décision du corpus : « Can I afford popularity loss? » —
        // la victoire chasse les ouvriers du hex (-1 pop chacun) ; sous le
        // palier visé par le profil, l'attaque perd de sa valeur
        const popLoss = ctx && ctx.hexWorkers ? (ctx.hexWorkers.get(hexId) || 0) : 0;
        const popAfford = p.pop - popLoss >= Math.min(7, prof.popTarget) ? 0 : 8;
        // « Factory control often determines game outcome » : l'Usine vaut
        // 3 territoires au score — prime de combat pour la prendre/reprendre
        const factoryPrize = hexId === 22 ? 6 : 0;
        // Un gros magot (≥4) justifie le combat même sans étoile à la clé
        if (!overextended && myStrength >= defStrength + prof.aggroMargin && (wantCombatStar || prof.earlyAttack || loot >= 4 || factoryPrize) && (prof.earlyAttack || getPhase(p) !== "early" || nearHome))
          s += (wantCombatStar ? prof.attackReward : Math.floor(prof.attackReward / 2)) + Math.min(4, myStrength - defStrength) + loot + threat + (nearHome ? 6 : 0) + factoryPrize - popLoss - popAfford;
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
    // L'Usine reste un territoire triple : y camper garde de la valeur —
    // davantage encore quand la fin approche (3 territoires au scoring)
    if (hexId === 22 && p.visitedRR) s += 3;
    if (hexId === 22 && ctx && ctx.endgame && (purpose === "hero" || purpose === "mech")) s += 5;

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

// Gare : pose 3 segments de rail chaînés depuis l'hex de la Gare — partagé
// entre le Build classique et le bâtiment gratuit d'une carte d'usine.
// Empile dans p._pendingRails (appliqué au réseau par l'appelant App/sim).
const placeBotRails = (p, gareHex, rails, logs, fName) => {
  p._pendingRails = p._pendingRails || [];
  const taken = (a, b) => [...rails, ...p._pendingRails]
    .some(([x, y]) => (x === a && y === b) || (x === b && y === a));
  const candidatesFrom = (from) => (ADJ[from] || []).filter(id => {
    const h = hMap[id]; if (!h) return false;
    if (h.base) return false;                       // pas de rail vers une base
    if (h.t === "lac" || h.t === "marecage") return false; // R6: pas de rail sur l'eau
    return !taken(from, id);
  });
  const endpoints = [gareHex];
  for (let ri = 0; ri < 3; ri++) {
    // Chaînage : repart du dernier point qui a encore une arête libre
    let from = null, opts = [];
    for (let ei = endpoints.length - 1; ei >= 0; ei--) {
      opts = candidatesFrom(endpoints[ei]);
      if (opts.length > 0) { from = endpoints[ei]; break; }
    }
    if (from === null) break;
    const to = opts[Math.floor(Math.random() * opts.length)];
    p._pendingRails.push([from, to]);
    logs.push(`🤖🛤 ${fName}: Rail #${from}↔#${to}`);
    if (!endpoints.includes(to)) endpoints.push(to);
  }
};

// ── Résolution AUTOMATIQUE des gains du HAUT d'une carte d'usine (bots) ──
// Miroir des pickers du joueur : mêmes règles, choix par heuristique.
const applyFactoryGainsBot = (p, gains, rails, logs, f, prof) => {
  for (let eff of gains) {
    if (eff.type === "choice") {
      // Préférer le progrès d'étoile le moins avancé encore possible
      const opts = eff.options.filter(o => factoryEffectPossible(p, o));
      if (opts.length === 0) { logs.push(`🤖⚙ ${f.name}: choix impossible — passé`); continue; }
      const prio = { mech: 4 - p.mechs.length, building: 4 - (p.buildings || []).length,
        enlist: 4 - (p.recruits || 0), upgrade: (p.upgrades || 0) < 2 ? 3 : 6 - (p.upgrades || 0) };
      eff = opts.sort((a, b) => (prio[b.type] ?? 0) - (prio[a.type] ?? 0))[0];
    }
    if (!factoryEffectPossible(p, eff)) { logs.push(`🤖⚙ ${f.name}: ${factoryEffectLabel(eff)} impossible — passé`); continue; }
    switch (eff.type) {
      case "coins": p.coins += eff.qty; logs.push(`🤖⚙ ${f.name}: +${eff.qty}$ (usine)`); break;
      case "power":
        p.power = Math.min(p.power + eff.qty, 16); logs.push(`🤖⚙ ${f.name}: +${eff.qty}⚡ (usine)`);
        if (p.power >= 16 && !p.starPower) { p.stars++; p.starPower = true; logs.push(`⭐ ${f.name}: Puissance max !`); }
        break;
      case "pop":
        p.pop = Math.min(p.pop + eff.qty, 18); logs.push(`🤖⚙ ${f.name}: +${eff.qty}♥ (usine)`);
        if (p.pop >= 18 && !p.starPop) { p.stars++; p.starPop = true; logs.push(`⭐ ${f.name}: Popularité max !`); }
        break;
      case "cards": p.combatCards = (p.combatCards || 0) + eff.qty; logs.push(`🤖⚙ ${f.name}: +${eff.qty}🃏 (usine)`); break;
      case "upgrade": {
        const mat = MATS.find(m => m.id === p.matId);
        const validTop = []; const validBottom = [];
        (p.cubesOnTop || []).forEach((c, i) => { if (c > 0) validTop.push(i); });
        (mat?.bottomSlots || []).forEach((s, i) => { if ((p.cubesOnBottom || [])[i] < maxBottomCubes(mat, i)) validBottom.push(i); });
        if (validTop.length === 0 || validBottom.length === 0) break;
        const fromC = pickUpgradeSource(p, validTop);
        const toC = pickUpgradeDest(p, validBottom, mat);
        p.cubesOnTop = [...(p.cubesOnTop || [])]; p.cubesOnTop[fromC]--;
        p.cubesOnBottom = [...(p.cubesOnBottom || [])]; p.cubesOnBottom[toC]++;
        p.upgrades = (p.upgrades || 0) + 1;
        logs.push(`🤖⚙ ${f.name}: Améliorer ${p.upgrades}/6 (usine, gratuit)`);
        if (p.upgrades >= 6 && !p.starUpgrades) { p.stars++; p.starUpgrades = true; logs.push(`⭐ ${f.name}: 6 upgrades !`); }
        break;
      }
      case "enlist": {
        const priority = prof.enlistPriority || [0, 1, 2, 3];
        p.enlistMap = [...(p.enlistMap || [null, null, null, null])];
        const freeCols = priority.filter(ci => p.enlistMap[ci] == null);
        const freeRecruits = priority.filter(ri => !p.enlistMap.includes(ri));
        if (freeCols.length === 0 || freeRecruits.length === 0) break;
        p.enlistMap[freeCols[0]] = freeRecruits[0];
        p.recruits = (p.recruits || 0) + 1;
        const imm = ENLIST_IMMEDIATE[freeCols[0]];
        if (imm) imm.apply(p);
        logs.push(`🤖⚙ ${f.name}: Enrôler ${frBot(BOTTOM[freeCols[0]])} (usine, gratuit) → immédiat ${imm ? imm.icon + imm.label : "?"}`);
        if (p.recruits >= 4 && !p.starRecruits) { p.stars++; p.starRecruits = true; logs.push(`⭐ ${f.name}: 4 recrues !`); }
        break;
      }
      case "building": {
        const wh = getWorkerHexes(p).filter(h => hMap[h] && !hMap[h].base && !(p.buildings || []).some(b => b.hexId === h));
        const avail = BUILDING_TYPES.filter(bt => !(p.buildings || []).some(b => b.type === bt.type));
        if (wh.length === 0 || avail.length === 0) break;
        const building = pickBuilding(p, avail, prof);
        p.buildings = [...(p.buildings || []), { type: building.type, hexId: wh[0] }];
        logs.push(`🤖⚙ ${f.name}: ${building.name} #${wh[0]} (usine, gratuit)`);
        if (p.buildings.length >= 4 && !p.starBuildings) { p.stars++; p.starBuildings = true; logs.push(`⭐ ${f.name}: 4 bâtiments !`); }
        if (building.type === "gare") placeBotRails(p, wh[0], rails, logs, f.name);
        break;
      }
      case "mech": {
        const wh = getWorkerHexes(p).filter(h => hMap[h] && !hMap[h].base);
        if (wh.length === 0 || p.mechs.length >= 4) break;
        const abilityIdx = p.mechs.length;
        const abilityNames = getMechAbilities(p.faction).map(a => a.name);
        p.mechs = [...p.mechs, { id: `${p.faction}_m${p.mechs.length}`, hexId: wh[0] }];
        p.unlockedAbilities = [...(p.unlockedAbilities || []), abilityIdx];
        logs.push(`🤖⚙ ${f.name}: Mecha #${wh[0]} (usine, gratuit) → 🔓 ${abilityNames[abilityIdx]}`);
        if (p.mechs.length >= 4 && !p.starMechs) { p.stars++; p.starMechs = true; logs.push(`⭐ ${f.name}: 4 mechas !`); }
        break;
      }
      case "produce2": {
        const byHex = {}; p.workers.forEach(w => { const k = String(w.hexId); (byHex[k] = byHex[k] || []).push(w); });
        const need = neededResources(p);
        const hexScore = (hid) => {
          const res = TERRAINS[hMap[parseInt(hid)]?.t]?.res;
          return (res && need[res] ? 10 : res === "ouvriers" ? 6 : res ? 3 : 0) + byHex[hid].length;
        };
        const hexIds = Object.keys(byHex)
          .filter(h => TERRAINS[hMap[parseInt(h)]?.t]?.res)
          .sort((a, b) => hexScore(b) - hexScore(a)).slice(0, 2);
        hexIds.forEach(hidStr => {
          const hid = parseInt(hidStr); const hex = hMap[hid]; const t = TERRAINS[hex?.t]; let wc = byHex[hidStr].length;
          if (!t) return;
          if ((p.buildings || []).some(b => b.type === "moulin" && b.hexId === hid)) wc++;
          if (hex.t === "village" && p.workers.length < 8) {
            const toAdd = Math.min(wc, 8 - p.workers.length);
            for (let i = 0; i < toAdd; i++) p.workers.push({ id: `${p.faction}_w${p.workers.length}`, hexId: hid });
            if (toAdd > 0) logs.push(`🤖⚙ ${f.name}: +${toAdd} ouv. #${hid} (usine)`);
            if (p.workers.length >= 8 && !p.starWorkers) { p.stars++; p.starWorkers = true; logs.push(`⭐ ${f.name}: 8 ouvriers !`); }
          } else if (t.res && t.res !== "ouvriers") {
            if (!p.resources[hidStr]) p.resources[hidStr] = {};
            p.resources[hidStr] = { ...p.resources[hidStr] };
            p.resources[hidStr][t.res] = (p.resources[hidStr][t.res] || 0) + wc;
            logs.push(`🤖⚙ ${f.name}: +${wc} ${resFR(t.res)} #${hid} (usine)`);
          }
        });
        break;
      }
      case "resources": {
        const hex = factoryResourceHex(p);
        if (hex == null) break;
        const need = neededResources(p);
        const key = String(hex);
        p.resources = { ...p.resources, [key]: { ...(p.resources[key] || {}) } };
        const picks = [];
        for (let i = 0; i < eff.qty; i++) {
          const pick = Object.keys(need).find(r => need[r] > 0) || "metal";
          if (need[pick]) need[pick]--;
          p.resources[key][pick] = (p.resources[key][pick] || 0) + 1;
          picks.push(resFR(pick));
        }
        logs.push(`🤖⚙ ${f.name}: +${picks.join(", +")} #${hex} (usine)`);
        break;
      }
    }
  }
};

// Choose which top cube to remove for upgrade. Retirer un cube AMÉLIORE
// l'option correspondante — le corpus est formel : « upgrading Produce early
// pays dividends across the entire game, Trade might only matter in specific
// situations ». L'ancien ordre améliorait Commerce d'abord (contresens).
const pickUpgradeSource = (p, validTops) => {
  const actionPriority = { Produce: 0, Move: 1, Bolster: 2, Trade: 3 };
  return validTops.sort((a, b) => (actionPriority[p.topRow[a]] ?? 2) - (actionPriority[p.topRow[b]] ?? 2))[0];
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

  // ── Trajet des unités de COMBAT (héros + mechs) : hexes traversés ET
  // destination, pour déclencher les pièges Frente sur tout le chemin (comme
  // pour le joueur) et pas seulement à l'arrivée. Calculé AVANT de muter la
  // position (les capacités de position lisent les positions courantes).
  const trodden = new Set();
  const recordCombatRoute = (from, to) => {
    if (from == null || to == null || from === to) return;
    findPathWaypoints(from, to, p.faction, p.unlockedAbilities || [], p, rails, enemyHexes).forEach(h => trodden.add(h));
    trodden.add(to);
  };

  // ── Profil stratégique + bruit décisionnel (niveau de difficulté) ──
  const prof = BOT_PROFILES[p.botProfile] || BOT_PROFILES.equilibre;
  const noise = p.botNoise || 0;

  // ── STRATEGIC COLUMN SELECTION ──
  // Dominion « Relentless » (test Rusviet) : peut rejouer la même colonne
  const canRepeat = p.faction === "dominion" && BALANCE.dominionRelentless;
  // La carte d'usine (Rouge River) ajoute une 5e colonne jouable (FACTORY_COL)
  const cols = [0, 1, 2, 3, ...(p.factoryCard ? [FACTORY_COL] : [])].filter(c => canRepeat || c !== p.lastCol);
  let bestCol = cols[0], bestScore = -999;
  for (const col of cols) {
    const s = scoreColumn(p, col, empire, enemyHexes, rails, prof, ctx)
      + (noise ? (Math.random() * 2 - 1) * noise : 0);
    if (s > bestScore) { bestScore = s; bestCol = col; }
  }
  const col = bestCol;
  const action = col === FACTORY_COL ? "Factory" : p.topRow[col];

  // ── EXECUTE TOP ACTION ──
  // Move → « +1$ » SEULEMENT en vrai blocage économique (impossible de payer
  // Produce) ou en tout début de partie. Avant, tout Move à 0$ devenait +1$ :
  // la Confédération a passé une partie ENTIÈRE en boucle +1$/Trade sans
  // jamais déplacer une unité (mesuré : 2 territoires, 0 étoile, 8 pts).
  const cashDeadlock = p.coins <= 0 && !canPayProduce(p);
  if (action === "Move" && p.coins <= 0 && (cashDeadlock || getPhase(p) === "early")) {
    // Scythe rule: Move's alternative is "gain 1$"
    // (+1 si le cube d'amélioration de l'option 💰 a été retiré)
    const coinGain = 1 + topUpgradeCount(p, "Move", "coins");
    p.coins += coinGain;
    logs.push(`🤖 ${f.name}: +${coinGain}$ (Déplacer)`);
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

    // ── Évacuation de la base : après un renvoi massif (invasion subie), la
    // priorité absolue est de ressortir les ouvriers — 2 unités par Move
    // (règle Scythe), donc 2 ouvriers de la pile ; héros et mech attendent.
    // (mesuré en partie réelle : à 1 ouvrier/tour, l'envahi restait KO 6 tours)
    let evacuated = 0;
    const baseIdx = p.workers.map((w, i) => (hMap[w.hexId]?.base ? i : -1)).filter(i => i >= 0);
    if (baseIdx.length >= 2) {
      const baseHexId = p.workers[baseIdx[0]].hexId;
      // Un mech renvoyé sur la base ? Il EMBARQUE toute la pile d'ouvriers en
      // un seul déplacement (transport Scythe) — la base se vide d'un coup et
      // le héros garde le 2e déplacement du tour
      const mi = p.mechs.findIndex(m => m.hexId === baseHexId);
      if (mi >= 0) {
        let mv = getValidMoves(baseHexId, p.faction, p.unlockedAbilities || [], p, rails, "mech", enemyHexes).filter(id => !forbidden.has(id));
        if (enemyHexes) mv = mv.filter(id => !enemyHexes.has(id));
        const mt = mv.length > 0 ? pickMoveTarget(mv, p, empire, enemyHexes, "worker", ctx, prof) : null;
        if (mt != null) {
          recordCombatRoute(baseHexId, mt);
          p.mechs = [...p.mechs];
          p.mechs[mi] = { ...p.mechs[mi], hexId: mt };
          const tr = transportUnits(p, baseHexId, mt, "mech", { carryWorkers: true });
          Object.assign(p, { workers: tr.player.workers, resources: tr.player.resources });
          logs.push(`🤖 ${f.name}: Mech évacue la base → #${mt} 👷×${tr.carried.workers}`);
          const mToll = marshToll(p, mt, "mech", tr.carried.workers);
          if (mToll) logs.push(`🤖${mToll}`);
          evacuated = 1; // 1 unité déplacée — le héros peut encore bouger
        }
      }
      // Pas de mech disponible : 2 ouvriers sortent à pied
      if (evacuated === 0) {
        p.workers = [...p.workers];
        for (const wi of baseIdx.slice(0, 2)) {
          let wv = getValidMoves(p.workers[wi].hexId, p.faction, p.unlockedAbilities || [], p, rails, "worker", enemyHexes);
          if (enemyHexes) wv = wv.filter(id => !enemyHexes.has(id));
          if (wv.length === 0) continue;
          const wt = pickMoveTarget(wv, p, empire, enemyHexes, "worker", ctx, prof);
          if (wt == null) continue;
          p.workers[wi] = { ...p.workers[wi], hexId: wt };
          logs.push(`🤖 ${f.name}: Ouv. (base) → #${wt}`);
          const evToll = marshToll(p, wt, "worker");
          if (evToll) logs.push(`🤖${evToll}`);
          evacuated++;
        }
      }
    }

    // Move hero strategically (sauf si les 2 déplacements ont servi à évacuer)
    const validHero = evacuated >= 2 ? [] : getValidMoves(p.hero, p.faction, p.unlockedAbilities || [], p, rails, "hero", enemyHexes).filter(id => !forbidden.has(id));
    if (validHero.length > 0) {
      const fromHex = p.hero;
      const target = pickMoveTarget(validHero, p, empire, enemyHexes, "hero", ctx, prof);
      recordCombatRoute(fromHex, target);
      p.hero = target;
      const tr = transportUnits(p, fromHex, target, "hero");
      Object.assign(p, { resources: tr.player.resources });
      const tl = tr.carried.resTypes.length > 0 ? ` 📦${resListFR(tr.carried.resTypes)}` : "";
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
    if (evacuated === 0 && p.mechs.length > 0) {
      const mi = Math.floor(Math.random() * p.mechs.length);
      const fromHexM = p.mechs[mi].hexId;
      const mv = getValidMoves(fromHexM, p.faction, p.unlockedAbilities || [], p, rails, "mech", enemyHexes).filter(id => !forbidden.has(id));
      if (mv.length > 0) {
        const mt = pickMoveTarget(mv, p, empire, enemyHexes, "mech", ctx, prof);
        const worthIt = mt !== null && (
          (ctx && ctx.attackable && ctx.attackable.has(mt))
          || (ctx && ctx.hexLoot && (ctx.hexLoot.get(mt) || 0) >= 3)
          || (ctx && ctx.hexThreat && (ctx.hexThreat.get(mt) || 0) >= 3)
          || (enemyHexes && enemyHexes.has(mt))
          || getPhase(p) === "late" || (ctx && ctx.endgame));
        if (worthIt) {
          recordCombatRoute(fromHexM, mt);
          p.mechs = [...p.mechs];
          p.mechs[mi] = { ...p.mechs[mi], hexId: mt };
          // Expansion : vers un combat, le mech n'embarque jamais d'ouvriers.
          // En late, deux modes : s'il y a ≥2 ouvriers au départ ET un trajet à
          // étapes, il les embarque et les ÉGRÈNE le long du trajet (1 par hex
          // de passage — expansion maximale de territoire) ; sinon il les
          // laisse tenir le terrain et continue seul.
          const isAttack = ctx && ctx.attackable && ctx.attackable.has(mt);
          const isLate = getPhase(p) === "late" || !!(ctx && ctx.endgame);
          const wAtOrigin = p.workers.filter(w => w.hexId === fromHexM).length;
          const waypoints = isAttack ? [] : findPathWaypoints(fromHexM, mt, p.faction, p.unlockedAbilities || [], p, rails, enemyHexes)
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
          if (tr.carried.resTypes.length > 0) tl += ` 📦${resListFR(tr.carried.resTypes)}`;
          logs.push(`🤖 ${f.name}: Mech → #${mt}${tl}`);
          const mechToll = marshToll(p, mt, "mech", tr.carried.workers);
          if (mechToll) logs.push(`🤖${mechToll}`);
          mechMoved = true;
        }
      }
    }
    if (evacuated === 0 && !mechMoved && p.workers.length > 0) {
      // Corpus : « sortir les ouvriers du village » — déplacer un ouvrier du
      // hex le plus peuplé plutôt qu'un ouvrier au hasard
      const byHexW = {};
      p.workers.forEach((w, i) => { (byHexW[w.hexId] = byHexW[w.hexId] || []).push(i); });
      const crowded = Object.values(byHexW).sort((a, b) => b.length - a.length)[0];
      const wi = crowded.length >= 2 ? crowded[0] : Math.floor(Math.random() * p.workers.length);
      let wv = getValidMoves(p.workers[wi].hexId, p.faction, p.unlockedAbilities || [], p, rails, "worker", enemyHexes);
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
          if (tr.carried.resTypes.length > 0) logs.push(`🤖 ${f.name}: Ouv. → #${wt} 📦${resListFR(tr.carried.resTypes)}`);
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
        // +1 si le cube d'amélioration de l'option ⚡ a été retiré (2 → 3)
        const bonus = (hasArsenal ? 1 : 0) + topUpgradeCount(p, "Bolster", "power");
        p.power = Math.min(p.power + 2 + bonus, 16);
        logs.push(`🤖 ${f.name}: +${2 + bonus} pui${hasArsenal ? " (Arsenal)" : ""}`);
      } else {
        // +1 si le cube d'amélioration de l'option 🃏 a été retiré (1 → 2)
        const ccGain = 1 + topUpgradeCount(p, "Bolster", "combatCards");
        p.combatCards += ccGain;
        logs.push(`🤖 ${f.name}: +${ccGain} CC`);
      }
      if (hasMemorial) { p.pop = Math.min(p.pop + 1, 18); logs.push(`🤖🪦 ${f.name}: +1 Pop (Mémorial)`); }
      // Star check: power 16
      if (p.power >= 16 && !p.starPower) { p.stars++; p.starPower = true; logs.push(`⭐ ${f.name}: Puissance max !`); }
    } else logs.push(`🤖 ${f.name}: (pas d'$)`);
  } else if (action === "Produce") {
    // Ne payer que si au moins un hex ouvrier peut réellement produire
    // (les ouvriers renvoyés à la base ne produisent rien)
    const canYield = p.workers.some(w => TERRAINS[hMap[w.hexId]?.t]?.res);
    if (!canPayProduce(p)) { logs.push(`🤖 ${f.name}: (coût prod.)`); }
    else if (!canYield) { logs.push(`🤖 ${f.name}: (rien à produire — ouvriers en base)`); }
    else {
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
        // hex non productifs exclus (base des ouvriers renvoyés, lacs…)
        .filter(h => TERRAINS[hMap[parseInt(h)]?.t]?.res)
        .sort((a, b) => hexScore(b) - hexScore(a))
        // 2 hex de base, +1 par cube d'amélioration retiré de la colonne Produce
        .slice(0, 2 + topUpgradeCount(p, "Produce", "nourriture"));
      // Le hex du Moulin est un territoire BONUS (règle Scythe) : il produit
      // en plus de la limite, même sans ouvrier (le Moulin compte pour +1)
      const moulinB = (p.buildings || []).find(b => b.type === "moulin");
      if (moulinB && !hexIds.includes(String(moulinB.hexId))) hexIds.push(String(moulinB.hexId));
      // Régime d'ouvriers : 5 en early (règle du corpus), puis 8 pour l'étoile
      // — le thésauriseur sort tous ses ouvriers tout de suite
      const workerCap = getPhase(p) === "early" ? prof.maxWorkersEarly : 8;
      hexIds.forEach(hidStr => {
        const hid = parseInt(hidStr); const hex = hMap[hid]; const t = TERRAINS[hex?.t]; let wc = (byHex[hidStr] || []).length;
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
      logs.push(`🤖 ${f.name}: Produire`);
    }
  } else if (action === "Trade") {
    if (p.coins >= 1 && ((prof.chasePopStar && p.pop >= 13 && !p.starPop) || (p.pop < prof.popTarget && (p.stars >= 1 || p.workers.length >= 5)))) {
      // Push toward the 18-pop star once in the top popularity tier
      // (+1 si le cube d'amélioration de l'option ♥ a été retiré)
      const popGain = 1 + topUpgradeCount(p, "Trade", "pop");
      p.coins--; p.pop = Math.min(p.pop + popGain, 18);
      logs.push(`🤖 ${f.name}: +${popGain} Pop`);
    } else if (p.coins >= 1) {
      // Strategic resource choice: pick what we need for upcoming bottom action
      const costs = getBottomCost(p);
      const bc = costs[col];
      let targetRes = null;

      // Acheter ce qui COMPLÈTE le bottom le plus proche d'être payable
      // (départage : Enlist > Deploy > Build > Upgrade). Avant, l'ordre fixe
      // 0→3 faisait acheter du pétrole (Upgrade) à l'infini — la Confédération
      // « Bâtisseur » n'a jamais acheté le bois qui débloquait son Build.
      let bestGap = Infinity, bestPrio = 99;
      const tradePrio = { 3: 0, 1: 1, 2: 2, 0: 3 };
      for (let ci = 0; ci < 4; ci++) {
        if (ci === p.lastCol) continue;
        const bCosts = costs[ci];
        const bAction = BOTTOM[ci];
        const bMaxed = bAction === "Upgrade" ? (p.upgrades || 0) >= 6
          : bAction === "Deploy" ? p.mechs.length >= 4
          : bAction === "Build" ? (p.buildings || []).length >= 4
          : (p.recruits || 0) >= 4;
        // L'étoile Amélioration est un piège de tempo (cf. scoreColumn) :
        // n'épargne pas pour Upgrade au-delà de 2, sauf sprint final
        if (bAction === "Upgrade" && !((p.upgrades || 0) < 2 || p.stars >= 4)) continue;
        if (bMaxed || !bCosts) continue;
        const gap = bCosts.qty - countRes(p, bCosts.res);
        if (gap > 0 && (gap < bestGap || (gap === bestGap && tradePrio[ci] < bestPrio))) {
          bestGap = gap; bestPrio = tradePrio[ci]; targetRes = bCosts.res;
        }
      }
      if (!targetRes) {
        const types = ["metal", "bois", "nourriture", "petrole"];
        targetRes = types[Math.floor(Math.random() * types.length)];
      }

      // Protection des ressources (corpus : « defensive networks ») : les
      // achats vont sur un hex GARDÉ par un mech ou le héros quand il y en a
      // un — avant, tout partait sur workers[0], un aimant à raids
      const guardSet = new Set([p.hero, ...p.mechs.map(m => m.hexId)]);
      const guarded = p.workers.find(w => guardSet.has(w.hexId));
      const wHex = guarded ? String(guarded.hexId) : p.workers.length > 0 ? String(p.workers[0].hexId) : String(p.hero);
      if (!p.resources[wHex]) p.resources[wHex] = {};
      // 2 ressources de base, +1 si le cube de l'option 📦 a été retiré
      const resGain = 2 + topUpgradeCount(p, "Trade", "metal");
      p.resources[wHex][targetRes] = (p.resources[wHex][targetRes] || 0) + resGain; p.coins--;
      logs.push(`🤖 ${f.name}: +${resGain} ${resFR(targetRes)}`);
    } else {
      // No coins: take pop instead if possible (shouldn't happen often)
      logs.push(`🤖 ${f.name}: (pas d'$)`);
    }
  } else if (action === "Factory") {
    // ── HAUT de la carte d'usine : payer 1 coût → résoudre les gains ──
    const card = p.factoryCard;
    if (card && canPayFactoryCost(p, card)) {
      payFactoryCost(p, card);
      logs.push(`🤖⚙ ${f.name}: ${card.name} — paie ${factoryCostLabel(card)}`);
      applyFactoryGainsBot(p, card.gain, rails, logs, f, prof);
    } else {
      logs.push(`🤖⚙ ${f.name}: ${card ? card.name : "usine"} (coût impayable — bas seulement)`);
    }
  }
  p.lastCol = col;

  // ── BOTTOM ACTION ──
  // Colonne d'usine : le BAS est un déplacement (1 unité, 2 hex, +1 Vitesse),
  // pas une action de plateau — résolu ici puis retour direct (pas d'enlist
  // ongoing : seules les 4 actions bottom du plateau le déclenchent)
  if (col === FACTORY_COL) {
    const candidates = [{ type: "hero", from: p.hero }, ...p.mechs.map((m, i) => ({ type: "mech", from: m.hexId, idx: i }))];
    let moved = false;
    for (const cand of candidates) {
      let mv = getValidMoves(cand.from, p.faction, p.unlockedAbilities || [], p, rails, cand.type, enemyHexes, 1).filter(id => !forbidden.has(id));
      if (mv.length === 0) continue;
      const target = pickMoveTarget(mv, p, empire, enemyHexes, cand.type, ctx, prof);
      if (target == null || target === cand.from) continue;
      recordCombatRoute(cand.from, target);
      if (cand.type === "hero") {
        p.hero = target;
        const tr = transportUnits(p, cand.from, target, "hero");
        Object.assign(p, { resources: tr.player.resources });
        logs.push(`🤖⚙ ${f.name}: ${f.hero} → #${target} (bas d'usine, 2 hex)`);
      } else {
        p.mechs = [...p.mechs];
        p.mechs[cand.idx] = { ...p.mechs[cand.idx], hexId: target };
        const tr = transportUnits(p, cand.from, target, "mech", { carryWorkers: true });
        Object.assign(p, { workers: tr.player.workers, resources: tr.player.resources });
        logs.push(`🤖⚙ ${f.name}: Mech → #${target} (bas d'usine, 2 hex)`);
      }
      const toll = marshToll(p, target, cand.type);
      if (toll) logs.push(`🤖${toll}`);
      moved = true;
      break;
    }
    if (!moved) logs.push(`🤖⚙ ${f.name}: pas de déplacement d'usine possible`);
  }
  // (col d'usine : BOTTOM[4] est undefined → tout le bloc ci-dessous est inerte)
  const bottomAction = BOTTOM[col];
  const botCosts = getBottomCost(p);
  const bc = botCosts[col];
  const altResB = FACTIONS[p.faction]?.deployAltRes;
  const canAffordBottom = bc && (countRes(p, bc.res) >= bc.qty || (bottomAction === "Deploy" && altResB && countRes(p, altResB) >= bc.qty));
  let bottomDone = false;
  if (canAffordBottom) {
    if (bottomAction === "Upgrade" && (p.upgrades || 0) < 6 && ((p.upgrades || 0) < 2 || p.stars >= 4)) {
      const mat = MATS.find(m => m.id === p.matId);
      const validTop = []; const validBottom = [];
      if (mat) {
        (p.cubesOnTop || []).forEach((c, i) => { if (c > 0) validTop.push(i); });
        // Plafond règle Scythe : jamais plus de (base - 1) cubes → coût min 1
        (mat.bottomSlots || []).forEach((s, i) => { if ((p.cubesOnBottom || [])[i] < maxBottomCubes(mat, i)) validBottom.push(i); });
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
        logs.push(`🤖 ${f.name}: Améliorer ${p.upgrades}/6`);
        if (p.upgrades >= 6 && !p.starUpgrades) { p.stars++; p.starUpgrades = true; logs.push(`⭐ ${f.name}: 6 upgrades !`); }
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
        logs.push(`🤖 ${f.name}: Déployer #${th} → 🔓 ${abilityNames[abilityIdx]}`);
        if (p.mechs.length >= 4 && !p.starMechs) { p.stars++; p.starMechs = true; logs.push(`⭐ ${f.name}: 4 mechas !`); }
      }
    } else if (bottomAction === "Build" && (p.buildings || []).length < 4) {
      const wh = getWorkerHexes(p).filter(h => !(p.buildings || []).some(b => b.hexId === h));
      const avail = BUILDING_TYPES.filter(bt => !(p.buildings || []).some(b => b.type === bt.type));
      if (wh.length > 0 && avail.length > 0) {
        const sp = spendRes(p, bc.res, bc.qty); Object.assign(p, { resources: sp.resources });
        const building = pickBuilding(p, avail, prof);
        p.buildings = [...(p.buildings || []), { type: building.type, hexId: wh[0] }];
        bottomDone = true;
        logs.push(`🤖 ${f.name}: Construire ${building.name} #${wh[0]}`);
        if (p.buildings.length >= 4 && !p.starBuildings) { p.stars++; p.starBuildings = true; logs.push(`⭐ ${f.name}: 4 bâtiments !`); }
        // Gare: place rails — 3 segments SANS doublon (helper partagé avec le
        // bâtiment gratuit des cartes d'usine)
        if (building.type === "gare") placeBotRails(p, wh[0], rails, logs, f.name);
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
        // Bonus immédiat de la section (décorrélé de la recrue) — source unique
        // ENLIST_IMMEDIATE (mats.js) : la table dupliquée ici pouvait diverger,
        // et le bonus appliqué en silence rendait les compteurs invérifiables
        const imm = ENLIST_IMMEDIATE[col];
        if (imm) imm.apply(p);
        logs.push(`🤖 ${f.name}: Enrôler ${frBot(BOTTOM[col])} → immédiat ${imm ? imm.icon + imm.label : "?"}, recrue ${ENLIST_ONGOING[recruit].icon} permanent`);
      }
      if (p.recruits >= 4 && !p.starRecruits) { p.stars++; p.starRecruits = true; logs.push(`⭐ ${f.name}: 4 recrues !`); }
    }
  }
  // Bonus $ imprimé de la colonne (Deploy/Build/Enlist) — comme le joueur.
  // Upgrade a déjà crédité le bonus de sa colonne destination ci-dessus. Sans
  // ça, les bots ne gagnaient JAMAIS de pièces par leurs actions du bas :
  // Confédération observée à 0$ toute la partie (économie étranglée).
  if (bottomDone && col !== 0 && bc && (bc.bonus || 0) > 0) {
    p.coins += bc.bonus;
    logs.push(`🤖💰 ${f.name}: +${bc.bonus}$ (${frBot(bottomAction)})`);
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

  return { player: p, logs, bottomCol: bottomDone ? col : -1, trodden: [...trodden] };
};
