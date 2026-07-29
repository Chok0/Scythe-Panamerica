# Playtest Claude — Nations Souveraines / Pionnier vs 4 bots (seed 4612, post-correctifs)

**Date** : 2026-07-29 · **Config** : faction `nations`, 4 bots (`frente`, `acadiane`, `dominion`, `bayou`), seed 4612, `blind:true`, mode API headless (port 4622). Même config exacte que `rapport_nations_seed4612_sprint_tempo.md`, pour comparer directement l'effet des deux correctifs (bug `bottom_enlist`, escorte Frente).

**Objectif de la partie** : partie de vérification post-correctif — jouer pour gagner en équilibrant étoiles ET territoire (leçon de la partie précédente), tout en surveillant (1) une reproduction du bug `bottom_enlist`, (2) le comportement d'escorte du Frente Libre sur ses stocks de ressources.

## Résultat

Partie terminée au **tour 38** : Bayou atteint sa 6e étoile (objectif de faction) et met fin à la partie immédiatement.

| Rang | Joueur | Score | Étoiles | Palier pop | Territoires | Paires | Argent |
|---|---|---|---|---|---|---|---|
| 1 | Bayou (bot) | **98** | 6 ⭐ | 13-18 | 5 | 9 | 13$ |
| 2 | Frente Libre (bot) | 65 | 5 ⭐ | 13-18 | 4 | 4 | 10$ |
| 3 | Acadiane (bot) | 57 | 4 ⭐ | 7-12 | 7 | 0 | 0$ |
| 4 | Dominion (bot) | 47 | 3 ⭐ | 13-18 | 6 | 1 | 5$ |
| **5** | **Nations Souv. (Claude)** | **46** | **5 ⭐** | **7-12** | 4 | 7 | 0$ |

Mes étoiles : 8 ouvriers (T10), mission « La Diagonale » (T11), 4 recrues enrôlées (T23), 1 combat gagné (T29), puissance max 16 (T34).

## Comparaison directe avec la partie précédente (sprint tempo)

| | Sprint tempo (précédent) | Post-upgrade (cette partie) |
|---|---|---|
| Score | 49 (dernier) | 46 (dernier) |
| Étoiles | 4 | **5** |
| Territoires | 4 | 4 (identique) |
| Paires | 3 | **7** |
| Palier popularité | non précisé (score bas) | **7-12** (2e palier le plus bas) |
| Frente Libre | 4e, 2 paires, stock jamais défendu observé comme vulnérable | 2e, 4 paires — **stock 6+ activement escorté** (voir ci-dessous) |
| Bug `bottom_enlist` | reproduit (ressources débitées avant crash) | **non reproduit** |

**Toujours dernier, malgré une meilleure partie sur presque tous les indicateurs bruts (+1 étoile, +4 paires).** La cause est claire dans le détail du classement : mon **palier de popularité (7-12)** est resté un cran en dessous de celui de Bayou/Frente/Dominion (13-18), qui multiplie étoiles/territoires/ressources dans le score final. Exemple concret : mes 5 étoiles valent 20 pts (×4, palier 7-12) contre les 5 étoiles de Frente qui valent 25 pts (×5, palier 13-18) — à nombre d'étoiles égal. J'ai bien évité le piège spécifique de la partie précédente (stacker les ouvriers sans étendre le territoire — cette fois j'ai diversifié : #10 forêt, #12 plaine, #14 village, #17 plaine, avec 3 bâtiments dessus), mais j'ai sous-investi la popularité jusqu'à trop tard (♥10 en fin de partie, alors qu'il fallait viser 13+ dès le milieu de partie) et j'ai fini avec 0$, signe d'un rythme de Bolster/Trade un peu trop dépensier en pièces.

## Le Frente Libre a-t-il été mieux défendu ?

**Oui, nettement.** Contrairement à la partie précédente où son stock de ressources restait nu jusqu'à un pillage tardif massif, cette fois :
- T24 : `LEÇON` notée — metal4 sur #37 gardé par 2 ouvriers seulement (sans mecha), stock encore sous le seuil 6+, capturé par Acadiane peu après (preuve que le risque est réel, mais le seuil de déclenchement du correctif n'était pas encore atteint).
- **T36 : confirmation positive** — Frente Libre a accumulé nourriture6 sur #41, désormais gardé par **3 ouvriers ET 2 mechas**, exactement le comportement attendu du correctif (rester volontiers en garde d'un hex de stockage 6+). Ce stock n'a plus jamais été pillé jusqu'à la fin de partie (T38).
- Bayou a montré le même réflexe défensif sur son propre gros stock (metal10 sur #22, gardé par héros + mecha après avoir capturé l'Usine d'Acadiane), signe que le comportement n'est pas spécifique à un bug corrigé mais bien un pattern de jeu robuste maintenant.

Comparé aux 2 paires finales de Frente dans la partie précédente, il termine avec 4 paires cette fois — toujours peu, mais son territoire (4, comme moi) et son classement (2e à 65 pts) montrent qu'il a mieux capitalisé sur ses stocks défendus plutôt que de simplement accumuler des étoiles bon marché sans les protéger.

## Le bug `bottom_enlist` s'est-il reproduit ?

**Non.** Sur mes 4 utilisations d'`enlist` (T6, T12, T18, T23) :
- Un premier appel sans `section`/`recruit` a bien renvoyé une erreur (`section invalide (libres: 0,1,2,3)` puis `recrue invalide (libres: ...)`), **sans aucun débit de ressource ni incrément de compteur** — contrairement à la partie précédente où le crash survenait après avoir déjà prélevé 3 nourriture.
- Une fois `section`/`recruit` valides et une section déjà remplie retentée, le message d'erreur reste propre (`recrue invalide (libres: 1,2,3)`), toujours sans effet de bord.
- La validation intervient donc bien **avant** tout effet, comme prévu par le correctif dans `headlessGame.js`.

Point de friction mineur observé (pas un bug) : quand je tapais `bottom_enlist` alors que la paire active était en réalité Produce/Build (top choisi = Produire), le moteur a validé `section`/`recruit` puis répondu `il faut 4 bois` — un message qui emprunte le coût de l'action *réellement* active (Build) plutôt que de rejeter d'emblée `bottom_enlist` comme action hors-séquence. Aucune ressource n'a été débitée, donc sans conséquence, mais le message peut dérouter (« pourquoi du bois pour un enrôlement ? »).

## Leçons notées en cours de partie

1. **T9** : révéler une mission de territoire (`reveal`) doit se faire *avant* de déplacer l'unité qui valide sa condition — la mission repasse à `✗` (mais reste comptée si déjà révélée) si la condition casse ensuite. Erreur commise deux fois (T9, T15) avant d'ajuster l'ordre des actions au T11.
2. **T24** : un stock de 4 (sous le seuil 6+) reste vulnérable même avec des correctifs en place — Acadiane a capturé le metal4 non-escorté du Frente avant qu'il puisse dépasser le seuil et déclencher l'escorte.
3. **T36** : confirmation positive du correctif d'escorte (voir section dédiée ci-dessus).

## Verdict sur les bots

- Le realpolitik bot-contre-bot a été plus actif que la partie précédente (au moins 5 combats bot-contre-bot : Acadiane vs Frente T20, Acadiane vs Bayou T35, Bayou vs Acadiane T37) contre 4 dans la partie précédente — les bots se sont davantage disputé les stocks non-défendus (avant le seuil d'escorte) que mon propre empire, jamais attaqué de toute la partie.
- Bayou a gagné avec le score le plus élevé de toutes les parties de la série (98 pts) grâce à une combinaison territoire (5) + paires (9) + palier popularité max, illustrant encore que la popularité est le multiplicateur décisif.

## Fichiers produits

- Journal : `docs/design/parties_api/journal_nations_seed4612_post_upgrade.json`
- Ce rapport : `docs/design/parties_api/rapport_nations_seed4612_post_upgrade.md`
