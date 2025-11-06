import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from models.country_model import CountryMedalPredictor
import json
from datetime import datetime


def main():
    print("🎯 Démarrage de l'entraînement du modèle avec APIs...")

    # Configuration
    MODEL_PATH = "../models/country_model.pkl"

    # Initialiser et entraîner le modèle
    predictor = CountryMedalPredictor(model_path=MODEL_PATH)

    try:
        # Entraînement avec données APIs
        results = predictor.train()

        # Sauvegarder les résultats
        log_data = {
            'timestamp': datetime.now().isoformat(),
            'model': 'CountryMedalPredictor',
            'data_source': 'APIs only',
            'results': results,
            'features': predictor.feature_columns
        }

        # Créer le dossier logs si nécessaire
        os.makedirs("../training_logs", exist_ok=True)

        log_file = f"../training_logs/training_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        with open(log_file, 'w') as f:
            json.dump(log_data, f, indent=2)

        print("✅ Entraînement terminé avec succès!")
        print(f"📊 Résultats:")
        print(f"   - Score entraînement: {results['train_score']:.3f}")
        print(f"   - Score test: {results['test_score']:.3f}")
        print(f"   - MAE: {results['mae']:.2f}")
        print(f"   - Pays utilisés: {results['n_countries']}")
        print(f"📁 Modèle sauvegardé: {MODEL_PATH}")
        print(f"📝 Log: {log_file}")

        # Afficher l'importance des features
        if results.get('feature_importance'):
            print("\n🎯 Importance des features:")
            for feature, importance in results['feature_importance'].items():
                print(f"   - {feature}: {importance:.3f}")

    except Exception as e:
        print(f"❌ Erreur lors de l'entraînement: {e}")
        raise e


if __name__ == "__main__":
    main()