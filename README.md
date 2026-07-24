# Scythe Panamerica 1920+

Fan-made Scythe variant set in a dieselpunk North America. React + Vite, built as
a single self-contained HTML file (`panamerica_v09_build.html`) for offline play.
Une piste (`src/assets/audio/`) est embarquée dans ce fichier pour garantir de la
musique même sans rien d'autre à côté ; les autres pistes (`public/audio/`, à
distribuer avec le HTML) s'ajoutent au tirage aléatoire si le dossier est présent.

## Développement

```
npm install
npm run dev      # serveur de dev
npm run build    # build → dist/ + copie panamerica_v09_build.html + dossier audio/
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
public/audio/    bandes sons (mp3) chargées à la demande en jeu — pas embarquées
                 dans le HTML, doivent rester à côté de panamerica_v09_build.html
public/          autres assets statiques servis tels quels
scripts/         simulate.mjs — bot-vs-bot pour mesurer l'équilibrage des factions

docs/
  design/        documents de conception du projet (game design, lore, specs,
                  rapports de simulation, cadrages de refonte)
  reference/     règles et guides du Scythe original (Stonemaier) utilisés comme référence
  tools/         prototypes autonomes (éditeur de carte, planche d'icônes) — non
                  branchés au build principal
```
