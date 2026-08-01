// ── Moteur de campagne (pur, testable) ────────────────────────────────────
// Progression, déblocages et variantes de partie. Aucune dépendance React :
// App.jsx ne fait qu'appeler ces fonctions et stocker le résultat.
//
// Deux règles du document de campagne (docs/campagne.md) sont implémentées
// ici, et nulle part ailleurs :
//  · ordre STRICTEMENT causal — le chapitre N ne s'ouvre qu'une fois le
//    chapitre N-1 terminé ;
//  · DEUX voies de victoire par chapitre — la condition canon du scénario,
//    ou les 6 étoiles classiques ; la première atteinte l'emporte.
import { CHAPTERS, chapterById, heldHexes, FACTORY_HEX } from '../data/campaign.js';
import { LEGACIES } from '../data/legacies.js';
import { STRUCTURE_BONUSES } from '../data/structureBonus.js';
import { hMap, ADJ } from '../data/hexes.js';
import { ENCOUNTERS, RAIL_ENCOUNTERS, hasTeslaFragment } from '../data/encounters.js';

export const CAMPAIGN_KEY = 'pa-campagne';

// ── Progression ───────────────────────────────────────────────────────────
// { v, done: { ch1: {victory:"canon"|"stars"|"lu", canonMet, date} }, legacies: [id] }
export const emptyProgress = () => ({ v: 1, done: {}, legacies: [] });

/** Tolérante à une sauvegarde partielle ou d'une version antérieure. */
export const normalizeProgress = (raw) => {
  const p = emptyProgress();
  if (!raw || typeof raw !== "object") return p;
  const done = raw.done && typeof raw.done === "object" ? raw.done : {};
  Object.entries(done).forEach(([id, entry]) => {
    if (!chapterById(id) || !entry) return;
    p.done[id] = {
      victory: entry.victory || "lu",
      canonMet: !!entry.canonMet,
      date: entry.date || null,
    };
  });
  p.legacies = (Array.isArray(raw.legacies) ? raw.legacies : []).filter(id => LEGACIES[id]);
  return p;
};

export const loadProgress = (storage) => {
  const store = storage || (typeof localStorage !== "undefined" ? localStorage : null);
  if (!store) return emptyProgress();
  try { return normalizeProgress(JSON.parse(store.getItem(CAMPAIGN_KEY) || "null")); }
  catch { return emptyProgress(); }
};

export const saveProgress = (progress, storage) => {
  const store = storage || (typeof localStorage !== "undefined" ? localStorage : null);
  if (!store) return false;
  try { store.setItem(CAMPAIGN_KEY, JSON.stringify(progress)); return true; }
  catch { return false; }
};

export const resetProgress = (storage) => {
  const store = storage || (typeof localStorage !== "undefined" ? localStorage : null);
  try { store?.removeItem(CAMPAIGN_KEY); } catch { /* stockage indisponible */ }
  return emptyProgress();
};

// ── Ordre causal ──────────────────────────────────────────────────────────
export const isChapterDone = (progress, id) => !!progress?.done?.[id];

/** Le chapitre 1 est toujours ouvert ; les suivants exigent le précédent. */
export const isChapterUnlocked = (progress, id) => {
  const idx = CHAPTERS.findIndex(c => c.id === id);
  if (idx < 0) return false;
  if (idx === 0) return true;
  return isChapterDone(progress, CHAPTERS[idx - 1].id);
};

/** État complet pour l'écran de campagne (une entrée par chapitre). */
export const chapterStates = (progress) => CHAPTERS.map(c => ({
  chapter: c,
  unlocked: isChapterUnlocked(progress, c.id),
  done: isChapterDone(progress, c.id),
  result: progress?.done?.[c.id] || null,
}));

/** Prochain chapitre à jouer : le premier ouvert et non terminé. */
export const nextChapter = (progress) =>
  CHAPTERS.find(c => isChapterUnlocked(progress, c.id) && !isChapterDone(progress, c.id)) || null;

export const campaignComplete = (progress) => CHAPTERS.every(c => isChapterDone(progress, c.id));

// ── Condition canon ───────────────────────────────────────────────────────
/** Le joueur remplit-il la condition canon du chapitre ?
 *  Un chapitre sans condition (interlude) renvoie toujours false : sa seule
 *  voie mécanique reste les 6 étoiles. */
export const canonMet = (chapter, player, ctx) => {
  if (!chapter?.canon || !player) return false;
  try { return !!chapter.canon.check(player, ctx || {}); }
  catch { return false; }
};

// ── Fin de chapitre ───────────────────────────────────────────────────────
/** Enregistre un chapitre terminé et débloque son legs.
 *  `victory` : "canon" (condition du scénario) · "stars" (6 étoiles atteintes
 *  par le joueur) · "lu" (interlude lu).
 *  Le legs n'est débloqué que si la condition canon a été REMPLIE — gagner
 *  aux étoiles termine le chapitre mais ne donne pas la récompense de Tesla.
 *  Renvoie `{ progress, legacy }` (legacy = objet legs neuf, ou null). */
export const completeChapter = (progress, chapterId, { victory = "canon", canonMet: met = victory === "canon", date = null } = {}) => {
  const chapter = chapterById(chapterId);
  const base = normalizeProgress(progress);
  if (!chapter) return { progress: base, legacy: null };
  const next = {
    ...base,
    done: { ...base.done, [chapterId]: { victory, canonMet: !!met, date } },
    legacies: [...base.legacies],
  };
  let legacy = null;
  if (met && chapter.unlock && LEGACIES[chapter.unlock] && !next.legacies.includes(chapter.unlock)) {
    next.legacies.push(chapter.unlock);
    legacy = LEGACIES[chapter.unlock];
  }
  return { progress: next, legacy };
};

export const unlockedLegacies = (progress) =>
  (progress?.legacies || []).map(id => LEGACIES[id]).filter(Boolean);

// ── Configuration de partie d'un chapitre ─────────────────────────────────
/** Traduit les variantes du chapitre en réglages de partie pour App.jsx. */
export const campaignConfig = (chapter) => {
  const v = chapter?.variant || {};
  return {
    faction: chapter?.faction || null,
    empireEnabled: !!v.empire,
    steel: !!v.steel,
    // Tuile bonus FORCÉE (Ruée vers l'or au chapitre 3) — null = tirage normal
    bonusTile: v.bonusTile ? (STRUCTURE_BONUSES.find(b => b.id === v.bonusTile) || null) : null,
    // « Le rail avance » (chapitre 1) : croissance automatique du réseau
    // impérial + patrouilles capables de l'emprunter (voir §3 plus bas).
    railGrowth: !!v.railGrowth,
  };
};

// ── Verrou du contenu Tesla (docs/campagne.md §4) ─────────────────────────
// « Les plans T sont les originaux volés à Wardenclyffe, enfermés dans le
// coffre de Ford — qui ne les comprend pas. Le monde ne voit que ce que Ford
// en a tiré. » Actif UNIQUEMENT en mode campagne (un chapitre non nul) — les
// parties libres gardent tout le contenu, comme avant.
// Cran 1 (chapitre 3, condition canon) : les cartes rencontre à fragments
// rejoignent le deck — premier contact avec les reliques de Wardenclyffe.
export const teslaEncountersUnlocked = (progress) => !!progress?.done?.ch3?.canonMet;
// Cran 2 (chapitre 4, condition canon — prise de Rouge River) : le coffre
// s'ouvre, les plans T1-T5 rejoignent l'offre de l'Usine.
export const teslaPlansUnlocked = (progress) => !!progress?.done?.ch4?.canonMet;

/** Deck de rencontres réellement en jeu.
 *  `chapter` null → partie LIBRE : contenu complet et inchangé, le verrou
 *  n'existe qu'en campagne. En campagne : cartes à fragment Tesla retirées
 *  tant que le cran du chapitre 3 n'est pas atteint, cartes « Chantier
 *  ferroviaire » ajoutées une fois débloquées — mais jamais dans le chapitre
 *  qui les débloque lui-même (elles rejoignent « les chapitres SUIVANTS » :
 *  au chapitre 1, le rail reste l'arme de l'Empire). */
export const campaignEncounterPool = (chapter, progress) => {
  if (!chapter) return ENCOUNTERS;
  const base = teslaEncountersUnlocked(progress)
    ? ENCOUNTERS
    : ENCOUNTERS.filter(c => !hasTeslaFragment(c));
  const railUnlocked = (progress?.legacies || []).includes("railCards")
    && LEGACIES.railCards.chapter !== chapter.id;
  return railUnlocked ? [...base, ...RAIL_ENCOUNTERS] : base;
};

// ── « Le rail avance » (chapitre 1) ────────────────────────────────────────
// Croissance automatique du réseau ferroviaire impérial : 1 segment par tour
// de table, jusqu'à ce que l'Usine (hex 22) et tous les villages appartiennent
// à la même composante connexe. Aucune traversée de lac/marécage/base — mêmes
// interdits que la pose de rail joueur (R4-R6, TODO_proto_fixes.md).
const legalRailHex = (id) => {
  const h = hMap[id];
  return !!h && h.t !== "lac" && h.t !== "marecage" && !h.base;
};

// Villages de la carte COURANTE — bindings vivants de hexes.js, compatibles
// carte v2/v3/procédurale (même convention que structureBonus.js).
const villageHexes = () => Object.values(hMap).filter(h => h.t === "village").map(h => h.id);

/** Composante connexe (BFS sur `rails`) contenant `hex` — contient toujours
 *  au moins `hex` lui-même, même sans la moindre arête (hex isolé). */
const railComponentOf = (hex, rails) => {
  const visited = new Set([hex]);
  const queue = [hex];
  while (queue.length > 0) {
    const cur = queue.shift();
    (rails || []).forEach(([a, b]) => {
      const nxt = a === cur ? b : b === cur ? a : null;
      if (nxt != null && !visited.has(nxt)) { visited.add(nxt); queue.push(nxt); }
    });
  }
  return visited;
};

/** BFS multi-source sur l'ADJACENCE DU PLATEAU (pas le réseau existant) :
 *  cherche le chemin le plus court de `sources` vers `targets`, hors
 *  lac/marécage/base. Renvoie SEULEMENT le premier pas hors du réseau
 *  actuel — [hexDuRéseau, prochainHex] — puisqu'un seul segment se pose par
 *  tour ; les tours suivants prolongent depuis ce nouveau point. `null` si
 *  aucun chemin légal n'existe. */
const nearestHop = (sources, targets) => {
  const targetSet = new Set(targets);
  if (targetSet.size === 0) return null;
  const visited = new Set(sources);
  const cameFrom = new Map();
  let queue = [...sources];
  while (queue.length > 0) {
    const next = [];
    for (const cur of queue) {
      if (targetSet.has(cur) && cameFrom.has(cur)) {
        let hop = cur, prev = cameFrom.get(cur);
        while (cameFrom.has(prev)) { hop = prev; prev = cameFrom.get(prev); }
        return [prev, hop];
      }
      (ADJ[cur] || []).forEach(nb => {
        if (visited.has(nb) || !legalRailHex(nb)) return;
        visited.add(nb); cameFrom.set(nb, cur); next.push(nb);
      });
    }
    queue = next;
  }
  return null;
};

/** L'Usine et tous les villages partagent-ils la même composante connexe ? */
export const empireRailDone = (rails, factoryHex = FACTORY_HEX) => {
  const net = railComponentOf(factoryHex, rails || []);
  return villageHexes().every(id => net.has(id));
};

/** Pose 1 segment de rail impérial par appel (1 par tour de table).
 *  Ciblage (docs/campagne.md §3.1) : plus court chemin vers le prochain
 *  village qui ne touche encore AUCUN rail ; une fois tous les villages
 *  touchés, plus court chemin pour FUSIONNER la composante de l'Usine avec
 *  les autres. S'arrête (sans modifier `rails`) si aucune extension légale
 *  n'existe, ou si l'objectif est déjà atteint.
 *  Pur : renvoie `{ rails, segment, done }` — `rails` est la MÊME référence
 *  si rien n'a changé. */
export const growEmpireRail = (rails, factoryHex = FACTORY_HEX) => {
  const cur = rails || [];
  if (empireRailDone(cur, factoryHex)) return { rails: cur, segment: null, done: true };
  const allRailHexes = new Set(cur.flat());
  const untouched = villageHexes().filter(id => !allRailHexes.has(id));
  let hop = untouched.length > 0
    ? nearestHop(allRailHexes.size > 0 ? [...allRailHexes] : [factoryHex], untouched)
    : null;
  if (!hop) {
    // Tous les villages touchent un rail : reste à fusionner les composantes
    // (l'Usine elle-même, si encore isolée, est le premier maillon à joindre).
    const factoryNet = railComponentOf(factoryHex, cur);
    const outside = [...allRailHexes].filter(id => !factoryNet.has(id));
    if (outside.length > 0) hop = nearestHop([...factoryNet], outside);
  }
  if (!hop) return { rails: cur, segment: null, done: false };
  const nextRails = [...cur, hop];
  return { rails: nextRails, segment: hop, done: empireRailDone(nextRails, factoryHex) };
};

// ── Acier Brut (variante Rouge River) ─────────────────────────────────────
// « À chaque tour, Rouge River génère 1 Acier Brut, récupéré par le joueur
// qui la contrôle ; si personne ne la contrôle, l'Acier s'accumule. »
// La pile revient donc ENTIÈRE au premier arrivé — récompense croissante.
// Contestée (plusieurs joueurs sur l'hex), la pile ne part pas : personne ne
// ramasse tant que le contrôle n'est pas net.
export const STEEL_HEX = FACTORY_HEX;

/** Tour d'Acier Brut. Pur : renvoie une NOUVELLE liste de joueurs.
 *  `{ pile, players, collectorIdx, collected }`. */
export const steelTick = (pile, players) => {
  const grown = (pile || 0) + 1;
  const holders = (players || []).map((p, i) => (p && heldHexes(p).has(STEEL_HEX) ? i : -1)).filter(i => i >= 0);
  if (holders.length !== 1) return { pile: grown, players, collectorIdx: null, collected: 0 };
  const idx = holders[0];
  const p = players[idx];
  const resources = { ...(p.resources || {}) };
  const onHex = { ...(resources[STEEL_HEX] || {}) };
  onHex.metal = (onHex.metal || 0) + grown;
  resources[STEEL_HEX] = onHex;
  const next = [...players];
  next[idx] = { ...p, resources };
  return { pile: 0, players: next, collectorIdx: idx, collected: grown };
};
