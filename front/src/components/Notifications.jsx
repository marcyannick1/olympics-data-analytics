import React from 'react';

const Notifications = ({ notifications, showNotifications, setShowNotifications }) => {
  if (!showNotifications) return null;

  return (
    <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-gray-200 py-2 z-50">
      <div className="px-4 py-3 border-b border-gray-200">
        <h3 className="font-bold text-gray-900">Notifications</h3>
      </div>
      {notifications.map(notif => (
        <div key={notif.id} className="px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors">
          <div className="flex items-start space-x-3">
            <span className="text-2xl">{notif.icon}</span>
            <div className="flex-1">
              <p className="text-sm text-gray-900">{notif.message}</p>
              <p className="text-xs text-gray-500 mt-1">{notif.time}</p>
            </div>
          </div>
        </div>
      ))}
      <div className="px-4 py-2 border-t border-gray-200 text-center">
        <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
          Voir tout
        </button>
      </div>
    </div>
  );
};

export default Notifications;