import React from 'react';

const StatsCards = ({ cards }) => {
  // cards: [{ label, value, icon: Icon, bg, iconBg, textColor }]
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      {cards.map((stat, i) => (
        <div
          key={i}
          className={`${stat.bg} rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-all`}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">{stat.label}</p>
              <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
            </div>
            <div className={`${stat.iconBg} p-3 rounded-xl`}>
              <stat.icon className={`w-6 h-6 ${stat.textColor}`} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default StatsCards;