import { countRes, spendRes } from '../logic/resources.js';

export const ENCOUNTERS = [
  { id: 1, name: "L'Épave Fumante", desc: "Un mecha gît au bord de la route, fumant encore.",
    choices: [
      { label: "Démanteler", icon: "⚙", desc: "+2 métal", effect: p => { const h = String(p.hero); if (!p.resources[h]) p.resources[h] = {}; p.resources[h].metal = (p.resources[h].metal || 0) + 2; } },
      { label: "Signaler", icon: "♥", desc: "+2 pop", effect: p => { p.pop = Math.min(p.pop + 2, 18); } },
      { label: "Piéger", icon: "⚡", desc: "+2 puissance", effect: p => { p.power = Math.min(p.power + 2, 16); } },
    ] },
  { id: 2, name: "Le Pont Coupé", desc: "Le pont est détruit. Des villageois tentent de traverser.",
    choices: [
      { label: "Reconstruire", icon: "♥", desc: "-1 bois, +3 pop", effect: p => { if (countRes(p, "bois") >= 1) { const sp = spendRes(p, "bois", 1); p.resources = sp.resources; } p.pop = Math.min(p.pop + 3, 18); } },
      { label: "Taxer", icon: "💰", desc: "+3$", effect: p => { p.coins += 3; } },
      { label: "Contourner", icon: "🃏", desc: "+2 cartes combat", effect: p => { p.combatCards += 2; } },
    ] },
  { id: 3, name: "La Mine Abandonnée", desc: "Une mine oubliée, pleine de ressources... ou de dangers.",
    choices: [
      { label: "Explorer", icon: "⚙", desc: "+3 métal", effect: p => { const h = String(p.hero); if (!p.resources[h]) p.resources[h] = {}; p.resources[h].metal = (p.resources[h].metal || 0) + 3; } },
      { label: "Embaucher", icon: "👷", desc: "+1 ouvrier ici", effect: p => { if (p.workers.length < 8) p.workers.push({ id: `${p.faction}_w${p.workers.length}`, hexId: p.hero }); } },
      { label: "Dynamiter", icon: "⚡", desc: "+3 puissance", effect: p => { p.power = Math.min(p.power + 3, 16); } },
    ] },
  { id: 4, name: "Le Convoi de Réfugiés", desc: "Des familles fuient la guerre. Elles demandent de l'aide.",
    choices: [
      { label: "Accueillir", icon: "♥", desc: "+3 pop, +1 ouvrier", effect: p => { p.pop = Math.min(p.pop + 3, 18); if (p.workers.length < 8) p.workers.push({ id: `${p.faction}_w${p.workers.length}`, hexId: p.hero }); } },
      { label: "Recruter", icon: "🃏", desc: "+1 carte, +1 puissance", effect: p => { p.combatCards++; p.power = Math.min(p.power + 1, 16); } },
      { label: "Ignorer", icon: "💰", desc: "+2$", effect: p => { p.coins += 2; } },
    ] },
  { id: 5, name: "Le Prêcheur au Carrefour", desc: "Un prédicateur harangue une foule. Milice ou messie ?",
    choices: [
      { label: "Écouter", icon: "♥", desc: "+2 pop", effect: p => { p.pop = Math.min(p.pop + 2, 18); } },
      { label: "Disperser", icon: "⚡", desc: "+2 puissance", effect: p => { p.power = Math.min(p.power + 2, 16); } },
      { label: "Négocier", icon: "💰", desc: "+2$, +1 carte", effect: p => { p.coins += 2; p.combatCards++; } },
    ] },
  { id: 6, name: "Le Dépôt de Trains", desc: "Un dépôt ferroviaire rempli de technologie oubliée.",
    choices: [
      { label: "Fouiller", icon: "🔬", desc: "+1 Fragment Tesla !", effect: p => { p.fragments = (p.fragments || 0) + 1; } },
      { label: "Récupérer", icon: "⚙", desc: "+2 métal, +1 pétrole", effect: p => { const h = String(p.hero); if (!p.resources[h]) p.resources[h] = {}; p.resources[h].metal = (p.resources[h].metal || 0) + 2; p.resources[h].petrole = (p.resources[h].petrole || 0) + 1; } },
      { label: "Saboter", icon: "⚡", desc: "+3 puissance", effect: p => { p.power = Math.min(p.power + 3, 16); } },
    ] },
  { id: 7, name: "La Fête du Village", desc: "Musique, danse, et moonshine. Le peuple fait la fête.",
    choices: [
      { label: "Participer", icon: "♥", desc: "+3 pop", effect: p => { p.pop = Math.min(p.pop + 3, 18); } },
      { label: "Commercer", icon: "💰", desc: "+3$", effect: p => { p.coins += 3; } },
      { label: "Recruter", icon: "👷", desc: "+1 ouvrier", effect: p => { if (p.workers.length < 8) p.workers.push({ id: `${p.faction}_w${p.workers.length}`, hexId: p.hero }); } },
    ] },
  { id: 8, name: "Le Mécanicien Errant", desc: "Un génie mécanique cherche du travail. Ses mains tremblent.",
    choices: [
      { label: "Embaucher", icon: "⬆", desc: "+1 upgrade gratuit", effect: p => { p.upgrades = Math.min((p.upgrades || 0) + 1, 6); } },
      { label: "Payer cash", icon: "💰", desc: "-2$, +1 mecha (si <4)", effect: p => { if (p.coins >= 2 && p.mechs.length < 4) { p.coins -= 2; const abilityIdx = p.mechs.length; p.mechs.push({ id: `${p.faction}_m${p.mechs.length}`, hexId: p.hero }); p.unlockedAbilities = [...(p.unlockedAbilities || []), abilityIdx]; if (p.mechs.length >= 4 && !p.starMechs) { p.stars++; p.starMechs = true; } } } },
      { label: "Renvoyer", icon: "🃏", desc: "+2 cartes combat", effect: p => { p.combatCards += 2; } },
    ] },
  { id: 9, name: "Le Champ de Pétrole", desc: "Du pétrole jaillit du sol. Sacré pour les uns, fortune pour les autres.",
    choices: [
      { label: "Extraire", icon: "🛢", desc: "+3 pétrole", effect: p => { const h = String(p.hero); if (!p.resources[h]) p.resources[h] = {}; p.resources[h].petrole = (p.resources[h].petrole || 0) + 3; } },
      { label: "Protéger", icon: "♥", desc: "+3 pop", effect: p => { p.pop = Math.min(p.pop + 3, 18); } },
      { label: "Vendre", icon: "💰", desc: "+4$", effect: p => { p.coins += 4; } },
    ] },
  { id: 10, name: "Le Télégraphe Fantôme", desc: "Un appareil crépite des messages codés. Qui écoute ?",
    choices: [
      { label: "Décrypter", icon: "🃏", desc: "+3 cartes combat", effect: p => { p.combatCards += 3; } },
      { label: "Transmettre", icon: "♥", desc: "+2 pop, +1$", effect: p => { p.pop = Math.min(p.pop + 2, 18); p.coins++; } },
      { label: "Détruire", icon: "⚡", desc: "+2 puissance", effect: p => { p.power = Math.min(p.power + 2, 16); } },
    ] },
  { id: 11, name: "Le Cimetière de Mechas", desc: "Des dizaines de colosses rouillés. Mémoire ou ferraille ?",
    choices: [
      { label: "Démonter", icon: "⚙", desc: "+3 métal", effect: p => { const h = String(p.hero); if (!p.resources[h]) p.resources[h] = {}; p.resources[h].metal = (p.resources[h].metal || 0) + 3; } },
      { label: "Mémorial", icon: "♥", desc: "+4 pop", effect: p => { p.pop = Math.min(p.pop + 4, 18); } },
      { label: "Fouiller", icon: "🃏", desc: "+2 cartes, +1 puissance", effect: p => { p.combatCards += 2; p.power = Math.min(p.power + 1, 16); } },
    ] },
  { id: 12, name: "La Contrebandière", desc: "Elle vend de tout. Armes, nourriture, secrets.",
    choices: [
      { label: "Acheter armes", icon: "⚡", desc: "-2$, +3 pui, +1 carte", effect: p => { if (p.coins >= 2) { p.coins -= 2; p.power = Math.min(p.power + 3, 16); p.combatCards++; } } },
      { label: "Acheter vivres", icon: "🌽", desc: "-1$, +3 nourriture", effect: p => { if (p.coins >= 1) { p.coins--; const h = String(p.hero); if (!p.resources[h]) p.resources[h] = {}; p.resources[h].nourriture = (p.resources[h].nourriture || 0) + 3; } } },
      { label: "Dénoncer", icon: "♥", desc: "+2 pop, +2$", effect: p => { p.pop = Math.min(p.pop + 2, 18); p.coins += 2; } },
    ] },
  { id: 13, name: "Le Barrage", desc: "Un barrage hydroélectrique, intact mais sans opérateur.",
    choices: [
      { label: "Activer", icon: "⚡", desc: "+3 puissance", effect: p => { p.power = Math.min(p.power + 3, 16); } },
      { label: "Distribuer", icon: "♥", desc: "+2 pop, +1 ouvrier", effect: p => { p.pop = Math.min(p.pop + 2, 18); if (p.workers.length < 8) p.workers.push({ id: `${p.faction}_w${p.workers.length}`, hexId: p.hero }); } },
      { label: "Revendre", icon: "💰", desc: "+4$", effect: p => { p.coins += 4; } },
    ] },
  { id: 14, name: "Les Enfants du Mecha", desc: "Des orphelins vivent dans la carcasse d'un mecha géant.",
    choices: [
      { label: "Adopter", icon: "♥", desc: "+4 pop", effect: p => { p.pop = Math.min(p.pop + 4, 18); } },
      { label: "Former", icon: "👷", desc: "+2 ouvriers", effect: p => { for (let i = 0; i < 2 && p.workers.length < 8; i++) p.workers.push({ id: `${p.faction}_w${p.workers.length}`, hexId: p.hero }); } },
      { label: "Passer", icon: "💰", desc: "+2$, +1 carte", effect: p => { p.coins += 2; p.combatCards++; } },
    ] },
  { id: 15, name: "Le Dernier Gouverneur", desc: "Il offre sa reddition. Que faites-vous de son pouvoir ?",
    choices: [
      { label: "Accepter", icon: "♥", desc: "+3 pop, +2$", effect: p => { p.pop = Math.min(p.pop + 3, 18); p.coins += 2; } },
      { label: "Exiger", icon: "⚡", desc: "+3 puissance, +1 carte", effect: p => { p.power = Math.min(p.power + 3, 16); p.combatCards++; } },
      { label: "Exiler", icon: "💰", desc: "+5$", effect: p => { p.coins += 5; } },
    ] },
];

export const ENCOUNTER_HEXES = [2, 4, 14, 16, 20, 27, 29, 35, 41];
