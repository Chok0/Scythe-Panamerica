# Scythe Panamerica 1920+

Fan-made Scythe variant set in a dieselpunk North America. React + Vite, built as
a single self-contained HTML file (`panamerica_v09_build.html`) for offline play.

## Développement

```
npm install
npm run dev      # serveur de dev
npm run build    # build → dist/ + copie panamerica_v09_build.html
npm run sim      # simulateur de parties bot-vs-bot (équilibrage)
```

## Structure

```
src/
  components/    écrans React (setup, plateau, règles) + SVG (icônes, décor de carte)
  data/          factions, plateaux joueur, terrains, cartes combat, règles...
  logic/         moteur de jeu (mouvement, combat, production, bots)
  assets/        illustrations et blasons de faction (webp, optimisés pour le build inline)
  styles/        variables CSS et feuille de style globale
public/          assets statiques servis tels quels
scripts/         simulate.mjs — bot-vs-bot pour mesurer l'équilibrage des factions

docs/
  design/        documents de conception du projet (game design, lore, specs,
                  rapports de simulation, cadrages de refonte)
  reference/     règles et guides du Scythe original (Stonemaier) utilisés comme référence
  tools/         prototypes autonomes (éditeur de carte, planche d'icônes) — non
                  branchés au build principal
```
