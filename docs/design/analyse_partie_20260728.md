# Analyse de partie — 28/07/2026 (Confédération humaine vs Acadiane + Nations Souv. + Bayou)

Source : export JSON du journal (25 tours, carte panamerica-v3, difficulté normale).
Score final : **Confédération (humain) 77** · Acadiane 38 · Nations Souv. 34 · Bayou 28.

Ressenti du joueur : « les bots n'ont pas été au niveau, je ne me suis pas senti
menacé, j'ai fini sous le premier palier de popu et j'ai quand même gagné. »
Le journal confirme les trois points — et permet de dire exactement pourquoi.

## 1. La partie en chiffres

| | Humain | Acadiane | Nations Souv. | Bayou |
|---|---|---|---|---|
| Profil | (Terroir) | 📦 Thésauriseur | ⚖ Équilibré | ⚔ Blitzkrieg |
| Étoiles | **6** (T18→T25) | **0** | 2 (T14, T23) | 2 (T17, T20) |
| Territoires | 10 (+2 Usine) | 5 (+3 comptoirs) | 3 | 5 |
| Pièces | **33** | 4 | 11 | 7 |
| Popularité | 6 (palier ×1) | 10 | 8 | 6 |
| Combats livrés | 0 | 0 | 0 | 0 |

Trois faits structurants :

1. **Zéro combat en 25 tours**, tous camps confondus — pour un jeu dont le
   moteur de tension est le combat, c'est LE symptôme.
2. Le humain gagne **sous le palier ×1** avec 39 points d'avance. Son score se
   passe du multiplicateur : 18 (étoiles) + 24 (territoires) + 2 + **33 de
   cash** (43 % du total). À pop 7, le même plateau vaudrait ~97 points.
3. Sprint final : 0 étoile jusqu'au T17, puis **6 étoiles en 8 tours**
   (Le Joug T18, 4 recrues T20, Le Magnat T21, 4 mechas T23, 6 améliorations
   T24, puissance max T25 → fin immédiate). Les bots n'ont ni vu venir ni pu
   répondre.

## 2. Pourquoi le joueur ne s'est pas senti menacé

### RC1 — Les bots ne peuvent (presque) jamais justifier une attaque contre lui

Contrairement à ce que suggère le commentaire hérité de `bot.js:862`
(« jamais ciblées »), le PvP bot→humain **existe** : `attackable` inclut les
hexes humains (`App.jsx:600`), `forbidden` est passé vide (`App.jsx:615`) et le
modal de défense interactif est en place (`App.jsx:729-753`). Le blocage est
ailleurs, dans la porte de décision (`bot.js:499`) :

```
myStrength >= defStrength + aggroMargin
```

- `myStrength` d'un bot = puissance engagée réelle + 2 cartes max. Bayou au
  mieux de sa forme : ~9. Acadiane : ~4.
- `defStrength` du humain = min(puissance, 7) + cartes×2 limitées aux unités
  sur l'hex (`App.jsx:596-598`). Dès le T12 le humain tient ⚡8+ et 3-10
  cartes : **11+ sur chacun de ses hexes, en permanence**.

La dissuasion a fonctionné toute la partie : l'étoile « puissance max » du
humain a doublé comme bouclier absolu. C'est sain en soi — le vrai problème
est que **les bots ne construisent jamais la puissance qui rendrait une
attaque possible** : Acadiane a passé les tours 8 à 19 à ⚡0, le « Blitzkrieg »
Bayou a oscillé entre ⚡0 et ⚡3 pendant dix tours (2-3 Soutiens sur toute la
partie malgré `bolsterBoost: 3`). Un profil de guerre sans carburant de guerre
est un profil pacifiste de fait.

*Nettoyage au passage : le commentaire de `bot.js:862-863` et le paramètre
`forbidden` (toujours vide) ne décrivent plus le comportement réel — à purger
avant qu'ils n'égarent une prochaine session.*

### RC2 — La « phase » d'un bot est indexée sur SES étoiles : 25 tours en mode early

`getPhase = stars >= 5 ? "late" : stars >= 3 ? "mid" : "early"` (`bot.js:22`).
Aucun bot n'a dépassé 2 étoiles → **les trois bots ont joué les 25 tours en
mentalité « early »** : mechs casaniers (le `worthIt` de `bot.js:1066-1071`
exige late/butin/menace), pas de drop-runs d'expansion (`bot.js:1086`), porte
d'attaque fermée pour les profils non-earlyAttack (`bot.js:499`), pas de
sprint de palier.

Et le repli stratégique (`shouldPivot`) exige `endgame` = « un adversaire à
5+ étoiles » (`App.jsx:628`) : il s'est déclenché pour les trois bots au
**T24** — un tour avant la fin. Le journal le montre en toutes lettres :
« son plan ne paie pas — repli » ×3, à l'avant-dernier tour.

→ Correctif proposé : asseoir la phase sur l'horloge de la partie (tour
courant et/ou max d'étoiles TOUS joueurs confondus), et autoriser le pivot
dès la mi-partie sur écart de score (le critère `myScore < 0.75×best` était
vrai dès le T15 ; c'est `endNear` qui verrouillait).

### RC3 — Personne ne se rencontre : trois bots dans trois quadrants

Bayou n'a pas quitté #28-#38, Nations Souv. #10-#25, Acadiane #1-#16. Les
cibles `attackable` des uns ne sont jamais entrées dans les `validMoves` des
autres (1-2 hexes de portée sans Vitesse, mechs bloqués au camp par RC2). Le
`moveBoost: 3` du blitz ne crée pas de trajectoire de convergence : il n'existe
aucun score « se rapprocher d'une cible à 3+ tours » hors aimant à magot
(`hoardHex`, `bot.js:582`) — qui n'a rien aimanté ici car les gros tas
voyageaient dans les soutes du humain.

### RC4 — Acadiane, 2e au score, 0 étoile : le plan comptoirs abandonné aux 3/4

- M. Thibodeau pose 3 comptoirs (T9 #9, T11 #15, T17 #1)… puis **ne bouge plus
  jamais** (T18-T24 : Produire / +1 Pop / +2 ressources). « Réseau Invisible »
  exige 4 comptoirs non adjacents **dont 1 sur un lac** (`factions.js:112`).
- Le comptoir lacustre demande Batelier (slot 3) ; ses 3 deploys ont pris
  Vitesse, Portage, White Flag — **jamais le slot 3**. L'objectif était
  mécaniquement mort dès le T18, et le bot ne le « sait » pas.
- Elle a aussi raté l'étoile 4 mechas d'un seul deploy (3/4, du métal en
  stock, mais 0-3 $ en caisse à partir du T10 : `deployAltRes` pétrole non
  approvisionné, aucun plan de trésorerie — 1 tour entier perdu en « +1$
  (blocage économique) » au T13).
- 5 tours entiers dépensés en « +1 Pop » sec pour finir à pop 10 : un palier
  ×2 qui multiplie… 0 étoile et 8 territoires. Le goutte-à-goutte de pop
  diagnostiqué en v0.15 est toujours là, en plus sournois : la pop est
  ACHETÉE, mais le moteur d'étoiles qu'elle devait multiplier n'existe pas.

→ Correctifs proposés : (1) prioriser le deploy du slot exigé par l'objectif
de faction tant qu'il est atteignable ; (2) tant que `flagTokens < 4`, le
héros Acadiane garde une raison de bouger (le bonus +4/-3 de `bot.js:611-615`
ne pèse rien si le héros ne bouge pas du tout) ; (3) plafonner les tours
« +1 Pop » consécutifs quand étoiles = 0 après le tour 12.

### RC5 — Vitesse d'étoiles : 6 en 8 tours contre 2 en 25

Le humain a fermé la partie sur des étoiles « d'ingénierie » : 4 recrues,
6 améliorations, 4 mechas, puissance 16 — toutes achetables à l'économie,
aucune ne dépend de l'adversaire. Les bots n'ont aucun plan équivalent :
`starRush: 0` pour Équilibré et Thésauriseur, et personne ne course les
étoiles bon marché (puissance max, 6 améliorations — aucun bot n'a passé
une seule amélioration de toute la partie… le humain en a fait 6).

### RC6 — L'économie humaine tourne, celle des bots respire à peine

Cash final : 33 contre 4/11/7. La boucle humaine : Améliorer ×6 (+12 $ de
remises), Enrôler ×4 (+12 $), bonus voisins/propres (+1 $ récurrents),
Mémorial (+1 pop/tour) — 2 à 3 effets par tour. En face, des tours entiers à
un seul effet (« +1 Pop », « Produire ») : le différentiel de tempo par tour
est le vrai écart de niveau, avant même la stratégie.

## 3. Notes 📝 du joueur en cours de partie — triage

| Tour | Note | Verdict |
|---|---|---|
| T5 | « décomposer mon mouvement de 2 hex, déposer 2 ouvriers au passage » | **UX manquante — fait** : déplacement décomposé. Une unité (héros/mech) qui n'a pas épuisé ses pas RESTE sélectionnée (« n pas restants ») et continue hex par hex ; le panneau 🚚 du pas suivant permet de déposer une partie des ouvriers/ressources avant de repartir. Bouton « ✓ Terminer ici » pour s'arrêter. |
| T7 | « les icônes dollars sont revenues sur le plateau » | **Expliqué + fait** : ce sont les marqueurs de la tuile bonus de pose (« Cœur des Villages » — hexes village éligibles). Un tooltip au survol de l'hex l'explique désormais. Ironie : le humain a construit ses 3 bâtiments HORS villages → bonus de pose 0 $ (jusqu'à 9 $ laissés sur la table). |
| T13 | « pourquoi Nations Souv. envoie un ouvrier au marécage » | **Tuning bot — fait** : le malus -8 était rattrapable par le bruit de difficulté ; c'est maintenant un filtre dur (un ouvrier bot n'entre au marécage qu'à défaut de toute case sèche ; le Bayou reste chez lui). |
| T19a | « traverser la rivière vers plaines, accéder à l'îlot du Frente » | **À vérifier sur la carte** : le Gué n'ouvre que plaine et désert (`factions.js:20`). Si l'hex visé était autre chose (sierra/village), le refus est correct. **Fait côté UI** : la règle du riverwalk de la faction s'affiche à la sélection d'une unité (« Gué : plaine / désert uniquement », ou « rivières infranchissables tant que… »). |
| T19b | « sur un rail, mon premier move devrait m'emmener n'importe où sur le réseau, même celui de Bayou » | **Comportement conforme + fait** : les rails n'ont pas de propriétaire, mais le réseau est coupé aux nœuds occupés par l'ennemi (règle du 22/07, `getRailNetwork` + blockedHexes) — Cap. Zeke et l'Arsenal squattaient #31, seul lien depuis #38. Le tooltip des hexes à rail énonce désormais la règle complète. |
| T22 | « l'ouvrier n'aurait pas dû aller jusqu'au pétrole : réseau en 1 move, pas plus — Speed ne s'applique pas à lui » | **VRAI BUG — corrigé** : `getValidMoves` calculait `hasSpeed` depuis les abilities du joueur quel que soit `unitType` (`movement.js`). Un ouvrier profitait donc de Vitesse : réseau (pas 1) + 1 pas de sortie. Règle Scythe rétablie (Vitesse = héros/mechs) + tests de non-régression. |
| T24 | « atteindre #40 : héros vers #27 puis 2e pas n'importe où sur le réseau » | **Décision prise : règle maintenue** — c'est exactement la règle corrigée après la partie du 22/07 (« on monte à bord un tour, on roule au suivant », `movement.js:89-92`). Rouvrir = les rails redeviennent des quasi-téléports à 2 pas. La règle est désormais énoncée dans le tooltip des hexes à rail. |

## 4. Ce que la partie valide

- Les correctifs du 22/07 ont porté : plus de paralysie économique de bot
  (1 seul tour de blocage, Acadiane T13), les 3 bots produisent, construisent,
  déploient, enrôlent ; deux bots à 2 étoiles (contre 45/8 points au total la
  dernière fois). L'écart s'est resserré (77-38 contre 93-45).
- La dissuasion par la puissance fonctionne dans le bon sens : c'est un levier
  de jeu réel. Ce qui manque, c'est un adversaire qui la conteste.
- Le pivot « son plan ne paie pas » se déclenche… preuve que la tuyauterie
  marche. Il ne lui manque qu'un déclencheur qui arrive à l'heure (RC2).

## 5. Backlog priorisé issu de cette partie

| P | Chantier | Détail | Statut |
|---|---|---|---|
| **P0** | Phase & pivot sur l'horloge de partie | `getPhase` sur tour/max-étoiles-table, pivot possible dès mi-partie sur écart de score (RC2) — débloque mechs, drop-runs, sprints de palier et agressivité en un seul changement. | **fait** (`computePhase`, `PIVOT_MID_RATIO 0,55` dès T12/3⭐ table) |
| **P0** | Bug Vitesse-ouvriers | `movement.js:99` — une ligne (note T22). | **fait** + test |
| **P1** | Carburant de guerre des profils agressifs | Un blitz/prédateur sous ⚡6 après T8 doit sur-pondérer Soutien/Arsenal jusqu'à retrouver une `myStrength` compétitive, sinon son identité est lettre morte (RC1). | **fait** (Soutien +8 sous ⚡7 dès T5) |
| **P1** | Conscience d'objectif de faction | Acadiane : deploy du slot requis + héros mobile tant que l'objectif est vivant ; généraliser (« mon objectif exige X, X passe en tête de mes priorités ») (RC4). | **fait** (`pickDeploySlot` : Batelier au 3e mecha, Flibuste/Chimère au 2e pour le prédateur ; +3 au Move tant que comptoirs < 4) |
| **P1** | Étoiles d'ingénierie pour les bots | Courir puissance-max / 6 améliorations quand l'économie le permet — aucune amélioration bot en 25 tours (RC5). | **fait** (course ⚡16 dès 11 ; upgrades 3+ sur surplus de ressource) |
| **P2** | Marécage interdit aux ouvriers bots | Filtre dur au lieu de -8 (note T13). | **fait** |
| **P2** | Lisibilité UI | Tooltips : badges $ de la tuile de pose, refus de traversée (riverwalk), réseau de rails coupé (notes T7/T19). | **fait** (tooltips d'hex $ + rail ; règle riverwalk affichée à la sélection d'unité) |
| **P2** | Déplacement pas-à-pas avec dépose d'ouvriers | Mode étape par étape du move (note T5). | **fait** (l'unité reste sélectionnée avec ses pas restants ; le panneau 🚚 du pas suivant permet la dépose partielle) |
| **P3** | Trajectoires de convergence | Score « se rapprocher en N tours » d'une cible riche/leader pour que les quadrants se rencontrent (RC3). | **fait** (aimant vers la meilleure cible attaquable, gardé par ⚡5+) |

### Stratégie popularité des bots (retour joueur du 28/07)

« Remonter la popu à coup de +1 c'est absurde » — appliqué tel quel :

- Le Commerce n'achète plus de pop en routine **qu'avec l'amélioration ♥ (+2)**
  ou pour franchir un palier ; et sous le palier ×2, le premier cube
  d'amélioration retiré est celui de Commerce (il débloque justement ♥+2).
- La pop se grappille désormais **par les actions** : Soutien+Mémorial (+7 au
  score tant que < ×3), immédiat d'enlist « +2♥ » (section Déployer) priorisé
  sous le palier ×2, colonne portant la recrue ♥ bonifiée, et rencontres
  sur-pondérées (+4 d'aimant) quand la pop est sous 7.

### Combat : l'attaquant gagne les égalités (retour joueur du 28/07)

Contre le leader qui déroule (3+ étoiles ou fin imminente), tout profil accepte
désormais l'attaque **à parité** : la règle des égalités rend le pari gagnant
sur le papier, la victoire freine sa course et l'unité reste consolider le hex.

### A/B simulateur (800 parties, seed 1, avant → après)

| Faction | avant | après |
|---|---|---|
| Confédération | 25,9 % | 24,6 % |
| Frente | 30,0 % | 24,8 % |
| Nations | 37,7 % | 29,3 % |
| **Acadiane** | 25,7 % | **47,6 %** |
| Bayou | 24,5 % | 21,1 % |
| Dominion | 26,4 % | 20,4 % |

Zéro crash, zéro violation d'invariants, 154 tests verts. Deux lectures :

1. **Hors Acadiane, le peloton se RESSERRE** (20-29 % contre 24-38 % avant) —
   les bots jouent mieux de façon plus homogène, et l'outlier Nations (37,7 %)
   rentre dans le rang.
2. **L'Acadiane décolle** (étoiles moy 3,3 → 4,1) parce que son objectif de
   faction est enfin VIVANT (Batelier déployé, héros mobile, 4e comptoir posé).
   Deux crans de modération bot-side déjà appliqués (Batelier au 3e mecha et
   non au 2e, Move +3 et non +5, convergence gardée par ⚡5+) ont ramené des
   pointes de 60 % à ~48 %. Le reste n'est PLUS un problème de bot : c'est la
   force de la faction elle-même qui ressort quand elle est bien jouée — la
   v6 l'avait déjà mesurée « ~6 pts au-dessus du peloton » à objectif MORT.
   → Chantier d'équilibrage GAME-side à trancher au simulateur (pistes déjà
   utilisées par le passé : `resScoringCap`, valeur des comptoirs au score,
   coût/condition du comptoir lacustre).

## 6. Note de coaching (pour mémoire)

77 points à pop 6 : un seul Commerce (+2 pop, 1 $) au T24 passait le palier 7
et valait ~+20 points. Même gagnant, le réflexe « le palier d'abord » reste le
meilleur euro du jeu — c'est d'ailleurs la leçon que les bots, eux, ont
appliquée (3 joueurs sur 4 au palier ×2)… sans rien à multiplier derrière.
