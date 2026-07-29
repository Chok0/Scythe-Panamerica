# Règles condensées — Scythe Panamerica (lecture unique en début de partie)

But : le plus de PIÈCES au score final. La partie s'arrête dès qu'un joueur
pose sa 6e étoile (ou au cap de tours du moteur). Poser la 6e en étant
derrière au score est une erreur classique — vérifier avant de finir.

## Score final

`score = étoiles×A + territoires×B + paires_de_ressources×C + pièces + bonus_pose`

| Popularité | A (étoile) | B (territoire) | C (paire res) |
|---|---|---|---|
| 0-6 | 3 | 2 | 1 |
| 7-12 | 4 | 3 | 2 |
| 13-18 | 5 | 4 | 3 |

- Territoire = hex avec au moins une unité OU un bâtiment à vous. L'Usine
  (hex 22) compte 3. Comptoirs Acadiane : +1 territoire et +2$ chacun.
- Le palier de pop est LE levier : 5 étoiles + 12 territoires valent
  27 pts de plus au palier 3 qu'au palier 1. Viser ≥13 pop en fin de partie.

## Les 10 étoiles possibles (6 à poser pour finir)

⚡16 · ♥18 · 6 améliorations · 4 mechas · 4 bâtiments · 4 recrues ·
8 ouvriers · victoire de combat (×2 max) · mission secrète (1 des 2) ·
objectif de faction. Les missions/objectifs se révèlent UNIQUEMENT à l'étape
`turn_end` (action `reveal`) — ne pas oublier, l'étoile n'attend pas toute
seule.

## Le tour : 1 colonne, haut puis bas

Choisir une colonne ≠ celle du tour précédent (`lastCol`). Haut optionnel,
bas optionnel (payé en ressources), dans cet ordre. Les 4 colonnes haut/bas
sont appariées par le PLATEAU (pas toujours dans le même ordre — voir
`moi.colonnes`).

**Hauts** : Move (2 unités ×1 hex, ou +1$ sans bouger) · Bolster (1$ →
+2⚡ ou +1🃏) · Trade (1$ → 2 ressources au choix sur vos hexes ouvriers, ou
+1♥) · Produce (coût selon ouvriers : 4-5 ouvriers −1⚡, 6-7 aussi −1♥,
8 aussi −1$ ; chaque ouvrier de l'hex produit 1 ressource, village = ouvrier)

**Bas** (coût en ressources, réduit par Améliorer) : Upgrade (pétrole) ·
Deploy (métal → mecha sur hex ouvrier) · Build (bois → bâtiment) ·
Enlist (nourriture → recrue). Chaque bas rapporte aussi le bonus $ imprimé.

**Améliorer** déplace un cube du haut (débloque une option du haut) vers le
bas (réduit un coût de 1). Premier retrait Trade = option ♥+2 (remonter la
pop à +1 est absurde ; à +2 ça devient une vraie action). Options haut :
Move 3 unités/+2$ · Bolster +3⚡/+2🃏 · Trade 3 res/♥+2 · Produce 3 hexes.

**Enrôler** : bonus immédiat + bonus permanent par colonne —
immédiats : Upgrade +2$ · Deploy +2♥ · Build +2🃏 · Enlist +2⚡ ;
permanents (à chaque usage du bas correspondant, par vous OU un voisin) :
Upgrade→+1⚡ · Deploy→+1$ · Build→+1♥ · Enlist→+1🃏.
Les +2♥ immédiats (colonne Deploy) sont un des meilleurs achats de pop du jeu.

**Bâtiments** (1/hex, restent à jamais, comptent territoire) : Arsenal +1⚡
au Bolster · Mémorial +1♥ au Bolster · Moulin : l'hex produit +1 en bonus
(même sans ouvrier dessus) · Gare : pose 3 rails à la construction.

## Mouvement

- 1 hex par unité ; rivières infranchissables sauf riverwalk (mecha slot 1)
  ou rails. L'Usine (22) a des ponts : toujours accessible.
- Lacs interdits (sauf Batelier Acadiane). Marécage : passage payant
  (−1♥/ouvrier, −1⚡/héros ou mecha) et arrêt forcé — gratuit pour le Bayou.
- Transport : un mecha/héros emporte les ouvriers (et ressources) de son hex.
- Base (hex 9xx) : hex privé de départ, n'est pas un territoire ; les
  vaincus y retournent.
- Rails (réseau partagé) : partir d'un hex sur rail → tout hex relié pour
  1 pas. Monter à bord ne donne l'accès qu'au tour SUIVANT. Le réseau se
  coupe sur un nœud occupé par l'ennemi.
- Ouvrier entrant sur un hex à ouvriers ADVERSES sans défense : les déloge
  (l'adversaire les récupère à sa base) et vous coûte −1♥ par ouvrier délogé.

## Combat (héros/mecha entre sur un hex à héros/mecha adverse)

- Mise secrète : 0-7⚡ + cartes (1 par unité à vous sur l'hex, valeurs 2-5).
- Total le plus haut gagne ; ÉGALITÉ = ATTAQUANT. D'où : attaquer à parité
  vaut le coup (surtout pour ralentir le leader), puis consolider l'hex.
- Perdant : retire tout de l'hex vers sa base, abandonne les ressources de
  l'hex, +1🃏 de consolation si sa mise ≥1. Vainqueur : étoile (2 max).
  Attaquant vainqueur qui déloge des ouvriers : −1♥ chacun.
- Capacités de combat (mecha slot 2) : Confédération Cavaliers +2⚡ en
  attaque · Frente +1🃏 si ouvrier allié sur l'hex · Nations +1🃏 si mecha
  seul · Acadiane White Flag (refus de défense : retraite +2♥) · Bayou
  Flibuste (victoire = le perdant paie 2$ ; capture d'un mecha 1×/partie) ·
  Dominion Discipline +2⚡ si plus de 🃏 que l'adversaire.

## Rencontres & Usine

- 9 jetons rencontre sur la carte : le HÉROS qui s'y arrête choisit 1 option
  parmi 3 (gains de ressources/⚡/♥/$/fragments…). Les courir entre deux
  objectifs est très rentable — la carte affiche `rencontre` sur ces hexes.
- Usine Rouge River (22) : à la 1re visite du héros, choisir 1 carte parmi
  l'offre Ford (face cachée, joueurs+1 cartes) = 5e colonne d'action (haut :
  1 coût → 1 gain ; bas : 1 unité, 2 hexes +1 si Vitesse). Course : premier
  arrivé, meilleur choix. Prototypes Tesla (visibles, plus forts) : coûtent
  2 fragments et remplacent votre unique choix.

## Factions (capacité · riverwalk · combat slot 2 · position slot 3 · objectif)

| Faction | Capacité | Riverwalk | Slot 3 | Objectif faction |
|---|---|---|---|---|
| Confédération ⚡4🃏1 | Servitude : capture ouvriers vaincus | plaine+désert (Gué) | Convoi : bond village↔village↔Usine | 2 capturés + 3 hexes à ouvriers |
| Frente ⚡2🃏3 | Pièges du héros (−3⚡, max 4) | montagne+désert | Guérilla : bond sierra↔sierra | 4 pièges + 2 ouvriers sierra/désert |
| Nations ⚡3🃏2 | Mechas payables en bois | plaine+toundra | Pack Up : déplace 1 bâtiment | 4 hexes plaine/forêt |
| Acadiane ⚡2🃏3 | Comptoirs du héros (max 4) ; mechas payables en pétrole | plaine+montagne (Portage) | Batelier : lacs + bond lac↔lac | 4 comptoirs non adjacents dont 1 lac |
| Bayou ⚡2🃏3 | Marécages gratuits sans arrêt | champs+village | Pirogue : bond marais↔marais | 1 mecha capturé + 2 victoires |
| Dominion ⚡3🃏2 | 1×/tour : 1 res→1$/1🃏 ; 2$→1 res | forêt+plaine | — | 20$ via Commerce Impérial |

Slots mecha : 0=Vitesse (+1 hex TOUTES unités de combat) · 1=riverwalk ·
2=combat · 3=position. Choisir le slot au déploiement (`slot`).

## Plateaux (départ ♥/$ · colonnes haut · coûts bas U/D/B/E)

Fordisme 2♥4$ [M,B,P,T] pé3/mé4/bo2/no4 · Atelier 2♥5$ [T,P,B,M]
pé3/mé3/bo4/no3 · Pionnier 2♥6$ [M,T,P,B] pé3/mé3/bo4/no3 · Forge 3♥6$
[T,B,M,P] pé3/mé2/bo4/no4 · Terroir 3♥6$ [M,T,B,P] pé2(fixe)/mé4/bo4/no3 ·
Hacienda 4♥7$ [B,M,T,P] pé3/mé4/bo3/no3.

## Bonus de pose (tiré au début, affiché dans `bonusPose`)

$$ en fin de partie selon les BÂTIMENTS : bord des lacs · champs/toundra ·
monts/forêts · ligne droite · proximité des rencontres · villages · autour
de l'Usine · variété de terrains · avant-postes (adjacence base adverse) ·
distance à la base. Barème typique 1→2$ … 4→9$. Choisir les emplacements de
bâtiments en le lisant DÈS LE TOUR 1.

## La carte (v3 par défaut, 43 hexes)

- Usine=22 (centre). Villages : 4, 12, 14, 27, 35, 36, 46. Lacs : 5, 13,
  18, 19, 33, 47. Marécages : 3, 20, 25.
- Départs (workerHex) : Confédération 36,32 · Frente 41,45 · Nations 10,17 ·
  Acadiane 2,6 · Bayou 35,28 · Dominion 0,4.
- `pilot.mjs map` imprime terrains + adjacences + rencontres réelles de la
  partie en cours — s'y référer plutôt que de mémoriser.
