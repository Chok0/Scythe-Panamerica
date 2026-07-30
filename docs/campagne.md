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
- Implémentation à faire : un flag de partie type `empireRouilleSteel: true`
  qui active la génération passive sur la case Rouge River (hex marqué
  `factory` dans `hexes.js`) et son ramassage automatique par le contrôleur.

## ⚙ Catalogue Ford — un deck purement martial

Le Catalogue Ford (Model M, Trimotor, River Rouge Special, Iron Horse) reste
tel quel : que des mechas, rien que des mechas — Ford ne pense qu'en usines
et en colosses. Les idées de bâtiment ou d'effet passif appartiennent à
Tesla, pas à lui — voir la section suivante.

## 🔧 Les legs de Wardenclyffe — 5 récompenses de campagne, pas des cartes d'usine

Le Golem, la Tour Wardenclyffe, l'Éclair, l'Amplificateur et le Relais ne
sont **pas** des Plans à piocher au Catalogue Ford — ce sont des **objets
hors catalogue**, débloqués par les scénarios de campagne, cachés dans le
sous-sol scellé que Ford n'a jamais réussi à ouvrir en entier :

- **Le Golem** — **mecha bonus** : un mecha supplémentaire (pas un Plan),
  alimenté sans fil (aucune ressource Énergie), déplaçable à distance depuis
  n'importe quelle case où se trouve le héros. 1 sur un dé à chaque combat :
  il s'arrête (systèmes instables sans leur créateur).
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

*Texte seul, pas de partie.* Pose le décor : 1865, un général soutenu (pas
fabriqué) par les industriels du Nord se couronne Empereur sur les ruines de
la Sécession — le Consortium aide l'Empire à naître, il ne l'est pas. Cyrus I
pousse la reconquête jusqu'au Mexique et jusqu'aux abords du Canada,
absorbant le Sud vaincu par la pure force militaire, sans le moindre
compromis. Cinquante ans d'occupation continentale plus tard, l'arrivée et
la trahison de Tesla ont fait de Rouge River l'arsenal exclusif du trône
(Cyrus II, 1913) — juste au moment où l'immensité de l'Empire commence à
l'épuiser financièrement et où le Consortium referme son crédit. Le trône
tient encore, mais des lézardes apparaissent déjà aux marges du continent.
« Vous allez d'abord incarner une résistance qui n'a pas attendu que le
trône tombe tout seul. » *(cf. lore §III.1-2)*

### Chapitre 1 — Nations Souveraines (Aiyana & Koda) — la résistance active

- **Histoire donnée avant** : le rail impérial a tracé ses voies à travers
  les terres Lakota/Navajo/Cree/Haudenosaunee sans jamais demander la
  permission. L'Empire tient encore, formellement, mais ses garnisons de
  l'Ouest tournent depuis des années avec des effectifs réduits et un
  ravitaillement de plus en plus irrégulier — la rumeur d'un fragment
  d'équipement de Wardenclyffe exfiltré avant la saisie du labo de Tesla, et
  échangé contre du cuivre travaillé par les Nations, circule depuis
  longtemps.
- **Variante de jeu** : Mechas de l'Empire **ON** — des patrouilles encore
  formellement commandées depuis Washington, mais déjà visiblement usées.
  Déblocage du **Golem** (mecha bonus) en fin de partie si l'objectif de
  faction est rempli — la métallurgie cuivre/bronze des Nations est, dans le
  lore, la plus proche des alliages tesliens.
- **Condition canon** : *Le Grand Retour* — l'objectif de faction déjà codé
  (4+ hex Plaine/Forêt contrôlés, `factions.js`) **plus** la destruction d'au
  moins 2 patrouilles impériales : reprendre la terre et prouver que les
  garnisons ne tiennent plus.
- **Histoire donnée après** : Aiyana ne fait pas tomber l'Empire — elle
  prouve, avant tout le monde, que ses fissures sont réelles. La piste du
  Golem confirme (ou infirme, sans trancher) la rumeur. Le joueur comprend
  qu'ailleurs, quelqu'un d'autre a vu la même faiblesse et prépare quelque
  chose de plus définitif.

### Chapitre 2 — Internationale Noire (sans héros) — Le Régicide

*⚠ Faction spécifiée (`internationale_noire.md`) mais pas encore implémentée ;
la mécanique de scénario ci-dessous reste à concevoir.*

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

*⚠ Faction spécifiée (`internationale_noire.md`) mais pas encore implémentée ;
la mécanique de scénario ci-dessous reste à concevoir.*

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

## 📋 État du chantier — reste à faire

**Design — tranché, prêt à coder**
- Trame narrative complète : prologue + 8 chapitres, ordre causal verrouillé.
- 5 legs de Wardenclyffe (Golem, Tour, Éclair, Amplificateur, Relais) et leur
  chapitre de déblocage.
- Conditions canon des 6 chapitres à faction (toutes adossées à des `fObj`
  **déjà codés** dans `factions.js`, sauf le chapitre 4 qui exige le contrôle
  de l'hex 22).
- Fiche complète de l'Internationale Noire (`internationale_noire.md`).

**Design — encore ouvert**
- Mécanique de scénario des chapitres 2 et 8 (infiltration, sabotage) — seules
  des pistes sont posées.
- Les 8 questions ouvertes de `internationale_noire.md` §10 (rencontres par
  ouvrier, plateau dédié, slot Vitesse, nom de l'objectif…).
- Rééquilibrage de `MATS_ORIGINAL` (ordre du tour absent) avant de sortir les
  7 plateaux du jeu original de la réserve.

**Code — rien n'est implémenté**
- Flags de partie à créer : Mechas de l'Empire par chapitre, `Acier Brut`
  (`empireRouilleSteel`), Ruée vers l'or forcée, déblocage des legs.
- Faction Internationale Noire : voir les 7 points de
  `internationale_noire.md` §11 — dont la **factorisation préalable** du compte
  d'unités combattantes (8 sites dupliqués entre UI et moteur headless).
- Les 2 nouveaux legs (Amplificateur, Relais) n'existent pas en données.
- Aucune notion de « campagne » n'existe encore côté code : ni progression, ni
  enchaînement de chapitres, ni persistance des déblocages.

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
