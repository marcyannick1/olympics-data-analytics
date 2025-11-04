# Database ingestion & schema

Ce dossier contient :

- `init_db.sql` : script de création du schéma relationnel (tables `hosts`, `athletes`, `results`, `medals`) et exemples de commandes GRANT.
- `db.py` : fonctions utilitaires pour la connexion et l'insertion normalisée.
- `ingest.py` : script d'ingestion/normalisation qui lit `dataset/` et remplit les tables.
- `requirements.txt` : dépendances Python.

Instructions (PowerShell)

1. Créer et activer un environnement virtuel :

```powershell
python -m venv .venv; .\.venv\Scripts\Activate.ps1
```

2. Installer les dépendances :

```powershell
pip install -r database/requirements.txt
```

3. Vérifier votre `.env` à la racine du dépôt (DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD).

4. Initialiser le schéma et ingérer les données :

```powershell
python database\ingest.py
```

Notes sur les rôles / privilèges
- Le fichier `init_db.sql` contient des exemples pour créer des rôles (`db_admin_user`, `db_readonly_user`) et des GRANT. Beaucoup d'hébergeurs (dont AlwaysData) n'autorisent pas la création de rôles par l'utilisateur ; utilisez le panneau d'administration d'AlwaysData pour créer des utilisateurs, ou demandez au support si vous avez besoin d'un rôle spécifique.

- Si votre user DB (celui dans `.env`) n'a pas les droits pour créer tables ou rôles, lancez manuellement le SQL `init_db.sql` depuis l'interface d'administration ou demandez les droits nécessaires.

Prochaines options
- Normaliser davantage les colonnes (ex: splitter `team` vs `noc`) ou ajouter indexes.
- Ajout de script pour revocation/gestion des privilèges CLI.
