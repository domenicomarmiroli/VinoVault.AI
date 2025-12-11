
import React from 'react';
import { createPortal } from 'react-dom';
import { CellarReport } from '../types';
import { ReportIcon, WineIcon, ShoppingCartIcon, ClockIcon } from './Icons';

interface CellarReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: CellarReport | null;
  loading: boolean;
}

const CellarReportModal: React.FC<CellarReportModalProps> = ({ isOpen, onClose, report, loading }) => {
  if (!isOpen) return null;

  const content = (
    <div className="fixed inset-0 bg-black/70 z-[200] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-wine-700 p-6 text-white shrink-0 flex justify-between items-start">
            <div>
                <h2 className="text-xl font-serif font-bold flex items-center gap-2">
                    <ReportIcon className="w-6 h-6" filled />
                    Analisi Sommelier
                </h2>
                <p className="text-wine-100 text-xs mt-1 opacity-80">
                    Report professionale su cantina e consumi.
                </p>
            </div>
            <button onClick={onClose} className="text-white/70 hover:text-white p-1">
                ✕
            </button>
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
                        <h3 className="font-serif font-bold text-gray-900 mb-3 text-lg border-l-4 border-wine-600 pl-3">
                            Valutazione Generale
                        </h3>
                        <p className="text-gray-600 text-sm leading-relaxed">
                            {report.overallAssessment}
                        </p>
                    </div>

                    {/* Palate Profile */}
                    <div className="bg-purple-50 p-5 rounded-xl border border-purple-100">
                        <h3 className="font-bold text-purple-900 mb-2 flex items-center gap-2 text-sm uppercase tracking-wide">
                            <WineIcon className="w-4 h-4" filled />
                            Il Tuo Profilo
                        </h3>
                        <p className="text-purple-800 text-sm leading-relaxed">
                            {report.palateProfile}
                        </p>
                    </div>

                    {/* Gap Analysis */}
                    <div className="bg-orange-50 p-5 rounded-xl border border-orange-100">
                        <h3 className="font-bold text-orange-900 mb-2 text-sm uppercase tracking-wide">
                            Cosa Manca (Gap Analysis)
                        </h3>
                        <p className="text-orange-800 text-sm leading-relaxed">
                            {report.gapAnalysis}
                        </p>
                    </div>

                    {/* Buy Recommendations */}
                    <div className="space-y-3">
                        <h3 className="font-serif font-bold text-gray-900 text-lg pl-2">
                            Consigli per gli Acquisti
                        </h3>
                        {report.buyRecommendations.map((rec, idx) => (
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
                        ))}
                    </div>

                    {/* Drink Now Strategy */}
                    <div className="bg-green-50 p-5 rounded-xl border border-green-100">
                        <h3 className="font-bold text-green-900 mb-2 flex items-center gap-2 text-sm uppercase tracking-wide">
                            <ClockIcon className="w-4 h-4" filled />
                            Strategia di Consumo
                        </h3>
                        <p className="text-green-800 text-sm leading-relaxed">
                            {report.drinkNowStrategy}
                        </p>
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
