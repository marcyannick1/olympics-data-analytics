import pandas as pd
import numpy as np
import requests
from typing import Dict, Any


def fetch_api_data(api_url: str, timeout: int = 5) -> pd.DataFrame:
    """Récupère les données depuis l'API avec timeout court"""
    try:
        response = requests.get(api_url, timeout=timeout)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ API {api_url} - Données reçues")
            return data
        else:
            print(f"❌ API {api_url} - Erreur {response.status_code}")
            return None
    except Exception as e:
        print(f"⚠️  API {api_url} - Non disponible: {e}")
        return None


def create_country_features_from_apis() -> pd.DataFrame:
    """
    Crée les features en utilisant uniquement les APIs
    Version robuste qui fonctionne même si certaines APIs échouent
    """
    print("📡 Récupération des données depuis les APIs...")

    # API 1: Données GDP vs médailles (la plus importante)
    gdp_data = fetch_api_data("http://localhost:3001/api/stats/gdp-vs-medals")

    # API 2: Données médailles par pays (essaye mais pas critique)
    medal_data = fetch_api_data("http://localhost:3001/api/medal_countries/totals")

    # API 3: Données des médaillés (optionnelle)
    medalists_data = fetch_api_data("http://localhost:3001/api/medalists")

    # Traitement des données GDP (API principale)
    if gdp_data and isinstance(gdp_data, list):
        gdp_df = pd.DataFrame(gdp_data)
        print(f"✅ Données GDP: {len(gdp_df)} pays")

        # Nettoyer les données GDP
        gdp_df = gdp_df.rename(columns={'country_name': 'country'})
        gdp_df['gdp'] = pd.to_numeric(gdp_df['gdp'], errors='coerce')
        gdp_df = gdp_df.dropna(subset=['gdp'])

        # Utiliser les données de médailles du GDP API comme données historiques
        country_features = gdp_df[['country', 'gdp']].copy()

        # Ajouter les médailles historiques depuis GDP API
        if 'gold_count' in gdp_df.columns:
            country_features['hist_gold'] = gdp_df['gold_count'].fillna(0).astype(int)
            country_features['hist_silver'] = gdp_df['silver_count'].fillna(0).astype(int)
            country_features['hist_bronze'] = gdp_df['bronze_count'].fillna(0).astype(int)
            country_features['hist_total_medals'] = gdp_df['total_medals'].fillna(0).astype(int)
        else:
            # Si pas de médailles dans GDP API, utiliser des valeurs basées sur le GDP
            country_features['hist_total_medals'] = (country_features['gdp'] / 1e10).astype(int).clip(upper=2000)
            country_features['hist_gold'] = (country_features['hist_total_medals'] * 0.4).astype(int)
            country_features['hist_silver'] = (country_features['hist_total_medals'] * 0.35).astype(int)
            country_features['hist_bronze'] = (country_features['hist_total_medals'] * 0.25).astype(int)

    else:
        print("❌ API GDP non disponible - Utilisation de données par défaut")
        # Données par défaut basées sur les pays principaux
        default_data = {
            'country': ['United States', 'China', 'France', 'Germany', 'Japan', 'Great Britain', 'Australia', 'Italy'],
            'gdp': [23e12, 14e12, 2.9e12, 4.0e12, 5.0e12, 3.0e12, 1.5e12, 2.0e12],
            'hist_gold': [1000, 300, 250, 400, 200, 300, 150, 200],
            'hist_silver': [800, 250, 280, 350, 150, 250, 120, 180],
            'hist_bronze': [700, 200, 300, 300, 100, 200, 100, 160]
        }
        country_features = pd.DataFrame(default_data)
        country_features['hist_total_medals'] = (
                country_features['hist_gold'] +
                country_features['hist_silver'] +
                country_features['hist_bronze']
        )

    # Si l'API médailles est disponible, fusionner les données
    if medal_data and 'countries' in medal_data:
        medal_df = pd.DataFrame(medal_data['countries'])
        medal_df = medal_df.rename(columns={
            'country_name': 'country',
            'gold_count': 'medal_gold',
            'silver_count': 'medal_silver',
            'bronze_count': 'medal_bronze',
            'medal_count': 'medal_total'
        })

        # Fusionner avec les données existantes
        country_features = pd.merge(
            country_features,
            medal_df[['country', 'medal_gold', 'medal_silver', 'medal_bronze', 'medal_total']],
            on='country',
            how='left'
        )

        # Utiliser les données médailles si disponibles
        country_features['hist_gold'] = country_features['medal_gold'].fillna(country_features['hist_gold'])
        country_features['hist_silver'] = country_features['medal_silver'].fillna(country_features['hist_silver'])
        country_features['hist_bronze'] = country_features['medal_bronze'].fillna(country_features['hist_bronze'])
        country_features['hist_total_medals'] = country_features['medal_total'].fillna(
            country_features['hist_total_medals'])

        country_features = country_features.drop(['medal_gold', 'medal_silver', 'medal_bronze', 'medal_total'], axis=1)

    # Ajouter des features dérivées
    country_features['n_athletes'] = (country_features['hist_total_medals'] * 1.5).astype(int).clip(lower=10, upper=600)
    country_features['n_sports'] = np.sqrt(country_features['hist_total_medals']).astype(int).clip(lower=5,
                                                                                                   upper=30) + 5
    country_features['n_events'] = (country_features['hist_total_medals'] * 1.2).astype(int).clip(lower=10,
                                                                                                  upper=50) + 10

    country_features['medals_per_athlete'] = (
            country_features['hist_total_medals'] / country_features['n_athletes'].replace(0, 1)
    )

    country_features['gold_ratio'] = (
            country_features['hist_gold'] / country_features['hist_total_medals'].replace(0, 1)
    )

    # Nettoyer les données finales
    country_features = country_features.dropna()

    print(f"✅ Features finales: {len(country_features)} pays")
    print("📊 Aperçu des données:")
    print(country_features[['country', 'gdp', 'hist_total_medals', 'n_athletes']].head())

    return country_features


def prepare_prediction_features(country_name: str, country_features: pd.DataFrame) -> Dict[str, Any]:
    """
    Prépare les features pour la prédiction d'un pays spécifique
    """
    if country_features.empty:
        return get_default_features(country_name)

    country_data = country_features[country_features['country'].str.lower() == country_name.lower()]

    if country_data.empty:
        return get_default_features(country_name)

    country_data = country_data.iloc[0]

    return {
        'n_athletes': int(country_data.get('n_athletes', 50)),
        'n_sports': int(country_data.get('n_sports', 10)),
        'n_events': int(country_data.get('n_events', 15)),
        'gdp': float(country_data.get('gdp', 1e12)),
        'hist_gold': int(country_data.get('hist_gold', 10)),
        'hist_silver': int(country_data.get('hist_silver', 10)),
        'hist_bronze': int(country_data.get('hist_bronze', 10))
    }


def get_default_features(country_name: str) -> Dict[str, Any]:
    """Retourne des features par défaut basées sur le nom du pays"""
    defaults = {
        'france': {'n_athletes': 400, 'n_sports': 25, 'n_events': 35, 'gdp': 2.9e12, 'hist_gold': 250,
                   'hist_silver': 280, 'hist_bronze': 300},
        'united states': {'n_athletes': 600, 'n_sports': 30, 'n_events': 45, 'gdp': 23e12, 'hist_gold': 1000,
                          'hist_silver': 800, 'hist_bronze': 700},
        'china': {'n_athletes': 400, 'n_sports': 25, 'n_events': 35, 'gdp': 14e12, 'hist_gold': 300, 'hist_silver': 250,
                  'hist_bronze': 200},
    }

    for key, values in defaults.items():
        if key in country_name.lower():
            return values

    # Valeurs par défaut génériques
    return {
        'n_athletes': 50,
        'n_sports': 10,
        'n_events': 15,
        'gdp': 1e12,
        'hist_gold': 10,
        'hist_silver': 10,
        'hist_bronze': 10
    }