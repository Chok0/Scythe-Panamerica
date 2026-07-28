# Mode campagne — idées réservées

Mécaniques retirées du jeu de base mais dont le code est conservé pour de
futures missions de campagne.

## 🎁 Contenu du jeu ORIGINAL en réserve (déblocages de campagne)

Trois ensembles transcrits du Scythe de base vivent dans les données mais ne
sont PAS mélangés aux parties standards — récompenses de campagne prévues :

- **Cartes d'usine** : `PLANS_ORIGINAL` (12 cartes, `src/data/plans.js`) —
  les 12 actions top du deck usine original.
- **Objectifs secrets** : `OBJECTIVES_ORIGINAL` (21 missions,
  `src/data/objectives.js`) — nécessite le compteur `scaredWorkers` (déjà
  suivi) et le contexte joueurs (`check(p, {players})`, déjà branché).
- **Plateaux joueur** : `MATS_ORIGINAL` (7 plateaux ids 101-107,
  `src/data/mats.js`) — Industrie, Ingénierie, Patriotisme, Mécanique,
  Agriculture, Innovation, Militant. Tous les lookups passent par
  `matById()` : assigner un id 10x à un joueur de campagne suffit.
  ⚠ Dans le jeu de base, le départ pauvre (Industrie 2♥/4$) était compensé
  par l'ordre du tour — mécanique absente ici, à équilibrer en mission.
- **Étoile « quête Tesla »** : piste retenue — un scénario dédié pourra
  récompenser la prise d'un prototype Tesla (2 fragments consommés).

## 🏦 Mission « Ruée vers l'or » — jetons dollars

Ancienne mécanique du « bonus de construction » : une tuile bonus était tirée
au début de chaque partie et des jetons **$** apparaissaient sur les hexes
qualifiés ; chaque bâtiment posé dessus rapportait des pièces en fin de partie.

- Retirée du jeu de base (les jetons $ encombrent la carte en permanence).
- Code conservé : `src/data/structureBonus.js` (tuiles, `pickStructureBonus`,
  `structureBonusDetail`), rendu des tuiles marquées `$` dans `App.jsx`
  (`isBonusTile`), affichages conditionnés à `structureBonus != null`.
- Idée de mission : une carte parsemée de filons ($) déclenche une course —
  premier arrivé, premier servi ; scoring spécial autour de l'or amassé.

## 🤖 Mechas de l'Empire

Les patrouilles de l'Empire (PvE) sont désactivées par défaut — le toggle
reste disponible sur l'écran de setup, marqué « (campagne) ».

- Code conservé : `src/data/empire.js` (`EMPIRE_START`, `EMPIRE_DECK`,
  `EMPIRE_RAILS`), déplacements/combats PvE dans `App.jsx` et `bot.js`,
  rendu `EmpireMecha` dans `MapComponents.jsx`.
- `EMPIRE_RAILS` : les rails initiaux de l'Empire ont aussi été retirés de la
  carte de base — à réutiliser dans les missions où l'Empire est présent.
- Idée de mission : défendre une région contre les patrouilles, escorter un
  convoi à travers les lignes de l'Empire, détruire les six mechas E1–E6.
