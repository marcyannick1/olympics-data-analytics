import pandas as pd
import numpy as np
import joblib
import os
import requests
from sklearn.ensemble import RandomForestRegressor
from sklearn.multioutput import MultiOutputRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, mean_squared_error
from typing import Dict, Any, Tuple


class CountryMedalPredictor:
    def __init__(self, model_path: str = "../models/country_model.pkl"):
        self.model_path = model_path
        self.model = None
        self.feature_columns = [
            'n_athletes', 'n_sports', 'n_events', 'gdp',
            'hist_gold', 'hist_silver', 'hist_bronze'
        ]
        self.is_trained = False

    def load_data_from_apis(self) -> pd.DataFrame:
        """
        Charge les données uniquement depuis les APIs
        """
        from features.feature_engineering import create_country_features_from_apis
        return create_country_features_from_apis()

    def train(self, test_size: float = 0.2) -> Dict[str, float]:
        """
        Entraîne le modèle sur les données des APIs
        """
        print("🎯 Entraînement du modèle avec données APIs...")

        # Charger les données depuis les APIs
        country_df = self.load_data_from_apis()

        if country_df.empty:
            raise Exception("❌ Impossible de charger les données depuis les APIs")

        # Pour l'entraînement, on simule des cibles basées sur l'historique
        # (Dans un cas réel, vous auriez les vraies médailles par JO)
        country_df['gold'] = (country_df['hist_gold'] * 0.1).astype(int).clip(upper=50)
        country_df['silver'] = (country_df['hist_silver'] * 0.1).astype(int).clip(upper=45)
        country_df['bronze'] = (country_df['hist_bronze'] * 0.1).astype(int).clip(upper=40)

        # Préparer X et y
        X = country_df[self.feature_columns]
        y = country_df[['gold', 'silver', 'bronze']]

        print(f"📊 Données d'entraînement: {len(X)} pays")
        print("Features utilisées:", self.feature_columns)

        # Split train/test
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=test_size, random_state=42
        )

        # Entraîner le modèle
        self.model = MultiOutputRegressor(
            RandomForestRegressor(
                n_estimators=100,  # Réduit pour plus de vitesse
                random_state=42,
                n_jobs=-1,
                max_depth=10
            )
        )

        self.model.fit(X_train, y_train)

        # Évaluation
        train_score = self.model.score(X_train, y_train)
        test_score = self.model.score(X_test, y_test)

        y_pred = self.model.predict(X_test)
        mae = mean_absolute_error(y_test, y_pred)
        mse = mean_squared_error(y_test, y_pred)

        self.is_trained = True

        # Sauvegarder le modèle
        self.save_model()

        return {
            'train_score': float(train_score),
            'test_score': float(test_score),
            'mae': float(mae),
            'mse': float(mse),
            'n_countries': len(country_df),
            'feature_importance': self.get_feature_importance()
        }

    def get_feature_importance(self) -> Dict[str, float]:
        """Retourne l'importance des features"""
        if not self.is_trained or self.model is None:
            return {}

        try:
            # Pour MultiOutputRegressor, on prend la moyenne des importances
            importances = []
            for estimator in self.model.estimators_:
                importances.append(estimator.feature_importances_)

            avg_importance = np.mean(importances, axis=0)
            return dict(zip(self.feature_columns, avg_importance))
        except:
            return {}

    def predict(self, country_features: Dict[str, Any]) -> Dict[str, int]:
        """
        Prédit les médailles pour un pays
        """
        if not self.is_trained:
            self.load_model()

        if not self.is_trained:
            return self._default_prediction(country_features)

        # Préparer les features
        X = np.array([[
            country_features['n_athletes'],
            country_features['n_sports'],
            country_features['n_events'],
            country_features['gdp'],
            country_features['hist_gold'],
            country_features['hist_silver'],
            country_features['hist_bronze']
        ]])

        # Prédiction
        prediction = self.model.predict(X)[0]

        # Ajustement pour être réaliste
        gold = max(0, min(50, int(round(prediction[0]))))
        silver = max(0, min(45, int(round(prediction[1]))))
        bronze = max(0, min(40, int(round(prediction[2]))))

        return {
            'gold': gold,
            'silver': silver,
            'bronze': bronze,
            'total': gold + silver + bronze
        }

    def predict_country_by_name(self, country_name: str) -> Dict[str, Any]:
        """
        Prédit les médailles pour un pays par son nom
        """
        from features.feature_engineering import prepare_prediction_features

        # Charger les données actuelles
        country_df = self.load_data_from_apis()
        features = prepare_prediction_features(country_name, country_df)
        prediction = self.predict(features)

        return {
            'country': country_name,
            'features_used': features,
            'prediction': prediction
        }

    def _default_prediction(self, country_features: Dict[str, Any]) -> Dict[str, int]:
        """
        Prédiction par défaut basée sur les features
        """
        # Logique simple basée sur l'historique et le GDP
        hist_total = (country_features['hist_gold'] +
                      country_features['hist_silver'] +
                      country_features['hist_bronze'])

        if hist_total > 1000:
            gold = max(1, min(40, int(hist_total * 0.02)))
            silver = max(1, min(35, int(hist_total * 0.018)))
            bronze = max(1, min(30, int(hist_total * 0.016)))
        elif hist_total > 100:
            gold = max(1, min(20, int(hist_total * 0.05)))
            silver = max(1, min(18, int(hist_total * 0.045)))
            bronze = max(1, min(15, int(hist_total * 0.04)))
        else:
            gold = max(0, min(8, int(hist_total * 0.1)))
            silver = max(0, min(6, int(hist_total * 0.09)))
            bronze = max(0, min(5, int(hist_total * 0.08)))

        # Ajustement pour la France (pays hôte)
        if 'france' in country_features.get('country_name', '').lower():
            gold = min(25, gold + 5)
            silver = min(20, silver + 3)
            bronze = min(18, bronze + 2)

        return {
            'gold': gold,
            'silver': silver,
            'bronze': bronze,
            'total': gold + silver + bronze
        }

    def save_model(self):
        """Sauvegarde le modèle"""
        if self.model is not None:
            os.makedirs(os.path.dirname(self.model_path), exist_ok=True)
            joblib.dump({
                'model': self.model,
                'feature_columns': self.feature_columns,
                'is_trained': self.is_trained
            }, self.model_path)
            print(f"✅ Modèle sauvegardé: {self.model_path}")

    def load_model(self):
        """Charge le modèle"""
        try:
            if os.path.exists(self.model_path):
                saved_data = joblib.load(self.model_path)
                self.model = saved_data['model']
                self.feature_columns = saved_data['feature_columns']
                self.is_trained = saved_data['is_trained']
                print(f"✅ Modèle chargé: {self.model_path}")
            else:
                print("❌ Modèle non trouvé, besoin d'entraînement")
                self.is_trained = False
        except Exception as e:
            print(f"❌ Erreur chargement modèle: {e}")
            self.is_trained = False