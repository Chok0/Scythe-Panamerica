// ═══════════════════════════════════════════════════════════════════════
// MOTEUR DE PARTIE HEADLESS — siège 0 piloté par API (agent/humain distant),
// les autres sièges en bots. Zéro DOM, zéro React : réutilise les modules de
// règles (movement, production, mats, pvpBots, cards…) et réplique la boucle
// de jeu d'App.jsx / scripts/simulate.mjs.
//
// Conçu pour les parties jouées par des agents (Claude & co) : état structuré
// compact, actions nommées, journal identique à l'export de l'app. Voir
// docs/reference/mode_api.md pour le protocole complet.
//
// Machine à états du siège API (this.pending) :
//   null                  → choisir une action du HAUT (ou colonne d'usine)
//   {kind:"move"}         → move_unit… / end_move
//   {kind:"bottom"}       → bottom_* / skip_bottom
//   {kind:"turn_end"}     → reveal / end_turn
//   {kind:"combat"}       → combat {power, cards} (attaque OU défense)
//   {kind:"encounter"}    → encounter {option}
//   {kind:"factory_offer"}→ factory_pick {cardId}
//   {kind:"rails"}        → rail {from,to} ×N
//   {kind:"ended"}        → partie finie (scoring disponible)
// ═══════════════════════════════════════════════════════════════════════
import { createPlayer } from './player.js';
import { botTurn, estimateScore } from './bot.js';
import { applyBotPvpAfterMove, servitudeOnDisplace, transferHexResources } from './pvpBots.js';
import { resolveBotEncounter } from './botEncounters.js';
import { getValidMoves, marshToll, findPathWaypoints } from './movement.js';
import { transportUnits } from './transport.js';
import { canPayProduce, payProduce, getProduceCost, produceCostLabel } from './production.js';
import { countRes, spendRes, getWorkerHexes, resFR } from './resources.js';
import { reconcileHand, spendPickedCards, drawCardValue } from './cards.js';
import { claimFactoryCard, canPayFactoryCost, payFactoryCost, factoryEffectPossible, factoryWorkerHexes, factoryProduceHexes, factoryResourceHex } from './factory.js';
import { shuffleArray } from './hexMath.js';
import { BOT_PROFILES, assignBotProfile, BOT_NOISE, MAP_META_THREAT, playerStanding } from './botProfiles.js';
import { FACTIONS, FACTION_IDS } from '../data/factions.js';
import { MATS, matById, BOTTOM, getBottomCost, BUILDING_TYPES, ENLIST_ONGOING, ENLIST_IMMEDIATE, applyEnlistOngoing, topUpgradeCount, maxBottomCubes, frBot } from '../data/mats.js';
import { HEXES, hMap, ADJ, CURRENT_MAP, homeBaseHex } from '../data/hexes.js';
import { TERRAINS } from '../data/terrains.js';
import { ENCOUNTERS } from '../data/encounters.js';
import { OBJECTIVES } from '../data/objectives.js';
import { PLANS_FORD, PLANS_TESLA, FACTORY_RR_HEX, TESLA_FRAGMENTS_REQUIRED, TESLA_OFFER_SIZE } from '../data/plans.js';
import { pickStructureBonus, structureBonusDetail, STRUCTURE_BONUSES } from '../data/structureBonus.js';
import { getCombatBonus } from '../data/combat.js';
import { BALANCE } from '../data/balance.js';

// RNG seedé (reproductibilité) — même générateur que le simulateur
export const mulberry32 = (a) => () => {
  a |= 0; a = (a + 0x6D2B79F5) | 0;
  let t = Math.imul(a ^ (a >>> 15), 1 | a);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const deepResources = (p) => { const r = {}; Object.entries(p.resources).forEach(([k, v]) => { r[k] = { ...v }; }); return r; };
const clone = (p) => ({ ...p, workers: [...p.workers], mechs: [...p.mechs], resources: deepResources(p), cardHand: [...(p.cardHand || [])] });

export class HeadlessGame {
  /**
   * @param cfg {faction, mat, bots=3, difficulty="normal", seed, maxRounds=60,
   *             factionsBots?:[ids], blind?:bool (masque les stats internes bots)}
   */
  constructor(cfg = {}) {
    // RNG par instance : actif uniquement pendant la construction et act(),
    // pour que plusieurs parties seedées coexistent dans un même process.
    this.rng = cfg.seed != null ? mulberry32(cfg.seed) : null;
    const prevRandom = Math.random;
    if (this.rng) Math.random = this.rng;
    try {
    this.cfg = cfg;
    this.maxRounds = cfg.maxRounds || 60;
    this.difficulty = cfg.difficulty || 'normal';
    this.turn = 1;
    this.journal = [];
    this.step = 0;
    this.pending = null;
    this.ended = false;
    this.result = null;

    // ── Sièges : 0 = API, puis bots ──
    const nBots = Math.min(4, Math.max(1, cfg.bots || 3));
    const humanFaction = cfg.faction && FACTION_IDS.includes(cfg.faction) ? cfg.faction : shuffleArray([...FACTION_IDS])[0];
    const botFactions = cfg.factionsBots?.length === nBots ? cfg.factionsBots
      : shuffleArray(FACTION_IDS.filter(f => f !== humanFaction)).slice(0, nBots);
    const matIds = shuffleArray(MATS.map(m => m.id));
    const humanMat = cfg.mat && MATS.some(m => m.id === cfg.mat) ? cfg.mat : matIds[0];
    const botMats = matIds.filter(m => m !== humanMat);
    this.players = [
      createPlayer(humanFaction, humanMat, false),
      ...botFactions.map((f, i) => createPlayer(f, botMats[i % botMats.length], true)),
    ];
    this.players.forEach((p, i) => {
      if (i === 0) return;
      p.botProfile = assignBotProfile(p.faction, this.difficulty);
      p.botNoise = BOT_NOISE[this.difficulty] ?? 3;
    });
    const shuffledObj = shuffleArray(OBJECTIVES);
    this.players.forEach((p, i) => {
      p.objectives = [shuffledObj[(i * 2) % shuffledObj.length], shuffledObj[(i * 2 + 1) % shuffledObj.length]];
      p.objective = p.objectives[0];
    });

    // ── Plateau ──
    this.empire = {}; // bots Empire désactivés (mécanique campagne)
    this.rails = [];
    this.encounterTokens = new Set(CURRENT_MAP.encounterHexes);
    this.encounterDeck = shuffleArray(ENCOUNTERS);
    this.factoryOffer = shuffleArray(PLANS_FORD).slice(0, this.players.length + 1);
    this.teslaOffer = shuffleArray(PLANS_TESLA).slice(0, TESLA_OFFER_SIZE);
    this.structureBonus = cfg.structureBonus
      ? STRUCTURE_BONUSES.find(b => b.id === cfg.structureBonus) || pickStructureBonus()
      : pickStructureBonus();

    this.log('info', `🏦 Bonus de pose : ${this.structureBonus.icon} ${this.structureBonus.name} — ${this.structureBonus.scale} ${this.structureBonus.desc}`);
    this.log('combat', `⚔ ${this.players.length} joueurs`);
    this.players.forEach((p, i) => {
      const f = FACTIONS[p.faction];
      const prof = i > 0 ? BOT_PROFILES[p.botProfile] : null;
      this.log(i === 0 ? 'warn' : 'bot', `${i === 0 ? '👤' : '🤖'} ${f.name} (${p.matName})${prof ? ` ${prof.icon} ${prof.name}` : ''}  ⚡${p.power} 🃏${p.combatCards} ♥${p.pop} 💰${p.coins}`);
    });
    this.snapshots();
    } finally { Math.random = prevRandom; }
  }

  // ═══ Journal ═══
  log(cat, msg) { this.journal.push({ tour: this.turn, etape: ++this.step, cat, ts: Date.now(), msg }); }
  note(msg) { this.log('note', `📝 ${msg}`); }
  snapshots() {
    this.players.forEach((p, i) => {
      const tot = (rt) => Object.values(p.resources).reduce((a, r) => a + (r[rt] || 0), 0);
      this.log('snap', `[Début${i > 0 ? ` 🤖 ${FACTIONS[p.faction].name}` : ''}] ⚡${p.power} 🃏${p.combatCards} ♥${p.pop} 💰${p.coins} ⭐${p.stars || 0} W${p.workers.length} M${p.mechs.length} Fe${tot('metal')} Bo${tot('bois')} No${tot('nourriture')} Pe${tot('petrole')} Ab[${(p.unlockedAbilities || []).join(',')}]`);
    });
  }

  // ═══ Vue du siège API ═══
  me() { return this.players[0]; }
  effMoveLimit() { return 2 + topUpgradeCount(this.me(), 'Move', 'worker'); }

  publicState() {
    const p = this.me();
    reconcileHand(p);
    const board = {};
    HEXES.forEach(h => {
      if (h.base) return;
      const cell = { t: h.t, res: TERRAINS[h.t]?.res || null };
      if (this.encounterTokens.has(h.id)) cell.rencontre = true;
      if (h.id === FACTORY_RR_HEX) cell.usine = true;
      board[h.id] = cell;
    });
    this.rails.forEach(([a, b]) => {
      (board[a] ??= {}).rail = true; (board[b] ??= {}).rail = true;
    });
    this.players.forEach((pl, i) => {
      const tag = i === 0 ? 'moi' : pl.faction;
      const mark = (hid, what) => { const c = board[hid]; if (!c) return; (c.unites ??= []).push(`${tag}:${what}`); };
      mark(pl.hero, 'héros');
      pl.workers.forEach(w => mark(w.hexId, 'ouvrier'));
      pl.mechs.forEach(m => mark(m.hexId, 'mech'));
      (pl.buildings || []).forEach(b => mark(b.hexId, b.type));
      (pl.flagTokens || []).forEach(fl => mark(fl.hexId, 'comptoir'));
      Object.entries(pl.resources).forEach(([hid, r]) => {
        const c = board[hid]; if (!c) return;
        Object.entries(r).forEach(([rt, n]) => { if (n > 0) (c.stocks ??= {})[`${tag}:${rt}`] = ((c.stocks ?? {})[`${tag}:${rt}`] || 0) + n; });
      });
    });
    const mat = matById(p.matId);
    const seeInternals = !this.cfg.blind;
    return {
      tour: this.turn, fini: this.ended, resultat: this.result,
      attente: this.publicPending(p),
      moi: {
        faction: p.faction, plateau: p.matName, colonnes: p.topRow.map((t, i) => `${t}·${BOTTOM[i]}`),
        pui: p.power, cartes: p.cardHand, pop: p.pop, argent: p.coins, etoiles: p.stars,
        heros: p.hero, ouvriers: p.workers.map(w => ({ id: w.id, hex: w.hexId })),
        mechs: p.mechs.map(m => ({ id: m.id, hex: m.hexId })), abilities: p.unlockedAbilities,
        batiments: (p.buildings || []).map(b => ({ type: b.type, hex: b.hexId })),
        ressources: p.resources, recrues: p.recruits || 0, ameliorations: p.upgrades || 0,
        cubesHaut: p.cubesOnTop, cubesBas: p.cubesOnBottom, enlistMap: p.enlistMap,
        coutsBas: getBottomCost(p), lastCol: p.lastCol,
        missions: (p.objectives || []).map((o, i) => ({ i, nom: o.name, desc: o.desc, remplie: !!o.check?.(p, { players: this.players }), revelee: p.objectiveRevealed && p.revealedObjectiveIdx === i })),
        objectifFaction: FACTIONS[p.faction].fObj ? { nom: FACTIONS[p.faction].fObj.name, desc: FACTIONS[p.faction].fObj.desc, rempli: !!FACTIONS[p.faction].fObj.check(p), revele: !!p.fObjRevealed } : null,
        carteUsine: p.factoryCard ? { id: p.factoryCard.id, nom: p.factoryCard.name, cout: p.factoryCard.cost, gains: p.factoryCard.gain, jouable: p.lastCol !== 'factory' } : null,
        fragments: p.fragments || 0, comptoirs: (p.flagTokens || []).map(f => f.hexId), pieges: (p.trapTokens || []).map(t => ({ hex: t.hexId, desarme: t.disarmed })),
      },
      adversaires: this.players.slice(1).map(pl => ({
        faction: pl.faction, plateau: pl.matName,
        profil: seeInternals ? BOT_PROFILES[pl.botProfile]?.name : undefined,
        pui: pl.power, nbCartes: pl.combatCards, pop: pl.pop, argent: pl.coins, etoiles: pl.stars,
        heros: pl.hero, ouvriers: pl.workers.map(w => w.hexId), mechs: pl.mechs.map(m => m.hexId),
        batiments: (pl.buildings || []).map(b => ({ type: b.type, hex: b.hexId })),
        abilities: pl.unlockedAbilities, recrues: pl.recruits || 0,
      })),
      plateau: board, rails: this.rails,
      bonusPose: { nom: this.structureBonus.name, desc: this.structureBonus.desc, bareme: this.structureBonus.scale, monCompte: structureBonusDetail(p, this.structureBonus, this.players) },
      actionsLegales: this.legalActions(),
    };
  }

  // Vue publique de l'attente en cours — liste blanche par type.
  // Ne JAMAIS exposer botSpend/botCards/botTotal (engagement secret du bot
  // attaquant), ni botQueue/resume/movedUnits (structures internes).
  publicPending(p) {
    const pd = this.pending;
    if (!pd) return null;
    switch (pd.kind) {
      case 'move': return { kind: 'move', movesLeft: pd.movesLeft, moved: pd.moved };
      case 'bottom': return { kind: 'bottom', col: pd.col, action: BOTTOM[pd.col] };
      case 'combat': return { kind: 'combat', role: pd.role, hexId: pd.hexId, oppIdx: pd.oppIdx, maxPower: pd.maxPower, maxCards: pd.maxCards, info: pd.info };
      case 'encounter': return { kind: 'encounter', rencontre: { nom: pd.card.name, texte: pd.card.flavor || '', options: pd.card.choices.map((c, i) => ({ i, label: c.label, desc: c.desc, payable: !c.available || c.available(p) })) } };
      case 'factory_offer': return { kind: 'factory_offer', offre: pd.pool.map(c => ({ id: c.id, nom: c.name, deck: c.deck, cout: c.cost, gains: c.gain })) };
      case 'rails': return { kind: 'rails', remaining: pd.remaining, gareHex: pd.gareHex };
      default: return { kind: pd.kind };
    }
  }

  legalActions() {
    if (this.ended) return [{ type: 'journal' }];
    const p = this.me();
    const pd = this.pending;
    if (pd?.kind === 'combat') return [{ type: 'combat', power: `0-${Math.min(7, p.power)}`, cards: `valeurs de votre main (max ${pd.maxCards})` }];
    if (pd?.kind === 'encounter') return pd.card.choices.map((c, i) => ({ type: 'encounter', option: i, label: c.label, payable: !c.available || c.available(p) })).filter(a => a.payable);
    if (pd?.kind === 'factory_offer') return [...pd.pool.map(c => ({ type: 'factory_pick', cardId: c.id, nom: c.name })), { type: 'factory_pick', cardId: 'none' }];
    if (pd?.kind === 'rails') return [{ type: 'rail', from: '…', to: '…', restants: pd.remaining, info: 'depuis la Gare ou un rail existant, ni lac ni marécage' }];
    if (pd?.kind === 'move') {
      return [{ type: 'move_unit', info: `unités restantes: ${pd.movesLeft} — unit: "hero"|id mech|id ouvrier, to: hex, workers?: n, res?: {type:qté}, capture?: bool, flag?: bool, trap?: bool` }, { type: 'end_move' }];
    }
    if (pd?.kind === 'bottom') {
      const acts = [{ type: 'skip_bottom' }];
      const col = pd.col, ba = BOTTOM[col], bc = getBottomCost(p)[col];
      const alt = FACTIONS[p.faction]?.deployAltRes;
      const payable = bc && (countRes(p, bc.res) >= bc.qty || (ba === 'Deploy' && alt && countRes(p, alt) >= bc.qty));
      if (payable) {
        if (ba === 'Upgrade' && (p.upgrades || 0) < 6) acts.push({ type: 'bottom_upgrade', from: '0-3 (col avec cube haut)', to: '0-3 (col bas non saturée)' });
        if (ba === 'Deploy' && p.mechs.length < 4) acts.push({ type: 'bottom_deploy', hex: getWorkerHexes(p).filter(h => !hMap[h]?.base), slot: [0, 1, 2, 3].filter(s => !(p.unlockedAbilities || []).includes(s)) });
        if (ba === 'Build' && (p.buildings || []).length < 4) acts.push({ type: 'bottom_build', building: BUILDING_TYPES.filter(bt => !(p.buildings || []).some(b => b.type === bt.type)).map(bt => bt.type), hex: getWorkerHexes(p).filter(h => !hMap[h]?.base && !(p.buildings || []).some(b => b.hexId === h)) });
        if (ba === 'Enlist' && (p.recruits || 0) < 4) acts.push({ type: 'bottom_enlist', section: [0, 1, 2, 3].filter(c => (p.enlistMap || [])[c] == null), recruit: [0, 1, 2, 3].filter(r => !(p.enlistMap || []).includes(r)) });
      }
      return acts;
    }
    if (pd?.kind === 'turn_end') {
      const acts = [{ type: 'end_turn' }];
      (p.objectives || []).forEach((o, i) => { if (!p.objectiveRevealed && o.check?.(p, { players: this.players })) acts.push({ type: 'reveal', which: `objective${i}`, nom: o.name }); });
      const fo = FACTIONS[p.faction].fObj;
      if (fo && !p.fObjRevealed && fo.check(p)) acts.push({ type: 'reveal', which: 'faction', nom: fo.name });
      return acts;
    }
    // Choix de colonne (top)
    const acts = [];
    const cols = p.topRow.map((t, i) => ({ t, i })).filter(({ i }) => i !== p.lastCol);
    cols.forEach(({ t, i }) => {
      if (t === 'Move') acts.push({ type: 'move_unit', col: i, info: 'démarre le Déplacer' }, { type: 'move_coin', col: i });
      if (t === 'Trade' && p.coins >= 1) acts.push({ type: 'trade', col: i, buy: `[{res,hex}] ×${2 + topUpgradeCount(p, 'Trade', 'metal')} sur vos hexes ouvriers` }, { type: 'trade_pop', col: i });
      if (t === 'Bolster' && p.coins >= 1) acts.push({ type: 'bolster', pick: 'power|cards' });
      if (t === 'Produce' && canPayProduce(p)) acts.push({ type: 'produce', hexes: `max ${2 + topUpgradeCount(p, 'Produce', 'nourriture')} hexes ouvriers (+ moulin en bonus)` });
    });
    if (p.factoryCard && p.lastCol !== 'factory') acts.push({ type: 'factory_top', info: `${p.factoryCard.name} — payable: ${canPayFactoryCost(p, p.factoryCard)}` }, { type: 'factory_move', info: '1 unité, 2 hex (+1 Vitesse)' });
    acts.push({ type: 'pass_turn' });
    return acts;
  }

  // ═══ Étoiles automatiques du siège API ═══
  autoStars(p) {
    if (p.power >= 16 && !p.starPower) { p.stars++; p.starPower = true; this.log('star', '⭐⚡ Puissance maximale (16) !'); }
    if (p.pop >= 18 && !p.starPop) { p.stars++; p.starPop = true; this.log('star', '⭐♥ Popularité maximale (18) !'); }
    if (p.workers.length >= 8 && !p.starWorkers) { p.stars++; p.starWorkers = true; this.log('star', '⭐👷 8 ouvriers !'); }
  }

  checkEnd() {
    const winner = this.players.find(pl => (pl.stars || 0) >= 6);
    if (winner && !this.ended) {
      this.log('star', `🏆🏆🏆 ${FACTIONS[winner.faction].name} atteint 6 étoiles ! FIN DE PARTIE IMMÉDIATE !`);
      this.finish('stars');
      return true;
    }
    return false;
  }

  finish(endedBy) {
    this.ended = true;
    this.pending = { kind: 'ended' };
    const hbHexOf = (fid) => homeBaseHex(fid);
    const scoreOf = (p) => {
      const popTier = p.pop <= 6 ? 0 : p.pop <= 12 ? 1 : 2;
      const [sm, tm, rm] = [[3, 2, 1], [4, 3, 2], [5, 4, 3]][popTier];
      const unitHexes = new Set([p.hero, ...p.workers.map(w => w.hexId), ...p.mechs.map(m => m.hexId)]);
      (p.buildings || []).forEach(b => unitHexes.add(b.hexId));
      (p.trapTokens || []).forEach(t => { if (!t.disarmed) unitHexes.add(t.hexId); });
      let flagBonus = 0; const hbh = hbHexOf(p.faction);
      (p.flagTokens || []).forEach(fl => { if (!(hbh && (ADJ[hbh.id] || []).includes(fl.hexId))) flagBonus++; });
      const factoryBonus = unitHexes.has(FACTORY_RR_HEX) ? 2 : 0;
      let totalRes = 0;
      Object.entries(p.resources).forEach(([hid, r]) => { if (unitHexes.has(parseInt(hid))) Object.values(r).forEach(n => totalRes += n); });
      const pairs = Math.floor(Math.min(totalRes, BALANCE.resScoringCap) / 2);
      const sbD = structureBonusDetail(p, this.structureBonus, this.players);
      return {
        total: (p.stars || 0) * sm + (unitHexes.size + factoryBonus + flagBonus) * tm + pairs * rm + p.coins + (p.flagTokens || []).length * 2 + sbD.coins,
        etoiles: p.stars || 0, pop: p.pop, palier_pop: ['0-6', '7-12', '13-18'][popTier],
        territoires: unitHexes.size, bonus_usine: factoryBonus, comptoirs: (p.flagTokens || []).length,
        ressources: totalRes, paires: pairs, argent: p.coins, bonus_pose: sbD.coins,
        detail: { etoiles: (p.stars || 0) * sm, territoires: (unitHexes.size + factoryBonus + flagBonus) * tm, ressources: pairs * rm },
      };
    };
    this.result = {
      finPar: endedBy,
      classement: this.players
        .map((p, i) => ({ rang: 0, faction: p.faction, nom: FACTIONS[p.faction].name, bot: i !== 0, ...scoreOf(p) }))
        .sort((a, b) => b.total - a.total)
        .map((s, i) => ({ ...s, rang: i + 1 })),
    };
  }

  exportJournal() {
    return {
      jeu: 'Scythe Panamerica', date: new Date().toISOString(), carte: CURRENT_MAP.id || 'panamerica-v3',
      tours: this.turn, difficulte: this.difficulty, mode: 'api',
      classement: this.result?.classement || [], journal: this.journal,
    };
  }

  // ═══ Dispatch des actions du siège API ═══
  act(action) {
    if (this.ended) return this.fail('partie terminée');
    const before = this.journal.length;
    const prevRandom = Math.random;
    if (this.rng) Math.random = this.rng;
    try {
      const err = this.dispatch(action);
      if (err) return this.fail(err);
      this.autoStars(this.me());
      this.checkEnd();
    } catch (e) {
      return this.fail(`erreur interne: ${e.message}`);
    } finally { Math.random = prevRandom; }
    return { ok: true, events: this.journal.slice(before).map(e => e.msg) };
  }
  fail(msg) { return { ok: false, error: msg }; }

  dispatch(a) {
    const p = this.me();
    const pd = this.pending;
    if (a.type === 'note') { this.note(String(a.msg || '').slice(0, 500)); return; }

    // ── réponses aux états d'attente ──
    if (pd?.kind === 'combat') return this.resolvePendingCombat(a);
    if (pd?.kind === 'encounter') return a.type === 'encounter' ? this.resolveEncounter(a) : `en attente d'une décision de rencontre (${pd.card.name})`;
    if (pd?.kind === 'factory_offer') return a.type === 'factory_pick' ? this.resolveFactoryPick(a) : `en attente d'un choix de carte d'usine`;
    if (pd?.kind === 'rails') return a.type === 'rail' ? this.placeRail(a) : `en attente de pose de rail (${pd.remaining} restant·s)`;
    if (pd?.kind === 'move') {
      if (a.type === 'move_unit') return this.moveUnit(a);
      if (a.type === 'end_move') { this.log('move', `✅ Mouvement terminé (${pd.moved}/${pd.movesLeft + pd.moved})`); return this.afterTop(pd.col); }
      return 'déplacement en cours: move_unit ou end_move';
    }
    if (pd?.kind === 'bottom') {
      if (a.type === 'skip_bottom') { this.pending = { kind: 'turn_end' }; return; }
      if (a.type === 'bottom_upgrade') return this.bottomUpgrade(a, pd.col);
      if (a.type === 'bottom_deploy') return this.bottomDeploy(a, pd.col);
      if (a.type === 'bottom_build') return this.bottomBuild(a, pd.col);
      if (a.type === 'bottom_enlist') return this.bottomEnlist(a, pd.col);
      return 'action du bas attendue (bottom_* ou skip_bottom)';
    }
    if (pd?.kind === 'turn_end') {
      if (a.type === 'reveal') return this.reveal(a);
      if (a.type === 'end_turn') return this.endTurn();
      return 'fin de tour: reveal ou end_turn';
    }

    // ── choix d'action du haut ──
    if (a.type === 'pass_turn') { this.log('info', '⏭ Tour passé'); this.pending = { kind: 'turn_end' }; return; }
    if (a.type === 'move_coin') {
      const col = p.topRow.indexOf('Move');
      if (col === p.lastCol) return 'Déplacer joué au tour précédent (lastCol)';
      const g = 1 + topUpgradeCount(p, 'Move', 'coins');
      p.coins += g; this.log('resource', `💰 +${g}$ (pas de déplacement)`);
      return this.afterTop(col);
    }
    if (a.type === 'move_unit') {
      const col = p.topRow.indexOf('Move');
      if (col === p.lastCol) return 'Déplacer joué au tour précédent (lastCol)';
      this.pending = { kind: 'move', col, movesLeft: this.effMoveLimit(), moved: 0 };
      return this.moveUnit(a);
    }
    if (a.type === 'trade' || a.type === 'trade_pop') return this.trade(a);
    if (a.type === 'bolster') return this.bolster(a);
    if (a.type === 'produce') return this.produce(a);
    if (a.type === 'factory_top') return this.factoryTop(a);
    if (a.type === 'factory_move') return this.factoryMove(a);
    return `action inconnue ou hors séquence: ${a.type}`;
  }

  afterTop(col) {
    this.me().lastCol = col;
    if (col === 'factory' || BOTTOM[col] == null) { this.pending = { kind: 'turn_end' }; return; }
    this.pending = { kind: 'bottom', col };
  }

  // ═══ Actions du haut ═══
  trade(a) {
    const p = this.me();
    const col = p.topRow.indexOf('Trade');
    if (col === p.lastCol) return 'Commerce joué au tour précédent';
    if (p.coins < 1) return 'pas d\'argent';
    if (a.type === 'trade_pop') {
      const g = 1 + topUpgradeCount(p, 'Trade', 'pop');
      p.coins--; p.pop = Math.min(p.pop + g, 18);
      this.log('resource', `💰 -1$ → +${g} Pop`);
      return this.afterTop(col);
    }
    const slots = 2 + topUpgradeCount(p, 'Trade', 'metal');
    const buy = a.buy || [];
    if (buy.length !== slots) return `il faut exactement ${slots} achats [{res,hex}]`;
    const myHexes = new Set(getWorkerHexes(p).filter(h => !hMap[h]?.base));
    for (const b of buy) { if (!myHexes.has(b.hex)) return `#${b.hex} ne porte pas un de vos ouvriers`; if (!['metal', 'bois', 'nourriture', 'petrole'].includes(b.res)) return `ressource inconnue: ${b.res}`; }
    p.coins--;
    buy.forEach(b => { const k = String(b.hex); p.resources[k] = { ...(p.resources[k] || {}) }; p.resources[k][b.res] = (p.resources[k][b.res] || 0) + 1; });
    this.log('resource', `💰 -1$ → ${buy.map(b => `+1 ${resFR(b.res)} (#${b.hex})`).join(', ')}`);
    return this.afterTop(col);
  }

  bolster(a) {
    const p = this.me();
    const col = p.topRow.indexOf('Bolster');
    if (col === p.lastCol) return 'Soutien joué au tour précédent';
    if (p.coins < 1) return 'pas d\'argent';
    const hasArsenal = (p.buildings || []).some(b => b.type === 'arsenal');
    const hasMemorial = (p.buildings || []).some(b => b.type === 'memorial');
    p.coins--;
    if (a.pick === 'cards') {
      const g = 1 + topUpgradeCount(p, 'Bolster', 'combatCards');
      p.combatCards += g; reconcileHand(p);
      this.log('resource', `🃏 -1$ → +${g} CC`);
    } else {
      const g = 2 + (hasArsenal ? 1 : 0) + topUpgradeCount(p, 'Bolster', 'power');
      p.power = Math.min(p.power + g, 16);
      this.log('resource', `💪 -1$ → +${g} Pui${hasArsenal ? ' (Arsenal +1)' : ''}`);
    }
    if (hasMemorial) { p.pop = Math.min(p.pop + 1, 18); this.log('info', '🪦 Mémorial: +1 Pop'); }
    return this.afterTop(col);
  }

  produce(a) {
    const p = this.me();
    const col = p.topRow.indexOf('Produce');
    if (col === p.lastCol) return 'Produire joué au tour précédent';
    if (!canPayProduce(p)) return `coût de production impayable (${produceCostLabel(p.workers.length)})`;
    const byHex = {}; p.workers.forEach(w => { (byHex[String(w.hexId)] ??= []).push(w); });
    const moulinHex = (p.buildings || []).find(b => b.type === 'moulin')?.hexId;
    const maxN = 2 + topUpgradeCount(p, 'Produce', 'nourriture');
    const picks = [...new Set(a.hexes || [])];
    if (picks.length === 0) return 'hexes requis';
    for (const h of picks) if (!byHex[String(h)] && h !== moulinHex) return `#${h}: ni ouvrier ni moulin`;
    if (picks.filter(h => h !== moulinHex).length > maxN) return `max ${maxN} hexes (+ moulin en bonus)`;
    const label = produceCostLabel(p.workers.length);
    payProduce(p);
    if (label !== 'Gratuit') this.log('resource', `💳 ${label}`);
    picks.forEach(h => {
      const hex = hMap[h]; const t = TERRAINS[hex?.t]; if (!t) return;
      let w = (byHex[String(h)] || []).length;
      if ((p.buildings || []).some(b => b.type === 'moulin' && b.hexId === h)) w++;
      if (hex.t === 'village') {
        const before = p.workers.length;
        for (let i = 0; i < w && p.workers.length < 8; i++) p.workers.push({ id: `${p.faction}_w${p.workers.length}`, hexId: h });
        if (p.workers.length > before) this.log('info', `👷 +${p.workers.length - before} ouv. #${h}`);
      } else if (t.res && t.res !== 'ouvriers') {
        const k = String(h); p.resources[k] = { ...(p.resources[k] || {}) };
        p.resources[k][t.res] = (p.resources[k][t.res] || 0) + w;
        this.log('info', `🏭 +${w} ${resFR(t.res)} #${h}`);
      }
    });
    return this.afterTop(col);
  }

  // ═══ Déplacement ═══
  findUnit(p, ref) {
    if (ref === 'hero') return { type: 'hero' };
    const mi = p.mechs.findIndex(m => m.id === ref);
    if (mi >= 0) return { type: 'mech', idx: mi };
    const wi = p.workers.findIndex(w => w.id === ref);
    if (wi >= 0) return { type: 'worker', idx: wi };
    return null;
  }

  enemyOccupied() {
    const s = new Set();
    this.players.slice(1).forEach(pl => { s.add(pl.hero); pl.mechs.forEach(m => s.add(m.hexId)); pl.workers.forEach(w => s.add(w.hexId)); });
    return s;
  }

  moveUnit(a) {
    const p = this.me();
    const pd = this.pending;
    if (pd.movesLeft <= 0) return 'plus de déplacements ce tour (end_move)';
    const u = this.findUnit(p, a.unit);
    if (!u) return `unité inconnue: ${a.unit} (hero | ${p.mechs.map(m => m.id).join(',')} | ${p.workers.map(w => w.id).join(',')})`;
    if ((pd.movedUnits ??= new Set()).has(a.unit)) return `${a.unit} a déjà bougé ce tour`;
    const from = u.type === 'hero' ? p.hero : u.type === 'mech' ? p.mechs[u.idx].hexId : p.workers[u.idx].hexId;
    const enemyHexes = this.enemyOccupied();
    const valid = new Set(getValidMoves(from, p.faction, p.unlockedAbilities || [], p, this.rails, u.type, enemyHexes));
    if (!valid.has(a.to)) return `#${a.to} hors de portée depuis #${from} (accessibles: ${[...valid].sort((x, y) => x - y).join(',')})`;

    // ouvriers : jamais sur un hex ennemi
    if (u.type === 'worker' && enemyHexes.has(a.to)) return 'un ouvrier ne peut pas entrer sur un hex ennemi';

    // combat ? (héros/mech sur héros/mech ennemi)
    let combatDef = -1;
    if (u.type !== 'worker') {
      this.players.slice(1).forEach((pl, i) => {
        if (pl.hero === a.to || pl.mechs.some(m => m.hexId === a.to)) combatDef = i + 1;
      });
    }

    // appliquer le déplacement + transport
    const opts = u.type === 'mech'
      ? { carryWorkers: (a.workers ?? 0) > 0 || a.workers === undefined, carryRes: a.res !== null, workerCount: a.workers, resCounts: a.res }
      : { carryRes: a.res !== null, resCounts: a.res };
    if (u.type === 'hero') p.hero = a.to;
    else if (u.type === 'mech') { p.mechs = [...p.mechs]; p.mechs[u.idx] = { ...p.mechs[u.idx], hexId: a.to }; }
    else { p.workers = [...p.workers]; p.workers[u.idx] = { ...p.workers[u.idx], hexId: a.to }; }
    const tr = transportUnits(p, from, a.to, u.type, opts);
    Object.assign(p, { workers: tr.player.workers, resources: tr.player.resources });
    const tl = [tr.carried.workers > 0 ? `👷×${tr.carried.workers}` : '', tr.carried.resTypes.length ? `📦${tr.carried.resTypes.join(',')}` : ''].filter(Boolean).join(' ');
    this.log('move', `🚶 ${a.unit === 'hero' ? FACTIONS[p.faction].hero : a.unit} → #${a.to}${tl ? ' ' + tl : ''}`);
    const toll = marshToll(p, a.to, u.type, tr.carried.workers);
    if (toll) this.log('info', toll);

    pd.movesLeft--; pd.moved++; pd.movedUnits.add(a.unit);

    if (u.type !== 'worker') {
      // pièges Frente sur le trajet
      const route = [...findPathWaypoints(from, a.to, p.faction, p.unlockedAbilities || [], p, this.rails, enemyHexes), a.to];
      this.players.slice(1).forEach(pl => {
        if (pl.faction !== 'frente') return;
        (pl.trapTokens || []).forEach((t, ti) => {
          if (!t.disarmed && route.includes(t.hexId)) {
            const pen = Math.min(p.power, 3);
            p.power = Math.max(0, p.power - pen); p.pop = Math.max(0, p.pop - 2);
            pl.trapTokens = [...pl.trapTokens]; pl.trapTokens[ti] = { ...t, disarmed: true };
            this.log('combat', `💥 Trap Frente sur #${t.hexId} ! -${pen}⚡ -2♥`);
          }
        });
      });
      // déplacement d'ouvriers ennemis seuls + pillage + servitude (choix: a.capture)
      this.players.slice(1).forEach((pl, i) => {
        const defended = pl.hero === a.to || pl.mechs.some(m => m.hexId === a.to);
        const displaced = pl.workers.filter(w => w.hexId === a.to);
        if (displaced.length === 0 || defended) return;
        const hb = homeBaseHex(pl.faction);
        this.players[i + 1] = { ...pl, workers: pl.workers.map(w => w.hexId === a.to ? { ...w, hexId: hb.id } : w), resources: deepResources(pl) };
        transferHexResources(this.players[i + 1], p, a.to);
        p.pop = Math.max(0, p.pop - displaced.length);
        p.scaredWorkers = (p.scaredWorkers || 0) + displaced.length;
        this.log('info', `🏃 ${displaced.length} ouvrier(s) ${FACTIONS[pl.faction].name} renvoyé(s) ! (-${displaced.length} Pop)`);
        if (a.capture && p.faction === 'confederation' && p.pop >= 2 && (p.capturedWorkers || 0) < 2) {
          p.pop = Math.max(0, p.pop - 2);
          p.workers = [...p.workers, { id: `${p.faction}_serv${p.workers.length}`, hexId: a.to }];
          p.capturedWorkers = (p.capturedWorkers || 0) + 1;
          this.log('info', `⛓ Servitude ! Ouvrier capturé (-2 Pop, ${p.capturedWorkers}/2)`);
        }
      });
      // jetons de faction du siège API
      if (u.type === 'hero' && a.trap && p.faction === 'frente' && (p.trapTokens || []).length < 4 && !(p.trapTokens || []).some(t => t.hexId === a.to)) {
        p.trapTokens = [...(p.trapTokens || []), { hexId: a.to, disarmed: false }];
        this.log('info', `🪤 Piège posé #${a.to} (${p.trapTokens.length}/4)`);
      }
      if (u.type === 'hero' && a.flag && p.faction === 'acadiane' && (p.flagTokens || []).length < 4 && !(p.flagTokens || []).some(f => f.hexId === a.to)) {
        p.flagTokens = [...(p.flagTokens || []), { hexId: a.to }];
        this.log('info', `🏴 Comptoir #${a.to} (${p.flagTokens.length}/4)`);
      }
    }

    // combat contre un bot ?
    if (combatDef > 0) {
      const def = this.players[combatDef];
      reconcileHand(p);
      const units = (u.type === 'hero' ? 1 : 0) + (p.hero === a.to ? (u.type === 'hero' ? 0 : 1) : 0) + p.mechs.filter(m => m.hexId === a.to).length;
      const cb = getCombatBonus(p, a.to, true, def.combatCards);
      this.pending = { kind: 'combat', role: 'attaque', hexId: a.to, oppIdx: combatDef, resume: { ...pd, kind: 'move' },
        maxPower: Math.min(7, p.power), maxCards: Math.max(0, Math.min(p.combatCards, units + cb.cardBonus)),
        info: `⚔ vs ${FACTIONS[def.faction].name} (⚡${def.power}, ${def.combatCards}🃏 en main)` };
      this.log('combat', `⚔ Combat PvP vs ${FACTIONS[def.faction].name} sur #${a.to} !`);
      return;
    }

    return this.afterArrival(u, a.to, pd);
  }

  // rencontre / Rouge River à l'arrivée du héros — puis suite du move
  afterArrival(u, to, movePending) {
    const p = this.me();
    if (u.type === 'hero' && this.encounterTokens.has(to)) {
      this.encounterTokens.delete(to);
      if (this.encounterDeck.length === 0) this.encounterDeck = shuffleArray(ENCOUNTERS);
      const card = this.encounterDeck.shift();
      this.pending = { kind: 'encounter', card, resume: movePending };
      this.log('encounter', `📜 Rencontre: "${card.name}"`);
      return;
    }
    if (u.type === 'hero' && to === FACTORY_RR_HEX && !p.visitedRR) {
      const hasFrag = (p.fragments || 0) >= TESLA_FRAGMENTS_REQUIRED;
      const pool = [...this.factoryOffer, ...(hasFrag ? this.teslaOffer : [])];
      if (pool.length > 0) {
        this.pending = { kind: 'factory_offer', pool, resume: movePending };
        this.log('rr', `⚙ Rouge River ! Offre : ${pool.map(c => c.name).join(' · ')}`);
        return;
      }
      p.visitedRR = true;
      this.log('rr', '⚙ Rouge River : offre épuisée');
    }
    if (movePending && movePending.kind === 'move' && movePending.movesLeft > 0) { this.pending = movePending; return; }
    if (movePending && movePending.kind === 'move') { this.log('move', `✅ Mouvement terminé (${movePending.moved}/${movePending.moved})`); return this.afterTop(movePending.col); }
    this.pending = movePending ?? this.pending;
  }

  resolveEncounter(a) {
    const p = this.me();
    const { card, resume } = this.pending;
    const choice = card.choices[a.option];
    if (!choice) return `option invalide (0-${card.choices.length - 1})`;
    if (choice.available && !choice.available(p)) return `option impayable: ${choice.desc}`;
    // même mécanique que resolveBotEncounter, mais choix explicite
    const fake = [{ ...clone(p), botProfile: 'equilibre' }];
    const deck = [{ ...card, choices: [choice] }];
    const er = resolveBotEncounter(fake[0], deck, { allPlayers: this.players, bestOppScore: 0 });
    this.players[0] = { ...er.player, isBot: false };
    this.log('encounter', `📜 ${card.name}: ${choice.label} → ${choice.desc}`);
    // mecha gagné → l'ability suit l'ordre des slots libres (auto)
    this.autoStars(this.players[0]);
    return this.afterArrival({ type: 'none' }, null, resume);
  }

  resolveFactoryPick(a) {
    const p = this.me();
    const { pool, resume } = this.pending;
    if (a.cardId === 'none') { p.visitedRR = true; this.log('rr', '⚙ Rouge River visitée sans prendre de carte'); return this.afterArrival({ type: 'none' }, null, resume); }
    const card = pool.find(c => c.id === a.cardId);
    if (!card) return `carte inconnue: ${a.cardId}`;
    if (card.deck === 'tesla' && (p.fragments || 0) < TESLA_FRAGMENTS_REQUIRED) return 'fragments Tesla insuffisants';
    claimFactoryCard(p, card);
    if (card.deck === 'tesla') this.teslaOffer = this.teslaOffer.filter(c => c.id !== card.id);
    else this.factoryOffer = this.factoryOffer.filter(c => c.id !== card.id);
    this.log('rr', `⚙ Carte d'usine choisie: ${card.name}`);
    return this.afterArrival({ type: 'none' }, null, resume);
  }

  // ═══ Colonne d'usine ═══
  factoryTop(a) {
    const p = this.me();
    if (!p.factoryCard) return 'pas de carte d\'usine';
    if (p.lastCol === 'factory') return 'colonne usine jouée au tour précédent';
    if (!canPayFactoryCost(p, p.factoryCard)) return 'coût impayable';
    payFactoryCost(p, p.factoryCard);
    this.log('rr', `⚙ ${p.factoryCard.name} — coût payé`);
    for (let eff of p.factoryCard.gain) {
      if (eff.type === 'choice') {
        const pick = a.choice != null ? eff.options[a.choice] : eff.options.find(o => factoryEffectPossible(p, o));
        if (!pick) continue;
        eff = pick;
      }
      if (!factoryEffectPossible(p, eff)) { this.log('rr', `⚙ ${eff.type} impossible — passé`); continue; }
      this.applyFactoryEffect(p, eff, a);
    }
    p.lastCol = 'factory';
    this.pending = { kind: 'turn_end' };
  }

  applyFactoryEffect(p, eff, a) {
    switch (eff.type) {
      case 'coins': p.coins += eff.qty; this.log('rr', `⚙ +${eff.qty}$`); break;
      case 'power': p.power = Math.min(p.power + eff.qty, 16); this.log('rr', `⚙ +${eff.qty}⚡`); break;
      case 'pop': p.pop = Math.min(p.pop + eff.qty, 18); this.log('rr', `⚙ +${eff.qty}♥`); break;
      case 'cards': p.combatCards += eff.qty; reconcileHand(p); this.log('rr', `⚙ +${eff.qty}🃏`); break;
      case 'upgrade': {
        const mat = matById(p.matId);
        const from = a.upgrade?.from ?? (p.cubesOnTop || []).findIndex(c => c > 0);
        const to = a.upgrade?.to ?? (mat.bottomSlots || []).findIndex((s, i) => (p.cubesOnBottom || [])[i] < maxBottomCubes(mat, i));
        if (from < 0 || to < 0 || !(p.cubesOnTop[from] > 0) || !((p.cubesOnBottom[to] || 0) < maxBottomCubes(mat, to))) { this.log('rr', '⚙ amélioration impossible'); break; }
        p.cubesOnTop = [...p.cubesOnTop]; p.cubesOnTop[from]--;
        p.cubesOnBottom = [...p.cubesOnBottom]; p.cubesOnBottom[to]++;
        p.upgrades = (p.upgrades || 0) + 1;
        this.log('rr', `⚙ Améliorer ${p.upgrades}/6 (gratuit)`);
        if (p.upgrades >= 6 && !p.starUpgrades) { p.stars++; p.starUpgrades = true; this.log('star', '⭐ 6 Améliorations !'); }
        break;
      }
      case 'enlist': {
        const freeCols = [0, 1, 2, 3].filter(c => (p.enlistMap || [])[c] == null);
        const freeRecs = [0, 1, 2, 3].filter(r => !(p.enlistMap || []).includes(r));
        const col = a.enlist?.section ?? freeCols[0], rec = a.enlist?.recruit ?? freeRecs[0];
        if (col == null || rec == null || !freeCols.includes(col) || !freeRecs.includes(rec)) { this.log('rr', '⚙ enrôlement impossible'); break; }
        p.enlistMap = [...p.enlistMap]; p.enlistMap[col] = rec;
        p.recruits = (p.recruits || 0) + 1;
        ENLIST_IMMEDIATE[col].apply(p); reconcileHand(p);
        this.log('rr', `⚙ Enrôler ${frBot(BOTTOM[col])} (gratuit) → immédiat ${ENLIST_IMMEDIATE[col].icon}${ENLIST_IMMEDIATE[col].label}`);
        if (p.recruits >= 4 && !p.starRecruits) { p.stars++; p.starRecruits = true; this.log('star', '⭐ 4 Recrues !'); }
        break;
      }
      case 'building': {
        const spots = factoryWorkerHexes(p).filter(h => !(p.buildings || []).some(b => b.hexId === h));
        const types = BUILDING_TYPES.filter(bt => !(p.buildings || []).some(b => b.type === bt.type));
        const hex = a.building?.hex ?? spots[0]; const type = a.building?.type ?? types.find(t => t.type !== 'gare')?.type ?? types[0]?.type;
        if (!spots.includes(hex) || !types.some(t => t.type === type)) { this.log('rr', '⚙ bâtiment impossible'); break; }
        p.buildings = [...(p.buildings || []), { type, hexId: hex }];
        this.log('build', `🏗 ${type} gratuit sur #${hex}`);
        if (p.buildings.length >= 4 && !p.starBuildings) { p.stars++; p.starBuildings = true; this.log('star', '⭐ 4 Bâtiments !'); }
        if (type === 'gare') this.pending = { kind: 'rails', remaining: 3, gareHex: hex, resume: { kind: 'turn_end' } };
        break;
      }
      case 'mech': {
        const spots = factoryWorkerHexes(p);
        const hex = a.mech?.hex ?? spots[0];
        const free = [0, 1, 2, 3].filter(s => !(p.unlockedAbilities || []).includes(s));
        const slot = a.mech?.slot ?? free[0];
        if (!spots.includes(hex) || p.mechs.length >= 4 || !free.includes(slot)) { this.log('rr', '⚙ mecha impossible'); break; }
        p.mechs = [...p.mechs, { id: `${p.faction}_m${p.mechs.length}`, hexId: hex }];
        p.unlockedAbilities = [...(p.unlockedAbilities || []), slot];
        this.log('deploy', `⬡ Mecha gratuit sur #${hex} → 🔓 slot ${slot}`);
        if (p.mechs.length >= 4 && !p.starMechs) { p.stars++; p.starMechs = true; this.log('star', '⭐ 4 Mechas !'); }
        break;
      }
      case 'produce2': {
        const hexes = (a.produce2?.hexes ?? factoryProduceHexes(p).slice(0, 2)).slice(0, 2);
        hexes.forEach(h => {
          const t = TERRAINS[hMap[h]?.t]; if (!t?.res) return;
          let w = p.workers.filter(x => x.hexId === h).length;
          if ((p.buildings || []).some(b => b.type === 'moulin' && b.hexId === h)) w++;
          if (hMap[h].t === 'village') { for (let i = 0; i < w && p.workers.length < 8; i++) p.workers.push({ id: `${p.faction}_w${p.workers.length}`, hexId: h }); }
          else { const k = String(h); p.resources[k] = { ...(p.resources[k] || {}) }; p.resources[k][t.res] = (p.resources[k][t.res] || 0) + w; this.log('rr', `⚙ +${w} ${resFR(t.res)} #${h}`); }
        });
        break;
      }
      case 'resources': {
        const hex = factoryResourceHex(p); if (hex == null) break;
        const picks = a.resources ?? Array(eff.qty).fill('metal');
        const k = String(hex); p.resources[k] = { ...(p.resources[k] || {}) };
        picks.slice(0, eff.qty).forEach(rt => { p.resources[k][rt] = (p.resources[k][rt] || 0) + 1; });
        this.log('rr', `⚙ +${picks.slice(0, eff.qty).map(resFR).join(', +')} #${hex}`);
        break;
      }
    }
  }

  factoryMove(a) {
    const p = this.me();
    if (!p.factoryCard) return 'pas de carte d\'usine';
    if (p.lastCol === 'factory') return 'colonne usine jouée au tour précédent';
    const u = this.findUnit(p, a.unit);
    if (!u) return `unité inconnue: ${a.unit}`;
    const from = u.type === 'hero' ? p.hero : u.type === 'mech' ? p.mechs[u.idx].hexId : p.workers[u.idx].hexId;
    const enemyHexes = this.enemyOccupied();
    const valid = new Set(getValidMoves(from, p.faction, p.unlockedAbilities || [], p, this.rails, u.type, enemyHexes, 1));
    if (!valid.has(a.to)) return `#${a.to} hors de portée (bas d'usine: 2 hex +1 Vitesse)`;
    this.pending = { kind: 'move', col: 'factory', movesLeft: 1, moved: 0, movedUnits: new Set() };
    return this.moveUnit(a);
  }

  // ═══ Actions du bas ═══
  paidBottom(p, col, altUsed) {
    const bc = getBottomCost(p)[col];
    const res = altUsed ? FACTIONS[p.faction].deployAltRes : bc.res;
    if (countRes(p, res) < bc.qty) return `il faut ${bc.qty} ${res}`;
    const sp = spendRes(p, res, bc.qty); Object.assign(p, { resources: sp.resources });
    return null;
  }
  bottomBonus(p, col, done) {
    const bc = getBottomCost(p)[col];
    if (done && (bc.bonus || 0) > 0) { p.coins += bc.bonus; this.log('resource', `💰 +${bc.bonus}$ (${frBot(BOTTOM[col])})`); }
    const er = applyEnlistOngoing(this.players, 0, col, FACTIONS);
    for (let i = 0; i < er.players.length; i++) this.players[i] = er.players[i];
    er.logs.forEach(l => this.log('enlist', l));
    this.pending = { kind: 'turn_end' };
  }

  bottomUpgrade(a, col) {
    const p = this.me();
    if ((p.upgrades || 0) >= 6) return 'améliorations au maximum';
    const mat = matById(p.matId);
    if (!(p.cubesOnTop?.[a.from] > 0)) return `pas de cube haut en colonne ${a.from}`;
    if (!((p.cubesOnBottom?.[a.to] || 0) < maxBottomCubes(mat, a.to))) return `colonne bas ${a.to} saturée`;
    const err = this.paidBottom(p, col); if (err) return err;
    p.cubesOnTop = [...p.cubesOnTop]; p.cubesOnTop[a.from]--;
    p.cubesOnBottom = [...p.cubesOnBottom]; p.cubesOnBottom[a.to]++;
    p.coins += (mat.bottomCosts[a.to].bonus || 0);
    p.upgrades = (p.upgrades || 0) + 1;
    this.log('upgrade', `⬆ Améliorer ${p.upgrades}/6: ${p.topRow[a.from]}↑ → ${BOTTOM[a.to]}↓`);
    if (p.upgrades >= 6 && !p.starUpgrades) { p.stars++; p.starUpgrades = true; this.log('star', '⭐ 6 Améliorations complétées !'); }
    return this.bottomBonus(p, col, true);
  }

  bottomDeploy(a, col) {
    const p = this.me();
    if (p.mechs.length >= 4) return 'mechas au maximum';
    const spots = getWorkerHexes(p).filter(h => !hMap[h]?.base);
    if (!spots.includes(a.hex)) return `#${a.hex} ne porte pas un de vos ouvriers`;
    const free = [0, 1, 2, 3].filter(s => !(p.unlockedAbilities || []).includes(s));
    if (!free.includes(a.slot)) return `slot invalide (libres: ${free.join(',')})`;
    const bc = getBottomCost(p)[col];
    const alt = FACTIONS[p.faction].deployAltRes;
    const useAlt = a.useAlt || (countRes(p, bc.res) < bc.qty && alt && countRes(p, alt) >= bc.qty);
    const err = this.paidBottom(p, col, useAlt); if (err) return err;
    p.mechs = [...p.mechs, { id: `${p.faction}_m${p.mechs.length}`, hexId: a.hex }];
    p.unlockedAbilities = [...(p.unlockedAbilities || []), a.slot];
    this.log('deploy', `⬡ Mecha déployé sur #${a.hex}`);
    this.log('ability', `🔓 Ability débloquée : slot ${a.slot}`);
    if (p.mechs.length >= 4 && !p.starMechs) { p.stars++; p.starMechs = true; this.log('star', '⭐ 4 Mechas déployés !'); }
    return this.bottomBonus(p, col, true);
  }

  bottomBuild(a, col) {
    const p = this.me();
    if ((p.buildings || []).length >= 4) return 'bâtiments au maximum';
    if ((p.buildings || []).some(b => b.type === a.building)) return `${a.building} déjà construit`;
    if (!BUILDING_TYPES.some(bt => bt.type === a.building)) return `type inconnu: ${a.building}`;
    const spots = getWorkerHexes(p).filter(h => !hMap[h]?.base && !(p.buildings || []).some(b => b.hexId === h));
    if (!spots.includes(a.hex)) return `#${a.hex} invalide (hex ouvrier sans bâtiment)`;
    const err = this.paidBottom(p, col); if (err) return err;
    p.buildings = [...(p.buildings || []), { type: a.building, hexId: a.hex }];
    this.log('build', `🏗 ${a.building} construit sur #${a.hex}`);
    if (p.buildings.length >= 4 && !p.starBuildings) { p.stars++; p.starBuildings = true; this.log('star', '⭐ 4 Bâtiments !'); }
    if (a.building === 'gare') {
      this.pending = { kind: 'rails', remaining: 3, gareHex: a.hex, resume: { kind: 'bottom_done', col } };
      this.log('resource', '🚂 Posez 3 segments de rail (action rail {from,to})');
      return;
    }
    return this.bottomBonus(p, col, true);
  }

  placeRail(a) {
    const pd = this.pending;
    const onNetwork = (h) => h === pd.gareHex || this.rails.some(([x, y]) => x === h || y === h);
    const taken = this.rails.some(([x, y]) => (x === a.from && y === a.to) || (x === a.to && y === a.from));
    const hTo = hMap[a.to];
    if (!onNetwork(a.from)) return `#${a.from} n'est ni la Gare ni sur un rail`;
    if (!(ADJ[a.from] || []).includes(a.to)) return `#${a.to} non adjacent à #${a.from}`;
    if (!hTo || hTo.base || hTo.t === 'lac' || hTo.t === 'marecage') return 'rail interdit (base/lac/marécage)';
    if (taken) return 'segment déjà posé';
    this.rails = [...this.rails, [a.from, a.to]];
    this.log('info', `🛤 Rail posé #${a.from}↔#${a.to} (${pd.remaining - 1} restant·s)`);
    pd.remaining--;
    if (pd.remaining <= 0) {
      this.log('info', '✅ 3 rails posés !');
      const r = pd.resume;
      if (r?.kind === 'bottom_done') return this.bottomBonus(this.me(), r.col, true);
      this.pending = r || { kind: 'turn_end' };
    }
  }

  bottomEnlist(a, col) {
    const p = this.me();
    if ((p.recruits || 0) >= 4) return 'recrues au maximum';
    if ((p.enlistMap || [])[a.section] != null) return `section ${a.section} déjà pourvue`;
    if ((p.enlistMap || []).includes(a.recruit)) return `recrue ${a.recruit} déjà posée`;
    const err = this.paidBottom(p, col); if (err) return err;
    p.enlistMap = [...p.enlistMap]; p.enlistMap[a.section] = a.recruit;
    p.recruits = (p.recruits || 0) + 1;
    ENLIST_IMMEDIATE[a.section].apply(p); reconcileHand(p);
    this.log('enlist', `🤝 Recrue ${p.recruits}/4 sur ${frBot(BOTTOM[a.section])} — immédiat ${ENLIST_IMMEDIATE[a.section].icon}${ENLIST_IMMEDIATE[a.section].label}, permanente ${ENLIST_ONGOING[a.recruit].icon}${ENLIST_ONGOING[a.recruit].label}`);
    if (p.recruits >= 4 && !p.starRecruits) { p.stars++; p.starRecruits = true; this.log('star', '⭐ 4 Recrues enrôlées !'); }
    return this.bottomBonus(p, col, true);
  }

  // ═══ Révélation & fin de tour ═══
  reveal(a) {
    const p = this.me();
    if (a.which === 'faction') {
      const fo = FACTIONS[p.faction].fObj;
      if (!fo || p.fObjRevealed || !fo.check(p)) return 'objectif de faction non révélable';
      p.fObjRevealed = true; p.stars++;
      this.log('star', `🏛⭐ Objectif de faction "${fo.name}" révélé !`);
      return;
    }
    const idx = a.which === 'objective1' ? 1 : 0;
    const o = (p.objectives || [])[idx];
    if (!o || p.objectiveRevealed || !o.check?.(p, { players: this.players })) return 'mission non révélable';
    p.objectiveRevealed = true; p.revealedObjectiveIdx = idx; p.stars++;
    this.log('star', `⭐ "${o.name}" révélé !`);
  }

  endTurn() {
    this.me().movesLeft = undefined;
    this.pending = null;
    if (this.botsPlay()) return; // défense interactive — la fin de tour reprendra après
    this.finishRound();
  }

  finishRound() {
    if (this.ended) return;
    this.turn++;
    this.log('turn', `── Tour ${this.turn} ──`);
    this.snapshots();
  }

  // ═══ Combats du siège API ═══
  resolvePendingCombat(a) {
    if (a.type !== 'combat') return 'réponse de combat attendue: {type:"combat", power, cards:[valeurs]}';
    const pd = this.pending;
    const p = this.me();
    reconcileHand(p);
    const spend = Math.max(0, Math.min(a.power || 0, pd.maxPower ?? Math.min(7, p.power)));
    const cards = (a.cards || []).slice(0, pd.maxCards ?? 0);
    p.power -= spend;
    const cardVal = spendPickedCards(p, cards);
    const cb = getCombatBonus(p, pd.hexId, pd.role === 'attaque', this.players[pd.oppIdx].combatCards);
    const myTotal = spend + cb.powerBonus + cardVal;

    const opp = this.players[pd.oppIdx];
    const of = FACTIONS[opp.faction];
    let oppTotal, oppSpend, oppCC;
    if (pd.role === 'attaque') {
      // le bot défend : formule défensive de pvpBots
      const oppCb = getCombatBonus(opp, pd.hexId, false, p.combatCards);
      const units = (opp.hero === pd.hexId ? 1 : 0) + opp.mechs.filter(m => m.hexId === pd.hexId).length;
      oppSpend = Math.min(Math.floor(opp.power * 0.6), 7, opp.power);
      oppCC = Math.min(opp.combatCards, units + oppCb.cardBonus);
      oppTotal = oppSpend + oppCb.powerBonus + oppCC * 2;
    } else {
      oppSpend = pd.botSpend; oppCC = pd.botCards; oppTotal = pd.botTotal;
    }
    opp.power = Math.max(0, opp.power - oppSpend); opp.combatCards = Math.max(0, opp.combatCards - oppCC); reconcileHand(opp);

    const iAmAttacker = pd.role === 'attaque';
    const iWin = iAmAttacker ? myTotal >= oppTotal : myTotal > oppTotal;
    this.log('combat', `⚔ ${iAmAttacker ? 'Vous' : of.name}: ${iAmAttacker ? myTotal : oppTotal} vs ${iAmAttacker ? oppTotal : myTotal} — ${iWin ? 'VICTOIRE' : 'défaite'}`);

    const hexId = pd.hexId;
    const hb = homeBaseHex((iWin ? opp : p).faction);
    const loser = iWin ? opp : p;
    const displaced = loser.workers.filter(w => w.hexId === hexId).length;
    if (loser.hero === hexId) loser.hero = hb.id;
    loser.mechs = loser.mechs.map(m => m.hexId === hexId ? { ...m, hexId: hb.id } : m);
    loser.workers = loser.workers.map(w => w.hexId === hexId ? { ...w, hexId: hb.id } : w);
    const winner = iWin ? p : opp;
    transferHexResources(loser, winner, hexId);
    if (iWin && iAmAttacker && displaced > 0) { p.pop = Math.max(0, p.pop - displaced); this.log('info', `🏃 ${displaced} ouvrier(s) renvoyé(s) (-${displaced} Pop)`); }
    if ((iWin ? oppTotal : myTotal) >= 1) { loser.combatCards++; reconcileHand(loser); }
    winner.combatWins = (winner.combatWins || 0) + 1;
    if (winner.combatWins <= 2) {
      winner.stars++; winner[`starCombat${winner.combatWins}`] = true;
      this.log('star', `⭐⚔ ${iWin ? 'Vous' : of.name}: étoile de combat ${winner.combatWins}/2 !`);
    }
    // l'attaquant perdant retraite (déjà fait si c'est moi via loser) ; si le
    // bot attaquant perd, retreatAll ci-dessus l'a renvoyé aussi.
    if (this.checkEnd()) return;

    const resume = pd.resume;
    if (pd.role === 'defense') {
      this.pending = null;
      if (!this.botsPlay(pd.botQueue)) this.finishRound();
      return;
    }
    return this.afterArrival({ type: 'none' }, null, resume);
  }

  // ═══ Tours des bots (avec défense interactive du siège API) ═══
  // Retourne true si une défense interactive est en attente (tour suspendu).
  botsPlay(queue) {
    let order = queue || this.players.slice(1).map((_, i) => i + 1);
    while (order.length > 0) {
      const cp = order[0];
      const paused = this.botOneTurn(cp, order.slice(1));
      if (paused) return true;
      order = order.slice(1);
      if (this.ended) return false;
    }
    return false;
  }

  botOneTurn(cp, remainingQueue) {
    const players = this.players;
    const enemyHexes = new Set();
    players.forEach((op, oi) => { if (oi === cp) return; enemyHexes.add(op.hero); op.mechs.forEach(m => enemyHexes.add(m.hexId)); op.workers.forEach(w => enemyHexes.add(w.hexId)); });
    const attackable = new Map(); const hexLoot = new Map(); const hexWorkers = new Map(); const hexThreat = new Map();
    const standings = players.map((op, oi) => oi === cp ? -1 : playerStanding(op));
    const leaderIdx = standings.indexOf(Math.max(...standings));
    players.forEach((op, oi) => {
      if (oi === cp) return;
      const eff = (hid) => { const units = (op.hero === hid ? 1 : 0) + op.mechs.filter(m => m.hexId === hid).length; return Math.min(op.power, 7) + Math.min(op.combatCards || 0, units + 1) * 2; };
      attackable.set(op.hero, Math.max(attackable.get(op.hero) || 0, eff(op.hero)));
      op.mechs.forEach(m => attackable.set(m.hexId, Math.max(attackable.get(m.hexId) || 0, eff(m.hexId))));
      op.workers.forEach(w => hexWorkers.set(w.hexId, (hexWorkers.get(w.hexId) || 0) + 1));
      Object.entries(op.resources || {}).forEach(([hid, r]) => { const t = Object.values(r).reduce((x, y) => x + y, 0); if (t > 0) hexLoot.set(parseInt(hid), (hexLoot.get(parseInt(hid)) || 0) + t); });
      const th = Math.min(6, (MAP_META_THREAT[op.faction] || 0) + (oi === leaderIdx ? 3 : 0));
      if (th > 0) [op.hero, ...op.mechs.map(m => m.hexId), ...op.workers.map(w => w.hexId)].forEach(hid => hexThreat.set(hid, Math.max(hexThreat.get(hid) || 0, th)));
    });
    const result = botTurn(players[cp], this.empire, enemyHexes, this.rails, {
      attackable, hexLoot, hexThreat, hexWorkers, forbidden: new Set(), encounterHexes: this.encounterTokens,
      endgame: players.some((op, oi) => oi !== cp && (op.stars || 0) >= 5),
      bestOppScore: Math.max(...players.filter((_, oi) => oi !== cp).map(op => estimateScore(op, { structureBonus: this.structureBonus, allPlayers: players }))),
      allPlayers: players, structureBonus: this.structureBonus, teslaAvailable: this.teslaOffer.length > 0, round: this.turn,
    });
    players[cp] = result.player;
    result.logs.forEach(l => this.log('bot', l));
    const p = players[cp];

    // déplacement d'ouvriers adverses (dont les MIENS) + pièges
    const botHexes = new Set([p.hero, ...p.mechs.map(m => m.hexId)]);
    for (let oi = 0; oi < players.length; oi++) {
      if (oi === cp) continue;
      const defended = (hid) => players[oi].hero === hid || players[oi].mechs.some(m => m.hexId === hid);
      const displaced = players[oi].workers.filter(w => botHexes.has(w.hexId) && !defended(w.hexId));
      if (displaced.length > 0) {
        const hb = homeBaseHex(players[oi].faction);
        const dispHexes = [...new Set(displaced.map(w => w.hexId))];
        players[oi] = { ...players[oi], workers: players[oi].workers.map(w => botHexes.has(w.hexId) && !defended(w.hexId) ? { ...w, hexId: hb.id } : w), resources: deepResources(players[oi]) };
        players[cp] = { ...players[cp], pop: Math.max(0, players[cp].pop - displaced.length), scaredWorkers: (players[cp].scaredWorkers || 0) + displaced.length, resources: deepResources(players[cp]) };
        dispHexes.forEach(hid => transferHexResources(players[oi], players[cp], hid));
        this.log('info', `🏃 ${displaced.length} ouvrier(s) ${FACTIONS[players[oi].faction].name} renvoyé(s) ! (-${displaced.length} Pop ${FACTIONS[players[cp].faction].name})`);
        const serv = servitudeOnDisplace(players[cp], displaced[0].hexId);
        if (serv.captured) { players[cp] = serv.player; this.log('info', `⛓🤖 Servitude ! ${FACTIONS[players[cp].faction].name} capture un ouvrier`); }
      }
      (players[oi].trapTokens || []).forEach((t, ti) => {
        if (players[oi].faction !== 'frente' && oi !== 0) return;
        const trodden = new Set([...(result.trodden || []), ...botHexes]);
        if (!t.disarmed && trodden.has(t.hexId)) {
          const pen = Math.min(players[cp].power || 0, 3);
          players[cp] = { ...players[cp], power: Math.max(0, players[cp].power - pen), pop: Math.max(0, players[cp].pop - 2) };
          players[oi] = { ...players[oi], trapTokens: [...players[oi].trapTokens] };
          players[oi].trapTokens[ti] = { ...t, disarmed: true };
          this.log('combat', `💥 Trap sur #${t.hexId} ! ${FACTIONS[players[cp].faction].name} -${pen}⚡ -2♥`);
        }
      });
    }

    // PvP bot↔bot
    const pvp = applyBotPvpAfterMove(players, cp, (oi) => oi !== 0);
    for (let i = 0; i < pvp.players.length; i++) players[i] = pvp.players[i];
    pvp.logs.forEach(l => this.log('combat', l));

    // PvP bot → siège API : défense interactive
    const human = players[0];
    const botCombatHexes = new Set([players[cp].hero, ...players[cp].mechs.map(m => m.hexId)]);
    const clash = [human.hero, ...human.mechs.map(m => m.hexId)].find(h => botCombatHexes.has(h));
    if (clash !== undefined) {
      const atk = players[cp];
      const atkUnits = (atk.hero === clash ? 1 : 0) + atk.mechs.filter(m => m.hexId === clash).length;
      const cb = getCombatBonus(atk, clash, true, human.combatCards);
      const humanUnits = (human.hero === clash ? 1 : 0) + human.mechs.filter(m => m.hexId === clash).length;
      const humanVis = Math.min(human.power, 7) + Math.min(human.combatCards, humanUnits + 1) * 2;
      const botVis = Math.min(atk.power, 7) + cb.powerBonus + Math.min(atk.combatCards, atkUnits + cb.cardBonus) * 2;
      const endgame = players.some(pl => pl.stars >= 5);
      const feint = !endgame && botVis >= humanVis + 8 && Math.random() < 0.35;
      const botSpend = feint ? Math.min(1, atk.power) : Math.min(Math.floor(atk.power * 0.7) + 1, 7, atk.power);
      const botCards = feint ? 0 : Math.min(atk.combatCards, atkUnits + cb.cardBonus);
      const hcb = getCombatBonus(human, clash, false, atk.combatCards);
      this.pending = { kind: 'combat', role: 'defense', hexId: clash, oppIdx: cp,
        botSpend, botCards, botTotal: botSpend + cb.powerBonus + botCards * 2,
        maxPower: Math.min(7, human.power), maxCards: Math.max(0, Math.min(human.combatCards, humanUnits + hcb.cardBonus)),
        botQueue: remainingQueue, info: `⚔ ${FACTIONS[atk.faction].name} vous attaque sur #${clash} !` };
      this.log('combat', `⚔ ${FACTIONS[atk.faction].name} vous attaque sur #${clash} ! Défendez-vous.`);
      return true; // pause
    }

    // rencontre bot
    if (this.encounterTokens.has(players[cp].hero)) {
      this.encounterTokens.delete(players[cp].hero);
      if (this.encounterDeck.length === 0) this.encounterDeck = shuffleArray(ENCOUNTERS);
      const er = resolveBotEncounter(players[cp], this.encounterDeck, {
        allPlayers: players,
        bestOppScore: Math.max(...players.filter((_, oi) => oi !== cp).map(op => estimateScore(op, { structureBonus: this.structureBonus, allPlayers: players }))) });
      players[cp] = er.player;
      this.log('bot', er.log);
    }

    // Rouge River bot
    if (players[cp].hero === FACTORY_RR_HEX && !players[cp].visitedRR) {
      const hasFrag = (players[cp].fragments || 0) >= TESLA_FRAGMENTS_REQUIRED;
      const pool = [...this.factoryOffer, ...(hasFrag ? this.teslaOffer : [])];
      if (pool.length > 0) {
        const card = pool.find(c => c.deck === 'tesla') || pool[Math.floor(Math.random() * pool.length)];
        const bp = { ...players[cp] }; claimFactoryCard(bp, card); players[cp] = bp;
        if (card.deck === 'tesla') this.teslaOffer = this.teslaOffer.filter(c => c.id !== card.id);
        else this.factoryOffer = this.factoryOffer.filter(c => c.id !== card.id);
        this.log('rr', `⚙ ${FACTIONS[players[cp].faction].name} visite la Rouge River → « ${card.name} »`);
      } else players[cp] = { ...players[cp], visitedRR: true };
    }

    // enlist ongoing du bot
    if (result.bottomCol >= 0) {
      const er = applyEnlistOngoing(players, cp, result.bottomCol, FACTIONS);
      for (let i = 0; i < er.players.length; i++) players[i] = er.players[i];
      er.logs.forEach(l => this.log('enlist', l));
    }

    // rails posés par le bot
    if (players[cp]._pendingRails?.length) {
      players[cp]._pendingRails.forEach(([a, b]) => this.log('bot', `🤖🛤 Rail #${a}↔#${b}`));
      this.rails = [...this.rails, ...players[cp]._pendingRails];
      delete players[cp]._pendingRails;
    }

    this.checkEnd();
    if (!this.ended && this.turn >= this.maxRounds) this.finish('cap');
    return false;
  }
}
