# 1920+ — Document de Game Design

## Préambule : ADN de Scythe à conserver

Avant de tout réinventer, rappelons ce qui fait Scythe :
- Des tours simples (max 2 actions) dans un jeu profond
- Du engine-building, pas du wargame — le combat est coûteux et rare
- Une course aux 6 étoiles, pas une élimination
- Des personnages-héros avec compagnon animal
- Des rencontres narratives à choix multiples
- Une asymétrie forte entre factions (mats de faction + mats de joueur)
- Une tension entre popularité et agressivité

On garde cet ADN. On le mute.

---

# PARTIE A — LES PLATEAUX

---

## A1. Plateau Europa Occidentale — « Les Cendres Chaudes »

### Géographie

Le plateau est orienté Nord-Sud (contrairement à Scythe qui est Est-Ouest). Il représente l'Europe de la Manche à l'Adriatique, des côtes anglaises aux Balkans.

**Zones clés :**

- **Les Zones Rouges** (Nord de la France) — 4 à 6 cases hexagonales marquées d'un symbole de contamination. Ces cases ne produisent aucune ressource au début de la partie. Elles contiennent des **épaves de mechas** (nouvelle ressource : la Ferraille). Toute unité qui y stationne perd 1 de puissance par tour (toxicité). Mais une action spéciale permet de les « décontaminer » — un investissement lourd qui les transforme en terres très fertiles en fin de partie.

- **La Ruhr** (Saxe Occidentale) — une zone de 3 cases connectées qui fonctionne comme une mini-Factory. Elle ne produit pas de mechas directement, mais elle produit de l'**Acier Brut**, une ressource nécessaire pour construire des mechas dans ce set. Qui contrôle la Ruhr contrôle le rythme de mécanisation du continent.

- **La City** (Londres) — une case spéciale qui fonctionne comme une Bourse. À chaque tour, un marqueur de prix fluctue : le coût des mechas, des ressources et des mercenaires change. L'Empire Britanique commence avec un avantage ici, mais n'importe qui peut y envoyer un émissaire commercial.

- **Le Coffre** (Suisse) — case centrale non-contrôlable. Tout joueur adjacent peut y « déposer » des ressources en sécurité (elles ne peuvent pas être volées) ou y retirer des **Brevets** — des cartes spéciales qui offrent des améliorations uniques de mechas. Mais chaque retrait augmente un compteur de « Dette Helvétique » qui coûte des points en fin de partie.

- **Les Cols Alpins** — des passages étroits entre la France, l'Italie et la Saxe. Fortement défendables (bonus défensif), ils créent des goulots d'étranglement stratégiques.

- **L'Adriatique** — un bord de plateau maritime qui connecte l'Italie et la Yougoslavie, avec des cases maritimes navigables uniquement par certaines factions ou certains mechas améliorés.

- **Les Tunnels de Mine** — un réseau de connexions souterraines entre les cases minières (Nord de la France, Ruhr, Lorraine, Pays de Galles). Similaire aux tunnels de Scythe, mais réservé aux factions qui ont débloqué la capacité « Souterrain ».

### Spécificité mécanique du plateau : La Fièvre

Chaque faction possède un **compteur de Fièvre** (0 à 10) imprimé sur son mat de faction. Un marqueur progresse selon les événements :

**Fièvre +1 :**
- Perdre un combat sur son propre territoire
- Subir un sabotage de l'Internationale Noire
- Avoir 0 ouvrier sur une case de production pendant 2 tours
- Une carte Rencontre à effet négatif

**Fièvre -1 :**
- Conclure un accord commercial avec une autre faction
- Décontaminer une Zone Rouge
- Jouer une carte Culture (nouvelle catégorie de cartes)
- Avoir une popularité supérieure à 12

**À Fièvre 7 — Alerte :** Le joueur doit défausser 1 carte de sa main à chaque tour (instabilité politique).

**À Fièvre 10 — Basculement :** Le joueur retourne son mat de faction côté « Régime Autoritaire ». Nouvelles règles :
- +2 en puissance de combat permanente
- Les mechas coûtent 1 ressource de moins à déployer
- La popularité ne peut plus dépasser 8 (plafonnée)
- Les accords commerciaux avec les autres factions sont rompus
- L'Internationale Noire gagne 1 étoile gratuite (la peur les renforce)
- Le joueur ne peut plus gagner par la voie diplomatique

**Retour possible :** Dépenser 3 étoiles déjà placées pour « Libérer » la faction (reset à Fièvre 5, retour au mat normal). Coûteux, mais nécessaire si le plafond de popularité bloque la victoire.

---

## A2. Plateau Amériques — « Le Nouveau Métal »

### Géographie

Le plateau est vertical : du Québec au Mexique, centré sur le Mississippi. Plus grand que le plateau Scythe standard (hexagones plus nombreux mais regroupés en régions).

**Zones clés :**

- **Le Mississippi** — une colonne de 6-8 cases fluviales traversant le plateau du Nord au Sud. Le fleuve est la colonne vertébrale économique : toute ressource transportée par le fleuve coûte 0 en mouvement (flottage gratuit). Contrôler les écluses du Mississippi est un objectif majeur.

- **Rouge River** (Detroit, Michigan) — la case centrale du plateau, l'équivalent de la Factory de Scythe. Contrairement à la Factory qui est fermée et silencieuse, Rouge River **produit** en permanence : elle génère automatiquement 1 Acier Brut par tour (qui s'accumule si personne ne la contrôle). Quand un héros y entre, il accède au **Catalogue Ford** — un deck de Plans Spéciaux divisé en deux catégories : les **Plans Ford** (mechas industriels de série) et les **Plans Tesla** (prototypes expérimentaux cachés dans le sous-sol de Wardenclyffe, plus puissants mais imprévisibles). Chaque joueur ne peut prendre qu'un Plan par visite. Les Plans Tesla nécessitent des composants ou collaborations spécifiques pour être construits.

- **Wardenclyffe** (Long Island) — une case secondaire, le laboratoire abandonné de Tesla. Inactif en début de partie. Si un joueur y envoie son héros ET possède un Plan Tesla, il peut « activer » Wardenclyffe : la case devient un **émetteur d'énergie sans fil** qui alimente les mechas du joueur dans un rayon de 3 cases (+1 mouvement). C'est le rêve inachevé de Tesla — le joueur le complète.

- **Les Grandes Plaines** — un immense espace central de cases ouvertes, très productives en nourriture mais difficiles à défendre (aucun bonus défensif, aucun obstacle). C'est le terrain des Nations Souveraines — quiconque essaie de les y poursuivre se perd.

- **La Rust Belt** (Pittsburgh-Chicago) — le corridor industriel qui entoure Rouge River. Plusieurs cases de production d'Acier Brut et d'usines de mechas. La Fédération Industrielle y démarre, mais les usines peuvent être conquises. Contrôler la Rust Belt ET Rouge River donne un bonus de production cumulatif dévastateur — c'est le monopole de Ford réalisé.

- **Le Bayou** — zone marécageuse au Sud-Est. Terrain difficile (coût de mouvement doublé pour la plupart des factions), mais l'Acadiane s'y déplace librement. Riche en une ressource unique : le **Caoutchouc**, nécessaire pour les améliorations de mechas.

- **Les Sierras** — montagnes de l'Ouest, terrain du Frente Popular. Cases à haute altitude qui offrent un bonus défensif et des mines (métaux rares), mais production alimentaire nulle.

- **Les Champs de Coton** — ancien territoire esclavagiste, maintenant contrôlé par la République Noire. Forte production alimentaire et textile, mais chaque case porte un marqueur « Mémoire » qui interagit avec le système de popularité de façon unique (voir mécaniques).

- **Le Grand Nord** — Québec et Maritimes. Cases forestières riches en bois (nécessaire pour les mechas de l'Acadiane, qui sont hybrides bois-métal). Hivers rudes : certaines cases deviennent improductives pendant les tours d'hiver (si on utilise un cycle saisonnier).

### Spécificité mécanique du plateau : Les Voies Ferrées

Le réseau ferroviaire est une **infrastructure construisible**. Au début de la partie, seules quelques lignes existent (la Transcontinentale). Les joueurs peuvent dépenser des ressources pour poser des **rails** entre deux cases adjacentes. Une fois construite, la voie ferrée permet le transport instantané d'un bout à l'autre de la ligne — mais elle est utilisable par **tous** les joueurs.

Ça crée un dilemme : construire des rails, c'est investir dans une infrastructure que tes adversaires utiliseront aussi. La Fédération Industrielle a un bonus de départ (plus de rails initiaux), mais le réseau qu'elle construit profite à tout le monde.

L'Internationale Noire a une action spéciale : **Déraillement** — détruire un tronçon de voie ferrée. Ça isole des régions, bloque des approvisionnements, et fait monter la Fièvre chez la faction qui dépendait de cette ligne.

---

## A3. L'Internationale Noire — Faction transversale

L'Internationale Noire n'a **pas** de plateau propre. Elle se joue **sur les deux plateaux** comme une faction parasite/symbiotique.

### Comment ça fonctionne

L'Internationale Noire est jouable comme une **faction asymétrique extrême**, soit en mode compétitif (1 joueur la contrôle), soit en mode semi-coopératif (contrôlée par une IA/automate ou un joueur "game master").

**Pas de territoire de départ.** L'Internationale commence avec 0 case, 0 mecha, 0 ouvrier visible.

**Des Cellules à la place des ouvriers.** L'Internationale pose des pions « Cellule » face cachée sur les cases contrôlées par d'autres joueurs. Les autres joueurs ne savent pas où elles sont. Les Cellules se révèlent pour activer des effets :
- **Sabotage** — désactive un mecha ennemi pour 1 tour
- **Grève** — bloque la production d'une case pendant 1 tour
- **Propagande** — baisse la popularité d'une faction de 1 et fait monter sa Fièvre de 1
- **Exfiltration** — déplace un ouvrier ennemi hors d'une case (il retourne à la base de sa faction)

**Des Spectres à la place des mechas.** L'Internationale ne construit pas de mechas — elle les **récupère**. Quand un mecha est détruit au combat entre deux autres factions, l'Internationale peut dépenser des ressources pour le récupérer comme un **Spectre** (mecha frankensteïnien). Les Spectres sont faibles individuellement mais ne comptent pour aucune faction en termes de reconnaissance — les autres joueurs ne gagnent pas de popularité en les battant.

### Condition de victoire alternative

L'Internationale ne place pas d'étoiles de la manière classique. Elle a ses propres objectifs :

1. **Saboter 8 mechas** au cours de la partie
2. **Révéler des Cellules dans 4 factions différentes**
3. **Provoquer au moins 1 basculement fasciste** (pour montrer au monde le danger)
4. **Puis ramener cette faction du basculement** (prouver que la libération est possible)
5. **Contrôler au moins 1 case adjacente à chaque capital de faction** en fin de partie
6. **Avoir au moins 3 Spectres en jeu** simultanément

L'Internationale remplit 6 de ces objectifs (ou d'objectifs alternatifs tirés de cartes) pour gagner. C'est une victoire par **influence**, pas par domination.

---

# PARTIE B — LES HÉROS

Chaque héros suit le modèle Scythe : un personnage + un compagnon animal, une backstory, et une capacité passive unique.

---

## B1. Europa Occidentale

### République Française — **Lucien & Cendre** (un blaireau des tranchées)

Lucien Daubray, 38 ans. Ancien ingénieur des Mines de Lens, il a passé la Grande Guerre sous terre — pas dans un mecha, mais dans les sapes, les tunnels de mine reconvertis en galeries de combat. Quand la paix est venue, il est remonté à la surface et n'a pas reconnu le monde. Les champs de son enfance étaient devenus les Zones Rouges. Il a redescendu.

Lucien est un Enfoui — il vit sous la terre empoisonnée et connaît chaque galerie, chaque poche d'air, chaque carcasse de mecha enfoui. Cendre, son blaireau, est né dans les tunnels et ne connaît pas la lumière du jour. Ensemble, ils naviguent le réseau souterrain comme d'autres naviguent les fleuves.

**Capacité passive — Sapeur :** Lucien peut se déplacer entre n'importe quelles cases possédant un symbole de mine ou de tunnel, quel que soit la distance. De plus, il peut « révéler » une connexion souterraine entre deux cases adjacentes, créant un nouveau tunnel permanent sur le plateau.

### Empire Britanique — **Eleanor & Mab** (un corbeau de la Tour de Londres)

Eleanor Ashworth, 42 ans. Ancienne cryptanalyste de l'Amirauté, elle a passé la guerre à décoder les transmissions mécaniques des mechas ennemis — chaque mecha émet des signaux, et Eleanor sait les lire comme d'autres lisent les journaux. Après la guerre, elle n'a pas raccroché. Elle écoute toujours. Et ce qu'elle entend l'inquiète.

Mab, son corbeau, est dressé pour porter des messages entre les agents de l'Empire. Il y a une superstition à la Tour de Londres : tant que les corbeaux y vivent, l'Empire tient. Eleanor sait que c'est une superstition. Elle sait aussi que les superstitions, bien utilisées, valent mieux que des armées.

**Capacité passive — Interception :** Une fois par tour, Eleanor peut regarder secrètement la main de cartes Combat d'un autre joueur. De plus, quand une autre faction utilise une carte Rencontre, Eleanor peut en lire le contenu avant que le joueur ne choisisse son option (information, pas interférence).

### Reich Saxe — **Konrad & Schlacke** (un chien de berger allemand borgne)

Konrad Brauer, 51 ans. Directeur d'usine de la Ruhr. Pas un soldat, pas un idéologue — un ingénieur de production qui connaît chaque boulon de chaque mecha sorti de ses chaînes de montage. Konrad n'aime pas la guerre. Konrad n'aime pas la paix non plus. Konrad aime que les usines tournent. Le reste, c'est de la politique.

Schlacke (« Scories ») a perdu un œil dans une explosion d'atelier. Depuis, il grogne dès qu'il sent l'odeur du métal surchauffé — ce qui, dans la Ruhr, est permanent.

**Capacité passive — Production de Masse :** Quand Konrad déploie un mecha, il peut immédiatement en déployer un deuxième pour le coût d'un seul, à condition d'avoir les ressources. Mais les mechas produits en masse sont « Standardisés » — ils ne peuvent pas recevoir d'améliorations uniques (brevets suisses).

### Péninsule Italique — **Vittoria & Fuoco** (un lévrier italien)

Vittoria Conti, 26 ans. Ancienne partisane des collines toscanes, reconvertie en pilote de mecha malgré elle — elle a volé le sien à une garnison fascisante et a découvert qu'elle savait le piloter mieux que n'importe quel diplômé de l'académie militaire de Turin. Vittoria déteste les mechas. Elle déteste encore plus ceux qui les utilisent contre des civils.

Fuoco court plus vite que les mechas légers italiens — ce qui, dans un pays qui vénère la vitesse, fait de lui une légende à quatre pattes.

**Capacité passive — Charge :** Quand Vittoria initie un combat, elle peut se déplacer d'une case supplémentaire PUIS attaquer (mouvement + combat en une action). Si elle gagne le combat, elle peut se déplacer d'une case supplémentaire après (percée). C'est la blitzkrieg en version partisane.

### Fédération Yougoslave — **Dragan & Senka** (une loutre des rivières karstiques)

Dragan Petrović, 34 ans. Contrebandier serbe devenu agent double devenu triple agent devenu « personne ne sait plus pour qui il travaille, y compris lui ». Dragan a vécu dans tellement de pays sous tellement d'identités qu'il parle cinq langues, ment dans chacune, et ne dit la vérité qu'à Senka, sa loutre, qui de toute façon ne comprend pas.

Senka passe la moitié de son temps dans les rivières souterraines du karst, ramenant des objets trouvés — parfois un poisson, parfois un document classifié tombé dans un cours d'eau.

**Capacité passive — Marché Noir :** Dragan peut échanger des ressources avec n'importe quelle faction, même hostile, sans être adjacent. Il « fixe le prix » — l'échange est toujours légèrement en sa faveur (ratio 3:2 au lieu de 1:1). De plus, quand il est sur une case adjacente à la Suisse, il peut retirer un Brevet sans augmenter la Dette Helvétique.

---

## B2. Amériques

### Fédération Industrielle — **Charles & Smoke** (un raton-laveur albinos)

Charles Whitmore, 45 ans. Vice-président de la Whitmore Steel Corp, troisième fortune de Pittsburgh. Charles est ce que l'Amérique produit de mieux et de pire : un self-made-man qui a commencé docker et qui possède maintenant les docks. Il est intelligent, impitoyable, et sincèrement convaincu que ce qui est bon pour la Whitmore Steel est bon pour l'Amérique.

Smoke, le raton-laveur, vit dans le bureau de Charles depuis qu'il l'a trouvé bébé dans une poubelle d'usine. C'est la seule créature vivante que Charles n'a jamais essayé de monétiser.

**Capacité passive — Leverage :** Charles peut « acheter » le résultat d'un combat avant qu'il ne commence — il dépense des pièces (pas des cartes combat) pour ajouter à sa puissance. 1 pièce = +1 puissance. De plus, quand il contrôle Rouge River, toutes ses unités coûtent 1 ressource de moins. Mais attention : Charles ne peut PAS accéder aux Plans Tesla (il ne comprend pas les notes en serbe). Seuls les Plans Ford lui sont disponibles. Les autres factions, elles, ont accès aux deux catégories.

### Nations Souveraines — **Aiyana & Koda** (un bison des plaines)

Aiyana, 31 ans. Cheffe de guerre lakota, fille d'un ancien éclaireur de l'armée américaine et d'une guérisseuse oglala. Aiyana a grandi entre deux mondes et n'appartient pleinement à aucun. Elle a appris la mécanique dans les ateliers de la Fédération, la stratégie dans les cercles de guerre de son peuple, et la patience en regardant Koda, son bison, brouter pendant des heures sans lever la tête.

Koda est vieux — personne ne sait exactement quel âge. Il marche lentement, et les mechas des Nations Souveraines règlent leur pas sur le sien.

**Capacité passive — Terre Connue :** Sur les cases des Grandes Plaines, les mechas d'Aiyana sont invisibles — les autres joueurs ne peuvent pas voir leur position exacte (pions face cachée ou position secrète). De plus, ses mechas ne dépensent pas de mouvement supplémentaire pour traverser les rivières ou les collines en territoire des Plaines.

### République Noire — **Solomon & Bayou** (un alligator domestiqué)

Solomon Reed, 40 ans. Ancien docker de La Nouvelle-Orléans, prêcheur baptiste le dimanche, stratège militaire les six autres jours. Solomon n'a pas choisi la guerre — la guerre l'a choisi le jour où le Klan Mécanique a brûlé le quartier de sa mère avec un mecha volé. Il a juré deux choses ce jour-là : que le Mississippi serait libre, et qu'aucun enfant noir ne verrait plus jamais un mecha blanc marcher vers sa maison.

Bayou est un alligator de trois mètres que Solomon a élevé depuis l'œuf. Il dort sur le ponton du bateau de commandement de Solomon et ne se réveille que pour manger ou pour effrayer les émissaires de la Fédération Industrielle.

**Capacité passive — Le Fleuve Est À Nous :** Solomon contrôle les écluses. Toute faction qui veut utiliser le transport fluvial gratuit du Mississippi doit payer 1 pièce à Solomon par case traversée — ou s'en passer. De plus, les mechas de Solomon ont un bonus de +2 en combat sur les cases fluviales.

### L'Acadiane — **Marguerite & Brume** (un grand héron bleu)

Marguerite Thibodeau, 29 ans. Cartographe, herboriste, pilote de marécage. Marguerite est née dans une cabane sur pilotis au fond du bayou louisianais, et elle n'a vu une ville qu'à dix-sept ans. Elle connaît chaque chenal, chaque île, chaque arbre creux entre La Nouvelle-Orléans et le Lac Pontchartrain. Quand les premiers mechas sont apparus dans le bayou, Marguerite a été la première à comprendre qu'on pouvait les noyer.

Brume, son héron, vole au-dessus des marécages et sert d'éclaireur — il repère les mouvements ennemis et les passages praticables dans des terrains que les cartes officielles marquent comme infranchissables.

**Capacité passive — Insaisissable :** Les mechas de Marguerite ne peuvent pas être ciblés par un combat s'ils sont sur une case marécageuse — l'attaquant doit d'abord entrer sur la case, et Marguerite peut se retirer d'une case gratuite avant que le combat ne commence (esquive). De plus, Marguerite peut créer des « Fausses Pistes » — des pions leurres sur les cases marécageuses.

### Frente Popular — **Emiliano & Trueno** (un cheval sauvage blindé)

Emiliano Rojas, 53 ans. Vétéran de la Révolution mexicaine, ancien lieutenant de Zapata, il porte encore les balles qu'il n'a pas eu le temps de retirer. Emiliano ne sait pas si la Révolution est finie ou si elle n'a jamais commencé — mais il sait que la terre sous ses pieds appartient à ceux qui la suent, et que les mechas sont des outils, pas des trônes.

Trueno est un cheval dont le harnais a été renforcé de plaques de blindage récupérées sur un mecha détruit. Il n'est pas rapide, mais rien ne l'arrête — ni les balles, ni les pentes, ni les barbelés.

**Capacité passive — Tierra y Libertad :** Quand Emiliano conquiert une case de production, elle produit immédiatement 1 ressource bonus (la terre libérée produit tout de suite). De plus, ses ouvriers ne peuvent pas être déplacés de force par les mechas ennemis — ils résistent (pas de « push » comme dans Scythe standard). Les déloger coûte un vrai combat.

---

## B3. Internationale Noire

### Le triumvirat

L'Internationale n'a pas **un** héros — elle en a **trois**, chacun contrôlant une branche de l'organisation. Le joueur peut activer un seul héros par tour et doit alterner.

### **Nadia & Iskra** (une chatte noire borgne) — Les Saboteurs

Nadia Volkov, 33 ans. Née à Odessa, élevée à Marseille, formée à Barcelone. Nadia est une mécanicienne de génie qui connaît les entrailles des mechas mieux que ceux qui les pilotent. Elle ne les détruit pas — elle les rend malades. Une valve décalée, un lubrifiant contaminé, un câble raccourci d'un centimètre. Le mecha tient debout. Il marche. Et trois semaines plus tard, en pleine manœuvre, il s'agenouille comme un cheval fourbu et ne se relève pas.

Iskra (« Étincelle ») a perdu un œil dans une explosion d'atelier à Lyon. Elle voit dans le noir, ce qui est pratique quand on vit dans des usines clandestines.

**Capacité — Rouille Rouge :** Nadia peut poser un marqueur « Sabotage » sur un mecha ennemi sans être révélée. Le sabotage ne se déclenche pas immédiatement — il se déclenche au moment le plus inopportun : quand le mecha entre en combat, quand il traverse un terrain difficile, ou quand le joueur en a le plus besoin. Le joueur ciblé tire une carte Avarie qui détermine l'effet (perte de puissance, immobilisation, retour à la base).

### **Le Horloger & Rouage** (un rat d'égout savant) — Les Passeurs

Le Horloger. Personne ne connaît son vrai nom. Ancien professeur de philosophie mécanique à la Sorbonne, il a disparu après la publication d'un traité intitulé « De la servitude mécanique » qui lui a valu une condamnation par contumace. Il vit dans les interstices — les tunnels, les canaux, les wagons de marchandises. Il pense en systèmes, parle en métaphores, et démonte tout ce qu'il touche pour comprendre comment ça marche avant de le remonter légèrement différent.

Rouage est un rat gris qui vit dans la poche intérieure du manteau du Horloger. Il sait ouvrir les serrures.

**Capacité — Réseau :** Le Horloger peut déplacer n'importe quel pion de l'Internationale (Cellule, Spectre, autre héros) de 2 cases supplémentaires par tour en utilisant les tunnels, les voies ferrées ou les voies fluviales — même celles contrôlées par d'autres factions. De plus, il peut « exfiltrer » un ouvrier ennemi et le convertir en Cellule (l'ouvrier déserte et rejoint l'Internationale).

### **Rosa & Sturmvogel** (un faucon pèlerin) — Les Moissonneurs

Rosa Acker, 27 ans. Allemande de la Ruhr, fille d'un ouvrier sidérurgiste mort dans l'effondrement d'un haut-fourneau. Rosa a grandi dans l'ombre des usines et dans la lumière des réunions syndicales clandestines. Elle est la plus jeune du triumvirat et la plus radicale — elle ne veut pas saboter les mechas, elle veut les **prendre**. Chaque Spectre qu'elle assemble dans une grange ou un hangar abandonné est un doigt d'honneur fait à l'industrie d'armement.

Sturmvogel (« Oiseau d'orage ») chasse au-dessus des champs de bataille, repérant les carcasses de mechas avant que les charognards officiels n'arrivent.

**Capacité — Moisson :** Quand un combat a lieu entre deux autres factions à 3 cases ou moins de Rosa, elle peut récupérer les unités détruites (mechas ou ouvriers). Les mechas deviennent des Spectres. Les ouvriers deviennent des Cellules. De plus, Rosa peut « cannibaliser » un Spectre existant pour améliorer un autre Spectre (sacrifice 1 pour +2 puissance à un autre).

---

# PARTIE C — NOUVELLES MÉCANIQUES

---

## C1. Le Système de Brevets (Europa Occidentale)

Les **Brevets** sont des cartes stockées au Coffre (Suisse). Ils représentent des innovations technologiques spécifiques :

- **Moteur Claude** — mecha plus rapide (+1 mouvement) et insensible à la toxicité des Zones Rouges
- **Blindage Krupp** — +2 en défense, mais -1 en mouvement
- **Optique Zeiss** — le joueur voit les pions cachés (Cellules de l'Internationale) dans un rayon de 2 cases
- **Radio Branly** — le joueur peut coordonner deux mechas distants pour un combat combiné
- **Turbine Tesla** — le mecha génère 1 ressource Énergie par tour qu'il est stationnaire (il devient une mini-usine)

Un joueur récupère un Brevet en ayant une unité adjacente à la Suisse et en dépensant des pièces. Mais chaque Brevet pris augmente la **Dette Helvétique** de la faction — un malus de points en fin de partie. La Suisse ne donne rien gratuitement.

## C2. Le Système de Mémoire (Amériques)

Les **cases de Mémoire** (principalement dans les Champs de Coton et les territoires amérindiens) portent un marqueur spécial. Quand un joueur contrôle une case de Mémoire, il doit choisir :

- **Honorer** — il gagne +1 popularité mais ne peut pas y construire de structure militaire
- **Exploiter** — il gagne +1 ressource par tour mais perd -2 popularité

Ce choix est **permanent** et visible par tous. Il définit le rapport de la faction à l'histoire du territoire et affecte les rencontres futures (certaines cartes Rencontre réagissent différemment selon le choix).

La République Noire a un avantage unique : elle peut Honorer ET produire (pas de choix — la Mémoire est la sienne).

## C3. Le Cycle Saisonnier (Amériques, optionnel)

Tous les 4 tours, la saison change. Chaque saison affecte le plateau :

- **Printemps** — Crues : les cases fluviales s'étendent de 1 case de chaque côté. Bonus de production agricole.
- **Été** — Chaleur : les cases désertiques (Sud-Ouest) sont improductives. Bonus de mouvement pour tous.
- **Automne** — Récolte : toutes les cases agricoles produisent le double. C'est la saison des batailles.
- **Hiver** — Gel : le Grand Nord devient infranchissable sauf pour l'Acadiane. Les cases des Plaines produisent moitié moins. Les mechas consomment 1 ressource Énergie par tour ou perdent 1 puissance.

## C4. Les Spectres (mécanique détaillée)

Les Spectres (mechas de l'Internationale Noire) ont des règles uniques :

- Ils sont **assemblés**, pas construits. Coût : 1 Ferraille (récupérée dans les Zones Rouges, les champs de bataille, ou par la capacité de Rosa) + 1 action.
- Chaque Spectre est **unique**. À l'assemblage, le joueur tire 2 cartes « Composant » et en choisit 1. Les composants viennent des factions d'origine :
  - *Composant Rusviet* — +2 puissance brute
  - *Composant Polanian* — peut déplacer des ouvriers ennemis sans combat
  - *Composant Saxon* — peut se déplacer par les tunnels
  - *Composant Français* — insensible à la toxicité
  - *Composant Américain* — +1 mouvement sur les voies ferrées
  - *Composant Amérindien* — invisible sur les Plaines
- Un Spectre peut être **cannibalisé** pour transférer son composant à un autre Spectre (maximum 3 composants par Spectre).
- Les Spectres ne rapportent **jamais** de popularité quand ils sont battus (on ne gagne pas de gloire à détruire un fantôme).

---

# PARTIE D — LES RENCONTRES

Même format que Scythe : le joueur tire une carte, lit la situation, choisit entre 2-3 options. Mais le ton et les dilemmes sont adaptés à chaque plateau.

---

## D1. Rencontres Europa Occidentale

### Rencontre : L'Usine Fantôme
*Dans la brume de la Ruhr, vous tombez sur une usine que personne n'a marquée sur les cartes. Les portes sont ouvertes. À l'intérieur, une chaîne de montage complète, intacte, prête à fonctionner. Pas un ouvrier en vue. Sur le mur, une inscription à la craie : « Ils reviendront quand vous serez partis. »*

- **Activer l'usine** — Gagnez 2 Acier Brut et 1 mecha gratuit, mais votre Fièvre monte de 2 (industrialisation sauvage, réquisition).
- **Sceller l'usine** — Gagnez 2 de popularité et placez un marqueur « Scellé ». L'Internationale Noire gagne 1 Ferraille (ils viendront la nuit).
- **Enquêter** — Ne gagnez rien immédiatement, mais piochez 2 cartes Brevet et gardez-en 1 sans payer de Dette Helvétique (les plans étaient là, dans un tiroir poussiéreux).

### Rencontre : Le Masque Parle
*Sur la place d'un village du Nord, un homme au visage de métal harangue une foule de mineurs et de veuves de guerre. Sa voix amplifiée porte jusqu'aux collines. Il dit des choses que vous pensez aussi, parfois, la nuit — des choses sur la grandeur perdue, sur les Zones Rouges qu'il faut reconquérir, sur les étrangers et les saboteurs. La foule écoute. La foule approuve.*

- **Écouter et partir** — Votre Fièvre monte de 1. Rien d'autre ne se passe. Pour l'instant.
- **Le confronter publiquement** — Lancez un dé : sur 4+, votre popularité monte de 2 et la Fièvre baisse de 1 (vous l'avez ridiculisé). Sur 1-3, votre popularité baisse de 1 et la Fièvre monte de 2 (la foule se retourne contre vous).
- **Le recruter** — Gagnez +2 puissance militaire permanente et 1 mecha gratuit, mais votre Fièvre monte de 3. Le Masque n'oublie jamais une dette.

### Rencontre : Le Vigneron de Reims
*Un vieil homme cultive trois rangs de vigne au bord d'une Zone Rouge. La terre est noire, l'eau est douteuse, et pourtant — des grappes. Petites, dures, miraculeuses. « 1914, on faisait du champagne ici, » dit-il. « On en refera. Faut juste du temps et des gens qui foutent la paix à la terre. »*

- **L'aider** — Dépensez 1 ressource Nourriture. La case Zone Rouge adjacente est partiellement décontaminée (elle produit 1 Nourriture par tour au lieu de 0). Gagnez 1 popularité.
- **Réquisitionner la parcelle** — Gagnez 2 Nourriture immédiatement. Perdez 1 popularité. La case reste contaminée.
- **Le convaincre de rejoindre votre cause** — Gagnez 1 ouvrier. Mais le vieil homme n'est pas un soldat — si cet ouvrier est tué, votre popularité baisse de 3 (le village n'oublie pas).

---

## D2. Rencontres Amériques

### Rencontre : Le Train Fantôme
*Un train de marchandises abandonné sur une voie secondaire, au milieu des Grandes Plaines. Les wagons sont verrouillés. Des marques de griffes sur les portes — de l'intérieur. Le vent siffle dans la plaine et le blé se couche comme pour ne pas voir.*

- **Ouvrir les wagons** — Découvrez 3 Ferraille et 1 ressource au hasard. Mais aussi 1 carte Événement négative (ce qui était enfermé là n'aurait pas dû être ouvert).
- **Remonter la locomotive** — Dépensez 1 Acier Brut. Le train fonctionne : créez une voie ferrée gratuite de 3 cases dans n'importe quelle direction.
- **Brûler le train** — Gagnez 1 popularité (les locaux vous remercient de ne pas avoir ouvert). L'Internationale Noire perd 1 Cellule dans la région (c'était l'un de leurs dépôts secrets).

### Rencontre : Le Prêcheur du Delta
*Au bord du Mississippi, un homme en costume blanc prêche à une foule de dockers noirs. Il parle de Moïse, de la Mer Rouge, et de méchas qui marchent sur les eaux. "Le fleuve est notre allié," dit-il. "Pharaon avait des chars. Nous avons des écluses."*

- **Financer son église** — Dépensez 2 pièces. Gagnez 2 popularité et 1 ouvrier loyal (il ne peut pas être converti en Cellule par l'Internationale).
- **Recruter le prêcheur** — Gagnez 1 Cellule spéciale "Orateur" (peut baisser la Fièvre de 1 dans n'importe quelle faction adjacente). Perdez 1 pièce.
- **L'ignorer** — Rien ne se passe. Mais au prochain tour, si la République Noire est en jeu, elle gagne 1 popularité gratuite (le prêcheur n'oublie pas qui l'a snobé).

### Rencontre : La Mine Maudite
*Dans les Sierras, une mine de cuivre abandonnée. Les Pueblos locaux disent qu'elle est hantée. Les ingénieurs de la Fédération disent qu'elle est effondrée. Les deux ont raison, d'une certaine manière — les galeries gémissent la nuit, et parfois, des lumières s'allument dans les profondeurs.*

- **Explorer** — Lancez un dé. Sur 4+, découvrez un filon de Cuivre rare (3 ressources + 1 carte Brevet). Sur 1-3, perdez 1 ouvrier (éboulement) et votre Fièvre monte de 1.
- **Sceller la mine** — Gagnez 1 popularité auprès des Nations Souveraines. Si vous jouez les Nations Souveraines, gagnez 2 popularité à la place.
- **Demander aux Pueblos** — Si vous avez Honoré au moins 1 case de Mémoire, ils vous montrent un passage sûr : gagnez 2 Cuivre sans risque. Sinon, ils refusent.

### Rencontre : Le Sous-Sol de Wardenclyffe
*Vous avez trouvé l'entrée. Un escalier en colimaçon, derrière une cloison dans un entrepôt de Rouge River que les ouvriers appellent « la chambre froide ». En bas, un laboratoire intact. Des consoles couvertes de poussière, des bobines de cuivre de deux mètres de diamètre, des cahiers remplis d'une écriture serrée en cyrillique. Et au centre de la pièce, sous une bâche, une silhouette de quatre mètres de haut.*

- **Étudier les cahiers** — Gagnez 1 Plan Tesla au hasard. Mais Ford sait que quelqu'un est descendu : la Fédération Industrielle gagne 1 carte Combat gratuite et sa Fièvre monte de 1 (la paranoïa de Ford s'intensifie).
- **Activer la machine** — Lancez un dé. Sur 4+ : le Golem s'allume. Vous gagnez le Plan Golem. Sur 1-3 : surcharge électrique. Perdez 1 mecha (court-circuit en chaîne) mais gagnez 2 Énergie (la décharge a alimenté tout le réseau local).
- **Tout copier et refermer** — Gagnez 2 Plans Ford (pas Tesla — vous n'avez copié que ce que vous comprenez) et personne ne sait que vous êtes descendu. Option la plus sûre, la moins glorieuse.
- **Tout rendre public** — Révélez l'existence du sous-sol à toutes les factions. TOUS les joueurs gagnent 1 Plan Tesla. La Fièvre de la Fédération monte de 3 (humiliation publique). L'Internationale Noire gagne 1 étoile (objectif « Démocratisation »). Ford jure vengeance.

### Rencontre : Le Newsreel d'Edison
*Dans un cinéma de fortune au Kansas, un projecteur crépite. Sur l'écran blanc tendu entre deux poteaux, un film Edison : des mechas Ford qui labourent les champs, construisent des ponts, portent des enfants sur leurs épaules d'acier. La voix du narrateur dit : « La puissance américaine au service du peuple américain. » Personne dans la salle ne demande quel peuple. Puis le film change. Des images de mechas « volés » par des « bandits ». Les bandits ont la peau sombre. La salle gronde.*

- **Laisser le film tourner** — Rien ne se passe immédiatement. Mais la Fièvre de toutes les factions dans un rayon de 2 cases monte de 1 (la propagande fonctionne).
- **Détruire le projecteur** — Perdez 1 popularité (le public est furieux, on lui a coupé son divertissement). Mais la Fièvre de la région ne monte pas. Et vous gagnez 1 Ferraille (le projecteur était un bel objet mécanique).
- **Projeter votre propre film** — Si vous possédez un ouvrier de type « Orateur » (voir rencontre du Prêcheur du Delta) ou une Cellule de l'Internationale, remplacez le film par un contre-récit. La Fièvre de toutes les factions dans un rayon de 2 cases baisse de 1. Edison vous met sur sa liste.

### Rencontre : Le Camping des Vagabonds
*Quelque part dans les Blue Ridge Mountains, quatre tentes luxueuses entourent un feu de camp. Des hommes en chemise, détendus, rient et boivent du bourbon. Un service de sécurité privé patrouille le périmètre avec un mecha léger. Vous reconnaissez les visages. Tout le monde les reconnaîtrait. C'est le sommet le plus informel et le plus puissant du continent.*

- **Demander une audience** — Dépensez 2 pièces. Si vous jouez la Fédération Industrielle : gagnez 2 Plans Ford et 1 accord commercial avec n'importe quelle faction (Ford fait pression pour vous). Si vous jouez n'importe quelle autre faction : gagnez 1 Plan Ford, mais la Fédération Industrielle voit votre main de combat (Ford a ses conditions).
- **Espionner** — Lancez un dé. Sur 4+ : découvrez les 3 prochaines cartes Événement du deck et regardez la main de combat de la Fédération Industrielle (vous avez entendu leurs plans). Sur 1-3 : vous êtes repéré par le Service Department. Perdez 1 ouvrier (arrêté). La Fédération gagne 1 puissance.
- **Envoyer l'Internationale** — (Uniquement si vous avez une Cellule dans la zone.) Tentative d'attentat. Lancez un dé. Sur 6 : un membre du Triumvirat est « neutralisé » — Rouge River perd sa production automatique pendant 3 tours. Toutes les factions gagnent 1 Fièvre (la peur de l'anarchie). Sur 1-5 : l'attentat échoue. L'Internationale perd 2 Cellules dans tout le plateau (répression massive). La Fièvre de TOUTES les factions monte de 2. Ford multiplie la production de mechas du Klan.

---

## D3. Rencontres Internationale Noire (cartes spécifiques)

### Rencontre : Le Déserteur
*Un pilote de mecha saxon se présente à votre cellule, en pleine nuit. Il veut déserter. Il dit qu'il sait des choses — les codes de fréquence des mechas de la Ruhr, les horaires de patrouille, l'emplacement des dépôts de carburant. Il dit aussi qu'il est suivi.*

- **L'accueillir** — Gagnez 1 carte Sabotage gratuite et les informations (regardez la main de combat du joueur Saxon). Mais le joueur Saxon sait maintenant qu'une de vos Cellules est dans sa zone — il peut la chercher.
- **L'exfiltrer vers un autre pays** — Dépensez 1 mouvement du Horloger. Gagnez 1 Cellule dans une nouvelle faction (le déserteur devient agent double).
- **Le renvoyer** — Gagnez 1 popularité (vous n'êtes pas des kidnappeurs). Mais le pilote retourne chez lui et devient un fasciste convaincu (Fièvre Saxon +1).

### Rencontre : Le Choix du Horloger
*Un atelier clandestin à Toulouse. Trois Spectres en cours d'assemblage. Le Horloger pose la question qu'il pose toujours : « Que fait-on de ces machines ? » Sur la table, trois options.*

- **Les armer** — 3 Spectres deviennent opérationnels immédiatement avec des composants aléatoires.
- **Les convertir en tracteurs** — Perdez 3 Spectres potentiels. Gagnez 3 ouvriers (les paysans locaux vous sont redevables) et 2 popularité. La Fièvre de la faction française baisse de 1.
- **Les offrir au plus faible** — Donnez les 3 Spectres à la faction qui a le moins de mechas en jeu. Gagnez 1 étoile (objectif « Solidarité »). La faction aidée gagne 3 mechas. L'Internationale gagne un allié — ou un ingrat.

---

# PARTIE E — OPTIONS SPÉCIALES ET MODULES

---

## E1. Module : La Course aux Brevets

Un jeu dans le jeu. En début de partie, 5 Brevets sont visibles au Coffre suisse. Quand un joueur en prend un, un nouveau est révélé. Quand les 15 Brevets sont épuisés, la Suisse « ferme le Coffre » — plus aucun Brevet n'est disponible, et les Dettes Helvétiques sont multipliées par 2 pour le scoring final.

Crée une tension temporelle : se ruer sur les Brevets (accumuler de la technologie mais de la dette) ou attendre (risquer que les autres prennent les meilleurs).

## E2. Module : Les Gueules Cassées

Un deck de cartes « Vétérans ». Quand un joueur perd un mecha au combat, il pioche une carte Vétéran. Le vétéran est un ouvrier spécial avec un bonus unique (connaissance du terrain, expertise mécanique, réseau de contacts) mais aussi un malus (traumatisme, insubordination, loyauté douteuse).

Exemples :
- **L'Ingénieur Brisé** — peut réparer un mecha endommagé gratuitement, mais refuse de travailler dans une usine (ne produit pas sur les cases industrielles).
- **Le Fantôme** — invisible comme une Cellule de l'Internationale, mais peut « basculer » et devenir réellement une Cellule si la Fièvre de sa faction dépasse 7.
- **La Mère Courage** — produit le double sur les cases agricoles, mais si elle est déplacée de force, la popularité de l'attaquant chute de 3.

## E3. Module : La Décontamination (Europa)

Une mini-campagne à l'intérieur du jeu. Les Zones Rouges peuvent être décontaminées par phases :

1. **Phase Reconnaissance** — envoyer un ouvrier ou un héros sur la case. Coût : perte de 1 puissance (toxicité). Révèle ce qu'il y a (Ferraille, Brevets enfouis, ou Danger).
2. **Phase Nettoyage** — dépenser 2 Acier Brut et 1 Énergie. La case passe de « Rouge » à « Orange » (produit 1 Ferraille par tour).
3. **Phase Renaissance** — dépenser 3 Nourriture et 2 pièces. La case passe de « Orange » à « Verte » — elle produit autant qu'une case normale et vaut 2 points bonus en fin de partie.

Le premier joueur à décontaminer 3 cases gagne 1 étoile. C'est un investissement long et coûteux, mais qui transforme le plateau.

## E4. Module : Congrès de Paix

Quand les conditions sont réunies (au moins 3 factions avec Fièvre < 4, ou 2 factions ayant conclu un accord commercial), un **Congrès de Paix** peut être déclenché. C'est un mini-jeu de négociation :

- Chaque faction envoie un émissaire (ouvrier dédié) en Suisse.
- Les joueurs négocient librement pendant 5 minutes (timer réel).
- Ils peuvent signer des **Traités** : cessez-le-feu bilatéral, accords commerciaux permanents, reconnaissance de frontières, démilitarisation de zones.
- Chaque Traité signé fait baisser la Fièvre de 1 pour les deux signataires.
- Mais chaque Traité non-respecté (violé lors d'un tour ultérieur) fait monter la Fièvre de 3 et donne 1 étoile gratuite à l'Internationale Noire.

Le Congrès crée un moment de jeu unique — du « vrai » diplomatie autour de la table, avec des conséquences mécaniques réelles.

## E5. Module : La Voix des Spectres (Internationale uniquement)

Quand l'Internationale a 5+ Spectres en jeu simultanément, elle débloque un pouvoir unique : **La Voix**. Une émission radio clandestine qui touche toutes les factions.

Mécaniquement : une fois par tour, l'Internationale peut lire à voix haute un « tract » (carte piochée dans un deck dédié) qui impose un choix à TOUS les autres joueurs simultanément :

Exemples :
- *« Ouvriers, posez vos outils ! »* — Chaque joueur choisit : perdre 1 production ce tour OU voir sa Fièvre monter de 1.
- *« Les plans sont publics ! »* — Chaque joueur choisit : révéler sa main de combat OU payer 2 pièces.
- *« Le mecha que vous pilotez a été construit par des enfants. »* — Chaque joueur choisit : retirer 1 mecha du jeu pour 1 tour OU perdre 2 popularité.

---

## E6. Module : La Coalition Edison-Ford (Amériques)

Ce module ajoute une **mécanique de pouvoir centralisé** au plateau Amériques, reflétant l'influence grandissante du Triumvirat Industriel.

### Le Réseau Edison

Au début de la partie, 5 cases industrielles sont connectées au **Réseau Edison** (marquées par un token éclair). Ces cases bénéficient d'un bonus de +1 production. La Fédération Industrielle commence avec le contrôle de ce réseau.

Mais le réseau peut **s'étendre** : tout joueur contrôlant une case adjacente au réseau peut y raccorder sa propre case en dépensant 1 Acier Brut. La case gagne le bonus de production. Le piège : chaque case raccordée au Réseau Edison **donne 1 pièce à la Fédération Industrielle par tour** (redevance énergétique). Edison a inventé le premier abonnement forcé.

L'Internationale Noire peut **couper le réseau** : détruire un token éclair isole toutes les cases en aval. Les bonus disparaissent. La Fièvre de chaque faction affectée monte de 1 (black-out = panique).

Alternative : un joueur possédant le Plan Tesla **Wardenclyffe** peut créer un **réseau rival** en courant alternatif — gratuit, sans redevance, dans un rayon de 3 cases. Les joueurs raccordés au Wardenclyffe ne paient plus Edison. C'est la Guerre des Courants rejouée sur le plateau.

### Le Dearborn Independent

À chaque tour pair, le joueur de la Fédération Industrielle (ou l'automate s'il n'y a pas de joueur) tire une carte **Dearborn** du deck de propagande. Ces cartes ont un effet global sur le plateau :

- *« Les étrangers volent nos emplois »* — Toute faction non-anglophone (Acadiane, Frente Popular) perd 1 popularité.
- *« La conspiration bolchévique »* — L'Internationale Noire doit révéler 1 Cellule au hasard.
- *« Le péril intérieur »* — La République Noire perd 1 ouvrier (arrestation arbitraire) OU gagne 1 Fièvre.
- *« L'Amérique d'abord »* — La Fédération gagne 1 popularité. Toutes les autres factions : Fièvre +1.
- *« Le génie américain »* — La Fédération peut déployer 1 mecha gratuit. Mais l'ironie : le texte de la carte contient une erreur technique que tout le monde sauf la Fédération voit. N'importe quel autre joueur peut « corriger » l'article (dépenser 1 action) pour annuler le mecha gratuit ET baisser la popularité de la Fédération de 1 (humiliation médiatique).

Le deck Dearborn est une horloge narrative : plus la partie avance, plus les cartes deviennent extrêmes. Les premières sont du nationalisme soft. Les dernières sont des appels à la violence. Si la Fédération bascule en Régime Autoritaire (Fièvre 10), le deck est remplacé par le **deck Klan** — des cartes qui déclenchent des attaques directes du Klan Mécanique contre les factions ciblées.

### Condition de victoire alternative : Briser la Coalition

Si un joueur (autre que la Fédération) parvient à réunir ces trois conditions :
1. Contrôler Rouge River
2. Avoir activé Wardenclyffe
3. Avoir au moins 2 Plans Tesla construits

Il peut déclencher l'événement **« La Vérité de Wardenclyffe »** — les origines serbes de la technologie mecha sont révélées au monde. Effet :
- La Fédération Industrielle perd immédiatement 3 popularité
- Le Réseau Edison est **nationalisé** — les redevances cessent
- La Fièvre de la Fédération monte de 3 (crise identitaire)
- TOUTES les autres factions gagnent 1 Plan Tesla gratuit
- L'Internationale Noire gagne 1 étoile

C'est l'équivalent narratif de la découverte de la Factory dans Scythe — un moment qui change la partie. Sauf qu'ici, le secret n'est pas dans un lieu fermé. Il est dans un sous-sol, sous le nez de l'homme le plus puissant du continent, et il dit : tout ce que tu as construit repose sur un mensonge.

---

*Ce document est une base de game design, ouverte au playtesting et à l'itération. Tous les chiffres sont indicatifs et devront être équilibrés par le jeu.*
