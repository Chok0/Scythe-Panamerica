# L'Internationale Noire — fiche de faction

> **Statut : IMPLÉMENTÉE (v0.18).** Entrée `internationale` dans
> `src/data/factions.js`, plateau dédié « Le Réseau » (id 200,
> `MATS_CAMPAIGN`), capacités dans `combat.js` / `mechAbilities.js` /
> `movement.js`, bases de repli dans `logic/player.js`,
> interface et vol de mecha dans `App.jsx`. Les chapitres 2 (Le Régicide) et
> 8 (Le Sabotage Final) de `docs/campagne.md` sont jouables.
> Tests : `src/logic/__tests__/internationale.test.js` (20 cas).
>
> Elle n'entre **jamais** dans une partie standard : `FACTION_IDS` l'exclut
> (`campaignOnly: true`), donc ni l'écran de setup ni le tirage des bots ne
> peuvent la sortir. Lore : `lore_1920_plus.md` §II.
>
> **Arbitrages rendus à l'implémentation** (les questions ouvertes du §10) :
>
> | # | Question | Décision |
> |---|---|---|
> | 1 | Les ouvriers déclenchent-ils les rencontres ? | **Oui, sans plafond** (révisé le 11/08). Le garde-fou « une par tour » a été essayé puis retiré au premier test réel : atteindre deux jetons dans le même tour coûte déjà deux déplacements, et n'en résoudre qu'un laissait le second sur la carte sans le dire. Les rencontres se jouent l'une après l'autre dans la file de fin de déplacement. |
> | 2 | pop/pièces hors `mats.js` | **Plateau dédié « Le Réseau » (id 200)**, 4♥/3$ — l'invariant « la fiche de faction ne porte que le militaire » est préservé. Grammaire du jeu de base respectée (Σ13, Σ6$, 6 cases). |
> | 3 | Étoile des mechas via Deploy ou captures | **Captures uniquement.** L'action Deploy paie son coût, encaisse son bonus $, et ne pose rien. |
> | 4 | Sort du slot 0 (Vitesse) | **Reste un slot à débloquer.** Le donner d'emblée n'aurait rien fait : la faction n'a ni héros ni mecha au départ, et Vitesse n'affecte pas les ouvriers. |
> | 5 | Nom de l'objectif de faction | **« L'Usine aux Ouvriers »** — Usine (hex 22) + 3 villages. |
> | 6 | Capacité de combat propre (slot 2) | **Sabotage** : +1 carte si ≥2 ouvriers alliés sur l'hex — elle prolonge la dérogation des ouvriers combattants au lieu de la doubler. |
> | 7 | Winrate & fréquence des stacks | **Non mesuré** : la faction est réservée au joueur humain en campagne, aucun bot ne la joue — `simulate.mjs` ne peut donc pas la mesurer. À reprendre le jour où un profil de bot existera. |
> | 8 | Mécanique de scénario des chapitres 2 et 8 | **Tranchée** : ch2 = 3 ouvriers sur l'Usine + **2 mechas VOLÉS** (à n'importe quelle faction — détruire est ce que cette faction refuse de faire, et son compteur propre est `capturedMech`) ; ch8 = 3 tours consécutifs sur l'Usine + 3 mechas arrachés. |
> | 9 | Les mechas « gratuits » (rencontre, carte d'usine) — arbitrage du 19/08 | **Fermés.** L'option « +1 mecha » disparaît de son triptyque de rencontre et le gain « 1 Mecha » de l'usine est passé : sinon une rencontre remplissait l'étoile des 4 mechas sans une seule capture, à rebours de la ligne 3. Verdict de partie : *« mech déployable uniquement par victoire dans un combat contre un mech + ressources »*. |
> | 10 | Voler deux fois la même capacité — arbitrage du 19/08 | **Interdit, et dit.** Une capacité déjà au réseau est **grisée** dans la modale de vol (Vitesse une fois acquise ; slots 2/3 si la provenance est déjà cette faction). S'il ne reste rien à prendre, le mecha se relève quand même — **carcasse nue**, sans pouvoir, par un bouton explicite : la capture compte, le joueur sait ce qu'il paie. |
>
> **Écarts assumés par rapport à la spec ci-dessous :**
> - **Les hex #3/#20/#25/#40 ne sont PAS des hex de base** (§3 proposait
>   `hMap[id].base`). Ce sont des hex de terrain normaux, praticables par les
>   six autres factions : les marquer `base` aurait interdit ces quatre hex à
>   tout le monde et cassé la carte. Ce sont les **sorties** des quatre vraies
>   bases de la faction (hexes 910-913, hors plateau) : c'est par là qu'elle
>   entre au tour 1, et par là que ressortent ses unités repliées.
> - **Vol de capacité** : le mecha capturé apporte la capacité de combat ou de
>   position de SA faction (`stolenCombat` / `stolenPosition`), Vitesse restant
>   commune. Un nouveau vol remplace le précédent — le patchwork se refait.
>   Le riverwalk volé n'est jamais proposé : Résilience le rend inutile.
>   Une capacité volée doit **fonctionner** : Pack Up (slot 3 des Nations) se
>   lisait sur `me.faction` et ne faisait donc strictement rien une fois arraché
>   — il lit `positionFactionOf(player)` depuis le 19/08, la convention que
>   `movement.js` appliquait déjà pour les bonds de terrain.
>
> **Correctif du 04/08 — deux capacités inventées, retirées.** Une première
> passe avait meublé les slots libres avec des capacités MAISON (« Passeurs »,
> ouvriers à 2 pas, et « Tunnels », bond d'ancrage en ancrage). Le §7 dit
> l'inverse : les quatre slots classiques « n'ont plus de sens pour une faction
> qui ne déploie pas — ils sont remplacés par les capacités volées ». Pire,
> « Passeurs » annulait le premier des quatre freins du §5 (le regroupement
> d'ouvriers est LENT, et c'est ce qui rend le pic de 9 cartes acceptable).
> Les deux sont supprimées : les slots 1 à 3 n'affichent plus que ce que la
> faction a arraché, et un mecha gratuit (rencontre, carte d'usine) ne débloque
> plus rien pour elle.

## 1. Le principe

L'Internationale Noire est la seule faction du jeu **sans héros**. Là où les
six autres factions sont des puissances territoriales qui produisent, bâtissent
et déploient, elle est un réseau clandestin qui **n'a rien à défendre et rien à
produire d'origine** : ses mechas, elle les vole ; son territoire, elle
l'infiltre ; sa force, c'est le nombre.

Conséquence de design : c'est la faction la plus faible du jeu en duel
d'unités, et la plus dangereuse en masse. Toute sa courbe de puissance repose
sur une manœuvre lente et coûteuse — rassembler ses ouvriers — que l'adversaire
peut voir venir et contrer.

## 2. Statistiques de départ

| | Valeur | Comparaison au roster |
|---|---|---|
| **Puissance** (`power`) | **2** | À égalité avec le plancher (Frente, Acadiane, Bayou) |
| **Cartes de combat** (`cards`) | **1** | Le plus bas du jeu (les autres : 1 à 3) |
| **Popularité** (`pop`) | **4** | Le plus haut du jeu (mats standard : 2 à 4) |
| **Pièces** (`coins`) | **3** | Sous le plancher des mats standard (4 à 7) |
| **Ouvriers** | **4** | Les autres commencent à 2 |

La popularité de départ à 4 n'est pas un cadeau : c'est la **monnaie de survie**
de la faction. Chaque ouvrier chassé d'un hex coûte de la popularité à celui qui
le chasse (règle standard, `App.jsx:1931`) — mais l'Internationale Noire, qui
joue en masse et perd des ouvriers en permanence, a besoin de ce coussin pour
ne pas s'effondrer au scoring final.

⚠ **Note d'équilibrage** : pop et pièces de départ sont normalement portées par
le plateau joueur (`mats.js`), pas par la fiche de faction (`factions.js`) —
invariant explicite documenté en tête de `factions.js`. L'Internationale Noire
**viole cet invariant** puisqu'elle n'a pas d'économie de plateau classique. À
l'implémentation, décider : plateau dédié (id 200 ?) ou surcharge assumée dans
la fiche de faction, avec commentaire justifiant l'écart.

## 3. Quatre bases, quatre sorties — hex 3, 20, 25, 40

Pas de base de faction unique : elle en a **quatre**, et les hex **3, 20, 25
et 40** sont leurs **sorties** — les portes par lesquelles le réseau entre sur
le plateau et par lesquelles ses unités vaincues y reviennent.

**Ce que la carte dit de ces quatre hex** (vérifié dans `hexes.js`) :

| Hex | Terrain | Particularité |
|---|---|---|
| 3 | marécage | ✦ lieu de rencontre |
| 20 | marécage | — |
| 25 | marécage | — |
| 40 | désert | ✦ lieu de rencontre |

### QUATRE bases, pas une (arbitrage du 09/08)

Un réseau clandestin n'a pas de capitale : là où les six autres factions
tiennent **un** drapeau, elle en tient **quatre**, un par cellule
(`NETWORK_BASES` dans `hexes.js` — hexes 910 à 913, invisibles et hors du
score comme toutes les bases). Un ouvrier démarre sur chacune, et le tour 1
sert à les sortir sur le plateau : chaque base donne sur SON hex, et les
règles de déplacement normales prennent le relais.

| Base | Drapeau | Sortie |
|---|---|---|
| 910 | nord-ouest | **#3** (marécage) |
| 911 | est | **#20** (marécage) |
| 912 | ouest | **#25** (marécage) |
| 913 | sud | **#40** (désert) |

Pourquoi les ouvriers ne sont **pas** posés directement sur #3/#20/#25/#40 :
**deux de ces hex portent un lieu de rencontre**, et une rencontre ne se
déclenche qu'en **ENTRANT** sur l'hex. Les y poser à l'installation tuait ces
deux rencontres pour la seule faction dont les ouvriers les déclenchent — elle
n'a pas de héros (§10.1). Deux des dix rencontres de la carte étaient perdues
d'avance, constaté en partie le 09/08. En sortant de sa base, l'ouvrier ENTRE
sur l'hex : la rencontre se joue.

Ce que ça change au jeu :

- Le réseau **arrive** au lieu d'être déjà là — c'est sa fiction même — mais
  ses pions sont **visibles dès l'installation**, sur leurs drapeaux.
- Les tours 1 et 2 voient leur action Déplacement absorbée par les sorties
  (deux unités par Move). Le bas de plateau reste jouable.
- Ses deux rencontres de départ lui reviennent, sans plafond (§10.1, révisé).

> **Version abandonnée.** Un premier essai mettait les quatre ouvriers en
> **réserve hors-plateau** avec remontée payante : le joueur ouvrait la partie
> sans un seul pion sur la carte, et devait comprendre un mécanisme propre à
> la faction avant d'avoir joué un coup. La réserve a d'abord survécu pour
> encaisser les défaites — puis a été retirée de là aussi le 11/08 (voir
> « Repli sur une planque » ci-dessous). Elle n'est plus qu'un filet interne.

Trois marécages sur quatre : c'est thématiquement juste (le réseau clandestin
vit dans ce que personne ne veut traverser) **et mécaniquement défensif** — le
marécage impose un péage de -1♥/-1⚡ à quiconque y entre (`marshToll`,
`movement.js:140`). Approcher l'Internationale Noire coûte quelque chose à tout
le monde…

…**sauf au Bayou**, dont le Sang du Marais annule péage et arrêt forcé
(`marshFree`, `movement.js:32`). Le Bayou est donc le prédateur naturel de
l'Internationale Noire, gratuitement. Émergence heureuse à conserver — mais à
mesurer : trois des quatre sorties sont en accès libre pour cette faction.

### Repli sur une planque, au choix

Quand une unité est vaincue, elle se replie **sur une base**, comme dans toute
autre faction. La seule différence : l'Internationale Noire en a **quatre**, et
c'est le **joueur qui désigne laquelle** — les six autres n'ont pas ce choix
parce qu'elles n'ont qu'une base.

> **Révisé le 11/08.** La première implémentation envoyait les unités vaincues
> dans une *réserve hors-plateau* avec remontée payante près d'un ancrage.
> Verdict de playtest : « ce n'est pas le comportement attendu ». Les pions
> disparaissaient de la carte, la mécanique était parallèle à celle de tout le
> reste du jeu, et rien ne la justifiait — une base est une base. La réserve ne
> subsiste que comme **filet interne** de `retreatFromHex` (une faction sans
> aucune base laisserait sinon ses unités sur l'hex qu'elle vient de perdre) ;
> aucune faction du jeu n'y tombe.

Une unité posée sur une planque en ressort **par la sortie de cette planque**,
au prix d'un déplacement — exactement comme le héros d'une autre faction quitte
sa base. Occuper une sortie bloque uniquement **cette porte-là**. Étouffer la
faction exige donc d'immobiliser des unités sur **quatre hex dispersés
simultanément** — un coût de coordination réel, jamais un accident.

Résultat net : l'Internationale Noire est **plus résiliente au blocage** que
n'importe quelle faction normale, pas moins. C'est voulu — c'est sa
compensation pour l'absence de héros et d'économie propre.

**Le coup le plus cher de la faction**, et il ne se voit pas venir : un mecha
qui transporte six ouvriers et perd sa bataille replie **sept unités** d'un
coup sur la même planque, à un déplacement chacune pour ressortir. C'est légal
et symétrique — une faction normale paie le même prix depuis sa base — mais
c'est un tour de jeu entier effacé, décidé au moment où l'on charge le mecha.

## 4. Capacité de faction — Résilience

**Résilience** remplace **entièrement** le Riverwalk (il n'y a pas de riverwalk
en plus : le slot 1 de mecha est libéré, voir §7).

> Toutes les unités de l'Internationale Noire — **ouvriers comme mechas** —
> traversent **toutes** les rivières, sans restriction de terrain, dès le
> tour 1, **et ignorent les marécages** : ni péage (-1♥/-1⚡), ni arrêt forcé.

C'est le pendant direct du « Seaworthy » nordique du jeu original, et elle
absorbe au passage l'équivalent du Sang du Marais du Bayou : une capacité de
faction active immédiatement, pas un déblocage de mecha. Là où chaque autre
faction paie un mecha pour ouvrir deux terrains de franchissement,
l'Internationale Noire circule librement sur tout le réseau hydrographique du
plateau — c'est sa mobilité qui compense sa faiblesse en combat individuel.

L'immunité aux marécages n'est pas un bonus gratuit : **trois de ses quatre
sorties de base SONT des marécages** (§3). Les lui taxer revenait à lui faire
payer sa propre géographie à chaque entrée en jeu, alors que le marécage est
précisément ce qui la protège — l'ennemi, lui, paie toujours pour venir la
chercher (sauf le Bayou, §3).

## 5. Combat — les ouvriers sont des combattants

**Règle générale du jeu (déjà correctement implémentée)** : chaque camp engage
au maximum **1 carte de combat par unité combattante** présente — héros et
mechas uniquement. Les ouvriers ne combattent pas, et les chasser coûte de la
popularité à l'attaquant. Vérifié dans `App.jsx:3297-3305`, `headlessGame.js:577`,
`914`, `979`, `1037-1049`. **Rien à corriger de ce côté.**

**Dérogation propre à l'Internationale Noire** : ses ouvriers **comptent comme
unités combattantes**. Chacun autorise donc une carte de combat supplémentaire.

Plafond théorique : **8 ouvriers + 1 mecha sur le même hex = 9 cartes engagées**
dans une seule bataille. C'est de très loin le pic de puissance le plus élevé du
jeu.

### Pourquoi ce n'est pas cassé

Quatre freins structurels, tous déjà dans les règles :

1. **Le regroupement est lent.** Les ouvriers se déplacent **individuellement**
   — une unité déplacée par point de mouvement. Les grouper d'un coup exige
   qu'un mecha les **transporte**, et un mecha n'emporte que les ouvriers déjà
   présents **sur son hex de départ** (`transport.js:18-29`). Monter un stack
   de 9 prend donc plusieurs tours de convergence préalable, à découvert.
2. **Un stack est un aveu.** Huit ouvriers sur un hex, c'est zéro ouvrier
   partout ailleurs : aucune production ce tour-là (les ouvriers ne produisent
   que sur leur hex de ressource) et tout le reste du territoire découvert.
3. **Le combat ne rapporte que 2 étoiles.** Règle de base inchangée :
   *« Gagner un combat (max 2 étoiles) »* (`rules.js`). Impossible de
   construire une victoire à 6 étoiles sur le seul spam de bataille.
4. **La main de cartes est le vrai plafond.** 9 unités n'autorisent 9 cartes
   que si le joueur en a 9 en main — or il démarre à **1** et n'en gagne qu'au
   compte-gouttes (`Math.min(p.combatCards, units + bonus)` borne déjà tout).

⚠ **À mesurer en simulation** avant de figer : le winrate de la faction et la
fréquence réelle des stacks ≥5 unités. Tout le roster actuel a été calibré sur
des mesures (voir les commentaires v0.15 de `factions.js`), pas sur des
intuitions — celle-ci ne doit pas faire exception.

## 6. Vol de mecha — l'étoile des mechas, autrement

L'Internationale Noire ne construit aucun mecha. Elle les **prend**.

- **Déclencheur** : remporter un combat contre une unité **mecha** adverse.
- **Coût** : payer le coût de déploiement d'un mecha (métal, selon le plateau).
  Si le joueur ne peut pas ou ne veut pas payer, le mecha est simplement
  détruit comme d'habitude.
- **Effet** : le mecha vaincu **change de camp** — il devient un mecha de
  l'Internationale Noire, posé sur l'hex du combat.
- **Plafond** : **4 mechas** capturés au total, ce qui remplit l'étoile
  « Déployer les 4 Mechas » du plateau de triomphes.
- **Bonus** : à chaque capture, le joueur choisit **une capacité parmi celles
  que la victime a encore à donner** (`stealableSlots(factionId, player)`,
  data/mechAbilities.js) et l'acquiert définitivement. Ce que la victime n'a
  plus à donner (correctif du 19/08) : **Vitesse** une fois qu'elle est au
  réseau — elle est commune à tout le roster, personne ne la redonne — et son
  **slot 2 ou 3** si le réseau tient déjà la capacité de CETTE faction. Une
  autre faction reste un vrai choix : le patchwork se refait, la modale annonce
  « remplace *X* ». Une patrouille impériale n'offre que Vitesse et son
  Blindage ; toute faction sans capacité de position n'offre pas de slot 3.
- **Carcasse nue** : quand plus rien n'est à prendre, le mecha se relève sans
  capacité — au même prix, et sur un bouton distinct. Il compte pour
  `capturedMech` (donc pour les conditions canon des chapitres 2 et 8).

C'est la mécanique signature de la faction : son arsenal est un **patchwork
volé**, exactement comme les mechas-Spectres des Moissonneurs décrits dans le
lore (§II) — « un bras rusviet, des jambes saxonnes, un torse polanian ».

Précédent existant à réutiliser : la **Chimère** du Bayou capture déjà un mecha
en combat (`combat.js:30`, `App.jsx:1940-1943`) — même logique, mais 1×/partie
au lieu de 4, et sans vol de capacité. Le code de capture existe donc déjà en
partie.

## 7. Actions modifiées

### Deploy (bas de plateau) — paie, encaisse, ne déploie rien

L'action garde son **coût en métal** et son **gain en pièces** habituels, mais
**ne pose aucun mecha** : les mechas de l'Internationale Noire arrivent
exclusivement par le vol en combat (§6). **Conséquence d'interface (19/08)** :
la colonne n'a **aucune cible sur la carte** — ni hex surligné, ni bouton
« ⬡ #hex » — mais un bouton unique « Écouler les pièces détachées », et elle
reste jouable à 4 mechas volés (c'est une conversion, pas un déploiement). Mécaniquement, c'est « comme si le
mecha avait déjà été déployé » — l'action reste un vrai choix économique
(convertir du métal en or et avancer sur la piste d'améliorations), jamais un
gain gratuit.

⚠ **À trancher à l'implémentation** : est-ce que la case Deploy consommée
compte quand même pour l'étoile des 4 mechas, ou est-ce que cette étoile
dépend **uniquement** des 4 captures ? Recommandation : **uniquement les
captures** — sinon la faction obtient l'étoile sans jamais livrer bataille, ce
qui contredit toute son identité.

### Slots de mecha

Le slot 1 (Riverwalk) est libéré, Résilience étant déjà une capacité de faction
(§4). Les 4 slots de capacité classiques n'ont plus de sens pour une faction
qui ne déploie pas — ils sont remplacés par les **capacités volées** (§6).

⚠ **À trancher** : que devient le slot 0 (Vitesse, +1 mouvement, commun à
toutes les factions) ? Piste : le conserver comme capacité de faction acquise
d'emblée, ce qui colle au thème (les Passeurs sont des gens qui se déplacent) et
compense la lenteur du regroupement d'ouvriers.

## 8. Objectif de faction

> **Contrôler l'Usine et 3 villages.**

Sur la carte actuelle (`hexes.js`) : l'Usine est l'**hex 22**, et il y a
**7 villages** — hex 4, 6, 14, 27, 35, 36, 46. Il faut donc tenir
**4 hex simultanément**, dont le centre le plus disputé du plateau.

Les villages sont répartis nord (4, 6, 14) et sud (27, 35, 36, 46) : l'objectif
force un **étalement territorial** réel, exactement l'inverse de la manœuvre de
stack (§5). C'est le contrepoids voulu — on ne peut pas gagner en empilant tout
sur un hex.

À nommer (les autres objectifs de faction ont tous un titre : *Le Joug*,
*Terre Libérée*, *Le Grand Retour*, *Réseau Invisible*, *Le Prédateur*,
*Le Tribut*). Pistes : **La Grève Générale**, **Le Réseau Debout**,
**L'Usine aux Ouvriers**.

## 9. Conditions de victoire en campagne

Règle générale de la campagne, valable pour **tous** les chapitres : chaque
partie offre **deux voies de victoire**, et la première atteinte l'emporte.

1. **La condition canon du scénario** — alignée sur le morceau d'histoire du
   chapitre (ex. chapitre 2 : atteindre l'Empereur ; chapitre 8 : saboter Rouge
   River). C'est la voie « narrative ».
2. **La condition classique des 6 étoiles** — le jeu standard, inchangé. C'est
   la voie « joueur qui ignore le scénario ».

Cette double voie évite le piège du scénario dirigiste : le joueur qui veut
jouer sa partie comme d'habitude peut gagner sans suivre le script, et le
joueur qui joue l'histoire est récompensé pour ça.

## 10. TODO / questions ouvertes

| # | Question | Recommandation |
|---|---|---|
| 1 | **Rencontres** : chaque ouvrier agit-il comme un héros (déclenche les rencontres) ? | ⚠ Risque d'inflation : 4 ouvriers = 4× l'accès aux rencontres du reste du roster, et **les hex 3 et 40 sont eux-mêmes des lieux de rencontre** — deux rencontres seraient déclenchables dès le tour 1. À trancher et mesurer. Piste de garde-fou : une seule rencontre par tour, ou seul un ouvrier « désigné » les déclenche. |
| 2 | pop/pièces hors `mats.js` (viole l'invariant, §2) | Plateau dédié id 200, ou surcharge documentée |
| 3 | L'étoile des mechas via Deploy ou uniquement captures (§7) | Uniquement les captures |
| 4 | Sort du slot 0 (Vitesse) (§7) | Acquis d'emblée comme capacité de faction |
| 5 | Nom de l'objectif de faction (§8) | À choisir parmi les pistes |
| 6 | Capacité de combat (slot 2) — la faction en a-t-elle une en propre ? | Probablement non : les ouvriers-combattants **sont** sa capacité de combat |
| 7 | Winrate & fréquence des stacks ≥5 (§5) | À mesurer via `scripts/simulate.mjs` avant de figer |
| 8 | Mécanique de scénario des chapitres 2 et 8 (infiltration / sabotage) | Chantier distinct — cette fiche couvre la faction, pas les deux scénarios |

## 11. Notes d'implémentation

Les points de code à toucher, repérés :

- **`src/data/factions.js`** — nouvelle entrée `internationale` : `power: 2`,
  `cards: 1`, `workerHex: [3, 20, 25, 40]` (4 valeurs au lieu de 2), pas de
  `riverwalk`/`rwName` (Résilience les remplace), `ability: "Résilience"`, `fObj`
  (usine + 3 villages), `isExtension`/flag campagne pour l'exclure du setup
  standard.
- **Compte d'unités combattantes** — la dérogation des ouvriers-combattants
  touche **8 sites de calcul identiques** : `App.jsx:3299-3301`, `605`, `744`,
  `753`, et `headlessGame.js:577`, `914`, `979`, `1037-1039`. **À factoriser
  d'abord dans un helper partagé** (`combatUnitCount(player, hexId, movingUnit)`)
  avant d'y ajouter la règle — sinon elle dérivera entre l'UI et le moteur
  headless, exactement la désynchronisation que `rules.js` documente avoir déjà
  subie en v0.15.
- **`movement.js`** — Résilience : bypass complet du test de rivière, et `marshFree` lu depuis la fiche
  (`hasR`/`riverwalk`) pour cette faction, sur ouvriers **et** mechas.
- **Bases multiples** — `hexes.js` doit accepter 4 hex `base: true` pour une
  même faction ; vérifier `homeBaseHex()` / `baseHexAt()` / `HOME_BASES`, qui
  supposent aujourd'hui **une seule** base par faction.
- **Repli sur une base AU CHOIX** — quatre bases au lieu d'une, donc une
  décision là où les autres n'en ont pas. Rien d'équivalent n'existe
  aujourd'hui (toutes les retraites renvoient sur un hex de base existant).
- **Vol de mecha** — étendre la logique Chimère du Bayou
  (`App.jsx:1940-1943`) : 4 captures au lieu d'1, + choix d'une capacité du
  mecha vaincu.
- **`combat.js` / `mechAbilities.js`** — `getMechAbilities()` et
  `getCombatBonus()` supposent une faction avec 4 slots classiques : prévoir le
  cas d'une faction à capacités volées.

---

*Spec de travail, ouverte à l'itération. Aucun chiffre de cette fiche n'a été
validé en simulation — voir TODO #7.*
