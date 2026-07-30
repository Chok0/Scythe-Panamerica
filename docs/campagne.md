# Mode campagne

But de la campagne : explorer les mécaniques spécifiques à Panamerica à
travers des défis pour parties spéciales (l'équivalent des variantes du jeu
original), et surtout **dérouler une histoire** — tour à tour, on incarne
chacune des factions pour découvrir son lore propre et le lore global de
l'Empire Panaméricain (sa naissance après la guerre de Sécession, la
trahison de Tesla par Ford, le régicide, le trône devenu pantin). Voir
`docs/design/lore_1920_plus.md` §III et §IV pour le worldbuilding complet —
ce document se concentre sur la mécanique et la structure de la campagne.

## 🎁 Contenu du jeu ORIGINAL en réserve (déblocages de campagne)

Deux ensembles transcrits du Scythe de base vivent dans les données mais ne
sont PAS mélangés aux parties standards — récompenses de campagne prévues :

- **Cartes d'usine** : `PLANS_ORIGINAL` (12 cartes, `src/data/plans.js`) —
  les 12 actions top du deck usine original.
- **Objectifs secrets** : `OBJECTIVES_ORIGINAL` (21 missions,
  `src/data/objectives.js`) — nécessite le compteur `scaredWorkers` (déjà
  suivi) et le contexte joueurs (`check(p, {players})`, déjà branché).

**Plateaux joueur** : `MATS_ORIGINAL` (7 plateaux ids 101-107, `src/data/mats.js`)
— Industrie, Ingénierie, Patriotisme, Mécanique, Agriculture, Innovation,
Militant. Tous les lookups passent par `matById()` : assigner un id 10x à un
joueur de campagne suffit. ⚠ Dans le jeu de base, le départ pauvre (Industrie
2♥/4$) était compensé par l'ordre du tour — mécanique absente ici, à
équilibrer en mission. **Traité comme variante avancée optionnelle** dans la
décomposition ci-dessous (pas dans le parcours principal) tant que ce
rééquilibrage n'a pas été fait.

## 🏦 Rouge River — Acier Brut (variante de campagne)

Ancienne mécanique décrite dans le lore (`lore_1920_plus.md` §III.5) : à
chaque tour, Rouge River génère automatiquement 1 ressource Acier Brut,
récupérée par le joueur qui la contrôle ; si personne ne la contrôle, l'Acier
s'accumule — récompense croissante pour le premier arrivé.

- Retirée du jeu de base standard (elle favorise trop mécaniquement le
  contrôle précoce du centre sans y ajouter de tension nouvelle en partie
  libre).
- **Confirmée comme UNE variante de campagne à part entière** — pas un
  toggle générique, un scénario dédié où le contrôle de l'arsenal impérial
  est l'enjeu central de la partie (chapitre Dominion, voir plus bas).
- Implémentation à faire : un flag de partie type `empireRouilleSteel: true`
  qui active la génération passive sur la case Rouge River (hex marqué
  `factory` dans `hexes.js`) et son ramassage automatique par le contrôleur.

## ⚙ Catalogue Ford — déclinaisons de Plans à concevoir

Deux idées de nouveaux Plans Spéciaux (deck Rouge River), dans l'esprit des
cartes Factory de Scythe :

- **Bâtiment « moulin à pétrole »** — équivalent du Moulin de Scythe mais
  produit 1 pétrole supplémentaire à chaque Produce au lieu de bois/métal.
  Nom de travail : la **Raffinerie Rouge River**.
- **Bonus d'enrôlement / espionnage industriel** — s'active quand un
  **autre** joueur utilise son propre Plan d'usine : le possesseur reçoit 1
  ressource au choix. Nom de travail : **Réseau de Rouge River** — Ford
  revend en douce ce qu'il voit passer chez les autres.

Ces deux cartes rejoignent les **Plans Ford** existants (Model M, Trimotor,
River Rouge Special, Iron Horse) dans le Catalogue standard — ce ne sont pas
des récompenses de campagne, juste des extensions du deck de base à
concevoir/équilibrer.

## 🔧 Les legs de Wardenclyffe — corrigé (ce ne sont pas des cartes d'usine)

Erreur de classification corrigée : le Golem, la Tour Wardenclyffe et
l'Éclair ne sont **pas** des Plans à piocher au Catalogue Ford — ce sont des
**objets hors catalogue**, débloqués par les scénarios de campagne, cachés
dans le sous-sol scellé que Ford n'a jamais réussi à ouvrir en entier :

- **Le Golem** — **mecha bonus** : un mecha supplémentaire (pas un Plan),
  alimenté sans fil (aucune ressource Énergie), déplaçable à distance depuis
  n'importe quelle case où se trouve le héros. 1 sur un dé à chaque combat :
  il s'arrête (systèmes instables sans leur créateur).
- **La Tour Wardenclyffe** — **bâtiment bonus** : structure fixe qui
  alimente en énergie sans fil tous les mechas du joueur dans un rayon de 3
  cases (+1 mouvement, +1 puissance).
- **L'Éclair** — **mecha bonus** léger, 4 cases de mouvement (le double de
  la norme), pensé pour la reconnaissance et le vol de ressources.

**Le « Fantôme de Wardenclyffe » (ancien plan de mecha coopératif
inter-factions) est retiré** — trop de conditions externes pour un seul objet
permanent. L'idée de coopération inter-factions reste bonne mais migre vers
un scénario de campagne dédié plutôt qu'un item du jeu (piste ouverte, pas
encore assignée à un chapitre).

## 🤖 Mechas de l'Empire

Les patrouilles de l'Empire (PvE) sont désactivées par défaut — le toggle
reste disponible sur l'écran de setup, marqué « (campagne) ».

- Code conservé : `src/data/empire.js` (`EMPIRE_START`, `EMPIRE_DECK`,
  `EMPIRE_RAILS`), déplacements/combats PvE dans `App.jsx` et `bot.js`,
  rendu `EmpireMecha` dans `MapComponents.jsx`.
- **Sens narratif clarifié** : ces mechas ne sont pas une faction tierce
  générique — ce sont les **derniers vestiges de l'armée impériale**, sortis
  de Rouge River sous Cyrus II puis laissés sans commandement clair après le
  régicide de 1915, avant même l'intronisation du pantin Cyrus III. Leurs
  noms (Écho Rouillé, Sentinelle Aveugle,
  Patrouilleur Usé...) décrivent déjà des machines à l'abandon — c'est
  cohérent avec le texte des règles du jeu de base (« l'Empire mécanique
  s'est effondré, laissant derrière lui des colosses rouillés »).
- Idée de mission : défendre une région contre les patrouilles, escorter un
  convoi à travers les lignes de l'Empire, détruire les six mechas E1–E6.

## 🕳 Internationale Noire — chantier séparé, pas dans ce parcours

Faction sans héros, sans plateau joueur, sans mecha de série — sa mécanique
de jeu (sabotage plutôt que production/combat classique) est fondamentalement
différente du reste du roster. C'est elle qui assassine l'Empereur Cyrus II
en 1915 (voir lore §III.4) : elle mérite un chapitre de campagne, voire
plusieurs, mais **sa conception (règles, victoire, plateau) est un chantier à
part entière, à traiter séparément** de la décomposition de séquences
ci-dessous. Ne pas l'improviser en l'intégrant au parcours à 6 factions tant
que ce chantier n'a pas eu lieu.

---

## Décomposition des séquences de campagne

Structure : un **prologue** (texte seul, pas de partie), **six chapitres**
(un par faction jouable, une partie complète chacun avec un objectif
narratif et une variante de jeu), et un **finale** qui boucle sur l'état du
monde du jeu de base. Chaque chapitre indique : le morceau d'histoire donné
avant/après la partie, et la variante de jeu appliquée (si applicable).

L'ordre proposé suit une logique de dévoilement (l'événement fondateur →
racines économiques → racines profondes/Tesla → marges négligées →
prédation ouverte → le maître du jeu financier) mais n'est pas rigide au-delà
du chapitre 1, qui doit rester premier — c'est lui qui ouvre le marché des
mechas à tout le monde et rend les cinq suivants possibles.

### Prologue — Le trône né de l'intérieur

*Texte seul, pas de partie.* Pose le décor : 1865, une coalition
d'industriels du Nord couronne l'Empereur Cyrus I sur les ruines de la
Sécession, en échange de la soumission de l'aristocratie foncière du Sud
plutôt que de son éradication. Cinquante ans d'expansion continentale plus
tard, l'arrivée et la trahison de Tesla ont fait de Rouge River l'arsenal
exclusif du trône (Cyrus II, 1913). En 1915, l'Empereur est assassiné par
l'Internationale Noire — et une garnison loyaliste, sans ordre de personne,
verrouille Rouge River par la force plutôt que d'admettre que le trône est
mort. « Vous allez incarner, tour à tour, les factions qui vont se disputer
ce qu'il en reste. » *(cf. lore §III.1-4)*

### Chapitre 1 — Confédération (J. Cole & Dixie) — l'événement fondateur

- **Histoire donnée avant** : le compromis de 1865 — l'aristocratie foncière
  du Sud a gardé son ordre racial local en échange de sa soumission à
  l'Empire ; deux générations plus tard, elle n'est plus qu'une milice sous-
  traitée d'un industriel de Detroit (le Klan Mécanique, lore §III.3) ; et
  depuis le régicide, une garnison loyaliste tient Rouge River fermée à
  tout le monde, Ford y compris.
- **Variante de jeu** : Mechas de l'Empire **ON**, mission centrée sur la
  prise de la case Rouge River elle-même (pas une simple patrouille
  croisée en chemin) — le joueur affronte directement la garnison
  loyaliste retranchée.
- **Histoire donnée après** : la garnison lâche prise. Sans Empereur pour
  l'honorer, la charte d'exclusivité de Ford ne vaut plus rien — il rouvre
  le Catalogue Ford à tout le continent. **C'est cet instant précis qui
  explique pourquoi toutes les factions suivantes ont déjà accès aux mechas
  Ford dans la suite de la campagne (et dans le jeu de base).** Le joueur
  comprend aussi que Cole n'a rien libéré : il a repris ce qu'il considérait
  comme sien — teasing du thème de la Fièvre (bascule fasciste) pour la
  suite de la campagne.

### Chapitre 2 — Frente Libre (E. Rojas & Trueno)

- **Histoire donnée avant** : l'Empire n'est pas né au Mexique, mais il s'y
  est étendu une génération après sa fondation — concessions minières et
  ferroviaires « exclusives, continent entier » qui ont dépossédé des
  générations avant même que Zapata prenne les armes.
- **Variante de jeu** : **Ruée vers l'or** (`structureBonus.js`, tuile
  bonus $ tirée en début de partie) — la course aux gisements symbolise la
  curée sur les terres mexicaines par les latifundistes financés par le
  Consortium.
- **Histoire donnée après** : révélation que la cible de Rojas n'est pas
  seulement les propriétaires terriens du Nord, mais le principe même de la
  concession exclusive — le joueur comprend que Panamerica n'a pas de
  « centre » géographique unique : l'Empire est un système d'extraction, pas
  un territoire.

### Chapitre 3 — Nations Souveraines (Aiyana & Koda)

- **Histoire donnée avant** : les voies ferrées impériales tracées à travers
  les terres Lakota/Navajo/Cree/Haudenosaunee sans qu'on leur demande rien ;
  la rumeur d'un fragment d'équipement de Wardenclyffe exfiltré et échangé
  contre du cuivre travaillé par les Nations avant la saisie du labo de
  Tesla.
- **Variante de jeu** : déblocage du **Golem** (mecha bonus) en fin de
  partie si l'objectif de faction est rempli — la métallurgie cuivre/bronze
  des Nations est, dans le lore, la plus proche des alliages tesliens.
- **Histoire donnée après** : la piste du Golem confirme (ou infirme, sans
  trancher définitivement) la rumeur — laisse un fil ouvert pour une
  extension future centrée sur l'héritage direct de Wardenclyffe.

### Chapitre 4 — Acadiane (M. Thibodeau & Brume)

- **Histoire donnée avant** : dispersée par le Grand Dérangement de 1755,
  un siècle avant l'Empire — l'Acadiane n'a jamais reconnu aucune couronne,
  et son réseau de contrebande a toujours vécu dans les failles de
  l'autorité impériale.
- **Variante de jeu** : déblocage de la **Tour Wardenclyffe** (bâtiment
  bonus) — le réseau énergétique à distance fait écho, mécaniquement, au
  réseau de comptoirs déjà propre à l'Acadiane (ability Comptoir).
- **Histoire donnée après** : les douanes impériales de Rouge River, trop
  occupées par la crise de succession, ne surveillent plus les fleuves —
  Thibodeau referme enfin, ouvertement, le lien Louisiane–Québec.

### Chapitre 5 — Bayou (Cap. Zeke & Croc)

- **Histoire donnée avant** : dockers et déserteurs des docks impériaux du
  Mississippi, devenus corsaires d'un fleuve qu'ils refusent de laisser à
  l'Empire.
- **Variante de jeu** : Mechas de l'Empire **ON** (à nouveau) + déblocage de
  l'**Éclair** (mecha bonus) en cas de victoire sur l'objectif de faction —
  cohérent avec l'objectif *Le Prédateur*, déjà câblé sur `empireKills` dans
  le code actuel (`factions.js`).
- **Histoire donnée après** : le joueur comprend que le Bayou ne veut pas le
  trône — il veut ce que le trône transporte. Premier indice concret sur les
  convois qui alimentaient Rouge River avant l'assassinat de 1915.

### Chapitre 6 — Dominion (Col. Whitfield & Sterling)

- **Histoire donnée avant** : la finance londonienne qui a arrêté net la
  poussée impériale vers le Canada (lore §III.1) ; le Dominion n'a jamais
  cherché à conquérir l'Empire, seulement à en vivre — à négocier avec
  quiconque tient Rouge River à un instant donné.
- **Variante de jeu** : **Acier Brut** actif sur Rouge River (voir plus
  haut) — le chapitre où le contrôle littéral de l'arsenal impérial est
  l'enjeu, en écho direct à l'ability Commerce Impérial du Dominion.
- **Histoire donnée après** : révélation que c'est en partie l'argent du
  Dominion qui a discrètement financé l'intronisation du pantin Cyrus III
  en 1917 — non par loyauté, mais parce qu'un trône fictif, même vide, reste
  plus profitable pour le commerce qu'un continent ouvertement sans
  souverain. Le joueur comprend que le Dominion n'a jamais voulu que
  l'Empire meure : il voulait juste qu'il continue à signer des papiers.

### Finale — Le Trône Vide

- **Format** : une dernière partie combinant plusieurs variantes déjà vues
  (Mechas de l'Empire ON + Acier Brut actif), jouable avec la faction de son
  choix parmi les six — pas de héros supplémentaire, c'est un aboutissement,
  pas un septième chapitre.
- **Histoire donnée après** : le pantin Cyrus III tombe à son tour ; Rouge
  River continue de tourner sans personne pour vraiment la commander ; les
  mechas impériaux, sans chaîne de commandement, deviennent les « colosses
  rouillés » que le jeu de base décrit dans son texte de règles
  (`rules.js`, section Contexte). **La campagne se referme exactement là où
  commence une partie standard de Scythe Panamerica.**
- Cliffhanger explicite vers l'Internationale Noire comme prochain chantier
  de campagne (chantier séparé, voir plus haut) : on sait qui a tiré en
  1915 et pourquoi Rouge River a fini par s'ouvrir à tous — on ne sait
  toujours pas qui ils sont vraiment.

---

*Ce document est une base de travail, ouverte à l'itération — les variantes
listées ne sont pas encore implémentées (flags de partie à créer), et l'ordre
des chapitres peut être réarrangé sans casser la structure.*
