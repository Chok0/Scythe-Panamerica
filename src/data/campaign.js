// ── Mode campagne : prologue + 8 chapitres ────────────────────────────────
// Transcription en données de docs/campagne.md. Le document reste la source
// de vérité NARRATIVE ; ce fichier ne porte que ce dont le moteur a besoin :
// l'ordre causal, la faction imposée, les drapeaux de variante, la condition
// canon et le legs débloqué.
//
// Deux règles structurantes reprises du document :
//  1. L'ordre est STRICTEMENT causal — un chapitre ne s'ouvre qu'une fois le
//     précédent terminé (logic/campaign.js).
//  2. Chaque chapitre offre DEUX voies de victoire : la condition canon
//     ci-dessous, ou les 6 étoiles classiques. La première atteinte l'emporte.
//
// ⚠ Chapitres 2 et 8 (Internationale Noire) : la faction n'est pas implémentée
// et la mécanique de scénario (infiltration / sabotage) n'est pas tranchée.
// Ils sont donc livrés en INTERLUDE — texte seul, comme le prologue — pour ne
// pas bloquer la progression sur les six chapitres jouables. Leur piste de
// condition canon est conservée dans `canonDraft`, à activer le jour où la
// faction existe.
import { FACTIONS } from './factions.js';
import { hMap, ADJ } from './hexes.js';

// L'Usine (Rouge River) — id fixe sur toutes les cartes, y compris
// procédurales (mapGen.js : FACTORY_ID).
export const FACTORY_HEX = 22;

/** Hex tenus par un joueur — même définition que le décompte de territoires
 *  (unités seules : héros, ouvriers, mechas). */
export const heldHexes = (p) => new Set([
  p.hero,
  ...(p.workers || []).map(w => w.hexId),
  ...(p.mechs || []).map(m => m.hexId),
]);

export const controlsFactory = (p) => heldHexes(p).has(FACTORY_HEX);
export const villagesHeld = (p) => [...heldHexes(p)].filter(id => hMap[id]?.t === "village").length;

const fObjCheck = (factionId) => (p, ctx) => FACTIONS[factionId].fObj.check(p, ctx);

// ── Conditions canon décomposées en MEMBRES ───────────────────────────────
// Partie du 01/08 : « 4+ hex Plaine/Forêt ET 2 patrouilles détruites »
// s'affichait en une phrase d'un bloc. Le joueur avait fait les patrouilles
// (2/2), était à 2/4 sur les hex, et a cru à un blocage du moteur.
// Une condition composée expose donc désormais l'état de CHAQUE membre, et
// `check` en est DÉRIVÉ — un seul point de vérité, le bandeau ne peut plus
// diverger du moteur.
//
// Deux formes de membre :
//   compte(label, count, need) → progression chiffrée « 2/4 »
//   jalon(label, met)          → binaire ✓/✗
const compte = (label, count, need) => ({ label, count, need });
const jalon = (label, met) => ({ label, met, need: 1, count: (p, ctx) => (met(p, ctx) ? 1 : 0) });

/** Un membre est-il rempli ? */
export const partMet = (part, p, ctx) => part.count(p, ctx) >= part.need;
/** Progression lisible d'un membre : « 2/4 » (compte) ou « ✓ / — » (jalon). */
export const partProgress = (part, p, ctx) =>
  part.met ? (part.met(p, ctx) ? "✓" : "—") : `${Math.min(part.count(p, ctx), part.need)}/${part.need}`;

/** Assemble une condition canon à partir de ses membres : `desc` et `check`
 *  en sont générés, donc toujours cohérents avec l'affichage. */
const canon = (name, parts) => ({
  name,
  parts,
  desc: parts.map(pt => (pt.met ? pt.label : `${pt.need} ${pt.label}`)).join(" ET "),
  check: (p, ctx) => parts.every(pt => partMet(pt, p, ctx || {})),
});

// Compteurs réutilisés par les membres ci-dessous
const hexOfTerrain = (p, terrains) => [...heldHexes(p)].filter(id => terrains.includes(hMap[id]?.t)).length;

export const PROLOGUE = {
  id: "prologue", kind: "interlude", num: 0,
  title: "Le trône né des guerres internes",
  subtitle: "1865 — la fondation de l'Empire Panaméricain",
  before: [
    "1865. La guerre de Sécession s'achève sur un champ de ruines, et personne — ni Washington, ni Richmond — n'a plus les moyens de garantir la paix. Dans l'ombre, un général de l'Union décide de tirer avantage de la situation. À coups de promesses législatives et de concessions de territoires, Cyrus obtient les faveurs des industriels du Nord — rail, acier, poudre — qui lui ouvrent leur crédit et le regardent se couronner Empereur.",
    "Cyrus Ier ne s'arrête pas là où s'arrêtait l'Union. Le Sud vaincu est absorbé sans traité ni compromis, occupé à la baïonnette. Puis le Mexique. Puis les Grandes Plaines. Puis la marche vers le Canada. En une génération, l'Empire Panaméricain tient un continent entier — par la seule force.",
    "1884. Un jeune ingénieur serbe débarque à New York avec quatre centimes en poche et des machines plein le crâne. Nikola Tesla entre au service d'Edison — brièvement. Les deux hommes se détestent : l'un tâtonne, l'autre voit la machine achevée avant de toucher un tournevis. Chassé, Tesla s'isole à Wardenclyffe et y construit en 1896 la première chose qui ressemble à un mecha : le Golem, un automate de travail de quatre mètres, animé par un courant sans fil que lui seul comprend. Les banquiers de l'Empire se penchent, puis se détournent : l'homme refuse de vendre, refuse même de breveter — il veut offrir sa machine au monde. On ne prête pas à un homme qui ne veut rien vendre. Un mécanicien de Detroit nommé Ford, lui, regarde le Golem et voit autre chose : ce qu'il resterait de cette merveille une fois débarrassée de son génie. Un produit. En 1902, ruiné, Tesla quitte l'Amérique pour ne plus jamais revenir — et Ford garde les plans.",
    "1913. Tenir un continent coûte cher, chaque année davantage — et c'est Cyrus II, héritier du trône depuis la mort de son père, qui en paie les factures. C'est le moment que choisit Ford pour sortir de l'ombre : dix ans à simplifier les plans volés — plus de courant sans fil, plus d'alliages introuvables, du diesel et de la tôle — pour obtenir ce que Tesla n'aurait jamais accepté de faire : un mecha qu'on produit à la chaîne. Là où le Golem était un miracle, le Model M est une facture que le trône peut payer. Cyrus II signe la charte d'exclusivité, Rouge River devient l'arsenal du trône — une armée qu'on produit en usine plutôt qu'on ne la paie en soldes. Elle arrive juste à temps : le Consortium referme son crédit, et l'Empire découvre qu'il s'est épuisé à force de vaincre.",
    "Le trône tient encore. Mais aux marges du continent, dans les terres traversées sans permission et occupées sans consentement, quelque chose a cessé d'attendre. Vous allez d'abord incarner une résistance qui n'a pas espéré que le trône tombe tout seul.",
  ],
  after: [],
};

export const CHAPTERS = [
  {
    id: "ch1", num: 1, kind: "game", faction: "nations",
    title: "La résistance active",
    subtitle: "Nations Souveraines — Aiyana & Koda",
    variant: { empire: true, steel: false, bonusTile: null, railGrowth: true,
      label: "Le rail avance — chaque tour, l'Empire prolonge son réseau d'un segment vers le prochain village, jusqu'à raccorder tous les villages à Rouge River. Le réseau est partagé : depuis un hex du réseau, un pas de déplacement mène à n'importe quel hex relié. Patrouilles impériales ACTIVES — neuves mais affamées, à court de diesel et de pièces, et capables d'emprunter le rail." },
    before: [
      "1914. Un an que les Model M sortent de Rouge River — et déjà, le rail impérial pousse ses voies à travers les terres Lakota, Navajo, Cree et Haudenosaunee sans jamais demander la permission. Le rail d'abord, les patrouilles ensuite : c'est ainsi que l'Empire avale l'Ouest.",
      "Mais Dearborn est loin. Les mechas des garnisons de l'Ouest sont neufs — et affamés. Le diesel arrive au compte-gouttes, les pièces détachées jamais. Un Model M à sec n'est plus une arme : c'est sept tonnes de tôle plantées dans la prairie, qui attendent qu'on vienne les cueillir.",
      "Aiyana l'a compris avant tout le monde. Cheffe de guerre lakota, fille d'un éclaireur de l'ancienne armée et d'une guérisseuse oglala, elle a appris la mécanique dans les ateliers de l'Empire — assez pour savoir démonter ce qu'il fabrique. Les premiers mechas des Nations sont des patrouilles capturées à sec, réveillées au cuivre et au bois, et qui règlent désormais leur pas sur celui de Koda, son vieux bison.",
      "On murmure aussi qu'un fragment de Wardenclyffe, exfiltré avant la saisie du labo de Tesla, aurait été échangé contre du cuivre travaillé par les Nations. Une rumeur. Pour l'instant.",
    ],
    canon: canon("Le Grand Retour", [
      compte("hex Plaine/Forêt contrôlés", p => hexOfTerrain(p, ["plaine", "foret"]), 4),
      compte("patrouilles impériales détruites", p => p.empireKills || 0, 2),
    ]),
    unlock: "railCards",
    after: [
      "Aiyana ne fait pas tomber l'Empire — elle prouve, avant tout le monde, que ses fissures sont réelles.",
      "Ses équipes ont appris à poser le rail elles-mêmes, sur les chantiers réquisitionnés : désormais, le réseau appartient à ceux qui savent s'en servir.",
      "Le fragment de Wardenclyffe, lui, reste une rumeur. Et quelque part ailleurs, quelqu'un d'autre a vu la même faiblesse — et prépare quelque chose de plus définitif.",
    ],
  },
  {
    id: "ch2", num: 2, kind: "interlude", faction: "internationale",
    title: "Le Régicide",
    subtitle: "Internationale Noire — sans héros",
    variant: { empire: true, steel: false, bonusTile: null,
      label: "Faction spécifiée (docs/design/internationale_noire.md) mais pas encore implémentée — chapitre joué en interlude." },
    before: [
      "Une cellule panaméricaine de l'Internationale Noire, infiltrée à Rouge River depuis des années sous couvert d'ouvriers, a fini par obtenir ce qu'elle attend depuis le tournant du siècle : un accès à l'Empereur en déplacement.",
    ],
    canon: null,
    // Piste conservée pour le jour où la faction existe (docs/campagne.md ch.2)
    canonDraft: "Atteindre l'Empereur — prendre le contrôle de l'Usine (hex 22) pour représenter l'accès à sa visite d'inspection, ou détruire un nombre donné de patrouilles impériales.",
    unlock: null,
    after: [
      "Cyrus II est assassiné dans un atelier ferroviaire de Chicago.",
      "Parce que la cohésion de l'Empire ne tenait que par la guerre permanente et une industrie du mecha déjà exsangue, ce n'est pas une crise de succession : c'est un effondrement total.",
      "La Seconde Guerre Civile commence — cent guerres locales simultanées. Washington se retranche sur son noyau et sur Rouge River, tenue par une garnison loyaliste.",
    ],
  },
  {
    id: "ch3", num: 3, kind: "game", faction: "frente",
    title: "L'éclatement",
    subtitle: "Frente Libre — E. Rojas & Trueno",
    // « Ruée vers l'or » : la tuile bonus est FORCÉE au lieu d'être tirée.
    // Terres Lointaines (1$/hex de distance à sa base) matérialise la curée
    // sur les terres éloignées — l'accaparement, pas la simple exploitation.
    variant: { empire: false, steel: false, bonusTile: "terres_lointaines",
      label: "Ruée vers l'or : tuile bonus de pose FORCÉE sur « Terres Lointaines » — la curée sur les terres mexicaines par les latifundistes financés par le Consortium." },
    before: [
      "L'Empire n'est pas né au Mexique, mais il s'y est étendu une génération après sa fondation : concessions minières et ferroviaires « exclusives, continent entier », qui ont dépossédé des générations avant même que Zapata prenne les armes.",
      "La nouvelle du régicide vient d'atteindre le Morelos.",
    ],
    canon: canon("Terre Libérée", [
      compte("pièges posés", p => (p.trapTokens || []).length, 4),
      compte("ouvriers sur Sierras/Déserts", p => (p.workers || []).filter(w => {
        const t = hMap[w.hexId]?.t; return t === "sierra" || t === "desert";
      }).length, 2),
    ]),
    unlock: "amplificateur",
    after: [
      "Rojas et Zapata ne sont plus seuls : ce n'est plus une révolte régionale, c'est la première étincelle visible de la Seconde Guerre Civile qui embrase déjà tout le continent.",
      "Panamerica n'a pas de « centre » géographique unique. L'Empire est un système d'extraction, pas un territoire — et il se défait par tous les bouts à la fois.",
    ],
  },
  {
    id: "ch4", num: 4, kind: "game", faction: "confederation",
    title: "La libération de Ford",
    subtitle: "Confédération — J. Cole & Dixie",
    variant: { empire: true, steel: false, bonusTile: null,
      label: "Mechas de l'Empire ACTIFS — mission centrée sur la prise de Rouge River elle-même, contre la garnison loyaliste retranchée." },
    before: [
      "Le Sud n'a jamais rejoint l'Empire de son plein gré : absorbé par la force en 1865, occupé militairement pendant cinquante ans — loi martiale, gouverneurs, garnisons — sans jamais renoncer à s'en libérer.",
      "Depuis le régicide, une garnison loyaliste tient Rouge River fermée à tout le monde. Ford y compris.",
    ],
    canon: canon("L'Arsenal", [
      jalon("Usine (hex 22) contrôlée", p => controlsFactory(p)),
      compte("patrouille impériale détruite", p => p.empireKills || 0, 1),
    ]),
    unlock: null,
    after: [
      "La garnison lâche prise. En échange de son aide, Cole obtient de Ford des facilités de paiement sur les mechas nécessaires à son propre projet de reconquête.",
      "Sans Empereur pour l'honorer, l'exclusivité de Ford ne vaut plus rien : il comprend son intérêt réel — la guerre est le meilleur moteur économique — et rouvre le Catalogue Ford à tout le continent. C'est cet instant précis qui explique pourquoi toutes les factions suivantes ont déjà accès aux mechas Ford.",
      "Cole n'a rien libéré au nom de personne d'autre que lui-même.",
    ],
  },
  {
    id: "ch5", num: 5, kind: "game", faction: "bayou",
    title: "Le contrage de la Confédération",
    subtitle: "Bayou — Cap. Zeke & Croc",
    variant: { empire: true, steel: false, bonusTile: null,
      label: "Mechas de l'Empire ACTIFS — les patrouilles restantes, désormais sans commandement clair." },
    before: [
      "Dockers et déserteurs des docks impériaux du Mississippi, devenus corsaires d'un fleuve qu'ils refusent de laisser à l'Empire.",
      "Rouge River vient d'échapper au contrôle impérial — et la Confédération qui l'a libérée finance désormais sa propre reconquête à crédit chez Ford.",
    ],
    canon: canon("Le Prédateur", [
      compte("mecha capturé", p => p.capturedMech || 0, 1),
      compte("proies vaincues (Empire ou joueur)", p => (p.empireKills || 0) + (p.combatWins || 0), 2),
    ]),
    unlock: "eclair",
    after: [
      "Le Bayou ne convoite pas Rouge River par appât du gain : c'est une question de survie.",
      "Si la Confédération de Cole devait un jour dominer le continent avec les mechas qu'elle achète à crédit, le Bayou sait exactement ce qui l'attend.",
    ],
  },
  {
    id: "ch6", num: 6, kind: "game", faction: "dominion",
    title: "L'achèvement de l'Empire",
    subtitle: "Dominion — Col. Whitfield & Sterling",
    variant: { empire: false, steel: true, bonusTile: null,
      label: "Acier Brut : Rouge River produit 1 métal par tour ; tant que personne ne la contrôle, l'acier s'accumule — et le premier arrivé ramasse toute la pile." },
    before: [
      "La finance londonienne avait arrêté net, jadis, la poussée impériale vers le Canada.",
      "Mais avec Washington réduit à sa capitale et incapable de réagir, la prudence financière cède la place au calcul militaire.",
    ],
    canon: canon("Le Tribut", [
      compte("pièces gagnées via Commerce Impérial", p => p.imperialCoins || 0, 20),
    ]),
    unlock: "relais",
    after: [
      "Les troupes du Dominion achèvent ce qui reste de la présence impériale au Canada — moins une conquête qu'un nettoyage.",
      "Révélation en clôture : c'est en partie l'argent du Dominion qui a discrètement financé l'intronisation du pantin Cyrus III. Non par loyauté — parce qu'un trône fictif, même vide, reste plus profitable pour le commerce qu'un continent ouvertement sans souverain.",
      "Le Dominion n'a jamais voulu que l'Empire meure : il voulait juste qu'il continue à signer des papiers.",
    ],
  },
  {
    id: "ch7", num: 7, kind: "game", faction: "acadiane",
    title: "La redéstabilisation",
    subtitle: "Acadiane — M. Thibodeau & Brume",
    variant: { empire: false, steel: false, bonusTile: null,
      label: "Partie standard — l'enjeu est le réseau, pas la ligne de front." },
    before: [
      "Dispersée par le Grand Dérangement de 1755, un siècle avant l'Empire, l'Acadiane n'a jamais reconnu aucune couronne : son réseau de contrebande a toujours vécu dans les failles de l'autorité.",
      "Le nettoyage du Dominion au Canada menace de refermer ces failles pour de bon — une frontière stabilisée est une frontière surveillée.",
    ],
    canon: canon("Réseau Invisible", [
      compte("Comptoirs posés", p => (p.flagTokens || []).length, 4),
      jalon("dont 1 sur un Lac", p => (p.flagTokens || []).some(fl => hMap[fl.hexId]?.t === "lac")),
      jalon("aucun Comptoir adjacent à un autre", p => {
        const ids = (p.flagTokens || []).map(f => f.hexId);
        return ids.length > 0 && !ids.some((a, i) => ids.slice(i + 1).some(b => (ADJ[a] || []).includes(b)));
      }),
    ]),
    unlock: "tour",
    after: [
      "Thibodeau ne se contente pas de contourner la nouvelle autorité dominioniste : il sabote activement toute tentative de restructuration politique dans son sillage — la sienne comme celle des autres — et étend son réseau jusque dans l'ouest canadien, là où le passage du Dominion a laissé un vide administratif.",
      "L'Acadiane a besoin du chaos pour se retisser. Elle est prête à l'entretenir elle-même si personne d'autre ne s'en charge.",
    ],
  },
  {
    id: "ch8", num: 8, kind: "interlude", faction: "internationale",
    title: "Le Sabotage Final",
    subtitle: "Internationale Noire — sans héros",
    variant: { empire: false, steel: true, bonusTile: null,
      label: "Faction spécifiée mais pas encore implémentée — chapitre joué en interlude. Acier Brut prévu, pour matérialiser ce qu'il s'agit de tarir." },
    before: [
      "Six factions armées jusqu'aux dents par Ford, qui s'entredéchirent, se défendent ou se conquièrent tour à tour sans qu'aucune ne l'emporte jamais vraiment — exactement le jeu de promotions que Ford entretient depuis la réouverture du Catalogue.",
      "L'Internationale Noire comprend que le trône n'était jamais la vraie cible : le régicide de 1915 n'a fait que déplacer le problème de Washington à Dearborn.",
    ],
    canon: null,
    canonDraft: "Saboter Rouge River — tenir l'Usine (hex 22) un nombre donné de tours consécutifs pour représenter l'arrêt de la chaîne, ou capturer/détruire un quota de mechas toutes factions confondues.",
    unlock: null,
    after: [
      "Rouge River ne tombe pas d'un coup : elle s'enraye. Le pantin Cyrus III, déjà sans pouvoir réel, devient définitivement hors sujet.",
      "Les mechas impériaux comme les stocks de Ford, privés de la chaîne qui les entretenait, deviennent les « colosses rouillés » que le jeu de base décrit dans son texte de règles. La campagne se referme exactement là où commence une partie standard de Scythe Panamerica.",
      "Dernier mot laissé en suspens : le Horloger avait raison sur un point — détruire une machine de guerre n'a jamais suffi à empêcher la suivante. Reste à savoir ce que l'Internationale Noire compte faire de ce qu'elle vient de gagner.",
    ],
  },
];

export const CHAPTER_IDS = CHAPTERS.map(c => c.id);
export const chapterById = (id) => CHAPTERS.find(c => c.id === id) || null;
