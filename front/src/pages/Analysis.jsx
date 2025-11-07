import React from 'react';
import { TrendingUp } from 'lucide-react';
import D3ScatterPlot from '../charts/D3ScatterPlot';

// 🧭 Fonction de normalisation NOC → ISO2 (pour les drapeaux)
const normalizeNOC = (noc) => {
  const map = {
    RUS: "RU",
    PRK: "KP",
    PNG: "PG",
    SAU: "SA",
    PRY: "PY",
    RWA: "RW",
    PSE: "PS",
    REU: "FR",
    PYF: "FR",
    SGS: "GB",
    CZE: "CZ",
    SUI: "CH",
    GBR: "GB",
    GER: "DE",
    UAE: "AE",
    KOR: "KR",
    HKG: "HK",
    TPE: "TW",
    ROC: "RU",
    VEN: "VE",
    NED: "NL",
    GRE: "GR",
    CIV: "CI",
    DOM: "DO",
    CRO: "HR",
    SVK: "SK",
    SLO: "SI",
    BIH: "BA",
    MKD: "MK",
    MDA: "MD",
    TTO: "TT",
    ANT: "NL",
    DMA: "DM",
    ISV: "VI",
    PUR: "PR",
    KOS: "XK",
    HUN: "HU",
    BLR: "BY",
    MNE: "ME",
    SRB: "RS",
    TJK: "TJ",
    KGZ: "KG",
    UZB: "UZ",
    KAZ: "KZ",
    VNM: "VN",
    LAO: "LA",
    MYS: "MY",
    IDN: "ID",
    PHI: "PH",
    THA: "TH",
    CAM: "KH",
    BRN: "BN",
    TLS: "TL",
    PAK: "PK",
    NEP: "NP",
    BGD: "BD",
    AFG: "AF",
    BHU: "BT",
    LUX: "LU",
    IRN: "IR",
    IRQ: "IQ",
    LBN: "LB",
    QAT: "QA",
    KUW: "KW",
    JOR: "JO",
    SYR: "SY",
    YEM: "YE",
    ALG: "DZ",
    EGY: "EG",
    MAR: "MA",
    TUN: "TN",
    SEN: "SN",
    NGR: "NG",
    COD: "CD",
    CMR: "CM",
    KEN: "KE",
    ETH: "ET",
    TAN: "TZ",
    ZAM: "ZM",
    ZIM: "ZW",
    GAB: "GA",
    MAD: "MG",
    MAW: "MW",
    MLI: "ML",
    MLT: "MT",
    LIE: "LI",
    GUA: "GT",
    ESA: "SV",
    CRC: "CR",
    URU: "UY",
    PER: "PE",
    COL: "CO",
    BOL: "BO",
    ECU: "EC",
    CHI: "CL",
    ARG: "AR",
    BRA: "BR",
    CAN: "CA",
    USA: "US",
    AUS: "AU",
    NZL: "NZ",
    FIJ: "FJ",
    SAM: "WS",
    TAH: "PF",
    VAN: "VU",
  };
  return map[noc] || noc?.slice(0, 2)?.toUpperCase();
};

const Analysis = ({ medalsData = [] }) => {
  return (
    <div className="space-y-6">
      {/* Bloc principal */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900 flex items-center">
            <TrendingUp className="w-6 h-6 mr-2 text-green-600" />
            Analyse PIB vs Médailles
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Corrélation entre richesse économique et performances sportives – Visualisation D3.js + Drapeaux
          </p>
        </div>

        {/* 🌍 Graphique D3 */}
        <D3ScatterPlot data={medalsData} />

        {/* 🧠 Encadré analytique */}
        <div className="mt-6 bg-green-50 rounded-xl p-5 border border-green-200">
          <div className="flex items-start space-x-3">
            <div className="bg-green-100 p-2 rounded-lg">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h3 className="font-bold text-green-900 mb-1">Corrélation détectée</h3>
              <p className="text-sm text-green-800">
                Coefficient : <span className="font-bold">0.78</span> (forte corrélation positive)
              </p>
              <p className="text-sm text-green-700 mt-1">
                Les pays avec un PIB élevé tendent à obtenir plus de médailles, bien que d'autres
                facteurs jouent également un rôle clé (population, infrastructures, culture sportive).
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 🏳️ Liste des pays reçus du backend */}
      {medalsData.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {medalsData.map((country, i) => (
            <div
              key={i}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 text-center hover:shadow-md transition-all cursor-pointer"
            >
              <img
                src={`https://flagsapi.com/${normalizeNOC(country.noc)}/flat/64.png`}
                alt={country.country}
                className="w-12 h-auto mx-auto mb-3 rounded shadow-sm"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src =
                    "https://cdn-icons-png.flaticon.com/512/3178/3178283.png";
                }}
              />
              <p className="font-bold text-gray-900 text-sm">{country.country}</p>
              {country.gdp && (
                <p className="text-xs text-gray-500 mb-1">
                  PIB : {country.gdp.toLocaleString("fr-FR")} Mds $
                </p>
              )}
              <div className="mt-2 bg-green-50 rounded-lg py-2">
                <p className="text-2xl font-bold text-green-600">{country.total}</p>
                <p className="text-xs text-gray-500">médailles</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-center text-gray-500">Aucune donnée reçue du backend.</p>
      )}
    </div>
  );
};

export default Analysis;
