import React, { useState, useEffect } from 'react';
import { BarChart3, Globe, Medal, TrendingUp, Brain } from 'lucide-react';

// Composants
import Header from './components/Header';
import CountryModal from './components/CountryModal';
import FiltersPanel from './components/FiltersPanel';

// Pages
import Overview from './pages/Overview';
import Predictions from './pages/Predictions';
import Analysis from './pages/Analysis';
import Map from './pages/Map';
import 'leaflet/dist/leaflet.css';


// Fonctions API
import {
  fetchTopMedals,
  fetchGDPvsMedals,
  fetchCountriesLocations,
  fetchHistoryMedals,
  fetchHosts,
  fetchGlobalStats,
} from './api';

// Données utilisateur & notifications (statiques)
import { userData, notifications } from './data/mockData';

const App = () => {
  // --- États de base ---
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // --- Données dynamiques ---
  const [medalsData, setMedalsData] = useState([]);
  const [gdpMedals, setGdpMedals] = useState([]);
  const [countryLocations, setCountryLocations] = useState([]);
  const [historyData, setHistoryData] = useState([]);
  const [hosts, setHosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [globalStats, setGlobalStats] = useState({
    countries: 0,
    totalMedals: 0,
    editions: 0,
  });

  // --- Filtres globaux ---
  const [filters, setFilters] = useState({
    season: 'Summer',
    gameSlug: '',
    medalType: 'ALL',
    limit: 10,
  });

  // --- Chargement initial des données ---
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [top, gdp, loc, hist, stats] = await Promise.all([
          fetchTopMedals(10),
          fetchGDPvsMedals(),
          fetchCountriesLocations(),
          fetchHistoryMedals('USA'),
          fetchGlobalStats(),
        ]);
        setMedalsData(top);
        setGdpMedals(gdp);
        setCountryLocations(loc);
        setHistoryData(hist);
        setGlobalStats(stats);
        console.log('✅ Données principales chargées avec succès');
        console.log('🔄 Fetching GDP vs Medals...');
        gdp.forEach(country => {
          console.log('noc', country.noc);
        });
      } catch (err) {
        console.error('❌ Erreur lors du chargement des données', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // --- Chargement des éditions des JO ---
  useEffect(() => {
    (async () => {
      try {
        const all = await fetchHosts();
        setHosts(all);
        const defaultHost =
          all.find(h => h.game_season === 'Summer') || all[0];
        setFilters(f => ({
          ...f,
          gameSlug: defaultHost?.game_slug || '',
          season: defaultHost?.game_season || 'Summer',
        }));
      } catch (e) {
        console.error('❌ Erreur lors du chargement des hosts', e);
      }
    })();
  }, []);

  // --- Gestion des filtres ---
  const handleApplyFilters = () => console.log('Filtres appliqués');
  const handleResetFilters = () => console.log('Filtres réinitialisés');

  // --- Tabs principales ---
  const tabs = [
    { id: 'overview', icon: BarChart3, label: "Vue d'ensemble" },
    { id: 'predictions', icon: Brain, label: 'Prédictions IA' },
    { id: 'analysis', icon: TrendingUp, label: 'Analyses' },
    { id: 'map', icon: Globe, label: 'Carte mondiale' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <Header
        userData={userData}
        notifications={notifications}
        showUserMenu={showUserMenu}
        setShowUserMenu={setShowUserMenu}
        showNotifications={showNotifications}
        setShowNotifications={setShowNotifications}
      />

      {/* Navigation principale */}
      <nav className="bg-white border-b border-gray-200 sticky top-[89px] z-40">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between">
            {/* Tabs */}
            <div className="flex space-x-8">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 border-b-2 transition-all font-medium ${
                    activeTab === tab.id
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <tab.icon className="w-5 h-5" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Filtres */}
            <FiltersPanel
              showFilters={showFilters}
              setShowFilters={setShowFilters}
              onApply={handleApplyFilters}
              onReset={handleResetFilters}
            />
          </div>
        </div>
      </nav>

      {/* Contenu principal */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {loading ? (
          <div className="text-center text-gray-500 py-12">Chargement des données...</div>
        ) : (
          <>
            {activeTab === 'overview' && (
              <Overview
                medalsData={medalsData}
                historyData={historyData}
                hosts={hosts}
                filters={filters}
                setSelectedCountry={setSelectedCountry}
              />
            )}

            {activeTab === 'predictions' && <Predictions />}
            {activeTab === 'analysis' && <Analysis medalsData={medalsData} />}
            {activeTab === 'map' && <Map medalsData={countryLocations} />}
          </>
        )}
      </main>

      {/* Modal Détails pays */}
      {selectedCountry && (
        <CountryModal
          selectedCountry={selectedCountry}
          onClose={() => setSelectedCountry(null)}
        />
      )}

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16 py-8">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-sm text-gray-600">JO Analytics © 2024</p>
          <p className="text-xs text-gray-400 mt-1">
            Projet réalisé par Jokast, Rufus & Yannick • Données 1896–2022 •
            Visualisations : D3.js
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;