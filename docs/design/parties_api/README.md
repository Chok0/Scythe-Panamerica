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

## Lot 2 (29/07/2026) — contrer la stratégie gagnante du Frente Libre

Le lot 1 avait identifié un pattern net : **le Frente Libre gagne 3 parties
sur 4** par thésaurisation de paires de ressources converties en score au
palier de popularité ×3 en fin de partie (jusqu'à 36 pts en un seul pillage
tardif). Deux parties parallèles, `factionsBots` forçant le Frente Libre
comme adversaire, testent chacune un contre différent.

| Partie | Contre testé | Bots | Tours | Classement final |
|---|---|---|---|---|
| Dominion, seed 4611 | Harcèlement direct du stock Frente | Frente/Nations/Bayou | 37 | Bayou 103 · **Frente 87 (7 paires)** · Dominion 68 · Nations 66 |
| Nations, seed 4612 | Sprint tempo (finir avant le snowball) | Frente/Acadiane/Dominion/Bayou (4 bots) | 37 | Acadiane 69 · Dominion 63 · Bayou 54 · **Frente 52 (2 paires)** · Nations 49 |

**Dans les deux parties, le Frente Libre ne gagne plus**, et son butin final
(7 et 2 paires) tombe très en dessous des ~15-26 paires observées lot 1. Mais
dans aucun des deux cas ce n'est le contre visé qui l'a directement battu :

- **Harcèlement (Dominion)** : géographiquement impossible en ouverture (coins
  opposés de la carte) ; la frappe directe tentée au T28 a été perdue de
  justesse (5v6) et a même offert une étoile de combat au Frente. C'est en
  réalité **Bayou** qui a pillé le Frente au tour 37 (13→8 nourriture), combiné
  à une fin de partie précoce et soudaine, qui a coupé court à la conversion.
- **Sprint tempo (Nations)** : la pression collective des 4 bots (personne
  n'a laissé de fenêtre de fin de partie tranquille) a suffi à empêcher le
  snowball, sans qu'aucune action de la joueuse ne cible directement le
  Frente. Mais le sprint aux étoiles bon marché sans expansion territoriale
  s'est retourné contre elle : **dernière au score (49 pts) malgré 4 étoiles**,
  battue par Acadiane qui n'en avait que 3 mais tenait 6 territoires.

**Verdict provisoire** : la thésaurisation du Frente Libre est une stratégie
à variance élevée plutôt qu'un problème d'équilibrage isolé à corriger seul —
elle est vulnérable (a) à toute fin de partie précoce déclenchée par un tiers
et (b) à un manque d'escorte militaire qui expose le stock au pillage, y
compris par un bot autre que celui qui la cible. Piste de réglage : inciter
les bots « thésauriseurs » à défendre proportionnellement leurs stocks
(mecha en escorte) plutôt que de plafonner les paires. Piste symétrique côté
score : **un rush d'étoiles bon marché sans territoire est une impasse** —
territoire × B pèse au moins autant que étoiles × A dans ce mode de score, ce
qui contredit la lecture « les étoiles sont la voie royale » que les fiches
de faction peuvent suggérer.

### Constats techniques relevés (à instruire, lot 2)

1. **Bug confirmé par lecture de code** : `bottom_enlist` sans
   `{section,recruit}` lève une exception (`Cannot read properties of
   undefined (reading 'apply')`, `headlessGame.js` ~L851) mais **après** avoir
   déjà débité les ressources et incrémenté `p.recruits` (~L848-850) — état
   incohérent (ressources perdues, compteur avancé, `enlistMap` vide). Corriger
   en validant `section`/`recruit` avant tout effet de bord.
2. **Mécanique non documentée** : jouer `produce` sur un hex village où l'on a
   déjà des ouvriers double leur nombre sur place (1→2→4→7→8) au lieu de la
   production normale — permet l'étoile "8 ouvriers" en 3 tours sans la
   moindre expansion territoriale. Trouvé en lisant `headlessGame.js`
   (`produce()`, branche `hex.t === 'village'`), absent du résumé du pilote.
   À documenter dans le résumé, ou à rééquilibrer (coût croissant/plafond par
   hex) si ce n'est pas la mécanique voulue.
3. Fin de partie en cascade (plusieurs étoiles déclenchées dans le même
   `end_turn` d'un bot, ou combo de carte d'Usine) sans aucun signal
   d'anticipation côté résumé — un joueur peut se retrouver à une action de
   sa propre 6e étoile quand la partie se termine sous lui.
4. Frictions déjà connues confirmées : décalage d'affichage `✗`/`✓` sur les
   missions révélées mais acquises ; nommage de champs d'action peu intuitif
   (`trade.buy[].res` en toutes lettres, `encounter.option` et non `opt`).
