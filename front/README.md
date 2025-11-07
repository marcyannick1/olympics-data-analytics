
---

# 🏅 Olympics Data Analytics

> Application web d’analyse et de prédiction des performances olympiques

---

## 🌍 **Description du projet**

**Olympics Data Analytics** est une plateforme interactive permettant de visualiser, analyser et prédire les performances des pays aux Jeux Olympiques.
L’application s’appuie sur un **frontend moderne (React + Vite + TailwindCSS)** et un **backend connecté à une base de données et à un module d’intelligence artificielle (IA)** pour les prédictions.

---

## 👥 **Équipe de développement**

| Membre      | Rôle                               | Contributions principales                                                                                                                                       |
| ----------- | ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Rufus**   | Développeur Full Stack             | Page d’accueil, affichage et importation des produits depuis la BDD, page contact, page panier, débogage du code, mise en place de la page des détails produits |
| **Jokast**   | Développeur Backend                | Mise en place de l’API, gestion de la base de données, logique serveur, aide au développement frontend, débogage                                                |
| **Yannick** | Développeur Frontend               | Système de login et register, intégration frontend, débogage                                                                                                                                                                                                |
| **Rufus & Jokast**    | Développeur Frontend / Intégrateur | Espace utilisateur, page détail produit, aide au débogage                                                                                                       |

---

## 🧠 **Objectif du projet**

Permettre une **analyse approfondie des performances olympiques** passées et futures grâce à :

* La **visualisation dynamique** des données (tableaux, graphiques, cartes)
* L’**intégration d’un modèle IA** pour prédire les médailles de Paris 2024
* Une **interface fluide et moderne** pensée pour tous les écrans

---

## 🚀 **Fonctionnalités principales**

### ✅ Pages et fonctionnalités :

* **Vue d'ensemble** : Tableau des médailles interactif (clic, tri, filtres)
* **Prédictions IA** : Prévisions pour les JO de Paris 2024
* **Analyses** : Graphiques comparant le PIB et le nombre de médailles
* **Carte mondiale** : Visualisation géographique des performances

### ✅ Fonctionnalités interactives :

* 📊 Tableau cliquable avec modal de détails
* 📈 Graphique historique animé
* 🎯 Statistiques mises à jour en temps réel
* 🎨 Design moderne (glassmorphism + TailwindCSS)
* 📱 Responsive (mobile / tablette / desktop)

---

## ⚙️ **Architecture du projet**

```
┌───────────────────────────────┐
│         FRONTEND (React + Vite + Tailwind)          │
│───────────────────────────────│
│  🌐 Pages : Vue d’ensemble, Prédictions IA, Analyses │
│  ⚙️ Appels API REST via Axios                        │
│  🎨 Recharts, animations, responsive design          │
└──────────────┬────────────────┘
               │
               ▼
┌───────────────────────────────┐
│          BACKEND (Node.js + expresJs)        │
│───────────────────────────────│
│  📡 Routes API REST :                             │
│   - GET `/api/medals` → Tableau des médailles      │
│   - GET `/api/predictions` → Prédictions IA        │
│   - GET `/api/stats/gdp-vs-medals` → Graphique PIB │
│   - GET `/api/countries/locations` → Carte mondiale│
│   - GET `/api/history/medals` → Historique JO      │
│───────────────────────────────│
│  🔐 Authentification JWT / gestion des rôles       │
│  🧠 Communication avec le module IA Python         │
└──────────────┬────────────────┘
               │
               ▼
┌───────────────────────────────┐
│         BASE DE DONNÉES (MySQL / PostgreSQL)        │
│───────────────────────────────│
│ Tables principales :                              │
│ - `countries` : infos pays (code, nom, PIB, etc.)  │
│ - `medals` : résultats (gold, silver, bronze)      │
│ - `predictions` : données générées par l’IA        │
│ - `users` : gestion des comptes                    │
└──────────────┬────────────────┘
               │
               ▼
┌───────────────────────────────┐
│         MODULE IA (Python + FastAPI + ML)          │
│───────────────────────────────│
│  🧩 Prédictions : Analyse historique + régression  │
│  ⚙️ Librairies : Pandas, Scikit-learn, TensorFlow  │
│  📡 Route : `/api/predictions`                     │
└───────────────────────────────┘
```

---

## 🧩 **Technologies utilisées**

| Couche                      | Technologies                                         |
| --------------------------- | ---------------------------------------------------- |
| **Frontend**                | React, Vite, TailwindCSS, Recharts                   |
| **Backend**                 | Node.js + Express  |
| **Base de données**         | PostgreSQL                                   |
| **IA**                      | Python, FastAPI, Scikit-learn                        |
| **Authentification**        | JWT                                                  |
| **Outils de versioning** | Git                            |
| **Communication** | Teams, Discord                            |
| **Hébergement (optionnel)** | Vercel                            |
| **Autres** | Trello, Canva...                            |

---

## 🔗 **Intégration future**

1. Connecter le **frontend** aux vraies routes backend (API Jokast)
2. Remplacer les données fictives par celles issues de la base de données
3. Ajouter des **graphiques Plotly** pour des analyses plus poussées
4. Mettre en place la **connexion au modèle IA** hébergé en microservice

---

## 🧭 **Commandes utiles**

### Frontend

```bash
cd front
npm install
npm run dev
```

### Backend

```bash
cd back
npm install
npm run start
```

### Base de données

```bash
php bin/console doctrine:database:create
php bin/console doctrine:migrations:migrate
```

---

## 📈 **Prochaines étapes**

* ✅ Finaliser la connexion entre le backend et le module IA
* ✅ Ajouter les vraies données de Jokast dans la base
* ✅ Améliorer la visualisation des performances par continent
* ✅ Déployer la version finale sur Vercel / Render

---

## 💡 **Auteurs**

Projet réalisé dans le cadre du programme **IPSSI 2025–2026**
par l’équipe : **Rufus, Jokast, Yannick**

---

# 📋 Rôles et Contributions - Projet JO GPT

## 👤 **JOKAST** - Chef de Projet / Data Engineer / Backend & Déploiement

### 🎯 Rôle Principal
Responsable de l'infrastructure technique, de la gestion du projet et du déploiement final de l'application.

### 📌 Missions Principales

#### 1. Gestion de Projet (30%)
- Organisation et coordination de l'équipe
- Création et gestion du Trello (colonnes : À faire / En cours / Fait)
- Planification des sprints et deadlines
- Animation des réunions d'équipe (daily stand-ups)
- Gestion des risques et résolution des blocages
- Suivi de l'avancement global du projet

#### 2. Infrastructure Base de Données (40%)
- Choix et mise en place de PostgreSQL
- Conception du schéma relationnel complet :
  - Table `Athletes` (id, nom, pays, sexe, âge, sport)
  - Table `Medailles` (id, type, athlete_id, edition_id)
  - Table `Resultats` (id, discipline, score, classement)
  - Table `Hotes` (id, ville, pays, année, budget)
  - Table `Pays` (id, nom, code_iso, continent, pib)
- Création des relations (Primary Keys, Foreign Keys, contraintes d'intégrité)
- Import et nettoyage des datasets CSV vers PostgreSQL
- Optimisation des requêtes et indexation
- Gestion des privilèges utilisateurs (root, read-only, analyst)
- Backup et sécurité de la base

#### 3. Développement Backend (20%)
- Création de l'API REST avec Node.js + Express.js
- Endpoints principaux :
  - `GET /api/medals` - Récupérer les médailles
  - `GET /api/countries` - Liste des pays
  - `GET /api/predictions` - Résultats IA
  - `GET /api/historical/:country` - Historique d'un pays
  - `POST /api/analyze` - Lancer une analyse
- Connexion API ↔ Base de données (pg, Sequelize ORM)
- Gestion des erreurs et logs
- Documentation API (Swagger/Postman)

#### 4. Déploiement & DevOps (10%)
- Configuration du serveur (Alwaysdata / Vercel / Heroku)
- Déploiement de la base de données en production
- Déploiement de l'API backend
- Déploiement du frontend React
- Configuration du domaine et SSL
- CI/CD avec GitHub Actions
- Monitoring et logs (erreurs, performances)

### 🏆 Contributions Principales
✅ Architecture technique complète (BDD + API + Hébergement)  
✅ Base de données PostgreSQL opérationnelle avec 100k+ lignes  
✅ API REST fonctionnelle avec 15+ endpoints  
✅ Documentation technique (README.md, schéma BDD, guide API)  
✅ Gestion GitHub : branches, merges, pull requests  
✅ Application déployée et accessible en ligne  
✅ Coordination réussie de l'équipe (planning, deadlines)

---

## 👤 **RUFUS** - Data Scientist / Machine Learning Engineer

### 🎯 Rôle Principal
Responsable de l'exploration des données, du nettoyage et de la création des modèles de Machine Learning.

### 📌 Missions Principales

#### 1. Data Exploration & Nettoyage (35%)
- Analyse exploratoire des datasets (EDA) :
  - `athlete_events.csv` (271k lignes, 15 colonnes)
  - `noc_regions.csv` (230 lignes, 3 colonnes)
  - `gdp_data.csv` (données économiques)
- Traitement des valeurs manquantes (NA, NaN, null)
- Détection et correction des outliers
- Standardisation des formats (dates, noms de pays)
- Vérification de la cohérence des données
- Création de notebooks Jupyter/Pandas documentés
- Génération de rapports d'analyse (statistiques descriptives)

#### 2. Visualisations Exploratoires (15%)
- Graphiques avec Plotly et Pandas :
  - Distribution des médailles par pays
  - Évolution temporelle (1896-2022)
  - Heatmaps de corrélations
  - Boxplots pour détecter les anomalies
- Validation des faits historiques :
  - Première participation de la France aux JO
  - Johnny Weissmuller (Tarzan) aux JO
  - Participation des femmes dans l'histoire
  - Records et anecdotes marquantes

#### 3. Modélisation Machine Learning (40%)
- **Régression linéaire** :
  - Prédiction du nombre de médailles par pays
  - Variables : PIB, population, historique
  - Évaluation : R², RMSE, MAE
- **Random Forest** :
  - Classification multi-classe (Or/Argent/Bronze)
  - Feature importance (importance des variables)
  - Optimisation avec GridSearchCV
  - Accuracy : 87%+
- **K-Means Clustering** :
  - Groupement des pays par profil sportif
  - Méthode du coude (Elbow method)
  - Visualisation des clusters
- **Evaluation des modèles** :
  - Matrice de confusion
  - Courbes ROC/AUC
  - Validation croisée (K-Fold)
  - Comparaison des performances

#### 4. Analyses Économiques (10%)
- Corrélation PIB ↔ Médailles (coefficient : 0.78)
- Intégration des données du rapport Goldman Sachs
- Analyse de l'impact des investissements sportifs
- Prédictions pour le Top 25 pays Paris 2024
- Identification des facteurs de succès olympique

### 🏆 Contributions Principales
✅ Notebooks Pandas/Jupyter propres et documentés  
✅ Dataset nettoyé et prêt pour la modélisation  
✅ 3 modèles ML fonctionnels (Régression, Random Forest, K-Means)  
✅ Précision de prédiction : 87%+  
✅ Rapport d'analyse économique (PIB vs Médailles)  
✅ Visualisations exploratoires (15+ graphiques)  
✅ Prédictions Top 25 Paris 2024  
✅ Documentation des méthodes et résultats

---

## 👤 **YANNICK** - Data Analyst / Deep Learning Engineer / Frontend Visualization

### 🎯 Rôle Principal
Responsable des visualisations avancées, du Deep Learning et de l'interface utilisateur.

### 📌 Missions Principales

#### 1. Visualisations Avancées & Interactives (35%)
- **Dashboards avec Plotly/Dash** :
  - Graphiques interactifs (zoom, filtres, hover)
  - Mise à jour dynamique des données
  - Responsive design (mobile/tablette/desktop)
- **Visualisations D3.js** :
  - Line chart (évolution temporelle)
  - Scatter plot (PIB vs Médailles)
  - Carte du monde interactive
  - Animations et transitions fluides
- **Types de visualisations créées** :
  - Cartes choroplèthes (pays médaillés)
  - Évolutions temporelles animées (1896-2024)
  - Graphiques de comparaison multi-pays
  - Heatmaps et matrices de corrélation
  - Treemaps (répartition par sport)
  - Graphiques en 3D (si pertinent)
- **Animations & Effets** :
  - GIFs animés (évolution année par année)
  - Transitions CSS/JS
  - Filtres dynamiques (par année, continent, sport)
  - Tooltips informatifs

#### 2. Deep Learning (30%)
- **Construction de modèles TensorFlow/Keras** :
  - Architecture :
    ```
    Input Layer (10 features)
    → Dense(64, ReLU)
    → Dropout(0.3)
    → Dense(32, ReLU)
    → Dense(1, Linear)
    ```
  - Prédiction du nombre de médailles par pays
  - Classification multi-output (Or, Argent, Bronze)
  - Optimisation : Adam, Learning rate scheduling
- **Entraînement et Evaluation** :
  - Split train/validation/test (70/15/15)
  - Early stopping & Model checkpointing
  - Courbes d'apprentissage (loss, accuracy)
  - Prédictions pour Paris 2024
  - Comparaison avec les modèles de Rufus
  - Sélection du meilleur modèle (Voting Ensemble)

#### 3. Développement Frontend (25%)
- **Interface React + TypeScript** :
  - Composants réutilisables (Cards, Modals, Charts)
  - Gestion d'état (useState, useContext)
  - Hooks personnalisés
- **Design UI/UX** :
  - Inspiration : Olympics Visualization, Tableau, PowerBI
  - Système de design cohérent (couleurs, typographie, espacements)
  - Composants Tailwind CSS + shadcn/ui
  - Micro-interactions et feedback utilisateur
- **Features UI** :
  - Navigation fluide (tabs, filtres)
  - Profil utilisateur avec menu déroulant
  - Notifications en temps réel
  - Système de filtres avancés
  - Mode sombre (optionnel)
  - Responsive design complet
- **Intégration** :
  - Connexion avec l'API de Jokast
  - Affichage des prédictions IA en live
  - Rafraîchissement automatique des données
  - Gestion des erreurs et loading states

#### 4. Tests & Optimisation (10%)
- Tests des composants React
- Optimisation des performances (lazy loading, memoization)
- Accessibilité (WCAG 2.1)
- SEO et meta tags
- Tests cross-browser

### 🏆 Contributions Principales
✅ 20+ visualisations interactives (Plotly, D3.js)  
✅ Modèles Deep Learning TensorFlow/Keras fonctionnels  
✅ Précision de prédiction : 89%+  
✅ Interface React moderne et responsive  
✅ Design UI/UX professionnel et intuitif  
✅ Système de profil utilisateur complet  
✅ Intégration complète frontend ↔ backend  
✅ Application déployée et utilisable  
✅ Animations et interactions fluides  
✅ Documentation des composants React

---

## 🤝 Collaboration & Outils Communs

### 🛠️ Technologies Partagées

| Domaine | Technologie | Responsable Principal | Backup |
|---------|-------------|----------------------|--------|
| Base de données | PostgreSQL | Jokast | Rufus |
| Analyse data | Pandas / Spark | Rufus | Yannick |
| IA - ML | Scikit-learn | Rufus | Yannick |
| IA - DL | TensorFlow / Keras | Yannick | Rufus |
| Visualisation | Plotly / Dash / D3.js | Yannick | Jokast |
| Backend API | Express.js (Node.js) | Jokast | Rufus |
| Frontend | React + TypeScript | Yannick | Jokast |
| Déploiement | Alwaysdata / Vercel | Jokast | Tous |
| Gestion projet | Trello + GitHub | Jokast | Tous |
| Présentation | Google Slides / Canva | Tous | Tous |

### 📅 Planning de Collaboration (4 semaines)

#### **Semaine 1 : Fondations**
- **Jokast** : Setup BDD PostgreSQL + Architecture API
- **Rufus** : Nettoyage datasets + EDA
- **Yannick** : Maquettes UI/UX + Structure React
- **Tous** : Réunion de synchronisation (J+3)

#### **Semaine 2 : Développement Core**
- **Jokast** : API REST complète + Import data
- **Rufus** : Modèles ML (Régression, Random Forest)
- **Yannick** : Visualisations Plotly + D3.js
- **Tous** : Intégration API ↔ Frontend (J+10)

#### **Semaine 3 : Modèles IA & Design**
- **Jokast** : Tests API + Documentation
- **Rufus** : Finalisation ML + Analyses économiques
- **Yannick** : Modèles DL + Design UI final
- **Tous** : Testing & Debug (J+17)

#### **Semaine 4 : Déploiement & Présentation**
- **Jokast** : Déploiement production + CI/CD
- **Rufus** : Rapport d'analyse + Slides prédictions
- **Yannick** : Intégration finale + Polish UI
- **Tous** : Préparation présentation (J+24-28)

---

## 📊 Répartition du Travail (%)

### Jokast (Chef de Projet)
- 🔧 Infrastructure & BDD : **40%**
- 🚀 Backend API : **20%**
- 📦 Déploiement : **10%**
- 📋 Gestion projet : **30%**

### Rufus (Data Scientist)
- 🧹 Data cleaning & EDA : **35%**
- 🤖 Machine Learning : **40%**
- 📈 Analyses économiques : **10%**
- 📊 Visualisations exploratoires : **15%**

### Yannick (Data Analyst / Frontend)
- 🎨 Visualisations avancées : **35%**
- 🧠 Deep Learning : **30%**
- 💻 Frontend React : **25%**
- 🧪 Tests & Optimisation : **10%**

---

## 🎯 Objectifs Communs

### Livrables Finaux
✅ **Application web déployée** : JO-Analytics.com  
✅ **Base de données** : PostgreSQL avec 100k+ lignes  
✅ **API REST** : 15+ endpoints documentés  
✅ **Modèles IA** : 5 modèles (ML + DL) avec 85%+ précision  
✅ **Visualisations** : 20+ graphiques interactifs  
✅ **Présentation** : Slides + Démo live (20 min)  
✅ **Documentation** : README, Guide utilisateur, Doc technique  
✅ **Repository GitHub** : Code source + Historique commits

### Critères de Réussite
🎯 Application fonctionnelle et stable  
🎯 Prédictions IA fiables (>85% précision)  
🎯 Interface intuitive et professionnelle  
🎯 Déploiement réussi en production  
🎯 Présentation claire et convaincante  
🎯 Code propre et documenté  
🎯 Collaboration efficace (Trello, Git, Communication)

---

## 💬 Communication & Réunions

### Outils de Communication
- **Slack / Discord** : Communication quotidienne
- **Trello** : Suivi des tâches
- **GitHub** : Code & Reviews
- **Google Meet / Zoom** : Réunions vidéo

### Réunions Hebdomadaires
- **Daily Stand-up** (15min) : Chaque matin 9h
  - Qu'est-ce que j'ai fait hier ?
  - Qu'est-ce que je fais aujourd'hui ?
  - Ai-je des blocages ?
- **Weekly Review** (1h) : Chaque vendredi 17h
  - Revue du sprint
  - Démos des avancées
  - Planning de la semaine suivante

---

## 🏆 Points Forts de l'Équipe

### Jokast
✨ Expertise PostgreSQL & Backend  
✨ Compétences en DevOps & Déploiement  
✨ Leadership & Organisation  
✨ Gestion de projet agile

### Rufus
✨ Expertise Scikit-learn & Machine Learning  
✨ Maîtrise de l'analyse de données (Pandas)  
✨ Rigueur scientifique  
✨ Capacité d'analyse économique

### Yannick
✨ Expertise TensorFlow & Deep Learning  
✨ Maîtrise des visualisations (D3.js, Plotly)  
✨ Compétences UI/UX & React  
✨ Créativité & Design thinking

---

## 📝 Notes Importantes

### Bonnes Pratiques
- **Code** : Commentaires, noms de variables clairs, indentation
- **Git** : Commits réguliers avec messages descriptifs
- **Tests** : Tester avant de merge
- **Documentation** : Tout documenter au fur et à mesure
- **Communication** : Prévenir en cas de retard ou problème

### Gestion des Conflits
- Discuter ouvertement des désaccords
- Voter si nécessaire (majorité)
- Escalader à Jokast si blocage
- Rester professionnel et respectueux

---

**📅 Date de début** : [À définir]  
**🎯 Date de livraison** : [À définir]  
**👥 Équipe** : Jokast, Rufus, Yannick

