# Analyse — chapitre 2 « Le Régicide », Internationale Noire (19 août 2026)

Deuxième partie complète du chapitre 2 (Internationale Noire, plateau **Le
Réseau**, carte v3, deux bots : Bayou 🐊 Prédateur et Acadiane ⚖ Équilibré).
**Chapitre remporté par la voie canon au tour 20** — 3 ouvriers sur l'Usine et
3 mechas volés pour 2 demandés — et gagné aux points : 29 contre 21 (Acadiane)
et 20 (Bayou). 28 minutes de jeu réel, 305 entrées de journal.

Sept notes laissées en cours de partie. Une est une **faute de règle**, deux
sont des **promesses d'interface que le moteur ne tient pas**, deux sont de
l'**affichage**, une est un **verdict de design** (les jetons $) et une est un
**constat d'équilibrage** (l'argent des rencontres). Toutes sont traitées ici.

---

## 1. Le combat contre l'Empire donnait les égalités au défenseur

> « Je viens de me faire attaquer par un mech de l'empire, on a fait égalité
> sur la puissance, il aurait dû gagner mais c'est quand même moi qui ai gagné,
> bug. »

Le journal donne la scène exacte :

| Tour | Entrée |
|---|---|
| 5 | ⚔ L'Empire attaque sur #21 ! Force inconnue — entre 1 à 12 |
| 5 | ✅ Victoire ! Titan Errant détruit (**6 vs 6** — dépensé : 2⚡ 1🃏) |

La règle du jeu original est sans ambiguïté — et la page Règles du jeu la
récitait déjà correctement : *« Le total le plus élevé gagne. En cas d'égalité,
**l'attaquant** gagne. »* Ici l'attaquant est l'Empire.

### La cause

```js
// App.jsx, resolveCombat, branche PvE — avant
const win = isDefender ? playerTotal >= empireTotal : playerTotal >= empireTotal;
```

Les deux branches du ternaire sont **identiques**. Le commentaire au-dessus
annonçait pourtant la bonne règle : quelqu'un a écrit l'intention, pas le code.
Conséquence : contre l'Empire, le joueur remportait les égalités des deux côtés
de la table — un ⚡ « gratuit » à chaque défense.

La même erreur dormait dans le **simulateur** (`scripts/simulate.mjs`), avec un
commentaire qui la revendiquait : `// le défenseur gagne l'égalité (même règle
que l'humain)`. Elle était donc cohérente… avec le bug.

### Le correctif

La règle sort des trois copies de `resolveCombat` (PvE, défense PvP, attaque
PvP) et devient un point de vérité unique, testé :

```js
// data/combat.js
export const playerWinsCombat = (playerTotal, enemyTotal, isDefender) =>
  isDefender ? playerTotal > enemyTotal : playerTotal >= enemyTotal;
```

Ce que ça change, mesuré sur 60 parties simulées (même graine) :

| | avant | après |
|---|---|---|
| Défenses vs Empire **gagnées** | 33,3 % | **24,7 %** |
| Attaques du bot sur l'Empire gagnées | 44,3 % | 46,5 % (bruit) |

Une patrouille impériale qui vous tombe dessus est désormais une vraie menace :
à égalité, elle passe. Le combat du tour 5 aurait été **perdu** — l'ouvrier
posté sur #21 se repliait sur une planque avec ses 2 pétrole, et les 2 métal de
ferraille n'auraient jamais été ramassés.

---

## 2. « Déployer un mecha » proposé à une faction qui ne déploie pas

> « En mode Internationale Noire, si j'ai le métal pour deploy, on me propose de
> déployer un mecha en sélectionnant un hex — mais mech déployable uniquement
> par victoire dans un combat contre un mech + ressources. »

La fiche de faction dit la même chose depuis le premier jour (§6-§7) et le
moteur la respectait déjà : `doDeploy` ne posait **aucun** mecha pour cette
faction. C'est l'**interface** qui promettait le contraire — le panneau listait
un bouton « ⬡ #hex » par hex d'ouvrier, et la carte surlignait ces hex comme
des cibles. Le joueur cliquait un hex, payait son métal… et ne voyait rien
arriver dessus.

### Le correctif

- Plus aucune cible cliquable sur la carte pour la colonne Deploy de cette
  faction (`actionTargets` retourne `none`).
- Le panneau affiche un **bouton unique** — « ⚙ Écouler les pièces détachées
  (−N métal, +X$) » — précédé de la règle en une phrase : *le réseau ne
  construit pas de mecha, il en prend ; un mecha ne s'obtient qu'en battant
  celui d'un adversaire ou une patrouille impériale, puis en payant ce même
  coût pour le relever.*
- La colonne **reste jouable à 4 mechas volés** (c'est une conversion métal →
  pièces, jamais « Maximum »), et l'étoile s'intitule « 4 Mechas **volés** ».

### Corollaire : les mechas gratuits n'en sont plus

Le même principe était troué ailleurs, et la partie l'a montré dès le tour 1 :
la rencontre « L'Épave Fumante » proposait **« Réanimer le mecha → −3 pop,
+1 mecha »**, option prise puis annulée. Elle aurait donné un mecha sans le
moindre combat — et, à la quatrième, l'**étoile des 4 mechas** sans une seule
capture, à rebours de l'arbitrage « captures uniquement » de la fiche.

Les six options « +1 mecha » du deck de rencontres et le gain « 1 Mecha » des
cartes d'usine sont donc **fermés** aux factions qui volent leurs mechas
(`canGainMech` dans `encounters.js`, `factoryEffectPossible` dans `factory.js`).
En rencontre, l'option est grisée avec sa raison écrite ; à l'usine, l'effet est
passé comme n'importe quel gain impossible, et un choix « mecha OU bâtiment » ne
propose plus que le bâtiment.

---

## 3. Le vol de capacité laissait reprendre ce qu'on avait déjà

> « Lors de la sélection pour mon second mecha volé, il me signale que j'ai déjà
> pris Speed mais m'autorise quand même à la prendre. Résultat j'ai un mech sans
> pouvoir. […] Speed aurait dû être grisé car déjà consommé, et si vraiment il
> n'y a plus de pouvoir à prendre alors dans ce cas je peux faire un mech sans
> pouvoir. »

Le journal enregistre les trois vols :

| Tour | Hex | Capacité arrachée |
|---|---|---|
| 15 | #40 | 🏃 Vitesse |
| 18 | #26 | 🏃 **Vitesse** (déjà acquise au tour 15) |
| 20 | #34 | ⚔ Blindage impérial |

Le deuxième vol a coûté 2 métal pour **rien**. La modale calculait bien
`taken`, mais ne s'en servait que pour écrire une note en fin de ligne (« slot
déjà pris — la capacité est remplacée ») : le bouton restait cliquable, et pour
le slot 0 il n'y avait rien à remplacer.

### Ce que la victime a encore à donner

Le calcul quitte l'interface pour `data/mechAbilities.js`, où il est testable :

```js
stealableSlots(fromFaction, player) // → [{ slot, ability, owned }]
```

- **Slot 0 (Vitesse)** — commune à tout le roster : une fois débloquée, elle
  n'est plus à prendre nulle part. `owned` dès qu'elle est au réseau.
- **Slot 1 (riverwalk)** — jamais proposé : Résilience franchit déjà les rivières.
- **Slots 2 et 3** — ceux de la victime. Repiller la **même** faction ne refait
  pas le patchwork : `owned` si `stolenCombat`/`stolenPosition` pointe déjà sur
  elle. Une **autre** faction, en revanche, reste un vrai choix : le bouton
  annonce alors « — remplace *Sabotage* ».
- **Patrouille impériale** : Vitesse + Blindage, pas de capacité de position.

Dans la modale, un slot `owned` est **grisé et non cliquable**. Le cas du
tour 18 se résout donc tout seul comme le joueur le demandait : Vitesse éteinte,
le Blindage impérial est le seul bouton vivant. Et quand il ne reste
**vraiment** rien, un bouton explicite apparaît : « 🔧 Relever la carcasse nue
(−N métal) » — la capture compte toujours pour le chapitre, mais le mecha
rejoint la colonne sans pouvoir, en le sachant.

### Deux capacités mortes trouvées au passage

- Le Dominion était **exclu** du slot 3 dans la modale, héritage de l'époque où
  sa capacité de position n'existait pas. **Bitume** existe depuis v0.18 : c'est
  désormais l'absence de capacité de position qui décide, pas une liste en dur.
- **Pack Up** (slot 3 des Nations) se lisait sur `me.faction === "nations"`.
  Volé par l'Internationale Noire, il ne faisait donc **strictement rien** — le
  vol payait un mecha pour une capacité morte. Il lit maintenant
  `positionFactionOf(me)`, la même convention que `movement.js`.

---

## 4. Le panneau des mechas ne disait pas ce qu'il restait à voler

> « Lorsqu'on clique sur l'icône des mechs, ils devraient refléter le fait qu'ils
> ont des ability libres et les voir à mesure qu'on les vole. »

Le panneau ⬡ récitait le texte du roster — « Déployés : n/4 · chaque déploiement
débloque UNE capacité au choix » — pour une faction qui ne déploie pas. Il dit
maintenant, pour elle :

- **Volés : n/4**, et le rappel que les mechas s'arrachent en combat, l'action
  Deploy ne posant rien ;
- par slot : **✓ volé à *faction*** quand la capacité est là (la provenance,
  pas seulement une coche), **à voler** quand le slot attend son mecha, et un
  slot 1 éteint (Résilience l'a déjà rendu inutile).

Deux affichages voisins ont suivi le même traitement d'honnêteté :

- L'**étoile Libérateur** (3 patrouilles détruites) ne figurait dans **aucun**
  tableau d'étoiles. Le joueur l'a décrochée au tour 18 sans l'avoir jamais vue
  venir. Elle est ajoutée à la barre — seulement quand l'Empire patrouille.
- Les deux **étoiles de combat** promettaient « gagner un combat », alors que le
  moteur ne compte que les combats contre une **faction**. Quatre victoires
  impériales, zéro étoile de combat : le libellé dit désormais ce que le moteur
  fait, et renvoie à Libérateur. *(La règle elle-même n'a pas bougé : deux
  étoiles pour trois patrouilles farmables seraient une voie trop courte.)*

---

## 5. Les jetons $ quittent la carte

> « Il y a des jetons $ sur le terrain, ils représentent les points où poser les
> bâtiments pour scoring bonus. Il faut complètement retirer cette feature, les
> jetons $ ne sont utilisés que dans la partie ruée vers l'or comme des jetons
> de cash. »

Le badge datait des parties des 1er et 3 août, où la tuile bonus avait rapporté
0$ à tout le monde faute d'être lisible. Le remède avait produit un symptôme
signalé dès le 28/07 (« les icônes dollars sont revenues, je ne sais pas à quoi
elles correspondent »), et une confusion de vocabulaire : **sur cette carte, un
$ doit vouloir dire de l'argent.**

### Ce qui est retiré

- Le badge $ des hex éligibles (bande haute de l'hexagone) ;
- la ligne de survol « hex éligible au bonus de pose » ;
- la mention « badge 💲 sur la carte » au journal et « tuiles marquées $ sur la
  carte » dans les deux panneaux.

### Ce qui reste, et pourquoi

La **tuile bonus de pose** elle-même reste une règle de score : c'est une des
cinq tuiles du jeu original, elle est intégrée à la pose des bots, elle est
lisible en permanence dans le panneau (nom, barème, votre compte courant en
pièces) et le journal nomme toujours les hex éligibles au début de la partie.
Surtout, c'est **elle** qui porte la variante « Ruée vers l'or » du chapitre 3
(tuile *Terres Lointaines* forcée). Le plateau du jeu original ne marque rien
non plus : la tuile se lit sur la tuile.

> **Reste ouvert.** Si « les jetons $ de la ruée vers l'or » doivent devenir de
> vrais jetons de cash **posés sur la carte et ramassables** au chapitre 3,
> c'est une mécanique à écrire — rien de tel n'existe aujourd'hui, la variante
> se limite à forcer la tuile bonus.
>
> *Mise à jour du 19/08 (même soirée)* : la question est close du côté du
> chapitre 3 — il a été réécrit (« Les mauvais jours finiront ») et ne porte
> plus de ruée vers l'or du tout. Sa variante est le **Contrat d'usine**, sa
> tuile forcée **Cœur des Villages** (docs/campagne.md).

---

## 6. L'argent des rencontres : le joueur avait raison, chiffres à l'appui

> « Je trouve qu'il n'y a pas assez de cartes rencontre qui donnent des $. »

Comptage du deck **avant** correctif :

| | Options |
|---|---|
| Options qui **coûtent** de l'argent | **36** |
| Options qui en **donnent** | **8** (sur 8 cartes de 33, soit 24 %) |

Et la partie l'illustre : **quatre rencontres résolues, zéro pièce gagnée**
(Granges Pleines → nourriture, Prêcheur → carte de combat, Champ de Pétrole →
pétrole, Convoi de Traverses → bois). Pour une faction qui démarre à **3$** —
la plus pauvre du jeu, cf. l'analyse du 11/08 sur l'asphyxie économique du
Réseau — la rencontre n'était jamais une porte de sortie.

### La méthode retenue

Huit options gagnent une sortie en pièces, **sans inflation** : chaque ajout
**échange une unité de ressource contre 2$**, au taux du Commerce (1$ → 2
ressources). La valeur de l'option ne bouge pas ; sa **liquidité**, oui.

| Carte | Option | Avant | Après |
|---|---|---|---|
| 1 · L'Épave Fumante | Prévenir le hameau | +1 pop, +2 métal | +1 pop, +1 métal, **+2$** |
| 3 · La Mine Abandonnée | Étayer la galerie | +1 pop, +2 métal | +1 pop, +1 métal, **+2$** |
| 6 · Le Dépôt de Trains | Inventorier le dépôt | +1 pop, +2 métal | +1 pop, +1 métal, **+2$** |
| 9 · Le Champ de Pétrole | Sécuriser le puits | +1 pop, +2 pétrole | +1 pop, +1 pétrole, **+2$** |
| 13 · Le Barrage | Rétablir le courant | +1 pop, +2 puissance | +1 pop, +1 puissance, **+2$** |
| 29 · Le Bac à Vapeur | Aider au débarcadère | +1 pop, +2 bois | +1 pop, +1 bois, **+2$** |
| 12 · La Contrebandière | La dévaliser | −2 pop, +4 métal | −2 pop, +3 métal, **+2$** |
| 32 · Le Poste Frontière | Saisir la contrebande | −2 pop, +1 Fragment, +2 métal | −2 pop, +1 Fragment, +1 métal, **+2$** |

Six sur l'**option 1** (gratuite : on est *payé* pour le service rendu — et
c'est celle qu'un joueur ruiné peut toujours prendre), deux sur l'**option 3**
(la cassette part avec le butin). Résultat : **16 options sur 14 cartes**, soit
42 % du deck contre 24 % — une carte sur trois payait, deux sur cinq paient.

Deux garde-fous, verrouillés par un test :

- les **12 triptyques `src:"original"`** ne sont pas touchés — ce sont
  l'étalon d'équilibrage, on ne retouche pas le mètre ;
- aucune option ne donne **plus de 2$** : le deck garde son unité de compte.

---

## 7. Ce que la partie dit d'autre

**Le score du vainqueur est un score de pauvre.** 29 points, dont 8$ en caisse
et 16$ de territoires — mais **1 seule étoile** (Libérateur) et une popularité
finale de **5**, soit le palier le plus bas (×2$ par territoire), quand les deux
bots finissaient à 14 (×4$). Le chapitre est gagné par sa condition canon, pas
par la partie de Scythe qui se joue autour. C'est cohérent avec l'identité de la
faction — quatre victoires militaires ne donnent qu'une étoile —, mais cela vaut
d'être surveillé : si le chapitre 2 se gagne toujours à 6 tours de la fin sans
que le score suive, la partie n'a plus d'enjeu après la 2e capture.

**L'export du journal ne se recalculait pas.** Le total d'Acadiane (21) ne
tombait pas juste depuis ses colonnes (12$ + 4 + 3 = 19) : les 2$ par comptoir
manquaient à l'export. Le champ `comptoirs_argent` est ajouté au classement
exporté — les journaux suivants se vérifieront à la main.

**Le bonus de pose tiré était « Avant-Postes »** (10$ pour un bâtiment adjacent
à une base adverse, +2$ par autre bâtiment) : 16 hex éligibles, **0$ marqué au
score final pour les trois joueurs**. Personne n'a construit près d'une base
adverse — ni le joueur, ni les bots. À reprendre si le cas se répète : c'est la
tuile la plus payante du pool et la seule que personne ne joue.

---

## Récapitulatif des correctifs

| # | Retour | Nature | Fichiers |
|---|---|---|---|
| 1 | Égalité contre l'Empire donnée au défenseur | **Règle** | `data/combat.js`, `App.jsx`, `scripts/simulate.mjs` |
| 2 | Deploy proposait de poser un mecha | Interface + règle | `App.jsx`, `data/encounters.js`, `logic/factory.js` |
| 3 | Capacité déjà volée re-proposée | **Règle** | `data/mechAbilities.js`, `App.jsx` |
| 4 | Panneau des mechas / étoiles muets | Affichage | `App.jsx`, `data/rules.js` |
| 5 | Jetons $ sur le terrain | Design (retrait) | `App.jsx` |
| 6 | Pas assez de $ en rencontre | Équilibrage | `data/encounters.js` |
| 7 | Total exporté non recalculable | Outillage | `App.jsx` |

Tests ajoutés : `logic/__tests__/combat.test.js` (les égalités), 6 cas de vol
dans `internationale.test.js`, la couverture en pièces du deck dans
`encounters.test.js`, le mecha d'usine refusé dans `factory.test.js`.
Suite complète : **355 tests**, simulateur 60 parties — 0 crash, 0 violation
d'invariant.
