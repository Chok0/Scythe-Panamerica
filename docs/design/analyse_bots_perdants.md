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
| Score du dernier | 40,6 | **52,8** | ↑ ✅ |
| Étoiles du dernier | 2,4 | **3,0** | ↑ ✅ |
| Derniers au palier ×1 (pop ≤ 6) | 32,3 % | **9,7 %** | < 20 % ✅ |
| Gagnants au palier ×1 | 14,3 % | **3,3 %** | ↓ ✅ |
| Ressources du dernier (pts) | 9,8 | **10,5** | ↑ ✅ |
| Étoile Recrues (derniers) | 29 % | **~46 %** | ↑ ✅ |
| Dernière place — pire profil | bâtisseur 40 % | **36,5 %** | resserré ✅ |
| **« Déclencheur perd »** | 41,1 % | **22,4 %** | < 25 % ✅ |

Honnêteté de mesure : le « déclencheur perd » a été revérifié sur plusieurs
graines après le correctif final — **23,5 % (101) · 21,5 % (202) · 26,6 %
(303)**, soit ~24 % contre 41 % avant. Toutes les autres métriques sont issues
de la graine 101, avant et après, à périmètre identique. Ces chiffres
mesurent la QUALITÉ DE DÉCISION des bots, pas l'équilibre du jeu pour un
humain (verdict de playtest : les parties bot-vs-bot ne valident pas cela).

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

- **P8 (découverte de la partie de test)** — **Plancher de palier de
  popularité**. Chasser un ouvrier coûte 1♥ ; les seuils existants
  (`p.pop >= 2/3`, ou `min(7, popTarget)` qui tombait à 3 pour le blitz)
  laissaient un bot agressif se vider jusqu'à 0 — partie de test mesurée avec
  un blitz à **5 étoiles ET pop 0** (palier ×1 : ses étoiles ne valaient plus
  que 15 points au lieu de 25). Un malus explicite (`popTierPenalty`) est
  désormais appliqué à toute action qui ferait retomber sous un palier, et le
  blitz vise 6 de popularité au lieu de 3. Le veto de fin de partie couvre
  aussi les **étoiles de combat**, attribuées après le tour (pvpBots) donc
  hors de portée de `scoreColumn`.

- **P9 (découverte de la partie de test)** — **Servitude n'est plus
  automatique chez les bots**. La capture d'ouvrier de la Confédération coûte
  2 popularité et s'appliquait d'office (c'est pourtant un CHOIX pour le
  joueur humain, via `abilityOffer`) : −4 pop sur la partie, soit un palier de
  score perdu. La partie de test l'a vue conclure à **pop 3, palier ×1, 6
  étoiles et dernière place**. Le bot ne capture désormais que si sa
  popularité le supporte — sauf pour la 2ᵉ capture, qui complète l'objectif de
  faction « Le Joug ».

- **P10** — **Étoiles latentes**. Le veto ne testait que « exactement 5
  étoiles » : un bot pouvait passer de 4 à 6 dans le MÊME tour (bâtiment
  gratuit d'usine + étoile de combat + objectif de faction), observé en partie
  de test. `losingTrigger` compte désormais les objectifs DÉJÀ remplis mais non
  révélés — un bot à 4 étoiles avec deux missions mûres se sait à 6.

**P8 et P10 ont fait l'essentiel du « déclencheur perd »** (41 % → ~24 %) :
des bots qui gardent leur palier ont un score réel proche de leur estimation,
donc le garde-fou décide juste. La ventilation par taille de partie montre que
le reliquat est structurel — **22 % à 2 joueurs contre 49 % à 5** : avec quatre
adversaires, la probabilité qu'au moins un dépasse le déclencheur est
mécaniquement élevée ; c'est le scoring de Scythe, pas une erreur de décision.

---

## Confédération : une faction qui ne jouait pas son plan (v0.15)

La Confédération restait la plus souvent dernière (41 %). La cause n'était pas
un réglage de valeurs mais une **erreur d'identité** : le profil « bâtisseur »
(pacifiste, moteur de popularité, `aggroMargin` 4 donc évite le combat) lui
était attribué dans ~40 % de ses parties — l'exact contraire de son plan.

Son identité de design est celle d'une **Saxonie** : faction violente et
MOBILE qui ne bâtit pas mais vit sur le dos des autres — voler les ouvriers
(Servitude), piller les ressources, rafler les rencontres très vite, et
surtout **empêcher les adversaires de se déployer naturellement** en chassant
leurs ouvriers de leurs hubs. Son score vient des TERRITOIRES et du butin. Le
matériel le confirme : **Cavaliers (+2 puissance en attaque)** et riverwalk
*plaine/village* — qui mène droit sur les hubs d'ouvriers.

**Profil `harceleur`** (`botProfiles.js`) : `earlyAttack`, `aggroMargin: -1`
(attaque à parité — le +2 des Cavaliers fait la différence), `moveBoost: 7`
(la plus mobile), `encounterPull: 14`, `maxWorkersEarly: 4` (mobilité, pop
préservée), plus deux leviers inédits câblés dans `pickMoveTarget` :
- `disruption` — valeur du **déni** : chasser les ouvriers d'un hub adverse
  lui interdit Produire ET Déployer sur ce hex ; plus le hub est peuplé, plus
  le coup fait mal ;
- `lootPull` — pillage dès le premier tas de ressources (les autres profils
  attendent 3+).

Deux corrections structurelles ont suivi : l'estimation de force en attaque
**intègre enfin le bonus de combat de la faction** (la Confédération
sous-évaluait systématiquement ses propres charges), et le harceleur **rachète
la popularité** que ses razzias lui coûtent (Arsenal + Mémorial en tête de sa
liste de construction : il joue Soutien en permanence, chaque Soutien devient
+1 puissance ET +1 popularité). Sans ça, il finissait à pop 4-5, tout son
score en ×1.

**Mesures (600 parties)** — le profil se comporte exactement comme le design
l'annonce, « efficace à peu de joueurs » :

| Joueurs | Victoire (harceleur) | Score moyen | Pop finale |
|---|---|---|---|
| 2 | 63 % *(n=30, à confirmer)* | 86 | 11,0 |
| 3 | **43 %** | 67 | 9,9 |
| 4 | 32 % | 70 | 9,6 |
| 5 | 37 % | 65 | 8,3 |
| *référence (autres profils)* | *27 %* | *70* | — |

Vérification croisée (graines 303/404) : à **3 joueurs le résultat est stable**
— 43 / 50 / 45 % de victoires, nettement au-dessus des 27-29 % de référence.
À **2 joueurs l'échantillon est trop faible** (6 à 30 sièges selon la graine,
résultats de 17 % à 70 %) : la supériorité à deux reste à confirmer, mais rien
ne la contredit.

Confédération : victoires **19 % → 31,1 %**, dernières places **41 % → 35 %**,
combats PvP du jeu **2,4 → 4,0 par partie**, et c'est désormais elle qui rafle
le plus de rencontres (2,7/partie, record du jeu). Équilibre général des
factions conservé : 19 % (Bayou) à 35 % (Dominion) de victoires pour une
espérance de ~26 %.

**Piste ouverte** : le Bayou est désormais la faction la plus faible (19 %) —
à examiner en playtest humain avant tout ajustement automatique.

**Verrouillé par les tests** (`src/logic/__tests__/botDecisions.test.js`) :
absence de tours morts, sémantique de `losingTrigger`, refus/acceptation de
conclure selon le score, fidélité de `estimateScore` au décompte, et refus de
brader un palier de popularité pour produire.

---

## Check-up d'identité des factions (v0.15)

Après la Confédération, revue systématique : le profil attribué correspond-il
au MATÉRIEL de la faction (ability, bonus de combat, objectif, géographie) ?

| Faction | Matériel | Profils attribués | Verdict |
|---|---|---|---|
| Confédération | Cavaliers +2 en attaque · Servitude · riverwalk village | harceleur, blitz | ✅ corrigé (bâtisseur retiré) |
| Frente | Peuple Armé (+1 carte SUR ses ouvriers) · 4 pièges · sierra/désert | équilibré, thésauriseur, bâtisseur | ✅ cohérent : elle tient son terrain, ne conquiert pas |
| Nations | Ronin (+1 carte mecha SEUL) · mechas en bois · plaines/forêts | équilibré, bâtisseur, blitz | ✅ cohérent (expansion) |
| Acadiane | White Flag (REFUSE le combat) · comptoirs · lacs | thésauriseur, bâtisseur | ✅ cohérent : elle ne se bat jamais volontairement |
| Bayou | Chimère (capture un mecha) · Flibuste · mechas en bois | **prédateur**, blitz | ✅ corrigé (bâtisseur pacifiste retiré) |
| Dominion | Discipline · Commerce Impérial | équilibré, thésauriseur, blitz | ✅ cohérent (marchand) |

### Bayou : deux bugs structurels, pas un problème de profil

Le Bayou plafonnait à 19 % de victoires. Le profil « prédateur » créé pour lui
a d'abord fait PIRE (13 % contre 25 % pour l'équilibré) — signe que le problème
était ailleurs. Deux causes réelles :

1. **Son objectif de faction était impossible en partie standard.** « Le
   Prédateur » exigeait *2 Empire détruits*, or l'Empire est désactivé par
   défaut (mécanique de campagne) : le Bayou perdait d'office une étoile que
   toutes les autres factions pouvaient décrocher. Corrigé — la prédation
   compte désormais les mechas de l'Empire **ou** les victoires en combat
   contre les joueurs. Même esprit, jouable dans les deux modes.

2. **Famine alimentaire.** Mesure des ressources accessibles à deux pas du
   départ :

   | Faction | nourriture à portée | étoile Recrues |
   |---|---|---|
   | Nations | 3 | 93 % |
   | Frente | 2 | — |
   | Confédération | 3 | — |
   | **Bayou** | **1** | **43 %** |
   | **Acadiane** | **1** | — |

   Or Enrôler coûte de la NOURRITURE sur les six plateaux, et l'étoile des
   recrues est la plus discriminante du jeu (Δ49 points de pourcentage entre
   gagnants et derniers). Le Bayou ne recrutait que 2,6 fois sur 4.
   Deux correctifs ont été essayés ; le premier a été **rejeté en revue de
   design** et il vaut la peine de dire pourquoi.

   *Rejeté* — « Chasse des Marais » : donner au Bayou une ressource alternative
   pour Enrôler (du bois au lieu de la nourriture). Ça marchait (étoile des
   recrues 43 % → 85 %) mais c'était une fausse bonne idée : ça faisait doublon
   avec l'« Esprit Sauvage » des Nations, ça diluait deux identités d'un coup,
   et surtout ça résolvait par une CAPACITÉ un problème qui était de la CARTE.
   La réaction naturelle d'un joueur humain devant une pénurie n'est pas de
   réclamer un passe-droit : c'est de commercer, ou de sortir de son îlot en
   déployant un mecha ou en posant une Gare — très accessible pour le Bayou,
   dont l'îlot de départ contient une forêt.

   *Retenu* — **échange des hexes 38 ↔ 30** (`hexes.js`). Le champ passe en
   #38, juste en face du village de départ du Bayou (#35), et le désert
   descend au centre (#30), près de l'Usine. La nourriture devient accessible
   sans rien changer aux règles — mais il faut la MÉRITER : **#38 est séparé
   de #35 par une rivière**. Le Bayou doit donc déployer son mecha Mangrove ou
   poser une Gare, exactement le plan qu'un humain suivrait. Bonus : #38 est
   aussi à la frontière de la Frente Libre, ce qui crée une vraie tension sur
   un hex que les deux factions convoitent.

### Le Bayou, faction des marais — arbitrage de sa capacité (v0.15)

Trois candidates étaient restées en suspens. Arbitrage :

| Candidate | Verdict |
|---|---|
| Vol d'argent | Déjà pris — c'est **Flibuste**, sa capacité de combat (mecha slot 2) |
| Vol de mecha (Chimère) | Calquée sur la **Servitude** de la Confédération (capturer une unité sur victoire) : même reproche que Bois flotté / Esprit Sauvage. **Rétrogradée au slot 2**, fusionnée avec Flibuste — le pirate rançonne le vaincu (2 pièces) et, 1×/partie, remorque son épave |
| **Circulation libre sur les marais** | **Retenue** |

Pourquoi le marais l'emporte : c'est la seule des trois qui soit active **dès
le tour 1**, comme toutes les vraies capacités de faction (Servitude, Tierra
Minada, Esprit Sauvage, Comptoir). La Chimère, elle, ne se déclenchait qu'une
fois par partie et sur une victoire contre un mecha — mesurée à 37-55 % des
parties, souvent après le tour 20. C'est aussi l'analogue direct du
« Seaworthy » nordique du jeu original : un terrain que toute la faction
traverse gratuitement, avant même le premier mecha.

**Sang du Marais** : les unités du Bayou traversent les marécages sans payer
le péage (-1♥ par ouvrier / -1⚡ par unité de combat) et **sans arrêt forcé**.
Le mecha **Pirogue** (slot 3) devient l'étage supérieur de la même idée : du
marais, on bondit vers n'importe quel autre marais du plateau.

Ce n'est pas un cadeau gratuit — c'est la géographie du Bayou. Le marécage #20
touche son #28 de départ **sans rivière**, et ouvre #16 (montagne/métal) puis
#23 (désert/pétrole), également sans rivière — alors que la liaison directe
#28 → #23 est barrée par une rivière. Le marais est littéralement son pont
sans péage, et c'est ce qui fait de lui la seule faction à ne pas démarrer
enclavée (îlot de 31 hexes contre 3 pour toutes les autres — les autres
atteignent le même continent, mais en payant le péage à chaque passage).

**Bug de bot au passage** : `pickMoveTarget` portait le commentaire « Avoid
lakes/swamps for non-appropriate factions » … mais appliquait le malus de −5 à
**toutes** les factions. Le Bayou fuyait donc son propre marais et l'Acadiane
ses propres lacs. Corrigé, avec exemption par faction — le Bayou met désormais
le pied dans un marécage 1,32 fois par partie contre 0,03-0,48 aux autres.

### Check-up des riverwalks — deux capacités mortes (v0.15)

La carte ayant été retouchée plusieurs fois, les riverwalks n'avaient jamais
été revérifiés. Critère retenu : **un riverwalk doit ouvrir au moins une
SORTIE de l'îlot de départ de sa faction**, sinon le joueur paie un mecha pour
rien. Audit reproductible : `node scripts/riverwalkAudit.mjs` (verrouillé par
un test).

| Faction | Avant | Sorties | Après | Sorties |
|---|---|---|---|---|
| Confédération (Gué) | plaine + village | 1 + 0 | plaine + **désert** | 1 + 1 |
| Frente (Sentier) | sierra + désert | 0 + 1 | **montagne** + désert | 2 + 1 |
| Nations (Piste) | plaine + forêt | **0 + 0** ⚠ | **plaine + toundra** | 2 + 1 |
| Acadiane (Portage) | forêt + village | **0 + 0** ⚠ | **plaine + montagne** | 1 + 1 |
| Bayou (Mangrove) | désert + village | 1 + 2 | **champs** + village | 3 + 2 |
| Dominion (Queen's Road) | forêt + montagne | 2 + 0 | forêt + **plaine** | 2 + 2 |

Les Nations et l'Acadiane payaient un mecha pour une capacité qui n'ouvrait
**aucun** passage. L'Acadiane est la plus enclavée du jeu — elle n'a que deux
sorties terrestres sur tout le plateau (#9→#12 et #9→#16) — et le Portage
n'en ouvrait aucune des deux. Son winrate passe de 22 % à ~31 %.

Le désert du Bayou a été retiré non pas parce qu'il était mort, mais parce que
le Sang du Marais ouvre désormais #23 **gratuitement** : le mettre au riverwalk
revenait à faire payer un mecha pour un passage déjà ouvert.

### Objectifs de faction : de 2 % à 76 % de réussite (v0.15)

Mesure sur 400 parties : l'étoile d'objectif de faction n'était pas du tout la
même récompense selon la faction.

| Faction | Objectif | Avant | Après |
|---|---|---|---|
| Dominion | Le Tribut — pièces via Commerce Impérial | **76 %** | 25 % (seuil 10 → **20** ; il en gagnait 16,1 passivement) |
| Bayou | Le Prédateur | 20 % | 20 % (inchangé) |
| Confédération | Le Joug | 19 % | 22 % (inchangé) |
| Frente | Terre Libérée | 8 % | 25 % (3 → **2** ouvriers sur sierra/désert) |
| Nations | Le Grand Retour | **2 %** | 15 % (5 → **4** hexes plaine/forêt) |
| Acadiane | Réseau Invisible | **2 %** | 34 % (voir ci-dessous) |

Trois enseignements :

1. **Le Tribut se validait tout seul.** 76 % de réussite pour une étoile que le
   Dominion décrochait sans plan, simplement en jouant sa capacité. Le seuil
   est passé au-dessus de sa moyenne : il faut désormais bâtir son commerce.

2. **Le Grand Retour demandait un plateau parfait.** Un joueur contrôle 5,5
   hexes en fin de partie ; en exiger 5 d'un couple de terrains précis était
   hors de portée. Seuil à 4 — elle en tient déjà 2 au départ.

3. **Le Réseau Invisible avait un verrou invisible** : « héros SUR un lac »
   était un INSTANTANÉ de fin de partie. Il fallait que le héros s'y trouve
   encore au décompte, alors qu'il n'y entre qu'avec le Batelier (slot 3) et
   qu'il a mille raisons d'en repartir. Reformulé en ACQUIS durable — *un
   comptoir posé sur un lac* — les deux piliers de l'identité (réseau étalé,
   maîtrise des lacs) sont préservés et l'objectif devient jouable.

   Le bot y contribuait aussi : il posait son comptoir sur le premier hex venu
   et sabotait sa propre condition de non-adjacence. Il garde désormais son
   jeton plutôt que de le coller au réseau, et son héros vise les lacs tant
   qu'il n'y a pas de comptoir lacustre.

**Effet de bord détecté et corrigé** : l'échange 38 ↔ 30 a supprimé une sierra
du plateau (il n'en reste que deux, #32 et #45) — et #38 était justement la
sierra voisine du départ de la Frente. Son objectif exigeait 3 ouvriers sur
sierra/désert : devenu hors de portée, ramené à 2.

### Profil prédateur : il chassait bien, il ne convertissait pas

Le profil du Bayou est resté le pire du jeu (19,6 % de victoires, **3,25
étoiles** contre 4,58 au harceleur) alors même que ses combats se passaient
bien. Le diagnostic est le même que pour le harceleur un cran plus tôt : la
popularité arrivait **4e** dans ses priorités d'enrôlement, alors que ses
combats déplacent des ouvriers et lui coûtent de la pop — et que le palier de
pop MULTIPLIE étoiles, territoires et ressources. Il finissait tout son score
en ×1.

Corrections : popularité 4e → 2e à l'enrôlement, `starRush` 3 → 4,
`encounterPull` 8 → 12, `lootPull` ajouté (Flibuste est littéralement du
pillage), et surtout — la chasse aux machines ne se déclenche plus **avant le
mecha slot 2**. La Chimère y ayant été rétrogradée, attaquer une machine sans
lui, c'est risquer un combat pour rien : ni épave, ni pièces.

→ **19,6 % → 25,5 %** de victoires, score 62,1 → 66,2, étoiles 3,25 → 3,51.

### Équilibre des factions après le check-up

| Faction | Avant | Après |
|---|---|---|
| Dominion | 35,0 % | 27,8 % |
| Nations | 32,7 % | 29,0 % |
| Confédération | 31,1 % | 29,7 % |
| Frente | 29,8 % | 28,9 % |
| Acadiane | 24,1 % | 25,0 % |
| **Bayou** | **19,1 %** | **27,8 %** |

L'écart passe de **16 points** (19-35 %) à **4,7 points** (25,0-29,7 %) pour
une espérance de ~26 % — sans avoir touché à une seule valeur d'équilibrage :
uniquement en réparant un objectif impossible, une famine géographique et des
profils contraires à l'identité des factions.

### Après la refonte carte + riverwalks + objectifs (900 parties, seed 3)

| Faction | Winrate | Objectif de faction | Étoile mechas |
|---|---|---|---|
| Frente | 34,5 % | 25 % | 96 % |
| Nations | 32,5 % | 15 % | 93 % |
| Acadiane | 31,4 % | 34 % | 79 % |
| Confédération | 26,2 % | 22 % | 91 % |
| Bayou | 23,5 % | 20 % | 69 % |
| Dominion | 20,7 % | 25 % | 95 % |

L'Acadiane, longtemps la faction la plus faible du jeu (22 %), remonte à 31 %
uniquement en réparant son riverwalk mort et son objectif verrouillé. Le
Dominion redescend de 35 % à 21 %, conséquence assumée de la perte de son
étoile quasi-automatique.

**Rappel méthodologique** : ces winrates sont des signaux de QUALITÉ DE
DÉCISION des bots, pas une validation d'équilibrage. Un humain bat ces bots
sans difficulté ; seul le playtest humain tranche l'équilibrage. Ce qui est
validé ici, en revanche, est structurel et vaut pour un humain aussi : plus
aucune capacité morte, plus aucun objectif de faction hors de portée ou
offert.

**Points à surveiller** :

- L'étoile mechas du Bayou (69 %) et de l'Acadiane (79 %) reste en retrait :
  toutes deux sont pauvres en métal près de leur départ. À observer en
  playtest avant tout correctif — les deux ont maintenant une sortie d'îlot
  jouable (marais et Portage).
- Le Dominion n'a toujours **aucune capacité de position** (slot 3 de mecha)
  codée, contrairement aux cinq autres factions.

---

## P11 — Palier de pop ×2 : les profils agressifs restent englués (29/07/2026)

Découverte lors des playtests API du 29/07 (`docs/design/parties_api/`,
lot 2/3) : même après P3/P8 (sprint de palier, plancher de pop), la
simulation (300 parties, seed 101) montrait encore un déséquilibre net sur
le palier ×2 (7-12) vs ×3 (13+) :

| | tier0 (≤6) | tier1 (7-12) | tier2 (13+) |
|---|---|---|---|
| Gagnants | 1,3 % | 22,7 % | 76,0 % |
| Derniers | 22,0 % | 37,0 % | 41,0 % |

Cause identifiée dans `bot.js` : les profils agressifs (blitz, prédateur,
harceleur) plafonnent volontairement leur `popTarget` à 6-8 (« rapide, pas
suicidaire », décision P5/v0.15 assumée). Mais entre ce plafond et le palier
×3 (13), rien ne les pousse à continuer d'acheter de la pop : le boost
« sprint de palier » (P3, `nearTier`) n'agit qu'à UNE action du seuil — un
bot qui stagne à 9-11 pop (au-delà de son plafond, en-deçà de 13) n'a plus
aucune raison de progresser et reste englué au palier ×2 jusqu'à la fin.

**Correctif** : en fin de partie (`sprint`/`endNearT` — même détection que
P3), le plafond effectif d'achat de popularité remonte à `max(popTarget, 13)`
pour TOUS les profils, dans les deux endroits qui en dépendaient
(`scoreColumn`, pour le choix de colonne, et l'exécuteur `Trade`, pour la
dépense réelle). Hors sprint, les profils agressifs gardent leur plafond bas
inchangé — seul le comportement de fin de partie change.

**Mesure (300 parties, seed 101, avant/après)** :

| | Avant | Après |
|---|---|---|
| Derniers tier0 (≤6) | 22,0 % | **15,0 %** |
| Derniers tier1 (7-12) | 37,0 % | 37,0 % |
| Derniers tier2 (13+) | 41,0 % | **48,0 %** |
| Prédateur — dernier / gagnant | 43,4 % / 19,2 % | **40,9 % / 25,8 %** |
| Blitz — dernier / gagnant | 38,4 % / 22,0 % | 38,5 % / 22,6 % |
| Harceleur — dernier / gagnant | 37,3 % / 26,5 % | 38,6 % / 24,1 % |
| Équilibré — dernier / gagnant | 25,3 % / 28,5 % | 23,2 % / 30,4 % |
| Bâtisseur — dernier / gagnant | 17,4 % / 34,3 % | 22,5 % / 32,5 % |
| Thésauriseur — dernier / gagnant | 21,7 % / 34,8 % | 20,5 % / 29,0 % |

Amélioration nette et cohérente sur la mesure globale (tier0 en baisse,
tier2 en hausse chez les derniers) et sur le prédateur (le plus mauvais
profil du jeu, cf. section dédiée plus haut). Signal mixte/dans le bruit sur
harceleur et bâtisseur — **une seule graine, pas encore revérifié sur
plusieurs** (contrairement à la méthodologie P8-P10 qui croise 2-3 graines
avant de conclure) : à confirmer avant d'aller plus loin, notamment si un
futur ajustement cible spécifiquement le harceleur ou le bâtisseur.

Vérifié sur une deuxième graine (202) pour la distribution globale : tier0
derniers 17,7 %, tier2 derniers 49,0 % — cohérent avec la graine 101,
confirme que le nouveau plafond ne dépend pas d'un tirage particulier.

Tests bot existants (24) et 20 parties simulées : pas de régression de
stabilité.
