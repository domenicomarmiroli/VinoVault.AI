
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
    <div className="fixed inset-0 bg-black/80 z-[400] flex items-center justify-center p-0 md:p-4 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white w-full h-[100dvh] md:h-auto md:max-h-[90vh] md:max-w-2xl md:rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
        
        {/* Header Decorativo */}
        <div className="bg-wine-800 p-8 text-white relative overflow-hidden shrink-0">
             <div className="absolute top-0 right-0 -mr-16 -mt-16 opacity-10">
                <WineIcon className="w-64 h-64" filled />
             </div>
             <div className="relative z-10 flex justify-between items-start">
                 <div>
                    <Logo light className="w-12 h-12 mb-4" />
                    <h2 className="text-3xl font-serif font-bold">{t('shared_menu_title')}</h2>
                 </div>
                 <button onClick={onClose} className="bg-white/20 hover:bg-white/30 p-2 rounded-full transition-colors">✕</button>
             </div>
        </div>

        {/* Contenuto Scrollabile */}
        <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-10 bg-stone-50">
            {/* Il Menu Scritto dall'Utente */}
            <div className="text-center space-y-4">
                <div className="inline-block h-px w-12 bg-wine-300 mb-2"></div>
                <p className="text-xl md:text-2xl text-gray-800 font-serif leading-relaxed italic whitespace-pre-line">
                    {data.menu}
                </p>
                <div className="inline-block h-px w-12 bg-wine-300 mt-2"></div>
            </div>

            {/* Gli Abbinamenti suggeriti */}
            <div className="space-y-6">
                <h3 className="text-center text-xs font-bold uppercase tracking-[0.2em] text-wine-600 mb-8">{t('shared_pairings_title')}</h3>
                
                <div className="grid gap-6">
                    {data.suggestions.map((s, idx) => (
                        <div key={idx} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col md:flex-row gap-6 items-start transition-all hover:shadow-md">
                            <div className="bg-wine-50 p-4 rounded-xl shrink-0 flex items-center justify-center">
                                <WineIcon className="w-10 h-10 text-wine-700" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-wine-600 bg-wine-50 px-2 py-0.5 rounded-full">{s.course}</span>
                                    <span className="text-sm font-bold text-gray-900 truncate">{s.dish}</span>
                                </div>
                                <h4 className="text-lg font-serif font-bold text-gray-900 mb-2">{s.wine}</h4>
                                <p className="text-sm text-gray-600 leading-relaxed italic mb-4">"{s.reason}"</p>
                                
                                <div className="flex gap-4 pt-4 border-t border-gray-50">
                                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                        <ThermometerIcon className="w-4 h-4 text-wine-400" />
                                        <span>{s.temp || '16-18°C'}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                        <ClockIcon className="w-4 h-4 text-wine-400" />
                                        <span className="truncate">{s.advice || 'Aprire prima'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Call to action per scaricare l'app */}
            <div className="pt-10 pb-6 text-center border-t border-gray-100">
                <p className="text-xs text-gray-400 mb-4 uppercase tracking-widest">Creato con passione su AIKNOW.WINE</p>
                <button 
                    onClick={onClose}
                    className="px-8 py-3 bg-wine-800 text-white font-bold rounded-xl shadow-lg shadow-wine-100 hover:bg-wine-900 transition-all text-sm"
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
