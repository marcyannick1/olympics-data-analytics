// src/api.js
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// --- Fonction utilitaire pour récupérer un drapeau à partir du code NOC ---
function getFlagFromNOC(noc) {
  const flags = {
    USA: "🇺🇸",
    CHN: "🇨🇳",
    JPN: "🇯🇵",
    GBR: "🇬🇧",
    FRA: "🇫🇷",
    GER: "🇩🇪",
    ITA: "🇮🇹",
    AUS: "🇦🇺",
    CAN: "🇨🇦",
    RUS: "🇷🇺",
    BRA: "🇧🇷",
    KOR: "🇰🇷",
    ESP: "🇪🇸",
    NED: "🇳🇱",
    SUI: "🇨🇭",
  };
  return flags[noc] || "🏳️";
}

// --- 1️⃣ Top des pays par médailles ---
// export async function fetchTopMedals(limit = 10) {
//   try {
//     console.log(`🔄 Fetching top medals (limit=${limit})...`);
//     const res = await fetch(`${API_BASE}/medal_countries/top?limit=${limit}`);
//     if (!res.ok) throw new Error('Fetch failed');
//     const data = await res.json();

//     // Normalisation des données
//     const formatted = data.map((d, i) => ({
//       rank: i + 1,
//       country: d.country_name,
//       noc: d.noc,
//       gold: d.gold_count,
//       silver: d.silver_count,
//       bronze: d.bronze_count,
//       total: d.medal_count || d.total_medals,
//       gdp: d.gdp || null,
//       flag: getFlagFromNOC(d.noc),
//     }));

//     console.log('✅ /medal_countries/top →', formatted);
//     return formatted;
//   } catch (err) {
//     console.error('❌ Error fetching top medals:', err);
//     return [];
//   }
// }

// --- 2️⃣ Corrélation PIB / Médailles ---
export async function fetchGDPvsMedals() {
  try {
    console.log('🔄 Fetching GDP vs Medals...');
    const res = await fetch(`${API_BASE}/stats/gdp-vs-medals`);
    if (!res.ok) throw new Error('Fetch failed');
    const data = await res.json();

    const formatted = data.map(d => ({
      country: d.country_name,
      noc: d.noc,
      gdp: parseFloat(d.gdp) || 0,
      gold: d.gold_count,
      silver: d.silver_count,
      bronze: d.bronze_count,
      total: d.total_medals,
      flag: getFlagFromNOC(d.noc),
    }));

    console.log('✅ /stats/gdp-vs-medals →', formatted);
    return formatted;
  } catch (err) {
    console.error('❌ Error fetching GDP vs Medals:', err);
    return [];
  }
}

// --- 3️⃣ Localisation des pays + médailles ---
export async function fetchCountriesLocations() {
  try {
    console.log('🔄 Fetching countries locations...');
    const res = await fetch(`${API_BASE}/countries/locations`);
    if (!res.ok) throw new Error('Fetch failed');
    const data = await res.json();

    const formatted = data.map(d => ({
      country: d.country_name,
      noc: d.noc,
      lat: parseFloat(d.latitude),
      lon: parseFloat(d.longitude),
      total: d.total_medals,
      gold: d.gold_count,
      silver: d.silver_count,
      bronze: d.bronze_count,
      flag: getFlagFromNOC(d.noc),
    }));

    console.log('✅ /countries/locations →', formatted);
    return formatted;
  } catch (err) {
    console.error('❌ Error fetching locations:', err);
    return [];
  }
}

// --- 4️⃣ Historique des médailles par pays ---
export async function fetchHistoryMedals(noc = 'USA') {
  try {
    console.log(`🔄 Fetching history medals (noc=${noc})...`);
    const res = await fetch(`${API_BASE}/history/medals?noc=${noc}`);
    if (!res.ok) throw new Error('Fetch failed');
    const data = await res.json();

    const formatted = data.map(d => ({
      year: d.game_year,
      medals: d.total_medals,
      gold: d.gold_count,
      silver: d.silver_count,
      bronze: d.bronze_count,
    }));

    console.log('✅ /history/medals →', formatted);
    return formatted;
  } catch (err) {
    console.error('❌ Error fetching history medals:', err);
    return [];
  }
}

// --- à AJOUTER dans src/api.js ---

export async function fetchHosts({ season } = {}) {
  const base = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
  const qs = new URLSearchParams();
  if (season) qs.set('season', season);
  const url = `${base}/hosts${qs.toString() ? `?${qs.toString()}` : ''}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Erreur fetchHosts');
  const data = await res.json();
  // tri du plus récent au plus ancien (déjà fait côté API mais on sécurise)
  return data.sort((a, b) => Number(b.game_year) - Number(a.game_year));
}

// ⚠️ remplace ta fonction fetchTopMedals actuelle par celle-ci
// --- fusion Top Médailles + PIB ---
export async function fetchTopMedals(arg = 10) {
  const base = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

  // compatibilité avec anciens appels
  let limit = 10, gameSlug, medalType, order;
  if (typeof arg === 'number') {
    limit = arg;
  } else if (typeof arg === 'object' && arg) {
    ({ limit = 10, gameSlug, medalType, order } = arg);
  }

  const qs = new URLSearchParams();
  qs.set('limit', String(limit));
  if (gameSlug) qs.set('game_slug', gameSlug);
  if (medalType && medalType !== 'ALL') qs.set('medal_type', medalType);
  if (order) qs.set('order', order);

  try {
    // 1️⃣ On récupère le top pays
    const resTop = await fetch(`${base}/medal_countries/top?${qs.toString()}`);
    if (!resTop.ok) throw new Error('Erreur /medal_countries/top');
    const topData = await resTop.json();

    // 2️⃣ On récupère les PIB pour enrichir
    const resGDP = await fetch(`${base}/stats/gdp-vs-medals`);
    const gdpData = resGDP.ok ? await resGDP.json() : [];

    // 3️⃣ On fusionne les 2 jeux de données sur le NOC ou le nom du pays
    const merged = topData.map((d, i) => {
      const match =
        gdpData.find(
          g =>
            g.noc?.toLowerCase() === d.noc?.toLowerCase() ||
            g.country_name?.toLowerCase() === d.country_name?.toLowerCase()
        ) || {};

      return {
        rank: i + 1,
        country: d.country_name,
        noc: d.noc,
        gold: d.gold_count,
        silver: d.silver_count,
        bronze: d.bronze_count,
        total: d.medal_count ?? d.total_medals,
        gdp: match.gdp ? (match.gdp / 1_000_000_000_000).toFixed(2) : null, // ✅ conversion en milliers de milliards
        flag: getFlagFromNOC(d.noc),
      };
    });

    console.log('✅ /medal_countries/top fusionné avec PIB →', merged);
    return merged;
  } catch (err) {
    console.error('❌ Error fetching top medals:', err);
    return [];
  }
}

// --- à placer dans src/api.js ---
export async function fetchGlobalStats() {
  const base = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

  try {
    // 1️⃣ Récupérer les pays et le total global
    const res = await fetch(`${base}/medal_countries/totals`);
    if (!res.ok) throw new Error("Erreur /medal_countries/totals");
    const data = await res.json();

    const countriesArray = Array.isArray(data.countries) ? data.countries : [];
    const globalTotals = data.global || {};

    // 2️⃣ Calculs des stats globales
    const countriesCount = countriesArray.length; // ✅ nombre de pays distincts
    const totalMedals = globalTotals.total_medals || 0;

    // 3️⃣ Récupération du nombre d’éditions
    const resHosts = await fetch(`${base}/hosts`);
    const hosts = resHosts.ok ? await resHosts.json() : [];
    const editions = hosts.length;

    return {
      countries: countriesCount,
      totalMedals,
      editions,
    };
  } catch (err) {
    console.error("❌ Error fetching global stats:", err);
    return { countries: 0, totalMedals: 0, editions: 0 };
  }
}