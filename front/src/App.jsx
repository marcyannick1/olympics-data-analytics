import React, { useState, useEffect, useRef } from 'react';
import { BarChart3, Globe, Medal, TrendingUp, Brain, Activity, ChevronRight, Award, Target } from 'lucide-react';
import * as d3 from 'd3';

// Mock Data
const mockMedalsData = [
  { country: 'USA', gold: 39, silver: 41, bronze: 33, total: 113, flag: '🇺🇸', gdp: 21000, code: 'USA' },
  { country: 'Chine', gold: 38, silver: 32, bronze: 18, total: 88, flag: '🇨🇳', gdp: 14000, code: 'CHN' },
  { country: 'Japon', gold: 27, silver: 14, bronze: 17, total: 58, flag: '🇯🇵', gdp: 5000, code: 'JPN' },
  { country: 'Grande-Bretagne', gold: 22, silver: 21, bronze: 22, total: 65, flag: '🇬🇧', gdp: 2800, code: 'GBR' },
  { country: 'Russie', gold: 20, silver: 28, bronze: 23, total: 71, flag: '🇷🇺', gdp: 1700, code: 'RUS' },
  { country: 'Australie', gold: 17, silver: 7, bronze: 22, total: 46, flag: '🇦🇺', gdp: 1300, code: 'AUS' },
  { country: 'Pays-Bas', gold: 10, silver: 12, bronze: 14, total: 36, flag: '🇳🇱', gdp: 900, code: 'NLD' },
  { country: 'France', gold: 10, silver: 12, bronze: 11, total: 33, flag: '🇫🇷', gdp: 2600, code: 'FRA' },
  { country: 'Allemagne', gold: 10, silver: 11, bronze: 16, total: 37, flag: '🇩🇪', gdp: 3800, code: 'DEU' },
  { country: 'Italie', gold: 10, silver: 10, bronze: 20, total: 40, flag: '🇮🇹', gdp: 2000, code: 'ITA' }
];

const mockPredictions = [
  { country: 'USA', predicted: 115, confidence: 92, flag: '🇺🇸' },
  { country: 'Chine', predicted: 90, confidence: 88, flag: '🇨🇳' },
  { country: 'France', predicted: 85, confidence: 85, flag: '🇫🇷' },
  { country: 'Grande-Bretagne', predicted: 68, confidence: 82, flag: '🇬🇧' },
  { country: 'Japon', predicted: 62, confidence: 80, flag: '🇯🇵' }
];

const historicalData = [
  { year: 2000, medals: 97 },
  { year: 2004, medals: 103 },
  { year: 2008, medals: 110 },
  { year: 2012, medals: 104 },
  { year: 2016, medals: 121 },
  { year: 2020, medals: 113 }
];

// Composant D3.js pour le graphique historique
const D3LineChart = ({ data }) => {
  const svgRef = useRef();

  useEffect(() => {
    if (!data || data.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = 800;
    const height = 300;
    const margin = { top: 20, right: 30, bottom: 40, left: 50 };

    const x = d3.scaleLinear()
      .domain(d3.extent(data, d => d.year))
      .range([margin.left, width - margin.right]);

    const y = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.medals) * 1.1])
      .range([height - margin.bottom, margin.top]);

    const line = d3.line()
      .x(d => x(d.year))
      .y(d => y(d.medals))
      .curve(d3.curveMonotoneX);

    const area = d3.area()
      .x(d => x(d.year))
      .y0(height - margin.bottom)
      .y1(d => y(d.medals))
      .curve(d3.curveMonotoneX);

    // Gradient
    const defs = svg.append("defs");
    const gradient = defs.append("linearGradient")
      .attr("id", "areaGradient")
      .attr("x1", "0%")
      .attr("y1", "0%")
      .attr("x2", "0%")
      .attr("y2", "100%");

    gradient.append("stop")
      .attr("offset", "0%")
      .attr("stop-color", "#3b82f6")
      .attr("stop-opacity", 0.3);

    gradient.append("stop")
      .attr("offset", "100%")
      .attr("stop-color", "#3b82f6")
      .attr("stop-opacity", 0);

    // Area
    svg.append("path")
      .datum(data)
      .attr("fill", "url(#areaGradient)")
      .attr("d", area);

    // Line
    svg.append("path")
      .datum(data)
      .attr("fill", "none")
      .attr("stroke", "#3b82f6")
      .attr("stroke-width", 3)
      .attr("d", line);

    // Points
    svg.selectAll("circle")
      .data(data)
      .join("circle")
      .attr("cx", d => x(d.year))
      .attr("cy", d => y(d.medals))
      .attr("r", 6)
      .attr("fill", "#3b82f6")
      .attr("stroke", "#fff")
      .attr("stroke-width", 2)
      .style("cursor", "pointer")
      .on("mouseenter", function(event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr("r", 8);
        
        svg.append("text")
          .attr("class", "tooltip")
          .attr("x", x(d.year))
          .attr("y", y(d.medals) - 15)
          .attr("text-anchor", "middle")
          .attr("fill", "#1f2937")
          .attr("font-size", "14px")
          .attr("font-weight", "bold")
          .text(`${d.medals} médailles`);
      })
      .on("mouseleave", function() {
        d3.select(this)
          .transition()
          .duration(200)
          .attr("r", 6);
        
        svg.selectAll(".tooltip").remove();
      });

    // Axes
    svg.append("g")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x).tickFormat(d3.format("d")).ticks(6))
      .selectAll("text")
      .attr("fill", "#6b7280")
      .style("font-size", "12px");

    svg.append("g")
      .attr("transform", `translate(${margin.left},0)`)
      .call(d3.axisLeft(y).ticks(5))
      .selectAll("text")
      .attr("fill", "#6b7280")
      .style("font-size", "12px");

    // Grid
    svg.append("g")
      .attr("class", "grid")
      .attr("transform", `translate(${margin.left},0)`)
      .call(d3.axisLeft(y).ticks(5).tickSize(-width + margin.left + margin.right).tickFormat(""))
      .selectAll("line")
      .attr("stroke", "#e5e7eb")
      .attr("stroke-opacity", 0.5);

  }, [data]);

  return (
    <div className="w-full overflow-x-auto">
      <svg ref={svgRef} width="100%" height="300" viewBox="0 0 800 300" />
    </div>
  );
};

// Composant D3.js pour le scatter plot PIB vs Médailles
const D3ScatterPlot = ({ data }) => {
  const svgRef = useRef();

  useEffect(() => {
    if (!data || data.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = 800;
    const height = 400;
    const margin = { top: 20, right: 30, bottom: 60, left: 70 };

    const x = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.gdp) * 1.1])
      .range([margin.left, width - margin.right]);

    const y = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.total) * 1.1])
      .range([height - margin.bottom, margin.top]);

    const size = d3.scaleSqrt()
      .domain([0, d3.max(data, d => d.total)])
      .range([5, 30]);

    // Gradient for circles
    const defs = svg.append("defs");
    data.forEach((d, i) => {
      const gradient = defs.append("radialGradient")
        .attr("id", `gradient-${i}`)
        .attr("cx", "30%")
        .attr("cy", "30%");

      gradient.append("stop")
        .attr("offset", "0%")
        .attr("stop-color", "#60a5fa");

      gradient.append("stop")
        .attr("offset", "100%")
        .attr("stop-color", "#2563eb");
    });

    // Circles
    svg.selectAll("circle")
      .data(data)
      .join("circle")
      .attr("cx", d => x(d.gdp))
      .attr("cy", d => y(d.total))
      .attr("r", d => size(d.total))
      .attr("fill", (d, i) => `url(#gradient-${i})`)
      .attr("opacity", 0.7)
      .attr("stroke", "#fff")
      .attr("stroke-width", 2)
      .style("cursor", "pointer")
      .on("mouseenter", function(event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr("opacity", 1)
          .attr("stroke-width", 3);
        
        const tooltip = svg.append("g")
          .attr("class", "tooltip");

        const text = tooltip.append("text")
          .attr("x", x(d.gdp))
          .attr("y", y(d.total) - size(d.total) - 10)
          .attr("text-anchor", "middle")
          .attr("fill", "#1f2937")
          .attr("font-weight", "bold")
          .text(`${d.country}: ${d.total} médailles`);

        const bbox = text.node().getBBox();
        tooltip.insert("rect", "text")
          .attr("x", bbox.x - 5)
          .attr("y", bbox.y - 2)
          .attr("width", bbox.width + 10)
          .attr("height", bbox.height + 4)
          .attr("fill", "white")
          .attr("stroke", "#e5e7eb")
          .attr("rx", 4);

        text.raise();
      })
      .on("mouseleave", function() {
        d3.select(this)
          .transition()
          .duration(200)
          .attr("opacity", 0.7)
          .attr("stroke-width", 2);
        
        svg.selectAll(".tooltip").remove();
      });

    // Flags
    svg.selectAll("text.flag")
      .data(data)
      .join("text")
      .attr("class", "flag")
      .attr("x", d => x(d.gdp))
      .attr("y", d => y(d.total))
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "middle")
      .attr("font-size", d => size(d.total) * 0.8)
      .style("pointer-events", "none")
      .text(d => d.flag);

    // Axes
    svg.append("g")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x).ticks(5))
      .selectAll("text")
      .attr("fill", "#6b7280")
      .style("font-size", "12px");

    svg.append("g")
      .attr("transform", `translate(${margin.left},0)`)
      .call(d3.axisLeft(y).ticks(5))
      .selectAll("text")
      .attr("fill", "#6b7280")
      .style("font-size", "12px");

    // Axis labels
    svg.append("text")
      .attr("x", width / 2)
      .attr("y", height - 10)
      .attr("text-anchor", "middle")
      .attr("fill", "#6b7280")
      .attr("font-size", "14px")
      .text("PIB (Milliards $)");

    svg.append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -height / 2)
      .attr("y", 20)
      .attr("text-anchor", "middle")
      .attr("fill", "#6b7280")
      .attr("font-size", "14px")
      .text("Nombre de médailles");

    // Grid
    svg.append("g")
      .attr("class", "grid")
      .attr("transform", `translate(${margin.left},0)`)
      .call(d3.axisLeft(y).ticks(5).tickSize(-width + margin.left + margin.right).tickFormat(""))
      .selectAll("line")
      .attr("stroke", "#e5e7eb")
      .attr("stroke-opacity", 0.5);

  }, [data]);

  return (
    <div className="w-full overflow-x-auto">
      <svg ref={svgRef} width="100%" height="400" viewBox="0 0 800 400" />
    </div>
  );
};

// Composant D3.js pour la carte du monde simplifiée
const D3WorldMap = ({ data }) => {
  const svgRef = useRef();

  useEffect(() => {
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = 900;
    const height = 500;

    // Positions approximatives des pays (latitude, longitude)
    const positions = {
      'USA': [-95, 37],
      'CHN': [105, 35],
      'JPN': [138, 36],
      'GBR': [-3, 54],
      'RUS': [105, 61],
      'AUS': [133, -27],
      'NLD': [5, 52],
      'FRA': [2, 46],
      'DEU': [10, 51],
      'ITA': [12, 42]
    };

    const projection = d3.geoMercator()
      .center([0, 30])
      .scale(130)
      .translate([width / 2, height / 2]);

    const colorScale = d3.scaleSequential()
      .domain([0, d3.max(data, d => d.total)])
      .interpolator(d3.interpolateBlues);

    data.forEach(country => {
      const pos = positions[country.code];
      if (pos) {
        const [x, y] = projection(pos);
        const radius = Math.sqrt(country.total) * 2;

        // Cercle avec gradient
        const g = svg.append("g")
          .style("cursor", "pointer");

        g.append("circle")
          .attr("cx", x)
          .attr("cy", y)
          .attr("r", radius + 5)
          .attr("fill", colorScale(country.total))
          .attr("opacity", 0.3);

        g.append("circle")
          .attr("cx", x)
          .attr("cy", y)
          .attr("r", radius)
          .attr("fill", colorScale(country.total))
          .attr("stroke", "#fff")
          .attr("stroke-width", 2)
          .attr("opacity", 0.8);

        g.append("text")
          .attr("x", x)
          .attr("y", y)
          .attr("text-anchor", "middle")
          .attr("dominant-baseline", "middle")
          .attr("font-size", radius * 0.7)
          .style("pointer-events", "none")
          .text(country.flag);

        g.on("mouseenter", function() {
          d3.select(this).select("circle:nth-child(2)")
            .transition()
            .duration(200)
            .attr("stroke-width", 4)
            .attr("opacity", 1);

          svg.append("text")
            .attr("class", "tooltip")
            .attr("x", x)
            .attr("y", y - radius - 15)
            .attr("text-anchor", "middle")
            .attr("fill", "#1f2937")
            .attr("font-weight", "bold")
            .attr("font-size", "14px")
            .text(`${country.country}: ${country.total}`);
        })
        .on("mouseleave", function() {
          d3.select(this).select("circle:nth-child(2)")
            .transition()
            .duration(200)
            .attr("stroke-width", 2)
            .attr("opacity", 0.8);

          svg.selectAll(".tooltip").remove();
        });
      }
    });

    // Légende
    const legendWidth = 200;
    const legendHeight = 10;
    const legendX = width - legendWidth - 50;
    const legendY = height - 50;

    const legendScale = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.total)])
      .range([0, legendWidth]);

    const legendAxis = d3.axisBottom(legendScale)
      .ticks(5);

    // Gradient pour la légende
    const defs = svg.append("defs");
    const legendGradient = defs.append("linearGradient")
      .attr("id", "legend-gradient")
      .attr("x1", "0%")
      .attr("x2", "100%");

    for (let i = 0; i <= 10; i++) {
      legendGradient.append("stop")
        .attr("offset", `${i * 10}%`)
        .attr("stop-color", d3.interpolateBlues(i / 10));
    }

    svg.append("rect")
      .attr("x", legendX)
      .attr("y", legendY)
      .attr("width", legendWidth)
      .attr("height", legendHeight)
      .attr("fill", "url(#legend-gradient)");

    svg.append("g")
      .attr("transform", `translate(${legendX},${legendY + legendHeight})`)
      .call(legendAxis)
      .selectAll("text")
      .attr("fill", "#6b7280")
      .style("font-size", "10px");

    svg.append("text")
      .attr("x", legendX + legendWidth / 2)
      .attr("y", legendY - 5)
      .attr("text-anchor", "middle")
      .attr("fill", "#6b7280")
      .attr("font-size", "12px")
      .text("Nombre de médailles");

  }, [data]);

  return (
    <div className="w-full overflow-x-auto bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4">
      <svg ref={svgRef} width="100%" height="500" viewBox="0 0 900 500" />
    </div>
  );
};

const App = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Données utilisateur statiques
  const userData = {
    name: 'Yannick Dupont',
    email: 'yannick.dupont@jo-analytics.com',
    role: 'Data Analyst',
    avatar: '👨‍💻',
    team: 'Équipe JO GPT',
    lastLogin: '05 Nov 2024, 14:32',
    favoriteCountries: ['🇫🇷 France', '🇺🇸 USA', '🇯🇵 Japon'],
    stats: {
      reportsCreated: 47,
      modelsRun: 156,
      dataAnalyzed: '2.3M'
    }
  };

  // Notifications statiques
  const notifications = [
    { id: 1, type: 'success', message: 'Nouveau modèle IA entraîné avec succès', time: 'Il y a 2h', icon: '✅' },
    { id: 2, type: 'info', message: 'Mise à jour des données Paris 2024', time: 'Il y a 5h', icon: '📊' },
    { id: 3, type: 'warning', message: 'Analyse PIB en cours de traitement', time: 'Hier', icon: '⚠️' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header avec profil utilisateur */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl flex items-center justify-center shadow-lg">
                <Medal className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">JO Analytics</h1>
                <p className="text-sm text-gray-500">Analyse & Prédiction des Jeux Olympiques</p>
              </div>
            </div>
            
            {/* Section droite avec notifications et profil */}
            <div className="flex items-center space-x-4">
              {/* Badge IA */}
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

                {showNotifications && (
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
                )}
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

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 overflow-hidden">
                    {/* Header profil */}
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

                    {/* Stats utilisateur */}
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

                    {/* Pays favoris */}
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

                    {/* Menu actions */}
                    <div className="p-2">
                      <button className="w-full text-left px-4 py-2 hover:bg-gray-50 rounded-lg transition-colors flex items-center space-x-3">
                        <span className="text-lg">⚙️</span>
                        <span className="text-sm text-gray-700">Paramètres</span>
                      </button>
                      <button className="w-full text-left px-4 py-2 hover:bg-gray-50 rounded-lg transition-colors flex items-center space-x-3">
                        <span className="text-lg">📊</span>
                        <span className="text-sm text-gray-700">Mes analyses</span>
                      </button>
                      <button className="w-full text-left px-4 py-2 hover:bg-gray-50 rounded-lg transition-colors flex items-center space-x-3">
                        <span className="text-lg">💾</span>
                        <span className="text-sm text-gray-700">Données sauvegardées</span>
                      </button>
                    </div>

                    {/* Footer */}
                    <div className="p-4 bg-gray-50 border-t border-gray-200">
                      <p className="text-xs text-gray-500 mb-2">Dernière connexion: {userData.lastLogin}</p>
                      <button className="w-full bg-red-50 text-red-600 py-2 rounded-lg hover:bg-red-100 transition-colors font-medium text-sm">
                        Déconnexion
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation avec filtres */}
      <nav className="bg-white border-b border-gray-200 sticky top-[89px] z-40">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between">
            <div className="flex space-x-8">
              {[
                { id: 'overview', icon: BarChart3, label: 'Vue d\'ensemble' },
                { id: 'predictions', icon: Brain, label: 'Prédictions IA' },
                { id: 'analysis', icon: TrendingUp, label: 'Analyses' },
                { id: 'map', icon: Globe, label: 'Carte mondiale' }
              ].map(tab => (
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

            {/* Bouton Filtres */}
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <span className="text-sm font-medium text-gray-700">Filtres</span>
              <span className="text-lg">⚙️</span>
            </button>
          </div>

          {/* Panel Filtres */}
          {showFilters && (
            <div className="py-4 border-t border-gray-200 bg-gray-50">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-2">ANNÉE</label>
                  <select className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                    <option>2020 (Tokyo)</option>
                    <option>2016 (Rio)</option>
                    <option>2012 (Londres)</option>
                    <option>2008 (Pékin)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-2">CONTINENT</label>
                  <select className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
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
                  <select className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                    <option>Toutes les médailles</option>
                    <option>🥇 Or uniquement</option>
                    <option>🥈 Argent uniquement</option>
                    <option>🥉 Bronze uniquement</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-2">AFFICHAGE</label>
                  <select className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                    <option>Top 10</option>
                    <option>Top 20</option>
                    <option>Top 50</option>
                    <option>Tous les pays</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end space-x-2 mt-4">
                <button className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-200 rounded-lg transition-colors">
                  Réinitialiser
                </button>
                <button className="px-4 py-2 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors">
                  Appliquer
                </button>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Barre d'information avec stats rapides */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold mb-2">🏆 Tokyo 2020</h2>
                  <p className="text-blue-100">Du 23 juillet au 8 août 2021 • 339 épreuves • 11,656 athlètes</p>
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

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                { label: 'Pays analysés', value: '206', icon: Globe, color: 'blue', bg: 'bg-blue-50', iconBg: 'bg-blue-100', textColor: 'text-blue-600' },
                { label: 'Médailles totales', value: '1,028', icon: Award, color: 'yellow', bg: 'bg-yellow-50', iconBg: 'bg-yellow-100', textColor: 'text-yellow-600' },
                { label: 'Éditions JO', value: '32', icon: Target, color: 'green', bg: 'bg-green-50', iconBg: 'bg-green-100', textColor: 'text-green-600' },
                { label: 'Précision IA', value: '94%', icon: Brain, color: 'purple', bg: 'bg-purple-50', iconBg: 'bg-purple-100', textColor: 'text-purple-600' }
              ].map((stat, i) => (
                <div key={i} className={`${stat.bg} rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-all`}>
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

            {/* Tableau des médailles */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Classement des médailles</h2>
                    <p className="text-sm text-gray-500 mt-1">Tokyo 2020 - Résultats officiels</p>
                  </div>
                  <div className="bg-blue-50 px-4 py-2 rounded-lg">
                    <span className="text-sm font-medium text-blue-700">Top 10</span>
                  </div>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left py-4 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">Rang</th>
                      <th className="text-left py-4 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">Pays</th>
                      <th className="text-center py-4 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">Or</th>
                      <th className="text-center py-4 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">Argent</th>
                      <th className="text-center py-4 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">Bronze</th>
                      <th className="text-center py-4 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">Total</th>
                      <th className="py-4 px-6"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {mockMedalsData.map((item, index) => (
                      <tr 
                        key={index}
                        onClick={() => setSelectedCountry(item)}
                        className="hover:bg-gray-50 cursor-pointer transition-colors"
                      >
                        <td className="py-4 px-6">
                          <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gray-100 text-sm font-bold text-gray-700">
                            {index + 1}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center space-x-3">
                            <span className="text-2xl">{item.flag}</span>
                            <span className="font-semibold text-gray-900">{item.country}</span>
                          </div>
                        </td>
                        <td className="text-center py-4 px-6">
                          <span className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-yellow-50 text-yellow-700 font-bold">
                            {item.gold}
                          </span>
                        </td>
                        <td className="text-center py-4 px-6">
                          <span className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gray-100 text-gray-700 font-bold">
                            {item.silver}
                          </span>
                        </td>
                        <td className="text-center py-4 px-6">
                          <span className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-orange-50 text-orange-700 font-bold">
                            {item.bronze}
                          </span>
                        </td>
                        <td className="text-center py-4 px-6">
                          <span className="text-xl font-bold text-gray-900">{item.total}</span>
                        </td>
                        <td className="py-4 px-6">
                          <ChevronRight className="w-5 h-5 text-gray-400" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Graphique D3.js */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Évolution historique</h2>
                  <p className="text-sm text-gray-500 mt-1">Médailles USA (2000-2020) - Visualisation D3.js</p>
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
              
              {/* Légende et insights */}
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

            {/* Section Comparaison rapide */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">⚔️ Comparaison rapide</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">🇺🇸 USA vs 🇨🇳 Chine</span>
                    <span className="text-sm font-bold text-blue-600">+25 médailles</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-blue-600 to-blue-400" style={{ width: '56%' }}></div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">🇯🇵 Japon vs 🇬🇧 Grande-Bretagne</span>
                    <span className="text-sm font-bold text-green-600">+7 médailles</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-green-600 to-green-400" style={{ width: '47%' }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'predictions' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-2xl shadow-sm border border-purple-200 p-6">
              <div className="flex items-start space-x-4">
                <div className="bg-purple-100 p-3 rounded-xl">
                  <Brain className="w-6 h-6 text-purple-600" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-gray-900 mb-2">Prédictions IA - Paris 2024</h2>
                  <p className="text-sm text-gray-600">
                    Basé sur les modèles Deep Learning (TensorFlow) et Machine Learning (Random Forest)
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {mockPredictions.map((pred, index) => (
                <div key={index} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <span className="text-3xl">{pred.flag}</span>
                      <div>
                        <h3 className="font-bold text-gray-900 text-lg">{pred.country}</h3>
                        <p className="text-sm text-gray-500">Prédiction médailles</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-bold text-blue-600">{pred.predicted}</p>
                      <p className="text-xs text-gray-500">médailles</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Confiance du modèle</span>
                      <span className="font-bold text-green-600">{pred.confidence}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-green-500 to-green-600 h-full rounded-full transition-all duration-1000"
                        style={{ width: `${pred.confidence}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center">
                <Activity className="w-5 h-5 mr-2 text-blue-600" />
                Modèles d'IA utilisés
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                  <p className="text-sm font-semibold text-blue-900 mb-1">Réseau de neurones</p>
                  <p className="text-xs text-blue-700">TensorFlow/Keras - 3 couches</p>
                </div>
                <div className="bg-green-50 rounded-xl p-4 border border-green-100">
                  <p className="text-sm font-semibold text-green-900 mb-1">Random Forest</p>
                  <p className="text-xs text-green-700">100 arbres de décision</p>
                </div>
                <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
                  <p className="text-sm font-semibold text-purple-900 mb-1">Variables analysées</p>
                  <p className="text-xs text-purple-700">PIB, population, historique</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'analysis' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-900 flex items-center">
                  <TrendingUp className="w-6 h-6 mr-2 text-green-600" />
                  Analyse PIB vs Médailles
                </h2>
                <p className="text-sm text-gray-500 mt-1">Corrélation entre richesse économique et performances sportives - D3.js</p>
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
                      Coefficient: <span className="font-bold">0.78</span> (forte corrélation positive)
                    </p>
                    <p className="text-sm text-green-700 mt-1">
                      Les pays avec un PIB élevé tendent à obtenir plus de médailles, mais d'autres facteurs jouent un rôle important.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'map' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-900 flex items-center">
                  <Globe className="w-6 h-6 mr-2 text-blue-600" />
                  Carte mondiale des médailles
                </h2>
                <p className="text-sm text-gray-500 mt-1">Distribution géographique des performances olympiques - D3.js</p>
              </div>
              
              <D3WorldMap data={mockMedalsData} />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {mockMedalsData.slice(0, 5).map((country, i) => (
                <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 text-center hover:shadow-md transition-all cursor-pointer">
                  <div className="text-4xl mb-3">{country.flag}</div>
                  <p className="font-bold text-gray-900 text-sm">{country.country}</p>
                  <div className="mt-2 bg-blue-50 rounded-lg py-2">
                    <p className="text-2xl font-bold text-blue-600">{country.total}</p>
                    <p className="text-xs text-gray-500">médailles</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Modal détails pays */}
      {selectedCountry && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 backdrop-blur-sm" onClick={() => setSelectedCountry(null)}>
          <div className="bg-white rounded-3xl p-8 max-w-2xl w-full shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-4">
                <span className="text-6xl">{selectedCountry.flag}</span>
                <div>
                  <h2 className="text-3xl font-bold text-gray-900">{selectedCountry.country}</h2>
                  <p className="text-gray-500">Détails des performances</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedCountry(null)} 
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
      )}

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16 py-8">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-sm text-gray-600">JO Analytics © 2024</p>
          <p className="text-xs text-gray-400 mt-1">
            Projet réalisé par Jokast, Rufus & Yannick • Données 1896-2022 • Visualisations: D3.js
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;