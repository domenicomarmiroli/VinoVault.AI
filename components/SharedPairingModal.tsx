
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
      {/* Container principale */}
      <div className="bg-white w-full max-w-full h-[100dvh] sm:h-auto sm:max-h-[90vh] sm:max-w-2xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="bg-wine-800 p-6 sm:p-10 text-white relative overflow-hidden shrink-0">
             <div className="absolute top-0 right-0 -mr-12 -mt-12 opacity-10 pointer-events-none">
                <WineIcon className="w-40 h-40 sm:w-80 sm:h-80" filled />
             </div>
             <div className="relative z-10 flex justify-between items-center">
                 <div className="min-w-0">
                    <Logo light className="w-8 h-8 sm:w-14 sm:h-14 mb-3 sm:mb-6" />
                    <h2 className="text-xl sm:text-4xl font-serif font-bold truncate tracking-tight">{t('shared_menu_title')}</h2>
                 </div>
                 <button 
                    onClick={onClose} 
                    className="bg-white/20 hover:bg-white/30 p-2 sm:p-3 rounded-full transition-colors shrink-0 ml-4"
                    aria-label="Chiudi"
                 >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5 sm:w-6 sm:h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                 </button>
             </div>
        </div>

        {/* Contenuto Scrollabile */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-12 space-y-8 sm:space-y-16 bg-stone-50 overflow-x-hidden w-full box-border">
            
            {/* Il Menu - carattere Molto più grande e prominente */}
            <div className="text-center space-y-6 max-w-full overflow-hidden py-4 sm:py-8">
                <div className="inline-block h-px w-20 bg-wine-400 mb-2"></div>
                <p className="text-4xl sm:text-7xl text-gray-950 font-serif font-black leading-[1.05] italic whitespace-pre-line break-words px-2 tracking-tight">
                    {data.menu}
                </p>
                <div className="inline-block h-px w-20 bg-wine-400 mt-2"></div>
            </div>

            {/* Gli Abbinamenti */}
            <div className="space-y-6 max-w-full overflow-hidden pb-10">
                <h3 className="text-center text-[10px] sm:text-xs font-bold uppercase tracking-[0.3em] text-wine-600 mb-6 sm:mb-10">{t('shared_pairings_title')}</h3>
                
                <div className="grid gap-8 sm:gap-12 w-full">
                    {data.suggestions.map((s, idx) => (
                        <div key={idx} className="bg-white rounded-3xl p-6 sm:p-10 shadow-lg border border-gray-100 flex flex-col gap-6 items-start transition-all hover:shadow-xl w-full box-border min-w-0">
                            <div className="flex w-full gap-6 items-center sm:items-start min-w-0">
                                <div className="bg-wine-50 p-3 sm:p-6 rounded-2xl shrink-0 flex items-center justify-center">
                                    <WineIcon className="w-8 h-8 sm:w-14 sm:h-14 text-wine-700" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-3 mb-2">
                                        <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-wine-600 bg-wine-50 px-3 py-1 rounded-full whitespace-nowrap">{s.course}</span>
                                        <span className="text-xs sm:text-lg font-bold text-gray-400 truncate">{s.dish}</span>
                                    </div>
                                    <h4 className="text-xl sm:text-3xl font-serif font-bold text-gray-900 mb-2 break-words leading-tight">
                                        {s.wine}
                                    </h4>
                                </div>
                            </div>
                            
                            <div className="w-full min-w-0">
                                <p className="text-base sm:text-xl text-gray-600 leading-relaxed italic mb-6 break-words border-l-4 border-wine-100 pl-6">"{s.reason}"</p>
                                
                                <div className="flex flex-col gap-4 pt-6 border-t border-gray-50 bg-stone-50/50 p-5 rounded-2xl">
                                    <div className="flex items-center gap-3 text-sm sm:text-base text-gray-800 whitespace-normal">
                                        <ThermometerIcon className="w-5 h-5 sm:w-6 sm:h-6 text-wine-600 shrink-0" />
                                        <span className="font-bold">{s.temp || '16-18°C'}</span>
                                    </div>
                                    <div className="flex items-start gap-3 text-sm sm:text-base text-gray-600 whitespace-normal">
                                        <ClockIcon className="w-5 h-5 sm:w-6 sm:h-6 text-wine-600 shrink-0 mt-0.5" />
                                        <span className="leading-relaxed">{s.advice || 'Aprire prima del servizio'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Footer CTA */}
            <div className="pt-10 sm:pt-20 pb-8 text-center border-t border-gray-100">
                <p className="text-[10px] text-gray-400 mb-6 uppercase tracking-[0.2em]">AIKNOW.WINE • Smart Sommelier</p>
                <button 
                    onClick={onClose}
                    className="w-full sm:w-auto px-12 py-5 bg-wine-800 text-white font-bold rounded-2xl shadow-xl shadow-wine-100 hover:bg-wine-900 transition-all text-base active:scale-95"
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
