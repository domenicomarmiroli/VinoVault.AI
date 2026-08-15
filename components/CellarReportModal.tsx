
import React, { useMemo } from 'react';
import { createPortal } from 'react-dom';
import { CellarReport, Wine, HistoryEntry } from '../types';
import { ReportIcon, WineIcon, ShoppingCartIcon, ClockIcon, UserIcon, StarIcon } from './Icons';

interface CellarReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: CellarReport | null;
  loading: boolean;
  inventory: Wine[];
  history: HistoryEntry[];
}

const getScoreColor = (score: number) => {
  if (score >= 85) return { ring: 'text-emerald-500', bg: 'bg-emerald-50', text: 'text-emerald-700' };
  if (score >= 65) return { ring: 'text-wine-500', bg: 'bg-wine-50', text: 'text-wine-700' };
  if (score >= 40) return { ring: 'text-amber-500', bg: 'bg-amber-50', text: 'text-amber-700' };
  return { ring: 'text-red-400', bg: 'bg-red-50', text: 'text-red-700' };
};

const ScoreGauge: React.FC<{ score: number }> = ({ score }) => {
  const s = Math.max(0, Math.min(100, score || 0));
  const colors = getScoreColor(s);
  const circumference = 2 * Math.PI * 40;
  const offset = circumference - (s / 100) * circumference;
  return (
    <div className="relative w-28 h-28 shrink-0">
      <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
        <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="9" className="text-white/20" />
        <circle
          cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="9" strokeLinecap="round"
          className={colors.ring}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.8s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-black text-white leading-none">{Math.round(s)}</span>
        <span className="text-[9px] font-bold uppercase tracking-widest text-white/70 mt-1">Salute</span>
      </div>
    </div>
  );
};

const parseDrinkWindow = (drinkWindow?: string) => {
  if (!drinkWindow) return null;
  const parts = drinkWindow.split('-').map(y => parseInt(y.trim()));
  if (parts.length !== 2 || isNaN(parts[0]) || isNaN(parts[1])) return null;
  return { start: parts[0], end: parts[1] };
};

const CellarReportModal: React.FC<CellarReportModalProps> = ({ isOpen, onClose, report, loading, inventory, history }) => {
  const avgRating = useMemo(() => {
    const rated = history.filter(h => (h.rating || 0) > 0);
    if (rated.length === 0) return 0;
    return rated.reduce((sum, h) => sum + (h.rating || 0), 0) / rated.length;
  }, [history]);

  const topRated = useMemo(() => {
    return [...history].filter(h => (h.rating || 0) >= 4).sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 3);
  }, [history]);

  const drinkSoon = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return inventory
      .map(w => ({ wine: w, window: parseDrinkWindow(w.drinkWindow) }))
      .filter(({ window }) => window && currentYear >= window.end - 1)
      .slice(0, 5)
      .map(({ wine }) => wine);
  }, [inventory]);

  if (!isOpen) return null;

  const content = (
    <div className="fixed inset-0 bg-black/70 z-[200] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="bg-gradient-to-br from-wine-800 to-wine-950 p-6 text-white shrink-0">
            <div className="flex justify-between items-start mb-2">
                <div>
                    <h2 className="text-xl font-serif font-bold flex items-center gap-2">
                        <ReportIcon className="w-6 h-6" filled />
                        Analisi Sommelier
                    </h2>
                    <p className="text-wine-100 text-xs mt-1 opacity-80">
                        Report su cantina, consumi e gusti personali.
                    </p>
                </div>
                <button onClick={onClose} className="text-white/70 hover:text-white p-1">
                    ✕
                </button>
            </div>
            {!loading && report && (
                <div className="flex items-center gap-4 mt-4">
                    <ScoreGauge score={report.score} />
                    <div className="flex-1 grid grid-cols-3 gap-2">
                        <div className="bg-white/10 rounded-xl p-2 text-center">
                            <span className="block text-lg font-black">{inventory.reduce((s, w) => s + (w.quantity || 0), 0)}</span>
                            <span className="text-[9px] uppercase font-bold text-wine-100 tracking-wide">Bottiglie</span>
                        </div>
                        <div className="bg-white/10 rounded-xl p-2 text-center">
                            <span className="block text-lg font-black">{history.length}</span>
                            <span className="text-[9px] uppercase font-bold text-wine-100 tracking-wide">Bevuti</span>
                        </div>
                        <div className="bg-white/10 rounded-xl p-2 text-center">
                            <span className="block text-lg font-black">{avgRating > 0 ? avgRating.toFixed(1) : '-'}</span>
                            <span className="text-[9px] uppercase font-bold text-wine-100 tracking-wide">Voto Medio</span>
                        </div>
                    </div>
                </div>
            )}
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-0 bg-stone-50 flex-1">
            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 space-y-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-wine-700"></div>
                    <p className="text-wine-700 text-sm font-medium animate-pulse">Il Sommelier sta analizzando la tua cantina...</p>
                </div>
            ) : report ? (
                <div className="p-6 space-y-6">

                    {/* Overall Assessment */}
                    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                        <h3 className="font-serif font-bold text-gray-900 mb-2 text-lg border-l-4 border-wine-600 pl-3">
                            Valutazione Generale
                        </h3>
                        <p className="text-gray-600 text-sm leading-relaxed">
                            {report.overallAssessment || "In valutazione..."}
                        </p>
                    </div>

                    {/* Palate Profile */}
                    <div className="bg-purple-50 p-5 rounded-xl border border-purple-100">
                        <h3 className="font-bold text-purple-900 mb-3 flex items-center gap-2 text-sm uppercase tracking-wide">
                            <UserIcon className="w-4 h-4" filled />
                            Il Tuo Profilo
                        </h3>
                        {(report.palateTags?.length || 0) > 0 && (
                            <div className="flex flex-wrap gap-1.5 mb-3">
                                {report.palateTags.map((tag, i) => (
                                    <span key={i} className="text-xs font-bold text-purple-800 bg-white px-2.5 py-1 rounded-full border border-purple-200 shadow-sm">{tag}</span>
                                ))}
                            </div>
                        )}
                        <p className="text-purple-800 text-sm leading-relaxed">
                            {report.palateProfile || "Analisi in corso..."}
                        </p>
                    </div>

                    {/* Top Rated Wines (computed from real history) */}
                    {topRated.length > 0 && (
                        <div className="space-y-2">
                            <h3 className="font-serif font-bold text-gray-900 text-lg pl-2">
                                I Tuoi Preferiti
                            </h3>
                            <div className="space-y-2">
                                {topRated.map((h, idx) => (
                                    <div key={idx} className="bg-white p-3 rounded-xl shadow-sm border border-gray-200 flex items-center justify-between gap-3">
                                        <div className="min-w-0">
                                            <p className="font-bold text-gray-900 text-sm truncate">{h.name}</p>
                                            <p className="text-xs text-gray-500 truncate">{h.producer} • {h.year}</p>
                                        </div>
                                        <div className="flex items-center gap-0.5 shrink-0">
                                            {[1, 2, 3, 4, 5].map(i => (
                                                <StarIcon key={i} className={`w-3.5 h-3.5 ${i <= (h.rating || 0) ? 'text-amber-400' : 'text-gray-200'}`} filled={i <= (h.rating || 0)} />
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Gap Analysis */}
                    <div className="bg-orange-50 p-5 rounded-xl border border-orange-100">
                        <h3 className="font-bold text-orange-900 mb-3 text-sm uppercase tracking-wide">
                            Cosa Manca
                        </h3>
                        {(report.gapTags?.length || 0) > 0 && (
                            <div className="flex flex-wrap gap-1.5 mb-3">
                                {report.gapTags.map((tag, i) => (
                                    <span key={i} className="text-xs font-bold text-orange-800 bg-white px-2.5 py-1 rounded-full border border-orange-200 shadow-sm">{tag}</span>
                                ))}
                            </div>
                        )}
                        <p className="text-orange-800 text-sm leading-relaxed">
                            {report.gapAnalysis || "In analisi..."}
                        </p>
                    </div>

                    {/* Buy Recommendations */}
                    <div className="space-y-3">
                        <h3 className="font-serif font-bold text-gray-900 text-lg pl-2">
                            Consigli per gli Acquisti
                        </h3>
                        {report.buyRecommendations?.map((rec, idx) => (
                            <div key={idx} className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex gap-3">
                                <div className="bg-wine-50 w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-wine-700">
                                    <ShoppingCartIcon className="w-5 h-5" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-900 text-sm">{rec.wineName}</h4>
                                    <span className="text-[10px] uppercase font-bold text-gray-400 mb-1 block">{rec.type}</span>
                                    <p className="text-gray-600 text-xs italic">
                                        "{rec.reason}"
                                    </p>
                                </div>
                            </div>
                        )) || <p className="text-center text-xs text-gray-400 italic">Nessun consiglio specifico.</p>}
                    </div>

                    {/* Drink Now Strategy */}
                    <div className="bg-green-50 p-5 rounded-xl border border-green-100">
                        <h3 className="font-bold text-green-900 mb-2 flex items-center gap-2 text-sm uppercase tracking-wide">
                            <ClockIcon className="w-4 h-4" filled />
                            Strategia di Consumo
                        </h3>
                        <p className="text-green-800 text-sm leading-relaxed mb-3">
                            {report.drinkNowStrategy || "Goditi un calice della tua collezione."}
                        </p>
                        {drinkSoon.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                                {drinkSoon.map((w, i) => (
                                    <span key={i} className="text-xs font-bold text-green-800 bg-white px-2.5 py-1 rounded-full border border-green-200 shadow-sm">{w.name}</span>
                                ))}
                            </div>
                        )}
                    </div>

                </div>
            ) : (
                <div className="p-8 text-center text-gray-500">
                    Nessun report disponibile.
                </div>
            )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-white border-t border-gray-200 shrink-0">
            <button
                onClick={onClose}
                className="w-full py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors"
            >
                Chiudi Report
            </button>
        </div>

      </div>
    </div>
  );

  return createPortal(content, document.body);
};

export default CellarReportModal;
