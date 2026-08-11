# Analyse — premier test du chapitre 2 (11 août 2026)

Premier test réel de la partie internationale du chapitre 2 « Le Régicide »
(Internationale Noire, plateau **Le Réseau** : ⚡2 🃏1 ♥4 💰3, 4 ouvriers).
Six retours du playtest : deux d'interface, trois de moteur, un d'équilibrage.

Ce document traite le **6e** — l'asphyxie économique — et donne les chiffres
demandés (« potentiel problème d'équilibrage à calculer »). Les cinq autres
retours sont corrigés dans le code ; ils sont résumés en fin de document.

---

## 1. Le symptôme rapporté

> « Je me suis ruiné en quelques tours (un soutien et une rencontre à -2$),
> impossible de rebolster après ou de faire commerce. Problème : je me
> retrouve potentiellement bloqué car production requiert 1 de puissance à
> chaque fois dès le début de partie. »

La séquence est exacte et reproductible :

| Tour | Action | 💰 | ⚡ |
|---|---|---|---|
| — | Installation (Le Réseau) | **3** | 2 |
| n | Soutien (1$ → +2⚡) | 2 | 4 |
| n+k | Rencontre, option 2 (-2$ → 4 ressources) | **0** | 4 |

À 0$ : **Soutien impossible** (coûte 1$), **Commerce impossible** (coûte 1$).
Les deux seules sources de puissance et de ressources du haut de plateau sont
fermées en même temps. Il reste Déplacer/« Gagner 1$ » — et Produire, qui
coûtait **1⚡ à chaque fois, dès le tour 1**.

Ce n'est pas un blocage dur (Déplacer/+1$ est toujours jouable, et la règle
« jamais deux fois la même colonne d'affilée » laisse toujours une sortie),
mais c'est un cycle de **trois tours pour une seule production** :
Déplacer (+1$) → Soutien (-1$, +2⚡) → Produire (-1⚡). Le lecteur du playtest
a raison de le lire comme une spirale.

---

## 2. La cause : une règle écrite pour le départ d'une autre faction

Le coût de Produire n'est pas censé dépendre du nombre d'ouvriers **possédés**,
mais du nombre d'ouvriers **sortis** : sur le plateau physique, chaque ouvrier
produit quitte sa case de la piste et **révèle le coût imprimé dessous**
(⚡ sous la 2e case, ♥ sous la 4e, 💰 sous la 6e).

Le moteur, lui, lisait le total absolu :

```js
const pui = nWorkers >= 4 ? 1 : 0;   // logic/production.js, avant
```

Formule juste tant que **tout le monde démarre à 2 ouvriers**. Le Réseau
démarre à **quatre** (un par base) : il franchissait donc le premier palier
dès l'installation, sans avoir rien produit. La piste affichée
(`ProduceTrack`) reproduisait le même décalage — six cases, deux déjà
« libérées » au tour 1.

Ce n'est pas une particularité voulue de l'Internationale Noire : ni
`internationale_noire.md`, ni la fiche du plateau 200 ne mentionnent une taxe
de production. C'est un effet de bord du départ à quatre ouvriers.

---

## 3. Le chiffrage

Partie type : **10 actions Produire**, croissance jusqu'au plafond de
8 ouvriers. Coût cumulé de la piste :

| | ⚡ | ♥ | 💰 |
|---|---|---|---|
| Plateau standard (départ 2 ouvriers) | 8 | 6 | 4 |
| **Le Réseau, avant correctif** | **10** | **8** | **6** |
| **Le Réseau, après correctif** | **8** | **6** | **0** |

La faction payait donc **+2⚡, +2♥ et +2💰 de plus que n'importe qui d'autre**
sur une partie — en partant de la trésorerie la plus basse du jeu (3$ contre
4 à 7$) et avec la seule colonne Enrôler à **+0$**. Convertie au taux du
Soutien (1$ → 2⚡), la surcharge en puissance vaut ~1$ **et un tour d'action**
supplémentaire par tranche de deux productions.

### Correctif retenu

La piste vit désormais sur le **plateau**, comme sur le carton
(`data/mats.js` → `produceStart` / `produceCosts`, lus par
`logic/production.js`) :

```js
// Le Réseau (id 200)
produceStart: 4, produceCosts: { 1: "pui", 3: "pop" },
```

Quatre ouvriers au départ ⇒ **4 cases de piste** au lieu de 6, coûts aux mêmes
positions relatives (⚡ sous la 2e case libérée, ♥ sous la 4e). Résultat :

| Ouvriers | 4 | 5 | 6 | 7 | 8 |
|---|---|---|---|---|---|
| Coût de Produire | gratuit | gratuit | 1⚡ | 1⚡ | 1⚡ + 1♥ |

Les plateaux standard ne bougent pas d'un iota (test de non-régression :
`internationale.test.js`, « les plateaux standard ne bougent pas d'un iota »).

### Ce que le correctif décide, et ce qu'il laisse ouvert

Le tableau du §3 le montre : après correctif, **⚡ et ♥ reviennent exactement
au niveau d'un plateau standard** (8⚡ / 6♥). Seule la case 💰 disparaît — il
n'y a physiquement pas de 6e case sur une piste de 4. C'est la seule
différence d'équilibrage introduite, et elle est **volontairement laissée
comme compensation** du départ à 3$ et de l'Enrôler à +0$.

À mesurer sur les prochaines parties : si l'Internationale finit trop riche en
fin de partie, la case 💰 se remet en `produceCosts: { 1: "pui", 3: "pop" }` →
`{ 1: "pui", 2: "pop", 3: "coins" }` (une ligne de données, aucun code).

---

## 4. Ce que ce test a aussi révélé sur l'économie de la faction

Deux constats à surveiller, **non corrigés** — ce sont des choix de design,
pas des défauts :

1. **Une seule source de puissance, et elle coûte de l'argent.** Soutien est
   sur la colonne 3, appariée à Enrôler (**+0$**) : la colonne qui donne la
   puissance est la seule qui ne rapporte rien. Pour une faction dont les
   ouvriers combattent — donc qui veut de la puissance — c'est une tension
   voulue, mais elle se cumulait avec la taxe de production.
2. **Les colonnes qui paient exigent d'avoir déjà produit.** Construire
   (+3$) demande 3 bois, Déployer (+2$) demande 3 métal — et Déployer ne pose
   aucun mecha pour cette faction, c'est une pure conversion métal → or. La
   boucle économique passe donc *obligatoirement* par Produire. Bloquer
   Produire bloquait tout : c'est ce qui rendait la taxe si coûteuse.

Avec Produire redevenu gratuit jusqu'au 6e ouvrier, la relance ne demande plus
d'argent du tout — Déplacer/+1$ et Produire suffisent à repartir.

---

## 5. Les cinq autres retours du playtest

| # | Retour | Cause | Correctif |
|---|---|---|---|
| 1 | Texte de Résilience trop long | `abilityDesc` empilait 6 clauses (capacité + 5 dérogations structurelles) | La capacité tient en une phrase ; les dérogations passent dans `FACTIONS[…].rules`, listées à part (briefing de chapitre) et repliées derrière un dépliant en jeu |
| 2 | Pas de logo de faction en haut à gauche | `FACTION_LOGOS.internationale` n'existe pas → `<img src={undefined}>` cassé | `FactionCrest` : image si elle existe, sinon l'emblème vectoriel (la faux brisée). Utilisé aussi dans le bandeau du panneau droit et la liste des chapitres |
| 3 | Deux rencontres dans un tour, une seule jouée | Garde-fou « une rencontre par tour » pour les factions sans héros (fiche §10.1) | Levé : les deux jetons entrent dans la file de fin de déplacement et se jouent l'un après l'autre (combats d'abord, puis rencontres) |
| 4 | Les mechas de l'Empire ne chassent pas les ouvriers des bots | Un bot vaincu ne repliait que héros et mechas — ses ouvriers restaient sous la patrouille ; et la passe de dispersion lisait l'état d'**avant** le combat, donc se sautait dès qu'une bataille avait eu lieu | Retraite complète via `retreatFromHex` (ouvriers compris) + dispersion calculée sur l'état d'après combat |
| 5 | Écran noir après avoir choisi sa config de bataille | `HOME_BASES` n'a pas d'entrée pour l'Internationale Noire ; `baseHexAt(undefined)` lisait `.rx` sur `undefined` → exception au milieu de la résolution du combat, tout l'arbre React tombe | `baseHexAt` tolère l'absence de drapeau et renvoie `null` ; les retraites passent par `retreatFromHex`, qui lit `null` comme « repli en réserve du réseau ». Les mêmes appels non gardés existaient dans la défense PvP, le White Flag et le **scoring de fin de partie** — trois écrans noirs latents de plus |
| 5b | Mouvement non animé avant le combat | Le pion de la patrouille et la modale de combat apparaissaient dans la même image | La modale s'ouvre 700 ms après le déplacement, le temps que la transition du pion (0,55 s) se termine |

### Un sixième défaut, non signalé, trouvé en chemin

Les **récompenses de rencontre** se posaient sur `p.hero` — `null` pour cette
faction. Ressources, ouvriers et mechas gagnés atterrissaient donc sur la clé
`"null"` : hors plateau, invisibles, non dépensables et non comptés au score.

C'est très probablement **la moitié manquante du symptôme du §1** : la
rencontre à -2$ du playtest a bien coûté 2$ et n'a **rien** rendu. Les gains
sont désormais ancrés sur le hex de la rencontre (`encAnchor`,
`data/encounters.js`).
