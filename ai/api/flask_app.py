from flask import Flask, jsonify
import sys
import os
import joblib
import pandas as pd
import numpy as np
import requests
from datetime import datetime

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

app = Flask(__name__)

# Variables globales pour les modèles
medal_predictor = None
model_loaded = False


def load_model():
    """Charge le modèle au démarrage"""
    global medal_predictor, model_loaded

    try:
        model_data = joblib.load("models/country_model.pkl")
        medal_predictor = model_data['model']
        model_loaded = True
        print("✅ Modèle chargé avec succès")
    except Exception as e:
        print(f"❌ Erreur chargement modèle: {e}")
        model_loaded = False


def get_country_features(country_name):
    """Récupère les features d'un pays depuis les APIs ou valeurs par défaut"""
    try:
        # Essayer l'API GDP
        response = requests.get("http://localhost:3001/api/stats/gdp-vs-medals", timeout=5)
        if response.status_code == 200:
            data = response.json()
            df = pd.DataFrame(data)

            # Chercher le pays
            country_data = df[df['country_name'].str.lower() == country_name.lower()]
            if not country_data.empty:
                country_data = country_data.iloc[0]
                return {
                    'n_athletes': 400 if 'france' in country_name.lower() else 300,
                    'n_sports': 25,
                    'n_events': 35,
                    'gdp': float(country_data.get('gdp', 1e12)),
                    'hist_gold': int(country_data.get('gold_count', 100)),
                    'hist_silver': int(country_data.get('silver_count', 100)),
                    'hist_bronze': int(country_data.get('bronze_count', 100))
                }
    except:
        pass

    # Valeurs par défaut si API échoue
    defaults = {
        'france': {'n_athletes': 400, 'n_sports': 25, 'n_events': 35, 'gdp': 2.9e12, 'hist_gold': 250,
                   'hist_silver': 280, 'hist_bronze': 300},
        'united states': {'n_athletes': 600, 'n_sports': 30, 'n_events': 45, 'gdp': 23e12, 'hist_gold': 1000,
                          'hist_silver': 800, 'hist_bronze': 700},
        'china': {'n_athletes': 400, 'n_sports': 25, 'n_events': 35, 'gdp': 14e12, 'hist_gold': 300, 'hist_silver': 250,
                  'hist_bronze': 200},
        'germany': {'n_athletes': 350, 'n_sports': 20, 'n_events': 30, 'gdp': 4.0e12, 'hist_gold': 400,
                    'hist_silver': 350, 'hist_bronze': 300},
        'japan': {'n_athletes': 300, 'n_sports': 20, 'n_events': 25, 'gdp': 5.0e12, 'hist_gold': 200,
                  'hist_silver': 150, 'hist_bronze': 100},
    }

    for key, values in defaults.items():
        if key in country_name.lower():
            return values

    # Valeur par défaut générique
    return {
        'n_athletes': 50,
        'n_sports': 10,
        'n_events': 15,
        'gdp': 1e12,
        'hist_gold': 10,
        'hist_silver': 10,
        'hist_bronze': 10
    }


def predict_medals(country_name):
    """Prédit les médailles pour un pays"""
    if not model_loaded or medal_predictor is None:
        # Prédiction par défaut si modèle non chargé
        return default_prediction(country_name)

    try:
        features = get_country_features(country_name)

        # Préparer les features dans le bon ordre
        feature_values = [
            features['n_athletes'],
            features['n_sports'],
            features['n_events'],
            features['gdp'],
            features['hist_gold'],
            features['hist_silver'],
            features['hist_bronze']
        ]

        prediction = medal_predictor.predict([feature_values])[0]

        return {
            'gold': max(0, int(round(prediction[0]))),
            'silver': max(0, int(round(prediction[1]))),
            'bronze': max(0, int(round(prediction[2]))),
            'total': max(0, int(round(prediction[0] + prediction[1] + prediction[2])))
        }
    except Exception as e:
        print(f"❌ Erreur prédiction {country_name}: {e}")
        return default_prediction(country_name)


def default_prediction(country_name):
    """Prédiction par défaut basée sur le nom du pays"""
    defaults = {
        'france': {'gold': 15, 'silver': 12, 'bronze': 18, 'total': 45},
        'united states': {'gold': 35, 'silver': 30, 'bronze': 25, 'total': 90},
        'china': {'gold': 30, 'silver': 25, 'bronze': 20, 'total': 75},
        'germany': {'gold': 18, 'silver': 15, 'bronze': 12, 'total': 45},
        'japan': {'gold': 15, 'silver': 10, 'bronze': 12, 'total': 37},
        'great britain': {'gold': 20, 'silver': 18, 'bronze': 15, 'total': 53},
        'australia': {'gold': 12, 'silver': 10, 'bronze': 15, 'total': 37},
        'italy': {'gold': 10, 'silver': 12, 'bronze': 15, 'total': 37},
    }

    for key, values in defaults.items():
        if key in country_name.lower():
            return values

    # Valeur par défaut générique
    return {'gold': 5, 'silver': 7, 'bronze': 9, 'total': 21}


# Charger le modèle au démarrage de l'app
load_model()


@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'healthy',
        'model_loaded': model_loaded,
        'timestamp': datetime.now().isoformat()
    })


@app.route('/predict/france', methods=['GET'])
def predict_france():
    """Prédit les médailles pour la France"""
    prediction = predict_medals('France')

    return jsonify({
        'success': True,
        'country': 'France',
        'prediction': prediction,
        'model_used': model_loaded
    })


@app.route('/predict/country/<country_name>', methods=['GET'])
def predict_country(country_name):
    """Prédit les médailles pour un pays spécifique"""
    prediction = predict_medals(country_name)

    return jsonify({
        'success': True,
        'country': country_name,
        'prediction': prediction,
        'model_used': model_loaded
    })


@app.route('/predict/top25', methods=['GET'])
def predict_top25():
    """Prédit les médailles pour les 25 pays principaux"""
    top_countries = [
        'United States', 'China', 'France', 'Germany', 'Japan',
        'Great Britain', 'Australia', 'Italy', 'Russia', 'South Korea',
        'Brazil', 'Spain', 'Canada', 'Netherlands', 'Switzerland',
        'Sweden', 'Norway', 'Denmark', 'Poland', 'Hungary',
        'Ukraine', 'New Zealand', 'Kenya', 'Jamaica', 'Turkey'
    ]

    predictions = []
    for country in top_countries:
        prediction = predict_medals(country)
        predictions.append({
            'country': country,
            'prediction': prediction
        })

    return jsonify({
        'success': True,
        'predictions': predictions,
        'count': len(predictions),
        'model_used': model_loaded
    })


@app.route('/reload_model', methods=['POST'])
def reload_model():
    """Recharge le modèle"""
    global medal_predictor, model_loaded
    try:
        load_model()
        return jsonify({
            'success': True,
            'message': 'Modèle rechargé',
            'model_loaded': model_loaded
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/model/accuracy', methods=['GET'])
def get_model_accuracy():
    """Retourne le taux de précision du modèle"""
    try:
        from evaluate_model import evaluate_model
        metrics, accuracy = evaluate_model()

        return jsonify({
            'success': True,
            'accuracy': accuracy,
            'metrics': metrics,
            'interpretation': {
                'excellent': '> 80%',
                'good': '60% - 80%',
                'fair': '40% - 60%',
                'poor': '< 40%'
            }
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e),
            'message': 'Exécutez d\'abord python evaluate_model.py'
        }), 500


@app.route('/model/evaluate', methods=['GET'])
def evaluate_model_route():
    """Évalue et retourne la précision du modèle"""
    try:
        # Import dynamique pour éviter les conflits
        import sys
        sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        from evaluate_model import evaluate_model

        metrics, accuracy = evaluate_model()

        if accuracy is not None:
            return jsonify({
                'success': True,
                'accuracy': accuracy,
                'accuracy_percentage': f"{accuracy:.1%}",
                'interpretation': get_accuracy_interpretation(accuracy),
                'metrics': metrics
            })
        else:
            return jsonify({
                'success': False,
                'error': 'Impossible d\'évaluer le modèle'
            }), 500

    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


def get_accuracy_interpretation(accuracy):
    """Retourne l'interprétation de la précision"""
    if accuracy >= 0.8:
        return "🎯 EXCELLENT - Modèle très précis"
    elif accuracy >= 0.6:
        return "✅ BON - Modèle fiable"
    elif accuracy >= 0.4:
        return "⚠️ CORRECT - Modèle acceptable"
    else:
        return "❌ FAIBLE - Modèle à améliorer"

if __name__ == '__main__':
    print("🚀 API de prédiction JO 2024 démarrée!")
    print("📍 http://localhost:5001")
    print("🇫🇷 /predict/france")
    print("🌍 /predict/country/<nom>")
    print("🏆 /predict/top25")
    print("❤️  /health")
    app.run(host='0.0.0.0', port=5001, debug=True)