# Analyse — partie de campagne du 9 août 2026 (chapitre 2)

Journal exporté : `scythejournal20260809124710.json`. Chapitre 2 « Le Régicide »
(Internationale Noire), carte v3, 3 joueurs, difficulté normale — **18 entrées
au journal, 2 notes**, et une fin de chapitre annoncée au premier tour.

Cette partie n'a pas été jouée : elle a été **écrasée par la précédente**. Les
deux notes du joueur pointent l'une un défaut d'affichage, l'autre la cause
racine — et le journal expose une troisième conséquence que personne n'avait
signalée : le chapitre a été déclaré **remporté avec la mauvaise faction**.

---

## 1. Ce que le journal raconte

Les étapes 581 à 591 sont un lancement de chapitre normal : Internationale
Noire (Le Réseau, ⚡2 🃏1 ♥4 💰3) contre **Frente Libre** et **Acadiane**,
condition canon « Atteindre l'Empereur », Tesla verrouillé, patrouilles
impériales actives. Puis :

| Étape | Entrée | Lecture |
|---|---|---|
| 592 | 📝 « les personnages sont des points rouges ? devrait être noire » | Note 1 |
| 593 | ↶ Coup annulé | **Le basculement** |
| 594 | 📝 « j'ai voulu reverse et je me retrouve sur le dernier tour de la partie précédente » | Note 2 |
| 595 | 👆 5 unités sur #40 | État de l'autre partie |
| 596 | 🚶 **Aiyana** → #29 | Le héros des **Nations Souveraines** — une faction qui n'est pas au chapitre 2, et l'Internationale n'a **aucun héros** |
| 597 | 🚶 nations_m1 → #22 👷×3 | Un mecha Nations dépose 3 ouvriers sur l'Usine |
| 598 | 🏛🏆 Atteindre l'Empereur accompli — **chapitre 2 remporté par la voie canon** | Validé sur le joueur d'une autre partie |

Le classement exporté confirme la substitution : il liste **Acadiane, Dominion,
Nations Souveraines** — pas un seul des trois joueurs annoncés à l'étape 589.
Et le compteur d'étapes démarre à **581** au tour 1 : le journal de la partie
précédente n'avait pas rendu sa numérotation.

---

## 2. Verdict sur les deux notes

| # | Note | Verdict |
|---|---|---|
| 1 | « les personnages sont des points rouges, devrait être noire » | **Confirmé.** `FACTIONS.internationale.color` valait `#9E3B4E` — un bordeaux, à une nuance du Dominion (`#CC2222`). §3. |
| 2 | « j'ai voulu reverse et je me retrouve sur le dernier tour de la partie précédente » | **Confirmé, et c'est le bug grave de la partie.** Les piles d'annulation ne mouraient nulle part. §4. |

Et une **troisième** conséquence, non signalée : la condition canon s'est
validée sur un joueur d'une autre faction. §5.

---

## 3. Note 1 — une faction « Noire » peinte en rouge

`#9E3B4E` sur des pions dessinés à même un disque quasi noir : le résultat est
un point rouge sombre, que rien ne distingue du rouge impérial du Dominion à
la lecture rapide. Deux causes se cumulent :

- **La couleur.** Le drapeau de l'Internationale est noir à faux blanche
  (`lore_1920_plus.md` §II) ; sa couleur ne l'était pas.
- **L'absence d'emblème.** L'Internationale n'a **ni blason, ni illustration,
  ni icône de carte** (`assets/factions/index.js`, `svg/FactionIcons.jsx` :
  aucune entrée). Ses ouvriers tombent donc sur le rendu de secours de
  `UnitToken` — le cercle plein. « Des points », littéralement.

**Correctif.** La faction porte désormais deux couleurs : `color` est l'encre
du drapeau (`#131218`, le noir qu'on peint sur la carte) et `uiColor` l'os de
son emblème (`#D8CFB8`). Sur le plateau, `tokenRim()` mesure la luminance de
l'encre et bascule le **liseré et les glyphes** sur l'os dès qu'elle est trop
sombre pour un fond noir : corps noir, trait blanc cassé. Dans l'interface,
`uiInk()` sert la couleur lisible partout où l'encre servait de texte, de
bordure ou de halo. Les six autres factions, assez claires, ne changent pas
d'un pixel — le test de luminance ne les concerne pas.

**Reste ouvert :** le blason, l'illustration de faction et les icônes de pion
de l'Internationale n'existent toujours pas. Le pion est un disque noir cerclé
d'os — correct et lisible, mais ce n'est pas encore une faux brisée.

---

## 4. Note 2 — la pile d'annulation survivait à la partie

`startGame()` remettait à zéro le plateau, les joueurs, l'Empire, les rails,
l'offre d'usine, la tuile bonus… **mais pas `undoStack` / `redoStack`.** Les
deux boutons de retour au menu (fin de partie, nouvelle partie) n'y touchaient
pas davantage. Une pile remplie pendant la partie précédente restait donc
armée, et `restoreGame()` ne demande rien à personne : il réinstalle
`players`, `empire`, `rails`, `encounterTokens`, l'offre d'usine — l'intégralité
de l'autre partie.

D'où la séquence du journal : un clic sur ↶ au tour 1 du chapitre 2, et le
plateau redevient celui de la partie de Nations Souveraines terminée juste
avant, avec ses trois joueurs, ses unités et ses compteurs.

**Correctif.** `startGame()` fait table rase : piles d'annulation, snapshot
d'avant-action, sélection en cours, files de combats et de rencontres, journal
**et son compteur d'étapes** (une partie neuve repart de l'étape 1 au lieu de
poursuivre la numérotation de la précédente — c'est le « 581 » du journal).
`resumeSaved()` vide les mêmes piles : reprendre une sauvegarde, c'est changer
de partie.

---

## 5. La conséquence non signalée — un chapitre gagné par la mauvaise faction

Une fois l'état substitué, l'étape 597 dépose 3 ouvriers sur l'hex 22 et
l'étape 598 déclare le chapitre 2 remporté. La condition « Atteindre
l'Empereur » demande 3 ouvriers sur l'Usine **et** 2 patrouilles impériales
détruites : le second membre était déjà rempli par le `empireKills` hérité de
l'autre partie. Le chapitre a été inscrit comme terminé « voie canon » dans la
progression de campagne — avec un joueur **Nations Souveraines**.

`canonMet()` ne vérifiait que la condition, jamais l'identité du joueur. Or
une condition canon décrit ce que fait **la faction du chapitre** : « 3
ouvriers de l'Internationale sur l'Usine », pas « trois ouvriers quelconques ».

**Correctif.** `canonMet()` refuse tout joueur dont la faction n'est pas celle
du chapitre. La cause racine est traitée au §4 ; ce contrôle est le filet —
aucun état étranger au chapitre ne peut plus le valider. Deux tests le
couvrent (`campaign.test.js`), dont un qui parcourt les huit chapitres.

**À faire côté joueur :** la progression sauvegardée porte encore le chapitre 2
marqué remporté à tort. Le rejouer l'écrasera (`completeChapter` réécrit
l'entrée), ou « Réinitialiser » sur l'écran de campagne repart de zéro.

---

## 6. Ce que la partie ne dit pas

Aucune information de jeu exploitable : le chapitre 2 n'a jamais été joué,
l'Internationale n'a pas effectué un seul déplacement, et le classement porte
sur une autre partie. La faction reste **non mesurée en conditions réelles** —
c'est encore le point 7 des arbitrages de `internationale_noire.md`.
