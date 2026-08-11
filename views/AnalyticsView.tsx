
import React, { useState } from 'react';
import { Wine, HistoryEntry, WineType, CellarReport } from '../types';
import { ChartBarIcon, LogoutIcon, WineIcon, ShoppingCartIcon, ReportIcon, ShieldCheckIcon } from '../components/Icons';
import CellarReportModal from '../components/CellarReportModal';
import { generateCellarReport } from '../services/geminiService';
import { useLanguage } from '../contexts/LanguageContext';
import { useAnalysisStyle } from '../contexts/AnalysisStyleContext';

interface AnalyticsViewProps {
  inventory: Wine[];
  history: HistoryEntry[];
  onLogout: () => void;
  isPremium: boolean;
  onAiUsed: () => void;
}

const AnalyticsView: React.FC<AnalyticsViewProps> = ({ inventory, history, onLogout, isPremium, onAiUsed }) => {
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  const [cellarReport, setCellarReport] = useState<CellarReport | null>(null);
  const { t, language } = useLanguage();
  const { analysisStyle } = useAnalysisStyle();

  const safeInventory = Array.isArray(inventory) ? inventory : [];
  const safeHistory = Array.isArray(history) ? history : [];

  const totalPurchaseCost = safeInventory.reduce((sum, w) => sum + (Number(w.price || 0) * Number(w.quantity || 0)), 0);
  const totalMarketValue = safeInventory.reduce((sum, w) => sum + ((Number(w.marketPrice) || Number(w.price) || 0) * Number(w.quantity || 0)), 0);
  const roi = totalPurchaseCost > 0 ? ((totalMarketValue - totalPurchaseCost) / totalPurchaseCost) * 100 : 0;
  const totalBottles = safeInventory.reduce((sum, w) => sum + Number(w.quantity || 0), 0);
  const averagePurchasePrice = totalBottles > 0 ? totalPurchaseCost / totalBottles : 0;

  const typeCounts = safeInventory.reduce((acc, w) => { 
      if (w.type) acc[w.type] = (acc[w.type] || 0) + Number(w.quantity || 0); 
      return acc; 
  }, {} as Record<string, number>);
  
  const regionCounts = safeInventory.reduce((acc, w) => { 
      const region = w.region || 'Sconosciuta'; 
      acc[region] = (acc[region] || 0) + Number(w.quantity || 0); 
      return acc; 
  }, {} as Record<string, number>);
  
  const sortedRegions = (Object.entries(regionCounts) as [string, number][]).sort((a, b) => b[1] - a[1]).slice(0, 5);

  const totalConsumedCount = safeHistory.length;
  const totalConsumedValue = safeHistory.reduce((acc, h) => acc + (Number(h.price) || 0), 0);
  const averageConsumedPrice = totalConsumedCount > 0 ? totalConsumedValue / totalConsumedCount : 0;

  const handleOpenReport = async () => {
      if (!isPremium) { alert("Premium Only"); return; }
      if (safeInventory.length < 3) { alert("Aggiungi più vini per permettere un'analisi accurata."); return; }

      setIsReportOpen(true);
      if (cellarReport) return;

      setReportLoading(true);
      try {
          const report = await generateCellarReport(safeInventory, safeHistory, language, analysisStyle);
          setCellarReport(report);
          onAiUsed();
      } catch (err: any) {
          alert(`${t('error')}: ${err.message}`);
          setIsReportOpen(false);
      } finally {
          setReportLoading(false);
      }
  };

  const getTypeColor = (type: string) => {
     switch(type) {
         case WineType.RED: return 'bg-red-800';        
         case WineType.WHITE: return 'bg-yellow-300';   
         case WineType.SPARKLING: return 'bg-cyan-400'; 
         case WineType.ROSE: return 'bg-pink-400';      
         case WineType.DESSERT: return 'bg-orange-400'; 
         default: return 'bg-slate-300';                
     }
  };

  return (
    <div className="h-full flex flex-col bg-stone-50 overflow-hidden">
      <div className="bg-white border-b border-gray-200 p-6 shadow-sm z-10 flex justify-between items-start">
        <div>
            <h1 className="text-2xl font-serif font-bold text-gray-900 flex items-center gap-2"><ChartBarIcon className="w-8 h-8 text-wine-600" filled /> {t('nav_data')}</h1>
            <p className="text-sm text-gray-500 mt-1">{t('analytics_desc')}</p>
        </div>
        <button onClick={onLogout} className="text-gray-400 hover:text-wine-700 p-2"><LogoutIcon className="w-6 h-6" /></button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 pb-24 space-y-6">
        
        {isPremium ? (
            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-4 rounded-xl border border-purple-100 flex items-center justify-between shadow-sm">
                <div><h3 className="font-bold text-purple-900 flex items-center gap-2"><ReportIcon className="w-5 h-5" filled /> {t('ai_analysis')}</h3></div>
                <button onClick={handleOpenReport} className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-md hover:bg-purple-700 transition-colors">{t('generate_report')}</button>
            </div>
        ) : (
             <div className="bg-gray-100 p-4 rounded-xl border border-gray-200 flex items-center justify-between opacity-80 relative overflow-hidden">
                <div><h3 className="font-bold text-gray-500 flex items-center gap-2"><ShieldCheckIcon className="w-5 h-5" /> {t('ai_analysis')}</h3></div>
                <button disabled className="bg-gray-300 text-gray-500 px-4 py-2 rounded-lg text-sm font-bold cursor-not-allowed flex items-center gap-1">🔒 Locked</button>
             </div>
        )}

        <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
             <div className="absolute top-0 right-0 -mr-8 -mt-8 opacity-10"><WineIcon className="w-40 h-40" filled /></div>
             <h3 className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-4">{t('cellar_equity')}</h3>
             <div className="flex justify-between items-end mb-6">
                 <div><span className="text-4xl font-serif font-bold block">€{(totalMarketValue || 0).toFixed(0)}</span><span className="text-xs text-gray-400">{t('estimated_value')}</span></div>
                 <div className="text-right z-10"><span className={`text-xl font-bold block ${(roi || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>{roi > 0 ? '+' : ''}{(roi || 0).toFixed(1)}%</span><span className="text-xs text-gray-400">{t('roi')}</span></div>
             </div>
             <div className="grid grid-cols-2 gap-4 border-t border-gray-700 pt-4">
                 <div><span className="block text-xl font-bold text-gray-200">€{(averagePurchasePrice || 0).toFixed(2)}</span><span className="text-[10px] text-gray-400 uppercase font-bold">{t('avg_price')}</span></div>
                 <div className="text-right"><span className="block text-xl font-bold text-gray-200">{totalBottles}</span><span className="text-[10px] text-gray-400 uppercase font-bold">{t('bottles')}</span></div>
             </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200">
            <h3 className="font-serif font-bold text-lg text-gray-900 mb-4">{t('cellar_composition')}</h3>
            <div className="flex h-8 w-full rounded-lg overflow-hidden mb-4 shadow-inner bg-gray-100">
                {totalBottles > 0 && (Object.entries(typeCounts) as [string, number][]).map(([type, count]) => (
                    <div key={type} className={`${getTypeColor(type)} transition-all hover:opacity-90 relative group`} style={{ width: `${(count / totalBottles) * 100}%` }}></div>
                ))}
            </div>
            <div className="grid grid-cols-2 gap-2">
                {Object.entries(typeCounts).map(([type, count]) => (
                    <div key={type} className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2"><span className={`w-3 h-3 rounded-full shadow-sm ${getTypeColor(type)}`}></span><span className="text-gray-700 font-medium">{type}</span></div>
                        <span className="font-bold text-gray-900">{count}</span>
                    </div>
                ))}
            </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200">
             <h3 className="font-serif font-bold text-lg text-gray-900 mb-4">{t('top_regions')}</h3>
             <div className="space-y-4">
                 {sortedRegions.map(([region, count], idx) => (
                     <div key={region} className="relative">
                         <div className="flex justify-between text-sm mb-1 z-10 relative">
                             <span className="font-medium text-gray-700 flex items-center gap-2"><span className="w-5 h-5 rounded-full bg-stone-100 text-stone-500 text-[10px] flex items-center justify-center font-bold">{idx + 1}</span>{region}</span>
                             <span className="text-gray-900 font-bold">{count} <span className="text-gray-400 text-xs font-normal">bt</span></span>
                         </div>
                         <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden ml-7">
                            <div className="h-full bg-wine-600 rounded-full opacity-80" style={{ width: `${totalBottles > 0 ? (count / totalBottles) * 100 : 0}%` }}></div>
                         </div>
                     </div>
                 ))}
             </div>
        </div>

        <h3 className="font-serif font-bold text-lg text-gray-900 px-1 pt-2">{t('consumption_history')}</h3>
        <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 text-center flex flex-col items-center justify-center">
                <div className="bg-wine-50 p-2 rounded-full mb-2"><WineIcon className="w-5 h-5 text-wine-600" /></div>
                <span className="block text-2xl font-bold text-gray-900">{totalConsumedCount}</span>
                <span className="text-[10px] text-gray-500 uppercase font-bold">{t('total_drunk')}</span>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 text-center flex flex-col items-center justify-center">
                 <div className="bg-green-50 p-2 rounded-full mb-2"><ShoppingCartIcon className="w-5 h-5 text-green-600" /></div>
                 <span className="block text-2xl font-bold text-gray-900">€{(totalConsumedValue || 0).toFixed(0)}</span>
                <span className="text-[10px] text-gray-500 uppercase font-bold">{t('value_drunk')}</span>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 text-center col-span-2 flex items-center justify-between px-6">
                <div className="text-left"><span className="text-xs text-gray-500 uppercase font-bold block">{t('avg_drunk_price')}</span></div>
                <span className="block text-3xl font-bold text-wine-800">€{(averageConsumedPrice || 0).toFixed(2)}</span>
            </div>
        </div>
      </div>
      <CellarReportModal isOpen={isReportOpen} onClose={() => setIsReportOpen(false)} report={cellarReport} loading={reportLoading} />
    </div>
  );
};

export default AnalyticsView;
