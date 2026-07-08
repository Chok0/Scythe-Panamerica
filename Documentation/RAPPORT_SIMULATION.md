# Rapport de simulation — parties bot vs bot

> `npm run sim -- --games 600 --seed 42` · **v4** : équilibrage appliqué après
> A/B, cartes procédurales avec règles de non-acceptation, audit des cartes
> usine/rencontre.

## 1. Le harnais

`scripts/simulate.mjs` : parties complètes bot-vs-bot sans UI, avec la vraie
logique du jeu (PvP, PvE Empire, rencontres, rails, enlist, scoring conforme).
RNG seedé, invariants vérifiés à chaque tour (exit 1 si crash/violation → CI).

```bash
npm run sim -- --games 600 --seed 42        # batch standard
npm run sim -- --randomMap                  # une carte procédurale par partie
npm run sim -- --mapSearch 12 --games 60    # évaluer 12 cartes + l'actuelle
npm run sim -- --ab wf1|bayouBois|noFlagBonus   # expériences A/B
```

## 2. Équilibrage : testé en A/B, puis appliqué ou rejeté

| Hypothèse | Résultat A/B (400 parties, même seed) | Décision |
|---|---|---|
| **White Flag +1 pop** (au lieu de +2) | Acadiane 65,6 % → 65,8 % — aucun effet (les combats sont trop rares pour que ce soit son moteur) | ❌ rejeté |
| **fObj Acadiane durci** (comptoirs non adjacents entre eux) | Acadiane 65,6 % → **58,1 %** | ✅ appliqué (`factions.js`) |
| **Bayou : Deploy payable en bois** (« Bois flotté ») | Bayou 2,2 % → **8,4 %**, capacités mech 1,9 → 3,1/4, et Acadiane -5 pts par concurrence | ✅ appliqué |
| **Servitude sur déplacement** (capture d'un ouvrier chassé, -2 pop, max 2) + le bot Confédération chasse les hexes d'ouvriers | captures 0,05 → 0,26/partie ; fObj « Le Joug » atteignable | ✅ appliqué (demande) |
| **Comptoirs hors scoring** (contrôle) | Acadiane → 56,6 % — les comptoirs ne pèsent que ~9 pts | mesure, pas de changement |

Le vrai moteur de l'Acadiane reste la **popularité** (11,5 finale vs 4,9 les
autres ; le palier pop multiplie tout le score ×5/×4/×3). Le classement pop des
factions = exactement le classement des winrates. Piste suivante si besoin :
adoucir les paliers (×4/×3/×2) — testable au simulateur en 5 minutes.

## 3. Cartes procédurales — ta carte vs les générées

### Règles de non-acceptation v2 (`src/data/mapGen.js`)

Philosophie alignée sur le Scythe original : **les îlots de départ de 3 hexes
sont un pattern voulu** (la plupart des factions du jeu de base démarrent
enfermées, sauf Togawa/Albion) — la sortie se gagne par Deploy (Riverwalk) ou
Gare/rails (notre Mine). Ce qui est interdit, c'est l'ABSENCE de sortie.

Une carte est **rejetée** si :
- **R1 escape** — une faction n'a *aucune* sortie native de son îlot : aucune
  rivière du bord ne débouche sur un terrain de sa capacité Riverwalk (îlot OK,
  cul-de-sac définitif interdit).
- **R2 potential** — en ignorant les rivières (le potentiel une fois sorti) :
  moins de 3 types de ressources ou pas de village à ≤ 3 pas.
- **R3 factory** — Rouge River inaccessible par continuité terrestre.
- **R4 fairness** — écart d'ouverture > 4× entre factions (tolérant : îlots
  normaux, un joueur seul sur 2 hexes face à des plaines ouvertes, non).
- **R5 diversité (« non-proximité »)** — plus de 2 hexagones du même terrain
  adjacents : le plateau maintient la diversité locale des terrains.
- **R6 rivers** — nombre de rivières hors [24, 46].
- **R7 empire** — un mecha de l'Empire démarrerait sur un lac/marécage.

Génération guidée (eau jamais sur les départs/Empire, village à ≤ 2 pas de
chaque base, rivières libres partout — les îlots émergent naturellement) +
réparation ciblée (ouvrir une sortie, casser un cluster) → acceptée en ~2 essais.
**La carte actuelle passe ces règles** (sa poche Confédération a bien une
sortie Riverwalk vers la plaine, et elle respecte la non-proximité).

### Verdict (`--mapSearch 12 --games 60`)

| Rang | Carte | Équilibre σ(winrate) | Winrates | Finies |
|---|---|---|---|---|
| 1 | carte-4 | **0,120** | 16–50 % | 100 % |
| 2 | carte-5 | 0,125 | 16–53 % | 97 % |
| 3–8 | cartes générées | 0,160–0,178 | — | 95-100 % |
| **9** | **panamerica (actuelle)** | **0,179** | 6–58 % | 100 % |
| 10–13 | cartes générées | 0,195–0,207 | — | 95-98 % |

Avec les règles authentiques, la carte actuelle est **dans la norme** (9ᵉ/13) ;
le générateur trouve tout de même mieux (σ 0,120). Classement + meilleure carte
dans `Documentation/cartes_procedurales_classement.json`.

**En jeu** : le setup propose « 🗺 Carte procédurale » — carte neuve validée à
chaque partie (Empire, rencontres, départs replacés). 300 parties simulées en
mode carte aléatoire : 0 crash, 0 invariant violé.

## 4. Audit des cartes (questions posées)

### Cartes usine (Ford/Tesla) — partiellement développées

- ✅ 10 cartes en données, sélection à Rouge River (premier arrivé voit le plus
  de cartes), badge sur la barre du joueur.
- ✅ Bonus « bottom » branchés : réductions de coût / pièces sur
  Upgrade/Deploy/Build/Enlist (`getPlanBottomBonus`).
- ❌ Actions « top » : **stubs** — `applyPlanTop` n'est jamais appelé (les flags
  `_planMoveBonus`, `_planDoubleProduction`… ne sont consommés nulle part).
- ❌ Les bots ne visitent jamais Rouge River (contenu réservé à l'humain).
- ⚠ Écart au modèle original : la règle en fait une **5ᵉ section du plateau
  joueur** (une vraie colonne d'action avec « déplacer 1 unité deux fois ») —
  c'est le bon design cible, chantier notable (nécessite de généraliser le
  système de colonnes).

### Cartes rencontre — rééquilibrées vers l'original

L'original (28 cartes) fait **payer** les grosses options (pièces ou
popularité : « vos choix impactent la façon dont le peuple vous perçoit ») et
rend une option **indisponible** si son coût est impayable. Notre proto (15
cartes) distribuait des cadeaux gratuits (+4 pop, +5 $, +3 ressources…).

Passe appliquée : **11 options fortes coûtent désormais des pièces ou de la
popularité**, avec `available(p)` — option grisée dans l'UI si impayable, et
les bots ne choisissent que parmi les options payables (règle p.24). Reste
plus généreux que l'original (gains posés sur le hex ✅, mais pas de coûts en
ressources) — à resserrer si les parties réelles le confirment.

## 5. Batch final — LE résultat clé

600 parties carte classique + 300 parties cartes procédurales v2 (98 % finies,
médiane ~35 rounds, 0 crash / 0 invariant) :

| Faction | Carte actuelle (fixe) | **Rotation de cartes procédurales** |
|---|---|---|
| Acadiane | 65,6 % | **34,4 %** |
| Nations | 38,8 % | 24,7 % |
| Frente | 36,7 % | 32,9 % |
| Bayou | 10,5 % | **32,4 %** |
| Confédération | 9,1 % | **23,7 %** |
| Dominion | 10,5 % | 26,5 % |

**En rotation de cartes procédurales, toutes les factions jouent entre 24 et
34 %** (même avec les îlots authentiques permis). L'essentiel du déséquilibre
mesuré entre factions vient donc de la GÉOGRAPHIE FIXE (quelle faction profite
de quelle région), pas des capacités : chaque carte individuelle favorise
quelqu'un, la rotation égalise. La carte actuelle, elle, favorise durablement
l'Acadiane (région toundra/plaine) et pénalise Bayou/Confédération (pas de
métal proche, sortie d'îlot plus coûteuse).

## 6. Historique des bugs trouvés par simulation (12, tous corrigés)

v1 : puissance négative · impasse économique bots · égalité défenseur ·
étoile 8 ouvriers bots — v2 : scoring ressources non contrôlées · pioche du
vaincu · transfert de ressources · étoile défenseur — v3 : ouvriers déplacés
sur hex défendu · Dominion cannibale — v4 : générateur de cartes (fallback
silencieux corrigé), rencontres gratuites vs règle du coût obligatoire.
