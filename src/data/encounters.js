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
//
// Le deck mêle 15 cartes Panamerica (ids 1-15), les 12 TRIPTYQUES DU JEU
// ORIGINAL (ids 16-27, marqués src:"original" — coûts et structure conservés,
// mais une option de 8 d'entre eux a été remplacée par un choix FRAGMENT
// TESLA) et 6 cartes d'extension (ids 28-33) bâties sur la même logique.
// Deux triptyques originaux dérogent aux conventions ci-dessus (héritage
// assumé du jeu de base) : les cartes 18 et 22 ACHÈTENT de la popularité.
//
// FRAGMENTS TESLA : ~50 % des cartes du deck offrent un choix fragment
// (16/33), à des positions VARIÉES — option 1 gratuite (+1 pop + fragment :
// on sacrifie le gros gain), option 2 (-2$) ou option 3 (-2 pop + appoint).
// C'est le principal carburant de la quête des prototypes (2 fragments).
// `grantsResources: N` : N ressources AU CHOIX, prises une par une (picker
// côté joueur, tirage côté bot), posées sur le hex de la rencontre.

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
// L'amélioration gagnée en rencontre est un VRAI déplacement de cube (haut→bas),
// choisi après coup (picker côté joueur, aléatoire côté bot — voir grantsUpgrade
// dans App.jsx/botEncounters.js) ; l'effet ne fait que payer le coût. Avant,
// seul le compteur montait : rien d'appliqué, constaté en partie réelle.
const canGainUpg = (p) => (p.upgrades || 0) < 6;
// Le bâtiment/la recrue gagnés en rencontre sont placés/résolus après le choix
// (picker côté joueur, auto côté bot) ; l'effet ne fait que payer le coût.
// Bâtiment : posé sur le hex du héros → il faut un type non-Gare encore libre
// (la Gare implique la pose de rails, hors flux rencontre) et le hex libre.
const NON_GARE = ["arsenal", "memorial", "moulin"];
const canEncBuild = (p) => NON_GARE.some(t => !(p.buildings || []).some(b => b.type === t)) && !(p.buildings || []).some(b => b.hexId === p.hero);
const canEncRecruit = (p) => (p.recruits || 0) < 4;
// Gare gratuite (cartes « Chantier ferroviaire », option 3) — seule dérogation :
// ici c'est justement la Gare qu'on pose, pas un autre type.
const canEncGare = (p) => (p.buildings || []).length < 4 && !(p.buildings || []).some(b => b.type === "gare" || b.hexId === p.hero);

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
      { label: "Réquisitionner les poutres", icon: "⬆", desc: "-2 pop, +1 amélioration", grantsUpgrade: true, available: p => p.pop >= 2 && canGainUpg(p), effect: p => { p.pop = Math.max(0, p.pop - 2); } },
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
      { label: "Fonder un établissement", icon: "🏗", desc: "-2 pop, +1 bâtiment", grantsBuilding: true, available: p => p.pop >= 2 && canEncBuild(p), effect: p => { p.pop = Math.max(0, p.pop - 2); } },
    ] },
  { id: 5, name: "Le Prêcheur au Carrefour", desc: "Un prédicateur harangue une foule. Milice ou messie ?",
    choices: [
      { label: "Écouter le sermon", icon: "♥", desc: "+1 pop, +1 carte combat", effect: p => { gainPop(p, 1); p.combatCards += 1; } },
      { label: "Financer sa croisade", icon: "🃏", desc: "-2$, +3 cartes combat", available: p => p.coins >= 2, effect: p => { p.coins -= 2; p.combatCards += 3; } },
      { label: "Enrôler ses fidèles", icon: "🤝", desc: "-2 pop, +1 recrue", grantsRecruit: true, available: p => p.pop >= 2 && canEncRecruit(p), effect: p => { p.pop = Math.max(0, p.pop - 2); } },
    ] },
  { id: 6, name: "Le Dépôt de Trains", desc: "Un dépôt ferroviaire rempli de technologie oubliée.",
    choices: [
      { label: "Inventorier le dépôt", icon: "♥", desc: "+1 pop, +2 métal", effect: p => { gainPop(p, 1); addRes(p, "metal", 2); } },
      { label: "Acheter la cargaison", icon: "🔬", grantsFragment: true, desc: "-2$, +1 Fragment Tesla", available: p => p.coins >= 2, effect: p => { p.coins -= 2; p.fragments = (p.fragments || 0) + 1; } },
      { label: "Rafler la technologie", icon: "⬆", desc: "-2 pop, +1 amélioration", grantsUpgrade: true, available: p => p.pop >= 2 && canGainUpg(p), effect: p => { p.pop = Math.max(0, p.pop - 2); } },
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
      { label: "Le forcer à bricoler", icon: "⬆", desc: "-2 pop, +1 amélioration", grantsUpgrade: true, available: p => p.pop >= 2 && canGainUpg(p), effect: p => { p.pop = Math.max(0, p.pop - 2); } },
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
      { label: "Décrypter les codes", icon: "🔬", grantsFragment: true, desc: "-2$, +1 Fragment Tesla", available: p => p.coins >= 2, effect: p => { p.coins -= 2; p.fragments = (p.fragments || 0) + 1; } },
      { label: "Détourner le réseau", icon: "⚡", desc: "-2 pop, +4 puissance", available: p => p.pop >= 2, effect: p => { p.pop = Math.max(0, p.pop - 2); gainPow(p, 4); } },
    ] },
  { id: 11, name: "Le Cimetière de Mechas", desc: "Des dizaines de colosses rouillés. Mémoire ou ferraille ?",
    choices: [
      { label: "Rendre hommage", icon: "♥", desc: "+1 pop, +2 métal", effect: p => { gainPop(p, 1); addRes(p, "metal", 2); } },
      { label: "Fouiller les prototypes", icon: "🔬", grantsFragment: true, desc: "-2$, +1 Fragment Tesla", available: p => p.coins >= 2, effect: p => { p.coins -= 2; p.fragments = (p.fragments || 0) + 1; } },
      { label: "Reconstruire un colosse", icon: "⬡", desc: "-3 pop, +1 mecha", grantsMech: true, available: p => p.pop >= 3 && p.mechs.length < 4, effect: p => { p.pop = Math.max(0, p.pop - 3); addMech(p); } },
    ] },
  { id: 12, name: "La Contrebandière", desc: "Elle vend de tout. Armes, nourriture, secrets.",
    choices: [
      { label: "Marchander poliment", icon: "♥", desc: "+1 pop, +2$", effect: p => { gainPop(p, 1); p.coins += 2; } },
      { label: "Engager ses mercenaires", icon: "🤝", desc: "-3$, +1 recrue", grantsRecruit: true, available: p => p.coins >= 3 && canEncRecruit(p), effect: p => { p.coins -= 3; } },
      { label: "La dévaliser", icon: "⚙", desc: "-2 pop, +4 métal", available: p => p.pop >= 2, effect: p => { p.pop = Math.max(0, p.pop - 2); addRes(p, "metal", 4); } },
    ] },
  { id: 13, name: "Le Barrage", desc: "Un barrage hydroélectrique, intact mais sans opérateur.",
    choices: [
      { label: "Rétablir le courant", icon: "♥", desc: "+1 pop, +2 puissance", effect: p => { gainPop(p, 1); gainPow(p, 2); } },
      { label: "Moderniser la turbine", icon: "💰", desc: "-2$, +1 amélioration", grantsUpgrade: true, available: p => p.coins >= 2 && canGainUpg(p), effect: p => { p.coins -= 2; } },
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
      { label: "Investir son domaine", icon: "🏗", desc: "-2 pop, +1 bâtiment", grantsBuilding: true, available: p => p.pop >= 2 && canEncBuild(p), effect: p => { p.pop = Math.max(0, p.pop - 2); } },
    ] },

  // ═══ Les 12 triptyques du deck ORIGINAL (étalon d'équilibrage) ═══
  { id: 16, src: "original", name: "Les Granges Pleines", desc: "Une ferme isolée, greniers débordants et bras manquants.",
    choices: [
      { label: "Partager la récolte", icon: "♥", desc: "+1 pop, +2 nourriture", effect: p => { gainPop(p, 1); addRes(p, "nourriture", 2); } },
      { label: "Embaucher un commis", icon: "👷", desc: "-2$, +1 ouvrier, +3 nourriture", available: p => p.coins >= 2, effect: p => { p.coins -= 2; addWorkers(p, 1); addRes(p, "nourriture", 3); } },
      { label: "Annexer la ferme", icon: "🏗", desc: "-2 pop, +1 bâtiment", grantsBuilding: true, available: p => p.pop >= 2 && canEncBuild(p), effect: p => { p.pop = Math.max(0, p.pop - 2); } },
    ] },
  { id: 17, src: "original", name: "La Scierie du Fleuve", desc: "Les lames tournent encore, les ouvriers ont fui.",
    choices: [
      { label: "Récupérer la vieille dynamo", icon: "🔬", grantsFragment: true, desc: "+1 pop, +1 Fragment Tesla", effect: p => { gainPop(p, 1); p.fragments = (p.fragments || 0) + 1; } },
      { label: "Acheter le stock", icon: "🪵", desc: "-2$, +4 bois", available: p => p.coins >= 2, effect: p => { p.coins -= 2; addRes(p, "bois", 4); } },
      { label: "Enrôler les bûcherons", icon: "🤝", desc: "-2 pop, +1 recrue", grantsRecruit: true, available: p => p.pop >= 2 && canEncRecruit(p), effect: p => { p.pop = Math.max(0, p.pop - 2); } },
    ] },
  { id: 18, src: "original", name: "La Tribune Improvisée", desc: "Une caisse retournée, une foule qui gronde : à qui la parole ?",
    choices: [
      { label: "Parler de force", icon: "♥", desc: "+1 pop, +2 puissance", effect: p => { gainPop(p, 1); gainPow(p, 2); } },
      { label: "Payer la claque", icon: "💰", desc: "-2$, +3 pop", available: p => p.coins >= 2, effect: p => { p.coins -= 2; gainPop(p, 3); } },
      { label: "Réquisitionner l'estrade", icon: "🏗", desc: "-2 pop, +1 bâtiment", grantsBuilding: true, available: p => p.pop >= 2 && canEncBuild(p), effect: p => { p.pop = Math.max(0, p.pop - 2); } },
    ] },
  { id: 19, src: "original", name: "Le Marché aux Grains", desc: "Criées, balances truquées et sacs qui changent de main.",
    choices: [
      { label: "Vendre au juste prix", icon: "♥", desc: "+1 pop, +2$", effect: p => { gainPop(p, 1); p.coins += 2; } },
      { label: "Salarier un courtier", icon: "🤝", desc: "-3$, +1 recrue", grantsRecruit: true, available: p => p.coins >= 3 && canEncRecruit(p), effect: p => { p.coins -= 3; } },
      { label: "Saisir les sacs", icon: "🌽", desc: "-2 pop, +4 nourriture", available: p => p.pop >= 2, effect: p => { p.pop = Math.max(0, p.pop - 2); addRes(p, "nourriture", 4); } },
    ] },
  { id: 20, src: "original", name: "La Forge de Fortune", desc: "Un forgeron bat le fer des épaves, des recrues plein l'atelier.",
    choices: [
      { label: "Passer commande", icon: "♥", desc: "+1 pop, +2 métal", effect: p => { gainPop(p, 1); addRes(p, "metal", 2); } },
      { label: "Acheter ses pièces d'un autre âge", icon: "🔬", grantsFragment: true, desc: "-2$, +1 Fragment Tesla", available: p => p.coins >= 2, effect: p => { p.coins -= 2; p.fragments = (p.fragments || 0) + 1; } },
      { label: "Vider la réserve", icon: "⚙", desc: "-2 pop, +4 métal", available: p => p.pop >= 2, effect: p => { p.pop = Math.max(0, p.pop - 2); addRes(p, "metal", 4); } },
    ] },
  { id: 21, src: "original", name: "Le Négociant en Barils", desc: "Il jure que son pétrole est le plus pur du continent.",
    choices: [
      { label: "Fouiller sa brocante", icon: "🔬", grantsFragment: true, desc: "+1 pop, +1 Fragment Tesla", effect: p => { gainPop(p, 1); p.fragments = (p.fragments || 0) + 1; } },
      { label: "Acheter la citerne", icon: "🛢", desc: "-2$, +4 pétrole", available: p => p.coins >= 2, effect: p => { p.coins -= 2; addRes(p, "petrole", 4); } },
      { label: "Enrôler ses convoyeurs", icon: "🤝", desc: "-2 pop, +1 recrue", grantsRecruit: true, available: p => p.pop >= 2 && canEncRecruit(p), effect: p => { p.pop = Math.max(0, p.pop - 2); } },
    ] },
  { id: 22, src: "original", name: "L'Imprimerie Clandestine", desc: "Des tracts encore humides sèchent sur des cordes à linge.",
    choices: [
      { label: "Distribuer les tracts", icon: "♥", desc: "+1 pop, +1 carte combat", effect: p => { gainPop(p, 1); p.combatCards += 1; } },
      { label: "Financer un tirage", icon: "💰", desc: "-2$, +2 pop", available: p => p.coins >= 2, effect: p => { p.coins -= 2; gainPop(p, 2); } },
      { label: "Saisir les plans interdits", icon: "🔬", grantsFragment: true, desc: "-2 pop, +1 Fragment Tesla, +2 bois", available: p => p.pop >= 2, effect: p => { p.pop = Math.max(0, p.pop - 2); p.fragments = (p.fragments || 0) + 1; addRes(p, "bois", 2); } },
    ] },
  { id: 23, src: "original", name: "Le Garage du Désert", desc: "Un hangar tôlé : bidons, pièces détachées et un châssis bâché.",
    choices: [
      { label: "Soulever la bâche", icon: "🔬", grantsFragment: true, desc: "+1 pop, +1 Fragment Tesla", effect: p => { gainPop(p, 1); p.fragments = (p.fragments || 0) + 1; } },
      { label: "Racheter le châssis", icon: "⬡", desc: "-4$, +1 mecha", grantsMech: true, available: p => p.coins >= 4 && p.mechs.length < 4, effect: p => { p.coins -= 4; addMech(p); } },
      { label: "Saisir la caisse", icon: "📦", desc: "-2 pop, +2$, +2 ressources au choix", grantsResources: 2, available: p => p.pop >= 2, effect: p => { p.pop = Math.max(0, p.pop - 2); p.coins += 2; } },
    ] },
  { id: 24, src: "original", name: "La Caravane Marchande", desc: "Des chariots bâchés, chargés de tout ce qui se vend.",
    choices: [
      { label: "Acheter une curiosité", icon: "🔬", grantsFragment: true, desc: "+1 pop, +1 Fragment Tesla", effect: p => { gainPop(p, 1); p.fragments = (p.fragments || 0) + 1; } },
      { label: "Faire ses emplettes", icon: "📦", desc: "-2$, +3 ressources au choix", grantsResources: 3, available: p => p.coins >= 2, effect: p => { p.coins -= 2; } },
      { label: "Débaucher un convoyeur", icon: "👷", desc: "-2 pop, +1 ouvrier, +3 bois", available: p => p.pop >= 2, effect: p => { p.pop = Math.max(0, p.pop - 2); addWorkers(p, 1); addRes(p, "bois", 3); } },
    ] },
  { id: 25, src: "original", name: "Le Camp d'Entraînement", desc: "D'anciens soldats font l'exercice pour qui veut bien payer.",
    choices: [
      { label: "Aider aux palissades", icon: "♥", desc: "+1 pop, +2 bois", effect: p => { gainPop(p, 1); addRes(p, "bois", 2); } },
      { label: "S'offrir l'instruction", icon: "⚡", desc: "-2$, +2 puissance, +2 cartes combat", available: p => p.coins >= 2, effect: p => { p.coins -= 2; gainPow(p, 2); p.combatCards += 2; } },
      { label: "Lever la compagnie", icon: "🤝", desc: "-2 pop, +1 recrue", grantsRecruit: true, available: p => p.pop >= 2 && canEncRecruit(p), effect: p => { p.pop = Math.max(0, p.pop - 2); } },
    ] },
  { id: 26, src: "original", name: "L'Arpenteur", desc: "Il plante des piquets et vend des parcelles qui ne sont pas à lui.",
    choices: [
      { label: "Étudier ses relevés de ruines", icon: "🔬", grantsFragment: true, desc: "+1 pop, +1 Fragment Tesla", effect: p => { gainPop(p, 1); p.fragments = (p.fragments || 0) + 1; } },
      { label: "Acheter une parcelle", icon: "🏗", desc: "-3$, +1 bâtiment", grantsBuilding: true, available: p => p.coins >= 3 && canEncBuild(p), effect: p => { p.coins -= 3; } },
      { label: "Chasser l'escroc", icon: "👷", desc: "-2 pop, +1 ouvrier, +3 bois", available: p => p.pop >= 2, effect: p => { p.pop = Math.max(0, p.pop - 2); addWorkers(p, 1); addRes(p, "bois", 3); } },
    ] },
  { id: 27, src: "original", name: "Le Ferrailleur", desc: "Sa cour déborde de tôles, d'essieux et d'un bras de mecha.",
    choices: [
      { label: "Marchander la tôle", icon: "♥", desc: "+1 pop, +2$", effect: p => { gainPop(p, 1); p.coins += 2; } },
      { label: "Racheter le bras de mecha", icon: "🔬", grantsFragment: true, desc: "-2$, +1 Fragment Tesla, +1 métal", available: p => p.coins >= 2, effect: p => { p.coins -= 2; p.fragments = (p.fragments || 0) + 1; addRes(p, "metal", 1); } },
      { label: "Ressusciter le colosse", icon: "⬡", desc: "-3 pop, +1 mecha", grantsMech: true, available: p => p.pop >= 3 && p.mechs.length < 4, effect: p => { p.pop = Math.max(0, p.pop - 3); addMech(p); } },
    ] },

  // ═══ Extension (ids 28-33) — même logique de triptyque que l'original ═══
  { id: 28, name: "L'Observatoire Abandonné", desc: "Une coupole rouillée, des lentilles intactes et des carnets griffonnés.",
    choices: [
      { label: "Cartographier les environs", icon: "♥", desc: "+1 pop, +1 carte combat", effect: p => { gainPop(p, 1); p.combatCards += 1; } },
      { label: "Racheter les instruments", icon: "🔬", grantsFragment: true, desc: "-2$, +1 Fragment Tesla", available: p => p.coins >= 2, effect: p => { p.coins -= 2; p.fragments = (p.fragments || 0) + 1; } },
      { label: "Démonter la coupole", icon: "⬆", desc: "-2 pop, +1 amélioration", grantsUpgrade: true, available: p => p.pop >= 2 && canGainUpg(p), effect: p => { p.pop = Math.max(0, p.pop - 2); } },
    ] },
  { id: 29, name: "Le Bac à Vapeur", desc: "Un passeur ronchon relie les deux rives, chaudière crachotante.",
    choices: [
      { label: "Aider au débarcadère", icon: "♥", desc: "+1 pop, +2 bois", effect: p => { gainPop(p, 1); addRes(p, "bois", 2); } },
      { label: "Affréter le bac", icon: "🌽", desc: "-2$, +4 nourriture", available: p => p.coins >= 2, effect: p => { p.coins -= 2; addRes(p, "nourriture", 4); } },
      { label: "Saisir la chaudière", icon: "🔬", grantsFragment: true, desc: "-2 pop, +1 Fragment Tesla, +2$", available: p => p.pop >= 2, effect: p => { p.pop = Math.max(0, p.pop - 2); p.fragments = (p.fragments || 0) + 1; p.coins += 2; } },
    ] },
  { id: 30, name: "La Diligence Postale", desc: "Le courrier de trois comtés, et personne pour l'escorter.",
    choices: [
      { label: "Escorter le courrier", icon: "♥", desc: "+1 pop, +2$", effect: p => { gainPop(p, 1); p.coins += 2; } },
      { label: "Acheter les brevets postés", icon: "⬆", desc: "-3$, +1 amélioration", grantsUpgrade: true, available: p => p.coins >= 3 && canGainUpg(p), effect: p => { p.coins -= 3; } },
      { label: "Détrousser la malle", icon: "📦", desc: "-2 pop, +3 ressources au choix", grantsResources: 3, available: p => p.pop >= 2, effect: p => { p.pop = Math.max(0, p.pop - 2); } },
    ] },
  { id: 31, name: "Le Cirque Ambulant", desc: "Sous le chapiteau : l'homme fort, la voyante, et « l'éclair en bocal ».",
    choices: [
      { label: "Acheter l'éclair en bocal", icon: "🔬", grantsFragment: true, desc: "+1 pop, +1 Fragment Tesla", effect: p => { gainPop(p, 1); p.fragments = (p.fragments || 0) + 1; } },
      { label: "Engager les manœuvres", icon: "👷", desc: "-2$, +2 ouvriers", available: p => p.coins >= 2, effect: p => { p.coins -= 2; addWorkers(p, 2); } },
      { label: "Débaucher l'homme fort", icon: "🤝", desc: "-2 pop, +1 recrue", grantsRecruit: true, available: p => p.pop >= 2 && canEncRecruit(p), effect: p => { p.pop = Math.max(0, p.pop - 2); } },
    ] },
  { id: 32, name: "Le Poste Frontière", desc: "Une barrière, deux douaniers, et des caisses « en transit ».",
    choices: [
      { label: "Payer le passage", icon: "♥", desc: "+1 pop, +2 pétrole", effect: p => { gainPop(p, 1); addRes(p, "petrole", 2); } },
      { label: "S'offrir l'escorte armée", icon: "⚡", desc: "-2$, +2 puissance, +1 carte combat", available: p => p.coins >= 2, effect: p => { p.coins -= 2; gainPow(p, 2); p.combatCards += 1; } },
      { label: "Saisir la contrebande", icon: "🔬", grantsFragment: true, desc: "-2 pop, +1 Fragment Tesla, +2 métal", available: p => p.pop >= 2, effect: p => { p.pop = Math.max(0, p.pop - 2); p.fragments = (p.fragments || 0) + 1; addRes(p, "metal", 2); } },
    ] },
  { id: 33, name: "L'Île du Naufrageur", desc: "Des épaves s'entassent sur la grève d'un vieil ermite du lac.",
    choices: [
      { label: "Écouter ses histoires", icon: "♥", desc: "+1 pop, +2 métal", effect: p => { gainPop(p, 1); addRes(p, "metal", 2); } },
      { label: "Acheter sa relique", icon: "🔬", grantsFragment: true, desc: "-2$, +1 Fragment Tesla", available: p => p.coins >= 2, effect: p => { p.coins -= 2; p.fragments = (p.fragments || 0) + 1; } },
      { label: "Recruter le naufrageur", icon: "👷", desc: "-2 pop, +1 ouvrier, +3 bois", available: p => p.pop >= 2, effect: p => { p.pop = Math.max(0, p.pop - 2); addWorkers(p, 1); addRes(p, "bois", 3); } },
    ] },
];

// ── Cartes « Chantier ferroviaire » — récompense du chapitre 1 de campagne ──
// (voir logic/campaign.js). Injectées dans le deck des chapitres SUIVANTS si
// la condition canon du chapitre 1 a été remplie : au chapitre 1 le rail est
// l'arme de l'Empire, ensuite les factions se l'approprient. Triptyque
// standard, avec une dérogation assumée pour l'option 2 (`railSegments: 2`) :
// la pose de 2 segments chaînés part de la case du héros — pas d'une Gare —
// résolue par le même flux `railPlacement` que le bâtiment (App.jsx).
export const RAIL_ENCOUNTERS = [
  { id: 34, name: "Le Chantier Réquisitionné", desc: "Des cheminots continuent le travail, sans savoir pour qui.",
    choices: [
      { label: "Les payer en nature", icon: "♥", desc: "+1 pop, +1 bois", effect: p => { gainPop(p, 1); addRes(p, "bois", 1); } },
      { label: "Poser la voie vous-même", icon: "🛤", desc: "3$, 2 segments de rail chaînés depuis votre héros", railSegments: 2, available: p => p.coins >= 3, effect: p => { p.coins -= 3; } },
      { label: "Réquisitionner le chantier", icon: "🏗", desc: "-2 pop, une Gare gratuite (3 segments) sur votre héros", grantsGare: true, available: p => p.pop >= 2 && canEncGare(p), effect: p => { p.pop = Math.max(0, p.pop - 2); } },
    ] },
  { id: 35, name: "Les Aiguilleurs Sans Maître", desc: "Le poste d'aiguillage tourne encore, mais plus personne ne répond de Dearborn.",
    choices: [
      { label: "Leur laisser le poste", icon: "♥", desc: "+1 pop, +1 métal", effect: p => { gainPop(p, 1); addRes(p, "metal", 1); } },
      { label: "Prolonger la ligne", icon: "🛤", desc: "3$, 2 segments de rail chaînés depuis votre héros", railSegments: 2, available: p => p.coins >= 3, effect: p => { p.coins -= 3; } },
      { label: "Prendre le poste de force", icon: "🏗", desc: "-2 pop, une Gare gratuite (3 segments) sur votre héros", grantsGare: true, available: p => p.pop >= 2 && canEncGare(p), effect: p => { p.pop = Math.max(0, p.pop - 2); } },
    ] },
  { id: 36, name: "Le Convoi de Traverses", desc: "Un wagon plat, chargé de bois de rail, abandonné sur une voie de garage.",
    choices: [
      { label: "Redistribuer le bois", icon: "♥", desc: "+1 pop, +2 bois", effect: p => { gainPop(p, 1); addRes(p, "bois", 2); } },
      { label: "Étendre la voie", icon: "🛤", desc: "3$, 2 segments de rail chaînés depuis votre héros", railSegments: 2, available: p => p.coins >= 3, effect: p => { p.coins -= 3; } },
      { label: "Réquisitionner le convoi", icon: "🏗", desc: "-2 pop, une Gare gratuite (3 segments) sur votre héros", grantsGare: true, available: p => p.pop >= 2 && canEncGare(p), effect: p => { p.pop = Math.max(0, p.pop - 2); } },
    ] },
];

// Carte contenant un choix « fragment Tesla » — verrou de campagne (logic/campaign.js)
export const hasTeslaFragment = (card) => card.choices.some(c => c.grantsFragment);
// Ensemble complet, ids compris — rehydratation d'une sauvegarde (App.jsx),
// même convention que ALL_OBJECTIVES / ALL_FACTORY_CARDS.
export const ALL_ENCOUNTERS = [...ENCOUNTERS, ...RAIL_ENCOUNTERS];
// (les positions des jetons de rencontre vivent dans data/hexes.js — ENCOUNTER_HEXES)
