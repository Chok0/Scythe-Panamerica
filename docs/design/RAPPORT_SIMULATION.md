# Rapport de simulation — parties bot vs bot

> `npm run sim -- --games 500 --seed 42` · **v9** : équilibrage final par
> stats de départ asymétriques (façon fiches de faction de l'original).

## 0-v9. Équilibrage par stats de départ — l'état final (imprimable)

Contrainte physique posée : **aucune valeur négative** sur les fiches. Deux
mécanismes imprimables, tous deux canon dans l'original :
- **bonus positifs** appliqués au plateau joueur (« +7 pièces, +5 pop ») ;
- **valeurs absolues** qui REMPLACENT celles du plateau (« commence avec
  2 pièces et 1 popularité ») — comme la puissance et les cartes de faction.

6 itérations mesurées (400 parties chacune) + validation croisée sur 3 seeds :

| Faction | ⚡ | 🃏 | 💰 | ♥ | Winrate (moy. 3 seeds) |
|---|---|---|---|---|---|
| Frente | 2 | 3 | +2 | +2 | ~32 % |
| Bayou | 2 | 3 | +8 | +6 | ~31 % |
| Nations | 3 | 2 | — | — | ~30 % |
| Confédération | 4 | 1 | +7 | +6 | ~29 % |
| Acadiane | 1 | 1 | **= 2** | **= 1** | ~28 % |
| Dominion | 3 | 2 | +8 | +5 | ~23 % |

Sur les seeds 42 / 7 / 123 : toutes les factions entre **20,5 et 34,9 %**
(contre 5,8–67,8 % en début de chantier). La logique est celle de l'original :
la géographie est inégale par design (péninsules plus ou moins riches), les
fiches de départ compensent — et l'Acadiane, seule faction à 3 ressources,
démarre pauvre et discrète en valeurs absolues.

## 0-v8. Pourquoi un tel succès de l'Acadiane ? (diagnostic final)

Question posée : elle n'est pas enfermée, les rails passent les rivières, on
peut l'attaquer — alors pourquoi ~55 % ? Batterie A/B (400 parties chacune,
même seed, baseline 57,5 %) :

| Hypothèse testée | Winrate Acadiane | Verdict |
|---|---|---|
| White Flag désactivé (`--ab wfOff`) | 54,5 % | ≈3 pts — PAS le moteur |
| 1 carte combat au départ (au lieu de 3) | 51,9 % | −6 pts, secondaire |
| **−2$ / −2 pop au départ** | **44,8 %** | −13 pts — LE levier |
| Les deux combinés | **39,8 %** | dans le peloton |

Le moteur n'est donc ni la protection (White Flag), ni la géographie : c'est
son **économie de tête de course** — la seule péninsule à 3 types de
ressources, convertie en palier de pop 3 (multiplicateurs max) + magot. La
réponse fidèle à l'original (les fiches de faction y ont des départs
asymétriques) : **l'Acadiane démarre pauvre et discrète** — 1 carte combat,
−2$/−2 pop sur les valeurs du plateau joueur (`factions.js startBonus`,
annulable en `--ab acadRestore`).

**Dominion / Rusviet** : l'îlot du Dominion est bien le jumeau de celui des
Rusviet (village + toundra/pétrole + montagne/métal). Testé : leur capacité
signature « rejouer la même action » (`--ab domSame`) fait CHUTER le bot à
10 % (elle casse son alternance Produce→bottom — les Rusviet sont forts entre
des mains humaines, pas dans une heuristique). Sa compensation reste l'Import
Impérial (v7), qui l'amène à ~15 %.

**Fix de règle au passage** : Rouge River comptait 1 territoire + 3 de bonus
= 4 équivalents-territoires au scoring ; l'original dit « l'Usine compte
3 territoires EN TOUT » → bonus corrigé à 2 (sim + jeu).

### Batch final v8 (500 parties, seed 42)

| Faction | Début de session (v4) | **v8** |
|---|---|---|
| Acadiane | 65,6 % | **40,2 %** |
| Nations | 38,8 % | 39,7 % |
| Frente | 36,7 % | 33,4 % |
| Confédération | 9,1 % | **18,7 %** |
| Bayou | 10,5 % | **17,6 %** |
| Dominion | 10,5 % | **15,2 %** |

99,4 % finies à 6 étoiles, ~39 rounds, 0 crash / 0 invariant, 119 feintes
(82 % réussies) + 252 folds, 4 profils viables (18,8–33,1 %).

## 0-v7. Le magot, la feinte, le trajet — et le Dominion réparé

### Le magot redevient une motivation au combat (décision de design)

Le plafond de scoring v6 est **retiré** (`resScoringCap` neutralisé,
`--ab resCap12` pour comparaison) : un gros tas de ressources doit attirer
les attaques, pas être bridé par une règle. En échange, le PILLAGE est
maintenant réel partout : le magot change de mains en combat (déjà le cas),
mais aussi lors d'un **déplacement qui chasse des ouvriers** (sim + jeu,
humain compris — « 💰 Pillage » au journal). Et les bots convergent : l'attrait
du butin est proportionnel au tas (jusqu'à +12), un magot ≥ 4 justifie un
combat même sans étoile à la clé, et un **aimant à magot** fait converger les
profils agressifs vers le plus gros tas ennemi sur plusieurs tours.
Conséquence assumée : l'Acadiane (coffre-fort derrière ses rivières) remonte
à ~50-57 % contre bots — c'est le prix du choix « le contre de la
thésaurisation, c'est le raid » ; contre des humains qui raident sciemment,
c'est jouable.

### La feinte et le fold (combat psychologique, comme entre humains)

`resolveBotPvp` : décisions **simultanées et secrètes** —
- **Fold** : dominé de ≥5 en force visible, le défenseur ne mise parfois RIEN
  (50 %) : le combat est perdu d'avance, il garde puissance et cartes pour la
  contre-attaque.
- **Feinte** : écrasant en visible (≥+6), l'attaquant mise parfois le minimum
  (35 %) en pariant sur le fold… s'il ne plie pas, la feinte échoue.

Mesuré sur 500 parties : **111 feintes (82,9 % réussies), 220 folds**. Les
deux existent aussi contre l'humain : le bot attaquant peut feinter (mise
secrète), le bot défenseur peut folder devant votre stock — donc VOS feintes
peuvent réussir… ou pas.

### Mechs mobiles + dépose en route (passe-passe stratégiques)

Bug d'IA découvert au passage : les bots ne bougeaient leurs mechs que s'ils
n'avaient AUCUN ouvrier — les mechs restaient plantés toute la partie. Corrigé :
le mech bouge dès qu'il a une vraie cible (attaque, butin, leader, expansion) →
PvP 2,2 → **5,6/partie**, parties raccourcies (~40 rounds).

`findPathWaypoints` (BFS pas + rails) reconstitue le TRAJET d'un déplacement :
- **Humain** : après un move de mech chargé, panneau « 📦 Dépose en route » —
  déposer 1 ouvrier ou le matériel sur chaque hex de passage (relais de
  mechas, dépôt avant bataille, expansion).
- **Bots** : en mid/late, un mech qui transporte ≥2 ouvriers les égrène le
  long du trajet (1 par hex de passage).

### Dominion : goulot structurel identifié et corrigé

Diagnostic : coûts bottom = Upgrade:pétrole, Deploy:métal, Build:bois,
Enlist:nourriture. Or le trio fort (Nations/Frente/Acadiane) a la
**nourriture native** (Enlist, le bottom le plus fort — l'étoile recrues est
chez ~95 % des vainqueurs) ; le trio faible n'en a pas, et le Dominion est le
pire cas : sa péninsule produit pétrole+métal, donc son 2ᵉ terrain alimente
UNIQUEMENT l'Upgrade — le bottom que l'IA (et le corpus) refuse de jouer.

Correctif fidèle à son identité de faction commerçante : **Import Impérial**
(`BALANCE.imperialImport`) — le Commerce dans l'autre sens, 2$ → 1 ressource
au choix, 1×/tour (UI humaine incluse). Le bot l'utilise avec un matelas de
pièces (≥5$) pour finir un bottom presque payable — la v1 sans garde-fou le
ruinait (7,5 %). Résultat : **Dominion 7,5 → 13-16 %**, 4,03 étoiles (vs
2,7-3,3), il déclenche la fin de partie plus que toute autre faction (35 %).

### Batch v7 (500 parties, seed 42)

Conf 20,9 · Frente 30,6 · Nations 31,5 · Acadiane 57,5 · Bayou 14,7 ·
Dominion 13,3 — 98,8 % finies, ~40 rounds, 0 crash / 0 invariant. Les 4
profils restent viables (15-39 %). Chantier restant : l'Acadiane sans plafond
(voir plus haut — levier possible : rendre sa péninsule plus perméable aux
raids, ou tester `--ab resCap12` si tu changes d'avis).

## 0-v6. Profils stratégiques, difficulté, méta — et l'équilibrage qui en découle

### Les bots ne jouent plus tous pareil (la grande limite des bots Steam)

`src/logic/botProfiles.js` : chaque bot tire un **profil** (pondéré par
faction) qui oriente toutes ses décisions — colonnes, agressivité, cibles,
bâtiments, enlists, gestion de la pop :

| Profil | Idée | Winrate/siège (500 parties) |
|---|---|---|
| ⚖ Équilibré | le plan du corpus (enlist tôt, Speed mech, palier pop 7+) | 29,7 % |
| 🏛 Bâtisseur | moteur de popularité : enlist pop, Mémorial+Bolster, course aux rencontres, palier 13+ | 31,2 % |
| ⚔ Blitzkrieg | remplir ses étoiles vite et harceler (attaque à force égale, dès le début) | 20,8 % |
| 📦 Thésauriseur | produire/empiler, pacifiste, palier de pop | 35,6 % |

**Les 4 profils sont viables** et chaque faction a ses affinités mesurées
(Bayou-blitz 25,3 %, Acadiane-bâtisseur 47,5 %, Frente-thésauriseur 56,2 %…).
**3 niveaux de difficulté** au setup : facile (profil aléatoire + gros bruit
décisionnel), normal (tirage pondéré par faction), difficile (meilleur profil,
sans bruit). Le bruit rend les bots faillibles sans tricher.

### Méta-stratégie de plateau (« attaquer la Crimée tôt »)

`MAP_META_THREAT` (a priori mesuré : Acadiane 3, Frente/Nations 2) + détection
du **leader dynamique** (étoiles/pop/pièces) → les bots harcèlent la faction
avantagée et le leader (bonus de ciblage sur ses hexes, raids sur son
économie). « Couvrir ses arrières » : un bot à ≤ 4 de puissance n'attaque plus
(surextension = contre-attaque). Effet mesurable : les captures Servitude
passent de 0,65 à 1,0/partie, PvP 3,8/partie (×2).

### Le contre naturel de la thésaurisation + verdicts A/B

La v5 avait identifié l'Acadiane « coffre-fort » (61 % de winrate, 33 pts de
ressources empilées derrière ses rivières). Trois contre-mesures testées :

| Levier | Effet sur Acadiane | Décision |
|---|---|---|
| Raids attirés par le butin (`hexLoot`) | 67,8 → 61,1 % (les raids nourrissent White Flag) | ✅ gardé (bon pour le jeu) |
| White Flag +1 pop | 61,1 → 60,4 % — toujours pas le moteur | ❌ rejeté |
| **Plafond de scoring : 12 ressources** (`BALANCE.resScoringCap`) | **61,1 → 41,0 %**, tous les autres remontent | ✅ appliqué |

Et pour le trio pauvre (diagnostic v5 : ~2,5 $, pop palier 1), **compensation
asymétrique de départ** façon Scythe original (`factions.js startBonus`,
mesurée en A/B) : Confédération +4 $ +3 pop, Bayou +3 $ +2 pop, Dominion
+3 $ +2 pop.

### Résultat final v6 (500 parties, seed 42)

| Faction | v4 (départ) | **v6** |
|---|---|---|
| Acadiane | 65,6 % | **44,2 %** |
| Frente | 36,7 % | 38,1 % |
| Nations | 38,8 % | 37,5 % |
| Bayou | 10,5 % | **21,3 %** |
| Confédération | 9,1 % | **20,1 %** |
| Dominion | 10,5 % | 10,7 % |

99,2 % de parties finies à 6 étoiles, ~41 rounds, 0 crash / 0 invariant.
Reste ouvert : le **Dominion** (~11 %) — son goulot n'est ni la pop ni la
pièce (testé : commerce ×2 sans effet), probablement son tempo d'étoiles
(2,7-3,2 étoiles) ; et l'Acadiane encore ~6 pts au-dessus du peloton.

### Transport (audité + complété)

Mech emporte ouvriers+ressources, héros les ressources (déjà codé) ; ajouts :
**choix d'emport** au Move humain (🚚 OUI/NON — laisser les ouvriers tenir le
terrain), **ouvriers porteurs** (emportent les ressources s'ils sont la
dernière unité du hex), bots : le mech **n'embarque plus les ouvriers en fin
de partie** (expansion de territoire) ni vers un combat. Pas encore : la
dépose en cours de route (notre moteur est cible-à-cible, pas trajet).

## 0. v5 — Carte physique v2 + IA stratégique

### La carte dessinée est LA carte à équilibrer (le procédural reste une option)

Diagnostic de départ (mesuré) : sur la carte v1, la « zone de départ » de
l'Acadiane faisait **19 hexes, Rouge River incluse** — la moitié du plateau
offerte au tour 1 — pendant que le Bayou démarrait sur **2 hexes avec une
seule ressource**. Le plateau original de Scythe (vectoriel ajouté à la
Documentation) confirme le pattern voulu : chaque faction est clôturée par des
segments de rivière sur un îlot de ~3 hexes, et la sortie se gagne (mecha
Riverwalk, ou ici Gare/rails).

**3 retouches physiques** (`src/data/hexes.js`, v1 conservée en `LEGACY_MAP`) :

1. rivière **[9,12]** → l'Acadiane démarre en péninsule **{2,6,9}** à
   3 ressources sans village (l'analogue des Nordiques de l'original) ;
2. hex 31 **marécage→montagne** → le Bayou a enfin du **métal** natif ;
3. rivières **[23,31], [27,31], [31,34], [31,38]** ajoutées, **[31,35]**
   retirée → le Bayou démarre en péninsule **{35,28,31}** village+bois+métal.

Vérifié : les 6 factions démarrent désormais sur une péninsule de 3 hexes
(village + 2 ressources, sauf Acadiane : 3 ressources), chacune avec une
sortie Riverwalk native — `validateMap(DEFAULT_MAP)` → acceptée.

### IA v2 (corpus stratégique Reddit/blog dans la Documentation)

`src/logic/bot.js` : enlist en priorité (bottom le plus fort), Speed mech
d'abord, sortir les ouvriers du village (production ciblée sur les ressources
du prochain bottom), **≤ 2 upgrades** sauf fin de course (4+ étoiles, où
l'étoile 6-upgrades redevient une source valable), usine dévaluée, attaque
opportuniste seulement à +2 de force et hors early game, achat de pop pour
tenir le palier 7-12 dès que l'économie tourne, régime d'ouvriers 5 puis 8.

### A/B carte v1 → v2 (500 parties, seed 42, IA v2 identique)

| Faction | Carte v1 | **Carte v2 (péninsules)** |
|---|---|---|
| Acadiane | 59,5 % | **48,9 %** |
| Bayou | 9,9 % | **12,9 %** |
| Confédération | 12,3 % | 13,9 % |
| Nations | 47,7 % | 47,1 % |
| Frente | 36,6 % | 40,6 % |
| Dominion | 8,5 % | 6,3 % |

Et l'IA v2 accélère et fiabilise les parties : **99 % finies à 6 étoiles**
(v4 : 90-98 %), moyenne **43 rounds** (v4 : ~51 en fin de session), toujours
0 crash / 0 invariant sur 2 000+ parties cumulées.

### Décomposition du score (nouvelle instrumentation)

| Faction | Pop finale | ⭐pts | 🗺pts | 📦pts | 💰 |
|---|---|---|---|---|---|
| Frente | 10,5 | 15,6 | 24,2 | 14,4 | 8,4 |
| Nations | 10,3 | 19,0 | 20,1 | 14,2 | 7,9 |
| Acadiane | 10,2 | 11,9 | 20,3 | **24,0** | 6,4 |
| Confédération | 3,9 | 11,9 | 14,8 | 7,0 | 2,6 |
| Bayou | 5,2 | 12,1 | 15,8 | 5,0 | 3,0 |
| Dominion | 5,2 | 9,0 | 13,6 | 1,8 | 6,0 |

Deux lectures nettes :

- **L'Acadiane n'est plus « broken », c'est une thésauriseuse** : 48,9 % avec
  seulement 2,7 étoiles — sa péninsule sans métal (pas de Deploy facile) fait
  s'empiler les ressources, converties en 24 pts au scoring. C'est un profil
  « coaster » légitime dans Scythe, mais encore ~10 pts trop rentable.
- **Le trio faible partage une même cause : pauvreté → pop de palier 1** —
  ~2,5 $ en caisse, pop < 7, donc TOUS leurs points sont multipliés ×3/×2/×1
  au lieu de ×4/×3/×2. Ce n'est plus un problème de géographie (péninsules
  équivalentes) ni de politique de bot (identique pour tous) : c'est un
  déficit d'économie de faction.

### Chantier suivant recommandé (décision de design, pas de code)

À la manière des compensations asymétriques de l'original (pouvoir/cartes de
départ), donner au trio faible un levier économique : pièces de départ
bonus, une capacité générant des pièces (le Commerce Impérial du Dominion ne
rapporte que ~6 $/partie), ou un coût de sortie d'îlot réduit. Chaque option
se teste en 5 minutes au simulateur (`--ab`).

## 1. Le harnais

`scripts/simulate.mjs` : parties complètes bot-vs-bot sans UI, avec la vraie
logique du jeu (PvP, PvE Empire, rencontres, rails, enlist, scoring conforme).
RNG seedé, invariants vérifiés à chaque tour (exit 1 si crash/violation → CI).

```bash
npm run sim -- --games 600 --seed 42        # batch standard
npm run sim -- --randomMap                  # une carte procédurale par partie
npm run sim -- --mapSearch 12 --games 60    # évaluer 12 cartes + l'actuelle
npm run sim -- --ab wf1|bayouBois|noFlagBonus   # expériences A/B
```

## 2. Équilibrage : testé en A/B, puis appliqué ou rejeté

| Hypothèse | Résultat A/B (400 parties, même seed) | Décision |
|---|---|---|
| **White Flag +1 pop** (au lieu de +2) | Acadiane 65,6 % → 65,8 % — aucun effet (les combats sont trop rares pour que ce soit son moteur) | ❌ rejeté |
| **fObj Acadiane durci** (comptoirs non adjacents entre eux) | Acadiane 65,6 % → **58,1 %** | ✅ appliqué (`factions.js`) |
| **Bayou : Deploy payable en bois** (« Bois flotté ») | Bayou 2,2 % → **8,4 %**, capacités mech 1,9 → 3,1/4, et Acadiane -5 pts par concurrence | ✅ appliqué |
| **Servitude sur déplacement** (capture d'un ouvrier chassé, -2 pop, max 2) + le bot Confédération chasse les hexes d'ouvriers | captures 0,05 → 0,26/partie ; fObj « Le Joug » atteignable | ✅ appliqué (demande) |
| **Comptoirs hors scoring** (contrôle) | Acadiane → 56,6 % — les comptoirs ne pèsent que ~9 pts | mesure, pas de changement |

Le vrai moteur de l'Acadiane reste la **popularité** (11,5 finale vs 4,9 les
autres ; le palier pop multiplie tout le score ×5/×4/×3). Le classement pop des
factions = exactement le classement des winrates. Piste suivante si besoin :
adoucir les paliers (×4/×3/×2) — testable au simulateur en 5 minutes.

## 3. Cartes procédurales — ta carte vs les générées

### Règles de non-acceptation v2 (`src/data/mapGen.js`)

Philosophie alignée sur le Scythe original : **les îlots de départ de 3 hexes
sont un pattern voulu** (la plupart des factions du jeu de base démarrent
enfermées, sauf Togawa/Albion) — la sortie se gagne par Deploy (Riverwalk) ou
Gare/rails (notre Mine). Ce qui est interdit, c'est l'ABSENCE de sortie.

Une carte est **rejetée** si :
- **R1 escape** — une faction n'a *aucune* sortie native de son îlot : aucune
  rivière du bord ne débouche sur un terrain de sa capacité Riverwalk (îlot OK,
  cul-de-sac définitif interdit).
- **R2 potential** — en ignorant les rivières (le potentiel une fois sorti) :
  moins de 3 types de ressources ou pas de village à ≤ 3 pas.
- **R3 factory** — Rouge River inaccessible par continuité terrestre.
- **R4 fairness** — écart d'ouverture > 4× entre factions (tolérant : îlots
  normaux, un joueur seul sur 2 hexes face à des plaines ouvertes, non).
- **R5 diversité (« non-proximité »)** — plus de 2 hexagones du même terrain
  adjacents : le plateau maintient la diversité locale des terrains.
- **R6 rivers** — nombre de rivières hors [24, 46].
- **R7 empire** — un mecha de l'Empire démarrerait sur un lac/marécage.

Génération guidée (eau jamais sur les départs/Empire, village à ≤ 2 pas de
chaque base, rivières libres partout — les îlots émergent naturellement) +
réparation ciblée (ouvrir une sortie, casser un cluster) → acceptée en ~2 essais.
**La carte actuelle passe ces règles** (sa poche Confédération a bien une
sortie Riverwalk vers la plaine, et elle respecte la non-proximité).

### Verdict (`--mapSearch 12 --games 60`)

| Rang | Carte | Équilibre σ(winrate) | Winrates | Finies |
|---|---|---|---|---|
| 1 | carte-4 | **0,120** | 16–50 % | 100 % |
| 2 | carte-5 | 0,125 | 16–53 % | 97 % |
| 3–8 | cartes générées | 0,160–0,178 | — | 95-100 % |
| **9** | **panamerica (actuelle)** | **0,179** | 6–58 % | 100 % |
| 10–13 | cartes générées | 0,195–0,207 | — | 95-98 % |

Avec les règles authentiques, la carte actuelle est **dans la norme** (9ᵉ/13) ;
le générateur trouve tout de même mieux (σ 0,120). Classement + meilleure carte
dans `Documentation/cartes_procedurales_classement.json`.

**En jeu** : le setup propose « 🗺 Carte procédurale » — carte neuve validée à
chaque partie (Empire, rencontres, départs replacés). 300 parties simulées en
mode carte aléatoire : 0 crash, 0 invariant violé.

## 4. Audit des cartes (questions posées)

### Cartes usine (Ford/Tesla) — partiellement développées

- ✅ 10 cartes en données, sélection à Rouge River (premier arrivé voit le plus
  de cartes), badge sur la barre du joueur.
- ✅ Bonus « bottom » branchés : réductions de coût / pièces sur
  Upgrade/Deploy/Build/Enlist (`getPlanBottomBonus`).
- ❌ Actions « top » : **stubs** — `applyPlanTop` n'est jamais appelé (les flags
  `_planMoveBonus`, `_planDoubleProduction`… ne sont consommés nulle part).
- ❌ Les bots ne visitent jamais Rouge River (contenu réservé à l'humain).
- ⚠ Écart au modèle original : la règle en fait une **5ᵉ section du plateau
  joueur** (une vraie colonne d'action avec « déplacer 1 unité deux fois ») —
  c'est le bon design cible, chantier notable (nécessite de généraliser le
  système de colonnes).

### Cartes rencontre — rééquilibrées vers l'original

L'original (28 cartes) fait **payer** les grosses options (pièces ou
popularité : « vos choix impactent la façon dont le peuple vous perçoit ») et
rend une option **indisponible** si son coût est impayable. Notre proto (15
cartes) distribuait des cadeaux gratuits (+4 pop, +5 $, +3 ressources…).

Passe appliquée : **11 options fortes coûtent désormais des pièces ou de la
popularité**, avec `available(p)` — option grisée dans l'UI si impayable, et
les bots ne choisissent que parmi les options payables (règle p.24). Reste
plus généreux que l'original (gains posés sur le hex ✅, mais pas de coûts en
ressources) — à resserrer si les parties réelles le confirment.

## 5. Batch v4 (historique — avant carte v2 + IA v2, voir §0)

600 parties carte classique + 300 parties cartes procédurales v2 (98 % finies,
médiane ~35 rounds, 0 crash / 0 invariant) :

| Faction | Carte actuelle (fixe) | **Rotation de cartes procédurales** |
|---|---|---|
| Acadiane | 65,6 % | **34,4 %** |
| Nations | 38,8 % | 24,7 % |
| Frente | 36,7 % | 32,9 % |
| Bayou | 10,5 % | **32,4 %** |
| Confédération | 9,1 % | **23,7 %** |
| Dominion | 10,5 % | 26,5 % |

**En rotation de cartes procédurales, toutes les factions jouent entre 24 et
34 %** (même avec les îlots authentiques permis). L'essentiel du déséquilibre
mesuré entre factions vient donc de la GÉOGRAPHIE FIXE (quelle faction profite
de quelle région), pas des capacités : chaque carte individuelle favorise
quelqu'un, la rotation égalise. La carte actuelle, elle, favorise durablement
l'Acadiane (région toundra/plaine) et pénalise Bayou/Confédération (pas de
métal proche, sortie d'îlot plus coûteuse).

## 6. Historique des bugs trouvés par simulation (12, tous corrigés)

v1 : puissance négative · impasse économique bots · égalité défenseur ·
étoile 8 ouvriers bots — v2 : scoring ressources non contrôlées · pioche du
vaincu · transfert de ressources · étoile défenseur — v3 : ouvriers déplacés
sur hex défendu · Dominion cannibale — v4 : générateur de cartes (fallback
silencieux corrigé), rencontres gratuites vs règle du coût obligatoire.
