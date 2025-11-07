# train_robust.py
import pandas as pd
import numpy as np
import joblib
import os
import requests
from sklearn.ensemble import RandomForestRegressor
from sklearn.multioutput import MultiOutputRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error
import json
from datetime import datetime

print("🎯 Démarrage de l'entraînement ROBUSTE...")


def get_data():
    """Récupère les données de façon robuste"""
    try:
        # Essayer l'API GDP (la plus fiable)
        response = requests.get("http://localhost:3001/api/stats/gdp-vs-medals", timeout=5)
        if response.status_code == 200:
            data = response.json()
            df = pd.DataFrame(data)
            print(f"✅ Données GDP récupérées: {len(df)} pays")
            return df
    except:
        pass

    # Si API échoue, utiliser des données par défaut
    print("⚠️  API non disponible - Utilisation de données par défaut")
    default_data = {
        'country_name': [
            'United States', 'China', 'France', 'Germany', 'Japan',
            'Great Britain', 'Australia', 'Italy', 'Russia', 'South Korea',
            'Brazil', 'Spain', 'Canada', 'Netherlands', 'Switzerland'
        ],
        'gdp': [23e12, 14e12, 2.9e12, 4.0e12, 5.0e12, 3.0e12, 1.5e12, 2.0e12, 1.8e12, 1.6e12, 1.9e12, 1.4e12, 1.7e12,
                0.9e12, 0.8e12],
        'gold_count': [1000, 300, 250, 400, 200, 300, 150, 200, 500, 100, 50, 50, 100, 100, 50],
        'silver_count': [800, 250, 280, 350, 150, 250, 120, 180, 400, 90, 40, 40, 120, 120, 60],
        'bronze_count': [700, 200, 300, 300, 100, 200, 100, 160, 350, 80, 60, 30, 150, 140, 70]
    }
    return pd.DataFrame(default_data)


def create_features(df):
    """Crée les features"""
    features_df = df.rename(columns={'country_name': 'country'})

    # Nettoyer GDP
    features_df['gdp'] = pd.to_numeric(features_df['gdp'], errors='coerce')
    features_df = features_df.dropna(subset=['gdp'])

    # Calculer les totaux
    features_df['hist_total_medals'] = (
            features_df['gold_count'] + features_df['silver_count'] + features_df['bronze_count']
    )

    # Features estimées
    features_df['n_athletes'] = (features_df['hist_total_medals'] * 1.5).astype(int).clip(10, 600)
    features_df['n_sports'] = np.sqrt(features_df['hist_total_medals']).astype(int).clip(5, 30)
    features_df['n_events'] = (features_df['hist_total_medals'] * 1.2).astype(int).clip(10, 50)

    return features_df


def main():
    # Récupérer les données
    raw_df = get_data()
    features_df = create_features(raw_df)

    print(f"📊 Données préparées: {len(features_df)} pays")

    # Créer des cibles réalistes pour l'entraînement
    features_df['gold_target'] = (features_df['gold_count'] * 0.1).astype(int).clip(0, 45)
    features_df['silver_target'] = (features_df['silver_count'] * 0.1).astype(int).clip(0, 40)
    features_df['bronze_target'] = (features_df['bronze_count'] * 0.1).astype(int).clip(0, 35)

    # Features pour le modèle
    feature_cols = ['n_athletes', 'n_sports', 'n_events', 'gdp', 'gold_count', 'silver_count', 'bronze_count']
    X = features_df[feature_cols]
    y = features_df[['gold_target', 'silver_target', 'bronze_target']]

    # Renommer pour la cohérence
    X = X.rename(columns={
        'gold_count': 'hist_gold',
        'silver_count': 'hist_silver',
        'bronze_count': 'hist_bronze'
    })

    print(f"🎯 Entraînement sur {len(X)} pays...")

    # Split et entraînement
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    model = MultiOutputRegressor(
        RandomForestRegressor(n_estimators=100, random_state=42, max_depth=8)
    )
    model.fit(X_train, y_train)

    # Évaluation
    train_score = model.score(X_train, y_train)
    test_score = model.score(X_test, y_test)
    y_pred = model.predict(X_test)
    mae = mean_absolute_error(y_test, y_pred)

    # Sauvegarde
    os.makedirs("models", exist_ok=True)
    joblib.dump({
        'model': model,
        'feature_columns': X.columns.tolist(),
        'feature_stats': X.describe().to_dict()
    }, "models/country_model.pkl")

    # Résultats
    results = {
        'timestamp': datetime.now().isoformat(),
        'train_score': float(train_score),
        'test_score': float(test_score),
        'mae': float(mae),
        'n_countries': len(features_df),
        'features': X.columns.tolist()
    }

    print("✅ ENTRAÎNEMENT RÉUSSI!")
    print(f"📊 Score entraînement: {train_score:.3f}")
    print(f"📊 Score test: {test_score:.3f}")
    print(f"📊 MAE: {mae:.2f}")
    print(f"🌍 Pays utilisés: {len(features_df)}")
    print(f"💾 Modèle sauvegardé: models/country_model.pkl")

    # Aperçu des prédictions
    print("\n🔮 Aperçu des prédictions:")
    sample_countries = ['France', 'United States', 'China']
    for country in sample_countries:
        country_data = features_df[features_df['country'] == country]
        if len(country_data) > 0:
            features = country_data[feature_cols].iloc[0].values.reshape(1, -1)
            features_df_renamed = pd.DataFrame(features, columns=X.columns)
            prediction = model.predict(features_df_renamed)[0]
            print(f"   {country}: {int(prediction[0])}G, {int(prediction[1])}S, {int(prediction[2])}B")


# Ajoutez cette fonction à train_robust.py
def evaluate_trained_model(model, X_test, y_test):
    """Évalue le modèle après l'entraînement"""
    from sklearn.metrics import mean_absolute_error, r2_score

    y_pred = model.predict(X_test)

    # Métriques par type de médaille
    medal_metrics = {}
    for i, medal_type in enumerate(['Gold', 'Silver', 'Bronze']):
        mae = mean_absolute_error(y_test.iloc[:, i], y_pred[:, i])
        r2 = r2_score(y_test.iloc[:, i], y_pred[:, i])
        medal_metrics[medal_type] = {'MAE': mae, 'R2': r2}

    # Précision globale
    accuracy_scores = []
    for i in range(len(y_test)):
        true_total = y_test.iloc[i].sum()
        pred_total = y_pred[i].sum()
        if true_total > 0:
            error = abs(pred_total - true_total) / true_total
            accuracy_scores.append(max(0, 1 - error))

    global_accuracy = np.mean(accuracy_scores) if accuracy_scores else 0

    return {
        'global_accuracy': global_accuracy,
        'medal_metrics': medal_metrics,
        'overall_mae': mean_absolute_error(y_test, y_pred)
    }


if __name__ == "__main__":
    main()
    # Dans la fonction main(), après l'entraînement, ajoutez :
    print("\n📊 Évaluation du modèle entraîné...")
    evaluation_results = evaluate_trained_model(model, X_test, y_test)

    print(f"✅ Taux de précision global: {evaluation_results['global_accuracy']:.1%}")
    print(f"📏 Erreur absolue moyenne: {evaluation_results['overall_mae']:.2f} médailles")

    # Ajouter aux résultats
    results['evaluation'] = evaluation_results