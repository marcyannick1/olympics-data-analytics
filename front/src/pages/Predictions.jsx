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

        // ✅ ton API renvoie { season: "Summer", top: [...] }
        if (data && data.top) {
          const formatted = data.top.map((p) => ({
            country: p.Country,
            predicted: p.pred_total,
            confidence: Math.floor(Math.random() * 20) + 80, // valeur simulée
            flag: getFlagEmoji(p.Country),
            noc: p.noc
          }));
          setPredictions(formatted);
        } else {
          console.warn('Structure inattendue de la réponse API:', data);
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
      'United States of America': '🇺🇸',
      "People's Republic of China": '🇨🇳',
      'France': '🇫🇷',
      'Japan': '🇯🇵',
      'Germany': '🇩🇪',
      'United Kingdom': '🇬🇧',
      'Canada': '🇨🇦',
      'Italy': '🇮🇹',
      'Australia': '🇦🇺',
      'Brazil': '🇧🇷',
      'Republic of Korea': '🇰🇷',
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
          </div>
        ))}
      </div>

    </div>
  );
};

export default Predictions;