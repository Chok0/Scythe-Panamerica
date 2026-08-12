// ── Atelier : forge, registre, persistance ────────────────────────────────
// Le générateur (data/matGen.js) est pur ; ce module lui donne une mémoire.
// Un plateau forgé doit survivre à un rechargement de page, sinon la partie
// autosauvegardée qui s'appuie dessus repart avec un `matId` orphelin — et
// c'est tout le moteur (coûts, piste de Produire, IA) qui lit `undefined`.
// Aucune dépendance React : App.jsx ne fait qu'appeler ces fonctions.
import { registerWorkshopMat, workshopMats } from '../data/mats.js';
import { forgeMat, inMatSpace, WORKSHOP_ID_BASE } from '../data/matGen.js';

export const WORKSHOP_KEY = 'pa-atelier';

const store = (given) => given || (typeof localStorage !== "undefined" ? localStorage : null);

/** Relecture TOLÉRANTE : le stockage est un fichier que l'utilisateur peut
 *  éditer, et une version antérieure du jeu a pu y écrire autre chose. Un
 *  plateau qui ne respecte pas la grammaire est ÉCARTÉ plutôt que chargé —
 *  un plateau hors invariants rendrait l'étoile des 6 Améliorations
 *  inatteignable sans que rien ne le signale. */
export const parseForgedMats = (raw) => {
  if (!Array.isArray(raw)) return [];
  return raw.filter(m => m && typeof m.name === "string" && m.name.length > 0
    && Number.isInteger(m.id) && m.id >= WORKSHOP_ID_BASE && inMatSpace(m))
    .map(m => ({ ...m, workshop: true }));
};

/** Charge les plateaux d'atelier ET les rend visibles du moteur. */
export const loadForgedMats = (storage) => {
  const s = store(storage);
  let raw = [];
  if (s) { try { raw = JSON.parse(s.getItem(WORKSHOP_KEY) || "[]"); } catch { raw = []; } }
  const mats = parseForgedMats(raw);
  mats.forEach(registerWorkshopMat);
  return mats;
};

export const saveForgedMats = (mats, storage) => {
  const s = store(storage);
  if (!s) return false;
  try { s.setItem(WORKSHOP_KEY, JSON.stringify(mats)); return true; }
  catch { return false; } // quota plein / stockage bloqué : la session continue en mémoire
};

/** Forge un plateau inédit, l'enregistre auprès du moteur et le persiste.
 *  Renvoie `{ mat, mats }` — le nouveau plateau et la liste complète — ou
 *  `null` si le tirage a échoué (espace épuisé, inatteignable en pratique). */
export const forgeAndKeep = (existing = [], rng = Math.random, storage) => {
  const mat = forgeMat(existing, rng);
  if (!mat) return null;
  registerWorkshopMat(mat);
  const mats = [...existing, mat];
  saveForgedMats(mats, storage);
  return { mat, mats };
};

/** Réinjecte les plateaux d'atelier embarqués dans une sauvegarde de partie :
 *  une partie exportée puis relue sur une autre machine y trouve le plateau
 *  sur lequel elle a été jouée. */
export const adoptSavedMats = (raw, existing = [], storage) => {
  const incoming = parseForgedMats(raw).filter(m => !existing.some(e => e.id === m.id));
  incoming.forEach(registerWorkshopMat);
  if (incoming.length === 0) return existing;
  const mats = [...existing, ...incoming];
  saveForgedMats(mats, storage);
  return mats;
};

/** Plateaux d'atelier référencés par une liste de joueurs — ce qu'une
 *  sauvegarde doit embarquer pour rester lisible ailleurs. */
export const matsUsedBy = (players = []) => {
  const ids = new Set(players.map(p => p?.matId));
  return workshopMats().filter(m => ids.has(m.id));
};
