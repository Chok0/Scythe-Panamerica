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

## Bugs découverts en jouant (notés 📝 dans le journal, à corriger)

1. **Mission secrète humaine jamais révélée** *(bloquant, score)* — « La
   Diagonale » condition remplie du T21 à la fin, « révélable à la fin du
   tour », jamais révélée sur 8 fins de tour (les DEUX missions remplies au
   T24). Les bots, eux, révèlent automatiquement. Sans ce bug la partie se
   finissait au T24-25. → vérifier le flux `endHumanTurn` (la révélation est
   probablement absente du chemin humain, ou sautée dès qu'un combat/une
   modale interrompt la fin de tour).
2. **Produire s'exécute en double en dev** *(biais de playtest)* — logs ×2 à
   chaque Produire humain, et effets réellement doublés à certains tours
   (T3 : Fe 1→5 pour +2 attendus ; T6 : Bo +4 pour +2). Très probablement le
   double-invoke StrictMode sur un updater `setPlayers` impur — la build de
   prod (le joueur) n'est pas touchée, mais ça fausse les playtests dev et
   ça pollue le journal. → purifier l'updater de production (et auditer les
   autres `setPlayers(prev => …)` qui mutent).
3. **Bond Convoi refusé pendant une continuation** — le pas de continuation
   (déplacement décomposé) n'a pas proposé village→Rouge River alors que
   `getValidMoves1Step` l'inclut. Suspect n°1 : le filtre `combatTriggers`
   de la continuation inclut `Object.values(empire)` même quand les bots
   Empire sont désactivés (mechs fantômes sur la carte ?). → filtrer l'empire
   inactif, ou ne bloquer que les hexes réellement occupés par un ennemi.
4. **Étoile ⚡16 non déclenchée sur gains passifs** — le Frente est resté
   plusieurs tours à ⚡16 / ⭐0 : les +1⚡ de recrues/voisins ne passent pas
   par le check `starPower` (il n'est fait que dans Soutien). → checker
   l'étoile à CHAQUE gain de puissance (helper commun).
5. **L'écran de résultat de combat bloque la fin de tour en silence** — après
   ma défense du T27, l'écran « cliquez pour continuer » est resté au-dessus
   de l'UI ; mes clics « Terminer le tour » étaient interceptés sans feedback.
   Facile à rater aussi pour un joueur (surtout après plusieurs combats dans
   le même tour). → fermer l'écran au bout de quelques secondes ou au premier
   clic n'importe où.

## Ressenti (la question du 28/07 : « je ne me suis pas senti menacé »)

Cette fois : menacé, oui — puni au T20 pour un héros exposé, contraint de
budgéter puissance ET cartes comme des munitions (deux folds subis, deux
défenses gagnées à 1-3 points près), dépossédé de l'Usine au moment où je
pensais la partie pliée, et talonné 5-5-5 dans le sprint final. L'écart final
(21 pts) vient surtout du multiplicateur ×3 (pop 18) — le différentiel de
tempo par tour était bien plus serré que les points ne le disent.
