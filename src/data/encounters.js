// ═══════════════════════════════════════════════════════════════════
// RENCONTRES — triptyque fidèle à Scythe (arbitrage risque/récompense)
// ═══════════════════════════════════════════════════════════════════
// Chaque carte suit la même gradation « légal → transactionnel → prédateur »,
// et surtout la même structure de COÛT, qui est le vrai moteur de décision :
//
//   • Option 1 (posture pacifique) — GRATUITE : +1 popularité + un petit gain
//     thématique (~2). C'est le SEUL endroit où l'on GAGNE de la popularité.
//   • Option 2 (transaction) — payée en ARGENT (−2 à −3 $) : gain moyen/structurant
//     (4 ressources, mecha, amélioration, cartes…). Jamais de popularité, ni gagnée
//     ni dépensée. C'est le SEUL endroit où l'on dépense de l'argent.
//   • Option 3 (coup de force) — payée en POPULARITÉ (−2 à −3) : gain le plus
//     structurant (mecha, amélioration, gros stock, ouvriers…). C'est le SEUL
//     endroit où l'on dépense de la popularité — la ressource la plus dure à
//     regagner en cours de partie, ce qui rend ce choix réellement tendu.
//
// Les `available` gardent les options payables (UI joueur ET tirage des bots).

const addRes = (p, res, n) => {
  const h = String(p.hero);
  if (!p.resources[h]) p.resources[h] = {};
  p.resources[h][res] = (p.resources[h][res] || 0) + n;
};
const addWorkers = (p, n) => {
  for (let i = 0; i < n && p.workers.length < 8; i++) p.workers.push({ id: `${p.faction}_w${p.workers.length}`, hexId: p.hero });
};
// Mecha gagné en rencontre : pose sur le hex du héros + étoile à 4 (comme un Deploy).
// L'ability est débloquée ensuite (picker joueur / auto côté bot).
const addMech = (p) => {
  if (p.mechs.length < 4) {
    p.mechs.push({ id: `${p.faction}_m${p.mechs.length}`, hexId: p.hero });
    if (p.mechs.length >= 4 && !p.starMechs) { p.stars++; p.starMechs = true; }
  }
};
const gainPop = (p, n) => { p.pop = Math.min(p.pop + n, 18); };
const gainPow = (p, n) => { p.power = Math.min(p.power + n, 16); };
const gainUpg = (p) => { p.upgrades = Math.min((p.upgrades || 0) + 1, 6); };

export const ENCOUNTERS = [
  { id: 1, name: "L'Épave Fumante", desc: "Un mecha gît au bord de la route, fumant encore.",
    choices: [
      { label: "Prévenir le hameau", icon: "♥", desc: "+1 pop, +2 métal", effect: p => { gainPop(p, 1); addRes(p, "metal", 2); } },
      { label: "Racheter la carcasse", icon: "💰", desc: "-2$, +4 métal", available: p => p.coins >= 2, effect: p => { p.coins -= 2; addRes(p, "metal", 4); } },
      { label: "Réanimer le mecha", icon: "⬡", desc: "-3 pop, +1 mecha", grantsMech: true, available: p => p.pop >= 3 && p.mechs.length < 4, effect: p => { p.pop = Math.max(0, p.pop - 3); addMech(p); } },
    ] },
  { id: 2, name: "Le Pont Coupé", desc: "Le pont est détruit. Des villageois tentent de traverser.",
    choices: [
      { label: "Aider à traverser", icon: "♥", desc: "+1 pop, +2 bois", effect: p => { gainPop(p, 1); addRes(p, "bois", 2); } },
      { label: "Reconstruire le pont", icon: "💰", desc: "-2$, +4 bois", available: p => p.coins >= 2, effect: p => { p.coins -= 2; addRes(p, "bois", 4); } },
      { label: "Réquisitionner les poutres", icon: "⬆", desc: "-2 pop, +1 amélioration", available: p => p.pop >= 2, effect: p => { p.pop = Math.max(0, p.pop - 2); gainUpg(p); } },
    ] },
  { id: 3, name: "La Mine Abandonnée", desc: "Une mine oubliée, pleine de ressources... ou de dangers.",
    choices: [
      { label: "Étayer la galerie", icon: "♥", desc: "+1 pop, +2 métal", effect: p => { gainPop(p, 1); addRes(p, "metal", 2); } },
      { label: "Exploiter la veine", icon: "💰", desc: "-2$, +4 métal", available: p => p.coins >= 2, effect: p => { p.coins -= 2; addRes(p, "metal", 4); } },
      { label: "Envoyer les hommes au fond", icon: "👷", desc: "-2 pop, +2 ouvriers", available: p => p.pop >= 2, effect: p => { p.pop = Math.max(0, p.pop - 2); addWorkers(p, 2); } },
    ] },
  { id: 4, name: "Le Convoi de Réfugiés", desc: "Des familles fuient la guerre. Elles demandent de l'aide.",
    choices: [
      { label: "Escorter les familles", icon: "♥", desc: "+1 pop, +1 ouvrier", effect: p => { gainPop(p, 1); addWorkers(p, 1); } },
      { label: "Financer leur exode", icon: "💰", desc: "-2$, +2 ouvriers", available: p => p.coins >= 2, effect: p => { p.coins -= 2; addWorkers(p, 2); } },
      { label: "Réquisitionner bras et vivres", icon: "👷", desc: "-2 pop, +2 ouvriers, +3 nourriture", available: p => p.pop >= 2, effect: p => { p.pop = Math.max(0, p.pop - 2); addWorkers(p, 2); addRes(p, "nourriture", 3); } },
    ] },
  { id: 5, name: "Le Prêcheur au Carrefour", desc: "Un prédicateur harangue une foule. Milice ou messie ?",
    choices: [
      { label: "Écouter le sermon", icon: "♥", desc: "+1 pop, +1 carte combat", effect: p => { gainPop(p, 1); p.combatCards += 1; } },
      { label: "Financer sa croisade", icon: "🃏", desc: "-2$, +3 cartes combat", available: p => p.coins >= 2, effect: p => { p.coins -= 2; p.combatCards += 3; } },
      { label: "Armer ses fidèles", icon: "⚡", desc: "-2 pop, +4 puissance, +1 carte", available: p => p.pop >= 2, effect: p => { p.pop = Math.max(0, p.pop - 2); gainPow(p, 4); p.combatCards += 1; } },
    ] },
  { id: 6, name: "Le Dépôt de Trains", desc: "Un dépôt ferroviaire rempli de technologie oubliée.",
    choices: [
      { label: "Inventorier le dépôt", icon: "♥", desc: "+1 pop, +2 métal", effect: p => { gainPop(p, 1); addRes(p, "metal", 2); } },
      { label: "Acheter la cargaison", icon: "🔬", desc: "-2$, +1 Fragment Tesla", available: p => p.coins >= 2, effect: p => { p.coins -= 2; p.fragments = (p.fragments || 0) + 1; } },
      { label: "Rafler la technologie", icon: "⬆", desc: "-2 pop, +1 amélioration", available: p => p.pop >= 2, effect: p => { p.pop = Math.max(0, p.pop - 2); gainUpg(p); } },
    ] },
  { id: 7, name: "La Fête du Village", desc: "Musique, danse, et moonshine. Le peuple fait la fête.",
    choices: [
      { label: "Se joindre aux danses", icon: "♥", desc: "+1 pop, +2$", effect: p => { gainPop(p, 1); p.coins += 2; } },
      { label: "Commander un banquet", icon: "💰", desc: "-2$, +1 ouvrier, +3 nourriture", available: p => p.coins >= 2, effect: p => { p.coins -= 2; addWorkers(p, 1); addRes(p, "nourriture", 3); } },
      { label: "Piller les réserves", icon: "🌽", desc: "-2 pop, +4 nourriture", available: p => p.pop >= 2, effect: p => { p.pop = Math.max(0, p.pop - 2); addRes(p, "nourriture", 4); } },
    ] },
  { id: 8, name: "Le Mécanicien Errant", desc: "Un génie mécanique cherche du travail. Ses mains tremblent.",
    choices: [
      { label: "L'écouter raconter", icon: "♥", desc: "+1 pop, +1 carte combat", effect: p => { gainPop(p, 1); p.combatCards += 1; } },
      { label: "L'embaucher", icon: "⬡", desc: "-3$, +1 mecha", grantsMech: true, available: p => p.coins >= 3 && p.mechs.length < 4, effect: p => { p.coins -= 3; addMech(p); } },
      { label: "Le forcer à bricoler", icon: "⬆", desc: "-2 pop, +1 amélioration", available: p => p.pop >= 2, effect: p => { p.pop = Math.max(0, p.pop - 2); gainUpg(p); } },
    ] },
  { id: 9, name: "Le Champ de Pétrole", desc: "Du pétrole jaillit du sol. Sacré pour les uns, fortune pour les autres.",
    choices: [
      { label: "Sécuriser le puits", icon: "♥", desc: "+1 pop, +2 pétrole", effect: p => { gainPop(p, 1); addRes(p, "petrole", 2); } },
      { label: "Exploiter le gisement", icon: "💰", desc: "-2$, +4 pétrole", available: p => p.coins >= 2, effect: p => { p.coins -= 2; addRes(p, "petrole", 4); } },
      { label: "Forer sans relâche", icon: "🛢", desc: "-2 pop, +5 pétrole", available: p => p.pop >= 2, effect: p => { p.pop = Math.max(0, p.pop - 2); addRes(p, "petrole", 5); } },
    ] },
  { id: 10, name: "Le Télégraphe Fantôme", desc: "Un appareil crépite des messages codés. Qui écoute ?",
    choices: [
      { label: "Relayer les messages", icon: "♥", desc: "+1 pop, +1 carte combat", effect: p => { gainPop(p, 1); p.combatCards += 1; } },
      { label: "Décrypter les codes", icon: "🃏", desc: "-2$, +3 cartes combat", available: p => p.coins >= 2, effect: p => { p.coins -= 2; p.combatCards += 3; } },
      { label: "Détourner le réseau", icon: "⚡", desc: "-2 pop, +4 puissance", available: p => p.pop >= 2, effect: p => { p.pop = Math.max(0, p.pop - 2); gainPow(p, 4); } },
    ] },
  { id: 11, name: "Le Cimetière de Mechas", desc: "Des dizaines de colosses rouillés. Mémoire ou ferraille ?",
    choices: [
      { label: "Rendre hommage", icon: "♥", desc: "+1 pop, +2 métal", effect: p => { gainPop(p, 1); addRes(p, "metal", 2); } },
      { label: "Démonter les carcasses", icon: "💰", desc: "-2$, +4 métal", available: p => p.coins >= 2, effect: p => { p.coins -= 2; addRes(p, "metal", 4); } },
      { label: "Reconstruire un colosse", icon: "⬡", desc: "-3 pop, +1 mecha", grantsMech: true, available: p => p.pop >= 3 && p.mechs.length < 4, effect: p => { p.pop = Math.max(0, p.pop - 3); addMech(p); } },
    ] },
  { id: 12, name: "La Contrebandière", desc: "Elle vend de tout. Armes, nourriture, secrets.",
    choices: [
      { label: "Marchander poliment", icon: "♥", desc: "+1 pop, +2$", effect: p => { gainPop(p, 1); p.coins += 2; } },
      { label: "Acheter son arsenal", icon: "⚡", desc: "-3$, +4 puissance, +1 carte", available: p => p.coins >= 3, effect: p => { p.coins -= 3; gainPow(p, 4); p.combatCards += 1; } },
      { label: "La dévaliser", icon: "⚙", desc: "-2 pop, +4 métal", available: p => p.pop >= 2, effect: p => { p.pop = Math.max(0, p.pop - 2); addRes(p, "metal", 4); } },
    ] },
  { id: 13, name: "Le Barrage", desc: "Un barrage hydroélectrique, intact mais sans opérateur.",
    choices: [
      { label: "Rétablir le courant", icon: "♥", desc: "+1 pop, +2 puissance", effect: p => { gainPop(p, 1); gainPow(p, 2); } },
      { label: "Moderniser la turbine", icon: "💰", desc: "-2$, +1 amélioration", available: p => p.coins >= 2, effect: p => { p.coins -= 2; gainUpg(p); } },
      { label: "Réquisitionner l'énergie", icon: "⚡", desc: "-2 pop, +4 puissance, +1 ouvrier", available: p => p.pop >= 2, effect: p => { p.pop = Math.max(0, p.pop - 2); gainPow(p, 4); addWorkers(p, 1); } },
    ] },
  { id: 14, name: "Les Enfants du Mecha", desc: "Des orphelins vivent dans la carcasse d'un mecha géant.",
    choices: [
      { label: "Les nourrir", icon: "♥", desc: "+1 pop, +2 nourriture", effect: p => { gainPop(p, 1); addRes(p, "nourriture", 2); } },
      { label: "Les prendre en charge", icon: "👷", desc: "-2$, +2 ouvriers", available: p => p.coins >= 2, effect: p => { p.coins -= 2; addWorkers(p, 2); } },
      { label: "Remettre le colosse en marche", icon: "⬡", desc: "-3 pop, +1 mecha", grantsMech: true, available: p => p.pop >= 3 && p.mechs.length < 4, effect: p => { p.pop = Math.max(0, p.pop - 3); addMech(p); } },
    ] },
  { id: 15, name: "Le Dernier Gouverneur", desc: "Il offre sa reddition. Que faites-vous de son pouvoir ?",
    choices: [
      { label: "Accepter sa reddition", icon: "♥", desc: "+1 pop, +2$", effect: p => { gainPop(p, 1); p.coins += 2; } },
      { label: "Acheter sa milice", icon: "⚡", desc: "-3$, +4 puissance, +1 carte", available: p => p.coins >= 3, effect: p => { p.coins -= 3; gainPow(p, 4); p.combatCards += 1; } },
      { label: "Saisir son arsenal", icon: "⬆", desc: "-2 pop, +1 amélioration", available: p => p.pop >= 2, effect: p => { p.pop = Math.max(0, p.pop - 2); gainUpg(p); } },
    ] },
];

export const ENCOUNTER_HEXES = [2, 4, 14, 16, 20, 27, 29, 35, 41];
