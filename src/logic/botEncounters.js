// Rencontres pour les bots — règles officielles (p.24) :
// seuls les personnages déclenchent les rencontres ; le jeton est défaussé ;
// les gains apparaissent sur le hex de la rencontre (les effets utilisent p.hero) ;
// la rencontre se résout après les combats du tour.
import { ENCOUNTERS } from '../data/encounters.js';
import { FACTIONS } from '../data/factions.js';
import { BUILDING_TYPES, ENLIST_IMMEDIATE, matById, maxBottomCubes } from '../data/mats.js';
import { BOT_PROFILES } from './botProfiles.js';

/**
 * Résout une rencontre pour un bot dont le héros est sur un jeton.
 * Choix aléatoire parmi les options payables — mais la popularité est
 * protégée : le corpus déconseille de dépenser de la pop en rencontre
 * (« don't spend popularity in encounters »), une option -2/-3 pop n'est
 * retenue que si elle laisse le bot au-dessus du palier visé par son profil.
 * @returns {{player, log}}
 */
export const resolveBotEncounter = (player, deck) => {
  const card = deck && deck.length > 0
    ? deck.shift()
    : ENCOUNTERS[Math.floor(Math.random() * ENCOUNTERS.length)];
  // Coût obligatoire (règle p.24) : seules les options payables sont éligibles
  const eligible = card.choices.filter(c => !c.available || c.available(player));
  const popFloor = Math.min(7, (BOT_PROFILES[player.botProfile] || BOT_PROFILES.equilibre).popTarget);
  const popCostOf = (c) => { const m = (c.desc || "").match(/-(\d+) pop/); return m ? parseInt(m[1]) : 0; };
  const popSafe = eligible.filter(c => (player.pop || 0) - popCostOf(c) >= popFloor);
  const pool = popSafe.length > 0 ? popSafe
    : eligible.length > 0 ? eligible
    : card.choices.filter(c => !c.available);
  const choice = pool[Math.floor(Math.random() * pool.length)] || card.choices[0];
  const p = {
    ...player,
    workers: [...player.workers],
    mechs: [...player.mechs],
    resources: {},
    unlockedAbilities: [...(player.unlockedAbilities || [])],
  };
  Object.entries(player.resources).forEach(([k, v]) => { p.resources[k] = { ...v }; });
  const mechsBefore = p.mechs.length;
  choice.effect(p);
  p.encounters = (p.encounters || 0) + 1;
  // Un mecha gagné en rencontre débloque la prochaine ability (comme un Deploy)
  if (p.mechs.length > mechsBefore) {
    p.unlockedAbilities = [...p.unlockedAbilities, Math.min(mechsBefore, 3)];
  }
  // Amélioration gagnée en rencontre : VRAI déplacement de cube (haut→bas au
  // hasard parmi les emplacements valides), pas un simple compteur
  if (choice.grantsUpgrade && (p.upgrades || 0) < 6) {
    const mat = matById(p.matId);
    const validTop = []; const validBottom = [];
    if (mat) {
      (p.cubesOnTop || []).forEach((c, i) => { if (c > 0) validTop.push(i); });
      (mat.bottomSlots || []).forEach((s, i) => { if ((p.cubesOnBottom || [])[i] < maxBottomCubes(mat, i)) validBottom.push(i); });
    }
    if (validTop.length && validBottom.length) {
      const fromC = validTop[Math.floor(Math.random() * validTop.length)];
      const toC = validBottom[Math.floor(Math.random() * validBottom.length)];
      p.cubesOnTop = [...(p.cubesOnTop || [])]; p.cubesOnTop[fromC]--;
      p.cubesOnBottom = [...(p.cubesOnBottom || [])]; p.cubesOnBottom[toC]++;
      p.upgrades = (p.upgrades || 0) + 1;
      if (p.upgrades >= 6 && !p.starUpgrades) { p.stars++; p.starUpgrades = true; }
    }
  }
  // Bâtiment gratuit (option structurante) — posé sur le hex du héros. On évite
  // la Gare (elle impliquerait la pose de rails, hors flux rencontre).
  if (choice.grantsBuilding) {
    const types = BUILDING_TYPES.filter(bt => bt.type !== "gare" && !(p.buildings || []).some(b => b.type === bt.type));
    if (types.length && (p.buildings || []).length < 4 && !(p.buildings || []).some(b => b.hexId === p.hero)) {
      const bt = types[Math.floor(Math.random() * types.length)];
      p.buildings = [...(p.buildings || []), { type: bt.type, hexId: p.hero }];
      if (p.buildings.length >= 4 && !p.starBuildings) { p.stars++; p.starBuildings = true; }
    }
  }
  // Ressources AU CHOIX (cartes du deck original) : tirées au hasard, posées
  // sur le hex de la rencontre (même règle que les autres gains)
  if (choice.grantsResources > 0) {
    const types = ["metal", "bois", "nourriture", "petrole"];
    const key = String(p.hero);
    p.resources[key] = { ...(p.resources[key] || {}) };
    for (let i = 0; i < choice.grantsResources; i++) {
      const rt = types[Math.floor(Math.random() * types.length)];
      p.resources[key][rt] = (p.resources[key][rt] || 0) + 1;
    }
  }
  // Recrue gratuite — colonne + recrue permanente tirées au hasard parmi les libres
  if (choice.grantsRecruit && (p.recruits || 0) < 4) {
    const enlistMap = [...(p.enlistMap || [null, null, null, null])];
    const usedRecruits = new Set(enlistMap.filter(x => x != null));
    const freeCols = [0, 1, 2, 3].filter(c => enlistMap[c] == null);
    const freeRecruits = [0, 1, 2, 3].filter(r => !usedRecruits.has(r));
    if (freeCols.length && freeRecruits.length) {
      const col = freeCols[Math.floor(Math.random() * freeCols.length)];
      enlistMap[col] = freeRecruits[Math.floor(Math.random() * freeRecruits.length)];
      p.enlistMap = enlistMap;
      p.recruits = (p.recruits || 0) + 1;
      ENLIST_IMMEDIATE[col].apply(p);
      if (p.recruits >= 4 && !p.starRecruits) { p.stars++; p.starRecruits = true; }
    }
  }
  return { player: p, log: `🤖📜 ${FACTIONS[p.faction].name}: "${card.name}" → ${choice.label}` };
};
