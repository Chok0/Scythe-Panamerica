# TODO — Panamerica Proto v0.8 Fixes

## ✅ Fixes appliqués (v0.8-fixed → v0.9)

| # | Problème | Statut |
|---|----------|--------|
| 1 | **Cartes combat limitées à 1 par unité combat** (héros/mecha) sur le hex | ✅ Joueur + Bot PvP |
| 2 | **Enlist : 4 choix de bonus immédiat** (+2 pui / +2$ / +2 pop / +2 CC) | ✅ Joueur + Bot |
| 3 | **Deploy débloque mech abilities progressivement** (Speed→Riverwalk→Combat→Position) | ✅ Joueur + Bot + log |
| 8 | **Fin de partie immédiate** (useEffect sur 6+ étoiles, pas fin de round) | ✅ |
| — | **Bot PvE : cartes combat** limitées aux unités réelles sur le hex (était hardcodé à 2) | ✅ |
| 4 | **Transport mecha** — mechs transportent ouvriers + ressources ; héros transportent ressources | ✅ Joueur + Bot + PvE/PvP combat |
| — | **Mech move manquant** — les mechs ne bougeaient pas en mouvement normal (seul hero/worker) | ✅ Fixé |
| — | **Mech retreat PvP** — la retraite mech en combat PvP perdu n'était pas codée | ✅ Fixé |
| — | **Refonte graphique v0.9** — Source Serif 4, tailles +30%, tracks 54px, bottom 40vh, combat modal | ✅ |
| B | **6 Combat abilities (slot 2)** — Cavaliers, Peuple Armé, Ronin, White Flag, Flibuste, Discipline | ✅ Joueur + Bot + UI |
| A | **Speed ability (slot 0)** — +1 hex mouvement (pathfinding 2-step via getValidMoves1Step) | ✅ Joueur + Bot |
| P | **4 Position abilities (slot 3)** — Township, Terrier, Submerge, Bayou Walk | ✅ Joueur + Bot |
| P2 | **Pack Up (Nations, slot 3)** — mouvement gratuit de bâtiment pendant l'action Move (1×/tour, hex adj.) | ✅ Joueur + Bot + UI |
| FA1 | **Esprit Sauvage (Nations faction ability)** — Deploy en métal OU bois | ✅ Joueur + Bot + UI (choix ressource) |
| FA2 | **Chimère (Bayou)** — 1×/partie : capturer mecha ennemi (PvP + PvE) → 5e mecha | ✅ Joueur + Bot (PvP + PvE) |
| FA3 | **Servitude (Confédération)** — victoire PvP sur ouvriers → -2 pop → capturer 1 ouvrier (max 2) | ✅ Joueur |
| FA6 | **Commerce Impérial (Dominion)** — 1×/tour : 1 ressource → 2$ ou 1 CC | ✅ Joueur + Bot + UI |
| WD | **Déplacement ouvriers ennemis** — héros/mech entre sur hex ouvriers seuls → retraite + perte pop | ✅ Joueur + Bot |
| WR | **Restriction mouvement ouvriers** — ouvriers ne peuvent pas entrer sur hex ennemi + filtrage UI | ✅ Joueur + Bot |
| FA4 | **Tierra Minada (Frente)** — 4 Trap tokens après mouvement héros, -3⚡ au déclenchement, territoire au scoring | ✅ Joueur + Bot + Map + Scoring |
| FA5 | **Comptoir (Acadiane)** — 4 Flag tokens après mouvement héros, +1 territoire au scoring (pas adj. HB) | ✅ Joueur + Bot + Map + Scoring |
| TN | **Système de rail** — réseau partagé, BFS connectivity, Gare→3 segments, 4 Empire rails au setup | ✅ Joueur + Bot + Map + UI placement |
| PM | **Player mat visuel** — 4 colonnes Scythe avec top/bottom, coûts, gains, progression | ✅ |
| UPG | **Upgrade cubes mobiles** — 2-step (source top → dest bottom), coûts dynamiques, bonus $, 5 mats | ✅ Joueur + Bot + UI |
| ENL | **Enlist permanent (voisins)** — recrues assignées à 1 bottom col, ongoing déclenché par soi + voisins | ✅ Joueur + Bot + UI |
| BLD | **Building effects** — Arsenal +1⚡ Bolster, Mémorial +1♥ Bolster, Moulin +1 Produce sur hex | ✅ Joueur + Bot |
| ANI | **Animations** — hex ripple, panel slideUp, combat entrance, btn hover/press, log slide, bot pulse | ✅ |

## 🔧 Fixes restants

### ✅ Toutes les faction abilities — IMPLÉMENTÉES (6/6)
### ✅ Toutes les mech abilities — IMPLÉMENTÉES (24/24 + Pack Up)
### ✅ Toutes les mécaniques Scythe structurantes — IMPLÉMENTÉES
- Upgrades cubes mobiles, Enlist permanent voisins, transport, worker displacement, scoring complet
- Building effects: Arsenal (+1 Pui Bolster), Mémorial (+1 Pop Bolster), Moulin (+1 Produce), Gare (rails)

### ✅ Animations UI
- Hex click ripple (SVG), panel slideUp (actions, bottom, encounter, Rouge River), combat modal entrance
- Boutons hover lift + active press, log lines slide-in, bot turn pulse scoreboard
- Player mat column hover glow, 14 @keyframes total, 25 SVG animates, 8 CSS transitions

### Priorité basse (polish uniquement)

| # | Élément | Détail |
|---|---------|--------|
| F | **Plans Tesla/Ford activables** | Les cartes choisies à Rouge River donnent des actions supplémentaires |
| IC | **Icônes Scythe** | Remplacer les emoji par les vrais PNG depuis regledujeu.fr |

## 📝 Notes d'architecture

- **`transportUnits(player, fromHex, toHex, unitType)`** — helper pur (sans side effects)
  - `unitType==="mech"` → déplace ouvriers alliés + ressources du hex d'origine vers destination
  - `unitType==="hero"` → déplace ressources uniquement (pas d'ouvriers, règle Scythe)
  - `unitType==="worker"` → pas de transport (les ouvriers ne transportent rien dans Scythe)
  - Retourne `{player, carried: {workers, resTypes}}` pour le log
  - Appelé dans : mouvement normal, PvE win, PvP win, bot hero move, bot mech move (6 sites)
- `unlockedAbilities` est un array d'indices [0-3] poussé à chaque Deploy
  - 0 = Speed (⚡ +1 mouvement) — **implémenté** (2-step pathfinding)
  - 1 = Riverwalk (🌊 traverser rivières) — **implémenté**
  - 2 = Combat (⚔ bonus combat) — **implémenté** (6 factions)
  - 3 = Position (📍 capacité unique) — **implémenté** : Bayou Walk, Terrier, Township, Submerge, **Pack Up (Nations)**
- **Pack Up** (Nations slot 3) — mouvement gratuit de bâtiment pendant l'action Move
  - Gratuit (pas de coût ressource), 1× par action Move, bâtiment se déplace de 1 hex adjacent
  - `doPackUpMove(buildingIdx, targetHex)` — joueur, flag `packUpUsed` reset en fin de tour
  - Bot : 50% chance d'utiliser Pack Up au début de chaque action Move
  - UI : panneau dans la section Move, après les boutons d'unités
- **Esprit Sauvage** (Nations faction ability) — Deploy en métal OU bois
  - `doDeploy(targetHex, overrideRes)` — `overrideRes` optionnel, "bois" pour Nations
  - UI : choix métal/bois avant de choisir le hex
  - Bot : utilise bois si pas assez de métal
- **Chimère** (Bayou faction ability) — capturer un mecha ennemi vaincu, 1×/partie
  - PvP : après victoire, si `!me.chimereUsed` et `preEnemyMechs.length>0` → crée mecha `_chimere`
  - PvE : après victoire Empire, même logique → capture le Model M détruit
  - Flag `chimereUsed` empêche réutilisation, `capturedMech` incrémenté pour l'objectif de faction
  - Le 5e mecha n'a PAS d'ability supplémentaire (les 4 slots sont déjà débloqués)
- **Servitude** (Confédération faction ability) — capturer ouvrier ennemi en PvP
  - Après victoire PvP, si ouvriers ennemis sur hex, `pop>=2`, `capturedWorkers<2` → -2 pop, +1 ouvrier
  - Max 2 ouvriers capturés total (réserve spéciale)
  - Joueur seulement (bot Confédération pas implémenté pour Servitude)
- **Commerce Impérial** (Dominion faction ability) — 1×/tour, convertir ressource
  - `doCommerceImperial(resType, reward)` — dépense 1 ressource, gagne 2$ ou 1CC
  - Flag `commerceUsed` reset en fin de tour (avec `packUpUsed`)
  - Bot : utilise automatiquement chaque tour, 60% coins / 40% CC
  - UI : panneau dédié sous les objectifs, visible tant que non utilisé
- **Worker displacement** (Scythe core rule)
  - Quand héros/mech (joueur ou bot) entre sur un hex avec UNIQUEMENT des ouvriers ennemis → pas de combat
  - Les ouvriers ennemis sont renvoyés à leur home base, le joueur perd 1 pop par ouvrier déplacé
  - Joueur : dans handleHexClick, après le mouvement, avant les triggers héros
  - Bot : dans le useEffect après `setPlayers`, vérifie tous les hex du bot vs tous les autres joueurs
- **Worker movement restriction** (Scythe core rule)
  - Les ouvriers ne peuvent pas entrer sur un hex occupé par un ennemi (hero, mech, ou worker)
  - UI : `validMoves` useMemo filtre les hex ennemis quand `moveSource.unitType==="worker"`
  - Joueur : double-check dans handleHexClick (belt and suspenders)
  - Bot : `botTurn` reçoit `enemyHexes` Set en paramètre, filtre les destinations ouvrier
- **`COMBAT_ABILITIES`** — objet par faction avec `apply(player, hexId, isAttacker, enemyCards)` → `{powerBonus, cardBonus}`
- **`getCombatBonus(player, hexId, isAttacker, enemyCards)`** — wrapper qui vérifie slot 2 débloqué avant d'appeler
  - `cardBonus` augmente le nombre max de cartes jouables (pas joué automatiquement)
  - `powerBonus` s'ajoute au total final (visible dans l'UI combat)
  - **White Flag** : géré séparément (pré-combat, 50% chance pour bot Acadiane défenseur)
  - **Flibuste** : géré séparément (post-combat, transfert de pièces)
  - Appelé dans : UI combat, resolveCombat joueur, resolveCombat bot PvP, bot PvE (4 sites)
- **`getValidMoves1Step(fromId, factionId, abilities, player, rails)`** — mouvement 1 pas avec position abilities + rails
  - **Rail network** : BFS depuis fromId à travers les segments de rail → tous les hex connectés sont accessibles en 1 mouvement
  - Township (confederation) : villages contrôlés ↔ Rouge River, nécessite `player` pour connaître les villages contrôlés
  - Terrier (frente) : toutes sierras adjacentes (pas besoin de `player`)
  - Submerge (acadiane) : lacs traversables + lac↔lac téléport
  - Bayou Walk (bayou) : marécages adjacents
- **`getValidMoves(fromId, factionId, abilities, player, rails)`** — wrapper Speed
  - Sans Speed : retourne `getValidMoves1Step()` directement
  - Avec Speed (slot 0) : union de tous les hex atteignables en 1 ou 2 pas
  - Le 2e pas utilise les mêmes règles (riverwalk, position abilities, rails) que le 1er
- **Système de rail** — réseau partagé global, remplace les tunnels Scythe
  - `rails` state : array de `[hexA, hexB]` segments, partagés par tous les joueurs
  - `EMPIRE_RAILS` : 4 segments pré-posés au setup autour de Rouge River
  - `Gare` (bâtiment, remplace Mine) : déclenche mode placement de 3 segments
  - `railPlacement` state : `{remaining:3, fromHex:null}` pendant la pose
  - UI : cliquer 2 hex adjacents par segment, lignes dorées pulsantes pour les destinations valides
  - Bot : génère 3 segments aléatoires en chaîne depuis le hex de la Gare (`_pendingRails`)
  - Rendu map : sleeper ties bruns + double rail + bolts aux extrémités
- **Système d'Upgrade — cubes mobiles** (Scythe core mechanic)
  - Chaque mat a `topCubes: [1,2,1,2]` (cubes assis sur le top au départ) et `bottomSlots: [1,1,2,2]` (places max par bottom)
  - Chaque mat a `bottomCosts: [{res, base, bonus}]` — coût de base par bottom + bonus $ quand un cube est placé
  - State joueur : `cubesOnTop: [1,2,1,2]`, `cubesOnBottom: [0,0,0,0]` — évolue à chaque Upgrade
  - `getBottomCost(player)` — helper pur qui calcule le coût effectif : `base - cubesOnBottom[col]`
  - `doUpgrade(fromCol, toCol)` — retire 1 cube du top[fromCol], place sur bottom[toCol], donne bonus $
  - UI : 2-step picker — ① choisir top source (boutons verts avec compteur cubes) ② choisir bottom dest (avec slots visuels)
  - Player mat visuel : carrés verts 8×8 sur le top (cubes restants), slots verts/vides sur le bottom
  - Bot : choisit aléatoirement une source top valide et une dest bottom valide
  - L'ancien `BOTTOM_COST` flat est supprimé — chaque mat a ses propres coûts
- **Enlist Permanent (voisins)** — Scythe ongoing recruit system
  - `enlistMap: [false,false,false,false]` — tracks which bottom columns have a recruit assigned
  - `ENLIST_ONGOING` — fixed bonuses: col0→+1⚡, col1→+1💰, col2→+1♥, col3→+1🃏
  - `applyEnlistOngoing(playersArr, actorIdx, bottomCol)` — checks self + left/right neighbors (circular), applies bonus
  - `finishBottom(bottomCol)` — wrapper called by all human bottom actions (replaces `actuallyEndTurn`)
    - Calls `applyEnlistOngoing` with player 0, then `actuallyEndTurn()`
    - "Passer →" button still calls `actuallyEndTurn` directly (skip = no trigger)
  - `doEnlist(colIdx)` — assigns recruit to bottom col, immediate bonus (+2), sets `enlistMap[col]=true`
  - UI : 4 buttons showing each bottom action, immediate bonus, ongoing bonus, disabled if already assigned
  - Bot Enlist : picks random unassigned col, applies immediate bonus
  - Bot ongoing : `botTurn` returns `{player, logs, bottomCol}`, applied via `applyEnlistOngoing` in useEffect
- La fin de partie est maintenant un `useEffect` qui surveille le state `players` — plus robuste qu'un check en fin de round
- Le bot PvE calcule maintenant `botUnitsOnHex` dynamiquement pour le cap de cartes combat
