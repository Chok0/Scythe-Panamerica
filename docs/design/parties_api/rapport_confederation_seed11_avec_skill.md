# Playtest Claude — Confédération / Terroir vs 3 bots (seed 11, difficulté normale)

**Date** : 2026-07-29 · **Config** : faction `confederation`, plateau 5 (Terroir), 3 bots, seed 11, difficulté normale, mode API headless (port 4671).

## Résultat

| Rang | Joueur | Profil | Score | Étoiles | Détail |
|---|---|---|---|---|---|
| 1 | Frente Libre | Équilibré (bot) | **103** | 6 ⭐ | terr 5 · 12 paires · 9$ |
| 2 | Nations Souv. | Bâtisseur (bot) | 82 | 5 ⭐ | terr 5 · 5 paires · 20$ |
| **3** | **Confédération (Claude)** | — | **68** | 5 ⭐ | terr 7 · 6 paires · 9$ |
| 4 | Bayou | Prédateur (bot) | 52 | 2 ⭐ | terr 6 · 3 paires · 9$ |

Partie terminée au **tour 32** : Frente pose sa 6e étoile (objectif de faction) pendant mon `end_turn`, alors que ma 6e étoile (4e bâtiment, 2 bois en stock pour un coût réduit à 2) était prête à partir au tour suivant. Mes étoiles : 8 ouvriers (T7), 2 victoires de combat (T20, T26), mission « Le Magnat » (T24), 4 mechas (T25).

## Moments clés

1. **T6-T7 — Désenclavement par Convoi.** Le coin Confédération (29/32/36) est muré par les rivières ; le slot 3 « Convoi » (bond village↔Usine) est la clef de la faction : mecha + ouvriers téléportés de 36 vers l'Usine puis l'anneau 26/27/30. Étoile 8-ouvriers dès T7.
2. **T19 — Défaite calculée à 30.** Zeke (Bayou) attaque mon stack de 2 mechas sans butin. J'ai misé 1 (au lieu de ma défense max 10) en supposant une mise max adverse (12 possible)… il a misé 9. Mauvais pari au premier ordre — mais il m'a laissé la contre-attaque.
3. **T20 & T26 — Les deux étoiles de combat aux Cavaliers.** Contre-attaques calibrées « victoire garantie » grâce à +2⚡ attaquant + égalité-attaquant : 10 v 4 sur Zeke affaibli (T20), puis 10 v 5 sur le mecha de 23 (T26) avec pillage de pétrole. Le tempo de ces fenêtres (attaquer juste après que l'adversaire a brûlé sa puissance) a été décisif pour mon tableau d'étoiles.
4. **T27-T29 — Le centre s'effondre.** Nations monte un assaut héros+mecha sur l'Usine (11 v 1, elle m'était indéfendable : ma défense max 6), puis Frente fait pareil sur 30 (11 v 2). Deux hexes et ~15 pts de valeur perdus en 3 tours : mes mechas dispersés ne pouvaient jamais aligner plus d'une carte en défense.
5. **T31-T32 — La fin m'échappe.** Frente reprend l'Usine à Nations (combat bot-vs-bot, 11 v 8, +7 nourriture pillée → 12 paires à palier ×3 ≈ 36 pts !) puis complète son objectif de faction un tour plus tard. J'avais retardé ma 6e étoile pour grinder le score (bonne lecture : finir T30 m'aurait laissé 3e aussi, à ~66) mais la partie s'est fermée avant mon raid sur le stock de bois de Bayou.

## Verdict sur les bots

- **Ils m'ont réellement menacé.** 3 attaques subies, 2 hexes majeurs perdus ; le Bâtisseur et l'Équilibré savent monter des assauts héros+mecha à 2 cartes qui rendent toute défense mono-unité sans espoir. Le score final (103/82) montre des bots qui convertissent : paliers de pop ×3, thésaurisation de paires, pièces.
- **Attaques à bon escient ? Mitigé.** L'attaque de Zeke T19 sur un hex SANS butin (pure chasse à l'étoile) est défendable, mais il a ensuite laissé son héros 6 tours adjacent à l'Usine **sans jamais la visiter** (c'est Nations puis Frente qui ont pris les cartes Ford). Un bot avec héros à 1 hex de l'Usine devrait presque toujours la visiter.
- **Le Prédateur (Bayou) est le maillon faible** : 52 pts, 2 étoiles. Il a sur-investi en agression précoce (attaque T19 à espérance douteuse : 7⚡ + carte pour déloger 2 mechas sans loot), s'est fait contre-attaquer deux fois, et n'a jamais reconstruit d'économie. L'Équilibré, à l'inverse, a fait la meilleure partie : éco d'abord, violence uniquement quand le pillage était énorme (7 nourriture sur l'Usine).
- **Très bonne opportunité saisie bot-vs-bot** : la reprise de l'Usine par Frente contre Nations affaibli (11 v 8) est exactement le coup qu'un humain aurait joué.

## Bugs / frictions rencontrés

1. **`encounter` ignore le choix de ressources** : j'ai demandé 3 « bois » (nom invalide côté moteur ?) et reçu métal+pétrole sans erreur. Les noms attendus devraient être validés ou documentés dans le résumé de la rencontre.
2. **Transport automatique surprenant** : `move_unit` embarque par défaut ouvriers et ressources de l'hex (mon ouvrier de l'Usine est parti « en stop » dans une attaque T26 ; mes 2 ouvriers de base ont suivi un mecha T31). Pratique mais devrait être opt-in, ou au moins signalé avant résolution.
3. **Servitude/`capture:true` sans effet en combat** : l'ouvrier bayou délogé après ma victoire T26 a été « renvoyé » à sa base au lieu d'être capturé — l'objectif « Le Joug » semble très difficile à compléter si la capture ne marche pas sur un hex gagné en combat.
4. **Affichage** : la mission « Le Magnat » repasse à ✗ quand les pièces retombent sous 12 alors que l'étoile est déjà posée (cosmétique) ; le 📜 de l'hex 30 est resté affiché après que Zeke y a séjourné (les héros bots ne consomment pas les rencontres ? à vérifier).

## Suggestion d'équilibrage (argumentée)

**Le score de paires × palier de pop est trop dominant en fin de partie.** Frente gagne avec ~36 pts de paires (26 ressources thésaurisées, dont 15 pillées en un seul combat) — plus d'un tiers de son score, acquis en 2 tours. À palier ×3, chaque ressource vaut 1,5 pt sans aucune action pour la « convertir », ce qui rend le pillage tardif de gros stocks disproportionné et pousse tous les bots à thésauriser (Nations a fini avec 17 nourriture inertes). Piste : plafonner les paires comptées (p.ex. 6-8 max) ou les valoriser à taux fixe (1 pt/paire quelle que soit la pop), pour que la popularité récompense étoiles et territoires (choix de jeu) plutôt que l'inventaire.

Frictions stratégiques honnêtes de mon côté (pour le prochain playtest) : défendre à mise minimale contre un Prédateur qui mise 9/12 était le mauvais pari (défense max aurait gagné + étoile) ; et j'aurais dû fortifier l'Usine (2 mechas + puissance) dès T23 au lieu d'y laisser un mecha esseulé — les 3 territoires de l'hex 22 ont fait la moitié de l'écart avec Nations.
