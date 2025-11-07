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

Migration des champs JSON `extra` -> colonnes normales
-------------------------------------------------
Si vos données ont été stockées dans la colonne `extra` (JSONB), j'ai ajouté un petit script
`database/migrate_extra.py` qui extrait les champs courants présents dans `results.extra`
et les place dans des colonnes dédiées de la table `athletes` et `results` quand celles-ci
sont NULL.

Ce que fait le script:
- ajoute `athletes.profile_url`, `athletes.bio`, `athletes.games_participations` si nécessaires
- pour chaque ligne `results` avec `extra` non NULL: met à jour `athletes` (name/profile_url/bio/age)
	et met à jour `results.sport`, `results.event`, `results.medal` à partir des clés comme
	`discipline_title`, `event_title`, `medal_type` si ces colonnes sont vides

Exécution (après sauvegarde de la base):

```powershell
python database\migrate_extra.py
```

Le script est conservateur : il ne remplace pas les valeurs déjà présentes, il ne fait que remplir
les colonnes NULL à partir des données trouvées dans `extra`.

