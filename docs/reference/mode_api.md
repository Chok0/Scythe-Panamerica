# Mode API — jouer à Scythe Panamerica sans navigateur

Moteur headless (`src/logic/headlessGame.js`) + serveur HTTP mince
(`scripts/apiServer.mjs`). Pensé pour qu'un agent (Claude, script, autre IA)
joue une partie complète en JSON, sans pilotage graphique : l'état public fait
~4-6 Ko par tour, contre des dizaines de captures d'écran en Playwright.

Le moteur réutilise les modules du jeu réel (`movement`, `transport`,
`production`, `mats`, `pvpBots`, `cards`, `factory`, `bot`) — les bots sont
exactement ceux de l'application et du simulateur.

## Démarrage

```bash
npm run api            # port 4600 (ou : node scripts/apiServer.mjs 4655)
```

| Route | Corps | Effet |
|---|---|---|
| `POST /new` | `{faction?, mat?, bots?, difficulty?, seed?, maxRounds?, blind?, factionsBots?, structureBonus?}` | crée une partie → `{gameId, etat}` |
| `GET /state?g=ID` | — | état public + `actionsLegales` |
| `POST /act?g=ID` | une action (grammaire ci-dessous) | joue → `{ok, events, etat}` ; erreur → 422 `{error, actionsLegales}` |
| `GET /journal?g=ID` | — | journal complet au format des sauvegardes du jeu |
| `GET /games` | — | liste des parties en mémoire |
| `DELETE /game?g=ID` | — | supprime la partie |

`seed` rend la partie reproductible (RNG par instance : plusieurs parties
seedées peuvent tourner dans le même process). `blind:true` masque les profils
des bots (mode « à l'aveugle » pour les playtests honnêtes). Le siège 0 est
toujours le joueur API ; `bots` (1-4) adversaires pilotés par l'IA du jeu.

Le moteur est aussi utilisable directement en Node, sans serveur :

```js
import { HeadlessGame } from './src/logic/headlessGame.js';
const g = new HeadlessGame({ faction: 'confederation', mat: 5, bots: 3, seed: 42 });
g.publicState();                       // état + actionsLegales
g.act({ type: 'bolster', pick: 'power' });  // → {ok, events} | {ok:false, error}
```

## La boucle de jeu

1. `GET /state` → lire `attente` et `actionsLegales`.
2. Si `attente` est `null` : choisir une **action du haut** (une colonne ≠
   `lastCol`) ou `pass_turn`.
3. Suivre les états d'attente jusqu'à `turn_end`, puis `end_turn` — les bots
   jouent alors leur tour dans la foulée (leurs actions arrivent dans `events`).
4. Répéter jusqu'à `fini:true` → `resultat.classement`, puis `GET /journal`.

L'enchaînement d'un tour : `action du haut` → (selon l'action) `move` /
rencontre / usine → `bottom` (action du bas de la même colonne, ou
`skip_bottom`) → `turn_end` (révélations de missions possibles) → `end_turn`.

### États d'attente (`attente.kind`)

| `kind` | Vous devez répondre par |
|---|---|
| `move` | `move_unit` (encore `movesLeft` unités) ou `end_move` |
| `bottom` | `bottom_upgrade` / `bottom_deploy` / `bottom_build` / `bottom_enlist` ou `skip_bottom` |
| `turn_end` | `reveal` (mission accomplie — l'étoile !) ou `end_turn` |
| `combat` | `combat` (voir plus bas) |
| `encounter` | `encounter` avec l'option choisie |
| `factory_offer` | `factory_pick` (`cardId` de l'offre, ou `"none"`) |
| `rails` | `rail` ×3 après construction d'une Gare |

## Grammaire des actions

```jsonc
// ── haut de colonne ──
{"type":"move_unit", "unit":"hero"|"<id mech>"|"<id ouvrier>", "to":36,
 "workers":2,                  // mech/héros : ouvriers transportés (option)
 "res":{"metal":2},            // ressources transportées (option)
 "capture":true,               // capturer un ouvrier adverse (Servitude…)
 "flag":true, "trap":true}     // poser comptoir (Acadiane) / piège (Frente)
{"type":"end_move"}            // termine le déplacement (même à 1 seule unité)
{"type":"move_coin"}           // colonne Déplacer sans bouger : +1$
{"type":"trade", "buy":[{"res":"metal","hex":36},{"res":"bois","hex":36}]}
{"type":"trade_pop"}           // Commerce : +1♥ (ou +2 avec l'amélioration)
{"type":"bolster", "pick":"power"|"cards"}
{"type":"produce", "hexes":[36,32]}   // hexes ouvriers, moulin compté en bonus
{"type":"factory_top"}                // carte Rouge River (5e colonne)
{"type":"factory_move", "unit":"hero", "to":22}  // bas de carte usine : 1 unité, 2 hex

// ── bas de colonne (après le haut de la MÊME colonne) ──
{"type":"bottom_upgrade", "from":1, "to":2}   // cube du haut col 1 → bas col 2
{"type":"bottom_deploy", "hex":36, "slot":1}  // mech sur hex ouvrier ; slot 0=Vitesse 1=riverwalk
{"type":"bottom_build", "building":"moulin", "hex":36}
{"type":"bottom_enlist", "section":1, "recruit":1}  // section libérée, recrue (bonus 🤝)
{"type":"skip_bottom"}

// ── réponses aux attentes ──
{"type":"combat", "power":4, "cards":[3,2]}   // cards = VALEURS de votre main
{"type":"encounter", "option":1}
{"type":"factory_pick", "cardId":"ford_03"}   // ou "none"
{"type":"rail", "from":14, "to":15}
{"type":"reveal", "which":"objective0"|"objective1"|"faction"}
{"type":"end_turn"}  {"type":"pass_turn"}

// ── journal de réflexion (consigné, ne joue rien) ──
{"type":"note", "msg":"PLAN: usine T13 · MENACE: Whitfield ⚡16 à 2 hex"}
```

Toute action illégale est refusée avec un message explicite (`422` +
`actionsLegales`) et **ne corrompt jamais la partie** — on peut sonder les
coups sans risque. Exemple : un `move_unit` vers un hex hors de portée répond
`#99 hors de portée depuis #36 (accessibles: 22,35,37)`.

## Combat

- En **attaque** (vous entrez sur un hex défendu), `attente` devient
  `combat` avec `maxPower` (≤7 et ≤ votre ⚡) et `maxCards` (≤ vos unités
  combattantes sur l'hex + bonus).
- En **défense** (un bot vous attaque pendant `end_turn`), même chose — mais
  l'engagement du bot est **secret** : l'état public ne l'expose jamais.
- `cards` liste des **valeurs** de votre main (`moi.cartes`, ex. `[2,5]`).
- L'attaquant gagne les égalités. Le perdant retraite à sa base, abandonne
  les ressources de l'hex, et touche 1 carte de consolation si son engagement
  était ≥1. Étoile de combat pour le vainqueur (2 max).

## Conseils d'économie de tokens (agents)

- `etat` est renvoyé par `POST /act` — inutile de refaire `GET /state` après
  chaque coup.
- `plateau` ne liste que les hexes occupés/marqués ; `adversaires` donne les
  positions et stats publiques. En début de partie, mémorisez la carte une
  fois (`src/data/hexes.js` ou la doc des règles) plutôt que de redemander.
- Consignez vos intentions avec `{"type":"note"}` — elles se retrouvent dans
  le journal exporté (`cat: "note"`), pour l'analyse post-partie et
  l'amélioration des bots (conventions : `PLAN:` / `DÉCISION:` / `MENACE:`).
- Une partie complète ≈ 25-30 tours ≈ 80-120 appels `act`.

## Session curl de démonstration

```bash
npm run api &
curl -s -X POST localhost:4600/new -d '{"faction":"confederation","mat":5,"bots":3,"seed":42}'
# → {"gameId":"g1", "etat":{...,"actionsLegales":[...]}}
curl -s -X POST 'localhost:4600/act?g=g1' -d '{"type":"produce","hexes":[36,32]}'
curl -s -X POST 'localhost:4600/act?g=g1' -d '{"type":"skip_bottom"}'
curl -s -X POST 'localhost:4600/act?g=g1' -d '{"type":"end_turn"}'
curl -s 'localhost:4600/journal?g=g1' > journal.json
```

## Limites connues

- Parties en mémoire uniquement (pas de persistance serveur) — exportez le
  journal avant d'arrêter le process.
- Le siège API est forcément le siège 0 ; pas encore de mode
  humain-contre-Claude via ce serveur (prévu : deux sièges non-bot).
- Mécaniques campagne (bots Empire) désactivées, comme dans le simulateur.
