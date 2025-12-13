import React from 'react';
import { Wine, HistoryEntry, WineType } from '../types';
import { ChartBarIcon, LogoutIcon, WineIcon, ShoppingCartIcon } from '../components/Icons';

interface AnalyticsViewProps {
  inventory: Wine[];
  history: HistoryEntry[];
  onLogout: () => void;
}

const AnalyticsView: React.FC<AnalyticsViewProps> = ({ inventory, history, onLogout }) => {
  
  // 1. Calcoli Finanziari Cantina
  const totalPurchaseCost = inventory.reduce((sum, w) => sum + (w.price * w.quantity), 0);
  const totalMarketValue = inventory.reduce((sum, w) => sum + ((w.marketPrice || w.price) * w.quantity), 0);
  const roi = totalPurchaseCost > 0 ? ((totalMarketValue - totalPurchaseCost) / totalPurchaseCost) * 100 : 0;
  
  const totalBottles = inventory.reduce((sum, w) => sum + w.quantity, 0);
  // Calcolo Prezzo Medio Acquisto (Cantina)
  const averagePurchasePrice = totalBottles > 0 ? totalPurchaseCost / totalBottles : 0;

  // 2. Distribuzione per Tipologia
  const typeCounts = inventory.reduce((acc, w) => {
      acc[w.type] = (acc[w.type] || 0) + w.quantity;
      return acc;
  }, {} as Record<string, number>);

  // 3. Distribuzione per Regione (Top 5)
  const regionCounts = inventory.reduce((acc, w) => {
      const region = w.region || 'Sconosciuta';
      acc[region] = (acc[region] || 0) + w.quantity;
      return acc;
  }, {} as Record<string, number>);
  const sortedRegions = (Object.entries(regionCounts) as [string, number][])
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

  // 4. Statistiche Consumo (Storico)
  const totalConsumedCount = history.length;
  // Calcolo Valore Totale Bevuto
  const totalConsumedValue = history.reduce((acc, h) => acc + (h.price || 0), 0);
  // Calcolo Prezzo Medio Bevuto
  const averageConsumedPrice = totalConsumedCount > 0 ? totalConsumedValue / totalConsumedCount : 0;

  // Nuova palette colori ad alto contrasto
  const getTypeColor = (type: string) => {
     switch(type) {
         case WineType.RED: return 'bg-red-800';        // Rosso Scuro
         case WineType.WHITE: return 'bg-yellow-300';   // Giallo Paglierino (Acceso)
         case WineType.SPARKLING: return 'bg-cyan-400'; // Azzurro/Ghiaccio (Ben distinto dal giallo)
         case WineType.ROSE: return 'bg-pink-400';      // Rosa
         case WineType.DESSERT: return 'bg-orange-400'; // Arancio
         default: return 'bg-slate-300';                // Grigio
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
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
             {/* Background Decoration */}
             <div className="absolute top-0 right-0 -mr-8 -mt-8 opacity-10">
                 <WineIcon className="w-40 h-40" filled />
             </div>

             <h3 className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-4">Patrimonio Cantina</h3>
             
             <div className="flex justify-between items-end mb-6">
                 <div>
                     <span className="text-4xl font-serif font-bold block">€{totalMarketValue.toFixed(0)}</span>
                     <span className="text-xs text-gray-400">Valore Stimato</span>
                 </div>
                 <div className="text-right z-10">
                      <span className={`text-xl font-bold block ${roi >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {roi > 0 ? '+' : ''}{roi.toFixed(1)}%
                      </span>
                      <span className="text-xs text-gray-400">ROI (Spesa: €{totalPurchaseCost.toFixed(0)})</span>
                 </div>
             </div>

             {/* Inventory Mini Stats Grid */}
             <div className="grid grid-cols-2 gap-4 border-t border-gray-700 pt-4">
                 <div>
                     <span className="block text-xl font-bold text-gray-200">
                         €{averagePurchasePrice.toFixed(2)}
                     </span>
                     <span className="text-[10px] text-gray-400 uppercase font-bold">Prezzo Medio Acquisto</span>
                 </div>
                 <div className="text-right">
                     <span className="block text-xl font-bold text-gray-200">
                         {totalBottles}
                     </span>
                     <span className="text-[10px] text-gray-400 uppercase font-bold">Bottiglie in Cantina</span>
                 </div>
             </div>
        </div>

        {/* Composition Chart */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200">
            <h3 className="font-serif font-bold text-lg text-gray-900 mb-4">Composizione Cantina</h3>
            
            {/* Simple Bar Chart Visual */}
            <div className="flex h-8 w-full rounded-lg overflow-hidden mb-4 shadow-inner bg-gray-100">
                {(Object.entries(typeCounts) as [string, number][]).map(([type, count]) => (
                    <div 
                        key={type} 
                        className={`${getTypeColor(type)} transition-all hover:opacity-90 relative group`}
                        style={{ width: `${(count / totalBottles) * 100}%` }}
                    >
                        {/* Tooltip on hover */}
                         <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-black text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                            {type}: {count}
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-2 gap-2">
                {Object.entries(typeCounts).map(([type, count]) => (
                    <div key={type} className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2">
                            <span className={`w-3 h-3 rounded-full shadow-sm ${getTypeColor(type)}`}></span>
                            <span className="text-gray-700 font-medium">{type}</span>
                        </div>
                        <span className="font-bold text-gray-900">{count}</span>
                    </div>
                ))}
            </div>
        </div>

        {/* Geography */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200">
             <h3 className="font-serif font-bold text-lg text-gray-900 mb-4">Regioni Top</h3>
             <div className="space-y-4">
                 {sortedRegions.map(([region, count], idx) => (
                     <div key={region} className="relative">
                         <div className="flex justify-between text-sm mb-1 z-10 relative">
                             <span className="font-medium text-gray-700 flex items-center gap-2">
                                 <span className="w-5 h-5 rounded-full bg-stone-100 text-stone-500 text-[10px] flex items-center justify-center font-bold">
                                     {idx + 1}
                                 </span>
                                 {region}
                             </span>
                             <span className="text-gray-900 font-bold">{count} <span className="text-gray-400 text-xs font-normal">bt</span></span>
                         </div>
                         <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden ml-7">
                             <div 
                                className="h-full bg-wine-600 rounded-full opacity-80" 
                                style={{ width: `${(count / totalBottles) * 100}%` }}
                             ></div>
                         </div>
                     </div>
                 ))}
             </div>
        </div>

        {/* Consumption Quick Stats */}
        <h3 className="font-serif font-bold text-lg text-gray-900 px-1 pt-2">Storico Consumi</h3>
        <div className="grid grid-cols-2 gap-4">
            {/* Bottiglie Bevute */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 text-center flex flex-col items-center justify-center">
                <div className="bg-wine-50 p-2 rounded-full mb-2">
                    <WineIcon className="w-5 h-5 text-wine-600" />
                </div>
                <span className="block text-2xl font-bold text-gray-900">{totalConsumedCount}</span>
                <span className="text-[10px] text-gray-500 uppercase font-bold">Bevute totali</span>
            </div>

            {/* Valore Totale Bevuto */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 text-center flex flex-col items-center justify-center">
                 <div className="bg-green-50 p-2 rounded-full mb-2">
                    <ShoppingCartIcon className="w-5 h-5 text-green-600" />
                 </div>
                 <span className="block text-2xl font-bold text-gray-900">
                   €{totalConsumedValue.toFixed(0)}
                </span>
                <span className="text-[10px] text-gray-500 uppercase font-bold">Valore Bevuto</span>
            </div>

            {/* Prezzo Medio */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 text-center col-span-2 flex items-center justify-between px-6">
                <div className="text-left">
                    <span className="text-xs text-gray-500 uppercase font-bold block">Prezzo Medio (Bevuto)</span>
                    <span className="text-gray-400 text-[10px]">Media costo bottiglia stappata</span>
                </div>
                <span className="block text-3xl font-bold text-wine-800">
                   €{averageConsumedPrice.toFixed(2)}
                </span>
            </div>
        </div>

      </div>
    </div>
  );
};

export default AnalyticsView;