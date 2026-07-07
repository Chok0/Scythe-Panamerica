# Rapport de simulation — parties bot vs bot

> Généré avec `scripts/simulate.mjs` — 800 parties, seed 42, cap 150 rounds.
> Reproductible : `npm run sim -- --games 800 --seed 42`
> **v3** : IA avec planification de production, défense interactive du joueur,
> instrumentation (rails, capacités, drivers Acadiane) et expérience A/B.

## 1. Le harnais

`scripts/simulate.mjs` fait jouer des parties complètes **bot contre bot, sans UI**,
avec la vraie logique du jeu : tours de bots, combats PvP entre bots, PvE Empire,
rencontres, déplacements d'ouvriers, pièges, enlist, rails, fin à 6 étoiles,
scoring conforme aux règles officielles. RNG seedé, invariants vérifiés à chaque
tour (exit code 1 si crash/violation → test CI). Options : `--games`, `--seed`,
`--maxRounds`, `--verbose`, `--dump f.ndjson`, `--ab noFlagBonus`.

## 2. Nouveautés v3

- **IA planificatrice** : les ouvriers convergent vers les hex produisant les
  ressources *manquantes* des actions bottom non maxées ; Produce choisit ses 2
  hex selon ce besoin ; les colonnes au bottom épuisé sont pénalisées ; le
  Dominion ne convertit plus au Commerce Impérial que son *surplus* (il
  cannibalisait sa propre course aux étoiles — 1,1 capacité mech/4 avant, 3,6
  après).
- **Défense interactive** : quand un bot attaque le héros ou un mecha du joueur,
  la chaîne des bots se met en pause et le modal de combat s'ouvre côté joueur
  (l'attaquant a engagé secrètement puissance + cartes ; il remporte l'égalité).
  White Flag proposé à l'Acadiane défenseure (slot 2). Testé en navigateur :
  attaques subies, victoires (étoile défenseur) et défaites (retraite totale,
  ressources transférées) — 0 erreur.

## 3. Résultats (800 parties, 2 à 5 joueurs)

| Métrique | v3 | (v2) |
|---|---|---|
| Parties finies à 6 étoiles | **98,5 %** | 79,3 % |
| Durée des parties finies | **médiane 35 rounds** (p25 : 32, min 21) | médiane 46 |
| Combats PvP entre bots | 2,3 / partie | 2,0 |
| Rencontres résolues | 6,6 / 9 jetons | 6,4 |
| Crashs / invariants violés | **0 / 0** (~80 000 tours) | 0 / 0 |

*Référence utilisateur : 15-25 tours/joueur. Les bots finissent en médiane 35 —
encore ~1,5× trop lent, mais plus dans le même monde (on partait de 120+).*

### Réponse : les bots utilisent-ils les rails ? les capacités spéciales ?

| Usage | Mesure (800 parties) |
|---|---|
| **Rails** | **8,9 segments posés/partie** par les bots (65–99 % construisent une Gare selon la faction) ; le réseau est ensuite emprunté automatiquement par le pathfinding (`getValidMoves`) — déplacement gratuit depuis tout hex connecté |
| **Capacités mech** (Speed/Riverwalk/Combat/Position) | 1,9 à 3,9 débloquées sur 4 selon la faction ; toutes actives dans le mouvement et les combats |
| **Tierra Minada** (Frente) | 4,0 pièges posés / 4 |
| **Comptoirs** (Acadiane) | 3,8 / 4 posés (+7,5 pts de scoring en moyenne) |
| **Chimère** (Bayou) | utilisée dans 38,8 % des parties |
| **Commerce Impérial** (Dominion) | actif (converti en surplus seulement depuis v3) |
| **Servitude** (Confédération) | rare (0,04 capture/partie — conditions exigeantes : victoire d'attaque + ouvriers présents + 2 pop) |
| **White Flag** (Acadiane) | active en défense (bots et vs joueur) |

### Réponse : l'Acadiane est-elle vraiment cheatée ?

**Oui — 65,7 % de victoires** avec tout en place (PvP, rencontres, scoring
conforme). Mais l'instrumentation renverse le suspect :

- **Ce ne sont pas (principalement) les comptoirs** : A/B `noFlagBonus`
  (comptoirs retirés du scoring, même seed) → elle gagne encore **56,6 %**.
  Les comptoirs valent ~9 points de winrate.
- **Le vrai moteur est la POPULARITÉ** : pop finale moyenne 11,5 vs 4,9 pour
  les autres ; 41 % de ses parties au palier max (13-18) contre 11 %. Le palier
  multiplie *tout* le score (étoiles ×5 vs ×3, territoires ×4 vs ×2, ressources
  ×3 vs ×1) : à stats égales elle score presque le double (69,4 vs 41,4 en
  moyenne, alors qu'elle contrôle *moins* de territoires que la moyenne !).
- La corrélation est générale : le classement pop des factions (Acadiane 11,5 >
  Frente 9,7 > Nations 9,3 ≫ Confédération 2,9 > Dominion 1,6 > Bayou 1,0) est
  **exactement** le classement des winrates. Dans ce proto, la popularité est
  LE prédicteur de victoire.
- Sources de son avance : **White Flag** (+2 pop à chaque combat refusé, moteur
  illimité qui transforme chaque agression subie en points), mobilité Submerge
  (rencontres, sécurité), et aucune perte de pop en défense.

**Pistes de nerf mesurables au simulateur** : White Flag à +1 pop (ou 2×/partie),
fObj durci, ou — plus structurel — adoucir les paliers de popularité (le ×5/×4/×3
est brutal). À l'inverse, **Bayou est la faction cassée-faible** (2,4 % de
victoires, pop 1,0, 1,9 mech/4) : aucun métal accessible depuis ses hex de
départ (village + forêt) → l'étoile mechas et la Chimère arrivent trop tard.
Piste : échanger un hex de départ vers une sierra, ou Deploy payable en bois.

### Win rate par faction

| Faction | v3 | A/B sans comptoirs | Étoiles moy | Pop finale |
|---|---|---|---|---|
| Acadiane | **65,7 %** | 56,6 % | 4,27 | 11,5 |
| Frente Libre | 41,5 % | 42,2 % | 3,89 | 9,7 |
| Nations Souv. | 38,5 % | 41,8 % | 4,65 | 9,3 |
| Confédération | 13,7 % | 12,5 % | 3,24 | 2,9 |
| Dominion | 11,6 % | 13,3 % | 3,23 | 1,6 |
| Bayou | **2,4 %** | 3,0 % | 2,33 | 1,0 |

### Plateaux joueur (équilibrés : 18–35 %)

Terroir 35,1 % · Fordisme 32,1 % · Pionnier 30,9 % · Forge 28,4 % · Atelier 18,5 %.

### Provenance des étoiles (% joueurs / % vainqueurs)

mechs 69/78 · recrues 58/93 · bâtiments 49/69 · objectif 46/58 · combat1 43/65 ·
upgrades 29/44 · combat2 19/34 · workers8 12/18 · power16 11/18 · obj_faction
10/11 · libérateur 9/14 · pop18 5/13.

## 4. Historique des bugs trouvés par la simulation (tous corrigés)

1. Puissance négative (bonus d'ability dépensé, 3 sites) — v1
2. Impasse économique des bots (« Move ou +1$ » manquant) — v1
3. Égalité défenseur incohérente humain/bot — v1
4. Étoile 8 ouvriers inatteignable (cap dur bots) — v1
5. Scoring : ressources non contrôlées comptées — v2
6. Perdant sans pioche de carte combat — v2
7. Ressources du vaincu supprimées au lieu de transférées — v2
8. Étoile du défenseur vainqueur manquante — v2
9. Ouvriers déplacés sans combat sur un hex défendu — v3
10. Dominion cannibalisant ses ressources de bottom — v3

## 5. Relancer

```bash
npm run sim -- --games 800 --seed 42            # reproduire ce rapport
npm run sim -- --games 400 --seed 42 --ab noFlagBonus   # A/B comptoirs
npm run sim -- --games 5 --verbose               # journal détaillé
```
