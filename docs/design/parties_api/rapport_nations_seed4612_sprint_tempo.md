# Playtest Claude — Nations Souveraines / Pionnier vs 4 bots (seed 4612, sprint tempo)

**Date** : 2026-07-29 · **Config** : faction `nations`, 4 bots (`frente`, `acadiane`, `dominion`, `bayou`), seed 4612, `blind:true`, mode API headless (port 4612).

**Objectif de la partie** : contre différent du harcèlement direct — gagner la course au tempo (6 étoiles bon marché : 8 ouvriers, 4 recrues, ⚡16, ♥18, 2 missions) pour finir la partie AVANT que Frente Libre finalise son snowball de paires de fin de partie, et monter ma propre popularité pour que mon inventaire compte au palier ×2/×3 au moment du décompte.

## Résultat

| Rang | Joueur | Score | Étoiles | Détail |
|---|---|---|---|---|
| 1 | Acadiane (bot) | **69** | 3 ⭐ | terr 6 · 2 paires · 0$ |
| 2 | Dominion (bot) | 63 | 6 ⭐ | terr 6 · 1 paire · 6$ |
| 3 | Bayou (bot) | 54 | 3 ⭐ | terr 5 · 4 paires · 7$ |
| 4 | Frente Libre (bot) | 52 | 5 ⭐ | terr 3 · 2 paires · 7$ |
| **5** | **Nations Souv. (Claude)** | **49** | 4 ⭐ | terr 4 · 3 paires · 4$ |

Partie terminée au **tour 37** : Dominion enchaîne, pendant son propre tour d'usine, « Tournée des Comtés » (-1 carte) → +2♥ (bonus d'usine) → franchit directement le palier popularité max (18), sa 6e étoile, et termine la partie sur-le-champ. Je n'ai eu aucune fenêtre pour réagir : c'est un combo de carte d'Usine, pas un sprint d'étoiles classique.

Mes étoiles : 8 ouvriers (T12), mission « La Diagonale » (T16), 4 recrues enrôlées (T25), puissance max 16 (T27).

## Le sprint de tempo a-t-il marché ?

**Partiellement — sur l'axe anti-Frente, oui ; sur mon propre score, non.**

- **Frente Libre n'a pas gagné.** C'est le résultat le plus important au regard de la mission : contrairement aux 3 parties précédentes où Frente gagnait par thésaurisation (jusqu'à 36 pts de paires en un seul pillage tardif), ici il finit **4e avec seulement 2 paires et 3 territoires**. La partie s'est fermée au tour 37 — plus tard que les T27-32 habituels côté durée brute, mais Frente n'a jamais eu la fenêtre de fin de partie tranquille pour accumuler : il a été lui-même pillé par Bayou au tour 37 (perte de puissance et d'un mecha) juste avant la fin. Le tempo collectif (moi + les 3 autres bots poussant leurs étoiles en parallèle) a suffi à l'empêcher de dérouler son snowball, sans même que ce soit moi qui le bouscule directement.
- **Mais je n'étais pas devant.** J'ai atteint 4 étoiles dès le tour 27 (à égalité avec Frente à ce moment), un tempo largement supérieur aux parties précédentes où la 1re étoile tombait souvent après le tour 15-20. Le problème : **le rush vers les étoiles bon marché ne construit pas de score**. J'ai obtenu l'étoile "8 ouvriers" en stackant 6 travailleurs sur un seul hex village (#14) — une mécanique qui remplit le compteur d'ouvriers sans ajouter un seul territoire. Résultat : seulement 4 territoires en fin de partie, le pire total de la table à égalité avec... personne (tout le monde a fait mieux). Le score final (49) est le plus bas malgré un compte d'étoiles honorable (4/6, mieux qu'Acadiane et Bayou qui n'en avaient que 3).
- **Le vrai vainqueur (Acadiane, 3 étoiles seulement) a gagné par le territoire**, pas par les étoiles : 6 hexes tenus (comptoirs disséminés) contre mes 4. La leçon est nette : **dans ce mode de score, territoire × B pèse au moins autant que étoiles × A**, et sprinter les étoiles sans étendre son empreinte territoriale est une stratégie perdante même si elle « marche » au sens propre de l'objectif de mission.

## Moments clés

1. **T7-T12 — Découverte de la spirale ouvriers de village.** En lisant le code source du moteur (`headlessGame.js:produce`), j'ai découvert que jouer Produire sur un hex village où l'on a déjà des ouvriers **double** leur nombre sur place (1→2→4→7→8, plafond 8), au lieu de la production classique. Étoile obtenue en 3 tours de Produire au lieu d'une expansion territoriale lente. Rapide pour l'étoile, mais un choix stratégique qui s'est avéré coûteux au score final (voir verdict ci-dessus).
2. **T14-T16 — Le prix caché du stack.** Une fois à 8 ouvriers, chaque Produire coûte désormais 1 Puissance + 1 Popularité + 1$ (`produceCostLabel` scale avec le nombre d'ouvriers) — j'ai dû arrêter de produire des ressources classiques et basculer sur `trade`/`trade_pop` (achat direct contre pièces, sans taxe de popularité) pour continuer à progresser sans saigner ma popularité.
3. **T15 — Bug serveur sur `bottom_enlist` sans paramètres.** Un premier appel sans `{section, recruit}` a fait planter le moteur (`Cannot read properties of undefined`) *après* avoir déjà débité 3 nourriture et incrémenté le compteur de recrues — état incohérent (voir Bugs).
4. **T20-T30 — Course à 4-5 étoiles en parallèle.** Frente atteint 4 puis 5 étoiles très vite (mechas, combat, objectif de faction, recrues) sans jamais dépasser 5 avant la fin ; Dominion grimpe discrètement (recrues, mechas, combat) jusqu'à son combo final. Aucun des bots n'a jamais menacé directement mon hexagone (aucun combat subi de toute la partie) — le harcèlement n'était pas leur priorité cette partie, cohérent avec l'axe « ignorer sauf menace directe » de la mission.
5. **T37 — Fin sur un combo d'Usine adverse.** Dominion boucle Tournée des Comtés → +2♥ → palier popularité max en une seule séquence pendant *son* tour, sans qu'aucune de mes actions n'ait pu influer. Un rappel que la 6e étoile peut venir d'ailleurs que d'un rush d'étoiles bon marché classique — les cartes d'Usine sont un raccourci de fin de partie que je n'ai pas anticipé dans mon plan.

## Verdict sur les bots

- **Aucune agression envers moi cette partie** : les 4 bots se sont essentiellement ignorés entre eux et n'ont mené que 4 combats au total, tous bot-contre-bot (Acadiane vs Frente T26, Acadiane vs Dominion T33/T36, Bayou vs Frente T37). Aucun n'a jugé mon empire (concentré, peu de territoire, hero baladeur) suffisamment intéressant à piller — cohérent avec le fait que je n'avais presque aucune ressource stockée en vue (2-4 bo/mé seulement).
- **Frente Libre a joué son pattern habituel (mechas + trap + enrôlement) mais sans la fenêtre de fin de partie pour le rentabiliser** : 5 étoiles, 4 mechas déployés, mais seulement 3 territoires et 2 paires au décompte — la preuve que couper la partie plus tôt (T37 au lieu de T27-36 habituels, mais surtout la pression collective des 4 bots) empêche son pillage tardif caractéristique de se concrétiser.
- **Acadiane a fait la meilleure partie sans forcer sur les étoiles** : construction régulière (comptoirs, Mémorial), 6 territoires, jamais paniqué — un bon contre-exemple montrant qu'un bot « équilibré » qui étend son empreinte au lieu de sprinter les étoiles peut gagner avec un score d'étoiles inférieur.
- **Dominion a terminé la partie via un combo de carte d'Usine** plutôt qu'un chemin d'étoiles laborieux — signal que les bots exploitent bien les raccourcis de cartes d'Usine quand ils sont disponibles.

## Bugs / frictions rencontrés

1. **`bottom_enlist` sans `{section, recruit}` plante ET débite les ressources avant de planter.** Appel `{"type":"bottom_enlist"}` sans les deux paramètres → erreur interne `Cannot read properties of undefined (reading 'apply')`, mais `paidBottom` (ligne 848 de `headlessGame.js`) et l'incrément `p.recruits++` (ligne 850) s'exécutent *avant* le crash à la ligne 851 (`ENLIST_IMMEDIATE[a.section].apply`). Résultat : 3 nourriture perdues, compteur de recrues avancé sans que `enlistMap` soit rempli — état incohérent. À corriger : valider `section`/`recruit` (et qu'ils sont dans les listes légales) *avant* tout effet de bord, ou envelopper l'action dans une transaction annulée en cas d'exception.
2. **La mécanique de doublement des ouvriers sur hex village n'est documentée nulle part dans le résumé du pilote.** Il faut lire `headlessGame.js` (`produce()`, branche `hex.t === 'village'`) pour la découvrir. Elle permet d'obtenir l'étoile "8 ouvriers" en 3 tours sans aucune expansion territoriale, ce qui semble un raccourci non intentionnel au vu de son impact sur le score final (territoire compte séparément et n'est jamais généré par cette mécanique). Suggestion : soit documenter clairement ce comportement dans le résumé de jeu (`ACTIONS`/aide contextuelle), soit revoir l'équilibrage pour que empiler des ouvriers sur un seul hex village coûte plus cher ou soit plafonné par hex.
3. **Affichage cosmétique** : les missions déjà révélées (`mission1 "La Diagonale"`) repassent à l'affichage `✗` dès que la condition sous-jacente n'est plus vraie (perte du 4e type de terrain après déplacement du héros), alors que l'étoile est bel et bien acquise et comptée (`⭐` au total ne redescend jamais). Comportement correct côté état, mais trompeur à la lecture du résumé pendant la partie — pourrait afficher « ✓ révélée (acquise) » de façon permanente.
4. **Coût de `Produire` qui grimpe avec le nombre d'ouvriers** (`produceCostLabel`) n'est indiqué qu'au moment de l'action, pas en amont dans le résumé de colonne — un joueur pressé peut se faire surprendre par une ponction de popularité qu'il ne voulait pas payer juste avant la fin de partie.

## Suggestion d'équilibrage (argumentée)

**Le score final valorise trop peu les étoiles bon marché obtenues sans expansion territoriale, ce qui rend le "sprint aux 6 étoiles" contre-productif dans ce mode de score.** J'ai terminé avec 4 étoiles (2e meilleur total de la table) mais **dernier au score** (49 pts), simplement parce que ma stratégie d'étoiles rapides (spirale d'ouvriers sur un hex, enrôlements, bolster) ne générait ni territoire ni paires. À l'inverse, Acadiane a gagné avec seulement 3 étoiles en misant sur le territoire. Deux pistes :
- **Revoir le poids relatif territoire/étoiles au score final** si l'intention de conception est que les étoiles restent la voie royale vers la victoire (sinon le mode « course aux étoiles » documenté dans les fiches de faction devient un piège pour un joueur qui suit la fiche à la lettre).
- **Plafonner ou renchérir le stack d'ouvriers sur un même hex village** (par exemple : la 2e vague d'ouvriers sur un hex déjà occupé ne double plus mais ajoute un nombre fixe, ou le coût en pièces croît par palier) pour que l'étoile "8 ouvriers" nécessite une expansion territoriale minimale, alignée avec l'esprit du jeu (contrôler du terrain) plutôt qu'un pur jeu de compteur sur une seule case.

## Fichiers produits

- Journal : `docs/design/parties_api/journal_nations_seed4612_sprint_tempo.json`
- Ce rapport : `docs/design/parties_api/rapport_nations_seed4612_sprint_tempo.md`
