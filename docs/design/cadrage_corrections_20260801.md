# PANAMERICA 1920+ — DOCUMENT DE CADRAGE
## Correctifs issus de la partie de campagne du 1er août 2026
**Version 1.0 — 1er août 2026 — statut : validé pour implémentation**

---

## 1. CONTEXTE ET OBJECTIFS

La première partie réelle du chapitre 1 « Le rail avance » (journal du
01/08, 27 tours, victoire joueur 91-26-22) a produit **11 notes de jeu**,
toutes vérifiées dans le code et documentées dans
`docs/design/analyse_partie_20260801.md`. Ce cadrage traduit ces constats en
lots implémentables.

Trois familles de problèmes, de nature très différente :

- **Deux défauts du lot campagne du 1er août** — un verrou incomplet et un
  bandeau trompeur. Régressions de mon propre périmètre, prioritaires.
- **Trois bugs de règles de l'Empire** — antérieurs à la campagne, mais
  rendus visibles parce que le chapitre 1 est le premier contexte où les
  patrouilles tournent vraiment.
- **Un chantier de fond sur les bots** — deux symptômes (Acadiane immobile,
  Dominion sans défense) qui partagent une seule cause structurelle.

S'y ajoute un arbitrage de conception rendu par le concepteur (§2, D1).

---

## 2. DÉCISIONS ACTÉES

| N° | Sujet | Arbitrage |
|---|---|---|
| **D1** | **Esprit Sauvage — substitution partielle** | **AUTORISÉE.** Le coût du Deploy peut être payé par n'importe quel **mélange** de la ressource primaire et de la ressource alternative (3 métal + 1 bois pour un coût de 4). Vaut pour toute faction portant `deployAltRes` : Nations (bois) et Acadiane (pétrole, « Vapeur des Lacs »). Le texte de faction devra suivre. |
| **D2** | Fragments Tesla en butin PvE | Soumis au **même cran que les cartes rencontre** (chapitre 3, voie canon). C'est la même matière : les reliques circulent ou ne circulent pas. |
| **D3** | Condition canon composée | Le bandeau affiche **l'état de chaque membre séparément**. Une condition à deux membres ne peut plus s'afficher comme une phrase unique. |
| **D4** | Patrouille sur ouvriers seuls | La règle Scythe s'applique à l'Empire **comme à tout le monde** : renvoi des ouvriers à la base. Reste à trancher : l'Empire n'ayant pas de popularité, il ne paie aucun coût pour ce renvoi (asymétrie assumée — ce n'est pas un joueur). |
| **D5** | Patrouilles empilées | Deux patrouilles sur un même hex **cumulent** leur force. Une seule carte de combat est tirée **par patrouille**, et les forces s'additionnent. |
| **D6** | Force de l'Empire | Affichée en **fourchette** (`1 à 12`) avant l'engagement, révélée à la résolution. Aligne l'Empire sur l'incertitude déjà subie face aux bots. |
| **D7** | Chantier bots | Traité en **lot séparé**, avec mesure avant/après obligatoire. Le `+3` Acadiane de la v0.15 prouve qu'un correctif non mesuré ne suffit pas. |

---

## 3. SPÉCIFICATIONS

### 3.1 Verrou Tesla — fermeture de la troisième source (D2)

Le verrou couvre le deck de rencontres et la vitrine de l'Usine. Il **ne
couvre pas** le panneau de butin d'une victoire contre l'Empire
(`claimReward`, option `fragment` codée en dur) — troisième source, et la plus
accessible au chapitre 1 puisque c'est justement là que l'Empire tourne.

- Nouvel unique point de vérité : `teslaFragmentsAvailable(chapter, progress)`
  dans `logic/campaign.js` — `true` hors campagne, sinon aligné sur le cran 1.
- Le panneau de butin n'affiche que les récompenses disponibles : à deux
  options, la grille passe de 3 à 2 colonnes.
- Le chemin bot est déjà couvert incidemment (`teslaOffer` vide), mais passe
  au même helper pour ne pas dépendre d'un effet de bord.

### 3.2 Condition canon — progression par membre (D3)

Cause du malentendu du tour 17 : « 4+ hex Plaine/Forêt **ET** 2 patrouilles »
s'affiche en une phrase, verte ou grise. Le joueur avait fait les patrouilles
(2/2) et était à 2/4 sur les hex, sans aucun moyen de le voir.

- La condition canon devient une **liste de membres** :
  `canon.parts = [{ label, count(p,ctx), need }]`.
- `canon.check` est **dérivé** des membres (tous satisfaits) — un seul point
  de vérité, plus de risque que le bandeau et le moteur divergent.
- `canon.desc` est **généré** à partir des membres.
- Bandeau en jeu : une ligne par membre, avec compteur (`Plaine/Forêt 2/4`,
  `Patrouilles 2/2 ✓`), chacune verte quand elle est remplie.
- **Garde-fou de non-régression** : un test croise `canon.check` avec le
  `fObj.check` de la faction correspondante sur des états construits. Si un
  seuil bouge dans `factions.js` sans être répercuté, le test échoue.

### 3.3 Règles de l'Empire (D4, D5, D6)

**Déplacement d'ouvriers.** Aujourd'hui la boucle de mouvement de l'Empire ne
teste que `hasCombatUnit` (héros/mecha) : un hex qui ne porte que des ouvriers
ne déclenche rien. Elle doit, à défaut d'unité combattante, renvoyer les
ouvriers présents à leur base — joueur humain comme bot.

**Patrouilles empilées.** `empireOnHex` récupère déjà toutes les patrouilles
de l'hex mais seule `[0]` est combattue. Le combat doit tirer **une carte par
patrouille**, sommer les forces, et **retirer toutes les patrouilles vaincues**
(donc créditer autant d'`empireKills`).

**Force en fourchette.** L'UI affiche `card.power` avant l'engagement. Elle
doit afficher la fourchette du deck (min-max de `EMPIRE_DECK`, soit 1 à 12) et
ne révéler la valeur qu'à la résolution.

### 3.4 Esprit Sauvage — substitution partielle (D1)

Le coût du Deploy (N unités de la ressource primaire) devient payable par
**tout mélange** primaire + alternative, dès lors que `primaire + alt ≥ N`.

- **Choix du joueur conservé et prévisible** : les deux boutons existants
  (⚙ Métal / 🪵 Bois) ne désignent plus la ressource *exclusive* mais la
  ressource **servie en premier** ; le reliquat est complété automatiquement
  par l'autre. Cliquer « Bois » avec 1 bois et 3 métal paie 1 bois + 3 métal.
- Le libellé indique le paiement effectif avant validation.
- Bots : la même règle vaut pour leur test de solvabilité et leur paiement.

---

## 4. PLAN DE MISE EN ŒUVRE PAR LOTS

| Lot | Contenu | Critère de validation | Dépend de |
|---|---|---|---|
| **A** | Verrou Tesla sur le butin PvE (§3.1) | Partie ch.1 : aucune option Fragment après une victoire Empire. Partie libre : les 3 options intactes. | — |
| **B** | Condition canon par membres + bandeau (§3.2) | Bandeau affichant `2/4` et `2/2` séparément sur la position du tour 17 du journal. Test croisé avec `fObj` au vert. | — |
| **C** | Empire : renvoi des ouvriers (§3.3) | Patrouille entrant sur un hex d'ouvriers seuls → ouvriers renvoyés à la base, log dédié. | — |
| **D** | Empire : patrouilles empilées (§3.3) | Deux patrouilles sur un hex → une carte chacune, forces sommées, les deux détruites en cas de victoire (2 `empireKills`). | C |
| **E** | Empire : force en fourchette (§3.3) | Modale affichant `1 à 12` avant engagement, valeur exacte à la résolution. | — |
| **F** | Esprit Sauvage partiel (§3.4) | Deploy à 4 accepté avec 3 métal + 1 bois, côté joueur ET bot. | — |
| **G** | *(lot séparé)* Bots : termes de carence | Mesure avant/après sur ≥5 seeds : déplacements par partie, territoires finaux, puissance minimale. | — |
| **H** | *(lot séparé)* Lisibilité : fourchette adverse en PvP, tracé ferroviaire à l'animation, légende des jetons $ | Relecture à l'écran. | — |

**Ordre recommandé** : A et B d'abord (régressions de campagne), puis C→D→E
(règles de l'Empire, D dépend de C car les deux touchent la même boucle), puis
F. G et H sont des chantiers distincts, à ouvrir après validation en partie
réelle.

---

## 5. RISQUES ET MITIGATIONS

| Risque | Impact | Mitigation |
|---|---|---|
| La refonte de `canon` en membres fait diverger le bandeau du moteur | Le joueur voit une condition remplie sans clôture — exactement le bug qu'on corrige | `check` **dérivé** des membres (pas de seconde implémentation) + test croisé avec `fObj` |
| Les patrouilles empilées rendent l'Empire trop dur | Chapitres à Empire injouables | Mesurer en partie réelle ; la force cumulée reste bornée par le nombre de patrouilles sur l'hex (rare au-delà de 2) |
| Le renvoi d'ouvriers par l'Empire punit surtout les bots (qui empilent) | Déséquilibre PvE | Mesurer en simulation avant de figer ; l'asymétrie de coût (D4) est déjà un choix conscient |
| La substitution partielle rend le Deploy trop facile pour Nations/Acadiane | Équilibrage de faction | Ce sont les deux factions les plus contraintes en métal (péninsules) ; c'était l'intention d'origine de la capacité. À mesurer au winrate. |

---

## 6. HORS-SCOPE

- Chantier bots (lot G) — cadrage propre à écrire, avec mesures.
- Lisibilité (lot H) — dépend d'arbitrages d'UI non rendus.
- Tuile bonus de pose : le fait que **les 3 joueurs finissent à 0$** pose une
  question d'équilibrage (et pas seulement de légende) — hors périmètre ici,
  à instruire séparément.
- Toute modification des règles de circulation ferroviaire : actées en partie
  réelle, elles ne bougent pas.
