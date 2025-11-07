import React from 'react';
import { TrendingUp } from 'lucide-react';
import D3ScatterPlot from '../charts/D3ScatterPlot';

const Analysis = ({ mockMedalsData }) => {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900 flex items-center">
            <TrendingUp className="w-6 h-6 mr-2 text-green-600" />
            Analyse PIB vs Médailles
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Corrélation entre richesse économique et performances sportives - Visualisation D3.js
          </p>
        </div>

        <D3ScatterPlot data={mockMedalsData} />

        <div className="mt-6 bg-green-50 rounded-xl p-5 border border-green-200">
          <div className="flex items-start space-x-3">
            <div className="bg-green-100 p-2 rounded-lg">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h3 className="font-bold text-green-900 mb-1">Corrélation détectée</h3>
              <p className="text-sm text-green-800">
                Coefficient : <span className="font-bold">0.78</span> (forte corrélation positive)
              </p>
              <p className="text-sm text-green-700 mt-1">
                Les pays avec un PIB élevé tendent à obtenir plus de médailles, bien que d'autres
                facteurs jouent également un rôle clé (population, infrastructures, culture sportive).
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analysis;