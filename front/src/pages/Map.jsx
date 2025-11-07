import React from 'react';
import {Globe} from 'lucide-react';
import D3WorldMap from '../charts/D3WorldMap';

const Map = ({ countryLocations = [] }) => {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900 flex items-center">
            <Globe className="w-6 h-6 mr-2 text-blue-600" />
            Carte mondiale des médailles
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Distribution géographique des performances olympiques - D3.js
          </p>
        </div>

        <D3WorldMap data={countryLocations} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {countryLocations.map((country, i) => (
          <div
            key={i}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 text-center hover:shadow-md transition-all cursor-pointer"
          >
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
  );
};

export default Map;