
import React from 'react';
import { createPortal } from 'react-dom';
import { Logo } from './Logo';
import { WineIcon, ThermometerIcon, ClockIcon } from './Icons';
import { useLanguage } from '../contexts/LanguageContext';

interface SharedPairingModalProps {
  data: {
    menu: string;
    suggestions: Array<{
      course: string;
      dish: string;
      wine: string;
      reason: string;
      temp: string;
      advice: string;
    }>;
  } | null;
  onClose: () => void;
}

const SharedPairingModal: React.FC<SharedPairingModalProps> = ({ data, onClose }) => {
  const { t } = useLanguage();
  if (!data) return null;

  const content = (
    <div className="fixed inset-0 bg-black/90 z-[400] flex items-center justify-center p-0 sm:p-4 backdrop-blur-md animate-in fade-in duration-300 overflow-hidden">
      {/* Container principale con limiti di larghezza rigorosi */}
      <div className="bg-white w-full max-w-full h-[100dvh] sm:h-auto sm:max-h-[90vh] sm:max-w-xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
        
        {/* Header - Altezza fissa ridotta su mobile */}
        <div className="bg-wine-800 p-5 sm:p-8 text-white relative overflow-hidden shrink-0">
             <div className="absolute top-0 right-0 -mr-12 -mt-12 opacity-10 pointer-events-none">
                <WineIcon className="w-40 h-40 sm:w-64 sm:h-64" filled />
             </div>
             <div className="relative z-10 flex justify-between items-center">
                 <div className="min-w-0">
                    <Logo light className="w-8 h-8 sm:w-12 sm:h-12 mb-2 sm:mb-4" />
                    <h2 className="text-xl sm:text-3xl font-serif font-bold truncate">{t('shared_menu_title')}</h2>
                 </div>
                 <button 
                    onClick={onClose} 
                    className="bg-white/20 hover:bg-white/30 p-2 rounded-full transition-colors shrink-0 ml-4"
                    aria-label="Chiudi"
                 >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                 </button>
             </div>
        </div>

        {/* Contenuto Scrollabile - Impedisce lo scroll orizzontale dei figli */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-10 space-y-6 sm:space-y-10 bg-stone-50 overflow-x-hidden w-full box-border">
            
            {/* Il Menu - Gestione testo lungo */}
            <div className="text-center space-y-3 max-w-full overflow-hidden">
                <div className="inline-block h-px w-10 bg-wine-300 mb-1"></div>
                <p className="text-base sm:text-2xl text-gray-800 font-serif leading-relaxed italic whitespace-pre-line break-words px-2">
                    {data.menu}
                </p>
                <div className="inline-block h-px w-10 bg-wine-300 mt-1"></div>
            </div>

            {/* Gli Abbinamenti - Layout a colonna singola forzata su mobile */}
            <div className="space-y-4 max-w-full overflow-hidden">
                <h3 className="text-center text-[9px] sm:text-xs font-bold uppercase tracking-[0.2em] text-wine-600 mb-4 sm:mb-8">{t('shared_pairings_title')}</h3>
                
                <div className="grid gap-4 sm:gap-6 w-full">
                    {data.suggestions.map((s, idx) => (
                        <div key={idx} className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100 flex flex-col gap-3 sm:gap-6 items-start transition-all hover:shadow-md w-full box-border min-w-0">
                            <div className="flex w-full gap-3 sm:gap-4 items-center sm:items-start min-w-0">
                                <div className="bg-wine-50 p-2 sm:p-4 rounded-xl shrink-0 flex items-center justify-center">
                                    <WineIcon className="w-6 h-6 sm:w-10 sm:h-10 text-wine-700" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-2 mb-1">
                                        <span className="text-[8px] sm:text-[10px] font-bold uppercase tracking-wider text-wine-600 bg-wine-50 px-2 py-0.5 rounded-full whitespace-nowrap">{s.course}</span>
                                        <span className="text-[10px] sm:text-sm font-bold text-gray-400 truncate">{s.dish}</span>
                                    </div>
                                    <h4 className="text-sm sm:text-lg font-serif font-bold text-gray-900 mb-1 break-all overflow-hidden leading-tight">
                                        {s.wine}
                                    </h4>
                                </div>
                            </div>
                            
                            <div className="w-full min-w-0">
                                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed italic mb-3 break-words">"{s.reason}"</p>
                                
                                <div className="flex flex-wrap gap-3 pt-3 border-t border-gray-50">
                                    <div className="flex items-center gap-1.5 text-[10px] sm:text-xs text-gray-500 whitespace-nowrap">
                                        <ThermometerIcon className="w-3 h-3 sm:w-4 sm:h-4 text-wine-400" />
                                        <span>{s.temp || '16-18°C'}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-[10px] sm:text-xs text-gray-500 min-w-0">
                                        <ClockIcon className="w-3 h-3 sm:w-4 sm:h-4 text-wine-400 shrink-0" />
                                        <span className="truncate">{s.advice || 'Aprire prima'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Footer CTA */}
            <div className="pt-6 sm:pt-10 pb-4 text-center border-t border-gray-100">
                <p className="text-[9px] text-gray-400 mb-4 uppercase tracking-[0.15em]">AIKNOW.WINE • Smart Sommelier</p>
                <button 
                    onClick={onClose}
                    className="w-full sm:w-auto px-10 py-3.5 bg-wine-800 text-white font-bold rounded-xl shadow-lg shadow-wine-100 hover:bg-wine-900 transition-all text-sm active:scale-95"
                >
                    Organizza la tua cena
                </button>
            </div>
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
};

export default SharedPairingModal;
