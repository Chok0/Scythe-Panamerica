# Analyse — partie de campagne du 1er août 2026 (chapitre 1)

Première partie réelle du **chapitre 1 « Le rail avance »** après le lot
d'implémentation du même jour. Carte v3, 3 joueurs, difficulté normale,
27 tours. Le joueur (Nations, Fordisme) gagne 91-26-22 par la voie des
6 étoiles.

Le journal porte **11 notes** posées en jeu. Chacune a été vérifiée dans le
code ; les deux constats sur les bots ont été **mesurés** en isolant la
position exacte du journal. Verdicts ci-dessous — aucun n'est resté au stade
de l'impression.

---

## 1. Résultat brut

| | Nations (joueur) | Dominion (bot) | Acadiane (bot) |
|---|---|---|---|
| Score | **91** | 26 | 22 |
| Étoiles | 6 | 1 | 2 |
| Territoires | 8 | 3 | 2 |
| Bonus de pose | **0** | **0** | **0** |

Trois signaux dans ce seul tableau : l'écart de 65 points, les 2-3 territoires
des bots (un joueur en tient 5,5 en moyenne), et surtout **la tuile bonus de
pose qui rapporte 0 aux trois joueurs** — voir note 11.

---

## 2. Verdict sur les 11 notes

| # | Tour | Note | Verdict |
|---|---|---|---|
| 1 | 13 | « Le mech m'est passé au dessus, il y aurait dû y avoir combat » | **Conforme aux règles, mais illisible.** La patrouille roulait sur le rail (`🛤 (rail)`). Le rail ne déclenche pas de combat en chemin — même règle que pour le joueur. Mais rien ne le montre : voir note 7. |
| 2 | 14 | Mech Empire arrivé sur un pack Dominion : ni combat ni fuite des ouvriers | **BUG confirmé.** `App.jsx` ne teste que `hasCombatUnit` (héros/mechas). Un hex qui ne porte que des ouvriers ne déclenche rien : ni combat (correct), ni déplacement d'ouvriers (incorrect — la règle Scythe les renvoie à la base). L'Empire est la seule entité qui ignore cette règle. |
| 3 | 14 | La force du mecha Empire est annoncée d'emblée, il faudrait une fourchette | **Confirmé, choix de conception à revoir.** `drawEmpireCombat()` tire la carte et l'UI affiche `card.power` avant l'engagement. Le joueur mise donc à information parfaite face à l'Empire, alors qu'il mise à l'aveugle contre un bot. Asymétrie non voulue. |
| 4 | 14 | Fragment Tesla encore proposé en récompense d'un mecha Empire | **BUG confirmé — trou dans le verrou Tesla du 1er août.** Le verrou couvre le deck de rencontres et la vitrine de l'Usine, mais **pas le panneau de butin PvE** (`claimReward`, option `fragment` codée en dur). C'est une troisième source de fragments qui n'avait pas été recensée. |
| 5 | 14 | Combat résolu contre 1 seul des 2 mechas présents sur l'hex | **BUG confirmé.** `empireOnHex` récupère bien *tous* les mechas de l'hex (`filter`) mais seul `empireOnHex[0][0]` est combattu, avec une seule carte tirée. Deux patrouilles empilées devraient cumuler force et cartes. |
| 6 | 15 | « Thibodeau ne fait rien et reste sur son île » | **BUG confirmé et MESURÉ** — voir §3. **0 déplacement en 27 tours.** |
| 7 | 17 | Animation incohérente : on ne voit pas le mecha passer par les rails | **Confirmé.** Le pion est déplacé d'un hex à l'autre par transition CSS directe, sans tracé du trajet ferroviaire. C'est ce qui rend la note 1 incompréhensible en jeu. |
| 8 | 17 | « J'ai complété les conditions de victoire spéciale mais pas de clôture » | **Pas un bug — mais un défaut d'affichage de MON fait.** Voir §4. |
| 9 | 19 | On ne voit pas la puissance potentielle de l'adversaire dans la modale de combat | **Confirmé.** La modale n'affiche pas la fourchette engageable par l'adversaire (0 à puissance+cartes). L'information existe pourtant ailleurs dans l'UI (barre du haut dépliée). |
| 10 | 20 | Esprit Sauvage : Deploy refusé avec 3 métal + 1 bois | **Conforme au code, ambigu au texte — arbitrage à rendre.** Le code lit « 4 métal **OU** 4 bois », jamais un mélange. Le texte de faction (« Déploie ses mechas avec du bois ou du métal ») autorise les deux lectures. La vôtre (substituer autant de métal qu'on veut) est plus généreuse et plus proche du nom de la capacité. |
| 11 | 22 | « Je ne comprends toujours pas à quoi servent les jetons dollars » | **Confirmé, et le score le prouve.** Ce sont les hex éligibles à la tuile bonus de pose (ici « Ombre de l'Usine » : bâtiment adjacent à la Rouge River). **Les trois joueurs ont fini à 0$ de bonus** — la mécanique n'a été comprise ni par vous ni exploitée par les bots. |

---

## 3. Comportement des bots — mesuré, pas supposé

### 3.1 Acadiane : 0 déplacement en 27 tours

Actions du bot sur la partie entière : `Produire` ×10, `Trade` ×8,
`Bolster` ×7, `Déployer` ×4, `Améliorer` ×2, et **deux fois** le repli
« +1$ (Déplacer, blocage économique) ». Aucune unité déplacée. Le héros n'a
jamais quitté sa base → **0 comptoir posé**, alors que le Comptoir est sa
capacité de faction *et* la matière de son objectif.

Reproduit en isolant sa position du journal (Forge, thésauriseur, héros sur
base, 5 ouvriers sur #6, 4 mechas sur #2) : **0 déplacement sur 400 tours
simulés**. Le score des colonnes explique tout :

| Colonne | Score |
|---|---|
| Produce | **34** |
| Trade | 24 |
| **Move** | **21** |
| Bolster | −3 |

L'écart Produce−Move vaut **13 points et ne descend jamais sous 5**, même en
fin de partie ; le bruit de difficulté « normal » est de ±3. **Move est
mathématiquement hors d'atteinte tant que le bot a une île productive.**

Le `+3` spécifique à l'Acadiane existe déjà dans `scoreColumn` — avec un
commentaire qui décrit *exactement* ce symptôme, constaté au playtest du
28/07 (« M. Thibodeau immobile après le 3e comptoir »). **Le correctif de
l'époque était sous-dimensionné d'un facteur 4** : il n'a jamais pu renverser
un écart de 13.

C'est un plafond de score auto-infligé : 2 territoires × palier 2 = 6 points
sur 22.

### 3.2 Dominion : ne se réarme jamais

Note 12 (T26) : « il se balade tranquille avec 1 de puissance, une proie
facile ». Puissance mesurée : 6 (T12) → 2 (T16) → **1 (T18)**, et il continue
à promener son héros jusqu'au tour 25.

| Puissance | Score Bolster | Meilleure colonne |
|---|---|---|
| ⚡8 | 5 | Produce 31 |
| ⚡5 | 5 | Produce 31 |
| ⚡3 | 9 | Produce 31 |
| ⚡1 | 9 | Trade 24 |

Bolster ne monte que de 5 à 9 quand la puissance s'effondre, contre 24-31 aux
colonnes économiques. **Il n'existe aucun seuil de survie** : un bot à 1⚡ se
comporte comme un bot à 8⚡. Il a d'ailleurs perdu son seul combat PvE 4 contre
10 (T14).

### 3.3 Le point commun

Les deux symptômes ont la même cause : **le score de colonne est purement
offensif — il additionne des gains, sans jamais mesurer un manque.** Rien ne
dit « je n'ai que 2 territoires », « je n'ai jamais bougé », « je vais me
faire écraser au prochain combat ». Un correctif ponctuel par faction (le +3
Acadiane) ne peut pas y répondre ; il faut des termes de **carence**, qui
montent quand une dimension du score est laissée à l'abandon.

---

## 4. Ce qui relève du lot campagne du 1er août

Deux entrées, dont une vraie régression fonctionnelle.

### 4.1 Fragment Tesla en butin PvE (note 4) — trou dans le verrou

Le verrou Tesla filtre le deck de rencontres et la vitrine de l'Usine. Le
**panneau de butin d'une victoire contre l'Empire** propose un troisième
accès au fragment, codé en dur, que je n'avais pas recensé. En chapitre 1 —
justement le chapitre où l'Empire est actif — c'est la source la plus
accessible des trois. Le verrou est donc contournable dès la première partie
de la campagne.

Correctif : filtrer l'option `fragment` de `claimReward` et de son panneau
quand le cran n'est pas atteint, exactement comme les deux autres sources.

### 4.2 Condition canon « complétée » mais pas déclenchée (note 8)

**Le moteur avait raison, l'affichage vous a trompé.** Reconstitution au
tour 17 :

- « 2 patrouilles impériales détruites » : **fait** (T14, deux victoires).
- « 4+ hex Plaine/Forêt contrôlés » : **2 sur 4**. Vos unités tenaient #10
  (forêt) et #34 (forêt) ; #31 est une montagne, #38 et #41 des champs, #15
  une montagne.

La condition n'était donc pas remplie, et la partie a correctement continué.
Mais le bandeau que j'ai posé affiche la condition comme **une seule phrase
d'un seul bloc**, verte ou grise, sans progression par membre. Vous aviez
accompli la moitié mémorable (les patrouilles) et rien ne signalait que
l'autre moitié était à 2/4.

C'est un défaut de conception de mon bandeau, pas du joueur : **une condition
composée doit afficher l'état de chacun de ses membres** (« Plaine/Forêt 2/4 ·
Patrouilles 2/2 »).

---

## 5. Plan proposé, par priorité

**Priorité 1 — corrections du lot campagne (mon périmètre)**
1. Fermer le verrou Tesla sur le butin PvE (§4.1).
2. Bandeau de condition canon avec progression par membre (§4.2).

**Priorité 2 — règles de l'Empire (bugs francs, indépendants de la campagne)**
3. Déplacement des ouvriers par une patrouille (note 2).
4. Cumul des patrouilles empilées sur un même hex (note 5).
5. Force de l'Empire en fourchette plutôt qu'en clair (note 3).

**Priorité 3 — bots (le chantier de fond)**
6. Termes de **carence** dans `scoreColumn` : territoires tenus, tours sans
   déplacement, puissance sous un seuil de survie. À mesurer en simulation
   avant/après (`npm run sim`, `scripts/botBehavior.mjs`) — le `+3` Acadiane
   montre qu'un correctif non mesuré ne suffit pas.

**Priorité 4 — lisibilité**
7. Fourchette de puissance adverse dans la modale de combat (note 9).
8. Tracé du trajet ferroviaire à l'animation (notes 1 et 7).
9. Légende des jetons $ de la tuile bonus de pose (note 11).

**À arbitrer par le concepteur**
10. Esprit Sauvage : substitution partielle métal/bois, ou choix exclusif ?
    (note 10 — le texte de faction devra suivre la décision.)

---

*Méthode : notes vérifiées une par une dans le code ; comportement des bots
reproduit hors jeu en rejouant la position exacte du journal (400 tirages) et
en instrumentant `scoreColumn`. Aucune conclusion de ce document ne repose sur
une lecture du journal seule.*
