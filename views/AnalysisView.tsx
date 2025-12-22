
import React, { useState, useEffect } from 'react';
import { Wine, HistoryEntry, CellarReport } from '../types';
import { UserIcon, ChartBarIcon, ShoppingCartIcon, WineIcon, LogoutIcon, ReportIcon } from '../components/Icons';
import { generateCellarReport } from '../services/geminiService';
import { useLanguage } from '../contexts/LanguageContext';
import LoadingScreen from '../components/LoadingScreen';

interface AnalysisViewProps {
  inventory: Wine[];
  history: HistoryEntry[];
  onLogout: () => void;
  onAiUsed: () => void;
  isPremium: boolean;
}

const AnalysisView: React.FC<AnalysisViewProps> = ({ inventory, history, onLogout, onAiUsed, isPremium }) => {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<CellarReport | null>(null);
  const { t, language } = useLanguage();

  const handleGenerateAnalysis = async () => {
    if (!isPremium) {
      alert("L'analisi avanzata è una funzione Premium.");
      return;
    }
    if (inventory.length < 3) {
      alert("Aggiungi almeno 3 vini in cantina per permettere all'IA di analizzare il tuo profilo.");
      return;
    }

    setLoading(true);
    try {
      const data = await generateCellarReport(inventory, history, language);
      setReport(data);
      onAiUsed();
    } catch (e: any) {
      alert(t('error') + ": " + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-slate-50 overflow-hidden relative">
      {loading && <LoadingScreen message="Analisi Sommelier in corso..." subMessage="L'IA sta studiando le tue abitudini e la tua cantina..." />}

      <div className="bg-white border-b border-gray-200 p-6 shadow-sm z-10 flex justify-between items-start">
        <div>
            <h1 className="text-2xl font-serif font-bold text-gray-900 flex items-center gap-2">
                <UserIcon className="w-8 h-8 text-purple-600" filled />
                Analisi Sommelier
            </h1>
            <p className="text-sm text-gray-500 mt-1">Il tuo profilo sensoriale e strategia di cantina.</p>
        </div>
        <button onClick={onLogout} className="text-gray-400 hover:text-wine-700 p-2"><LogoutIcon className="w-6 h-6" /></button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 pb-24 space-y-6">
        {!report ? (
          <div className="bg-white rounded-2xl p-8 text-center border border-gray-200 shadow-sm space-y-6">
            <div className="bg-purple-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto">
               <ReportIcon className="w-10 h-10 text-purple-600" filled />
            </div>
            <div>
              <h3 className="text-xl font-serif font-bold text-gray-900">Il Tuo DNA del Gusto</h3>
              <p className="text-gray-500 text-sm mt-2 max-w-xs mx-auto">
                Attiva l'analisi per scoprire che tipo di degustatore sei e quali sono i punti di forza della tua collezione.
              </p>
            </div>
            <button 
              onClick={handleGenerateAnalysis}
              className="w-full py-4 bg-purple-600 text-white font-bold rounded-xl shadow-lg hover:bg-purple-700 transition-all flex items-center justify-center gap-2"
            >
               Genera Analisi IA
            </button>
            {!isPremium && <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">Richiede Account Premium</p>}
          </div>
        ) : (
          <div className="space-y-6 animate-in slide-in-from-bottom duration-500">
            {/* Profilo Palato */}
            <div className="bg-gradient-to-br from-purple-600 to-indigo-700 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
                <UserIcon className="absolute -right-6 -bottom-6 w-32 h-32 opacity-10" filled />
                <h3 className="text-xs font-bold uppercase tracking-widest opacity-80 mb-2">Il Tuo Profilo Palato</h3>
                <p className="text-lg font-serif italic leading-relaxed">
                  "{report.palateProfile}"
                </p>
            </div>

            {/* Assessment & Gap */}
            <div className="grid grid-cols-1 gap-4">
               <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
                  <h4 className="text-xs font-bold text-gray-400 uppercase mb-3 flex items-center gap-2">
                    <ChartBarIcon className="w-4 h-4 text-purple-500" />
                    Valutazione Cantina
                  </h4>
                  <p className="text-sm text-gray-700 leading-relaxed">{report.overallAssessment}</p>
               </div>
               <div className="bg-amber-50 p-5 rounded-2xl border border-amber-100">
                  <h4 className="text-xs font-bold text-amber-600 uppercase mb-3">Gap Analysis (Cosa manca)</h4>
                  <p className="text-sm text-amber-900 leading-relaxed">{report.gapAnalysis}</p>
               </div>
            </div>

            {/* Consigli Acquisto */}
            <div className="space-y-3">
               <h3 className="text-lg font-serif font-bold text-gray-900 px-1">Strategia d'Acquisto</h3>
               <div className="grid gap-3">
                  {report.buyRecommendations.map((rec, i) => (
                    <div key={i} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex gap-4 items-start">
                        <div className="bg-purple-100 p-2 rounded-lg text-purple-600">
                           <ShoppingCartIcon className="w-5 h-5" />
                        </div>
                        <div>
                           <h5 className="font-bold text-gray-900 text-sm">{rec.wineName}</h5>
                           <span className="text-[10px] font-bold text-purple-500 uppercase">{rec.type}</span>
                           <p className="text-xs text-gray-500 mt-1 italic">"{rec.reason}"</p>
                        </div>
                    </div>
                  ))}
               </div>
            </div>

            {/* Strategia Bevuta */}
            <div className="bg-emerald-50 p-5 rounded-2xl border border-emerald-100">
                <h4 className="text-xs font-bold text-emerald-600 uppercase mb-2 flex items-center gap-2">
                   <WineIcon className="w-4 h-4" filled />
                   Consiglio del Giorno
                </h4>
                <p className="text-sm text-emerald-900 leading-relaxed font-medium">{report.drinkNowStrategy}</p>
            </div>

            <button 
              onClick={() => setReport(null)}
              className="w-full py-3 text-gray-400 text-sm font-bold hover:text-purple-600 transition-colors"
            >
              Aggiorna Analisi
            </button>
          </div>
        )}

        {/* ROI Mini Card (Always Visible) */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
            <h3 className="text-xs font-bold text-gray-400 uppercase mb-4 tracking-widest">Equity & ROI</h3>
            <div className="flex justify-between items-end">
                <div>
                  <p className="text-3xl font-serif font-bold text-gray-900">€{inventory.reduce((s,w) => s + (w.marketPrice || w.price)*w.quantity, 0).toFixed(0)}</p>
                  <p className="text-[10px] text-gray-400 font-bold uppercase">Valore Stimato Patrimonio</p>
                </div>
                <div className="text-right">
                   <p className="text-lg font-bold text-green-600">+12.4%</p>
                   <p className="text-[10px] text-gray-400 font-bold uppercase">Performance</p>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default AnalysisView;
