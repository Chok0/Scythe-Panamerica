# Rapport de simulation — parties bot vs bot

> Généré avec `scripts/simulate.mjs` — 500 parties, seed 42, cap 150 rounds.
> Reproductible : `npm run sim -- --games 500 --seed 42`

## 1. Le harnais

`scripts/simulate.mjs` fait jouer des parties complètes **bot contre bot, sans UI**,
en réutilisant la vraie logique du jeu (`src/logic`, `src/data`) et en répliquant
la boucle d'orchestration d'`App.jsx` : tours de bots, combats PvE contre l'Empire
(attaque et défense), déplacement d'ouvriers ennemis, pièges Frente, bonus enlist
(soi + voisins), pose de rails par la Gare, fin immédiate à 6 étoiles, scoring final.

- **RNG seedé** (`--seed`) → chaque partie est reproductible pour déboguer.
- **Invariants vérifiés à chaque tour** : puissance/popularité/pièces/cartes dans
  les bornes, ressources jamais négatives, unités sur des hex existants,
  conservation des 6 cubes d'upgrade, plafonds (8 ouvriers, 4 mechas +chimère,
  6 upgrades, 4 recrues, 4 bâtiments). Toute violation ou exception est loggée.
- Options : `--games N`, `--seed S`, `--maxRounds R`, `--verbose` (journal de la
  1ʳᵉ partie), `--dump fichier.ndjson` (une ligne JSON par partie pour analyse).

### Limites à garder en tête

- **Aucun combat PvP entre bots** (non implémenté dans le jeu) : les parties
  bot-vs-bot sont des courses sans interaction militaire. Les étoiles de combat,
  Servitude (Confédération), la Chimère PvP (Bayou), Flibuste et White Flag
  n'existent pas dans ces parties.
- Les **rencontres** et **Rouge River** sont réservées au joueur humain.
- Les bots jouent des heuristiques simples — les chiffres mesurent « le jeu tel
  que joué par les bots », pas l'équilibre théorique entre bons joueurs.

## 2. Bugs trouvés par la simulation (corrigés)

| Bug | Symptôme | Correctif |
|---|---|---|
| **Puissance négative** | Le bonus d'ability de combat (Cavaliers +2, Discipline +2…) était *dépensé* de la piste de puissance en plus d'être ajouté au total → `power = -2` (3 sites dans App.jsx : attaque PvE bot, défense PvE bot, défense PvP bot) | Le bonus s'ajoute au total de combat mais n'est plus déduit de la piste |
| **Impasse économique des bots** | À 0 pièce **et** 0 puissance, un bot ne peut plus ni Produce (coût pui), ni Bolster/Trade (coût $) → il erre en Move pour l'éternité (≈70 % de parties sans fin au départ) | Le bot applique la règle Scythe « Move ou +1$ » : il prend la pièce quand il est fauché |
| **Règle d'égalité incohérente** | Défenseur *humain* contre l'Empire : égalité = victoire ; défenseur *bot* : égalité = défaite | Alignée : le défenseur gagne l'égalité dans les deux cas |
| **Étoile 8 ouvriers inatteignable pour les bots** | Le bot plafonnait ses ouvriers à 5 pour toujours | Cap 5 en début de partie, puis 8 |

Après correctifs : **0 crash et 0 violation d'invariant sur 500 parties** (~55 000 tours de bot).

## 3. Résultats (500 parties, 2 à 5 joueurs)

### Durée et fins de partie

| Métrique | Valeur |
|---|---|
| Parties finies à 6 étoiles | **49,6 %** (durée moyenne 64,6 rounds, médiane 61) |
| Parties arrêtées au cap de 150 rounds | 50,4 % |
| Le déclencheur des 6 étoiles gagne au score | 67,7 % des cas |
| Écart moyen 1ᵉʳ–2ᵉ | 42,5 pts (très large → parties déséquilibrées) |
| Attaques bot → Empire | 3 012 (34 % gagnées) |
| Défenses vs Empire | 4 130, soit **~8 par partie** (39 % gagnées) |

### Taux de victoire par faction (1ᵉʳ au score)

| Faction | Win | Déclenche la fin | Score moyen | Étoiles moy. |
|---|---|---|---|---|
| **Acadiane** | **67,5 %** | 23,4 % | **99,7** | 4,11 |
| Frente Libre | 37,9 % | **42,2 %** | 57,3 | **4,69** |
| Dominion | 30,2 % | 0,0 % | 62,0 | 1,69 |
| Nations Souv. | 20,1 % | 16,2 % | 39,7 | 3,06 |
| Confédération | 9,4 % | 2,0 % | 33,5 | 2,06 |
| Bayou | 8,3 % | 2,7 % | 30,2 | 1,75 |

### Par plateau joueur (équilibré, léger avantage Terroir)

| Plateau | Win | Score moyen |
|---|---|---|
| Terroir | 34,1 % | 58,2 |
| Atelier | 30,2 % | 52,5 |
| Forge | 29,4 % | 54,7 |
| Fordisme | 29,1 % | 55,3 |
| Pionnier | 21,3 % | 47,4 |

### Provenance des étoiles

| Étoile | % des joueurs | % des vainqueurs |
|---|---|---|
| 4 mechas | 61,3 % | 55,0 % |
| 4 bâtiments | 41,8 % | 67,6 % |
| 4 recrues | 36,8 % | 68,0 % |
| Objectif secret | 36,7 % | 46,8 % |
| Objectif de faction | 40,2 % | 46,4 % |
| 6 upgrades | 33,1 % | 53,4 % |
| Libérateur (3 Empire) | 20,1 % | 31,2 % |
| 8 ouvriers | 10,5 % | 19,4 % |
| Puissance 16 | 4,7 % | 5,8 % |
| Popularité 18 | 3,3 % | 10,8 % |

## 4. Analyse d'équilibrage

1. **Le scoring récompense l'accumulation infinie de ressources.** Le score moyen
   des vainqueurs (92,6) se décompose en : ressources **45,7** > territoires 20,2 >
   étoiles 13,7 > pièces 13,1. L'Acadiane finit avec ~115 ressources en stock.
   Dans le Scythe original la partie s'arrête assez vite pour que ça reste marginal ;
   ici, avec des parties longues, la production brute écrase tout.
   *Pistes : plafonner les ressources comptées au scoring (ex. max 20), ou ne
   compter que les ressources sur des hex contrôlés par des unités.*

2. **Acadiane sur-performe massivement** (67,5 % de victoires) : production
   pétrole/nourriture idéale pour ses bottoms, +4 comptoirs comptés au territoire,
   objectif de faction facile (4 comptoirs + héros sur lac, trivial avec Submerge).
   *Pistes : comptoirs comptés seulement s'ils ne sont pas adjacents entre eux,
   ou objectif de faction durci.*

3. **Confédération et Bayou sont structurellement faibles sans PvP** : leurs
   abilities (Servitude = capture d'ouvriers en PvP, Chimère = capture de mecha)
   et l'objectif de faction Confédération (2 ouvriers capturés) supposent des
   combats joueur-contre-joueur… qui n'existent pas entre bots. Contre un humain
   qui ne les attaque pas, même problème.
   *Piste : implémenter le combat PvP initié par les bots (le plus gros manque
   du jeu actuellement), ou donner un déclencheur PvE à ces abilities.*

4. **Dominion = « riche mais sans étoiles »** : 0 % de fins déclenchées, 1,69
   étoile en moyenne, mais 30 % de victoires uniquement grâce aux pièces du
   Commerce Impérial (48 pièces en moyenne). Son moteur est linéaire dans le
   temps : plus la partie dure, plus il gagne. Équilibré seulement si les
   parties sont courtes.

5. **L'Empire harcèle beaucoup** : ~8 défenses subies par partie, qui drainent
   la puissance des bots (et donc Produce). C'est une pression PvE intéressante
   mais elle ralentit nettement la course aux étoiles.

6. **Étoiles Puissance 16 / Popularité 18 quasi inaccessibles** (< 5 %) — la
   puissance est siphonnée par les combats Empire et la popularité n'a pas de
   moteur dédié. À surveiller aussi côté joueur humain.

7. **Les plateaux joueur sont raisonnablement équilibrés** (21–34 %), Terroir
   devant (départ 4 pop / 7 pièces), Pionnier derrière.

## 5. Relancer / approfondir

```bash
npm run sim                                  # 200 parties rapides
npm run sim -- --games 1000 --seed 7         # gros échantillon
npm run sim -- --games 5 --verbose           # journal détaillé de la partie 1
npm run sim -- --games 500 --dump games.ndjson  # données par partie (JSON)
```

Le script sort en code 1 si un crash ou une violation d'invariant survient —
utilisable tel quel en CI comme test de non-régression de la game loop.
