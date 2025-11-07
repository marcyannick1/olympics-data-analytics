import React from 'react';
import { Globe } from 'lucide-react';
// import { MapContainer, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import D3WorldMap from '../charts/D3WorldMap';

// 🧭 Normalisation NOC → ISO2
const normalizeNOC = (noc) => {
  const map = {
    REU: "FR", PYF: "FR", TAH: "PF", SGS: "GB", ANT: "NL", ROC: "RU",
    SUI: "CH", GBR: "GB", GER: "DE", CZE: "CZ", NED: "NL", GRE: "GR",
    UAE: "AE", KOR: "KR", PRK: "KP", HKG: "HK", TPE: "TW",
    SAU: "SA", IRN: "IR", IRQ: "IQ", LBN: "LB", QAT: "QA", KUW: "KW",
    JOR: "JO", SYR: "SY", YEM: "YE", PSE: "PS",
    ALG: "DZ", EGY: "EG", MAR: "MA", TUN: "TN", SEN: "SN", CIV: "CI",
    NGR: "NG", COD: "CD", CMR: "CM", KEN: "KE", ETH: "ET", TAN: "TZ",
    ZAM: "ZM", ZIM: "ZW", GAB: "GA", MAD: "MG", MAW: "MW", MLI: "ML",
    LUX: "LU", MLT: "MT", LIE: "LI", SVK: "SK", SLO: "SI", BIH: "BA",
    MKD: "MK", MDA: "MD", BLR: "BY", MNE: "ME", SRB: "RS", HUN: "HU",
    TJK: "TJ", KGZ: "KG", UZB: "UZ", KAZ: "KZ",
    PAK: "PK", NEP: "NP", BGD: "BD", AFG: "AF", BHU: "BT", LAO: "LA",
    MYS: "MY", IDN: "ID", PHI: "PH", THA: "TH", CAM: "KH", BRN: "BN",
    TLS: "TL", VNM: "VN",
    AUS: "AU", NZL: "NZ", FIJ: "FJ", VAN: "VU", PNG: "PG",
    CAN: "CA", USA: "US", URU: "UY", PER: "PE", COL: "CO", BOL: "BO",
    ECU: "EC", CHI: "CL", ARG: "AR", BRA: "BR", GUA: "GT", ESA: "SV",
    CRC: "CR", TTO: "TT", DMA: "DM", ISV: "VI", PUR: "PR", VEN: "VE",
    RUS: "RU", PRY: "PY", RWA: "RW",
  };
  return map[noc] || noc?.slice(0, 2)?.toUpperCase();
};

const Map = ({ medalsData = [] }) => {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900 flex items-center">
            <Globe className="w-6 h-6 mr-2 text-blue-600" />
            Carte mondiale des médailles
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Visualisation interactive des performances olympiques – OpenStreetMap + D3.js
          </p>
        </div>

        {/* 🗺️ Carte Leaflet */}
        <div className="relative w-full h-[500px] rounded-2xl overflow-hidden shadow-sm">
          {/* <MapContainer
            center={[20, 0]}
            zoom={2}
            scrollWheelZoom={false}
            style={{ height: '500px', width: '100%' , zIndex: 1 }}
            zoomControl={false}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
          </MapContainer> */}

          {/* Couche D3 au-dessus de la carte */}
          <div className="absolute inset-0 pointer-events-none">
            <D3WorldMap data={medalsData} />
          </div>
        </div>
      </div>

      {/* 🏅 Liste des pays (issus du backend uniquement) */}
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
                  'https://cdn-icons-png.flaticon.com/512/3178/3178283.png';
              }}
            />
            <p className="font-bold text-gray-900 text-sm">{country.country}</p>
            <div className="mt-2 bg-blue-50 rounded-lg py-2">
              <p className="text-2xl font-bold text-blue-600">{country.total}</p>
              <p className="text-xs text-gray-500">médailles</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Map;
