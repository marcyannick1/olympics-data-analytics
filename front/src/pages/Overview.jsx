import React from 'react';
import { Globe, Award, Target, Brain } from 'lucide-react';
import StatsCards from '../components/StatsCards';
import MedalsTable from '../components/MedalsTable';
import D3LineChart from '../charts/D3LineChart';

const Overview = ({ mockMedalsData, historicalData, setSelectedCountry }) => {
  const stats = [
    {
      label: 'Pays analysés',
      value: '206',
      icon: Globe,
      bg: 'bg-blue-50',
      iconBg: 'bg-blue-100',
      textColor: 'text-blue-600',
    },
    {
      label: 'Médailles totales',
      value: '1,028',
      icon: Award,
      bg: 'bg-yellow-50',
      iconBg: 'bg-yellow-100',
      textColor: 'text-yellow-600',
    },
    {
      label: 'Éditions JO',
      value: '32',
      icon: Target,
      bg: 'bg-green-50',
      iconBg: 'bg-green-100',
      textColor: 'text-green-600',
    },
    {
      label: 'Précision IA',
      value: '94%',
      icon: Brain,
      bg: 'bg-purple-50',
      iconBg: 'bg-purple-100',
      textColor: 'text-purple-600',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Section Tokyo 2020 */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">🏆 Tokyo 2020</h2>
            <p className="text-blue-100">
              Du 23 juillet au 8 août 2021 • 339 épreuves • 11,656 athlètes
            </p>
          </div>
          <div className="hidden md:flex items-center space-x-6">
            <div className="text-center">
              <p className="text-3xl font-bold">206</p>
              <p className="text-sm text-blue-100">Pays</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold">33</p>
              <p className="text-sm text-blue-100">Sports</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold">1,028</p>
              <p className="text-sm text-blue-100">Médailles</p>
            </div>
          </div>
        </div>
      </div>

      <StatsCards cards={stats} />
      <MedalsTable data={mockMedalsData} setSelectedCountry={setSelectedCountry} />

      {/* Graphique historique */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Évolution historique</h2>
            <p className="text-sm text-gray-500 mt-1">Médailles USA (2000-2020)</p>
          </div>
          <div className="flex space-x-2">
            <button className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors">
              Exporter PNG
            </button>
            <button className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors">
              Partager
            </button>
          </div>
        </div>
        <D3LineChart data={historicalData} />

        {/* Insights */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-green-50 rounded-lg p-4 border border-green-200">
            <p className="text-xs font-semibold text-green-600 mb-1">RECORD</p>
            <p className="text-2xl font-bold text-green-900">121</p>
            <p className="text-xs text-green-700 mt-1">Rio 2016</p>
          </div>
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <p className="text-xs font-semibold text-blue-600 mb-1">MOYENNE</p>
            <p className="text-2xl font-bold text-blue-900">108</p>
            <p className="text-xs text-blue-700 mt-1">2000-2020</p>
          </div>
          <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
            <p className="text-xs font-semibold text-purple-600 mb-1">TENDANCE</p>
            <p className="text-2xl font-bold text-purple-900">+16%</p>
            <p className="text-xs text-purple-700 mt-1">vs 2000</p>
          </div>
        </div>
      </div>

      {/* Comparaison */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">⚔️ Comparaison rapide</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">🇺🇸 USA vs 🇨🇳 Chine</span>
              <span className="text-sm font-bold text-blue-600">+25 médailles</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-600 to-blue-400"
                style={{ width: '56%' }}
              ></div>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">🇯🇵 Japon vs 🇬🇧 GB</span>
              <span className="text-sm font-bold text-green-600">+7 médailles</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-green-600 to-green-400"
                style={{ width: '47%' }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Overview;