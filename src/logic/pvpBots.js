// PvP auto-résolu entre bots — suit les règles officielles de Scythe (p.22-23) :
// - le combat a lieu quand personnage/mechs partagent un hex avec personnage/mechs adverses
// - chaque camp engage de la puissance (max 7) + 1 carte combat par unité combattante sur le hex
// - l'attaquant remporte les égalités
// - le vaincu retire TOUTES ses unités du hex (héros, mechs, ouvriers) vers sa base,
//   les ressources du hex passent au vainqueur, et il pioche 1 carte combat s'il a
//   révélé au moins 1 point de puissance
// - le vainqueur (attaquant OU défenseur) gagne une étoile de combat (max 2)
// - l'attaquant vainqueur perd 1 popularité par ouvrier adverse forcé à la retraite
// Utilisé par App.jsx (tours de bots) et scripts/simulate.mjs.
import { FACTIONS } from '../data/factions.js';
import { HEXES, HOME_BASES } from '../data/hexes.js';
import { getCombatBonus } from '../data/combat.js';
import { BALANCE } from '../data/balance.js';

const hbHexOf = (factionId) => {
  const hb = HOME_BASES[factionId];
  return HEXES.reduce((best, h) => {
    const d = Math.sqrt((h.rx - hb.rx) ** 2 + (h.ry - hb.ry) ** 2);
    const db = best ? Math.sqrt((best.rx - hb.rx) ** 2 + (best.ry - hb.ry) ** 2) : Infinity;
    return d < db && h.t !== "lac" && h.t !== "marecage" ? h : best;
  }, null);
};

const unitsOnHex = (p, hexId) => (p.hero === hexId ? 1 : 0) + p.mechs.filter(m => m.hexId === hexId).length;

const clonePlayer = (p) => {
  const n = { ...p, workers: [...p.workers], mechs: [...p.mechs], resources: {} };
  Object.entries(p.resources).forEach(([k, v]) => { n.resources[k] = { ...v }; });
  return n;
};

// Retire toutes les unités d'un joueur du hex vers sa base ; retourne le nb d'ouvriers déplacés
const retreatAll = (p, hexId) => {
  const hbh = hbHexOf(p.faction);
  const displacedWorkers = p.workers.filter(w => w.hexId === hexId).length;
  if (p.hero === hexId) p.hero = hbh.id;
  p.mechs = p.mechs.map(m => m.hexId === hexId ? { ...m, hexId: hbh.id } : m);
  p.workers = p.workers.map(w => w.hexId === hexId ? { ...w, hexId: hbh.id } : w);
  return displacedWorkers;
};

// Les ressources du perdant sur le hex passent au vainqueur (règle : le vainqueur
// contrôle le territoire et toutes les ressources qui s'y trouvent).
// Exporté : sert aussi au PILLAGE lors d'un déplacement qui chasse des ouvriers
// (le magot change de mains — c'est la motivation au combat voulue par le design).
export const transferHexResources = (loser, winner, hexId) => {
  const key = String(hexId);
  const res = loser.resources[key];
  if (!res) return;
  if (!winner.resources[key]) winner.resources[key] = {};
  Object.entries(res).forEach(([rt, n]) => {
    winner.resources[key][rt] = (winner.resources[key][rt] || 0) + n;
  });
  delete loser.resources[key];
};

const awardCombatStar = (p, logs, label) => {
  p.combatWins = (p.combatWins || 0) + 1;
  if (p.combatWins <= 2 && !p[`starCombat${p.combatWins}`]) {
    p.stars++;
    p[`starCombat${p.combatWins}`] = true;
    logs.push(`⭐⚔ ${label}: étoile de combat ${p.combatWins}/2 !`);
  }
};

/**
 * Résout un combat PvP automatique entre deux bots.
 * @returns {{players: Array, logs: string[]}} — nouvelle liste de joueurs + journal
 */
export const resolveBotPvp = (playersArr, attIdx, defIdx, hexId) => {
  const players = [...playersArr];
  const logs = [];
  resolveBotPvp.lastPsy = null;
  let att = clonePlayer(players[attIdx]);
  let def = clonePlayer(players[defIdx]);
  const af = FACTIONS[att.faction], df = FACTIONS[def.faction];

  // ── White Flag (Acadiane défenseur, slot 2) : 50% → retraite volontaire + 2 pop ──
  if (BALANCE.whiteFlagEnabled && def.faction === "acadiane" && (def.unlockedAbilities || []).includes(2) && Math.random() < 0.5) {
    const displaced = retreatAll(def, hexId);
    def.pop = Math.min((def.pop || 0) + BALANCE.whiteFlagPop, 18);
    transferHexResources(def, att, hexId);
    if (displaced > 0) att.pop = Math.max(0, att.pop - displaced);
    awardCombatStar(att, logs, af.name);
    logs.push(`🏳🤖 ${df.name} active White Flag face à ${af.name} (+2 Pop, retraite)`);
    players[attIdx] = att; players[defIdx] = def;
    return { players, logs };
  }

  // ── Engagements : attaquant agressif, défenseur prudent — ET psychologie ──
  const attCB = getCombatBonus(att, hexId, true, def.combatCards);
  const defCB = getCombatBonus(def, hexId, false, att.combatCards);
  const attCCmax = Math.min(att.combatCards, unitsOnHex(att, hexId) + attCB.cardBonus);
  const defCCmax = Math.min(def.combatCards, unitsOnHex(def, hexId) + defCB.cardBonus);
  // Force VISIBLE de chaque camp (puissance en stock + cartes engagées possibles)
  const attVisible = Math.min(att.power, 7) + attCB.powerBonus + attCCmax * 2;
  const defVisible = Math.min(def.power, 7) + defCB.powerBonus + defCCmax * 2;

  // Décisions SIMULTANÉES et secrètes (comme les molettes du vrai jeu) :
  // FOLD : dominé de ≥5 en visible, le défenseur préfère parfois ne RIEN miser
  // (le combat est perdu d'avance — il garde puissance et cartes pour la
  // contre-attaque). C'est ce qui rend la feinte possible… et risquée.
  const fold = defVisible + 5 <= attVisible && Math.random() < 0.5;
  // FEINTE : écrasant en visible, l'attaquant mise parfois le minimum en
  // pariant sur le fold adverse — s'il ne plie pas, la feinte échoue !
  const feint = attVisible >= defVisible + 6 && Math.random() < 0.35;

  const attSpend = feint ? Math.min(1, att.power) : Math.min(Math.floor(att.power * 0.7) + 1, 7, att.power);
  const defSpend = fold ? 0 : Math.min(Math.floor(def.power * 0.6), 7, def.power);
  const attCC = feint ? 0 : attCCmax;
  const defCC = fold ? 0 : defCCmax;
  // Dans ce proto une carte combat vaut +2 (même valeur que côté joueur)
  const attTotal = attSpend + attCB.powerBonus + attCC * 2;
  const defTotal = defSpend + defCB.powerBonus + defCC * 2;
  att.power -= attSpend; att.combatCards -= attCC;
  def.power -= defSpend; def.combatCards -= defCC;
  const attackerWins = attTotal >= defTotal; // l'attaquant remporte les égalités

  if (feint) logs.push(`🃏 ${af.name} FEINTE (${attVisible} en vitrine, ${attTotal} misé) — ${attackerWins ? "ça passe !" : `raté, ${df.name} n'a pas plié !`}`);
  if (fold) logs.push(`🫱 ${df.name} ne mise rien (dominé ${defVisible} vs ${attVisible} — munitions gardées pour la contre-attaque)`);
  logs.push(`⚔🤖 ${af.name} attaque ${df.name} sur #${hexId} : ${attTotal} vs ${defTotal}`);
  // Instrumentation (simulateur)
  resolveBotPvp.lastPsy = { feint, fold, feintWon: feint && attackerWins };

  const winner = attackerWins ? att : def;
  const loser = attackerWins ? def : att;
  const winnerF = attackerWins ? af : df;
  const loserF = attackerWins ? df : af;

  const displaced = retreatAll(loser, hexId);
  transferHexResources(loser, winner, hexId);
  // L'attaquant vainqueur perd 1 pop par ouvrier adverse chassé (pas le défenseur vainqueur)
  if (attackerWins && displaced > 0) {
    winner.pop = Math.max(0, winner.pop - displaced);
    logs.push(`🏃 ${displaced} ouvrier(s) ${loserF.name} renvoyé(s) (-${displaced} Pop ${winnerF.name})`);
  }
  // Le vaincu pioche 1 carte combat s'il a révélé au moins 1 point de puissance
  if ((attackerWins ? defTotal : attTotal) >= 1) loser.combatCards++;
  awardCombatStar(winner, logs, winnerF.name);
  logs.push(`${attackerWins ? "✅" : "🛡"} ${winnerF.name} l'emporte, ${loserF.name} bat en retraite`);

  // ── Capacités de faction post-combat ──
  // Flibuste (Bayou, slot 2) : le vainqueur Bayou pille 2 pièces
  if (winner.faction === "bayou" && (winner.unlockedAbilities || []).includes(2)) {
    const loot = Math.min(loser.coins || 0, 2);
    if (loot > 0) { winner.coins += loot; loser.coins -= loot; logs.push(`🏴‍☠️ Flibuste ! ${winnerF.name} pille ${loot}💰`); }
  }
  // Chimère (Bayou, 1×/partie) : capture un mecha vaincu
  if (winner.faction === "bayou" && !winner.chimereUsed) {
    const loserHadMech = playersArr[attackerWins ? defIdx : attIdx].mechs.some(m => m.hexId === hexId);
    if (loserHadMech) {
      winner.mechs = [...winner.mechs, { id: `${winner.faction}_chimere`, hexId }];
      winner.chimereUsed = true;
      winner.capturedMech = (winner.capturedMech || 0) + 1;
      logs.push(`🧟 Chimère ! ${winnerF.name} capture un mecha ${loserF.name}`);
    }
  }
  // Servitude (Confédération) : capture 1 ouvrier ennemi (max 2, coûte 2 pop)
  if (winner.faction === "confederation" && displaced > 0 && winner.pop >= 2 && (winner.capturedWorkers || 0) < 2) {
    winner.pop = Math.max(0, winner.pop - 2);
    winner.workers = [...winner.workers, { id: `${winner.faction}_serv${winner.workers.length}`, hexId }];
    winner.capturedWorkers = (winner.capturedWorkers || 0) + 1;
    logs.push(`⛓ Servitude ! ${winnerF.name} capture un ouvrier ${loserF.name} (-2 Pop)`);
  }

  players[attIdx] = att; players[defIdx] = def;
  return { players, logs };
};

/**
 * Servitude (Confédération) après un déplacement d'ouvriers ennemis (sans combat) :
 * capture 1 des ouvriers chassés (-2 pop, max 2 par partie). Rend l'ability et
 * l'objectif de faction « Le Joug » réellement atteignables.
 * @param {object} p — joueur Confédération (muté : retourne une copie modifiée)
 * @returns {{player, captured: boolean}}
 */
export const servitudeOnDisplace = (p, hexId) => {
  if (!BALANCE.servitudeOnDisplace) return { player: p, captured: false };
  if (p.faction !== "confederation" || p.pop < 2 || (p.capturedWorkers || 0) >= 2) return { player: p, captured: false };
  const n = { ...p, workers: [...p.workers] };
  n.pop = Math.max(0, n.pop - 2);
  n.workers.push({ id: `${n.faction}_serv${n.workers.length}`, hexId });
  n.capturedWorkers = (n.capturedWorkers || 0) + 1;
  return { player: n, captured: true };
};

/**
 * Après le tour d'un bot : résout les combats PvP sur tous les hex où ses unités
 * combattantes partagent un hex avec celles d'un autre bot (jamais le joueur humain).
 * @returns {{players: Array, logs: string[]}}
 */
export const applyBotPvpAfterMove = (playersArr, cpIdx, isTargetable) => {
  let players = playersArr;
  const logs = [];
  const attacker = players[cpIdx];
  const myCombatHexes = [attacker.hero, ...attacker.mechs.map(m => m.hexId)];
  for (let oi = 0; oi < players.length; oi++) {
    if (oi === cpIdx) continue;
    if (isTargetable && !isTargetable(oi)) continue;
    for (const hexId of new Set(myCombatHexes)) {
      const def = players[oi];
      if (unitsOnHex(def, hexId) > 0) {
        const r = resolveBotPvp(players, cpIdx, oi, hexId);
        players = r.players;
        r.logs.forEach(l => logs.push(l));
      }
    }
  }
  return { players, logs };
};
