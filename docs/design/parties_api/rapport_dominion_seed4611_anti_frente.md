# Playtest Claude — Dominion vs 3 bots, stratégie anti-Frente Libre (seed 4611)

**Date** : 2026-07-29 · **Config** : faction `dominion`, bots forcés `frente`/`nations`/`bayou`, seed 4611, `blind:true`, mode API headless (port 4611).

**Objectif de cette partie** : contrer spécifiquement le pattern de thésaurisation du Frente Libre (identifié sur 3/4 parties précédentes comme vainqueur quasi systématique via accumulation de paires de ressources converties en fin de partie), en jouant une ligne militaire de harcèlement/déni en plus d'un plan de victoire classique.

## Résultat

| Rang | Joueur | Score | Étoiles | Détail |
|---|---|---|---|---|
| 1 | Bayou | **103** | ⭐8 | terr 7 · 6 paires · 11$ |
| 2 | Frente Libre | 87 | ⭐3 | terr 6 · **7 paires** · 25$ |
| **3** | **Dominion (Claude)** | **68** | ⭐5 | terr 5 · 2 paires · 25$ |
| 4 | Nations Souv. | 66 | ⭐5 | terr 6 · 4 paires · 1$ |

Partie terminée **brutalement au tour 37** : Bayou enchaîne 3 étoiles dans le même `end_turn` (4 recrues, objectif de faction, popularité max 18) et saute de ⭐5 à ⭐8, déclenchant la fin immédiate. J'étais moi-même à 1 upgrade de ma 6e étoile (prête pour le tour suivant) et le Frente Libre était en train de reconstituer un stock massif (jusqu'à 13 nourriture au T35) qui n'a pas eu le temps de se retourner en score.

## Le Frente Libre a-t-il gagné ? La stratégie anti-Frente a-t-elle marché ?

**Non, il n'a pas gagné cette fois** (2e, 87 pts, contre 103 pour Bayou). Et son butin final de **7 paires** est nettement inférieur aux **~15-26 paires (jusqu'à 36 pts) observées dans les parties précédentes** où il l'emportait par thésaurisation.

Ce qui s'est réellement passé :
- Le Frente Libre a bien reproduit le pattern documenté : accumulation quasi exclusive de nourriture (4 → 8 → 10 → **13** entre T22 et T35, avec très peu de bois/pétrole en parallèle), et gros trésor de pièces (jusqu'à 30$).
- **Le harcèlement direct a été géographiquement impossible en début de partie** : Dominion démarre à l'opposé (#905, coin ouest) du Frente Libre (#901, coin sud-est) — repéré dès T1 mais à ~6-8 hexes de distance. Décision explicite T10 de pivoter vers un plan économique + expansion centrale plutôt qu'un rush intenable.
- **Une frappe directe a eu lieu (T28)** : héros Frente repéré seul sur #27 (hex du réseau ferroviaire, stock 4 nourriture) adjacent à mon héros. Attaque à pleine puissance (4⚡+1 carte) → défaite serrée 5 vs 6. N'a pas vidé le stock, mais a forcé Frente à cramer ~4 de ses 7⚡ en défense (retardant leur tempo) — au prix, effet pervers, de leur offrir une étoile de combat.
- **Le vrai facteur de dénial a été indirect et non planifié** : ma victoire T20 contre le héros de Bayou (8 vs 8, égalité gagnée par l'attaquant) a momentanément cassé l'élan de Bayou vers le territoire frontalier du Frente (#38) ; puis, sans mon intervention, Bayou a lui-même attaqué et **battu** le Frente Libre au T36 (1 vs 2 à #34, capturant un mecha et pillant 2$), ce qui a fait chuter leur stock de nourriture de 13 à 8 en un tour. Enfin et surtout, **la fin de partie soudaine (T37) a coupé court à la conversion** avant que Frente n'ait pu reproduire le "gros pillage à 2 tours de la fin" caractéristique des parties précédentes.

**Verdict** : la thèse du harcèlement ciblé est validée à moitié — l'attaque directe reste risquée et à double tranchant contre un adversaire riche en cartes (Frente avait 8-12 cartes combat en réserve toute la partie), mais la vigilance + les frictions bot-vs-bot qu'elle a contribué à catalyser (en affaiblissant Bayou tôt, ce qui n'a pas empêché son 2e élan mais a coïncidé avec le moment où il a fini par percuter Frente) ont, combinées à une fin de partie précoce, empêché le scénario de thésaurisation maximale de se reproduire.

## Moments clés

1. **T1-T10 — Constat géographique et pivot.** Frente repéré immédiatement (#901, W#41/#45) mais à l'opposé de mon plateau. Pivot noté explicitement : jeu économique d'abord (moulin T7, arsenal T12, mémorial T16), expansion du héros vers le centre/Usine plutôt que rush impossible.
2. **T8-T9 — Tempo mission.** Mission secrète « La Diagonale » (4 terrains différents) révélée dès T9 via un détour d'un hex pour une rencontre — 1re étoile très tôt.
3. **T20 — Victoire de combat inattendue contre Bayou** (8 vs 8, égalité gagnée par l'attaquant) en tombant sur son héros en explorant vers le centre. 2e étoile, et Bayou perd 6⚡ d'un coup.
4. **T22-T23 — Usine.** Visite de l'Usine (#22), carte « Hangar Préfabriqué » choisie (2$ → bâtiment gratuit + 1⚡) : 4e bâtiment posé instantanément, 3e étoile.
5. **T24 — Coup dur.** Mon avant-poste (mecha+ouvrier, gare) à #16 est attaqué par Nations à pleine puissance (10 vs 2) pendant que j'étais à 0⚡ : perte de l'unité avancée. Leçon retenue sur l'exposition d'unités sans réserve de puissance.
6. **T28 — La frappe anti-Frente.** Attaque frontale sur le héros Frente isolé à #27, défaite 5 vs 6 mais coût réel infligé (7⚡→3⚡ côté Frente).
7. **T33-T36 — Sprint aux étoiles.** Puissance max (16⚡, T36), 4 recrues complètes (T36) : 5 étoiles en quelques tours, course de vitesse à trois (Dominion/Nations/Bayou tous à 5⭐ au T37) tranchée par Bayou qui enchaîne 3 déclencheurs d'étoile dans un seul tour.

## Verdict sur les bots

- **Frente Libre** confirme son profil « thésauriseur » identifié dans les parties précédentes (nourriture presque exclusivement, jusqu'à 13 unités stockées), mais son jeu militaire s'est révélé plus timide que prévu : héros souvent envoyé seul en éclaireur (T27, T30, T40, T46) sans escorte de mecha, ce qui l'a rendu vulnérable — et lui a coûté une défaite face à Bayou en toute fin de partie.
- **Bayou** a été le bot le plus dangereux et le plus complet cette partie : expansion agressive vers le centre (gare + rails dès T8, réseau 28-23-27-34 qui a fini par toucher le territoire du Frente), 8 ouvriers, 6 upgrades, popularité max, et une frappe décisive contre Frente au bon moment. Vainqueur mérité.
- **Nations Souv.** a joué solide (5 étoiles, popularité max 18 dès le T20) mais sans jamais convertir en score de territoire/paires — bon exemple de bot qui optimise les étoiles sans bâtir un score final complet (66 pts malgré 5⭐, le plus faible ratio de la partie).
- **Aucun bot n'a directement contré ma propre thésaurisation** (2 paires seulement en fin de partie) — signe que mon économie est restée modeste comparée aux autres, cohérent avec le choix de sacrifier du temps de production pour la mobilité/le harcèlement.

## Bugs / frictions rencontrés

1. **Fin de partie en cascade, sans anticipation possible** : Bayou est passé de ⭐5 à ⭐8 en un seul `end_turn` (3 conditions d'étoile déclenchées d'affilée), terminant la partie alors que j'étais à une seule action de ma 6e étoile. Rien d'anormal dans les règles, mais côté playtest cela rend la fin de partie difficile à « timer » — une info du type « étoiles en attente de déclenchement » pour les adversaires serait utile pour anticiper ce genre de sprint final.
2. **Décalage d'affichage sur les missions révélées** : après avoir révélé « La Diagonale » (T8), le résumé la réaffiche parfois `✗` (condition instantanée non remplie) alors que l'étoile est déjà acquise et permanente — cosmétique mais déroutant en cours de partie (déjà signalé comme friction similaire dans le rapport seed 11).
3. **Nommage des champs d'action pas toujours intuitif** : `trade` attend `buy:[{res,hex}]` (noms de ressources complets `bois/metal/nourriture/petrole`, pas les abréviations du résumé), et `encounter` attend `option` (pas `opt`) — plusieurs allers-retours d'erreur nécessaires pour les découvrir (le message d'erreur reste toutefois toujours actionnable, comme prévu par le protocole).
4. **Mouvement du héros parfois à 2 hexes, parfois à 1**, sans que la raison soit toujours évidente dans le résumé (ex: T22 « accessibles: 7,8,9,11,12,16,22,26,27,30 » depuis #15, un saut de 2 hexes) — probablement lié aux améliorations de puissance/plan d'usine, mais pas explicité assez pour anticiper la portée avant d'agir.

## Suggestion d'équilibrage (argumentée)

Cette partie confirme, en creux, le diagnostic du rapport précédent : **le score de paires × palier de popularité reste le levier dominant en fin de partie pour Frente Libre**, mais montre aussi qu'il est fragile à deux choses — (a) une fin de partie précoce déclenchée par un tiers, et (b) un manque d'escorte militaire qui expose le stock à un pillage adverse. Cela suggère que la thésaurisation frénétique est une stratégie à variance élevée plutôt qu'un problème d'équilibrage isolé : un bot qui thésaurise sans défendre activement ses stocks (mecha en escorte, présence dissuasive) peut se faire déposséder par n'importe quel adversaire suffisamment agressif au bon moment, y compris un autre bot. Piste de réglage : plutôt que plafonner les paires (proposition précédente), on pourrait renforcer l'incitation des bots « thésauriseurs » à also défendre leurs stocks avec des mechas dédiés proportionnellement à la valeur stockée — sinon, comme ici, un adversaire opportuniste (Bayou) récolte la mise sans même viser spécifiquement Frente.

## Fichiers produits

- Journal : `docs/design/parties_api/journal_dominion_seed4611_anti_frente.json`
- Ce rapport : `docs/design/parties_api/rapport_dominion_seed4611_anti_frente.md`
