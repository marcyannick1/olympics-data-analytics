import React from 'react';

const UserMenu = ({ userData, showUserMenu, setShowUserMenu }) => {
  if (!showUserMenu) return null;

  return (
    <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-500 to-purple-500 p-6">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-3xl shadow-lg">
            {userData.avatar}
          </div>
          <div className="text-white">
            <h3 className="font-bold text-lg">{userData.name}</h3>
            <p className="text-sm opacity-90">{userData.email}</p>
            <p className="text-xs opacity-75 mt-1">{userData.team}</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 border-b border-gray-200">
        <div className="text-center">
          <p className="text-2xl font-bold text-blue-600">{userData.stats.reportsCreated}</p>
          <p className="text-xs text-gray-500">Rapports</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-green-600">{userData.stats.modelsRun}</p>
          <p className="text-xs text-gray-500">Modèles IA</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-purple-600">{userData.stats.dataAnalyzed}</p>
          <p className="text-xs text-gray-500">Données</p>
        </div>
      </div>

      {/* Favoris */}
      <div className="p-4 border-b border-gray-200">
        <p className="text-xs font-semibold text-gray-500 mb-2">PAYS FAVORIS</p>
        <div className="flex flex-wrap gap-2">
          {userData.favoriteCountries.map((country, i) => (
            <span key={i} className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm">
              {country}
            </span>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="p-2">
        {[
          { icon: '⚙️', label: 'Paramètres' },
          { icon: '📊', label: 'Mes analyses' },
          { icon: '💾', label: 'Données sauvegardées' }
        ].map((item, i) => (
          <button
            key={i}
            className="w-full text-left px-4 py-2 hover:bg-gray-50 rounded-lg transition-colors flex items-center space-x-3"
          >
            <span className="text-lg">{item.icon}</span>
            <span className="text-sm text-gray-700">{item.label}</span>
          </button>
        ))}
      </div>

      {/* Footer */}
      <div className="p-4 bg-gray-50 border-t border-gray-200">
        <p className="text-xs text-gray-500 mb-2">
          Dernière connexion: {userData.lastLogin}
        </p>
        <button className="w-full bg-red-50 text-red-600 py-2 rounded-lg hover:bg-red-100 transition-colors font-medium text-sm">
          Déconnexion
        </button>
      </div>
    </div>
  );
};

export default UserMenu;