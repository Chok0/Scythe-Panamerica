# Playtest Claude — Dominion vs 3 bots, vérification post-correctifs (seed 4611)

**Date** : 2026-07-29 · **Config** : faction `dominion`, bots forcés `frente`/`nations`/`bayou`, seed 4611, `blind:true`, mode API headless (port 4621, serveur pré-lancé).

**Objectif de cette partie** : partie de VÉRIFICATION après deux correctifs — (1) `headlessGame.js` : `bottom_enlist` doit être validé (paramètres `{section,recruit}`) avant tout effet de bord ; (2) `bot.js` : un mecha du Frente Libre sans meilleure cible reste volontiers en garde d'un hex où le bot stocke 6+ ressources. Même seed/config que `rapport_dominion_seed4611_anti_frente.md` pour comparaison directe.

## Résultat — partie arrêtée volontairement au T31 (budget), pas de fin naturelle

Aucun bot n'a atteint 6 étoiles ; la partie n'est donc pas allée à son terme scoré. Snapshot au T31 (`full g1`) :

| Joueur | Étoiles | Popularité | Puissance | Argent | Territoires | Ressources totales (paires) |
|---|---|---|---|---|---|---|
| Nations Souv. | **4** | **18 (max)** | 10 | 7$ | 5 | 4 (2 paires) |
| Frente Libre | 2 | 9 | 8 | 29$ | 6 | **18, dont 12 nourriture (9 paires)** |
| **Dominion (Claude)** | 2 | **0** | 3 | **0$** | 4 | 4 (2 paires) |
| Bayou | 1 | 14 | 5 | 1$ | 7 | 5 (2 paires) |

Dominion a subi un **soft-lock économique** à partir du T23 (voir bugs) qui a figé sa progression pour le reste de la partie — le résultat mesuré reflète surtout cet incident, pas un jugement définitif sur l'IA adverse.

## Point d'observation 1 — escorte du stock Frente Libre

**Confirmé : le correctif fonctionne.** Contrairement à la partie précédente (`rapport_dominion_seed4611_anti_frente.md`, où le stock Frente atteignait 13 nourriture exposé sans garde et se faisait piller par Bayou), cette partie montre le Frente Libre gardant systématiquement une unité (héros, ouvrier ou mecha) sur chaque hex où il stocke des ressources :

- T9 : hero + 2 ouvriers + mecha sur `#41` (4 nourriture) — noté explicitement en `LEÇON` dès la première observation.
- T13 : le stock est **déplacé avec le héros** vers `#46` (4 nourriture) quand celui-ci change de position — le trésor voyage avec son escorte plutôt que de rester figé et nu.
- T31 (snapshot final) : chaque hex de stockage frente (`#35` no4, `#37` no1+mecha, `#40` no5+bo2+mecha, `#41` mé+ouvrier/mecha, `#45` mé4+ouvrier, `#46` no2+mecha) porte au moins une unité.

Le stock final est même **plus gros** que la fois précédente (18 ressources / 9 paires vs 7 paires en fin de partie anti-Frente), ce qui montre que le comportement thésauriseur lui-même n'a pas changé — seule la défense s'est ajoutée. Aucun adversaire (moi compris, faute de puissance/économie) n'a tenté de le piller cette fois, donc le test n'a pas pu vérifier l'efficacité de l'escorte en cas d'attaque réelle, seulement sa présence constante.

## Point d'observation 2 — bug `bottom_enlist`

**Non reproduit, mais aussi non testé directement.** Ma partie n'a jamais eu accès à la ressource nourriture nécessaire pour tenter un `bottom_enlist` (colonne Bolster/Enlist) et n'a donc pas déclenché ce chemin de code avec ou sans `{section,recruit}`. Aucune autre erreur moteur rencontrée sur les actions du bas (`bottom_deploy`, `bottom_build`, `bottom_upgrade` toutes testées avec succès, ressources correctement débitées après validation des paramètres — voir T8, T9, T17-T18). Ce point reste donc **non vérifié par manque d'opportunité de jeu**, pas confirmé corrigé par l'expérience directe cette fois.

## Bug / friction inattendu : soft-lock économique (Dominion, T23+)

À force d'utiliser Trade/Produce/Bolster pour financer mon développement, j'ai fini à **0$ ET 0 popularité simultanément**, avec `lastCol` sur `Move` (colonne jouée juste avant). Résultat :
- `Trade` et `Bolster` exigent ≥1 pièce → bloqués.
- `Produce` exige ≥1 puissance ET ≥1 popularité ET ≥1 pièce → bloqué (popularité et argent à 0).
- `Move` reste bloqué par la règle anti-répétition (`lastCol`).
- `pass_turn` ne met **pas à jour** `lastCol` (confirmé dans `headlessGame.js:366`) : passer ne « libère » donc jamais la colonne Move au tour suivant.

À partir du T23, plus aucune action du haut n'était légale à part `pass_turn`, tour après tour, jusqu'à l'arrêt de la partie au T31 — un blocage strictement permanent tant qu'aucun événement externe (voisinage d'un bot, rencontre) ne recrédite popularité ou argent, ce qui n'est pas arrivé. À signaler pour vérification : est-ce le comportement voulu (sanction dure d'une mauvaise gestion économique) ou faudrait-il que `pass_turn` réinitialise `lastCol` pour éviter un blocage sans issue ?

## Moments clés

1. **T1-T4** — Reconnaissance et pivot rapide : mission secrète « La Diagonale » (4 terrains différents) rendue révélable dès T4 en redéployant un ouvrier vers `#0` sans abandonner `#4`, révélée immédiatement (2e étoile du jeu, avant même la 1re en tour 9 du run précédent).
2. **T6-T9** — Découverte du mécanisme `Trade.buy` (achat de ressources hors-terrain avec une pièce) pour contourner l'absence de bois sur mon territoire ; combiné à `Produce`+`Build`, pose du Moulin sur `#4` (hex le plus productif) — 8e ouvrier + étoile associée au T9.
3. **T17** — Premier `bottom_upgrade` (Produce↑ → Build↓, coût Build réduit de 4 à 3 bois) : bon investissement mais tardif, la fenêtre pour rentabiliser 6 upgrades était déjà fermée.
4. **T23** — Bascule dans le soft-lock économique décrit plus haut ; le reste de la partie (T23-T31) n'a consisté qu'en `pass_turn` forcés côté Dominion pendant que Nations Souv. grimpait de 2 à 4 étoiles (popularité max 18, 4 recrues, upgrade 3/6).
5. **T29** — Frente Libre attaque et repousse un ouvrier Bayou sur `#31` (-1 puis -4 popularité Bayou en deux vagues), signe d'un Frente plus offensif que lors de la partie précédente où il subissait les attaques plutôt que les initiait.

## Comparaison directe avec `rapport_dominion_seed4611_anti_frente.md`

| | Anti-Frente (précédente) | Post-upgrade (cette partie) |
|---|---|---|
| Fin de partie | Naturelle, T37, Bayou 8⭐ | Arrêtée au T31 (budget), personne à 6⭐ |
| Score Frente Libre | 87 pts, 2e, 7 paires | non calculé (partie inachevée) ; **9 paires** au snapshot T31 |
| Escorte du stock Frente | **Absente** — héros seul en éclaireur (T27/T30/T40/T46), stock pillé par Bayou en fin de partie | **Présente en continu** — hero/ouvrier/mecha toujours co-localisés avec le stock, y compris lors des déplacements |
| Bug `bottom_enlist` | Non mentionné comme rencontré dans ce rapport-là | Non déclenché (faute de ressource nourriture disponible côté Dominion) |
| Résultat Dominion | 3e, 68 pts, ⭐5 | 2⭐ seulement, bloqué par soft-lock économique dès T23 |

**Verdict** : le correctif d'escorte Frente est visiblement actif et se comporte comme prévu (garde permanente sur les hexes de stockage). Il n'a toutefois pas été mis à l'épreuve d'une tentative de pillage réelle cette partie — ma propre puissance est tombée trop bas trop tôt pour représenter une menace, et les autres bots ne l'ont pas attaqué non plus. Le bug `bottom_enlist` n'a pas pu être re-testé faute d'accès à la ressource requise. Le résultat le plus significatif de cette partie est un problème séparé : un blocage économique permanent côté joueur humain quand popularité et argent tombent à 0 simultanément avec `Move` en dernière colonne jouée.

## Suggestion argumentée

Deux pistes distinctes ressortent :
1. **Escorte Frente** : le correctif remplit son rôle défensif mais reste non testé en situation d'attaque réelle — un prochain playtest devrait délibérément jouer un profil agressif capable de maintenir puissance et économie plus haut, pour vérifier si l'escorte suffit à dissuader/repousser une attaque ou seulement à la rendre moins gratuite.
2. **Soft-lock `pass_turn`/`lastCol`** : envisager de faire en sorte que `pass_turn` réinitialise `lastCol` (ou traite `Move` comme toujours actionnable indépendamment de la répétition, puisqu'il est gratuit dans cette variante), pour éviter qu'un joueur pauvre en popularité et en argent ne reste bloqué sans porte de sortie jusqu'à la fin de la partie.

## Fichiers produits

- Journal : `docs/design/parties_api/journal_dominion_seed4611_post_upgrade.json`
- Ce rapport : `docs/design/parties_api/rapport_dominion_seed4611_post_upgrade.md`
