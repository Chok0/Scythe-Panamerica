// Rencontres pour les bots — règles officielles (p.24) :
// seuls les personnages déclenchent les rencontres ; le jeton est défaussé ;
// les gains apparaissent sur le hex de la rencontre (les effets utilisent p.hero) ;
// la rencontre se résout après les combats du tour.
import { ENCOUNTERS } from '../data/encounters.js';
import { FACTIONS } from '../data/factions.js';

/**
 * Résout une rencontre pour un bot dont le héros est sur un jeton.
 * Choix aléatoire parmi les 3 options (les coûts sont gérés par les effets).
 * @returns {{player, log}}
 */
export const resolveBotEncounter = (player) => {
  const card = ENCOUNTERS[Math.floor(Math.random() * ENCOUNTERS.length)];
  const choice = card.choices[Math.floor(Math.random() * card.choices.length)];
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
  return { player: p, log: `🤖📜 ${FACTIONS[p.faction].name}: "${card.name}" → ${choice.label}` };
};
