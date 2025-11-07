import React from 'react';
import { Globe, Award, Target, Brain } from 'lucide-react';
import StatsCards from '../components/StatsCards';
import MedalsTable from '../components/MedalsTable';
import D3LineChart from '../charts/D3LineChart';

const Overview = ({
  medalsData,
  historyData,
  hosts,
  filters,
  setSelectedCountry,
}) => {

  // --- Calcul dynamique des stats globales ---
  const statsCards = [
    {
      label: 'Pays analysés',
      value: medalsData?.length || 0,
      icon: Globe,
      bg: 'bg-blue-50',
      iconBg: 'bg-blue-100',
      textColor: 'text-blue-600',
    },
    {
      label: 'Médailles totales',
      value: medalsData?.reduce((acc, c) => acc + (c.total || 0), 0).toLocaleString('fr-FR'),
      icon: Award,
      bg: 'bg-yellow-50',
      iconBg: 'bg-yellow-100',
      textColor: 'text-yellow-600',
    },
    {
      label: 'Éditions JO',
      value: hosts?.length || 0,
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

  // --- Section entête dynamique selon l’édition choisie ---
  const current = hosts.find(h => h.game_slug === filters.gameSlug);
  const title = current ? `🏆 ${current.game_name}` : '🏆 Jeux Olympiques';
  const subtitle = current
    ? `${current.game_season} • ${current.game_location} • ${current.game_year}`
    : 'Historique 1896–2022';

  // Petites métriques dynamiques
  const countriesCount = medalsData?.length || 0;
  const sportsCount = current ? (current.game_season === 'Summer' ? 33 : 7) : 33;
  const medalsSum = medalsData?.reduce((acc, c) => acc + (c.total || 0), 0);

  // Trouver max et moyenne pour les insights
  const maxMedals = Math.max(...historyData.map(d => d.medals || 0));
  const avgMedals = Math.round(
    historyData.reduce((acc, d) => acc + (d.medals || 0), 0) / (historyData.length || 1)
  );
  const trend =
    historyData.length > 1
      ? Math.round(
          ((historyData.at(-1).medals - historyData[0].medals) / historyData[0].medals) * 100
        )
      : 0;

  return (
    <div className="space-y-6">
      {/* Section dynamique selon édition */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">{title}</h2>
            <p className="text-blue-100">{subtitle}</p>
          </div>
          <div className="hidden md:flex items-center space-x-6">
            <div className="text-center">
              <p className="text-3xl font-bold">{countriesCount}</p>
              <p className="text-sm text-blue-100">Pays (affichés)</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold">{sportsCount}</p>
              <p className="text-sm text-blue-100">Sports</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold">{medalsSum}</p>
              <p className="text-sm text-blue-100">Médailles (total)</p>
            </div>
          </div>
        </div>
      </div>

      {/* Cartes de stats */}
      <StatsCards cards={statsCards} />

      {/* Tableau des médailles dynamiques */}
      <MedalsTable data={medalsData} setSelectedCountry={setSelectedCountry} />

      {/* Graphique historique */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Évolution historique</h2>
            <p className="text-sm text-gray-500 mt-1">
              Médailles {filters?.gameSlug?.includes('winter') ? 'JO d’hiver' : 'USA (2000–2020)'}
            </p>
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
        <D3LineChart data={historyData} />

        {/* Insights dynamiques */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-green-50 rounded-lg p-4 border border-green-200">
            <p className="text-xs font-semibold text-green-600 mb-1">RECORD</p>
            <p className="text-2xl font-bold text-green-900">{maxMedals}</p>
            <p className="text-xs text-green-700 mt-1">Année max</p>
          </div>
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <p className="text-xs font-semibold text-blue-600 mb-1">MOYENNE</p>
            <p className="text-2xl font-bold text-blue-900">{avgMedals}</p>
            <p className="text-xs text-blue-700 mt-1">{historyData.length} éditions</p>
          </div>
          <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
            <p className="text-xs font-semibold text-purple-600 mb-1">TENDANCE</p>
            <p className="text-2xl font-bold text-purple-900">
              {trend > 0 ? `+${trend}%` : `${trend}%`}
            </p>
            <p className="text-xs text-purple-700 mt-1">vs {historyData[0]?.year}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Overview;