# Analyse de partie — 22/07/2026 (Dominion humain vs Confédération + Frente)

Source : export JSON du journal (28 tours, carte v3, difficulté normale).
Score final : **Dominion (humain) 93** · Frente Libre 45 · Confédération 8.

Partie jouée « en débutant » par l'auteur — c'est précisément ce qui rend la
lecture utile : même un jeu humain non optimisé écrase les bots. Les écarts
ne viennent pas de finesse tactique mais de **boucles structurelles** que les
bots n'ont pas (ou avaient cassées par des bugs, corrigés depuis — voir §4).

## 1. Ce que le jeu humain a fait (→ règles à donner aux bots)

| # | Comportement observé (journal) | Règle bot à en tirer | Statut |
|---|---|---|---|
| R1 | 5 rencontres chassées avec le héros dès T1 (T1, T7, T9, T13, T15) — pop, cartes, bâtiment gratuit | Le héros doit courir les jetons de rencontre en early (encounterPull existe mais trop faible face aux hexes à ressources) | backlog (tuning `encounterPull`) |
| R2 | Mechs = ferries : T7 m0 emmène 3 ouvriers sur #7, T9 m1 en emmène 2 sur #15 → 4 hexes de production variés dès T10 | Ferry d'ouvriers vers les ressources MANQUANTES des bottoms dès le 1er mech (les bots ne le font qu'en évacuation/late) | backlog (étendre le worthIt du mech) |
| R3 | Enrôlement complet à T15 (4 recrues), nourri par UN hex dédié (#7, 3 ouvriers) | Prioriser un « hex-grenier » de nourriture tôt : Enlist est la meilleure colonne (déjà +15 au score) mais il faut la NOURRIR | backlog |
| R4 | Popularité poussée méthodiquement en fin de partie (Trade+Bolster/Mémorial) : 9→18 entre T19 et T28 → palier ×5/×4/×3 | `chasePopStar`/`popTarget` existent — vérifier qu'ils s'activent dès 2 étoiles posées | partiel (profils) |
| R5 | Expansion territoriale au dernier moment : T26 dépose d'ouvriers sur le trajet du mech (+3 territoires dont l'Usine ×3) | Le drop-run late existe côté bots — il était juste neutralisé par les bugs de passage (corrigés) | fait (drop-run déjà codé) |
| R6 | Le gros tas de métal (9) voyage AVEC le mech — jamais laissé pillable sur un hex vide | Les bots laissent leurs tas sur place ; le magot devrait suivre les unités de combat | backlog |

## 2. Faiblesses bots observées → causes racines → correctifs

### Confédération : 8 points, 0 étoile, 0 pièce, 2 territoires — paralysie totale
- **Cause 1 (code)** : `bot.js` — `Move + coins ≤ 0 → prendre +1$`. À 0$ permanent
  (Bolster/Trade coûtent 1$, seule recette = ce même +1$), TOUS ses Move sont
  devenus « +1$ » : **aucune unité n'a bougé de la partie** (journal : 7×
  « +1$ (Move) », aucune ligne « Ouv. → » après T3).
  **Corrigé** : le +1$ ne remplace le déplacement qu'en vrai deadlock
  (impossible de payer Produce) ou en phase early.
- **Cause 2 (code)** : le choix de ressource du Trade parcourait les bottoms
  dans l'ordre 0→3 : il achetait éternellement du pétrole (Upgrade, base 3)
  au lieu du **bois** (Build, base 2) dont son profil Bâtisseur avait besoin.
  **Corrigé** : le Trade achète ce qui complète le bottom le plus proche
  d'être payable (départage Enlist > Deploy > Build > Upgrade, Upgrade ignoré
  au-delà de 2 sauf sprint final).
- **Conséquence** : enfermée sur {36, 32} alors que la forêt #29 est à UN pas
  de #32 (sans rivière sur la v3). Avec les 2 correctifs, ses ouvriers
  peuvent y aller et son économie tourne.

### Frente : bon moteur (4 recrues T14, 4 mechas T20), mais île quittée à T22 seulement
- Son héros n'est sorti qu'après avoir épuisé les actions d'île. `Sentier`
  (riverwalk) débloqué T11 mais aucune incitation à explorer : les hexes
  au-delà de la rivière scorent pareil que les locaux.
- Backlog : bonus de score de déplacement pour « premier hex hors de l'îlot
  de départ » une fois le riverwalk débloqué, et pour la direction de
  l'Usine (existe pour le héros : `s += 14` sur #22 — mais E. Rojas est resté
  distant ; vérifier la portée réelle avec 1 pas).

### Le combat de T26 (Frente attaque le mech du joueur sur #37)
Journal : `Frente 9 (7⚡+1🃏) vs vous 14 (7⚡+1🃏)` avec Discipline +2.
- **Il n'y a PAS eu de feinte** : 7⚡ est le plafond légal par combat, et à
  1 seule unité engagée, 1 carte est le maximum — le Frente a bien tout misé.
  Son total maximal théorique était ~9-11 contre un défenseur à 7⚡ plafonné
  + Discipline +2 + carte : **l'attaque était perdue d'avance, l'erreur est
  la DÉCISION d'attaquer**, pas la mise.
- **Cause (code)** : l'estimation de la force adverse (`power + cartes×2` sur
  TOUTE la main, sans plafond 7) et la sienne (`power + cartes×3`) étaient
  toutes deux fantaisistes — combinées au bruit de difficulté, elles laissaient
  passer des attaques absurdes et en interdisaient de raisonnables.
  **Corrigé** : les deux camps sont évalués en valeurs RÉELLES de combat
  (puissance plafonnée à 7, cartes limitées aux unités présentes sur l'hex).
- **Garde-fou ajouté** : plus de feinte de bot contre le joueur quand un
  joueur affiche 5⭐ (fin de partie = on joue le maximum, pas le bluff).

## 3. Bugs de règles confirmés par le journal (corrigés)

1. **T26.293-296 : saut par-dessus le héros ennemi via le réseau de rails**
   (`m1 #15 → #37 📦9metal` en passant par #22 et #30 — #30 étant occupé par
   E. Rojas — avec dépose d'ouvrier SUR l'hex du héros ennemi !).
   → Les hexes occupés par l'ennemi sont désormais des destinations valides
   mais **jamais des points de passage** : pas multiples, réseau de rails
   (le réseau est « coupé » au nœud occupé) et waypoints de dépose.
2. **Rails : montée + trajet dans le même déplacement** — entrer sur un rail
   au 1er pas ouvrait tout le réseau au 2e. → Le réseau ne s'emprunte que si
   l'unité COMMENCE son déplacement dessus (« on monte à bord un tour, on
   roule au suivant »). Règles in-game mises à jour.
3. **Traps Frente inoffensifs** — jamais déclenchés au passage (un mech à 2
   pas les enjambait), et -3⚡ ne pique plus personne en fin de partie.
   → Déclenchement sur TOUT le trajet (destination + hexes traversés) et
   pénalité durcie : **-3⚡ et -2♥** (la pop touche le multiplicateur de
   score à tout moment de la partie).

## 4. Instrumentation ajoutée pour les prochaines parties

- Snapshots `[Début 🤖 …]` par bot à chaque tour (leurs compteurs étaient
  invérifiables — le bonus immédiat d'enlist des bots est maintenant logué
  et lit la table partagée `ENLIST_IMMEDIATE`).
- « ✅ Mouvement terminé (n/limite) » logué une seule fois, dans
  `endHumanTurn`, quel que soit le bouton utilisé.
- Notes manuelles 📝 dans le journal (champ de saisie), horodatées au tour,
  exportées dans le JSON — pour annoter les anomalies en cours de partie.
