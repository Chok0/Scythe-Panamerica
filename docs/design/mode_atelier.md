# Mode Atelier — l'espace des plateaux joueur

*Écran : `src/components/WorkshopScreen.jsx` · Générateur : `src/data/matGen.js` ·
Persistance : `src/logic/workshop.js` · Tests : `src/logic/__tests__/matGen.test.js`*

## 1. Le constat de départ

Les treize plateaux joueur du jeu (six Panamerica + sept du Scythe original) ne
sont pas des objets libres : depuis la v0.14 ils obéissent tous à la **même
grammaire**, vérifiée par `logic/__tests__/mats.test.js`. Or une grammaire ne
décrit pas treize objets — elle en décrit un espace entier. L'atelier va
chercher dans le reste de cet espace, en excluant tout ce qui existe déjà.

## 2. La grammaire, article par article

| # | Article | Contrainte |
|---|---------|-----------|
| 1 | Rangée du haut | une permutation des 4 actions ; les cubes suivent l'ACTION, pas la position (Déplacer 2, Soutien 2, Commerce 1, Produire 1) → 6 cubes, toujours |
| 2 | Coûts du bas | 4 bases dans [2,4], Σ = 13, dans l'ordre imposé Améliorer/pétrole · Déployer/métal · Construire/bois · Enrôler/nourriture |
| 3 | Bonus $ | 4 valeurs dans [0,3], Σ = 6$ pile |
| 4 | Cases d'amélioration | Σ = 6 (l'étoile des 6 Améliorations), chaque colonne plafonnée à (base − 1) : un coût ne descend jamais sous 1 |
| 5 | Départ ♥/$ | l'un des 7 échelons du jeu original (2♥4$, 2♥5$, 2♥6$, 3♥6$, 4♥7$, 3♥5$, 3♥4$) |

L'ordre des colonnes du bas ne bouge jamais — c'est la rangée du HAUT qui
change d'un plateau à l'autre, et c'est elle qui crée les couplages
haut·bas (Déplacer·Améliorer, Commerce·Enrôler…).

## 3. Le compte

- **Rangée du haut** : 4! = **24** ordres.
- **Départ ♥/$** : **7** échelons.
- **Bonus $** : nombre de solutions de x₁+…+x₄ = 6 avec 0 ≤ xᵢ ≤ 3, soit
  C(9,3) − 4·C(5,3) = 84 − 40 = **44**.
- **Coûts** : nombre de solutions de b₁+…+b₄ = 13 avec 2 ≤ bᵢ ≤ 4 = **16**.
- **Cases d'amélioration** : dépendent des coûts (cᵢ ≤ bᵢ − 1, Σ = 6). Un jeu de
  coûts sans aucun 2 en autorise 17 dispositions, un jeu qui en contient un
  seulement 15 : 4 × 17 + 12 × 15 = **248** couples (coûts, cases) valides.

Le tirage porte donc sur le couple (coûts, cases) et non sur les deux
séparément — sans quoi les jeux de coûts à 15 dispositions seraient
sur-représentés.

```
24 × 7 × 44 × 248 = 1 833 216 plateaux structurellement distincts
        − 13 déjà publiés
        = 1 833 203 configurations inédites
```

À un plateau par seconde, sans dormir, il faudrait **21 jours** pour tous les
voir.

« Le Réseau » (plateau de campagne de l'Internationale Noire, id 200) est
volontairement HORS de cet espace : son départ 4♥/3$ et sa piste d'ouvriers à
4 cases sortent de la grammaire standard. Il reste exclu du tirage.

## 4. Ce que l'atelier garantit

- **Structurellement valide** : un plateau forgé passe les mêmes tests
  d'invariants que les plateaux écrits à la main (`matGen.test.js` en rejoue
  la totalité sur 200 tirages). Il est jouable tel quel, sans relecture.
- **Inédit** : la *signature* d'un plateau (ordre du haut, coûts, bonus, cases
  utiles, départ) est comparée à celle des quatorze plateaux publiés et à
  celle des plateaux déjà forgés. Deux plateaux de même signature se jouent
  exactement pareil — c'est elle, pas le nom, qui fait foi.
- **Nommé** : le nom vient de la colonne la moins chère, c'est-à-dire de la
  vocation réelle du plateau (Déployer → *Arsenal*, *Fonderie*… ; Construire →
  *Chantier*, *Comptoir*…), suivi d'un lieu du continent. « Fonderie du Delta »
  se lit comme un plateau du jeu, pas comme un identifiant.
- **Lisible** : cinq traits sont calculés et affichés (vocation, gros
  investissement, meilleure paye, ouverture de rangée, échelon de départ). Un
  plateau tiré au sort doit se juger aussi vite qu'un plateau écrit.

## 5. Cycle de vie d'un plateau forgé

1. **Forge** — tirage uniforme dans l'espace, rejet de tout ce qui existe.
2. **Registre** — `registerWorkshopMat` le rend visible de `matById`, donc de
   tout le moteur (création de joueur, coûts, piste de Produire, IA). Il n'entre
   PAS dans `ALL_MATS`, qui reste la liste des plateaux écrits.
3. **Persistance** — `localStorage['pa-atelier']`, relu et revalidé au
   démarrage : un plateau qui ne respecterait plus la grammaire est écarté
   plutôt que chargé.
4. **Choix** — il rejoint la grille des plateaux de l'écran d'accueil, badgé
   « ⚒ Atelier », à côté des six plateaux du jeu.
5. **Sauvegarde** — les plateaux d'atelier en jeu sont EMBARQUÉS dans la
   sauvegarde de partie (`mats:`) : une partie exportée puis relue ailleurs
   retrouve le plateau sur lequel elle a été jouée.
6. **Publication** — le bouton « Copier le code » rend le plateau au format de
   `data/mats.js`. Un plateau qui tient la table passe de l'atelier au fichier
   source sans ressaisie.

## 6. Ce qui reste ouvert

- Les **bots** tirent toujours dans les six plateaux standard : leur donner des
  plateaux forgés ferait de chaque partie un test à l'aveugle, ce qui n'est pas
  souhaitable par défaut mais serait un bon mode « chaos ».
- L'espace est **uniforme, pas équilibré** : la grammaire garantit un plateau
  jouable, pas un plateau intéressant. Rien n'empêche un tirage qui empile ses
  6$ de bonus sur deux colonnes et laisse les autres à sec — c'est précisément
  le genre de configuration que le mode sert à éprouver.
- Le mode API headless (`docs/reference/mode_api.md`) ne connaît pas encore les
  plateaux d'atelier : les faire jouer par le simulateur donnerait une mesure
  automatique de ce qui, dans l'espace, tient debout.
