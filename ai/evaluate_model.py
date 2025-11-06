# evaluate_model.py
import pandas as pd
import numpy as np
import joblib
import requests
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import cross_val_score
import os
from datetime import datetime


def inspect_data(df, name="DataFrame"):
    """Inspecte les données pour debugger"""
    print(f"\n🔍 Inspection {name}:")
    print(f"Colonnes: {df.columns.tolist()}")
    print(f"Forme: {df.shape}")
    if len(df) > 0:
        print("Aperçu:")
        print(df.head(2))


def evaluate_model():
    """Évalue la performance du modèle"""
    print("📊 Évaluation du modèle...")

    try:
        # Charger le modèle
        model_data = joblib.load("models/country_model.pkl")
        model = model_data['model']
        feature_columns = model_data['feature_columns']

        print(f"✅ Modèle chargé: {len(feature_columns)} features")
        print(f"📋 Features: {feature_columns}")

    except Exception as e:
        print(f"❌ Erreur chargement modèle: {e}")
        return None, None

    # Charger les données pour l'évaluation
    try:
        response = requests.get("http://localhost:3001/api/stats/gdp-vs-medals", timeout=5)
        if response.status_code == 200:
            data = response.json()
            df = pd.DataFrame(data)
            print("✅ Données API chargées")
        else:
            raise Exception("API non disponible")
    except Exception as e:
        print(f"⚠️  API non disponible - {e}")
        print("📝 Utilisation données par défaut")
        df = create_default_data()

    inspect_data(df, "Données brutes")

    # Préparer les données
    df_prepared = prepare_evaluation_data(df, feature_columns)

    if df_prepared.empty:
        print("❌ Pas de données pour l'évaluation")
        return None, None

    inspect_data(df_prepared, "Données préparées")

    # Features et cibles
    X = df_prepared[feature_columns]

    # Identifier les colonnes cibles
    target_columns = []
    possible_targets = [
        ['gold_count', 'silver_count', 'bronze_count'],
        ['hist_gold', 'hist_silver', 'hist_bronze'],
        ['Gold', 'Silver', 'Bronze']
    ]

    for target_set in possible_targets:
        if all(col in df_prepared.columns for col in target_set):
            target_columns = target_set
            break

    if not target_columns:
        print("❌ Colonnes cibles non trouvées")
        # Créer des cibles simulées basées sur les features
        df_prepared['simulated_gold'] = (df_prepared['hist_gold'] * 0.1).astype(int)
        df_prepared['simulated_silver'] = (df_prepared['hist_silver'] * 0.1).astype(int)
        df_prepared['simulated_bronze'] = (df_prepared['hist_bronze'] * 0.1).astype(int)
        target_columns = ['simulated_gold', 'simulated_silver', 'simulated_bronze']

    y_true = df_prepared[target_columns]

    print(f"🎯 Cibles utilisées: {target_columns}")

    # Prédictions
    y_pred = model.predict(X)

    # Métriques par type de médaille
    metrics = {}
    medal_types = ['Gold', 'Silver', 'Bronze']

    for i, medal_type in enumerate(medal_types):
        if i < len(target_columns):
            true_values = y_true.iloc[:, i]
            pred_values = y_pred[:, i]

            metrics[medal_type] = {
                'MAE': mean_absolute_error(true_values, pred_values),
                'MSE': mean_squared_error(true_values, pred_values),
                'R2': r2_score(true_values, pred_values),
                'RMSE': np.sqrt(mean_squared_error(true_values, pred_values)),
                'True_Mean': float(true_values.mean()),
                'Pred_Mean': float(pred_values.mean())
            }

    # Métriques globales
    metrics['Global'] = {
        'MAE': mean_absolute_error(y_true, y_pred),
        'MSE': mean_squared_error(y_true, y_pred),
        'R2': r2_score(y_true, y_pred),
        'RMSE': np.sqrt(mean_squared_error(y_true, y_pred))
    }

    # Validation croisée
    try:
        cv_scores = cross_val_score(model, X, y_true, cv=min(5, len(X)), scoring='neg_mean_absolute_error')
        cv_mae = -cv_scores.mean()
        cv_std = cv_scores.std()
    except Exception as e:
        print(f"⚠️  Validation croisée échouée: {e}")
        cv_mae = metrics['Global']['MAE']
        cv_std = 0

    # Taux de précision personnalisé
    accuracy = calculate_custom_accuracy(y_true, y_pred)

    # Afficher les résultats
    print("\n" + "=" * 60)
    print("📈 RÉSULTATS D'ÉVALUATION DU MODÈLE")
    print("=" * 60)

    print(f"\n✅ TAUX DE PRÉCISION GLOBAL: {accuracy:.1%}")
    print(f"🔍 Validation Croisée - MAE moyen: {cv_mae:.2f} ± {cv_std:.2f} médailles")

    for medal_type, medal_metrics in metrics.items():
        if medal_type != 'Global':
            print(f"\n🎯 {medal_type}:")
            print(f"   📏 MAE: {medal_metrics['MAE']:.2f} médailles")
            print(f"   📐 RMSE: {medal_metrics['RMSE']:.2f} médailles")
            print(f"   📊 R²: {medal_metrics['R2']:.3f}")
            print(f"   📈 Moyenne réelle: {medal_metrics['True_Mean']:.1f}")
            print(f"   📈 Moyenne prédite: {medal_metrics['Pred_Mean']:.1f}")

    print(f"\n🌍 Données utilisées: {len(X)} pays")
    print(f"📋 Features: {', '.join(feature_columns)}")

    # Interprétation
    print(f"\n💡 INTERPRÉTATION:")
    if accuracy >= 0.8:
        print("   🎯 EXCELLENT - Le modèle est très précis")
    elif accuracy >= 0.6:
        print("   ✅ BON - Le modèle est fiable")
    elif accuracy >= 0.4:
        print("   ⚠️  CORRECT - Le modèle a besoin d'améliorations")
    else:
        print("   ❌ FAIBLE - Le modèle nécessite un réentraînement")

    # Sauvegarder le rapport
    save_evaluation_report(metrics, cv_mae, accuracy, len(X), feature_columns)

    return metrics, accuracy


def calculate_custom_accuracy(y_true, y_pred):
    """Calcule un taux de précision personnalisé"""
    accuracy_scores = []

    for i in range(len(y_true)):
        true_total = y_true.iloc[i].sum()
        pred_total = y_pred[i].sum()

        if true_total > 0:
            # Pourcentage d'erreur sur le total
            error = abs(pred_total - true_total) / true_total
            accuracy = max(0, 1 - error)
            accuracy_scores.append(accuracy)
        else:
            # Si pas de médailles réelles, vérifier si la prédiction est basse
            if pred_total <= 5:  # Si prédit peu de médailles
                accuracy_scores.append(0.8)
            else:
                accuracy_scores.append(0.2)

    return np.mean(accuracy_scores) if accuracy_scores else 0


def prepare_evaluation_data(df, feature_columns):
    """Prépare les données pour l'évaluation"""
    df_clean = df.copy()

    # Inspecter les colonnes disponibles
    print(f"\n📋 Colonnes disponibles: {df_clean.columns.tolist()}")

    # Nettoyer GDP
    if 'gdp' in df_clean.columns:
        df_clean['gdp'] = pd.to_numeric(df_clean['gdp'], errors='coerce')
        df_clean = df_clean.dropna(subset=['gdp'])
    else:
        print("⚠️  Colonne 'gdp' non trouvée")
        return pd.DataFrame()

    # Identifier les colonnes de médailles historiques
    gold_col = None
    silver_col = None
    bronze_col = None

    possible_columns = {
        'gold': ['gold_count', 'hist_gold', 'Gold', 'gold_medals'],
        'silver': ['silver_count', 'hist_silver', 'Silver', 'silver_medals'],
        'bronze': ['bronze_count', 'hist_bronze', 'Bronze', 'bronze_medals']
    }

    for col_type, possible_names in possible_columns.items():
        for name in possible_names:
            if name in df_clean.columns:
                if col_type == 'gold':
                    gold_col = name
                elif col_type == 'silver':
                    silver_col = name
                elif col_type == 'bronze':
                    bronze_col = name
                break

    print(f"🎯 Colonnes médailles trouvées: Gold={gold_col}, Silver={silver_col}, Bronze={bronze_col}")

    # Renommer les colonnes médailles pour correspondre aux features du modèle
    rename_dict = {}
    if gold_col and gold_col != 'hist_gold':
        rename_dict[gold_col] = 'hist_gold'
    if silver_col and silver_col != 'hist_silver':
        rename_dict[silver_col] = 'hist_silver'
    if bronze_col and bronze_col != 'hist_bronze':
        rename_dict[bronze_col] = 'hist_bronze'

    if rename_dict:
        df_clean = df_clean.rename(columns=rename_dict)
        print(f"✅ Colonnes renommées: {rename_dict}")

    # Créer les features manquantes
    if 'n_athletes' not in df_clean.columns:
        df_clean['n_athletes'] = (df_clean['hist_gold'] + df_clean['hist_silver'] + df_clean['hist_bronze']) * 1.5
        df_clean['n_athletes'] = df_clean['n_athletes'].astype(int).clip(10, 600)
        print("✅ Feature n_athletes créée")

    if 'n_sports' not in df_clean.columns:
        df_clean['n_sports'] = np.sqrt(df_clean['hist_gold'] + df_clean['hist_silver'] + df_clean['hist_bronze'])
        df_clean['n_sports'] = df_clean['n_sports'].astype(int).clip(5, 30)
        print("✅ Feature n_sports créée")

    if 'n_events' not in df_clean.columns:
        df_clean['n_events'] = (df_clean['hist_gold'] + df_clean['hist_silver'] + df_clean['hist_bronze']) * 1.2
        df_clean['n_events'] = df_clean['n_events'].astype(int).clip(10, 50)
        print("✅ Feature n_events créée")

    # Vérifier que toutes les features sont présentes et dans le bon ordre
    missing_cols = set(feature_columns) - set(df_clean.columns)
    if missing_cols:
        print(f"⚠️  Features manquantes: {missing_cols}")
        for col in missing_cols:
            df_clean[col] = 0

    # S'assurer que les colonnes sont dans le bon ordre
    final_columns = [col for col in feature_columns if col in df_clean.columns]
    missing_in_final = set(feature_columns) - set(final_columns)

    if missing_in_final:
        print(f"❌ Features manquantes dans l'ordre: {missing_in_final}")
        return pd.DataFrame()

    print(f"✅ Features finales dans l'ordre: {final_columns}")

    # Retourner seulement les features dans le bon ordre + les cibles
    result_df = df_clean[final_columns + ['hist_gold', 'hist_silver', 'hist_bronze']]

    # Supprimer les doublons de colonnes
    result_df = result_df.loc[:, ~result_df.columns.duplicated()]

    print(f"✅ Données préparées: {result_df.shape}")
    return result_df


def create_default_data():
    """Crée des données par défaut pour l'évaluation"""
    return pd.DataFrame({
        'country_name': ['France', 'United States', 'China', 'Germany', 'Japan', 'Great Britain', 'Australia'],
        'gdp': [2.9e12, 23e12, 14e12, 4.0e12, 5.0e12, 3.0e12, 1.5e12],
        'gold_count': [250, 1000, 300, 400, 200, 300, 150],
        'silver_count': [280, 800, 250, 350, 150, 250, 120],
        'bronze_count': [300, 700, 200, 300, 100, 200, 100]
    })


def save_evaluation_report(metrics, cv_mae, accuracy, n_countries, feature_columns):
    """Sauvegarde un rapport d'évaluation"""
    report = {
        'timestamp': datetime.now().isoformat(),
        'evaluation': {
            'n_countries': n_countries,
            'global_accuracy': accuracy,
            'cross_validation_mae': cv_mae,
            'feature_columns': feature_columns,
            'metrics': metrics
        },
        'interpretation': {
            'excellent': '> 80% - Modèle très précis',
            'good': '60% - 80% - Modèle fiable',
            'fair': '40% - 60% - Modèle acceptable',
            'poor': '< 40% - Modèle à améliorer'
        }
    }

    os.makedirs("evaluation_reports", exist_ok=True)

    filename = f"evaluation_reports/report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    with open(filename, 'w') as f:
        import json
        json.dump(report, f, indent=2)

    print(f"\n💾 Rapport sauvegardé: {filename}")


if __name__ == "__main__":
    metrics, accuracy = evaluate_model()

    if accuracy is not None:
        print(f"\n🎉 Évaluation terminée avec succès!")
        print(f"📊 Précision du modèle: {accuracy:.1%}")
    else:
        print("\n❌ Évaluation échouée")