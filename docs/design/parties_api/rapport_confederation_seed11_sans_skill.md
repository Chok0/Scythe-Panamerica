# Compte rendu — Scythe Panamerica en mode API (partie complète)

## Configuration

| Paramètre | Valeur |
|---|---|
| Mode | API headless (`scripts/apiServer.mjs`, port 4672) |
| Faction (siège 0) | **Confédération** (héros J. Cole, Servitude, Gué plaine/désert) |
| Plateau joueur | **5 — Terroir** (Améliorer 2 pétrole fixe, Enrôler nourriture +3$) |
| Adversaires | 3 bots — Frente Libre (Forge, Équilibré), Bayou (Atelier, Prédateur), Nations Souveraines (Fordisme, Bâtisseur) |
| Seed | 11 · difficulté normale · carte panamerica-v3 |
| Bonus de pose | **Ombre de l'Usine** (pièces par bâtiment adjacent à la Rouge River : 1→2$ · 2→4$ · 3→6$ · 4→9$) |
| Missions reçues | L'Émissaire · **Le Magnat** (12$+ et 3+ bâtiments) |

## Résultat final — victoire à la 6e étoile, tour 27

| Rang | Faction | Total | ⭐ | Détail (étoiles/territoires/ressources) | ♥ palier | $ |
|---|---|---|---|---|---|---|
| **1** | **Confédération (moi)** | **113** | **6** | 30 / 40 / 9 + 28$ + 6$ Ombre | 13 (×5/×4/×3) | 28 |
| 2 | Nations Souv. (bot) | 74 | 4 | 20 / 20 / 18 + 16$ | 18 | 16 |
| 3 | Frente Libre (bot) | 44 | 1 | 5 / 12 / 18 + 9$ | 15 | 9 |
| 4 | Bayou (bot) | 18 | 1 | 3 / 4 / 9 + 2$ | 5 | 2 |

Étoiles décrochées : 8 ouvriers (T8) · 4 mechas (T16) · 4 recrues (T17) · 6 améliorations (T19) · Puissance 16 (T26) · mission « Le Magnat » (T27, fin immédiate).

## Stratégie et moments clés

1. **Lecture de la carte avant de jouer** (`src/data/hexes.js`) : l'îlot de départ {29 forêt, 32 sierra, 36 village} est une forteresse naturelle — aucune faction en jeu n'a de riverwalk compatible avec ses rivières. Seul le désert #40 était exposé. Cette analyse a permis de jouer toute la partie sans jamais subir un seul combat.
2. **T1–T8, moteur économique** : Produce/Trade en alternance, mech Gué (riverwalk) au T4, 1re étoile (8 ouvriers) au T8. Le village #36 produit les ouvriers, #32 le métal, #40 le pétrole.
3. **Découverte rentable** : sur Terroir, chaque cube posé en colonne Enrôler rapporte **+3$ immédiats** — les améliorations n°1 et 2 y sont allées, ramenant Enrôler à 1 nourriture (l'enrôlement devient quasi gratuit et rapporte +3$ à chaque fois).
4. **T15–T19, accélération** : réordonnancement des améliorations (Déployer à 2 métal d'abord) → étoile mechas T16, étoile recrues T17. Poussée du héros escorté sur l'usine T18 : la carte **« Plan Directeur »** (1 pop → amélioration gratuite +1$) offre la 6e amélioration au T19 sans dépenser de pétrole — 4 étoiles au T20.
5. **Cluster de bâtiments autour de l'usine** : moulin #30, arsenal #26, mémorial #27, tous adjacents à la Rouge River → 6$ d'Ombre de l'Usine + 3 territoires, et la condition « 3 bâtiments » du Magnat.
6. **Fin calculée au point près (T24–T27)** : plutôt que de finir au T25 à ♥9 (palier ×4), deux Trade_pop ont monté la popularité à **13 pile** (palier ×5/×4/×3) avant de révéler Le Magnat — la 6e étoile met fin à la partie **avant** la phase des bots. Gain estimé : ~20 points. Le héros posté sur l'usine ajoute le bonus +2 territoires (40 pts de territoires au total).
7. **Recrues bien placées** : les 4 bonus permanents (♥/⚡/🃏/$) déclenchés par mes actions du bas et celles des voisins (Frente, Nations) ont rapporté en continu — la puissance est passée de 2 à 16 presque sans y consacrer de tours.

## Verdict sur les bots

- **Nations Souv. (Bâtisseur, Fordisme)** — le seul vrai rival (74 pts). Excellente courbe économique : 4 recrues très tôt, popularité 18 (étoile + palier ×5), 4 mechas, un objectif révélé. Mais il ne s'est jamais étendu (5 territoires) et n'a pas menacé militairement — il a laissé l'usine et tout le centre sans se battre.
- **Frente Libre (Équilibré, Forge)** — le grand gâchis : ⚡15, 4 mechas dès le T10, toutes capacités… et ses mechs ont campé sur #41 toute la partie. Aucune attaque, aucun piège posé en zone utile, 3 territoires à la fin. Son passage en « mode repli » (T12) l'a définitivement éteint alors qu'il avait l'armée la plus dangereuse du plateau.
- **Bayou (Prédateur, Atelier)** — paradoxal : profil agressif, mais il a accumulé 18 bois (!) sans presque rien construire d'autre qu'une gare et un arsenal, et son étiquette de « prédateur » ne s'est jamais traduite en attaque. 18 points, popularité 5, dernière place nette.
- **Constat transversal** : les bots développent correctement leur économie verticale (recrues, mechas, popularité) mais **ne contestent ni l'usine ni les territoires**, n'attaquent jamais un joueur qui affiche une défense visible, et ne convertissent pas leurs stocks (le Bayou est mort assis sur 9 paires de ressources). Un humain moyennement agressif les prive du centre sans résistance. Pistes : déclencher des attaques d'opportunité sur les hexes à butin, pousser un bot vers l'usine, et convertir les excédents de ressources en actions du bas.

## Notes de méthode

- Partie jouée intégralement via l'API (`POST /new`, `/act`, `/state`, `/journal`) — aucun navigateur.
- Réflexions consignées en cours de partie via `{"type":"note"}` (7 notes `PLAN:/DÉCISION:/MENACE:` retrouvables dans le journal, `cat: "note"`).
- Journal complet exporté dans `journal.json` (461 entrées, 27 tours).
