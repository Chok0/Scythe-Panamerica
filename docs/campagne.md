# Mode campagne

But de la campagne : explorer les mécaniques spécifiques à Panamerica à
travers des défis pour parties spéciales (l'équivalent des variantes du jeu
original), et surtout **dérouler une histoire** — tour à tour, on incarne
chacune des factions pour découvrir son lore propre et le lore global de
l'Empire Panaméricain (sa naissance après la guerre de Sécession, la
trahison de Tesla par Ford, le régicide de 1915, la Seconde Guerre Civile et
l'effondrement). Voir `docs/design/lore_1920_plus.md` §III et §IV pour le
worldbuilding complet — ce document se concentre sur la mécanique et la
structure de la campagne.

**Documents liés**
- `docs/design/lore_1920_plus.md` — worldbuilding Panamerica (trame, factions)
- `docs/design/internationale_noire.md` — fiche de la faction des chapitres 2 et 8
- `docs/design/lore_europa_hors_scope.md` — archive Europa (hors périmètre)

## 🎁 Contenu du jeu ORIGINAL en réserve (déblocages de campagne)

Deux ensembles transcrits du Scythe de base vivent dans les données mais ne
sont PAS mélangés aux parties standards — récompenses de campagne prévues :

- **Cartes d'usine** : `PLANS_ORIGINAL` (12 cartes, `src/data/plans.js`) —
  les 12 actions top du deck usine original.
- **Objectifs secrets** : `OBJECTIVES_ORIGINAL` (21 missions,
  `src/data/objectives.js`) — nécessite le compteur `scaredWorkers` (déjà
  suivi) et le contexte joueurs (`check(p, {players})`, déjà branché).

**Plateaux joueur** : `MATS_ORIGINAL` (7 plateaux ids 101-107, `src/data/mats.js`)
— Industrie, Ingénierie, Patriotisme, Mécanique, Agriculture, Innovation,
Militant. Tous les lookups passent par `matById()` : assigner un id 10x à un
joueur de campagne suffit. ⚠ Dans le jeu de base, le départ pauvre (Industrie
2♥/4$) était compensé par l'ordre du tour — mécanique absente ici, à
équilibrer en mission. **Traité comme variante avancée optionnelle** dans la
décomposition ci-dessous (pas dans le parcours principal) tant que ce
rééquilibrage n'a pas été fait.

## 🏦 Rouge River — Acier Brut (variante de campagne)

Ancienne mécanique décrite dans le lore (`lore_1920_plus.md` §III.5) : à
chaque tour, Rouge River génère automatiquement 1 ressource Acier Brut,
récupérée par le joueur qui la contrôle ; si personne ne la contrôle, l'Acier
s'accumule — récompense croissante pour le premier arrivé.

- Retirée du jeu de base standard (elle favorise trop mécaniquement le
  contrôle précoce du centre sans y ajouter de tension nouvelle en partie
  libre).
- **Confirmée comme UNE variante de campagne à part entière** — pas un
  toggle générique, un scénario dédié où le contrôle de l'arsenal impérial
  est l'enjeu central de la partie (chapitre Dominion, voir plus bas).
- ✅ **Implémentée** : drapeau `variant.steel` du chapitre (`data/campaign.js`),
  génération et ramassage dans `steelTick()` (`logic/campaign.js`), appelée à
  chaque passage de tour. 1 métal par tour sur l'hex 22 ; pile ramassée
  ENTIÈRE par le premier contrôleur exclusif ; Usine contestée = personne ne
  ramasse. Active aux chapitres 6 et 8.

## ⚙ Catalogue Ford — un deck purement martial

Le Catalogue Ford (Model M, Trimotor, River Rouge Special, Iron Horse) reste
tel quel : que des mechas, rien que des mechas — Ford ne pense qu'en usines
et en colosses. Les idées de bâtiment ou d'effet passif appartiennent à
Tesla, pas à lui — voir la section suivante.

## 🔒 Verrou du contenu Tesla — actif UNIQUEMENT en campagne

*(cadrage du 1er août 2026, §4 — ✅ implémenté)* Les plans T sont les
originaux volés à Wardenclyffe, enfermés dans le coffre de Ford — qui ne les
comprend pas. Le monde ne voit que ce que Ford en a tiré. En partie libre,
rien ne change : offre Tesla complète, deck de rencontres complet.

En **campagne**, deux crans distincts, chacun un cran du récit :

| Cran | Déclencheur | Contenu ouvert |
|---|---|---|
| Ch. 1-2 | — | Rien. Rumeurs seulement. Usine : plans Ford (F1-F5) uniquement. |
| Ch. 3 | Condition canon remplie (*Amplificateur*) | Les cartes rencontre à fragments Tesla rejoignent le deck — premier contact avec les reliques de Wardenclyffe. |
| Ch. 4 | Prise de Rouge River (condition canon) | Le coffre s'ouvre : les plans T1-T5 rejoignent l'offre de l'Usine pour tous les chapitres suivants. |
| Fin de campagne | À définir | Le Golem — hors périmètre pour l'instant (voir Legs ci-dessous). |

`logic/campaign.js` : `teslaEncountersUnlocked(progress)` /
`teslaPlansUnlocked(progress)` lisent directement `progress.done.ch3.canonMet`
/ `progress.done.ch4.canonMet` — aucun drapeau supplémentaire à persister.
`data/encounters.js` : les 16 cartes à fragment portent `grantsFragment: true`
sur leur choix concerné (`hasTeslaFragment(card)` les repère). `App.jsx` filtre
le deck de rencontres et vide la vitrine `teslaOffer` tant que le cran
correspondant n'est pas atteint, uniquement quand un chapitre est actif.

## 🛤 « Le rail avance » — croissance du réseau impérial (chapitre 1)

*(cadrage du 1er août 2026, §3 — ✅ implémenté)* Le réseau ferroviaire — qui
remplace les tunnels de Scythe, accessible uniquement en construisant une
Gare — est une mécanique majeure qu'une partie libre peut ignorer d'un bout à
l'autre. Le chapitre 1 la rend inévitable : l'Empire construit son propre
réseau sous les yeux du joueur, avec les mêmes règles que les siennes.

- Amorce : les 2 segments impériaux déjà posés au setup (`EMPIRE_RAILS`).
- Rythme : 1 segment par tour de table, jusqu'à ce que l'Usine et **tous**
  les villages partagent la même composante connexe.
- Ciblage : plus court chemin vers le prochain village non raccordé, puis
  vers l'Usine pour fusionner les composantes restantes — mêmes interdits
  que la pose de rail joueur (jamais sur lac/marécage/base).
- La croissance ne part que des rails IMPÉRIAUX (`empireRails`, suivi à part
  du réseau partagé). Correctif du 03/08 : `growEmpireRail` recevait le
  réseau partagé, donc l'Empire prolongeait les segments du joueur — mesuré
  3 tours et 3 segments gagnés, et le village-hub du joueur raccordé au
  réseau impérial par sa propre voie.
- Les patrouilles impériales qui activent leur tour SUR le réseau peuvent
  rouler vers n'importe quel hex connecté, comme un joueur (log dédié `🛤
  (rail)`) — limité au chapitre 1 (`variant.railGrowth`), pour ne pas changer
  le comportement des patrouilles ailleurs sans qu'on l'ait demandé. Comme
  pour les joueurs, le réseau leur est COUPÉ aux nœuds occupés (03/08 :
  elles sautaient par-dessus les unités), et le rail n'entre dans le tirage
  de leur destination qu'une fois sur quatre — sans quoi le réseau achevé
  leur offrait ~14 destinations contre ~5 voisins (75 % de sauts de rail en
  fin de partie, « déplacement sans interaction »).
- Aucun retrait de segment (sabotage hors-scope), aucune traversée de
  lac/marécage.

`logic/campaign.js` : `growEmpireRail(rails)` (pure, testée sur 200 tours de
convergence) + `empireRailDone(rails)`. `App.jsx` l'appelle une fois par tour
de table quand `chapter.variant.railGrowth` est actif.

## 🔧 Les legs de Wardenclyffe — 5 récompenses de campagne, pas des cartes d'usine

La Tour Wardenclyffe, l'Éclair, l'Amplificateur et le Relais ne sont **pas**
des Plans à piocher au Catalogue Ford — ce sont des **objets hors
catalogue**, débloqués par les scénarios de campagne, cachés dans le sous-sol
scellé que Ford n'a jamais réussi à ouvrir en entier :

- **La Tour Wardenclyffe** — **bâtiment bonus** : structure fixe qui
  alimente en énergie sans fil tous les mechas du joueur dans un rayon de 3
  cases (+1 mouvement, +1 puissance).
- **L'Éclair** — **mecha bonus** léger, 4 cases de mouvement (le double de
  la norme), pensé pour la reconnaissance et le vol de ressources.
- **L'Amplificateur** — **bâtiment bonus** (nom de travail repris du
  « magnifying transmitter », authentique, des expériences de Tesla à
  Colorado Springs). Produit 1 pétrole supplémentaire à chaque Produce, sans
  lien avec aucun gisement — une prise d'énergie libre.
- **Le Relais** — **effet bonus** passif (ni mecha, ni bâtiment) : capte ce
  que fait n'importe quel autre joueur sur son propre Plan de Rouge River et
  en détourne 1 ressource au choix à chaque fois. L'écho du rêve de
  télégraphie sans fil mondiale de Tesla — une antenne oubliée qui continue
  d'écouter.

**Le Golem quitte le chapitre 1** (cadrage du 1er août 2026, D5) : le mecha
bonus alimenté sans fil est retiré du périmètre actuel, réintégré plus tard
avec sa propre logique d'histoire (fragments Tesla, interlude redéroulant le
lore Edison/Tesla/Ford — nécessite d'abord l'amendement de lore §6.5 du
cadrage). Le chapitre 1 débloque à la place **Chantier ferroviaire** — pas un
objet permanent mais 3 cartes rencontre (Gare gratuite + 3 rails, ou 2 rails
seuls, toujours depuis la case du héros) injectées dans le deck des chapitres
suivants. ✅ Implémenté : `LEGACIES.railCards` (`data/legacies.js`),
`RAIL_ENCOUNTERS` (`data/encounters.js`), résolution joueur et bot
(`App.jsx`, `botEncounters.js`) — c'est la seule des 5 récompenses à avoir un
effet RÉEL en jeu pour l'instant.

**Le « Fantôme de Wardenclyffe » (ancien plan de mecha coopératif
inter-factions) est retiré** — trop de conditions externes pour un seul objet
permanent. L'idée de coopération inter-factions reste bonne mais migre vers
un scénario de campagne dédié plutôt qu'un item du jeu (piste ouverte, pas
encore assignée à un chapitre).

## 🤖 Mechas de l'Empire

Les patrouilles de l'Empire (PvE) sont désactivées par défaut — le toggle
reste disponible sur l'écran de setup, marqué « (campagne) ».

- Code conservé : `src/data/empire.js` (`EMPIRE_START`, `EMPIRE_DECK`,
  `EMPIRE_RAILS`), déplacements/combats PvE dans `App.jsx` et `bot.js`,
  rendu `EmpireMecha` dans `MapComponents.jsx`.
- **Sens narratif clarifié** : ces mechas ne sont pas une faction tierce
  générique — ce sont les **derniers vestiges de l'armée impériale**, sortis
  de Rouge River sous Cyrus II puis laissés sans commandement clair après le
  régicide de 1915, avant même l'intronisation du pantin Cyrus III. Leurs
  noms (Écho Rouillé, Sentinelle Aveugle,
  Patrouilleur Usé...) décrivent déjà des machines à l'abandon — c'est
  cohérent avec le texte des règles du jeu de base (« l'Empire mécanique
  s'est effondré, laissant derrière lui des colosses rouillés »).
- **Correctif de timeline (cadrage du 1er août 2026)** : cette lecture
  « colosses rouillés » ne peut pas s'appliquer telle quelle au chapitre 1
  (1914 — un an après la livraison des premiers Model M, un an AVANT le
  régicide de 1915). L'usure y est déplacée sur la **logistique**, pas le
  matériel : cinquante ans d'occupation ont épuisé la trésorerie et les
  lignes de ravitaillement, et le Model M — diesel, produit à Dearborn —
  meurt de faim aux marges du continent. Patrouilles **neuves mais
  affamées**, cueillies à sec plutôt qu'usées par le temps ; c'est aussi
  l'origine des premiers mechas des Nations (Model M capturés en panne,
  réveillés au cuivre et au bois — cohérent avec Esprit Sauvage). La lecture
  « colosses rouillés » redevient exacte à partir du chapitre 4 (après le
  régicide).
- Idée de mission : défendre une région contre les patrouilles, escorter un
  convoi à travers les lignes de l'Empire, détruire les six mechas E1–E6.

## 🕳 Internationale Noire — spec rédigée, implémentation à faire

Faction sans héros, sans plateau joueur, sans mecha de série — sa mécanique
de jeu est fondamentalement différente du reste du roster. Elle n'est pas un
à-côté optionnel de la campagne : **c'est elle qui joue le régicide de Cyrus II
en 1915 (chapitre 2) et le sabotage final de Rouge River (chapitre 8)** — les
deux verrous qui ouvrent et referment toute la boucle narrative.

**➜ Fiche de faction complète : `docs/design/internationale_noire.md`.**
Y sont arrêtés : 2⚡/1🃏/4♥/3$, 4 ouvriers sur les hex 3/20/25/40 traités comme
4 bases avec repop hors-plateau, La Nage (toutes rivières, remplace le
riverwalk), les ouvriers comptés comme unités combattantes, le vol de mecha
(jusqu'à 4, avec capacité volée), l'action Deploy qui paie et encaisse sans
poser de mecha, et l'objectif « Usine + 3 villages ».

Reste à faire : l'**implémentation** de la faction (voir §11 de la fiche) et la
**mécanique de scénario propre aux deux chapitres** (infiltration au 2, sabotage
au 8) — cette dernière n'est pas couverte par la fiche. Le reste de la campagne
(chapitres 1, 3, 4, 5, 6, 7) ne dépend pas d'elle et peut avancer en parallèle.

## 🏆 Conditions de victoire — règle générale de la campagne

Valable pour **tous** les chapitres : chaque partie offre **deux voies de
victoire**, et la première atteinte l'emporte.

1. **La condition canon du scénario** — alignée sur le morceau d'histoire du
   chapitre (ex. chapitre 4 : prendre Rouge River aux loyalistes). La voie
   narrative.
2. **La condition classique des 6 étoiles** — le jeu standard, inchangé. La
   voie du joueur qui mène sa partie comme d'habitude.

Ça évite le piège du scénario dirigiste : jouer l'histoire est récompensé, mais
l'ignorer ne bloque jamais la victoire.

---

## Décomposition des séquences de campagne

Structure : un **prologue** (texte seul, pas de partie) et **huit chapitres**
— six parties complètes (une par faction jouable, avec objectif narratif et
variante de jeu) et deux chapitres Internationale Noire qui encadrent tout le
reste. Pas de « finale » séparée : le chapitre 8 tient ce rôle et boucle sur
l'état du monde du jeu de base.

**L'ordre est maintenant strictement causal, pas juste une logique de
dévoilement** : chapitre 1 doit précéder le régicide (chapitre 2) puisqu'il
s'y déroule avant ; le régicide doit précéder tout le reste (3 à 8), qui n'a
de sens qu'après ; le chapitre 5 réagit directement aux événements du
chapitre 4 ; le chapitre 7 réagit directement à ceux du chapitre 6 ; le
chapitre 8 doit rester dernier. Aucun de ces huit chapitres n'est
interchangeable avec un autre.

### Prologue — Le trône né des guerres internes

*Texte seul, pas de partie.* Pose le décor en cinq mouvements : 1865, un
général de l'Union tire avantage de la paix manquée et obtient, à coups de
promesses et de concessions, les faveurs — et le crédit — des industriels du
Nord qui le regardent se couronner Empereur. Cyrus Ier absorbe le Sud sans
traité, puis le Mexique, puis les Grandes Plaines, puis pousse jusqu'au
Canada — un continent entier par la seule force. 1884-1902, l'arc complet de
Tesla : l'arrivée à New York, la rupture avec Edison, le Golem construit seul
à Wardenclyffe en 1896, le refus de vendre, Ford qui regarde la même machine
et y voit un produit, la ruine et le départ sans retour en 1902 — Ford garde
les plans. 1913, Cyrus II, déjà accablé par le coût du continent, signe la
charte d'exclusivité qui fait du Model M produit en série l'arsenal du trône,
juste au moment où le Consortium referme son crédit. Le trône tient encore,
mais aux marges quelque chose a cessé d'attendre. « Vous allez d'abord
incarner une résistance qui n'a pas espéré que le trône tombe tout seul. »
*(cf. lore §III.1-2)*

### Chapitre 1 — Nations Souveraines (Aiyana & Koda) — « Le rail avance »

*(texte, variante et récompense figés par le cadrage du 1er août 2026 — voir
§ Implémentation plus bas pour l'état du code)*

- **Histoire donnée avant** : 1914, un an que les Model M sortent de Rouge
  River — le rail impérial pousse déjà ses voies à travers les terres
  Lakota/Navajo/Cree/Haudenosaunee sans jamais demander la permission (le
  rail d'abord, les patrouilles ensuite). Mais Dearborn est loin : les
  mechas des garnisons de l'Ouest sont neufs et affamés, à sec de diesel et
  de pièces — un Model M à sec n'est plus une arme, c'est sept tonnes de
  tôle qui attendent qu'on vienne les cueillir. Aiyana l'a compris avant
  tout le monde ; les premiers mechas des Nations sont des patrouilles
  capturées à sec, réveillées au cuivre et au bois. Rumeur en toile de fond :
  un fragment de Wardenclyffe échangé contre du cuivre travaillé par les
  Nations circulerait depuis longtemps.
- **Variante de jeu — « Le rail avance »** : Mechas de l'Empire **ON**
  (neufs mais affamés, capables d'emprunter le rail) **+** croissance
  automatique du réseau ferroviaire impérial, 1 segment par tour de table,
  jusqu'à ce que l'Usine et tous les villages partagent la même composante
  connexe — vertu pédagogique : le joueur voit la mécanique de rail
  fonctionner avant même de poser sa première Gare.
- **Condition canon** : *Le Grand Retour* — l'objectif de faction déjà codé
  (4+ hex Plaine/Forêt contrôlés, `factions.js`) **plus** la destruction d'au
  moins 2 patrouilles impériales : reprendre la terre et prouver que les
  garnisons ne tiennent plus.
- **Récompense** : **Chantier ferroviaire**, pas le Golem — 3 cartes rencontre
  qui rejoignent le deck de tous les chapitres suivants (§5 du cadrage) :
  Gare gratuite + 3 rails, ou 2 rails seuls, toujours depuis la case du héros.
  Le Golem est retiré de ce chapitre et réintégré plus tard, avec sa propre
  logique de scénario (fragments Tesla, interlude Edison/Tesla/Ford) — hors
  périmètre pour l'instant.
- **Histoire donnée après** : Aiyana ne fait pas tomber l'Empire — elle
  prouve, avant tout le monde, que ses fissures sont réelles. Ses équipes ont
  appris à poser le rail elles-mêmes, sur les chantiers réquisitionnés : le
  réseau appartient désormais à ceux qui savent s'en servir. Le fragment de
  Wardenclyffe, lui, reste une rumeur — et quelque part ailleurs, quelqu'un
  d'autre a vu la même faiblesse, et prépare quelque chose de plus définitif.

### Chapitre 2 — Internationale Noire (sans héros) — Le Régicide

*✅ v0.18 — faction IMPLÉMENTÉE (`internationale_noire.md`, `data/factions.js`)
et chapitre JOUABLE. Condition canon « Atteindre l'Empereur » : 3 ouvriers sur
l'Usine (hex 22) — la foule qui submerge la garde de l'atelier — et 2
patrouilles impériales détruites pour percer le cordon.*

- **Histoire donnée avant** : une cellule panaméricaine de l'Internationale
  Noire, infiltrée à Rouge River depuis des années sous couvert d'ouvriers,
  a fini par obtenir ce qu'elle attend depuis le tournant du siècle : un
  accès à l'Empereur en déplacement.
- **Variante de jeu** : l'Internationale Noire selon sa fiche complète — 4
  ouvriers sur les hex 3/20/25/40, La Nage, ouvriers combattants, vol de
  mecha. Mechas de l'Empire **ON** : ce sont les patrouilles encore
  opérationnelles de Cyrus II, la faction n'a aucun mecha au départ et ne
  peut s'armer qu'en leur en prenant.
- **Condition canon (à concevoir)** : atteindre l'Empereur — piste à
  privilégier, prendre le contrôle de l'Usine (hex 22) pour représenter
  l'accès à sa visite d'inspection, ou détruire un nombre donné de
  patrouilles impériales. Condition alternative : les 6 étoiles classiques.
- **Histoire donnée après** : Cyrus II est assassiné dans un atelier
  ferroviaire de Chicago. Parce que la cohésion de l'Empire ne tenait que
  par la guerre permanente et une industrie du mecha déjà exsangue
  financièrement, ce n'est pas une crise de succession — c'est un
  effondrement total. La **Seconde Guerre Civile** commence : cent guerres
  locales simultanées. Washington se retranche sur son noyau et sur Rouge
  River, tenue par une garnison loyaliste.

### Chapitre 3 — Frente Libre (E. Rojas & Trueno) — l'éclatement

- **Histoire donnée avant** : l'Empire n'est pas né au Mexique, mais il s'y
  est étendu une génération après sa fondation — concessions minières et
  ferroviaires « exclusives, continent entier » qui ont dépossédé des
  générations avant même que Zapata prenne les armes. La nouvelle du
  régicide vient d'atteindre le Morelos.
- **Variante de jeu** : **Ruée vers l'or** (`structureBonus.js`, tuile bonus
  $ tirée en début de partie) — la course aux gisements symbolise la curée
  sur les terres mexicaines par les latifundistes financés par le
  Consortium. Déblocage de l'**Amplificateur** (bâtiment bonus) en cas de
  victoire sur l'objectif de faction — ironie du fragment tesla qui produit
  librement ce que l'Empire n'a jamais cessé d'aller extraire par la force.
- **Condition canon** : *Terre Libérée* — l'objectif de faction déjà codé
  (4 pièges posés + 2 ouvriers sur Sierras/Déserts) : la révolte s'enracine
  sur ses propres terres avant de regarder ailleurs.
- **Histoire donnée après** : Rojas et Zapata ne sont plus seuls — ce n'est
  plus une révolte régionale, c'est la **première étincelle visible** de la
  Seconde Guerre Civile qui embrase déjà tout le continent. Le joueur
  comprend que Panamerica n'a pas de « centre » géographique unique : l'Empire
  est un système d'extraction, pas un territoire, et il se défait par tous
  les bouts à la fois.

### Chapitre 4 — Confédération (J. Cole & Dixie) — la libération de Ford

- **Histoire donnée avant** : le Sud n'a jamais rejoint l'Empire de son
  plein gré — absorbé par la force en 1865, occupé militairement pendant
  cinquante ans (loi martiale, gouverneurs, garnisons — lore §III.1 et
  III.3), sans jamais renoncer à l'espoir de s'en libérer. Depuis le
  régicide (chapitre 2), une garnison loyaliste tient Rouge River fermée à
  tout le monde, Ford y compris.
- **Variante de jeu** : Mechas de l'Empire **ON**, mission centrée sur la
  prise de la case Rouge River elle-même (pas une simple patrouille croisée
  en chemin) — le joueur affronte directement la garnison loyaliste
  retranchée, **au secours de Ford** plutôt qu'en conquérant solitaire.
- **Condition canon** : **contrôler l'Usine (hex 22)** en ayant détruit la
  patrouille impériale qui l'occupait — la condition la plus littérale de
  toute la campagne, puisque c'est l'événement fondateur lui-même.
- **Histoire donnée après** : la garnison lâche prise. En échange de son
  aide, Cole obtient de Ford des facilités de paiement sur les mechas
  nécessaires à son propre projet de reconquête. Sans Empereur pour
  l'honorer, l'exclusivité de Ford ne vaut plus rien de toute façon — il
  comprend son intérêt réel (la guerre est le meilleur moteur économique) et
  rouvre le Catalogue Ford à tout le continent. **C'est cet instant précis
  qui explique pourquoi toutes les factions suivantes ont déjà accès aux
  mechas Ford dans la suite de la campagne (et dans le jeu de base).** Le
  joueur comprend aussi que Cole n'a rien libéré au nom de personne d'autre
  que lui-même — teasing du thème de la Fièvre (bascule fasciste) pour la
  suite de la campagne.

### Chapitre 5 — Bayou (Cap. Zeke & Croc) — le contrage de la Confédération

- **Histoire donnée avant** : dockers et déserteurs des docks impériaux du
  Mississippi, devenus corsaires d'un fleuve qu'ils refusent de laisser à
  l'Empire. Rouge River vient d'échapper au contrôle impérial (chapitre 4) —
  et la Confédération qui l'a libérée finance désormais sa propre reconquête
  à crédit chez Ford.
- **Variante de jeu** : Mechas de l'Empire **ON** (les patrouilles restantes,
  désormais sans commandement clair) + déblocage de l'**Éclair** (mecha
  bonus) en cas de victoire sur l'objectif de faction — cohérent avec
  l'objectif *Le Prédateur*, déjà câblé sur `empireKills` dans le code actuel
  (`factions.js`).
- **Condition canon** : *Le Prédateur* — l'objectif de faction déjà codé
  (1 mecha capturé + 2 proies vaincues) : couper les griffes de qui vient
  d'acheter son armée à crédit.
- **Histoire donnée après** : le joueur comprend que le Bayou ne convoite pas
  Rouge River par appât du gain — c'est une question de survie. Si la
  Confédération de Cole devait un jour dominer le continent avec les mechas
  qu'elle achète à crédit, le Bayou sait exactement ce qui l'attend. Premier
  affrontement d'intérêts direct entre deux chapitres de la campagne.

### Chapitre 6 — Dominion (Col. Whitfield & Sterling) — l'achèvement de l'Empire

- **Histoire donnée avant** : la finance londonienne qui a arrêté net,
  jadis, la poussée impériale vers le Canada (lore §III.1) ; mais avec
  Washington réduit à sa capitale et incapable de réagir, la prudence
  financière cède la place au calcul militaire.
- **Variante de jeu** : **Acier Brut** actif sur Rouge River (voir plus
  haut) — le chapitre où le contrôle littéral de l'arsenal impérial est
  l'enjeu, en écho direct à l'ability Commerce Impérial du Dominion.
  Déblocage du **Relais** (effet bonus) en cas de victoire sur l'objectif de
  faction — l'espionnage économique comme prolongement naturel du Commerce
  Impérial.
- **Condition canon** : *Le Tribut* — l'objectif de faction déjà codé
  (20+ pièces via Commerce Impérial) : achever l'Empire au Canada ne coûte
  rien si la campagne se paie elle-même.
- **Histoire donnée après** : le joueur y envoie les troupes du Dominion
  achever ce qui reste de la présence impériale au Canada — moins une
  conquête qu'un nettoyage. Révélation en clôture : c'est en partie l'argent
  du Dominion qui a discrètement financé l'intronisation du pantin Cyrus III
  à Washington — non par loyauté, mais parce qu'un trône fictif, même vide,
  reste plus profitable pour le commerce qu'un continent ouvertement sans
  souverain. Le Dominion n'a jamais voulu que l'Empire meure : il voulait
  juste qu'il continue à signer des papiers.

### Chapitre 7 — Acadiane (M. Thibodeau & Brume) — la redéstabilisation

- **Histoire donnée avant** : dispersée par le Grand Dérangement de 1755, un
  siècle avant l'Empire — l'Acadiane n'a jamais reconnu aucune couronne, et
  son réseau de contrebande a toujours vécu dans les failles de l'autorité.
  Le nettoyage du Dominion au Canada (chapitre 6) menace de refermer ces
  failles pour de bon — une frontière stabilisée est une frontière
  surveillée.
- **Variante de jeu** : déblocage de la **Tour Wardenclyffe** (bâtiment
  bonus) — le réseau énergétique à distance fait écho, mécaniquement, au
  réseau de comptoirs déjà propre à l'Acadiane (ability Comptoir).
- **Condition canon** : *Réseau Invisible* — l'objectif de faction déjà codé
  (4 comptoirs non adjacents entre eux, dont 1 sur un Lac) : la contrebande
  survit en restant partout et nulle part.
- **Histoire donnée après** : Thibodeau ne se contente pas de contourner la
  nouvelle autorité dominioniste — il **sabote activement** toute tentative
  de restructuration politique dans son sillage, la sienne comme celle des
  autres, et étend son réseau jusque dans l'ouest canadien, là où le
  passage du Dominion a laissé un vide administratif. Le joueur comprend
  que l'Acadiane a besoin du chaos pour se retisser, et qu'elle est prête à
  l'entretenir elle-même si personne d'autre ne s'en charge.

### Chapitre 8 — Internationale Noire (sans héros) — Le Sabotage Final

*✅ v0.18 — chapitre JOUABLE. Condition canon « Arrêter la chaîne » : tenir
l'Usine (hex 22) **3 tours de table consécutifs** (compteur remis à zéro dès
qu'on la lâche — une chaîne ne s'arrête pas parce qu'on la frappe, elle
s'arrête parce que plus personne ne la remet en marche) ET arracher 3 mechas
à l'ennemi, avec Acier Brut actif.*

- **Histoire donnée avant** : six factions armées jusqu'aux dents par Ford,
  qui s'entredéchirent, se défendent ou se conquièrent tour à tour sans
  qu'aucune ne l'emporte jamais vraiment — exactement le jeu de promotions
  que Ford entretient depuis le chapitre 4. L'Internationale Noire comprend
  que le trône n'était jamais la vraie cible : le régicide de 1915 n'a fait
  que déplacer le problème de Washington à Dearborn.
- **Variante de jeu** : même faction qu'au chapitre 2, mais dans un monde
  saturé de mechas Ford — le vol de mecha (jusqu'à 4) y trouve enfin sa
  pleine mesure, et **Acier Brut** est actif sur Rouge River pour matérialiser
  ce qu'il s'agit de tarir.
- **Condition canon (à concevoir)** : saboter Rouge River — piste à
  privilégier, tenir l'Usine (hex 22) un nombre donné de tours consécutifs
  pour représenter l'arrêt de la chaîne, ou capturer/détruire un quota de
  mechas toutes factions confondues. Se recoupe naturellement avec l'objectif
  de faction (Usine + 3 villages). Condition alternative : les 6 étoiles
  classiques.
- **Histoire donnée après** : Rouge River ne tombe pas d'un coup — elle
  s'enraye. Le pantin Cyrus III, déjà sans pouvoir réel, devient
  définitivement hors sujet. Les mechas impériaux comme les stocks de Ford,
  privés de la chaîne qui les entretenait, deviennent les « colosses
  rouillés » que le jeu de base décrit dans son texte de règles
  (`rules.js`, section Contexte). **La campagne se referme exactement là où
  commence une partie standard de Scythe Panamerica.** Dernier mot laissé en
  suspens : le Horloger (lore §II) avait raison sur un point — détruire une
  machine de guerre n'a jamais suffi à empêcher la suivante. Reste à savoir
  ce que l'Internationale Noire compte faire de ce qu'elle vient de gagner.

---

## 🧱 Implémentation — le socle est en place (v0.17)

Le mode campagne existe en jeu : bouton **📖 Campagne** sur l'écran de setup.

| Fichier | Rôle |
|---|---|
| `src/data/campaign.js` | Prologue + 8 chapitres en données : faction imposée, textes avant/après, variantes (dont `railGrowth`), condition canon, récompense débloquée. |
| `src/data/legacies.js` | Les 5 récompenses de campagne : 4 legs de Wardenclyffe + `railCards` (Chantier ferroviaire, chapitre 1). |
| `src/data/encounters.js` | `grantsFragment` tague les 16 cartes à fragment Tesla (`hasTeslaFragment`) ; `RAIL_ENCOUNTERS` (3 cartes) + `ALL_ENCOUNTERS`. |
| `src/logic/campaign.js` | Moteur pur : ordre causal, progression persistante, déblocages, condition canon, Acier Brut, verrou Tesla, croissance du rail impérial (`growEmpireRail`). |
| `src/logic/saveFile.js` | Fichier de sauvegarde exportable/importable (progression + partie en cours). |
| `src/components/CampaignScreen.jsx` | Écran de campagne : reprise, chapitres, histoire, variante, choix du plateau, vitrine des récompenses, export/import. |
| `src/logic/__tests__/campaign.test.js` | 29 tests (ordre causal, déblocages, persistance, conditions canon, Acier Brut, verrou Tesla, croissance du rail — convergence sur 200 tours). |
| `src/logic/__tests__/saveFile.test.js` | 8 tests (aller-retour export/import, fichiers étrangers ou trafiqués). |
| `src/logic/__tests__/encounters.test.js` | Structure et effets des `RAIL_ENCOUNTERS`, résolution bot (Gare + 2 rails). |

**Chapitre 1 — « Le rail avance » (cadrage du 1er août 2026) : vérifié en
partie réelle** (8 tours, navigateur), pas seulement en test unitaire — le
réseau impérial pousse un segment par tour vers les villages puis vers
l'Usine, une patrouille a été observée roulant sur le réseau (`🛤 (rail)` au
journal), et le verrou Tesla (deck de rencontres + vitrine de l'Usine) est
actif dès le lancement du chapitre, sans effet en partie libre.

**Sauvegarde — une campagne se joue sur plusieurs sessions, pas d'un trait :**

- **Automatique, deux niveaux.** La progression (chapitres terminés + legs) est
  écrite dans `localStorage` sous `pa-campagne` à chaque fin de chapitre ; la
  partie en cours est autosauvegardée sous `pa-save` **à chaque début de tour
  humain**, plateau au repos, avec le chapitre et la pile d'acier. Fermer
  l'onglet en cours de chapitre ne coûte au pire que le tour entamé.
- **Reprise** depuis l'écran de campagne comme depuis l'écran de setup :
  « Reprendre — chapitre N · tour T ».
- **Fichier exportable** (`💾 Exporter`) : un `.json` qui embarque progression,
  legs ET partie en cours, nommé `scythe-campagne-<n>sur8-<date>.json`. C'est
  la seule protection contre un nettoyage de cache ou un changement de machine
  — le `localStorage` d'un HTML ouvert en local ne survit ni à l'un ni à
  l'autre. L'import demande confirmation, résume ce qu'il va écraser, et
  refuse proprement un fichier étranger (journal de partie, JSON cassé,
  format plus récent) ; un fichier trafiqué est nettoyé (chapitres et legs
  inconnus retirés) plutôt que rejeté.

**Arbitrages pris à l'implémentation** (le document restait ouvert dessus) :

- **Chapitres 2 et 8 jouables (v0.18).** L'Internationale Noire est
  implémentée : `data/factions.js` (sans héros, ancrages #3/#20/#25/#40, La
  Nage, ouvriers combattants, vol de mecha ×4), plateau dédié « Le Réseau »
  (`MATS_CAMPAIGN`, id 200), réserve hors-plateau et réentrée près d'un
  ancrage (`logic/player.js`), capacités volées (`stolenCombat`/
  `stolenPosition`). Elle reste hors de la rotation standard : `FACTION_IDS`
  l'exclut, aucun bot ne peut la tirer.
- **Legs uniquement sur la voie canon.** Terminer un chapitre aux 6 étoiles le
  valide et ouvre le suivant, mais ne donne pas la récompense de Tesla — la
  voie narrative reste la seule à payer.
- **Chapitre validé = fin de partie déclenchée par le joueur** (condition canon
  remplie, ou ses propres 6 étoiles). Un bot qui atteint 6 étoiles le premier
  met fin à la partie et le chapitre est manqué — rejouable.
- **Ruée vers l'or (chapitre 3)** = tuile bonus **Terres Lointaines** forcée au
  lieu du tirage (1$ par hex de distance à sa base : l'accaparement des terres
  éloignées). À rebasculer sur `monts_forets` en changeant un seul id si la
  lecture « gisements miniers » l'emporte.
- **Acier Brut** : Rouge River fabrique 1 métal par tour ; tant que personne ne
  tient l'Usine **seul**, la pile monte, et le premier arrivé la ramasse
  ENTIÈRE (contestée, elle ne part pas). Le métal atterrit sur l'hex 22 — il ne
  compte donc au score que tant qu'on tient la place.
- **Progression persistante** dans `localStorage` sous `pa-campagne`
  (chapitres terminés + legs), indépendante de la sauvegarde de partie
  `pa-save`, qui embarque désormais le chapitre en cours et la pile d'acier.

## 📋 État du chantier — reste à faire

**Design — tranché, prêt à coder**
- Trame narrative complète : prologue + 8 chapitres, ordre causal verrouillé.
- 5 récompenses de campagne (Tour, Éclair, Amplificateur, Relais, Chantier
  ferroviaire) et leur chapitre de déblocage.
- Conditions canon des 6 chapitres à faction (toutes adossées à des `fObj`
  **déjà codés** dans `factions.js`, sauf le chapitre 4 qui exige le contrôle
  de l'hex 22).
- Fiche complète de l'Internationale Noire (`internationale_noire.md`).

**Design — encore ouvert**
- Mécanique de scénario des chapitres 2 et 8 (infiltration, sabotage) — seules
  des pistes sont posées (`canonDraft` dans `campaign.js`).
- Les 8 questions ouvertes de `internationale_noire.md` §10 (rencontres par
  ouvrier, plateau dédié, slot Vitesse, nom de l'objectif…).
- Rééquilibrage de `MATS_ORIGINAL` (ordre du tour absent) avant de sortir les
  7 plateaux du jeu original de la réserve.

**Code — ce qui reste**
- **Effets en jeu des 4 legs de Wardenclyffe** (Tour, Éclair, Amplificateur,
  Relais) : le déblocage est enregistré et affiché, aucun effet n'est branché
  au moteur (`implemented: false`). `railCards` (chapitre 1), lui, a un effet
  RÉEL — voir plus haut. Chaque legs restant touche un système différent —
  bâtiment, Produce, vol de ressource — donc un par un.
- **Le Golem** : retiré du périmètre (voir § Legs de Wardenclyffe), à
  réintégrer avec son propre chapitre/interlude — nécessite d'abord
  l'amendement de lore §6.5 du cadrage du 1er août 2026 (rôle actif d'Edison,
  saisie du labo orchestrée par Ford).
- **Déblocages du contenu original** : `PLANS_ORIGINAL` et
  `OBJECTIVES_ORIGINAL` restent en réserve, aucun chapitre ne les distribue
  encore.
- **Faction Internationale Noire** : voir les 7 points de
  `internationale_noire.md` §11 — dont la **factorisation préalable** du compte
  d'unités combattantes (8 sites dupliqués entre UI et moteur headless).
- **Mode API / headless** (`headlessGame.js`) ignore la campagne : pas de
  chapitre, pas d'Acier Brut, pas de croissance du rail, pas de verrou Tesla,
  pas de condition canon — les parties d'agents restent des parties libres.
- **Bots et Acier Brut** : les bots ne savent pas que la pile existe (aucun
  aimant vers l'Usine au-delà de l'aimant Rouge River déjà présent).
- **Rythme de croissance du rail** (chapitre 1) : 1 segment/tour de table,
  non mesuré en simulation — si la mobilité gratuite s'avère trop généreuse,
  le levier simple est de passer à 1 segment tous les 2 tours
  (`growEmpireRail` n'est appelé qu'une fois par tick, il suffit de
  conditionner l'appel dans `App.jsx`).

**Bon à savoir (vérifié)**
- La règle « 1 carte de combat par unité combattante engagée » est **déjà
  correctement implémentée** partout (`App.jsx:3297`, `headlessGame.js:577`…) —
  rien à corriger, contrairement à ce qu'on a cru un moment.
- Les ouvriers chassés coûtent déjà de la popularité à l'attaquant
  (`App.jsx:1931`).
- Le transport groupé d'ouvriers par mecha existe déjà (`transport.js`).

---

*Ce document est une base de travail, ouverte à l'itération. L'ordre des huit
chapitres est contraint par les dépendances causales décrites plus haut ; le
reste peut bouger.*
