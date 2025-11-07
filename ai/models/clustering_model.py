import pandas as pd
import numpy as np
import joblib
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import silhouette_score
from typing import List, Dict, Any


class CountryClustering:
    def __init__(self, model_path: str = "../models/clustering_model.pkl"):
        self.model_path = model_path
        self.model = None
        self.scaler = StandardScaler()
        self.optimal_k = 4
        self.is_trained = False

    def prepare_clustering_data(self, country_df: pd.DataFrame) -> pd.DataFrame:
        """
        Prépare les données pour le clustering
        """
        clustering_features = [
            'hist_gold', 'hist_silver', 'hist_bronze', 'hist_total_medals',
            'n_athletes', 'n_sports', 'gdp', 'medals_per_athlete', 'gold_ratio'
        ]

        # S'assurer que toutes les colonnes existent
        for feature in clustering_features:
            if feature not in country_df.columns:
                if feature == 'hist_total_medals':
                    country_df['hist_total_medals'] = (
                            country_df['hist_gold'] +
                            country_df['hist_silver'] +
                            country_df['hist_bronze']
                    )
                elif feature == 'medals_per_athlete':
                    country_df['medals_per_athlete'] = (
                            country_df['hist_total_medals'] / country_df['n_athletes'].replace(0, 1)
                    )
                elif feature == 'gold_ratio':
                    country_df['gold_ratio'] = (
                            country_df['hist_gold'] / country_df['hist_total_medals'].replace(0, 1)
                    )

        return country_df[clustering_features + ['country_name']].dropna()

    def find_optimal_k(self, X: np.ndarray, max_k: int = 8) -> int:
        """
        Trouve le nombre optimal de clusters
        """
        if len(X) <= 3:
            return 2

        inertias = []
        silhouette_scores = []

        k_range = range(2, min(max_k + 1, len(X)))

        for k in k_range:
            kmeans = KMeans(n_clusters=k, random_state=42, n_init=10)
            kmeans.fit(X)
            inertias.append(kmeans.inertia_)

            if len(X) > k:
                score = silhouette_score(X, kmeans.labels_)
                silhouette_scores.append(score)

        # Utiliser la méthode du coude améliorée
        if silhouette_scores:
            self.optimal_k = k_range[np.argmax(silhouette_scores)]
        else:
            # Méthode du coude simple
            differences = np.diff(inertias)
            second_diff = np.diff(differences)
            if len(second_diff) > 0:
                self.optimal_k = np.argmax(second_diff) + 3
            else:
                self.optimal_k = 3

        return self.optimal_k

    def train(self, country_df: pd.DataFrame) -> List[Dict[str, Any]]:
        """
        Entraîne le modèle de clustering
        """
        # Préparer les données
        clustering_df = self.prepare_clustering_data(country_df)
        X = clustering_df.drop('country_name', axis=1)

        # Normalisation
        X_scaled = self.scaler.fit_transform(X)

        # Trouver le k optimal
        self.find_optimal_k(X_scaled)

        # Entraînement
        self.model = KMeans(n_clusters=self.optimal_k, random_state=42, n_init=10)
        labels = self.model.fit_predict(X_scaled)

        self.is_trained = True

        # Sauvegarder le modèle
        self.save_model()

        # Préparer les résultats
        results = []
        for i, (_, row) in enumerate(clustering_df.iterrows()):
            results.append({
                'country': row['country_name'],
                'cluster': int(labels[i]),
                'cluster_name': self._get_cluster_name(labels[i]),
                'characteristics': self._get_cluster_characteristics(labels[i], X.iloc[i])
            })

        return results

    def _get_cluster_name(self, cluster_id: int) -> str:
        """
        Retourne le nom du cluster
        """
        names = {
            0: "Pays Émergents",
            1: "Puissances Olympiques",
            2: "Pays Performants",
            3: "Pays Spécialisés",
            4: "Pays en Développement"
        }
        return names.get(cluster_id, f"Cluster {cluster_id}")

    def _get_cluster_characteristics(self, cluster_id: int, country_data: pd.Series) -> Dict[str, Any]:
        """
        Retourne les caractéristiques du cluster
        """
        # Analyse basique basée sur les données du pays
        total_medals = country_data.get('hist_total_medals', 0)
        gdp = country_data.get('gdp', 0)

        if total_medals > 500 and gdp > 1e12:
            return {"type": "Superpuissance", "description": "GDP élevé et nombreuses médailles"}
        elif total_medals > 100:
            return {"type": "Puissance moyenne", "description": "Bon historique de médailles"}
        elif total_medals > 10:
            return {"type": "Pays émergent", "description": "Croissance olympique"}
        else:
            return {"type": "Pays en développement", "description": "Peu de médailles historiques"}

    def save_model(self):
        """
        Sauvegarde le modèle
        """
        if self.model is not None:
            import os
            os.makedirs(os.path.dirname(self.model_path), exist_ok=True)
            joblib.dump({
                'model': self.model,
                'scaler': self.scaler,
                'optimal_k': self.optimal_k
            }, self.model_path)

    def load_model(self):
        """
        Charge le modèle
        """
        try:
            if os.path.exists(self.model_path):
                saved_data = joblib.load(self.model_path)
                self.model = saved_data['model']
                self.scaler = saved_data['scaler']
                self.optimal_k = saved_data['optimal_k']
                self.is_trained = True
                print(f"✅ Modèle de clustering chargé: {self.model_path}")
            else:
                print("❌ Modèle de clustering non trouvé")
                self.is_trained = False
        except Exception as e:
            print(f"❌ Erreur chargement clustering: {e}")
            self.is_trained = False