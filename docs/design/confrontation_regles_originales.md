# Confrontation — règles du Scythe original vs notre système

Source : `docs/reference/Stonemaier Games rules Scythe jeu original.txt`
(traduction française officielle). Audit demandé le 4 août à propos du
transport de ressources ; élargi aux règles voisines du déplacement, du
contrôle et des ressources, qui forment un même bloc.

Trois colonnes : ce que dit la règle, ce que fait notre code, le verdict.
Les **écarts** sont numérotés E1…En et repris en §3.

---

## 1. Action Déplacement

| Règle originale | Notre système | Verdict |
|---|---|---|
| « Déplacez jusqu'à 2 unités **distinctes** […] d'un territoire vers un territoire adjacent. Vous ne pouvez pas déplacer la même unité plusieurs fois lors d'une même action (sauf bonus). » | `movedUnits` interdit de rejouer une unité ; la Vitesse et le bas de carte d'usine sont les « bonus » qui allongent le déplacement d'UNE unité. | ✅ conforme |
| « **RESSOURCES ET UNITÉS** : les unités peuvent **prendre et déposer** autant de pions Ressource que voulu lors d'une action Déplacement. » | `transportUnits` ne prenait QUE la pile de l'hex de départ ; le panneau de route ne proposait QUE la dépose, et seulement pour un mech chargé. | **E1 — corrigé le 04/08** |
| « Les mechs peuvent transporter autant de pions Ressource et **ouvriers** que voulu (mais pas votre personnage). » | Mech : ouvriers + ressources, jamais le héros. Héros et ouvriers : ressources seulement. | ✅ conforme |
| « Avoir un mech qui transporte des ouvriers **ne compte pas comme un déplacement pour les ouvriers**. » | Le transport ne touche pas `movedUnits` : un ouvrier débarqué peut encore bouger de lui-même. | ✅ conforme |
| « Vous pouvez utiliser une partie de votre action pour déplacer un ouvrier sur un territoire contenant un mech, puis déplacer le mech transportant cet ouvrier. » | Chaque unité est déplacée séparément ; l'ordre est libre. | ✅ conforme |
| « Par défaut, les unités ne peuvent pas traverser les rivières ou se déplacer sur les lacs. » | `hasR` bloque les rivières hors riverwalk ; les lacs exigent le Batelier (Acadiane). La Nage (Internationale Noire) est notre équivalent du Seaworthy nordique. | ✅ conforme |
| « Si votre personnage et/ou mech pénètre sur un territoire contrôlé par des **ouvriers adverses** (et aucune autre unité), leur déplacement s'achève […] chaque ouvrier bat en retraite sur sa base, **laissant sur place les éventuelles ressources**. Vous perdez 1 Popularité par ouvrier chassé. » | Déplacement des ouvriers + perte de popularité ✔ ; les ressources restent sur l'hex ✔ ; l'arrêt du déplacement est assuré par `blockedHexes` (un hex ennemi ne réalimente pas la frontière) ✔. | ✅ conforme |
| « Vos ouvriers ne peuvent pas se déplacer d'eux-mêmes sur des territoires contrôlés par des ouvriers adverses / par un personnage ou des mechs adverses. » | `validMoves` filtre `enemyOccupiedHexes` pour `unitType === "worker"`. | ✅ conforme |
| « N'importe quelle unité peut pénétrer dans un territoire seulement contrôlé par un **bâtiment**. Le joueur contrôlant l'unité contrôle désormais le territoire. » | Les bâtiments ne bloquent rien (ils ne sont pas dans `enemyOccupiedHexes`) et `heldHexes` retire le contrôle au propriétaire du bâtiment dès qu'une unité adverse est là. | ✅ conforme |
| « Si votre personnage et/ou mech pénètre dans un territoire contrôlé par un personnage/mech adverse, le déplacement s'achève. […] Une fois **toutes** vos actions Déplacement effectuées, si vous partagez un territoire avec l'adversaire, un combat a lieu. » | Le combat se déclenche **immédiatement** à l'entrée, pas à la fin de l'action. | **E2 — écart assumé** |
| « Vous ne pouvez pas utiliser l'action Déplacement pour déplacer des unités sur une base principale (même la vôtre). » | Les hex de base sont exclus des destinations (correctif du 01/08). | ✅ conforme |
| « **RENCONTRES** : si vous déplacez votre personnage sur un territoire où se trouve un jeton Rencontre, **son déplacement s'achève** […] après avoir résolu tous les combats du tour, si le personnage s'y trouve toujours, résolvez la rencontre. » | La rencontre se résout **tout de suite** à l'arrivée, et n'interrompt pas formellement le déplacement. | **E3 — écart assumé** |
| « **TUNNELS** : tous les territoires à icône tunnel sont considérés adjacents. » | Remplacés par le **réseau de rails**, construit en jeu (Gare) au lieu d'être imprimé sur la carte. | ⚙ substitution Panamerica, documentée |
| « Il n'y a pas de limitation au nombre d'unités d'une même faction sur un même territoire. » | Aucune limite. | ✅ conforme |

## 2. Contrôle et ressources

| Règle originale | Notre système | Verdict |
|---|---|---|
| « Vous contrôlez un territoire si au moins une de vos unités y est présente **OU** si un de vos bâtiments s'y trouve seul sans aucun personnage, ouvrier ou mech adverse. Le contrôle ne revient qu'à un seul joueur. » | `heldHexes(p, ctx)` — unités, plus bâtiments et pièges armés non contestés (correctif du 03/08). Extension maison : les patrouilles impériales contestent aussi, l'Empire n'existant pas dans le jeu original. | ✅ conforme (+ extension assumée) |
| « **Vous ne pouvez dépenser que les ressources présentes sur les territoires que vous contrôlez.** » | `countRes`/`spendRes` comptent et dépensent sur **tous** les hex où le joueur a des ressources, contrôlés ou non. | **E4 — écart réel, non corrigé** |
| « Vous pouvez dépenser des ressources de n'importe quel territoire que vous contrôlez pour une action ayant lieu sur n'importe quel territoire. » | Aucune contrainte de proximité. | ✅ conforme |
| « Pour le décompte des territoires, vous contrôlez un territoire **et toutes les ressources présentes dessus** si vous y avez une unité, ou un bâtiment sans unité adverse. » | Le score ne compte que les ressources sur les hex tenus (même fonction `heldHexes`). | ✅ conforme |
| « Ne décomptez que chaque **paire** de pions Ressource. » | `resPairs = floor(total / 2)`. | ✅ conforme |

---

## 3. Les quatre écarts

### E1 — Prendre et déposer librement ✅ corrigé le 04/08

C'était la remarque d'origine, et la règle est explicite. Notre système ne
savait que **charger au départ** et **déposer en chemin** :

- `transportUnits` (logic/transport.js) ne lit que `resources[fromHex]` ;
- le panneau de route ne s'ouvrait que pour un **mech** avec `carryOnMove`
  actif et de la cargaison à bord.

Conséquence en jeu : un mech qui traversait un hex portant deux bois ne
pouvait pas les embarquer au passage — il fallait un déplacement séparé pour
aller les chercher. Or les ressources laissées derrière **ne rapportent rien
au score** (règle du décompte ci-dessus) : la règle manquante était aussi une
fuite de points.

**Correctif** : le panneau devient bidirectionnel (« 🚚 Ravitaillement en
route ») et s'ouvre pour **toute unité** — héros, ouvrier, mech — dès qu'il y
a de quoi charger ou décharger sur le trajet. Chaque hex traversé propose
« 📦 Déposer » et « 🫴 Ramasser ». Le dépôt d'ouvrier reste réservé au mech,
conformément à la règle.

À noter : le **déplacement décomposé** (v0.16) offrait déjà ce ramassage sans
qu'on l'ait cherché — chaque étape rouvre le panneau de transport sur l'hex
courant. L'écart ne concernait donc que les sauts directs de 2 hex.

### E2 — Combat immédiat au lieu de « après tous les déplacements »

Le jeu original résout les combats **à la fin** de l'action Déplacement : on
peut donc amener deux mechs sur le même hex ennemi et livrer **une** bataille
à deux unités. Chez nous, le premier mech qui entre déclenche le combat sur
le champ, et le second ne peut plus le rejoindre.

Conséquence : les assauts groupés sont impossibles, et le plafond de cartes de
combat (1 par unité présente) est mécaniquement plus bas qu'il ne devrait
l'être. C'est un vrai appauvrissement tactique — mais le corriger demande de
mettre les combats en file d'attente jusqu'à la fin de l'action, avec toute
la gestion d'annulation qui va avec. **À arbitrer**, pas anodin.

### E3 — Rencontre résolue à l'arrivée

La règle veut que le jeton arrête le personnage et que la rencontre se résolve
**après les combats du tour**. Chez nous, elle s'ouvre immédiatement et le
déplacement peut se poursuivre. Sans conséquence mesurable en solo contre des
bots ; à revoir si les combats passent en file (E2), les deux règles étant
liées.

### E4 — Dépenser des ressources qu'on ne contrôle plus

`countRes` ratisse tout le tableau `resources` du joueur, sans regarder qui
tient l'hex. Un joueur chassé d'un territoire continue donc de **dépenser** le
bois qu'il y a laissé, alors que ce même bois ne lui rapportera **aucun
point** au décompte final. Le jeu se contredit lui-même d'un bout à l'autre de
la partie.

Correctif possible en une ligne conceptuelle (filtrer `countRes`/`spendRes`
par `heldHexes`), mais il touche **tous** les points de dépense — actions du
bas, cartes d'usine, bots, moteur headless — et durcit sensiblement le jeu :
un raid réussi ne prive plus seulement l'adversaire de points, il gèle aussi
ses ressources. **À arbitrer et à mesurer** avant de le poser.

---

## 4. Ce que l'audit ne couvre pas

Combats, production, enrôlement, améliorations et fin de partie n'ont été
vérifiés que sur les points touchés par le déplacement (plafond de cartes par
unité, contrôle, décompte). Un audit de la même forme reste à faire sur ces
sections — la présente confrontation part du transport, comme demandé.
