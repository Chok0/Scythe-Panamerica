# Compte rendu — Partie Scythe Panamerica à l'aveugle (Bayou / Atelier, seed 23)

## Configuration

| Paramètre | Valeur |
|---|---|
| Faction jouée | **Bayou** (Cap. Zeke) — Sang du Marais, Mangrove (riverwalk champs/village) |
| Plateau | **2 — Atelier** (Trade·Upgrade / Produce·Deploy / Bolster·Build / Move·Enlist) |
| Adversaires | 3 bots **à l'aveugle** (`blind:true`, profils masqués) : Nations Souv. (Fordisme), Acadiane (Terroir), Frente Libre (Forge) |
| Seed | 23 · Mode API (`scripts/apiServer.mjs`, port 4674) |
| Bonus de pose | Monts & Forêts (bâtiments sur montagne/sierra/forêt : 1→2$ · 2→4$ · 3→6$ · 4→9$) |
| Missions en main | Le Gardien de l'Usine / **Le Magnat** (12$ + 3 bâtiments) |

## Résultat final (fin au tour 36, par 6e étoile de Frente)

| Rang | Faction | Score | Étoiles | Pop (palier) | Détail |
|---|---|---|---|---|---|
| 1 | Frente Libre (bot) | **112** | 6 | 15 (13-18, ×5/×4/×3) | ⭐30 + terr. 40 + res. 27 + 11$ + 4$ pose |
| 2 | Acadiane (bot) | **92** | 5 | 12 (7-12) | ⭐20 + terr. 30 + res. 6 + 26$ + comptoirs |
| **3** | **Bayou (moi)** | **67** | **5** | **8 (7-12)** | ⭐20 + terr. 21 + paires 10 + **7$ + bonus pose 9$** |
| 4 | Nations Souv. (bot) | **47** | 5 | 6 (0-6) | ⭐15 + terr. 10 + res. 6 + 14$ |

Mes 5 étoiles : 8 ouvriers (T5), 4 mechas (T14), 4 recrues (T21), étoile de combat (T26, victoire défensive 12 v 9 contre le héros Nations), 4 bâtiments (T33). Les 4 bâtiments étaient tous sur terrain Monts & Forêts (bonus maximal 9$).

## Déroulé stratégique

1. **T1-T7 — moteur économique** : ouvriers au village 35 jusqu'à l'étoile des 8 (T5), métal via la montagne 31 (+ moulin qui double), sortie d'îlot par le marécage 20 (Sang du Marais).
2. **T7-T14 — les 4 mechas** (Atelier = Déployer sous Produire, très fluide) : Mangrove d'abord (ouvre 38, le champ voisin, à toutes mes unités), puis Vitesse, Flibuste, Pirogue.
3. **T15-T21 — la carte d'usine « Plan Directeur »** (1♥ → Améliorer OU Enrôler gratuit, +1$) prise en arrivant 1er à la Rouge River : elle a payé la 4e recrue gratuitement et 2 améliorations (3e hex de production, Bolster +4 avec arsenal). Rencontres bien monnayées (+1 recrue pour 3$, +pop/bois/métal).
4. **T26 — victoire défensive clé** : le héros Nations m'attaque sur 26 ; je défends à fond (7⚡ + carte 5 = 12 contre 9) → étoile de combat, leur héros renvoyé, leur ⚡9→2.
5. **T29 — pivot décisif** (bonne lecture) : finir vite à 6⭐ = défaite au score. Doctrine « armer les déclencheurs (pui16, Magnat), fermer au moment optimal » ; puis découverte T35 que **Frente était le vrai leader caché** (~105+ : palier pop 3, 19 ressources dont 8 métal non défendues en 45, héros campé sur l'usine avec 9 ressources en bagage, pièges comptant comme territoires).
6. **T35-T36 — course finale perdue d'un tour** : plan de fermeture en double frappe (héros vole les 7 nourriture de Nations en 17 SANS combat + m3 attaque l'usine par le rail 16→22 : 2e étoile de combat = ⭐6 + vol des 9 ressources + retrait du bonus usine de Frente, ~30 pts de swing). Pendant la phase des bots du T36, **Acadiane attaque Frente sur l'usine et perd 2 v 6** : 2e étoile de combat OFFERTE à Frente = 6 étoiles = fin immédiate.

## Réflexions et leçons (consignées en notes dans le journal)

- **Ce qui a marché** : l'économie Atelier (Produire/Déployer même colonne), le moulin sur montagne, la carte Plan Directeur (≈3 actions gratuites), les 4 bâtiments 100 % Monts & Forêts (9$), la défense totale au T26 (l'attaquant gagne les égalités — en défense il faut viser strictement plus), le repli devant la mobilisation Frente (aucune perte matérielle de toute la partie), et la bascule tardive vers le « scoring d'abord, étoiles ensuite ».
- **Erreurs identifiées** :
  - T15 : transport par défaut — le mecha a embarqué le mineur de 31 et son métal vers un marécage stérile (toujours expliciter `workers`/`res` dans `move_unit`).
  - Pop trop longtemps négligée (la production à 8 ouvriers coûte 1♥/tour) : j'ai fini à 8, un palier 3 (13+) valait ~+20 pts.
  - **Sous-estimation du score caché des bots** : je n'ai audité le plateau complet (stocks adverses) qu'au T35. Frente accumulait 19 ressources en palier 3 depuis des tours. Il fallait raider plus tôt (le stock de 8 métal en 45 n'était gardé que par 1 ouvrier, mais inaccessible au Bayou — à intégrer dès le choix des cibles).
  - La fin par 6e étoile appartient à QUI la déclenche : à 3 joueurs simultanément à ⭐5, chaque tour de « farming » était une roulette. Ma fenêtre de fermeture propre existait au T36 (attaque m3 immédiate, sans le vol en 17) — j'ai préféré +1 tour de préparation, et l'aléa Acadiane→Frente a fermé la partie à ma place.
- **À l'aveugle** : sans les profils, j'ai raisonné en pire cas règles (engagement max 7 + valeur de carte max) pour mes combats, et en lecture comportementale (Frente passif 10 tours → prise de risque mesurée sur 38 ; leur mobilisation T27 → évacuations préventives de 31 et 34).

## Fichiers

- `journal.json` — export complet (668 entrées, 36 tours, 11 notes stratégiques `cat:"note"`).
