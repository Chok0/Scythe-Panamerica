// ── Contrôle territorial — POINT DE VÉRITÉ UNIQUE ────────────────────────
// Extrait de campaign.js (03/08) pour casser un cycle d'import : factions.js
// en a besoin pour l'objectif de l'Internationale Noire, or campaign.js
// importe factions.js. Ce module ne dépend que de la carte.
//
// Règle Scythe : on tient un hex si on y a une unité, OU une structure / un
// piège armé qu'aucune unité ennemie n'occupe.
//
// `ctx.players` (tous les joueurs) et `ctx.empire` ({id: hexId}) sont
// facultatifs : sans eux, structures et pièges comptent sans contestation
// possible — la contestation exige de connaître les autres.
// Les Comptoirs (Acadiane) restent HORS de ce décompte : ce sont des jetons
// de score (+1 territoire, +2$) et non des marqueurs de contrôle.
import { hMap } from './hexes.js';

export const heldHexes = (p, ctx) => {
  const held = new Set();
  // L'Internationale Noire n'a pas de héros : `p.hero` vaut null, il ne doit
  // pas entrer dans l'ensemble (un `null` tenu fausserait tous les décomptes).
  if (p.hero != null) held.add(p.hero);
  (p.workers || []).forEach(w => held.add(w.hexId));
  (p.mechs || []).forEach(m => held.add(m.hexId));
  const enemyUnits = new Set();
  (ctx?.players || []).forEach(op => {
    if (!op || op === p) return;
    if (op.hero != null) enemyUnits.add(op.hero);
    (op.mechs || []).forEach(m => enemyUnits.add(m.hexId));
    (op.workers || []).forEach(w => enemyUnits.add(w.hexId));
  });
  // Les patrouilles impériales contestent comme n'importe quelle unité
  // adverse (constaté le 03/08 : l'Empire était invisible au décompte).
  Object.values(ctx?.empire || {}).forEach(hid => enemyUnits.add(hid));
  const claim = (hid) => { if (hid != null && !enemyUnits.has(hid)) held.add(hid); };
  (p.buildings || []).forEach(b => claim(b.hexId));
  (p.trapTokens || []).forEach(t => { if (!t.disarmed) claim(t.hexId); });
  return held;
};

/** Villages tenus — sert aux objectifs de faction et aux conditions canon. */
export const villagesHeldBy = (p, ctx) =>
  [...heldHexes(p, ctx)].filter(id => hMap[id]?.t === "village").length;
