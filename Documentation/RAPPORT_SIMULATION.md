# Rapport de simulation — parties bot vs bot

> Généré avec `scripts/simulate.mjs` — 600 parties, seed 42, cap 150 rounds.
> Reproductible : `npm run sim -- --games 600 --seed 42`
> **v2** : PvP entre IA, rencontres bots, et conformité aux règles officielles
> (relues depuis `Documentation/Stonemaier Games rules Scythe jeu original.txt`).

## 1. Le harnais

`scripts/simulate.mjs` fait jouer des parties complètes **bot contre bot, sans UI**,
en réutilisant la vraie logique du jeu (`src/logic`, `src/data`) et en répliquant
la boucle d'orchestration d'`App.jsx` : tours de bots, **combats PvP entre bots**,
combats PvE contre l'Empire (attaque et défense), **rencontres**, déplacement
d'ouvriers ennemis, pièges Frente, bonus enlist (soi + voisins), rails, fin
immédiate à 6 étoiles, scoring conforme.

- **RNG seedé** (`--seed`) → chaque partie est reproductible pour déboguer.
- **Invariants vérifiés à chaque tour** (bornes des pistes, ressources ≥ 0,
  conservation des cubes, plafonds d'unités…) ; crash ou violation → exit code 1
  (utilisable comme test CI).
- Options : `--games N`, `--seed S`, `--maxRounds R`, `--verbose`, `--dump f.ndjson`.

## 2. Nouveautés v2

### PvP entre IA (`src/logic/pvpBots.js`, partagé App + simulateur)

Suivant les règles officielles (p. 22-23) :
- combat quand héros/mechs partagent un hex avec héros/mechs adverses, résolu
  **à la fin de l'action Déplacement** ;
- engagement de puissance (max 7) + 1 carte combat (+2) par unité combattante ;
- **l'attaquant remporte les égalités** ;
- le vaincu retire *toutes* ses unités du hex vers sa base, **les ressources du
  hex passent au vainqueur**, et il **pioche 1 carte combat** s'il a révélé ≥ 1
  point de puissance ;
- le vainqueur — attaquant **ou défenseur** — gagne une étoile de combat (max 2) ;
- l'attaquant vainqueur perd 1 popularité par ouvrier adverse chassé ;
- capacités de faction actives : **White Flag** (Acadiane, 50 % de refus),
  **Flibuste** (pillage 2 pièces), **Chimère** (capture de mecha), **Servitude**
  (capture d'ouvrier).

Décision d'attaque : un bot attaque si sa force estimée (puissance + cartes×2)
est ≥ 8, qu'il lui reste une étoile de combat à prendre et qu'il n'est plus en
début de partie. Les bots n'attaquent **jamais le joueur humain** (la défense
interactive humaine n'est pas encore câblée) — ils l'évitent physiquement.

### Rencontres pour les bots (`src/logic/botEncounters.js`)

Conformes aux règles (p. 24) : seul le *personnage* déclenche une rencontre, le
jeton est défaussé, la rencontre se résout après les combats du tour, les gains
apparaissent sur le hex. Les héros bots sont attirés par les jetons (+7 au
ciblage), choisissent une option au hasard, et un mecha gagné en rencontre
débloque la capacité suivante, comme un Déploiement. **6,4 des 9 jetons sont
consommés par partie** en moyenne.

### Conformité aux règles vérifiée à la relecture

| Règle officielle | État avant | Correctif |
|---|---|---|
| Scoring : seules les ressources sur des **territoires contrôlés** comptent | Toutes les ressources stockées comptaient (l'Acadiane finissait à ~115 ressources → 57 pts) | Scoring filtré (App + sim) |
| Le vaincu **pioche 1 carte combat** s'il a révélé ≥ 1 puissance | Absent | Ajouté (PvP humain et bots) |
| Le **vainqueur défenseur** gagne aussi l'étoile de combat | Seul l'attaquant humain la gagnait | Ajouté |
| Les **ressources du hex** passent au vainqueur | Elles étaient supprimées du jeu | Transfert (PvP humain et bots) |
| Rencontres : personnage seulement, jeton défaussé, gains sur le hex | OK pour l'humain, inexistant pour les bots | Bots ajoutés |
| Move = déplacer 2 unités **ou gagner 1$** | Les bots n'avaient pas l'option 1$ | Corrigé (v1) |

Écarts assumés du proto (documentés, pas des bugs) : cartes combat à valeur
fixe +2 (pas un deck 2-5), Empire PvE inexistant dans l'original, rails au lieu
des tunnels, popularité/pièces des rencontres simplifiées.

## 3. Résultats (600 parties, 2 à 5 joueurs)

### Durée et fins de partie

| Métrique | Valeur |
|---|---|
| Parties finies à 6 étoiles | **79,3 %** (durée : moyenne 51, **médiane 46**, min 23 rounds) |
| Combats PvP entre bots | **2,0 / partie** (fidèle à l'original : « peu de combats par partie ») |
| Rencontres résolues | 6,4 / partie (sur 9 jetons) |
| Attaques bot → Empire | 34,5 % gagnées ; défenses vs Empire : 38,7 % gagnées |
| Le déclencheur des 6 étoiles gagne | 72,9 % des cas |
| Écart moyen 1ᵉʳ–2ᵉ | 27,9 pts (42,5 en v1) |
| **Score du vainqueur** | **70,2** = étoiles 16,0 + territoires 19,6 + ressources 24,1 + pièces 10,6 — *cohérent avec la règle « la victoire s'obtient autour de 75$ »* |
| Crashs / invariants violés | **0 / 0** (~65 000 tours de bot) |

**Référence utilisateur : 15-25 tours/joueur en partie réelle.** Les bots
finissent en médiane 46 tours/joueur : ils restent ~2× plus lents que des
humains (heuristiques simples, production non planifiée vers les bons types de
ressources). L'écart s'explique, mais c'est la prochaine marge de progression
de l'IA.

### Taux de victoire par faction

| Faction | Win v2 | (v1 sans PvP) | Déclenche fin | Score moy | Étoiles moy |
|---|---|---|---|---|---|
| **Acadiane** | **56,0 %** | 67,5 % | 32,5 % | 67,3 | 4,09 |
| Nations Souv. | 37,1 % | 20,1 % | 38,2 % | 39,8 | 3,96 |
| Frente Libre | 35,6 % | 37,9 % | 43,0 % | 44,7 | 4,60 |
| Dominion | 18,8 % | 30,2 % | 4,4 % | 46,4 | 1,99 |
| Bayou | 12,4 % | 8,3 % | 9,6 % | 29,7 | 2,33 |
| Confédération | 11,5 % | 9,4 % | 8,5 % | 30,4 | 2,54 |

Le PvP et le scoring conforme resserrent nettement le jeu : l'écart max/min
passe de 8× à 5×. Confédération et Bayou profitent enfin de leurs capacités
PvP (Servitude, Chimère, étoiles de combat).

### Par plateau joueur (équilibré : 22–36 %)

| Plateau | Win | Score moyen |
|---|---|---|
| Forge | 35,7 % | 46,2 |
| Atelier | 33,0 % | 43,1 |
| Terroir | 27,8 % | 44,0 |
| Fordisme | 24,0 % | 41,9 |
| Pionnier | 22,3 % | 40,1 |

### Provenance des étoiles (% joueurs / % vainqueurs)

| Étoile | Joueurs | Vainqueurs |
|---|---|---|
| 4 mechas | 57,6 % | 68,8 % |
| Objectif secret | 43,4 % | 58,3 % |
| Objectif de faction | 41,2 % | 45,7 % |
| 4 bâtiments | 37,8 % | 64,7 % |
| 4 recrues | 37,6 % | 68,5 % |
| **Combat 1 / 2** | **36,5 % / 15,6 %** | 53,3 % / 24,8 % |
| 6 upgrades | 25,4 % | 45,2 % |
| Libérateur (3 Empire) | 14,9 % | 23,5 % |
| 8 ouvriers | 9,7 % | 18,0 % |
| Puissance 16 / Pop 18 | 3,6 % / 2,3 % | 3,7 % / 8,2 % |

## 4. Points d'équilibrage restants

1. **Acadiane toujours en tête (56 %)** — production idéale pour ses bottoms,
   comptoirs comptés au territoire, objectif de faction facile via Submerge.
   *Pistes : comptoirs non adjacents entre eux, ou fObj durci.*
2. **Bayou/Confédération sous la moyenne** malgré le PvP — leurs moteurs
   économiques de départ restent pauvres (mix de ressources des hex de départ).
   *Piste : revoir leurs `workerHex` de départ ou leurs coûts.*
3. **Dominion** : moteur de pièces linéaire toujours sensible à la durée de la
   partie (mais fortement réduit par le scoring conforme).
4. **Puissance 16 / Pop 18 quasi inaccessibles** aux bots (< 4 %) — la
   puissance est siphonnée par l'Empire et les combats PvP.
5. **Durée** : médiane 46 rounds vs 15-25 attendus — l'IA doit apprendre à
   planifier sa production vers les ressources de ses actions bottom.

## 5. Relancer

```bash
npm run sim                                  # 200 parties rapides
npm run sim -- --games 600 --seed 42         # reproduire ce rapport
npm run sim -- --games 5 --verbose           # journal détaillé de la partie 1
npm run sim -- --games 600 --dump games.ndjson  # données par partie (JSON)
```
