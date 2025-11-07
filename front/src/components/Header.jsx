import React from 'react';
import { Medal, Activity } from 'lucide-react';
import UserMenu from './UserMenu';
import Notifications from './Notifications';

const Header = ({
  userData,
  notifications,
  showUserMenu,
  setShowUserMenu,
  showNotifications,
  setShowNotifications
}) => {
  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-5">
        <div className="flex items-center justify-between">
          {/* Logo + titre */}
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl flex items-center justify-center shadow-lg">
              <Medal className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">JO Analytics</h1>
              <p className="text-sm text-gray-500">Analyse & Prédiction des Jeux Olympiques</p>
            </div>
          </div>

          {/* Profil + Notifications */}
          <div className="flex items-center space-x-4 relative">
            {/* État IA */}
            <div className="flex items-center space-x-3 bg-green-50 rounded-full px-4 py-2 border border-green-200">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-green-700">IA en ligne</span>
            </div>

            {/* Bouton Notifications */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Activity className="w-6 h-6 text-gray-600" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              <Notifications
                notifications={notifications}
                showNotifications={showNotifications}
                setShowNotifications={setShowNotifications}
              />
            </div>

            {/* Profil utilisateur */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-3 hover:bg-gray-100 rounded-xl px-3 py-2 transition-colors"
              >
                <div className="text-right hidden md:block">
                  <p className="text-sm font-semibold text-gray-900">{userData.name}</p>
                  <p className="text-xs text-gray-500">{userData.role}</p>
                </div>
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-2xl shadow-lg">
                  {userData.avatar}
                </div>
              </button>
              <UserMenu
                userData={userData}
                showUserMenu={showUserMenu}
                setShowUserMenu={setShowUserMenu}
              />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;