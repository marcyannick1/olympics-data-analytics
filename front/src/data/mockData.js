// src/data/mockData.js
export const mockMedalsData = [
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

export const mockPredictions = [
  { country: 'USA', predicted: 115, confidence: 92, flag: '🇺🇸' },
  { country: 'Chine', predicted: 90, confidence: 88, flag: '🇨🇳' },
  { country: 'France', predicted: 85, confidence: 85, flag: '🇫🇷' },
  { country: 'Grande-Bretagne', predicted: 68, confidence: 82, flag: '🇬🇧' },
  { country: 'Japon', predicted: 62, confidence: 80, flag: '🇯🇵' }
];

export const historicalData = [
  { year: 2000, medals: 97 },
  { year: 2004, medals: 103 },
  { year: 2008, medals: 110 },
  { year: 2012, medals: 104 },
  { year: 2016, medals: 121 },
  { year: 2020, medals: 113 }
];

export const userData = {
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

export const notifications = [
  { id: 1, type: 'success', message: 'Nouveau modèle IA entraîné avec succès', time: 'Il y a 2h', icon: '✅' },
  { id: 2, type: 'info', message: 'Mise à jour des données Paris 2024', time: 'Il y a 5h', icon: '📊' },
  { id: 3, type: 'warning', message: 'Analyse PIB en cours de traitement', time: 'Hier', icon: '⚠️' }
];