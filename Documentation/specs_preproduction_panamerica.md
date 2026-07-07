# SCYTHE: PANAMERICA — Spécifications pré-production
## Document de synthèse — TOUTES DÉCISIONS VERROUILLÉES

*Version synchronisée — Mars 2026. Ce document consolide toutes les décisions des sessions de game design.*

---

# 1 — CADRE

- **Univers :** 1920+ (Jakub Różalski / Scythe)
- **Période :** 1920+ (parallèle à Scythe en Europa)
- **Géographie :** Amérique du Nord, du Canada au Mexique
- **ADN Scythe :** tours simples (top + bottom row), course aux 6 étoiles, engine-building > wargame
- **Joueurs :** 2-5 (base), 6 avec extension Dominion
- **Durée cible :** 90-120 min

---

# 2 — CARTE HEXAGONALE ✅ VERROUILLÉ

**Source de vérité : `panamerica_map.json`**
**Éditeur interactif : `panamerica_map_editor.html`**

### Dimensions
- **43 hex** (42 terrain + 1 Rouge River/Factory)
- **37 segments de rivière** délimitant 6 clusters de départ
- **6 home bases** hors-grille
- Rotation 90° CW du plateau Scythe original

### Terrains dédoublés

| Terrain Scythe | Variante A | Variante B | Ressource | Action bottom-row |
|:-:|:-:|:-:|:-:|:-:|
| Mountain | Montagne (3) | Sierra (3) | Métal | Deploy |
| Farm | Champs (3) | Plaine (4) | Nourriture | Enlist |
| Tundra | Toundra (3) | Désert (3) | Pétrole | Upgrade |
| Forest | Forêt (6) | — | Bois | Build |
| Village | Village (7) | — | Ouvriers | (via Produce) |
| Lake | Lac (6) | Marécage (4) | — (barrière) | — |

### Distribution des ressources
- Ouvriers : 7 hex | Nourriture : 7 | Pétrole : 6 | Métal : 6 | Bois : 6

### Cohérence géographique
- Toundra au nord, Désert au sud ✅
- Lacs/Marécages répartis comme barrières naturelles ✅

### Hex supprimés vs Scythe : #24, #39, #42, #43, #44
### Hex ajouté : #47

### Home Bases (hors-grille)

| Position | Faction | Couleur | Coordonnées |
|:--------:|---------|---------|:-----------:|
| NW | Dominion | Rouge (#CC2222) | (395, 65) |
| NE | Acadiane | Vert (#228B22) | (834, 79) |
| W | Nations Souveraines | Turquoise (#20B2AA) | (61, 356) |
| E | Bayou | Violet (#7B2D8B) | (945, 683) |
| SW | Confédération | Gris (#666) | (172, 829) |
| S | Frente Libre | Brun (#A05020) | (610, 944) |

### Rouge River (Factory)
- Hex #22 (501, 513) — type "factory"
- Centre du plateau
- Gardé par mecha Empire E1 au setup
- Vaut 3 territoires au scoring final (comme la Factory)

---

# 3 — FACTIONS ✅ VERROUILLÉ

## 3.1 Faction Abilities

| Faction | Nom | Effet | Modèle Scythe |
|---------|-----|-------|:-------------:|
| **Confédération** | **Servitude** | Combat gagné sur ouvriers → payer 2 pop → renvoyer 1 ouvrier ennemi sur son mat + déployer 1 ouvrier bonus. 2 max. | Original |
| **Frente Libre** | **Tierra Minada** | Poser Trap tokens (4 traps, pénalités cachées, comptent comme territoire) | = Maifuku (Togawa) |
| **Nations Souveraines** | **Esprit Sauvage** | Deploy mechas en Métal OU Bois (au choix) | ≈ Coercion |
| **Acadiane** | **Comptoir** | Poser Flag tokens (4 flags, scoring bonus, posables sur Lacs via Submerge) | = Exalt (Albion) |
| **Bayou** | **Chimère** | 1×/partie : capturer un mecha vaincu (PvP ou Empire) → 5e mecha permanent | Original |
| **Dominion** *(ext.)* | **Commerce Impérial** | 1×/tour : 1 ressource → 2 pièces OU 1 carte combat | ≈ Coercion inversée |

## 3.2 Mech Abilities (24 total)

| Faction | Speed | Riverwalk | Combat | Position |
|---------|:-----:|:---------:|:------:|:--------:|
| **Confédération** | +1 hex | **Gué** → Plaines, Villages | **Cavaliers** (+2 pui si bougé) | **Township** (villages ↔ RR adjacents) |
| **Frente Libre** | +1 hex | **Sentier** → Sierras, Déserts | **Peuple Armé** (+1 CC si ≥1 ouvrier) | **Terrier** (sierras adjacentes) |
| **Nations Souv.** | +1 hex | **Piste** → Plaines, Forêts | **Ronin** (+1 CC si mecha seul) | **Pack Up** (bâtiments mobiles) |
| **Acadiane** | +1 hex | **Portage** → Forêts, Villages | **White Flag** (refus → +2 pop) | **Submerge** (lac ↔ lac) |
| **Bayou** | +1 hex | **Mangrove** → Déserts, Villages | **Flibuste** (gagner → 2 pièces) | **Bayou Walk** (marécages adjacents) |
| **Dominion** *(ext.)* | +1 hex | **Queen's Road** → Forêts, Plaines | **Éclaireur** (voir main adverse) | **Sidle** (bâtiments ↔ unités adj.) |

## 3.3 Stats de départ (faction mat)

| Faction | Puissance | Cartes combat | Ouvriers | Hex ouvriers |
|---------|:---------:|:------------:|:--------:|:------------|
| Confédération | 4 | 1 | 2 | #36 (Village), #32 (Sierra) |
| Frente Libre | 2 | 3 | 2 | #41 (Champs), #45 (Sierra) |
| Nations Souv. | 3 | 2 | 2 | #10 (Forêt), #17 (Plaine) |
| Acadiane | 1 | 3 | 2 | #2 (Toundra), #6 (Plaine) |
| Bayou | 2 | 3 | 2 | #35 (Village), #28 (Forêt) |
| Dominion *(ext.)* | 3 | 2 | 2 | #0 (Toundra), #4 (Village) |

Note : Popularité et $ de départ viennent du **player mat** (aléatoire), pas du faction mat.

## 3.4 Héros + Compagnons

| Faction | Héros | Compagnon |
|---------|-------|-----------|
| Confédération | Jeremiah Cole | Dixie (coonhound) |
| Frente Libre | Emiliano Rojas | Trueno (cheval blindé) |
| Nations Souv. | Aiyana | Koda (bison) |
| Acadiane | Marguerite Thibodeau | Brume (héron bleu) |
| Bayou | Cap. Ézéchiel "Zeke" Lafontaine | Croc (alligator) |
| Dominion *(ext.)* | Col. James Whitfield | Sterling (loup gris) |

## 3.5 Paires d'opposition

| Paire | Conflit | Terrain contesté |
|-------|---------|:----------------:|
| Confédération ↔ Bayou | Servitude vs Chimère | Sud/marécages |
| Acadiane ↔ Dominion | Comptoir vs Commerce Impérial | Nord/lacs |
| Nations ↔ Frente | Esprit Sauvage vs Tierra Minada | Centre-Ouest |

## 3.6 Tokens faction sur le plateau

| Token | Faction | Nombre | Effet |
|-------|---------|:------:|-------|
| Trap (face cachée) | Frente | 4 | Pénalité au passage ennemi + territoire |
| Comptoir (face visible) | Acadiane | 4 | +1 territoire si contrôlé et pas adj. HB |

---

# 4 — PLAYER MATS ✅ VERROUILLÉ

## Système
- 4 colonnes : top-row (variable) / bottom-row (fixe : Upgrade/Deploy/Build/Enlist)
- Player mat aléatoire, indépendant de la faction
- 6 cubes d'upgrade par mat
- Σ coûts ≈ 10, Σ bonus $ ≈ 5-7

## 5 mats base

| # | Nom | Pop | $ | Top-Row (col 1→4) | Style |
|:-:|-----|:---:|:-:|:------------------:|-------|
| 1 | **Le Fordisme** | 2 | 4 | Move/Bolster/Produce/Trade | Rush mecha |
| 2 | **L'Atelier** | 2 | 5 | Trade/Produce/Bolster/Move | Bâtisseur |
| 3 | **Le Pionnier** | 2 | 6 | Move/Trade/Produce/Bolster | Investisseur |
| 4 | **La Forge** | 3 | 6 | Trade/Bolster/Move/Produce | Guerrier |
| 5 | **Le Terroir** | 4 | 7 | Move/Trade/Bolster/Produce | Fermier |

## 4 mats campagne (débloqués progressivement)

| # | Nom | Pop | $ | Top-Row | Originalité |
|:-:|-----|:---:|:-:|:-------:|-------------|
| 6 | **L'Expédition** | 2 | 5 | Move/Produce/Trade/Bolster | Conquérant polyvalent |
| 7 | **Le Raffineur** | 3 | 5 | **Produce**/Bolster/Move/Trade | Paire inédite Produce/Upgrade |
| 8 | **Le Corsaire** | 2 | 4 | Bolster/Trade/Produce/Move | Deploy 0$ + Build 3$ |
| 9 | **Le Diplomate** | 3 | 7 | Move/Produce/Trade/Bolster | Enlist à 1 Nourriture |

**Détails complets : `player_mats_panamerica.md`**

---

# 5 — EMPIRE PANAMERICAIN (PvE) ✅ VERROUILLÉ

## Concept
6 mechas Empire au setup, hostiles à tous. Force PvE animée par un deck de cartes. Vestiges d'un empire mort — machines qui obéissent à des ordres fantômes.

## Mechas Empire au setup

| Mecha | Hex | Terrain | Rôle |
|:-----:|:---:|---------|------|
| E1 | #22 | Rouge River | Gardien de Rouge River |
| E2 | #15 | Montagne | Bloque accès central |
| E3 | #23 | Désert | Patrouille Est |
| E4 | #26 | Plaine | Patrouille Ouest |
| E5 | #30 | Champs | Carrefour Sud |
| E6 | #27 | Village | Obstacle centre-Est |

## Règles de déplacement
- Traversent **toutes les rivières** (l'Empire les a construites)
- Ne traversent **PAS les lacs** ni les **marécages**

## Sous-deck Direction (20 cartes)
- À la **fin de son tour**, le joueur actif tire 1 carte
- La carte montre **2 directions** (parmi les 6 d'un hex pointy-top)
- Le joueur **choisit** 1 direction et déplace le **mecha Empire le plus proche** de lui
- Si le mecha entre sur un hex occupé → combat immédiat résolu par le joueur visé

## Sous-deck Combat Empire (12 cartes)
- Puissance de 1 à 12
- Chaque carte a un nom et un texte lore
- Distribution : 33% facile (1-3), 25% moyen (4-6), 25% dur (7-9), 17% boss (10-12)
- Moyenne : 5.3

## Récompenses (au choix après victoire)

| Option | Effet |
|--------|-------|
| 2 Métal | Ferraille du mecha |
| 1 Fragment Tesla | Composant technologique |
| +2 Popularité | Acclamation populaire |

## Objectif Libérateur
Premier joueur à détruire 3 mechas Empire → 1 étoile (unique).

**Détails complets : `deck_empire_panamerica.md`**

---

# 6 — FRAGMENTS TESLA & ROUGE RIVER ✅ VERROUILLÉ

## Fragments Tesla
Jetons qui débloquent l'accès aux Plans Tesla à Rouge River. Seuil : **2 Fragments**.

**Obtention :**
1. **Sur la carte** — jetons placés au setup (2-4 selon nombre de joueurs)
2. **Récompense Empire** — choix après combat gagné
3. **Rencontre #6** (Le Dépôt de Trains) — choix narratif

| Joueurs | Fragments sur carte |
|:-------:|:------------------:|
| 2 | 2 |
| 3-4 | 3 |
| 5-6 | 4 |

## Rouge River — accès
- Héros entre pour la première fois → regarde les cartes Factory
- **Sans Fragments** → voit uniquement Plans Ford (5 cartes)
- **Avec 2+ Fragments** → voit Ford + Tesla (10 cartes)
- Choisit 1, repose les autres
- 1er joueur voit N+1 cartes, chaque suivant 1 de moins

## Wardenclyffe
**DÉCISION : pas de lieu Wardenclyffe sur la carte.** Les Plans Tesla fonctionnent comme des cartes Factory normales, récupérées à Rouge River.

---

# 7 — PLANS FORD & TESLA (cartes Factory) ✅ VERROUILLÉ

## 5 Plans Ford (industriels, fiables, cash)

| # | Nom | Top-Row | Bottom-Row |
|:-:|-----|---------|------------|
| F1 | Model M | Produce ×2 par ouvrier | Deploy 2M → 2$ |
| F2 | Trimotor | Move 3 hex (ignore rivières) | Upgrade 2P → 1$ |
| F3 | River Rouge Special | Téléport 3 ressources entre hex | Build 2B → 2$ |
| F4 | Iron Horse | Move → Mine (gratuit) | Enlist 2N → 2$ |
| F5 | Five Dollar Day | −2$ → +2 Pop + 1 ouvrier | Upgrade 1P → 3$ |

## 5 Plans Tesla (expérimentaux, puissants, coûteux)

| # | Nom | Top-Row | Bottom-Row |
|:-:|-----|---------|------------|
| T1 | Golem | Move 1 mecha 2 hex à distance | Deploy 3M → +2 Pui permanent |
| T2 | L'Onde Tesla | +1 Pui mechas rayon 2 du héros | Build 3B → effet sans ouvrier |
| T3 | Éclair | Move 1 mecha 4 hex | Bolster gratuit (3 Pui ou 2 CC) |
| T4 | Le Blueprint Perdu | Copie n'importe quelle top-row | Enlist 3N → ongoing étendu |
| T5 | Réseau Neuronal | Move TOUS mechas 1 hex | Deploy 2M+1P → adjacence temp. |

**Détails complets : `plans_ford_tesla_objectifs.md`**

---

# 8 — DECK DE RENCONTRES ✅ VERROUILLÉ

15 cartes, 3 choix chacune (agressif / diplomate / opportuniste).

| # | Nom | Thème |
|:-:|-----|-------|
| 1 | L'Épave Fumante | Mecha mort |
| 2 | Le Pont Coupé | Infrastructure détruite |
| 3 | La Mine Abandonnée | Ressources cachées |
| 4 | Le Convoi de Réfugiés | Humanité |
| 5 | Le Prêcheur au Carrefour | Religion / milice |
| 6 | Le Dépôt de Trains | Rail / technologie (donne Fragment Tesla) |
| 7 | La Fête du Village | Culture populaire |
| 8 | Le Mécanicien Errant | Compétence / mercenariat |
| 9 | Le Champ de Pétrole | Ressource / sacré |
| 10 | Le Télégraphe Fantôme | Information / espionnage |
| 11 | Le Cimetière de Mechas | Mémoire / ferraille |
| 12 | La Contrebandière | Commerce / underground |
| 13 | Le Barrage | Infrastructure / énergie |
| 14 | Les Enfants du Mecha | Humanité / survie |
| 15 | Le Dernier Gouverneur | Politique / reddition |

**Détails complets : `deck_rencontres_panamerica.md`**

---

# 9 — OBJECTIFS SECRETS ✅ VERROUILLÉ

12 cartes. Setup : chaque joueur reçoit 2, garde 1. Révélation = 1 étoile.

| # | Nom | Condition | Catégorie |
|:-:|-----|-----------|:---------:|
| 1 | Le Libérateur | 4+ hex non adjacents à HB | Territorial |
| 2 | L'Industriel | 8+ ressources sur le plateau | Économique |
| 3 | Le Diplomate | 13+ Popularité | Social |
| 4 | Le Stratège | Contrôler Rouge River + 1 adj. | Territorial |
| 5 | Le Bâtisseur | 3 bâtiments sur 3 terrains différents | Infrastructure |
| 6 | Le Nomade | Héros à 5+ hex de HB | Territorial |
| 7 | Le Marchand | 16+ pièces | Économique |
| 8 | Le Guerrier | 3+ mechas déployés | Militaire |
| 9 | Le Réseau | 2+ hex avec Mines | Infrastructure |
| 10 | L'Éclaireur | 2+ rencontres résolues | Social |
| 11 | Le Colonisateur | 6+ ouvriers sur le plateau | Productif |
| 12 | Le Fantôme | 1+ unité + 2+ hex au-delà d'une rivière | Territorial |

---

# 10 — SCORING BÂTIMENTS ✅ VERROUILLÉ

6 tuiles, 1 tirée aléatoirement au setup. Même barème que Scythe.

| # | Condition |
|:-:|-----------|
| 1 | Adjacent à des **Mines** (tunnel) |
| 2 | Adjacent à des **Lacs ou Marécages** |
| 3 | Adjacent à des **jetons Rencontre** |
| 4 | Sur des hex **Mine** |
| 5 | En **ligne** (rangée la plus longue) |
| 6 | Sur des **Plaines ou Déserts** |

## Bâtiments (4, identiques pour tous)

| Bâtiment | Effet |
|----------|-------|
| Arsenal | Bolster : +1 Puissance supplémentaire |
| Mémorial | Bolster : +1 Popularité supplémentaire |
| Mine | Tunnel personnel (connecté aux autres Mines et à RR) |
| Moulin | Produce : hex produit comme si +1 ouvrier |

---

# 11 — SCORING FINAL

Même système que Scythe. Multiplicateur basé sur la popularité :

| Popularité | × par étoile | × par territoire | × par 2 ressources |
|:----------:|:------------:|:-----------------:|:-------------------:|
| 0-6 | 3$ | 2$ | 1$ |
| 7-12 | 4$ | 3$ | 2$ |
| 13-18 | 5$ | 4$ | 3$ |

Plus : pièces restantes + bonus tuile scoring bâtiments.

---

# 12 — ÉTOILES (piste de triomphes)

6 étoiles pour finir la partie (comme Scythe) :

| Étoile | Condition |
|--------|-----------|
| ⭐ | 6 upgrades complétés |
| ⭐ | 4 mechas déployés |
| ⭐ | 4 bâtiments construits |
| ⭐ | 4 recrues enrôlées |
| ⭐ | 8 ouvriers sur le plateau |
| ⭐ | Objectif secret révélé |
| ⭐ | Combat PvP gagné (max 2 étoiles) |
| ⭐ | 18 Popularité atteinte |
| ⭐ | 16 Puissance atteinte |
| ⭐ | Libérateur (3 mechas Empire détruits, 1 seul joueur) |

---

# 13 — DOCUMENTS DE RÉFÉRENCE

| Fichier | Contenu | Statut |
|---------|---------|:------:|
| `panamerica_map.json` | Export carte (43 hex, 37 rivières, 6 HB) | ✅ Source de vérité |
| `panamerica_map_editor.html` | Éditeur interactif | ✅ Outil |
| `faction_abilities_v2_dominion.md` | 6 abilities + 24 mechas + stats + héros | ✅ Verrouillé |
| `catalogue_mech_abilities_complet.md` | Catalogue complet + Scythe référence | ✅ Verrouillé |
| `correspondance_terrains_panamerica.md` | Grille terrain/ressource | ✅ Verrouillé |
| `player_mats_panamerica.md` | 9 player mats (5 base + 4 campagne) | ✅ Verrouillé |
| `deck_empire_panamerica.md` | 20 direction + 12 combat + Fragments | ✅ Verrouillé |
| `deck_rencontres_panamerica.md` | 15 rencontres narratives | ✅ Verrouillé |
| `plans_ford_tesla_objectifs.md` | 10 Plans Factory + 12 objectifs secrets | ✅ Verrouillé |
| `roadmap_panamerica_proto.md` | Feuille de route 10 phases | ✅ À jour |

---

# 14 — À DÉFINIR (POST-PROTO)

| Élément | Priorité | Notes |
|---------|:--------:|-------|
| Positions Fragments Tesla sur la carte | Rapide | Hex prédéfinis, éloignés de RR et entre eux |
| Structure de la campagne | Longue | Déblocage des 4 mats campagne + scénarios |
| Concept art / visuels factions | Créatif | Pré-production visuelle |
| Proto numérique | Code | Toutes les specs sont prêtes |

---

*Spécifications pré-production v2 — Mars 2026. Toutes phases débloquées. Prêt pour le proto numérique.*
