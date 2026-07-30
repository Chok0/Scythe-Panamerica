# L'Internationale Noire — fiche de faction (spec de conception)

> **Statut : spec de conception, pas encore implémentée.** Aucune entrée dans
> `src/data/factions.js`, aucune capacité dans `combat.js`/`mechAbilities.js`,
> aucune base sur la carte. Ce document est la spécification dont le code aura
> besoin — il débloque les chapitres 2 (Le Régicide) et 8 (Le Sabotage Final)
> de `docs/campagne.md`.
>
> Lore : `lore_1920_plus.md` §II. Cette faction n'entre **jamais** dans une
> partie standard — elle est réservée au mode campagne.

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

## 3. Les quatre points d'ancrage — hex 3, 20, 25, 40

Pas de base de faction unique. Les 4 ouvriers de départ sont posés sur les
hex **3, 20, 25 et 40**, chacun traité **comme une base de faction** au sens
des règles (`hMap[id].base`).

**Ce que la carte dit de ces quatre hex** (vérifié dans `hexes.js`) :

| Hex | Terrain | Particularité |
|---|---|---|
| 3 | marécage | ✦ lieu de rencontre |
| 20 | marécage | — |
| 25 | marécage | — |
| 40 | désert | ✦ lieu de rencontre |

Trois marécages sur quatre : c'est thématiquement juste (le réseau clandestin
vit dans ce que personne ne veut traverser) **et mécaniquement défensif** — le
marécage impose un péage de -1♥/-1⚡ à quiconque y entre (`marshToll`,
`movement.js:140`). Approcher l'Internationale Noire coûte quelque chose à tout
le monde…

…**sauf au Bayou**, dont le Sang du Marais annule péage et arrêt forcé
(`marshFree`, `movement.js:32`). Le Bayou est donc le prédateur naturel de
l'Internationale Noire, gratuitement. Émergence heureuse à conserver — mais à
mesurer : trois des quatre ancrages sont en accès libre pour cette faction.

### Repop hors-plateau

Quand un ouvrier est vaincu, il ne va pas sur un hex du plateau : il retourne
**hors-plateau**, dans la réserve. Il rentre ensuite en jeu **adjacent à l'un
des quatre hex d'ancrage**, au choix du joueur.

Cette réserve hors-plateau n'est **jamais capturable** — ce qui ferme le trou
de règle qu'aurait créé une faction sans base fixe (un adversaire ne peut pas
« tuer » l'Internationale Noire en occupant ses points de départ). Occuper un
hex d'ancrage bloque uniquement la **réentrée par ce point précis**. Étouffer
la faction exige donc d'immobiliser des unités sur **quatre hex dispersés
simultanément** — un coût de coordination réel, jamais un accident.

Résultat net : l'Internationale Noire est **plus résiliente au blocage** que
n'importe quelle faction normale, pas moins. C'est voulu — c'est sa
compensation pour l'absence de héros et d'économie propre.

## 4. Capacité de faction — La Nage

**La Nage** remplace **entièrement** le Riverwalk (il n'y a pas de riverwalk
en plus : le slot 1 de mecha est libéré, voir §7).

> Toutes les unités de l'Internationale Noire — **ouvriers comme mechas** —
> traversent **toutes** les rivières, sans restriction de terrain, dès le
> tour 1.

C'est le pendant direct du « Seaworthy » nordique du jeu original, et l'analogue
du Sang du Marais du Bayou : une capacité de faction active immédiatement, pas
un déblocage de mecha. Là où chaque autre faction paie un mecha pour ouvrir
deux terrains de franchissement, l'Internationale Noire circule librement sur
tout le réseau hydrographique du plateau — c'est sa mobilité qui compense sa
faiblesse en combat individuel.

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
- **Bonus** : à chaque capture, le joueur choisit **une capacité parmi les
  quatre du mecha de la faction vaincue** (`getMechAbilities(factionId)`) et
  l'acquiert définitivement.

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
exclusivement par le vol en combat (§6). Mécaniquement, c'est « comme si le
mecha avait déjà été déployé » — l'action reste un vrai choix économique
(convertir du métal en or et avancer sur la piste d'améliorations), jamais un
gain gratuit.

⚠ **À trancher à l'implémentation** : est-ce que la case Deploy consommée
compte quand même pour l'étoile des 4 mechas, ou est-ce que cette étoile
dépend **uniquement** des 4 captures ? Recommandation : **uniquement les
captures** — sinon la faction obtient l'étoile sans jamais livrer bataille, ce
qui contredit toute son identité.

### Slots de mecha

Le slot 1 (Riverwalk) est libéré, La Nage étant déjà une capacité de faction
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
  `riverwalk`/`rwName` (La Nage les remplace), `ability: "La Nage"`, `fObj`
  (usine + 3 villages), `isExtension`/flag campagne pour l'exclure du setup
  standard.
- **Compte d'unités combattantes** — la dérogation des ouvriers-combattants
  touche **8 sites de calcul identiques** : `App.jsx:3299-3301`, `605`, `744`,
  `753`, et `headlessGame.js:577`, `914`, `979`, `1037-1039`. **À factoriser
  d'abord dans un helper partagé** (`combatUnitCount(player, hexId, movingUnit)`)
  avant d'y ajouter la règle — sinon elle dérivera entre l'UI et le moteur
  headless, exactement la désynchronisation que `rules.js` documente avoir déjà
  subie en v0.15.
- **`movement.js`** — La Nage : bypass complet du test de rivière
  (`hasR`/`riverwalk`) pour cette faction, sur ouvriers **et** mechas.
- **Bases multiples** — `hexes.js` doit accepter 4 hex `base: true` pour une
  même faction ; vérifier `homeBaseHex()` / `baseHexAt()` / `HOME_BASES`, qui
  supposent aujourd'hui **une seule** base par faction.
- **Repop hors-plateau** — nouvel état : une réserve d'ouvriers hors-plateau,
  et un choix de réentrée adjacent aux ancrages. Rien d'équivalent n'existe
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
