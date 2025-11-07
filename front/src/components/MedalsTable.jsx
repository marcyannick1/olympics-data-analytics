import React from 'react';
import { ChevronRight } from 'lucide-react';

const MedalsTable = ({ data, setSelectedCountry, title = 'Classement des médailles', subtitle = 'Tokyo 2020 - Résultats officiels', badge = 'Top 10' }) => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{title}</h2>
            <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
          </div>
          <div className="bg-blue-50 px-4 py-2 rounded-lg">
            <span className="text-sm font-medium text-blue-700">{badge}</span>
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
            {data.map((item, index) => (
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
  );
};

export default MedalsTable;