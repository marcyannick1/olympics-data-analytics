import React from 'react';

const CountryModal = ({ selectedCountry, onClose }) => {
  if (!selectedCountry) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl p-8 max-w-2xl w-full shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <span className="text-6xl">{selectedCountry.flag}</span>
            <div>
              <h2 className="text-3xl font-bold text-gray-900">{selectedCountry.country}</h2>
              <p className="text-gray-500">Détails des performances</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors text-3xl font-light w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100"
          >
            ×
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-yellow-50 rounded-2xl p-6 border border-yellow-200">
            <p className="text-yellow-600 text-sm font-medium mb-2">🥇 Médailles d'or</p>
            <p className="text-4xl font-bold text-gray-900">{selectedCountry.gold}</p>
          </div>
          <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
            <p className="text-gray-600 text-sm font-medium mb-2">🥈 Médailles d'argent</p>
            <p className="text-4xl font-bold text-gray-900">{selectedCountry.silver}</p>
          </div>
          <div className="bg-orange-50 rounded-2xl p-6 border border-orange-200">
            <p className="text-orange-600 text-sm font-medium mb-2">🥉 Médailles de bronze</p>
            <p className="text-4xl font-bold text-gray-900">{selectedCountry.bronze}</p>
          </div>
          <div className="bg-blue-50 rounded-2xl p-6 border border-blue-200">
            <p className="text-blue-600 text-sm font-medium mb-2">📊 Total</p>
            <p className="text-4xl font-bold text-gray-900">{selectedCountry.total}</p>
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-5 border border-blue-200">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600 mb-1">PIB</p>
              <p className="font-bold text-gray-900">{selectedCountry.gdp} Mds $</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Performance</p>
              <span className="inline-block bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
                Excellente
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CountryModal;