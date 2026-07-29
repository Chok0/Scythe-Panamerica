# Playtest par l'IA — 28/07/2026, partie jouée en direct dans le navigateur

Première partie jouée par Claude (pilotage Playwright, décisions humaines au
tour par tour, siège joueur 1) sur la build de dev incluant les correctifs
bots du jour (v0.16 : phase sur l'horloge de table, carburant de guerre,
stratégie popularité, pivot mi-partie, `pickDeploySlot`, attaque à parité).
Journal complet : `journal_partie_claude_20260728.json` (602 entrées).

## Résultat : Confédération (moi) 78 · Frente Libre 57 · Dominion 55 · Bayou 41 — 29 tours

Même faction et même plateau que la partie du joueur du 28/07 (Confédération
/ Terroir, carte v3, difficulté normale, 3 bots) — adversaires différents
(Dominion, Frente, Bayou).

| | Partie joueur 28/07 | Partie Claude (correctifs v0.16) |
|---|---|---|
| Écart vainqueur / 2e | 77 − 38 = **39 pts** | 78 − 57 = **21 pts** |
| Étoiles des bots | 0 / 2 / 2 | **5 / 5 / 1** |
| Attaques des bots sur le joueur | **0** | **4** (Dominion ×2, Bayou ×1, Frente ×1) |
| Combats bot↔bot | 0 | 1 (Dominion bat Bayou, étoile 2/2) |
| Pop finale du joueur | 6 (palier ×1) | 18 (palier ×3, étoile pop) |
| Pivot « plan ne paie pas » | T24/25 (dernier tour) | Bayou dès T12 |

## Le récit en cinq moments

1. **T10-T16 — l'ouverture** : Gué au 2e mecha pour sortir de l'îlot,
   rencontre à domicile (+1 pop → palier ×2 dès T10), Moulin/Mémorial/Gare en
   bord de lacs, course à l'Usine gagnée au T13 (Hangar Préfabriqué : les 2
   bâtiments restants à 2$). 1re étoile T16.
2. **T20 — la punition** : à peine ma 3e étoile posée, **Whitfield (⚡16,
   ⭐2) fond sur J. Cole isolé au village #30 : 11 contre 9 possibles — fold
   à 0, village perdu, étoile de combat offerte au leader.** Le sentiment
   d'être menacé, immédiat et mérité (héros seul en territoire ouvert).
3. **T22 — le contre** : le Dominion écrase le Bayou (⭐5 !) puis m'attaque
   dans la foulée sur le Mémorial… à ⚡2 restants. Défense à fond : 12 contre
   6, **étoile de combat pour moi**. La gestion de la puissance comme
   dissuasion/munition fonctionne dans les deux sens.
4. **T23-T28 — la guerre de l'Usine** : je la prends au Bayou par bond Convoi
   + Cavaliers (9-3, étoile combat 2/2)… puis je subis **trois assauts en
   deux tours** : Zeke (repoussé 8-5), Whitfield (repoussé 6-5 — à UN point),
   E. Rojas à deux unités (fold forcé, Usine perdue). Les bots convergent
   sur la cible de valeur et se relaient.
5. **T29 — le sprint** : trois joueurs à ⭐5. Pop 18 au Commerce → 6e étoile,
   fin de partie déclenchée en tête.

## Verdict sur les correctifs du jour (observés en jeu)

- **Carburant de guerre** : Frente ⚡15-16 dès T17, Dominion ⚡12-16 — plus
  aucun profil agressif anémique. La dissuasion redevient une monnaie.
- **pickDeploySlot** : le Bayou prédateur a déployé Flibuste au 2e mecha
  (Ab[0,2]) — sa chasse était armée dès T9.
- **Attaques bot→humain** : 4 sur la partie, toutes sur des cibles justifiées
  (héros isolé, hex à 3 territoires). Le modal de défense interactif tient.
- **Pivot mi-partie** : Bayou distancé replie dès T12 (au lieu de T24).
- **Popularité de joueur** : les 3 bots finissent aux paliers ×2 (8-12 pop),
  gains par enlists/mémorial/bâtiments plutôt qu'achats à +1 sec.
- **Déplacement décomposé (T5 du joueur)** : utilisé plusieurs fois en vrai
  (mech chargé : 1er pas, choix de cargaison via 🚚, « Terminer ici »). Fluide.
- **Tooltip riverwalk** : affiché à la sélection d'unité — c'est lui qui m'a
  rappelé que le Gué n'ouvre que plaine/désert.

## Bugs découverts en jouant — statut après investigation (commit suivant)

1. **Mission secrète non révélée pendant 8 tours** — *requalifié après
   lecture du code* : les boutons « Révéler ⭐ (termine le tour) » existent
   bien dans l'écran de fin de tour ; c'est mon pilotage qui cliquait le
   « ✔ Terminer le tour » générique sans les voir. Vraie leçon UX : rien ne
   signalait qu'une étoile restait sur la table. **Corrigé** : quand un
   objectif est révélable, le bouton devient « ⚠ Terminer SANS révéler
   (l'étoile attendra) », en orange — le sandbagging reste possible, mais
   c'est désormais un choix visible.
2. **Produire s'exécute en double en dev** — *confirmé* : l'updater
   `setPlayers` de `doProduce` mutait `p.resources[hex]` EN PLACE (référence
   partagée avec `prev`) et appelait `addLog` à l'intérieur ; le
   double-invoke StrictMode doublait gains et logs (prod non touchée).
   **Corrigé** : gains précalculés hors updater, updater pur (copies),
   logs émis une fois. Même purge sur `doBolster` (logs ×2). Vérifié en jeu
   après fix : une seule ligne par production. *Dette restante : ~15 autres
   updaters contiennent encore des `addLog` (logs ×2 cosmétiques en dev
   uniquement) — à purger au fil de l'eau sur le même modèle.*
3. **Bond Convoi refusé pendant une continuation** — *requalifié* : test
   moteur ajouté (`movement.test.js`), le bond village→Rouge River est bien
   proposé en 1 pas ; `empire` est vide quand les bots Empire sont désactivés
   donc le filtre de continuation n'exclut rien à tort. Cause la plus
   probable : clic hors cible du pilotage (coordonnée du label mesurée 8
   tours plus tôt). Le test verrouille le comportement moteur.
4. **Étoile ⚡16 non déclenchée sur gains passifs** — *confirmé* (Frente
   ⚡16/⭐0 plusieurs tours). **Corrigé** : check ⚡16 et ♥18 dans
   `applyEnlistOngoing` (les bonus 🤝, canal principal des gains passifs,
   humain comme bots) + filet `starPower` dans les étoiles automatiques de
   `botTurn` (seul `starPop` y était).
5. **L'écran de résultat de combat bloque les clics indéfiniment** —
   *confirmé* (il se ferme au clic, mais intercepte tout sans feedback tant
   qu'on n'a pas compris). **Corrigé** : auto-fermeture après 7 secondes
   (`CombatRevealAutoClose`).

## Ressenti (la question du 28/07 : « je ne me suis pas senti menacé »)

Cette fois : menacé, oui — puni au T20 pour un héros exposé, contraint de
budgéter puissance ET cartes comme des munitions (deux folds subis, deux
défenses gagnées à 1-3 points près), dépossédé de l'Usine au moment où je
pensais la partie pliée, et talonné 5-5-5 dans le sprint final. L'écart final
(21 pts) vient surtout du multiplicateur ×3 (pop 18) — le différentiel de
tempo par tour était bien plus serré que les points ne le disent.
