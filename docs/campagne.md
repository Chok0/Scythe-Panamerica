# Mode campagne — « La Chute de l'Empire »

Le mode campagne est **implémenté** (v0.17). Il enchaîne 5 missions, chacune
étant une partie complète de Panamerica jouée avec une configuration imposée,
et il consomme les mécaniques qui dormaient en réserve dans les données.

- Écran : bouton **🎖 Campagne** sur l'accueil → `src/components/CampaignScreen.jsx`
- Données : `src/data/campaign.js` (missions, objectifs, récompenses)
- Progression : `src/logic/campaign.js` (pur) + clé localStorage `pa-campaign`
- Tests : `src/logic/__tests__/campaign.test.js`
- Règles en jeu : chapitre « Campagne » de `src/data/rules.js` (dérivé des données)

## Principe

Une mission = **une partie complète**. La partie se termine normalement (premier
joueur à 6 étoiles), puis l'**objectif de mission** est évalué sur l'état final :
on peut gagner la partie et rater la mission, ou l'inverse. Les **honneurs** sont
un second objectif facultatif, plus dur, sans autre récompense qu'une mention au
tableau de campagne.

La mission impose adversaires, difficulté, carte, patrouilles de l'Empire, rails
impériaux et tuile de pose — l'écran de setup verrouille ces réglages et n'y
laisse que le choix de la faction et du plateau. Une partie de mission
sauvegardée reprend en gardant sa mission (`pa-save` porte `mission` +
`missionRules`).

## Les 5 missions

| # | Mission | Configuration imposée | Objectif | Récompense |
|:-:|---------|----------------------|----------|------------|
| 1 | **Le Dernier Convoi** | 1 bot facile | Terminer 1er au score | 🗂 Plateaux des Pionniers (101-103) |
| 2 | **La Ruée vers l'Or** | 2 bots, tuile « Avant-Postes » | 12$+ de bonus de pose | 🗄 Archives de l'Empire (104-107) |
| 3 | **Les Machines Fantômes** | 2 bots, Empire + rails impériaux | Détruire 3 mechas de l'Empire | 📐 Plans d'usine originaux |
| 4 | **Le Blueprint Perdu** | 2 bots, Empire, prototype = 1 étoile | Finir avec un prototype Tesla | 🔬 Étoile de la quête Tesla |
| 5 | **La Chute de l'Empire** | 3 bots difficiles, Empire + rails | 1er avec 6 étoiles | 🗝 Missions secrètes originales |

Les objectifs sont des fonctions pures `check(me, ctx)` — `ctx` porte
`{ players, rank, score, sbCoins, turn }`, calculé depuis le scoring final
(extrait du rendu de fin de partie dans un `useMemo` `finalScores`).

## Contenu débloqué

Les trois ensembles transcrits du Scythe original, jusque-là inertes dans les
données, sont désormais **la monnaie de la campagne** :

- **Plateaux joueur** : `MATS_ORIGINAL` (7 plateaux, ids 101-107) — rejoignent la
  liste de sélection (badge 🎖). ⚠ Dans le jeu de base, le départ pauvre
  (Industrie 2♥/4$) était compensé par l'ordre du tour — mécanique absente ici,
  à surveiller en playtest.
- **Plans d'usine** : `PLANS_ORIGINAL` (12 cartes) — mélangés au deck Ford dans
  l'offre de la Rouge River.
- **Missions secrètes** : `OBJECTIVES_ORIGINAL` (21 cartes) — mélangées au deck
  standard.
- **Étoile de la quête Tesla** : prendre un prototype Tesla (2 fragments
  consommés) pose une étoile — pour le joueur comme pour les bots.

Le contenu débloqué est actif dans toutes les missions suivantes **et en partie
libre**, où une bascule « Contenu de campagne : ACTIVÉ / désactivé » permet de
retrouver le jeu de base. Réinitialiser la progression se fait en deux clics
depuis l'écran de campagne.

## Mécaniques réservées, désormais consommées par la campagne

### 🤖 Mechas de l'Empire
Les patrouilles restent désactivées par défaut en partie libre (le toggle
« (campagne) » de l'écran de setup les rallume) et sont **imposées** par les
missions 3, 4 et 5. Code : `src/data/empire.js` (`EMPIRE_START`, `EMPIRE_DECK`,
`EMPIRE_RAILS`), PvE dans `App.jsx` / `bot.js`, rendu `EmpireMecha`.
`EMPIRE_RAILS` n'est reposé que par les missions dont le setup porte
`empireRails: true`.

### 🏦 Jetons dollars / tuile de pose
La tuile « bonus de pose » est tirée dans toutes les parties depuis v0.16 ; la
mission 2 en **impose** une (`avant_postes`) et fait du magot le critère de
réussite. Code : `src/data/structureBonus.js`, surlignage `isBonusTile` dans
`App.jsx`.

## Pistes non implémentées

- **Missions à conditions de défaite** : aujourd'hui une mission ne peut être que
  réussie ou ratée à la fin ; pas d'échec immédiat (« perdre son héros »,
  « l'Empire atteint votre base »).
- **Mode API / simulateur** : `scripts/apiServer.mjs` et `headlessGame.js`
  ignorent la campagne (`this.empire = {}`) — jouer une mission à l'aveugle
  demanderait de porter la configuration de mission dans le moteur headless.
- **Missions scénarisées sur carte dédiée** : les 5 missions se jouent sur la
  carte v3 ; une carte de mission (départ imposé, hexes spéciaux) reste à faire.
- **Escorte / défense** : les idées « escorter un convoi », « défendre une
  région » demandent des objectifs suivis en cours de partie, pas seulement à la
  fin.
- **Bots conscients de la mission** : les adversaires jouent leur partie normale,
  sans savoir que le joueur poursuit un objectif particulier.
