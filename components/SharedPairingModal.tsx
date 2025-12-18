
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
    <div className="fixed inset-0 bg-black/80 z-[400] flex items-center justify-center p-0 sm:p-4 backdrop-blur-md animate-in fade-in duration-300 overflow-hidden">
      <div className="bg-white w-full h-[100dvh] sm:h-auto sm:max-h-[90vh] sm:max-w-xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
        
        {/* Header Decorativo */}
        <div className="bg-wine-800 p-6 sm:p-8 text-white relative overflow-hidden shrink-0">
             <div className="absolute top-0 right-0 -mr-16 -mt-16 opacity-10">
                <WineIcon className="w-48 h-48 sm:w-64 sm:h-64" filled />
             </div>
             <div className="relative z-10 flex justify-between items-start">
                 <div>
                    <Logo light className="w-10 h-10 sm:w-12 sm:h-12 mb-3 sm:mb-4" />
                    <h2 className="text-2xl sm:text-3xl font-serif font-bold">{t('shared_menu_title')}</h2>
                 </div>
                 <button onClick={onClose} className="bg-white/20 hover:bg-white/30 p-2 rounded-full transition-colors">✕</button>
             </div>
        </div>

        {/* Contenuto Scrollabile */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-10 space-y-8 sm:space-y-10 bg-stone-50 overflow-x-hidden">
            {/* Il Menu Scritto dall'Utente */}
            <div className="text-center space-y-3 sm:space-y-4 max-w-full">
                <div className="inline-block h-px w-12 bg-wine-300 mb-1 sm:mb-2"></div>
                <p className="text-lg sm:text-2xl text-gray-800 font-serif leading-relaxed italic whitespace-pre-line break-words">
                    {data.menu}
                </p>
                <div className="inline-block h-px w-12 bg-wine-300 mt-1 sm:mt-2"></div>
            </div>

            {/* Gli Abbinamenti suggeriti */}
            <div className="space-y-6 max-w-full">
                <h3 className="text-center text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em] text-wine-600 mb-6 sm:mb-8">{t('shared_pairings_title')}</h3>
                
                <div className="grid gap-5 sm:gap-6">
                    {data.suggestions.map((s, idx) => (
                        <div key={idx} className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100 flex flex-col gap-4 sm:gap-6 items-start transition-all hover:shadow-md max-w-full">
                            <div className="flex w-full gap-4 items-center sm:items-start">
                                <div className="bg-wine-50 p-3 sm:p-4 rounded-xl shrink-0 flex items-center justify-center">
                                    <WineIcon className="w-8 h-8 sm:w-10 sm:h-10 text-wine-700" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-2 mb-1">
                                        <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-wine-600 bg-wine-50 px-2 py-0.5 rounded-full whitespace-nowrap">{s.course}</span>
                                        <span className="text-xs sm:text-sm font-bold text-gray-900 truncate">{s.dish}</span>
                                    </div>
                                    <h4 className="text-base sm:text-lg font-serif font-bold text-gray-900 mb-1 break-words">{s.wine}</h4>
                                </div>
                            </div>
                            
                            <div className="w-full">
                                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed italic mb-4 break-words">"{s.reason}"</p>
                                
                                <div className="flex flex-wrap gap-4 pt-4 border-t border-gray-50">
                                    <div className="flex items-center gap-1.5 text-[10px] sm:text-xs text-gray-500">
                                        <ThermometerIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-wine-400" />
                                        <span>{s.temp || '16-18°C'}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-[10px] sm:text-xs text-gray-500 min-w-0">
                                        <ClockIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-wine-400 shrink-0" />
                                        <span className="truncate">{s.advice || 'Aprire prima'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Call to action */}
            <div className="pt-8 sm:pt-10 pb-6 text-center border-t border-gray-100">
                <p className="text-[10px] text-gray-400 mb-4 uppercase tracking-widest">Creato su AIKNOW.WINE</p>
                <button 
                    onClick={onClose}
                    className="w-full sm:w-auto px-8 py-3 bg-wine-800 text-white font-bold rounded-xl shadow-lg shadow-wine-100 hover:bg-wine-900 transition-all text-sm"
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
