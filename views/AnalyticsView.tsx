
import React from 'react';
import { Wine, HistoryEntry, WineType } from '../types';
import { ChartBarIcon, LogoutIcon } from '../components/Icons';

interface AnalyticsViewProps {
  inventory: Wine[];
  history: HistoryEntry[];
  onLogout: () => void;
}

const AnalyticsView: React.FC<AnalyticsViewProps> = ({ inventory, history, onLogout }) => {
  
  // 1. Calcoli Finanziari
  const totalPurchaseCost = inventory.reduce((sum, w) => sum + (w.price * w.quantity), 0);
  const totalMarketValue = inventory.reduce((sum, w) => sum + ((w.marketPrice || w.price) * w.quantity), 0);
  const roi = totalPurchaseCost > 0 ? ((totalMarketValue - totalPurchaseCost) / totalPurchaseCost) * 100 : 0;

  // 2. Distribuzione per Tipologia
  const typeCounts = inventory.reduce((acc, w) => {
      acc[w.type] = (acc[w.type] || 0) + w.quantity;
      return acc;
  }, {} as Record<string, number>);
  const totalBottles = inventory.reduce((sum, w) => sum + w.quantity, 0);

  // 3. Distribuzione per Regione (Top 5)
  const regionCounts = inventory.reduce((acc, w) => {
      const region = w.region || 'Sconosciuta';
      acc[region] = (acc[region] || 0) + w.quantity;
      return acc;
  }, {} as Record<string, number>);
  const sortedRegions = (Object.entries(regionCounts) as [string, number][])
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

  // 4. Statistiche Consumo
  const totalConsumed = history.length;
  const favoriteType = history.length > 0 ? 
    (Object.entries(history.reduce((acc, h) => {
       // Assuming we could link history back to type, for now approximation or generic
       return acc; 
    }, {} as Record<string, number>)) as [string, number][]).sort((a,b) => b[1] - a[1])[0]?.[0] || 'N/D' 
    : 'N/D';

  const getTypeColor = (type: string) => {
     switch(type) {
         case WineType.RED: return 'bg-red-500';
         case WineType.WHITE: return 'bg-yellow-400';
         case WineType.SPARKLING: return 'bg-amber-300';
         case WineType.ROSE: return 'bg-pink-400';
         default: return 'bg-gray-400';
     }
  };

  return (
    <div className="h-full flex flex-col bg-stone-50 overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-6 shadow-sm z-10 flex justify-between items-start">
        <div>
            <h1 className="text-2xl font-serif font-bold text-gray-900 flex items-center gap-2">
                <ChartBarIcon className="w-8 h-8 text-wine-600" filled />
                Analytics
            </h1>
            <p className="text-sm text-gray-500 mt-1">
                Il valore della tua cantina e le tue abitudini.
            </p>
        </div>
        <button onClick={onLogout} className="text-gray-400 hover:text-wine-700 p-2">
            <LogoutIcon className="w-6 h-6" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 pb-24 space-y-6">
        
        {/* Investment Card */}
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 text-white shadow-xl">
             <h3 className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-4">Valore Cantina</h3>
             <div className="flex justify-between items-end mb-4">
                 <div>
                     <span className="text-4xl font-serif font-bold block">€{totalMarketValue.toFixed(0)}</span>
                     <span className="text-xs text-gray-400">Valore di Mercato (Stima)</span>
                 </div>
                 <div className="text-right">
                      <span className={`text-xl font-bold block ${roi >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {roi > 0 ? '+' : ''}{roi.toFixed(1)}%
                      </span>
                      <span className="text-xs text-gray-400">ROI su spesa (€{totalPurchaseCost.toFixed(0)})</span>
                 </div>
             </div>
             <div className="h-1 w-full bg-gray-700 rounded-full overflow-hidden">
                 <div 
                    className={`h-full ${roi >= 0 ? 'bg-green-500' : 'bg-red-500'}`} 
                    style={{ width: `${Math.min(Math.abs(roi), 100)}%` }}
                 ></div>
             </div>
        </div>

        {/* Composition Chart */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200">
            <h3 className="font-serif font-bold text-lg text-gray-900 mb-4">Composizione Cantina</h3>
            
            {/* Simple Bar Chart Visual */}
            <div className="flex h-6 w-full rounded-full overflow-hidden mb-4">
                {(Object.entries(typeCounts) as [string, number][]).map(([type, count]) => (
                    <div 
                        key={type} 
                        className={getTypeColor(type)}
                        style={{ width: `${(count / totalBottles) * 100}%` }}
                        title={`${type}: ${count}`}
                    ></div>
                ))}
            </div>

            <div className="grid grid-cols-2 gap-2">
                {Object.entries(typeCounts).map(([type, count]) => (
                    <div key={type} className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2">
                            <span className={`w-3 h-3 rounded-full ${getTypeColor(type)}`}></span>
                            <span className="text-gray-700">{type}</span>
                        </div>
                        <span className="font-bold text-gray-900">{count}</span>
                    </div>
                ))}
            </div>
        </div>

        {/* Geography */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200">
             <h3 className="font-serif font-bold text-lg text-gray-900 mb-4">Regioni Top</h3>
             <div className="space-y-3">
                 {sortedRegions.map(([region, count], idx) => (
                     <div key={region} className="relative">
                         <div className="flex justify-between text-sm mb-1 z-10 relative">
                             <span className="font-medium text-gray-700">{idx + 1}. {region}</span>
                             <span className="text-gray-500">{count} bt</span>
                         </div>
                         <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                             <div 
                                className="h-full bg-wine-400 rounded-full" 
                                style={{ width: `${(count / totalBottles) * 100}%` }}
                             ></div>
                         </div>
                     </div>
                 ))}
             </div>
        </div>

        {/* Consumption Quick Stats */}
        <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 text-center">
                <span className="block text-3xl font-bold text-wine-700 mb-1">{totalConsumed}</span>
                <span className="text-xs text-gray-500 uppercase font-bold">Bevute totali</span>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 text-center">
                <span className="block text-3xl font-bold text-wine-700 mb-1">
                   {history.length > 0 ? (history.reduce((a,b) => a + b.price, 0) / history.length).toFixed(0) : 0}€
                </span>
                <span className="text-xs text-gray-500 uppercase font-bold">Prezzo medio bevuto</span>
            </div>
        </div>

      </div>
    </div>
  );
};

export default AnalyticsView;
