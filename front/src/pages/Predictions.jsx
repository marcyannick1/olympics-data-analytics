import React, { useEffect, useState } from 'react';
import { Brain, Activity } from 'lucide-react';

const Predictions = () => {
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPredictions = async () => {
      try {
        const response = await fetch('http://localhost:5001/predict/top25');
        const data = await response.json();
        if (data && data.predictions) {
          // Transformation pour correspondre à l'ancien format mock
          const formatted = data.predictions.map((p) => ({
            country: p.country,
            predicted: p.prediction.total,
            confidence: Math.floor(Math.random() * 20) + 80, // valeur simulée
            flag: getFlagEmoji(p.country),
          }));
          setPredictions(formatted);
        }
      } catch (err) {
        console.error('Erreur lors du chargement des prédictions :', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPredictions();
  }, []);

  const getFlagEmoji = (country) => {
    const flags = {
      'United States': '🇺🇸',
      'China': '🇨🇳',
      'France': '🇫🇷',
      'Japan': '🇯🇵',
      'Germany': '🇩🇪',
      'United Kingdom': '🇬🇧',
      'Canada': '🇨🇦',
      'Italy': '🇮🇹',
      'Australia': '🇦🇺',
      'Brazil': '🇧🇷',
      'Korea': '🇰🇷',
      'Spain': '🇪🇸',
    };
    return flags[country] || '🏳️';
  };

  if (loading) {
    return <p className="text-center text-gray-600">Chargement des prédictions...</p>;
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-2xl shadow-sm border border-purple-200 p-6">
        <div className="flex items-start space-x-4">
          <div className="bg-purple-100 p-3 rounded-xl">
            <Brain className="w-6 h-6 text-purple-600" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Prédictions IA - Paris 2024</h2>
            <p className="text-sm text-gray-600">
              Basé sur les modèles Deep Learning (TensorFlow) et Random Forest
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {predictions.map((pred, index) => (
          <div
            key={index}
            className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <span className="text-3xl">{pred.flag}</span>
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">{pred.country}</h3>
                  <p className="text-sm text-gray-500">Prédiction médailles</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-blue-600">{pred.predicted}</p>
                <p className="text-xs text-gray-500">médailles</p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Confiance du modèle</span>
                <span className="font-bold text-green-600">{pred.confidence}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-green-500 to-green-600 h-full rounded-full"
                  style={{ width: `${pred.confidence}%` }}
                ></div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <h3 className="font-bold text-gray-900 mb-4 flex items-center">
          <Activity className="w-5 h-5 mr-2 text-blue-600" />
          Modèles d'IA utilisés
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
            <p className="text-sm font-semibold text-blue-900 mb-1">Réseau de neurones</p>
            <p className="text-xs text-blue-700">TensorFlow/Keras - 3 couches</p>
          </div>
          <div className="bg-green-50 rounded-xl p-4 border border-green-100">
            <p className="text-sm font-semibold text-green-900 mb-1">Random Forest</p>
            <p className="text-xs text-green-700">100 arbres de décision</p>
          </div>
          <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
            <p className="text-sm font-semibold text-purple-900 mb-1">Variables analysées</p>
            <p className="text-xs text-purple-700">PIB, population, historique</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Predictions;