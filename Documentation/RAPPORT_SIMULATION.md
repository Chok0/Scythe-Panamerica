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

### Règles de non-acceptation (implémentées dans `src/data/mapGen.js`)

Une carte générée est **rejetée** si :
- **R1 pocket** — un départ est enfermé par les rivières (< 8 hexes accessibles
  sans riverwalk). *La carte actuelle échoue à cette règle : la Confédération
  démarre dans une poche de 3 hexes.*
- **R2 resources** — moins de 3 types de ressources ou pas de village à ≤ 3 pas
  d'un départ.
- **R3 factory** — Rouge River inaccessible pour une faction.
- **R4 fairness** — écart d'« ouverture » > 2,5× entre factions.
- **R5 lakes** — bloc de plus de 3 lacs adjacents.
- **R6 rivers** — nombre de rivières hors [24, 46].
- **R7 empire** — un mecha de l'Empire démarrerait sur un lac/marécage.

Génération **guidée** (eau jamais sur les départs/Empire, village garanti près
de chaque base, pas de rivière sur les arêtes des hexes de départ) + réparation
(retrait des rivières qui enferment) → carte acceptée en ~3 essais.

### Verdict (`--mapSearch 12 --games 60`, 780 parties + 60 sur l'actuelle)

| Rang | Carte | Équilibre σ(winrate) | Winrates | Finies | Médiane |
|---|---|---|---|---|---|
| 1 | carte-4 | **0,093** | 14–39 % | 100 % | 34 |
| 2 | carte-12 | 0,120 | 5–41 % | 97 % | 36 |
| … | cartes 1-11 | 0,144–0,209 | — | 97-100 % | 32-36 |
| **13 (dernière)** | **panamerica (actuelle)** | **0,239** | 3–62 % | 97 % | 35 |

**Les 12 cartes procédurales validées sont toutes plus équilibrées que la carte
actuelle.** L'intuition était juste : la carte d'origine favorise
structurellement certaines factions (poches de rivières asymétriques, mix de
ressources inégal autour des bases). Le classement complet + la meilleure carte
sont dans `Documentation/cartes_procedurales_classement.json`.

**En jeu** : le setup propose désormais « 🗺 Carte procédurale » — une carte
neuve, validée par les règles ci-dessus, à chaque partie (Empire, rencontres et
départs replacés automatiquement). 300 parties simulées en mode carte aléatoire :
0 crash, 0 invariant violé.

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

600 parties carte classique + 300 parties cartes procédurales (98 % finies,
médiane ~35 rounds, 0 crash / 0 invariant) :

| Faction | Carte actuelle | **Cartes procédurales** |
|---|---|---|
| Acadiane | 65,6 % | **35,9 %** |
| Nations | 38,8 % | 26,3 % |
| Frente | 36,7 % | 29,0 % |
| Bayou | 10,5 % | **36,1 %** |
| Confédération | 9,1 % | **24,7 %** |
| Dominion | 10,5 % | 22,4 % |

**Sur cartes procédurales validées, toutes les factions jouent entre 22 et
36 %.** La quasi-totalité du déséquilibre entre factions venait donc de la
CARTE (poches de rivières, mix de ressources autour des bases), pas des
capacités des factions. La carte actuelle porte l'Acadiane (région
toundra/plaine ouverte) et enterre Bayou/Confédération (pas de métal,
poche de rivières).

## 6. Historique des bugs trouvés par simulation (12, tous corrigés)

v1 : puissance négative · impasse économique bots · égalité défenseur ·
étoile 8 ouvriers bots — v2 : scoring ressources non contrôlées · pioche du
vaincu · transfert de ressources · étoile défenseur — v3 : ouvriers déplacés
sur hex défendu · Dominion cannibale — v4 : générateur de cartes (fallback
silencieux corrigé), rencontres gratuites vs règle du coût obligatoire.
