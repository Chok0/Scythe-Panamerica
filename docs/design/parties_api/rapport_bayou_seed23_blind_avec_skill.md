# Playtest Claude — Bayou / Atelier, partie à l'aveugle (seed 23)

- **Config** : faction `bayou`, plateau 2 (Atelier), 3 bots, `seed 23`, `blind:true` (aucune info sur les tempéraments des bots), mode API headless (port 4673).
- **Résultat** : **2e / 4 — 72 points en 31 tours** (fin déclenchée par ma 6e étoile).
- **Classement final** : 1. Frente **84** (⭐4 · 6 terr · 5 paires · 15$) · 2. **Bayou 72** (⭐6 · 9 terr · 2 paires · 13$) · 3. Nations 70 · 4. Acadiane 64.
- **Mes 6 étoiles** : 8 ouvriers (T11) · mission « Gardien de l'Usine » (T12) · 4 mechas (T17) · 4 recrues (T24, via la carte d'usine Plan Directeur) · victoire de combat ×2 (T28 vs Acadiane, T31 vs Frente). La mission « Le Magnat » était RÉVÉLABLE en réserve mais n'a jamais servi.

## Déroulé — 5 moments clés

1. **T8–T12 : la course à l'Usine gagnée par les marécages.** Découverte en jouant : le riverwalk champs+village est réservé aux mechas (slot 1), le héros ne traverse pas les rivières. Le vrai atout Bayou est le passage gratuit et sans arrêt des marécages (31→28→20→23→27→22). Premier arrivé à la Rouge River au T12, choix de **F10 « Plan Directeur »** (1 pop → enlist/upgrade gratuit +1$) — la meilleure carte pour un plateau affamé de nourriture : elle a fourni à elle seule 3 recrues et l'étoile « 4 recrues ».
2. **T28 : assaut calculé sur le leader.** Le mecha acadien isolé en #12 était mathématiquement imprenable pour lui : ma mise 7⚡+carte 4 = 11 ≥ son maximum absolu 6⚡+carte 5 = 11, et **l'égalité va à l'attaquant**. Victoire 11–5, étoile de combat, ressource volée. C'est le bon patron d'attaque : ne frapper que quand le plafond adverse (min(7, ⚡) + meilleure carte possible) est ≤ à sa propre mise.
3. **T29 : jeter volontairement une défense pour ne pas gagner.** Le héros frente attaque mon usine (22). **Gagner cette défense = 2e étoile de combat automatique = 6e étoile = fin immédiate** alors que j'étais à 6♥ (palier 1) ≈ 56 pts = défaite assurée. J'ai misé 0 et perdu exprès : −l'Usine (3 territoires), −1 mecha, −3 ouvriers renvoyés, +1 étoile pour Frente — mais la partie restait gagnable. Décision correcte sur le principe, chère en pratique.
4. **T30–T31 : la fin sur mesure… presque.** Bolster+Mémorial pour atteindre ♥7 (palier 2), étalement d'un mecha sur 27 (+3 pts), puis exécution du mecha frente en #30 (10 vs 5 — son plafond était 5+5=10, égalité attaquant) : 6e étoile, fin en tête… de mes projections.
5. **La douche froide du CLASSEMENT.** Frente finit à 84 : je l'avais projeté à ~61. Trois angles morts : il a franchi ♥13 (palier ×3) dans les 2 derniers tours, ses 8 métaux valaient 5 paires ×3 = 15 pts, et mon abandon du T29 lui avait offert l'étoile + l'hex Usine (3 territoires ×4). La leçon du skill (« finir en étant 2e fige sa défaite ») s'applique : j'ai vérifié le score… avec de mauvaises estimations adverses.

## Verdict sur les bots

- **M'ont-ils menacé ?** Oui, tardivement mais bien : Frente a joué une vraie séquence offensive T26–T29 (pièges posés sur MA case usine et sur l'unique sortie de mon héros acculé en #40, puis attaque de l'usine avec mise maximale 7⚡+carte sur ma mise 0 — surinvestissement contre un défenseur visiblement faible, seul vrai reproche tactique). Nations et Acadiane sont restés 100 % pacifiques.
- **Attaques à bon escient ?** L'attaque frente sur 22 était très rentable (usine + étoile). En revanche laisser 5+ tours un mecha isolé en #46 puis un autre en #30 à portée de ma paire, avec ⚡5, c'est offrir l'étoile de combat. Un bot devrait replier ses unités isolées quand sa puissance est basse.
- **Les bots « éco » sont redoutables au score** : Acadiane (comptoirs+pop 18) et Nations (25$+moulins) dominaient le score pendant 20 tours sans un seul combat. Frente gagne avec 4 étoiles seulement, par multiplicateurs (♥13) et paires (8 métal). C'est sain : les étoiles ne suffisent pas.

## Bugs et frictions

1. **`factory_top` encaisse le coût puis ignore silencieusement un `choice` invalide** (string au lieu d'index) : 1 pop perdue, aucun message d'erreur, aucun effet. → Valider l'action AVANT de payer, ou rejeter avec la liste des formats attendus (comme le fait `move_unit`).
2. **Flibuste n'a pas déclenché** (ni les 2$ du perdant, ni la capture) sur mes deux victoires, alors que le slot 2 était débloqué. Si le bonus exige que le mecha du slot 2 participe, ce n'est ni affiché ni documenté ; l'objectif de faction « Le Prédateur » (1 capture + 2 proies) devient quasi inatteignable. À vérifier/corriger.
3. **Transport implicite** : le mecha/héros embarque TOUS les ouvriers et ressources de l'hex par défaut (`workers:0` pour refuser). Piège classique : ma première visite d'usine a vidé ma montagne à métal sans que je le demande.
4. **Écrasement du bonus ↑$ par l'amélioration** : réduire le coût de Déployer a aussi fait passer son bonus de pièces de ↑1 à ↑0 — surprenant, à documenter si c'est voulu.

## Suggestion d'équilibrage argumentée

**Rendre l'étoile de combat optionnelle à la révélation (ou au moins en défense).** Situation vécue au T29 : tout joueur à 5 étoiles avec 1 victoire de combat est *obligé de saboter sa propre défense* (mise 0) pour ne pas déclencher une fin de partie perdante — un non-sens thématique et ludique, et une information exploitable par les bots agressifs (attaquer un joueur à 5 étoiles devient gratuit). Proposition : la victoire donne un jeton « étoile de combat » que le joueur pose quand il veut à son tour (à l'image des missions RÉVÉLABLES). Alternativement : ne jamais compter une étoile qui mettrait fin à la partie sur le tour d'un adversaire.

## Auto-critique (pour la prochaine partie)

- La popularité s'est gérée trop tard : Produire à 6-8 ouvriers coûte 1♥ par usage sur ce moteur — j'ai passé la mi-partie entre 0 et 3♥. Prendre l'option Commerce ♥+2 tôt, ou caler les enlists +2♥ plus vite.
- Suivre les **paliers adverses** (♥12→13 change tout) et compter les paires de ressources adverses avant de déclencher la fin : mon erreur d'estimation sur Frente (~61 réel 84) a transformé une « fin en tête » en 2e place.
- Les 3 ouvriers laissés sur l'Usine étaient un magot immobile ; les redistribuer vers des hexes-territoires distincts dès T20 valait ~+6 pts.
