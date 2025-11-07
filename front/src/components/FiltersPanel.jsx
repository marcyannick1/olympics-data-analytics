import React from 'react';

const FiltersPanel = ({ showFilters, setShowFilters, onApply, onReset }) => {
  return (
    <>
      {/* Bouton Filtres */}
      <button
        onClick={() => setShowFilters(!showFilters)}
        className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
      >
        <span className="text-sm font-medium text-gray-700">Filtres</span>
        <span className="text-lg">⚙️</span>
      </button>

      {/* Panel Filtres */}
      {showFilters && (
        <div className="py-4 border-t border-gray-200 bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-2">ANNÉE</label>
              <select className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" defaultValue="2020 (Tokyo)">
                <option>2020 (Tokyo)</option>
                <option>2016 (Rio)</option>
                <option>2012 (Londres)</option>
                <option>2008 (Pékin)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-2">CONTINENT</label>
              <select className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" defaultValue="Tous les continents">
                <option>Tous les continents</option>
                <option>🌍 Europe</option>
                <option>🌎 Amérique</option>
                <option>🌏 Asie</option>
                <option>🌍 Afrique</option>
                <option>🌏 Océanie</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-2">TYPE DE MÉDAILLE</label>
              <select className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" defaultValue="Toutes les médailles">
                <option>Toutes les médailles</option>
                <option>🥇 Or uniquement</option>
                <option>🥈 Argent uniquement</option>
                <option>🥉 Bronze uniquement</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-2">AFFICHAGE</label>
              <select className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" defaultValue="Top 10">
                <option>Top 10</option>
                <option>Top 20</option>
                <option>Top 50</option>
                <option>Tous les pays</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end space-x-2 mt-4">
            <button
              onClick={onReset}
              className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Réinitialiser
            </button>
            <button
              onClick={onApply}
              className="px-4 py-2 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors"
            >
              Appliquer
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default FiltersPanel;