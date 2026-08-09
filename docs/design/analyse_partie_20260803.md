# Analyse — partie de campagne du 3 août 2026 (chapitre 1)

Deuxième partie réelle du **chapitre 1 « Le rail avance »**, la première après
le lot de correctifs du 1er août. Carte v3, 3 joueurs, difficulté normale,
22 tours. Le joueur (Nations, Fordisme) **remporte le chapitre par la voie
canon** au tour 22 (Le Grand Retour) — mais finit **2e au score, 29 contre 42**
au bot Frente Libre.

Le journal porte **7 notes**. Chacune est vérifiée dans le code ; trois sont
**mesurées** (croissance du rail rejouée segment par segment, portée réelle de
la Vitesse depuis la position du journal, comportement des patrouilles compté
sur les 21 activations de la partie).

---

## 1. Résultat brut

| | Frente (bot) | Nations (joueur) | Acadiane (bot) |
|---|---|---|---|
| **Score** | **42** | 29 | 22 |
| Étoiles | 3 (×3) | 4 (×3) | 1 (×4) |
| Territoires | 5 (×2) | 6 (×2) | 3+1⚑ (×3) |
| Ressources | 11 → 5 paires | 1 → 0 | 3 → 1 paire |
| **Argent** | **18** | **5** | 2 |
| Popularité | 3 (palier ×2) | 5 (palier ×2) | 10 (palier ×3) |
| Bâtiments posés | **0** | 3 | **0** |
| Bonus de pose | **0** | **0** | **0** |

Trois signaux : l'écart de 13 points est **exactement** l'écart de trésorerie
(18$ contre 5$) ; les deux bots n'ont **posé aucun bâtiment en 22 tours** ; et
la tuile bonus de pose rapporte **0 aux trois joueurs pour la deuxième partie
consécutive** (voir §4).

---

## 2. Verdict sur les 7 notes

| # | Tour | Note | Verdict |
|---|---|---|---|
| 1 | 9 | « D'où ça sort ce morceau de rail 36↔40 » | **BUG confirmé et REJOUÉ.** De VOS rails. `growEmpireRail(rails)` reçoit le tableau de rails **partagé** : les 3 segments posés par votre Gare au tour 6 sont absorbés dans le réseau impérial et servent d'ancrage à sa croissance. Voir §3.1. |
| 2 | 9 | « J'aurais dû pouvoir resélectionner le mecha avec les ouvriers pour me redéplacer » | **Conforme aux règles.** Une unité ne se déplace qu'une fois par action Move, et la Vitesse n'était pas encore débloquée (`Ab[2]` au tour 9). **Mais le journal ment** : le déplacement qui déclenche un combat n'est **jamais logué** (`🚶` posé après le point de sortie vers la modale). Un seul mouvement visible, puis « Mouvement terminé (2/2) » — on croit à un déplacement compté deux fois. |
| 3 | 16 | « Il semblerait que le mecha Speed n'ait pas d'effet » | **Implémentée et active — mais MESURÉE à +1 hex sur cette position.** Depuis #17, la Vitesse fait passer les destinations de `{10, 14, 25}` à `{3, 10, 14, 25}` : un seul hex de plus, et c'est un marécage (péage + arrêt forcé). Voir §3.2. Pas un bug : un effet de terrain que rien n'explique à l'écran. |
| 4 | 16 | « J'ai pu faire un déplacement composé mais pas la 2e partie sur le réseau de rail » | **Conforme au code de l'époque — règle CHANGÉE depuis** par l'arbitrage du 3 août : le rail est un pas comme un autre, à n'importe quel moment du déplacement. Voir §3.3 et §8. |
| 5 | 21 | « Déplacement mecha de l'Empire sans combat démarré » | **Conforme au code, deux trous derrière.** Pas de combat sans héros/mecha sur l'hex (correct), ouvriers dispersés depuis le 1er août (correct), **bâtiments ignorés** — et une patrouille campée sur votre hex **ne vous en retire pas le contrôle au score** (`enemyOccupied` est construit à partir des `players` seuls : l'Empire est invisible au décompte des territoires). |
| 6 | 21 | « Mon moulin n'est pas comptabilisé dans les hex Plaine/Forêt pour l'objectif » | **BUG confirmé — il a coûté 1 à 2 tours de partie.** Deux définitions du contrôle coexistent : le score final compte les bâtiments (« règle Scythe »), la condition canon non (`heldHexes` = héros + ouvriers + mechas). Voir §3.4. |
| 7 | 22 | « À nouveau déplacement de mecha Empire sans interaction » | **Confirmé, cause mesurée.** Une seule patrouille s'active par tour, **au hasard**, vers une destination **au hasard** — et une fois le réseau achevé (tour 14), le rail domine le tirage : **6 des 8 derniers déplacements impériaux sont des sauts de rail** (contre 3 sur 13 avant). Voir §3.5. |

---

## 3. Ce que la mesure dit

### 3.1 L'Empire ne construit pas « son propre réseau » — il annexe le vôtre

`docs/campagne.md §3` : « l'Empire construit **son propre** réseau sous les
yeux du joueur ». L'implémentation appelle `growEmpireRail(rails)` avec le
tableau **partagé** — celui qui contient aussi vos segments.

La croissance de la partie a été **rejouée à l'identique** (`growEmpireRail`
est pure) : en injectant vos 3 segments au tour 6, on retrouve la séquence du
journal **au segment près**, du tour 2 au tour 14.

| | Séquence | Fin |
|---|---|---|
| **Partie réelle (rails partagés)** | 22-27, 27-31, 31-35, 22-15, 15-8, 8-4, **29-36**, 36-40, 40-46, 15-12, 12-9, 9-6, **15-11** | tour 14, 13 segments |
| **Contrefactuel (Empire seul)** | 22-27, 27-31, 31-35, 22-15, 15-8, 8-4, 15-11, 11-14, 22-26, 26-29, 29-36, 36-40, 40-46, 15-12, 12-9, 9-6 | tour 17, 16 segments |

Conséquences, toutes vérifiées dans le journal :

- le segment `29-36` du tour 8 **part de votre rail #29**, posé deux tours
  plus tôt — c'est la réponse exacte à la note 1 ;
- votre Gare a fait **gagner 3 tours et 3 segments** à l'Empire ;
- le village #14 — votre plaque tournante (Gare, mecha, 6 à 8 ouvriers) — est
  raccordé au réseau impérial **par votre propre segment #14↔#11** ; c'est par
  là que les patrouilles arrivent ensuite à #21, #11 et #35.

Construire une Gare au chapitre 1 revient donc à **financer l'infrastructure
de l'adversaire**. Rien dans l'interface ne le dit.

**Écart doc/code annexe** : `EMPIRE_RAILS = [[27,30],[11,15]]` (`data/empire.js`)
n'est **jamais posé** — `App.jsx` démarre sur `rails=[]`, et le premier
segment du journal (`22↔27`) est bien celui d'un réseau vide. La ligne
« Amorce : les 2 segments impériaux déjà posés au setup » de `campagne.md` est
fausse depuis le début.

### 3.2 La Vitesse : +1 hex sur cette position, et c'est un marécage

Rejeu de `getValidMoves` depuis #17 (mecha, rails et blocages du tour 16) :

| Capacités | Destinations |
|---|---|
| `[2]` (Ronin seul) | 10, 14, 25 |
| `[2, 0]` (+ Vitesse) | **3**, 10, 14, 25 |

Le voisinage de #17 est : #10 forêt, #14 village, #21 montagne (patrouille —
entrée possible, traversée non), #25 marécage (arrêt forcé), #902 base
(interdite). Le second pas ne peut donc repartir que de #10 et #14 — et
**les rivières bloquent tout le reste** : le Riverwalk des Nations est le slot 1,
non débloqué (`Ab[2,0,3]`). Le seul gain est #3, un marécage qui coûte le péage
et arrête le déplacement.

La Vitesse fonctionne. Ce qui manque, c'est **la lecture** : rien ne distingue
à l'écran « 2e pas impossible : rivière » de « la capacité ne marche pas ».
Pour comparaison, depuis #14 (sur le rail), la même Vitesse fait passer les
destinations de 12 à **20**.

### 3.3 Rail : ce que le joueur paie, et ce que l'Empire ne paie pas

| | Joueur | Patrouille impériale |
|---|---|---|
| Embarquer | Doit **commencer** son déplacement sur le réseau | Idem |
| Coût de l'embarquement | **1 pas** sur les 1-2 disponibles | **0** — le réseau entier est ajouté à ses destinations d'un pas |
| Unités ennemies | `blockedHexes` coupe le réseau : pas de saut par-dessus | `getRailNetwork(fromId, rails)` **sans** `blockedHexes` — saute par-dessus tout |
| Monter à bord en cours de route | Interdit (note 4) | Sans objet |

Les trois lignes vont dans le même sens. La note 4 est un choix de conception
défendable — mais il n'est tenable que si l'Empire y est soumis aussi.

**Arbitrage rendu le 3 août (voir §8) : les deux premières lignes de la
colonne joueur tombent.** Le rail devient un pas comme un autre, empruntable à
n'importe quel moment du déplacement. Reste la troisième — l'Empire saute
toujours par-dessus les unités (`getRailNetwork` appelé sans `blockedHexes`),
seule asymétrie encore ouverte.

### 3.4 Deux définitions du contrôle dans le même jeu

| Décompte | Unités | Bâtiments | Comptoirs / pièges | Où |
|---|---|---|---|---|
| **Score final** | oui | **oui** (si aucun ennemi sur l'hex) | oui | `App.jsx` §scoring |
| **Condition canon** | oui | **non** | non | `heldHexes()`, `data/campaign.js` |

Au tour 21, deux de vos trois bâtiments étaient sur des hex éligibles :
**Arsenal #17 (plaine)** depuis le tour 10, et **Moulin #7 (plaine)** depuis
le Pack Up du tour 20. La condition a pourtant attendu le tour 22 et deux
déplacements — m1 → #26 (plaine) puis m0 → #7 (plaine) — pour se déclencher.

Ce qui se déduit du journal, sans supposition : le second de ces déplacements
a posé un mecha **sur l'hex où se tenait déjà votre propre moulin**. Avec la
définition du score, #7 était tenu depuis deux tours : la condition tombait au
moins un déplacement plus tôt, et dès le **tour 20** si l'Arsenal de #17
comptait pour un quatrième hex distinct — ce qui est le cas de figure le plus
probable, vos 8 ouvriers ayant quitté #17 au tour 18.

`heldHexes` sert aussi à `controlsFactory` et `villagesHeld` — donc aux
conditions canon des chapitres 4 et 6, qui ont le même trou.

### 3.5 Les patrouilles : mouvement brownien, puis téléportation

`App.jsx` : une seule patrouille est tirée au hasard par tour de table, et sa
destination est tirée au hasard parmi ses voisins **plus tous les nœuds du
réseau**. Aucune logique de ciblage — ni butin, ni menace, ni village.

| Période | Déplacements impériaux | Dont saut de rail |
|---|---|---|
| Tours 2-14 (réseau en construction) | 13 | 3 (23 %) |
| Tours 15-22 (réseau achevé) | 8 | **6 (75 %)** |

Une fois le réseau complet, un nœud du rail offre ~14 destinations contre ~5
voisins : la patrouille passe l'essentiel de son temps à se téléporter d'un
bout à l'autre de la carte. C'est très exactement ce que décrivent les notes
5 et 7 — et 6 patrouilles n'ont produit que **3 combats** en 22 tours, tous
initiés par le joueur ou subis par un bot au hasard.

---

## 4. La tuile bonus de pose rapporte 0 pour la deuxième partie de suite

Tuile tirée : **🌾 Champs & Toundra** — 1→2$ · 2→4$ · 3→6$ · 4→9$ par bâtiment
posé sur un champ ou une toundra.

- Hex éligibles sur la carte v3 : **5 sur 43** — toundra #0, #2, #11 ; champs
  #38, #41. Deux à trois seulement sont à 5 pas ou moins de chaque base.
- Vos 3 bâtiments à l'arrivée : Moulin #7 (plaine), Gare #14 (village),
  Arsenal #17 (plaine) → **0$**.
- **Et pourtant vous y étiez.** Au tour 20 vous avez packé la Gare de #14 vers
  **#11 — une toundra, donc 2$** — avant d'annuler le coup et de packer le
  Moulin à la place. Deux traces l'attestent : Pack Up est limité à un par
  action Move (deux dans ce tour = un undo entre les deux), et le score final
  affiche bien 0$ de bonus de pose. La tuile était gagnable ; rien ne
  signalait que ce coup-là valait de l'argent.
- **Les deux bots n'ont posé aucun bâtiment.** Actions comptées sur la partie :

| Bot | Actions du bas |
|---|---|
| Acadiane | Déployer ×4, Améliorer ×2, **Construire ×0** |
| Frente Libre | Déployer ×4, Enrôler ×4, **Construire ×0** |

Conséquence : la tuile ne peut rapporter à personne, et l'étoile « 4 bâtiments »
est **hors d'atteinte des bots par construction**. Sur deux parties, la
mécanique a rapporté **0 sur 6 emplacements de joueur**. Le constat 11 du
1er août n'était pas un accident de partie.

---

## 5. Pourquoi 42-29 : la trésorerie, pas le jeu

L'écart est de 13 points. La différence de trésorerie est de 13$.

- **Frente encaisse 16$ de bonus de colonne imprimés** — 4 Enrôler à +3$,
  4 Déployer à +1$ — et **ne les dépense jamais**. L'argent vaut 1 point sec.
- **Vous avez payé 9 fois 1$** (Bolster, Trade, Import) et fini à 5$.
- Vos ressources finissent à **1** contre 11 pour Frente : tout est passé en
  mechas, recrues et bâtiments — trois postes qui ne marquent pas directement.
- Votre popularité reste au palier ×2 (5) : produire à 8 ouvriers coûte
  1♥ + 1⚡ + 1$ à chaque activation. Acadiane, immobile et improductive,
  termine au palier ×3 avec 10.

Ce n'est pas un bug — c'est la conséquence du barème. Mais il faut le dire
franchement : **le bot gagne en thésaurisant sans rien faire**, exactement
comme au 1er août. Le levier le plus rentable du jeu est actuellement de
prendre les bonus de colonne et de ne rien en faire.

---

## 6. Chapitre remporté, 2e au classement

La condition canon clôt la partie au tour 22, le bandeau annonce
« 🏛 Victoire canon — Le Grand Retour accompli » et débloque le legs
🛤 Chantier ferroviaire. **Juste en dessous, le classement décerne le 🏆 à
Frente Libre.** Les deux affichages sont exacts et se contredisent à l'œil.

---

## 7. Suites proposées (par ordre de coût)

| # | Correctif | Portée |
|---|---|---|
| C1 | **Contrôle unifié** : un seul `heldHexes` comptant unités **et** bâtiments (+ comptoirs/pièges), utilisé par le score, les conditions canon et les objectifs. | `data/campaign.js`, `App.jsx` — note 6, chapitres 4 et 6 |
| C2 | **Croissance impériale sur les rails impériaux** : suivre `empireRails` séparément et n'étendre que depuis eux ; le réseau reste **partagé pour le déplacement** (c'est la promesse du chapitre), pas pour la construction. Poser aussi `EMPIRE_RAILS` au setup, comme le doc l'annonce. | `logic/campaign.js`, `App.jsx` — note 1 |
| C3 | **Symétrie du rail** : passer `blockedHexes` à `getRailNetwork` côté Empire (il saute encore par-dessus les unités). | `App.jsx` — note 4, §3.3 |
| C4 | **Loguer le déplacement qui déclenche un combat** (`🚶 unité → #hex` avant l'ouverture de la modale). | `App.jsx` — note 2 |
| C5 | **Contrôle territorial contre l'Empire** : une patrouille sur un hex en retire le contrôle au score, comme une unité adverse. | `App.jsx` §scoring — note 5 |
| C6 | **Lisibilité de la portée** : distinguer 1er et 2e pas au surlignage, et signaler la cause d'un blocage (rivière, patrouille, marécage). | `App.jsx` — note 3 |
| C7 | **Ciblage des patrouilles** : préférer les hex à butin/ouvriers, plafonner la probabilité de saut de rail. | `App.jsx` — notes 5 et 7 |
| C8 | **Les bots doivent construire** : la colonne Build n'est jamais choisie — même symptôme structurel que le Move d'Acadiane au 1er août (score de colonne hors d'atteinte). À traiter dans le lot bots, **avec mesure avant/après**. | `logic/bot.js` — §4 |
| C9 | **Tuile bonus de pose** : 6 hex éligibles sur 43 est trop peu. Soit filtrer les tuiles selon la carte, soit annoncer les hex éligibles au setup (les « jetons dollars » de la note 11 du 1er août). | `data/structureBonus.js` — §4 |
| C10 | **Écran de fin de chapitre** : quand la voie canon est remportée, le 🏆 revient au joueur ; le classement VP passe en second rang de lecture. | `App.jsx` — §6 |

---

## 8. Arbitrage du 3 août — le rail est un pas comme un autre ✅ implémenté

**Décision du concepteur**, énoncée après la partie :

> Une action Move qui part d'un hex avec un rail peut terminer n'importe où
> sur le réseau connecté. Dans le cas d'un mouvement séquentiel (mecha Vitesse
> déployé) la règle s'applique toujours : si le premier déplacement amène sur
> une case avec un rail, le second peut terminer n'importe où sur le réseau ;
> inversement si le premier move est sur le réseau il termine n'importe où
> dessus et le second peut en sortir (ou repartir ailleurs sur le réseau).

Autrement dit : **un pas de déplacement est SOIT un hex adjacent, SOIT un
trajet ferroviaire depuis l'hex courant.** Rouler coûte toujours 1 pas — ce
n'est pas un téléport gratuit — mais la restriction « il faut COMMENCER son
déplacement sur le réseau » disparaît.

**Ce que cela renverse.** La règle précédente (« on monte à bord un tour, on
roule au suivant ») datait de la partie du 22/07 et avait été **confirmée** au
28/07 (note T24 : « règle maintenue — rouvrir = les rails redeviennent des
quasi-téléports à 2 pas »). Le risque alors invoqué est réel et assumé : avec
Vitesse, un mech placé à côté du réseau atteint désormais n'importe lequel de
ses nœuds. Sur la position exacte du tour 16, la Vitesse passe de **4
destinations à 14** depuis #17 — ce qui répond du même coup à la note 3.

Le garde-fou conservé : le réseau reste **coupé aux nœuds occupés par une
unité ennemie** (destination possible, jamais passage) — règle du 22/07,
inchangée.

**Implémentation** (un seul point de vérité, hérité par les bots et le mode
API qui passent tous par `getValidMoves`) :

| Fichier | Changement |
|---|---|
| `logic/movement.js` | `getValidMoves` : le réseau s'ouvre depuis tout hex atteint, à chaque pas (et non plus au seul pas 0). `findPathWaypoints` suit la même règle — les dépôts en cours de route restent cohérents avec le trajet réel. |
| `components/App.jsx` | Déplacement décomposé : la branche `continuation` de `validMoves` propose le réseau si l'unité s'y trouve. Comptage des pas : rouler vaut 1 pas depuis l'hex de départ **de chaque saut**, continuation comprise. |
| `data/rules.js`, tooltip d'hex, libellé du chapitre 1 | Textes de règle réécrits (trois formulations de l'ancienne règle traînaient dans l'UI). |
| `logic/__tests__/movement.test.js` | Le test « entrer sur un rail en cours de route n'ouvre pas le réseau » est **inversé** ; trois tests ajoutés (embarquer puis rouler, rouler puis sortir, coupure par une unité ennemie). 234 tests au vert. |

---

## 9. Lot de correctifs du 3 août — implémenté et mesuré

Les dix pistes du §7 ont été traitées dans la foulée de l'arbitrage sur le
rail. Récapitulatif, avec ce qui a été mesuré.

| # | Livré | Mesure / vérification |
|---|---|---|
| **C1** | **Contrôle unifié** — `heldHexes(p, ctx)` (`data/campaign.js`) devient le point de vérité : unités **+** bâtiments **+** pièges armés, contestés par toute unité adverse. Utilisé par le score final (UI et mode API) et par les conditions canon. | 5 tests : bâtiment sans unité, piège armé/désamorcé, contestation adverse, contestation impériale, et la condition du chapitre 1 remplie par deux bâtiments. |
| **C2** | **L'Empire ne prolonge plus que SES rails** — suivi séparé `empireRails` ; le segment posé rejoint le réseau partagé (le partage reste entier pour le déplacement). `EMPIRE_RAILS` est enfin posé au setup, comme l'annonçait `campagne.md`. | La séquence contrefactuelle du §3.1 devient la séquence réelle : 16 segments et 3 tours de plus pour l'Empire quand le joueur construit sa Gare. |
| **C3** | **Symétrie du rail** — les patrouilles passent par `getRailNetwork(from, rails, blocked)` : le réseau leur est coupé aux nœuds occupés, comme à tout le monde. | — |
| **C4** | **Le déplacement qui déclenche un combat est logué** (`🚶 unité → #hex ⚔`), PvE et PvP. | Répond à la note 2 : plus de « (2/2) » après un seul mouvement visible. |
| **C5** | **L'Empire conteste les territoires** — inclus dans C1 : une patrouille sur votre hex vous en retire le contrôle au score. | Test dédié. |
| **C6** | **Lisibilité de la portée** — les destinations du dernier pas sont surlignées en pointillé (plein pour un pas), et le panneau annonce « N destinations, M à 1 pas » avec la cause des blocages : rivières, lacs, marécages (arrêt forcé), hex occupés. | Sur la position du tour 16, la Vitesse affiche 14 destinations au lieu de 4 (effet combiné de l'arbitrage §8). |
| **C7** | **Les patrouilles chassent** — le réseau ferré n'entre dans le tirage qu'une fois sur quatre (`EMPIRE_RAIL_CHANCE`), et un hex portant unités, ouvriers ou butin est préféré 3 fois sur 4 (`EMPIRE_HUNT_CHANCE`). | Corrige les 75 % de sauts de rail de fin de partie mesurés au §3.5. |
| **C8** | **Les bots ne laissent plus une colonne mourir de faim** — le Commerce visait « le plus petit manque », donc jamais le bois de Construire, plus cher d'un ou deux cubes : un bas jamais joué compte désormais 1,5 de manque en moins. Plus un `buildBoost` de profil (le « Bâtisseur » n'en avait aucun) et la prise en compte du gain réel de la tuile bonus. | **120 parties simulées, avant/après** — sièges finissant à 0 bâtiment : **12 % → 7 %** ; sur les parties courtes (≤26 tours, le format de la partie du 03/08) : **32 % → 18 %**, et 1,46 → 1,76 bâtiment. Bâtisseur 20 % → 10 % de sièges à zéro, thésauriseur 21 % → 9 %. Winrates par faction inchangés (écarts dans le bruit), score moyen 64,9 → 68,7. |
| **C9** | **Tuile bonus jouable et annoncée** — le tirage écarte les tuiles dont la carte ne porte pas au moins 4 hex éligibles, ou qui laissent une faction en jeu à moins de 2 hex éligibles à 5 pas de sa base ; et le journal de setup **nomme les hex éligibles**. | Sur la carte v3 le filtre ne retire rien (vérifié par test) : il protège des cartes procédurales. L'annonce répond à la note 11 du 01/08 (« à quoi servent les jetons dollars »). |
| **C10** | **Écran de fin de chapitre** — en campagne, le 🏆 revient à qui a **remporté le chapitre**, pas au meneur aux points ; une ligne rappelle son rang au score, et un chapeau précise que le décompte n'est que le score de partie. | — |

Reste ouvert, hors périmètre de ce lot : le constat du §5 (le bot gagne en
thésaurisant, l'argent valant 1 point sec) — c'est un arbitrage de barème, pas
un bug.

Suite complète : **243 tests au vert**.
