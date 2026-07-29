---
name: jouer-scythe
description: >
  Jouer une partie de Scythe Panamerica en tant qu'agent, via le mode API
  headless (sans navigateur, token-efficient). Utiliser ce skill dès qu'on
  demande de jouer une partie, un playtest, une partie solo ou « à l'aveugle »,
  d'évaluer les bots en jouant contre eux, ou de produire un journal/rapport de
  partie — même si la demande ne mentionne ni « API » ni « headless ». Contient
  le protocole complet, la checklist stratégique et les conventions de journal.
---

# Jouer une partie de Scythe Panamerica (mode API)

Vous allez jouer une vraie partie contre les bots du jeu. Deux objectifs à la
fois : **jouer pour gagner** (c'est ce qui rend le playtest informatif) et
**laisser une trace exploitable** (journal annoté + post-mortem). Le
propriétaire du repo utilise vos parties pour améliorer l'IA des bots — un
agent qui joue mou ou qui ne note rien ne sert à rien.

## Démarrage (3 commandes)

```bash
export SCYTHE_API_PORT=4600                      # changez-le si le port est pris
node scripts/apiServer.mjs $SCYTHE_API_PORT &    # le serveur (une fois)
P=.claude/skills/jouer-scythe/scripts/pilot.mjs
node $P map                                      # la carte, à lire UNE fois
node $P new '{"faction":"confederation","mat":5,"bots":3,"seed":42}'
```

Puis, à chaque tour :

```bash
node $P act g1 '{"type":"produce","hexes":[36,32]}' '{"type":"skip_bottom"}' '{"type":"end_turn"}'
```

`pilot.mjs` imprime un résumé compact (~20 lignes) au lieu du JSON complet —
c'est lui qui rend la partie économe en tokens. `full g1` donne le JSON brut
si un détail manque ; il ne devrait presque jamais servir.

**Avant la première partie seulement** : lire
`references/regles_condensees.md` (règles, scoring, factions, plateaux —
5 min). En cas de doute pointu en cours de partie, la grammaire détaillée est
dans `docs/reference/mode_api.md` ; la source de vérité est `src/data/`.

Config utile de `new` : `faction` (confederation/frente/nations/acadiane/
bayou/dominion), `mat` (1-6), `bots` (1-4), `seed` (reproductibilité),
`blind:true` (masque les profils des bots — OBLIGATOIRE pour un playtest
« honnête » où vous ne devez pas connaître leurs tempéraments).

## La boucle d'un tour

1. Lire le résumé (déjà imprimé par le dernier `act`).
2. Décider la colonne en suivant la checklist ci-dessous.
3. Envoyer les actions **en lot** dans un seul appel `act` : haut → bas →
   `end_turn`. Le pilote s'arrête à la première action refusée avec le
   message d'erreur et les actions légales : corriger et repartir — une
   erreur ne coûte rien, l'état n'est jamais corrompu. Sonder un coup
   illégal est donc un moyen légitime d'obtenir de l'information (portées de
   déplacement notamment).
4. Les tours des bots s'exécutent pendant `end_turn` : leurs actions arrivent
   dans les événements. Si un bot vous attaque, le lot s'interrompt sur
   `⚔ COMBAT defense` — répondre par `{"type":"combat","power":N,"cards":[…]}`.

États d'attente → réponse : `move`→`move_unit`/`end_move` ·
`bottom`→`bottom_*`/`skip_bottom` · `turn_end`→`reveal`/`end_turn` ·
`combat`→`combat` · `encounter`→`encounter` · `factory_offer`→`factory_pick` ·
`rails`→`rail`×3.

## Checklist stratégique (à dérouler à CHAQUE tour)

**1. Le tempo d'abord.** Quel est mon chemin le plus court vers 6 étoiles, et
qu'est-ce que ce tour y contribue ? Un tour qui ne produit ni étoile, ni
ressource pour une action du bas, ni position, est un tour perdu. Les étoiles
bon marché à planifier tôt : 8 ouvriers, 4 recrues, ⚡16 (Bolster + Arsenal),
♥18 (voir point 3), missions secrètes (les lire au tour 1 — certaines se
remplissent en passant).

**2. Haut ET bas.** Le tour idéal joue les deux étages de la colonne. Avant
de choisir : ai-je les ressources pour un bas ? Sinon, quelle colonne me les
donne pour le bas du tour SUIVANT ? (Enchaînement classique : Trade métal →
Deploy ; Produce bois → Build ; Produce nourriture → Enlist.) Penser à
`lastCol` : ne pas se coincer en jouant deux fois de suite la colonne dont on
aura besoin.

**3. La popularité se calcule, elle ne s'achète pas à +1.** Le palier final
(≥7, idéalement ≥13) vaut des dizaines de points. Les bons canaux : enlist
colonne Deploy (+2♥ immédiat), Mémorial puis Bolster (+1♥/tour), recrue
permanente Build (+1♥ à chaque Build, voisins compris), rencontres. Le Trade
+1♥ sec est un tour faible ; il ne devient correct qu'avec l'amélioration
(+2). Éviter de finir à 6 ou 12 : 1 pop de plus change le multiplicateur.

**4. Puissance = munitions + dissuasion.** Sous ⚡5 en milieu de partie, vous
êtes une cible (les bots calculent leur espérance de pillage). Avant de
laisser héros ou mecha isolé sur un hex riche : combien un attaquant
gagnerait-il, et puis-je me défendre à +cartes ? Rappel : l'ATTAQUANT gagne
les égalités — attaquer à parité est rentable, surtout pour casser le tempo
du leader ; consolider l'hex au tour suivant.

**5. Les rencontres sont un revenu.** Le résumé marque 📜 les hexes à jeton.
Router le héros pour en ramasser « en passant » entre deux objectifs — c'est
souvent 2-3 ressources ou 2♥ gratuites par détour d'un hex.

**6. La course à l'Usine (T10-T14).** La carte d'usine est une 5e colonne,
souvent la meilleure action du plateau. Premier arrivé = meilleur choix, et
l'hex vaut 3 territoires au score. Ne pas y aller après le T16 si le détour
coûte 2 tours.

**7. Le bonus de pose se lit au tour 1.** Chaque bâtiment se place en
fonction (ligne POSE du résumé) : 4 bâtiments bien placés = 9$ au score.
Moulin sur l'hex que vous produirez le plus ; Gare quand le réseau raccourcit
VOTRE trajet clé (le réseau est partagé — ne pas ouvrir d'autoroute au
voisin agressif).

**8. Avant `end_turn`, deux vérifications.** (a) Une mission « RÉVÉLABLE » ?
La révéler (`reveal`) — l'étoile n'attend pas. (b) Si c'est potentiellement
ma 6e étoile : suis-je DEVANT au score ? Finir en étant 2e fige sa défaite.
Estimation rapide : étoiles×A + territoires×B + paires×C + pièces (A/B/C
selon palier — voir règles condensées).

## Conventions de journal (obligatoires)

Consigner via `{"type":"note","msg":"…"}` — apparaît dans le journal exporté
(`cat:"note"`), c'est la matière première de l'analyse post-partie :

- `PLAN:` au tour 1 (chemin d'étoiles visé + rôle de la faction) puis à
  chaque inflexion (~tous les 5 tours).
- `DÉCISION:` quand un choix non évident est fait (et l'alternative rejetée).
- `MENACE:` quand un adversaire devient dangereux (qui, où, pourquoi).
- `LEÇON:` quand le jeu vous surprend (règle, bot, carte) — c'est ce qui
  nourrit l'amélioration des bots.

2-4 notes par partie de plus que ça serait du bruit ; zéro note = playtest
inexploitable.

## Fin de partie

1. `node $P journal g1 docs/design/journal_partie_claude_AAAAMMJJ.json`
2. Écrire un post-mortem court dans `docs/design/` (modèle :
   `playtest_claude_20260728.md`) : résultat, 3-5 moments clés, verdict sur
   les bots (vous ont-ils menacé ? attaqué à bon escient ?), bugs ou
   frictions rencontrés, une suggestion d'équilibrage argumentée.
3. Si on vous a demandé de committer : ajouter journal + post-mortem, jamais
   les fichiers temporaires.

## Économie de tokens — les règles qui comptent

- Un appel `act` par tour (actions en lot), pas un par action.
- Jamais de `full`/`GET state` de routine : le résumé compact suffit ; `map`
  une seule fois.
- Ne pas relire les règles ou le code en cours de partie — tout ce qui se
  joue est dans le résumé, l'erreur d'action légale vous corrige au besoin.
- Réfléchir bref : 2-3 phrases de délibération par tour suffisent pour un
  tour standard ; garder l'analyse longue pour les combats et la fin de
  partie. Une partie complète doit tenir en ~25-30 tours et coûter de l'ordre
  de 100 appels `act`.
