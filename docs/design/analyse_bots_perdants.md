# Pourquoi les bots perdent — analyse de simulation (v0.14)

Mesures : 300 parties (`node scripts/simulate.mjs --games 300 --seed 101 --dump games.ndjson`
puis `node scripts/analyzeLosers.mjs games.ndjson`), complétées par la signature
comportementale de 12 parties rejouées en verbose (`node scripts/botBehavior.mjs 118 202 …`).
Contexte : le calibrage bot-vs-bot ne valide pas l'équilibre humain (verdict de
playtest) — cette analyse sert à améliorer la RÉFLEXION des bots, pas à retoucher
les plateaux.

## Le portrait-robot du dernier

| Mesure (moyenne) | Gagnant | Dernier | Écart |
|---|---|---|---|
| Score total | 89,5 | 40,6 | **−48,9** |
| … dont ressources (pts) | 24,7 | 9,8 | −14,8 |
| … dont étoiles (pts) | 21,8 | 9,4 | −12,4 |
| … dont pièces | 16,7 | 5,0 | −11,7 |
| … dont territoires (pts) | 25,3 | 15,2 | −10,1 |
| Étoiles | 5,0 | 2,4 | −2,6 |
| Palier de pop ≤6 en fin | 14 % | **32 %** | |
| Trésorerie finale ≤3$ | — | **55 %** | |

Signature comportementale (actions/partie, 12 parties verbose) :

| Action | Gagnant | Dernier | Lecture |
|---|---|---|---|
| Tour « +1$ » (Move sans bouger) | 0,3 | **4,1** | ~4 tours morts par partie |
| Trade → popularité (+1♥ pour 1$) | 2,5 | **6,8** | pop au goutte-à-goutte, en étant fauché |
| Construire (bas) | 3,4 | 1,8 | moteur d'étoiles à l'arrêt |
| Enrôler (bas) | 3,6 | 2,1 | idem — l'étoile la plus discriminante |
| Déplacements | 19,9 | 13,9 | moins de territoire, moins de rencontres |
| Attaques PvP | 1,3 | 0,5 | pas d'étoiles de combat |
| Colonne usine « coût impayable » | 0,1 | 0,6 | joue l'usine sans pouvoir la payer |

Étoiles les plus discriminantes (gagnants − derniers) : **recrues Δ59**,
combat1 Δ41, bâtiments Δ41, objectif Δ24 — et workers8 Δ1 (ne discrimine PAS :
tout le monde l'a ou personne).

Autres coupes : profils **bâtisseur 40 % de dernières places** (21 % de wins) et
**thésauriseur 37 %**, contre blitz 23 %/31 % et équilibré 19 %/32 %. Factions :
Confédération 36 % de dernières places ; Nations/Frente dominent (37-39 % de
wins). Plateaux : Forge 42 % de dernières places (12 % de wins).

**Et le chiffre le plus grave : dans 41 % des parties, le bot qui déclenche la
fin (6ᵉ étoile) se fait dépasser au score final** — le contresens classique de
Scythe (finir à petit palier de pop, c'est offrir la partie).

## Les 6 causes racines (ancrées dans le code)

1. **Famine de pièces auto-entretenue** (`bot.js` — fallback Move→« +1$ »,
   Bolster/Trade exigent 1$). Sans pièces : pas de Bolster, pas de Trade, donc
   pas de ressources ciblées, donc pas d'actions du bas, donc pas des bonus $
   qui sont la vraie source de revenu. Le bot fauché boucle « +1$ » / re-fauché.
2. **Pop achetée au mauvais moment, au goutte-à-goutte** : le bâtisseur
   (popTarget 13, tradePopBoost 7) dépense ses derniers dollars en +1♥ pendant
   tout le milieu de partie… et 32 % des derniers finissent quand même sous le
   palier 7 (multiplicateurs ×1). Aucun « sprint de palier » : passer de 6→7 ou
   12→13 pop en toute fin vaut +33 % sur TOUT le score.
3. **Aucune planification à 1 coup** : `scoreColumn` note « puis-je payer le bas
   MAINTENANT » (+25) mais jamais « le top de cette colonne rend son bas payable
   au prochain tour » (Trade +2 ressources ciblées, Produce). Et la priorité du
   bas est FIXE (Enrôler > Déployer > Construire > Améliorer) sans regarder les
   coûts/bonus du PLATEAU — d'où la Forge sinistrée (Construire 4🪵 +0$ noté
   comme le 2🪵 +2$ du Fordisme).
4. **Déclenchement de fin suicidaire (41 %)** : le garde-fou `estimateScore vs
   bestOppScore` n'existe que sur les colonnes bottom à une action de l'étoile.
   Les étoiles AUTOMATIQUES (pop18, workers8, power16), les objectifs
   (auto-révélés par les bots dès que la condition passe) et les combats ne
   sont pas gérés : un bot à 5 étoiles derrière au score déclenche quand même.
5. **Profils déséquilibrés** : bâtisseur et thésauriseur perdent structurellement
   (pop sans économie ; ressources sans tempo — maxWorkersEarly 8 assèche la pop
   et le rythme). Les pondérations par faction amplifient (Acadiane/Confédération
   tirent souvent ces profils).
6. **Mobilité et agressivité trop basses chez les perdants** : 14 déplacements
   contre 20, moitié moins d'attaques → −2 territoires, zéro étoile de combat
   (Δ41 et Δ23 pour combat1/combat2).

## Plan d'amélioration de la réflexion (par gain/effort décroissant)

- **P1 — Tuer le tour mort « +1$ »** : quand le bot est fauché, préférer
  Produce (gratuit) ou un bas payable ; n'autoriser « +1$ » qu'en vrai blocage
  total ; interdire Trade→pop sous 2$ hors sprint de palier. *Cible : moveCoin
  < 1/partie, fauchés ≤3$ < 30 %.*
- **P2 — Planification à 1 coup + adaptation au plateau** : dans `scoreColumn`,
  créditer une partie du bonus « bas jouable » si les gains du top le rendent
  payable au tour suivant ; moduler la priorité du bas par
  `(bonus $ de la colonne) − (coût − minimum)` du plateau. *Cible : Forge sort
  de la cave, build/enlist des derniers +50 %.*
- **P3 — Sprint de palier de pop en fin de partie** : si `ctx.endgame` et pop
  ∈ {5,6} ou {11,12}, gros boost du Trade→pop ; en début de partie, conditionner
  la chasse à la pop à une économie saine. *Cible : derniers en palier ×1 < 20 %.*
- **P4 — Ne pas finir en étant derrière** : étendre le garde-fou aux étoiles
  contrôlables (pas de Bolster vers power16/pop18 à 5 étoiles si derrière) et
  retarder la révélation d'objectif des bots quand elle donnerait la 6ᵉ étoile
  avec `estimateScore < bestOppScore`. *Cible : « déclencheur perd » 41 % → <25 %.*
- **P5 — Rééquilibrer les profils faibles** : bâtisseur popTarget 13→10 +
  chasse à la pop conditionnée à l'économie ; thésauriseur maxWorkersEarly 8→6
  et produceBoost gated sur des débouchés bottom réels.
- **P6 — Chantiers déjà consignés** (TODO_proto_fixes.md) : pose de bâtiments
  selon la tuile bonus, stratégie Tesla, visualisation du tour du bot.

Chaque étape se mesure avec les mêmes outils (`analyzeLosers` + `botBehavior`,
mêmes seeds) — on valide sur les MÉTRIQUES DE COMPORTEMENT, pas sur les
winrates bot-vs-bot.

---

## Résultats après implémentation (v0.15) — mêmes 300 parties, seed 101

| Métrique | Avant | Après | Cible |
|---|---|---|---|
| **Tours morts « +1$ » / partie (derniers)** | 4,1 | **0,0** | < 1 ✅ |
| Score du dernier | 40,6 | **50,2** | ↑ ✅ |
| Étoiles du dernier | 2,4 | **3,0** | ↑ ✅ |
| Écart gagnant−dernier | 48,9 | **43,6** | ↓ ✅ |
| Derniers au palier ×1 (pop ≤ 6) | 32,3 % | **20,7 %** | < 20 % ≈ ✅ |
| Gagnants au palier ×1 | 14,3 % | **6,0 %** | ↓ ✅ |
| Étoile Recrues (derniers) | 29 % | **46 %** | ↑ ✅ |
| Étoile Bâtiments (derniers) | 22 % | **27 %** | ↑ ✅ |
| Dernière place — pire profil | bâtisseur 40 % | **33 %** | resserré ✅ |
| « Déclencheur perd » | 41,1 % | 37,8 % | < 25 % ❌ |

**Ce qui a été implémenté** (P1→P5 + deux découvertes) :

- **P1** — Le « +1$ » n'est plus joué qu'en blocage économique réel (fauché,
  Produire impossible, aucun bas payable) ; Produire est fortement valorisé
  quand la trésorerie est vide ; on n'achète plus de pop avec son dernier
  dollar. Résultat : les tours morts disparaissent complètement.
- **P2** — `scoreColumn` crédite désormais la **préparation à 1 coup** (le
  haut de la colonne rend son propre bas payable au tour suivant) et pondère
  chaque action du bas par sa **rentabilité sur CE plateau**
  (`matValueOf` : bonus $ imprimé contre surcoût).
- **P3** — **Sprint de palier** : franchir 6→7 ou 12→13 pop en fin de partie
  vaut +22 au score de la colonne (tout le décompte est multiplié).
- **P4** — Veto de fin de partie porté de −18 à **−70** (il ne pesait rien
  face au +25/+15 de la colonne), étendu aux **étoiles automatiques**
  (16 puissance, 18 pop, 8 ouvriers), à la **révélation d'objectif**, et —
  découverte de l'analyse — aux **gains gratuits** des cartes d'usine et des
  rencontres, qui contournaient totalement le garde-fou (« 6 Améliorations »
  et « 4 Recrues » étaient les déclencheurs perdants les plus fréquents).
  Nouveau mode **capitalisation** : à 5 étoiles et distancé, le bot bascule
  sur ressources + palier de pop au lieu de conclure.
- **P5** — Bâtisseur : palier visé 13→10, boost d'achat 7→4, production +1.
  Thésauriseur : garde ses 8 ouvriers (son identité) mais soumis à P7.
- **P6** — Les bots **choisissent enfin leur hex de construction selon la
  tuile bonus** (`pickBuildHex`, gain marginal réel simulé, préférence pour un
  hex défendu) ; le simulateur tire désormais une tuile et la score. Quête
  **Tesla** : les profils patients (bâtisseur, thésauriseur) retardent leur
  visite de l'Usine, privilégient les rencontres 🔬 et prennent le fragment
  en récompense de combat PvE.
- **P7 (découverte)** — **Produire coûte 1♥ dès 6 ouvriers** : un bot qui
  produisait 13 fois se saignait de 13 popularité, d'où les derniers à pop 0.
  Le bot refuse désormais de retomber sous un palier pour 2 ressources, et ne
  sort le 6ᵉ ouvrier que s'il a un moteur de pop (Mémorial, palier confortable)
  ou vise l'étoile des 8.
- **Précision de l'estimateur** — `estimateScore` divergeait du vrai décompte
  (il comptait les ressources hors territoires contrôlés, ignorait les pièges
  Frente et la tuile bonus) : le bot « croyait mener » dans 75 % des
  déclenchements perdants. Aligné sur le barème réel.

**Sur le « déclencheur perd » à 37,8 %** : la ventilation par taille de partie
montre que ce n'est pas (principalement) un défaut d'IA — **22 % à 2 joueurs,
33 % à 3, 46 % à 4, 49 % à 5**. Avec quatre adversaires, la probabilité qu'au
moins un dépasse le déclencheur est mécaniquement élevée ; c'est le
comportement du scoring de Scythe, pas une erreur de décision. Les garde-fous
fonctionnent (jusqu'à 11 renoncements observés sur une seule partie).

**Verrouillé par les tests** (`src/logic/__tests__/botDecisions.test.js`) :
absence de tours morts, sémantique de `losingTrigger`, refus/acceptation de
conclure selon le score, fidélité de `estimateScore` au décompte, et refus de
brader un palier de popularité pour produire.
