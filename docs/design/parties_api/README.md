# Quatre parties jouées en mode API — 29/07/2026

Premier lot de parties jouées par des agents Claude via le mode API headless
(`scripts/apiServer.mjs`), moitié avec le skill `jouer-scythe`, moitié sans.
Journaux complets + comptes rendus des joueurs, matière première pour
l'amélioration des bots.

## Résultats

| Partie | Skill | Tours | Classement final | Siège API |
|---|---|---|---|---|
| Confédération / Terroir, seed 11 | avec | 32 | Frente 103 · Nations 82 · **Confédération 68** · Bayou 52 | 3e |
| Confédération / Terroir, seed 11 | sans | 27 | **Confédération 113** · Nations 74 · Frente 44 · Bayou 18 | 1er |
| Bayou / Atelier, seed 23 (blind) | avec | 31 | Frente 84 · **Bayou 72** · Nations 70 · Acadiane 64 | 2e |
| Bayou / Atelier, seed 23 (blind) | sans | 36 | Frente 112 · Acadiane 92 · **Bayou 67** · Nations 47 | 3e |

Même seed, même faction, même plateau : les deux parties d'une ligne à l'autre
divergent entièrement dès que le joueur joue différemment — le moteur est
déterministe, pas le joueur.

## Ce que ces parties disent des bots

- **Le Frente Libre gagne 3 parties sur 4** (103, 84, 112 pts), toujours par
  accumulation de ressources : 15 ressources pillées = 36 pts de paires au
  palier ×3 dans la partie Confédération/avec-skill. Les deux joueurs ont
  indépendamment pointé le **plafond de scoring des ressources** comme la
  piste d'équilibrage n°1.
- **Les bots menacent désormais pour de bon** quand le joueur s'expose :
  4 attaques subies dans la partie Confédération/avec-skill, dont la perte de
  l'Usine sur un assaut héros+mecha. Confirme les correctifs v0.16.
- **Angle mort persistant : l'Usine.** Aucun héros bot n'y est allé dans les
  quatre parties. Les cartes d'usine (5e colonne) restent une exclusivité de
  fait du joueur humain/agent.
- **Le Bayou reste le dernier de la classe** (52 et 18 pts comme bot) : son
  objectif « Le Prédateur » demande des combats qu'il ne cherche pas.

## Constats techniques relevés par les joueurs (à instruire)

Ces points viennent des comptes rendus ; ils ne sont **pas encore vérifiés
dans le code** — chacun mérite un test avant correction ou requalification.

1. `factory_top` encaisse le coût puis ignore silencieusement un paramètre
   invalide (1 pop perdue, aucune erreur). Devrait valider avant de payer,
   comme le fait `move_unit`.
2. Flibuste (Bayou, slot 2) n'aurait déclenché ni les 2$ ni la capture sur
   deux victoires avec le slot débloqué.
3. Servitude (`capture:true`, Confédération) : l'ouvrier délogé après victoire
   serait renvoyé à la base au lieu d'être capturé — l'objectif « Le Joug »
   en dépend.
4. Transport implicite : `move_unit` embarque par défaut ouvriers ET
   ressources de l'hex. Comportement voulu mais piégeux ; à signaler dans
   l'état ou à passer en opt-in.
5. Les rencontres ignoreraient le choix de type de ressource (noms non
   validés).
6. Améliorer un coût du bas ferait tomber le bonus ↑$ de la même colonne.
7. Les jetons de rencontre resteraient affichés après passage d'un héros bot.

## Le skill `jouer-scythe` a-t-il aidé ?

**Pas de signal mesurable sur ce lot.** Les cinq assertions passent dans les
quatre parties, y compris sans skill : `docs/reference/mode_api.md` porte déjà
le protocole et les conventions de journal, donc le socle était acquis. Côté
résultat, le skill fait 3e et 2e ; le baseline fait 1er et 3e. Côté coût, la
seule paire mesurée est à égalité (220k tokens avec, 215k sans).

Deux parties par bras, avec des scores allant de 67 à 113, c'est très en
dessous du bruit : ce lot ne permet pas de conclure. Ce qu'il montre en
revanche, c'est que **le mode API seul suffit à faire jouer un agent
correctement** — la valeur ajoutée du skill devra se prouver sur la qualité
stratégique (paliers de popularité, course à l'Usine, gestion de la
puissance), pas sur la capacité à jouer tout court.
