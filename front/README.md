
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
