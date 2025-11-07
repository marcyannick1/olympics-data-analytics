🏅 Olympics Data Analytics (JO GPT)

> Projet académique de prédiction et d’analyse des Jeux Olympiques (Paris 2024)  
> Master Data & IA — IPSSI 2024/2025  
> Développé par **Jokast Kassa**

---

## 🎯 Objectif du projet

Ce projet vise à **analyser les données historiques des Jeux Olympiques** et à utiliser des modèles d’**Intelligence Artificielle** pour :

- 🔹 **Prédire le nombre de médailles** par pays (ex : France 2024)
- 🔹 **Prédire les athlètes susceptibles de remporter une médaille**
- 🔹 **Regrouper les pays (clustering)** selon leurs profils de performance
- 🔹 **Visualiser et interpréter** les résultats via une interface web (frontend React)

Le projet suit une approche complète **Data Science → Machine Learning → API → Frontend**.

---

## 🧱 Architecture générale

```
olympics-data-analytics/
├── ai/                     → Service d’IA (Flask + Python)
│   ├── data/               → Données brutes (Excel, XML)
│   ├── features/           → Scripts de préparation de features
│   ├── models/             → Entraînement et prédiction ML
│   ├── artifacts/          → Modèles sauvegardés (.joblib)
│   ├── app.py              → API Flask (routes /predict, /cluster, etc.)
│   └── requirements.txt    → Dépendances Python
│
├── back/                   → Backend Node.js (API principale / DB bridge)
│   ├── db.js, index.js
│   └── package.json
│
├── database/               → Scripts de base de données PostgreSQL
│   ├── init_db.sql
│   ├── ingest.py
│   ├── extract_medals_xlsx.py
│   └── update_geo_gpd.py
│
├── dataset/                → Données sources
│   ├── olympic_medals.xlsx
│   ├── olympic_hosts.xml
│   ├── olympic_athletes.json
│   └── olympic_results.html
│
├── front/                  → Application web (React + Vite)
│   ├── src/
│   ├── public/
│   └── package.json
│
├── notebooks/              → Analyses exploratoires (Jupyter)
│   └── 01_data_exploration.ipynb
│
└── README.md               → Présent fichier
```

---

## ⚙️ Technologies utilisées

| Domaine | Outils / Librairies |
|----------|--------------------|
| **Backend IA** | Flask, scikit-learn, pandas, numpy, joblib |
| **Machine Learning** | RandomForest, Gradient Boosting, Poisson Regressor, Logistic Regression, KMeans |
| **Data Processing** | pandas, openpyxl, lxml, XML parsing |
| **Frontend** | React.js, TailwindCSS, Recharts, D3.js |
| **Base de données** | PostgreSQL (AlwaysData / Vercel integration) |
| **Environnement** | Python 3.12, Node.js 20+, Vite, .venv |

---

## 🧠 Étapes du projet

### 1️⃣ Collecte et ingestion
- Données sources : `olympic_medals.xlsx`, `olympic_hosts.xml`
- Nettoyage, harmonisation et fusion des données
- Création d’un dataset par **pays / année / saison**

### 2️⃣ Traitement et Feature Engineering
- Variables dérivées :
  - `lag_total_prev1`, `lag_gold_prev1`, `is_host`
  - Ajout futur de `GDP`, `population`, `athlete_count`
- Construction de deux jeux de données :
  - Pays / médailles → régression
  - Athlètes / caractéristiques → classification

### 3️⃣ Entraînement IA
- **Régression (prédiction de médailles)** :
  - RandomForest, GradientBoosting, Poisson
  - Évaluation : `MAE`, `RMSE`, `R²`
- **Classification (athlètes médaillés)** :
  - LogisticRegression équilibrée (F1-score ~ 0.75)
- **Clustering (profils pays)** :
  - K-Means + PCA (Silhouette Score ≈ 0.6)

### 4️⃣ Déploiement API (Flask)
Routes principales :
| Méthode | Endpoint | Description |
|----------|-----------|--------------|
| `GET` | `/predict/france?year=2024` | Prédiction pour un pays |
| `GET` | `/predict/top25?year=2024` | Top 25 des pays |
| `POST` | `/predict/athletes` | Prédiction athlètes |
| `GET` | `/cluster/countries?k=5` | Regroupement de pays |
| `POST` | `/train/country` | Réentraînement des modèles |

---

## 🚀 Installation et lancement

### 📦 1. Environnement IA (Flask)
```bash
cd ai
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python app.py
```
L’API tourne sur `http://localhost:5001`

---

### ⚡ 2. Frontend React
```bash
cd front
npm install
npm run dev
```
Interface disponible sur `http://localhost:5173`

---

### 🧩 3. Base de données PostgreSQL
```bash
cd database
psql -U user -d olympics -f init_db.sql
python ingest.py
```

---

## 🧮 Exemple de résultats

### Régression (JO 2024 – France)
```json
{
  "year": 2024,
  "season": "Summer",
  "country_code": "FRA",
  "country": "France",
  "predictions": {
    "gold": 12,
    "silver": 8,
    "bronze": 7,
    "total": 27
  }
}
```

### Évaluation modèle :
```
Régression: { MAE: 11.75, RMSE: 15.74, R²: 0.611 }
```
→ Le modèle explique **61 % des variations** des performances historiques.

---

## 🧭 Clustering des pays (K-Means)
```json
{
  "k": 5,
  "centroids": [...],
  "labels": [
    { "Country": "France", "NOC": "FRA", "cluster": 2 },
    { "Country": "USA", "NOC": "USA", "cluster": 4 },
    { "Country": "Kenya", "NOC": "KEN", "cluster": 1 }
  ]
}
```
→ 5 groupes de pays selon leur profil sportif.

---

## 🧾 Organisation du code ML

| Fichier | Rôle |
|----------|------|
| `build_country_features.py` | Préparation des données par pays |
| `build_athlete_features.py` | Préparation des données par athlètes |
| `train_country_regression.py` | Entraînement modèles de régression |
| `train_athlete_classifier.py` | Entraînement modèle de classification |
| `train_clustering.py` | Clustering K-Means |
| `eval.py` | Calcul MAE, RMSE, F1, silhouette |
| `app.py` | API Flask et routes |

---

## 🧠 Évaluation des modèles

| Type | Métriques | Interprétation |
|------|------------|----------------|
| Régression | MAE = 11.75 / RMSE = 15.74 / R² = 0.61 | Modèle correct, améliorable avec GDP / population |
| Classification | F1 ≈ 0.75 | Bon équilibre précision / rappel |
| Clustering | Silhouette ≈ 0.6 | Groupes bien séparés (k=5 optimal) |

---

## 📊 Perspectives d’amélioration

- Intégrer des données socio-économiques (PIB, population)
- Approfondir le modèle athlètes avec de vrais datasets (non synthétiques)
- Optimiser les hyperparamètres avec GridSearchCV
- Déployer l’API sur **Vercel** et la BDD sur **AlwaysData**

---