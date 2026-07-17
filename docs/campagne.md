# Mode campagne — idées réservées

Mécaniques retirées du jeu de base mais dont le code est conservé pour de
futures missions de campagne.

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
