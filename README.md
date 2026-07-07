# NOVA ID — Bot de cartes d'identité pour la Cité-État de Nova

Bot Discord qui génère des cartes d'identité RP dans le style d'une carte
nationale d'identité, thème **CITÉ-ÉTAT DE NOVA**, avec intégration
automatique de l'avatar Roblox du joueur.

**Ce bot n'utilise PAS les commandes slash `/`.** Il fonctionne avec des
mots déclencheurs tapés dans un salon :
- `nova.id` → crée une carte d'identité
- `nova.getid` → recherche la carte d'un joueur (réservé à certains rôles)
- `nova.delid @joueur` → supprime la ou les cartes d'un joueur, avec
  confirmation (réservé à certains rôles)

## ⚠️⚠️⚠️ LIS CECI EN PREMIER — comment rendre les données persistantes

**C'est le point le plus important à comprendre avant de déployer.**

Les cartes sont stockées dans un fichier JSON local (`data/cards.json`).
Sur Railway, **le système de fichiers est éphémère par défaut** : à chaque
fois que tu pousses du nouveau code (`git push`) et que Railway redéploie
le bot, ce fichier est **remis à zéro**, comme si le disque entier était
rendu neuf. Ce n'est pas un bug du bot — c'est le comportement normal d'un
service Railway sans stockage persistant configuré.

**Pour que les cartes survivent à un redéploiement, il faut ajouter un
"Volume" Railway — une seule fois, ça ne se refait pas à chaque push :**

1. Ouvre ton projet sur [railway.app](https://railway.app)
2. Clique sur ton service (le bot)
3. Onglet **Settings** → section **Volumes** → **+ New Volume**
4. Comme chemin de montage ("Mount path"), mets exactement :
   ```
   /app/data
   ```
5. Clique sur **Add** / **Deploy**

Une fois ce volume créé, Railway attache un vrai disque persistant à ce
dossier précis. Tous les redéploiements suivants (nouveaux `git push`,
changements de variables, etc.) **ne toucheront plus** à ce qu'il contient.
`data/cards.json` continuera d'exister et de grandir au fil des créations
de cartes, push après push.

**Sans ce volume**, le bot fonctionne très bien au quotidien (les cartes
sont bien créées, consultées, supprimées), mais **repart de zéro à chaque
redéploiement** — ce qui n'est probablement pas ce que tu veux pour un
système d'identité RP censé durer.

## ✨ Fonctionnalités

- `nova.id` → embed avec bouton "Remplir le formulaire". Le clic ouvre un
  formulaire unique avec 5 champs (pseudo Roblox, nom, prénoms, date/lieu
  de naissance, sexe — `M`, `F` ou `NB` pour Non-binaire). Le skin Roblox
  est récupéré automatiquement.
- Limite configurable de cartes par membre (**2 par défaut**).
- À la création d'une carte : un rôle est automatiquement **retiré** et un
  autre **ajouté** au membre, et son pseudo sur le serveur est changé en
  `[C]〃<nom d'affichage global>` pour marquer visuellement les citoyens
  enregistrés.
- Chaque carte créée est archivée (en embed, avec un bouton de
  suppression) dans un salon de logs configuré via `LOG_CHANNEL_ID`.
- `nova.getid` → embed + bouton "Rechercher un joueur", réservé aux
  membres ayant un des rôles listés dans `VIEWER_ROLE_IDS` (consultation
  seule).
- **`nova.delid @joueur`** → réservé aux rôles listés dans
  `STAFF_ROLE_IDS` (variable **différente** de `VIEWER_ROLE_IDS` : un
  membre peut avoir accès à la consultation sans pouvoir supprimer). Liste
  toutes les cartes créées par ce membre Discord, chacune avec un bouton
  **🗑️ Supprimer cette carte**. Un clic demande confirmation (boutons
  Confirmer/Annuler) avant de supprimer réellement — la suppression libère
  un emplacement, le joueur peut alors en recréer une avec `nova.id`.
- **Suppression aussi depuis le salon de logs** (également protégée par
  `STAFF_ROLE_IDS`) : chaque carte archivée dans `LOG_CHANNEL_ID` a son
  propre bouton de suppression directement sur le message, avec la même
  confirmation. Toute suppression (peu importe
  d'où elle est lancée) est elle-même notifiée dans le salon de logs, avec
  qui l'a supprimée.
- Format de carte réaliste : coins arrondis, bande "holographique",
  code-barres décoratif, emblème en forme de palmier.

## ⚠️ Étape OBLIGATOIRE — activer "Message Content Intent"

Ce bot lit le contenu des messages pour reconnaître `nova.id`, `nova.getid`
et `nova.delid`. Il faut donc activer un intent privilégié :

1. Va sur https://discord.com/developers/applications
2. Sélectionne ton application → onglet **Bot**
3. Descends jusqu'à **Privileged Gateway Intents**
4. Active **MESSAGE CONTENT INTENT**
5. Sauvegarde

**Sans cette étape, le bot se connecte normalement mais ne réagit à aucun
mot déclencheur.**

## 📁 Structure du projet

```
nova-id-bot/
├── index.js                  # Point d'entrée : messages, boutons, formulaires
├── package.json
├── Procfile                   # Pour Railway
├── .env.example
├── assets/
│   ├── fonts/                  # Polices utilisées pour le rendu de la carte
│   └── branding/
│       └── nova-banner.png      # Visuel Nova utilisé dans les embeds
├── config/
│   └── cardTheme.js            # <-- Textes, couleurs, dimensions de la carte (modifiable)
├── commands/
│   ├── createId.js             # nova.id (bouton + formulaire + embed privé)
│   ├── getId.js                 # nova.getid (recherche, embed privé)
│   └── deleteId.js              # nova.delid + boutons de suppression/confirmation
├── utils/
│   ├── roblox.js                # Résolution pseudo Roblox -> avatar
│   ├── storage.js               # Stockage JSON des cartes (création/recherche/suppression)
│   ├── cardRenderer.js          # Génération de l'image de la carte (Canvas)
│   └── branding.js              # Attache le visuel Nova aux embeds
└── data/
    └── cards.json               # Base de données des cartes (créé automatiquement)
```

## 🛠️ Étape 1 — Créer l'application Discord

1. Va sur https://discord.com/developers/applications
2. "New Application" → nomme-la **NOVA ID** (ou autre)
3. Onglet **Bot** → "Reset Token" → copie le token (➡️ `DISCORD_TOKEN`)
4. Active **MESSAGE CONTENT INTENT** (voir section dédiée ci-dessus)
5. Onglet **OAuth2 > URL Generator** :
   - Scopes : `bot` uniquement
   - Permissions : `Send Messages`, `Manage Roles`, `Manage Nicknames`,
     `Attach Files`, `Embed Links`, `Read Message History`
   - Ouvre l'URL générée pour inviter le bot sur ton serveur

**Important sur la hiérarchie des rôles** : dans les paramètres du serveur
(Rôles), place le rôle du bot **au-dessus** des rôles `ROLE_TO_REMOVE_ID` et
`ROLE_TO_ADD_ID`, et au-dessus du rôle le plus haut des membres qui
utiliseront `nova.id`, sinon le bot n'aura pas la permission de les gérer
(limitation Discord, pas un bug). Discord ne permet jamais de renommer le
**propriétaire du serveur**, quels que soient les rôles.

## 🛠️ Étape 2 — Récupérer les IDs nécessaires

Active le mode développeur dans Discord (Paramètres > Avancés > Mode
développeur), puis clic droit pour copier :
- L'ID de chaque rôle autorisé à **consulter** les cartes avec
  `nova.getid` (➡️ `VIEWER_ROLE_IDS`, séparés par des virgules)
- L'ID de chaque rôle autorisé à **supprimer** des cartes avec
  `nova.delid` ou le bouton dans les logs (➡️ `STAFF_ROLE_IDS`, séparés
  par des virgules — variable différente de `VIEWER_ROLE_IDS`)
- L'ID du rôle à retirer à la création d'une carte (➡️ `ROLE_TO_REMOVE_ID`)
- L'ID du rôle à ajouter à la création d'une carte (➡️ `ROLE_TO_ADD_ID`)
- L'ID du salon d'archives (➡️ `LOG_CHANNEL_ID`)

## 🛠️ Étape 3 — Configurer les variables d'environnement

Sur Railway : onglet **Variables** de ton service → ajoute toutes les
valeurs listées dans `.env.example`.

## 🚀 Étape 4 — Déployer sur Railway

1. Crée un repo GitHub avec ce projet (le `.gitignore` empêche d'y inclure
   `.env` et `data/cards.json`)
2. Sur [Railway](https://railway.app) : "New Project" → "Deploy from GitHub repo"
3. Vérifie que `package.json` est bien à la racine du repo
4. Ajoute les variables d'environnement (étape 3 ci-dessus)
5. **Ajoute un Volume monté sur `/app/data`** (voir la section tout en haut
   de ce README — c'est ce qui garantit que les cartes ne sont pas perdues
   à chaque redéploiement)
6. Railway utilise le `Procfile` pour exécuter `node index.js`

## 💬 Utilisation

- `nova.id` → crée une carte (max `MAX_CARDS_PER_USER` par membre)
- `nova.getid` → recherche les cartes d'un joueur (`VIEWER_ROLE_IDS`)
- `nova.delid @joueur` → liste et permet de supprimer les cartes créées
  par ce membre, avec confirmation (`STAFF_ROLE_IDS`)

## ✏️ Personnaliser le style de la carte

Tout se passe dans `config/cardTheme.js` : nom de l'État, sous-titres,
couleurs, durée de validité, dimensions de l'image. Pour des changements de
mise en page plus poussés, la logique se trouve dans `utils/cardRenderer.js`.

## 🔧 Notes techniques

- Le rendu d'image utilise `@napi-rs/canvas` (aucune dépendance système à
  installer), compatible directement avec Railway.
- L'intégration Roblox utilise les endpoints publics `users.roblox.com` et
  `thumbnails.roblox.com` — aucune clé API n'est nécessaire.
- Les réponses "privées" utilisent le mécanisme natif Discord des messages
  éphémères (`ephemeral: true`).
- La suppression d'une carte ne touche jamais aux rôles Discord déjà
  attribués lors de sa création (`ROLE_TO_REMOVE_ID` / `ROLE_TO_ADD_ID` ne
  sont pas inversés automatiquement) — seule la carte elle-même est
  supprimée de la base, ce qui libère un emplacement pour en recréer une.
  Si tu veux qu'une suppression redonne aussi l'ancien rôle au joueur,
  dis-le, c'est un ajout simple dans `commands/deleteId.js`.
