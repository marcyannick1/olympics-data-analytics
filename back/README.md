Backend API (Express.js)

Ce dossier contient un petit backend Express pour exposer des endpoints qui lisent la base PostgreSQL créée dans `database/`.

Fichiers principaux
- `package.json` : dépendances (express, pg, dotenv, cors).
- `db.js` : connexion Postgres via `pg` et lecture du `.env` à la racine du projet.
- `index.js` : serveur express et routes :
	- GET `/api/hosts` — liste des jeux (filtres: `year`, `season`)
	- GET `/api/hosts/:slug` — détail d'un hôte
	- GET `/api/athletes` — liste des athlètes (filtres: `name`, `team`, `noc`, `limit`, `offset`)
	- GET `/api/athletes/:id` — détail d'un athlète + ses résultats
	- GET `/api/results` — liste des résultats (filtres: `game_slug`, `sport`, `medal`)
	- GET `/api/medals` — liste des médailles (filtres: `game_slug`, `medal_type`)

Installation et exécution (PowerShell)

1. Depuis la racine du repo (où se trouve le `.env`), installez les dépendances :

```powershell
cd back
npm install
```

2. Démarrer le serveur :

```powershell
npm start
# ou en développement avec nodemon si installé : npm run dev
```

Le serveur écoute par défaut sur le port `3001`. Exemple d'appel :

```powershell
Invoke-RestMethod -Uri 'http://localhost:3001/api/hosts'
Invoke-RestMethod -Uri 'http://localhost:3001/api/athletes?name=smith&limit=10'
Invoke-RestMethod -Uri 'http://localhost:3001/api/results?game_slug=beijing-2022&medal=GOLD'
```

Notes
- Le serveur lit la configuration DB depuis le `.env` à la racine du projet (variables : `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`).
- Assurez-vous que les tables existent et que le user indiqué dans `.env` a les droits SELECT (et INSERT si vous utilisez les scripts d'ingestion).
- Pour la production, configurez TLS/SSL et révisez les politiques CORS / auth.
