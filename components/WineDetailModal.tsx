
import React from 'react';
import { Wine, WineType } from '../types';
import { ThermometerIcon, ClockIcon, BoxIcon, WineIcon, StarIcon } from './Icons';

interface WineDetailModalProps {
  wine: Wine | null;
  onClose: () => void;
  onConsume: (wine: Wine) => void;
  onDelete: (id: string) => void;
}

const getTypeColor = (type: WineType) => {
  switch (type) {
    case WineType.RED: return 'bg-red-50 text-red-700 border-red-100';
    case WineType.WHITE: return 'bg-yellow-50 text-yellow-700 border-yellow-100';
    case WineType.ROSE: return 'bg-pink-50 text-pink-700 border-pink-100';
    case WineType.SPARKLING: return 'bg-amber-50 text-amber-700 border-amber-100';
    default: return 'bg-gray-50 text-gray-700 border-gray-100';
  }
};

const WineDetailModal: React.FC<WineDetailModalProps> = ({ wine, onClose, onConsume, onDelete }) => {
  if (!wine) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end md:items-center justify-center md:p-4 backdrop-blur-sm animate-in fade-in duration-200">
      {/* 
          MODIFICHE MOBILE: 
          1. h-[85dvh] invece di 95dvh per lasciare spazio sotto (barra browser)
          2. rounded-t-2xl per effetto "foglio" che esce dal basso
      */}
      <div className="bg-white w-full h-[85dvh] md:h-auto md:max-h-[90vh] md:max-w-2xl md:rounded-2xl rounded-t-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-300">
        
        {/* Header Immagine e Titolo - MODIFICA: h-48 su mobile (invece di h-64) per salvare spazio */}
        <div className="relative h-48 md:h-72 bg-gray-100 flex-shrink-0">
           {wine.imageUrl ? (
              <>
                <img src={wine.imageUrl} alt={wine.name} className="w-full h-full object-cover blur-sm opacity-50 absolute inset-0" />
                <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-black/30"></div>
                <img src={wine.imageUrl} alt={wine.name} className="absolute inset-0 w-full h-full object-contain p-4 drop-shadow-xl" />
              </>
           ) : (
             <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-400">
               <WineIcon className="w-20 h-20" />
             </div>
           )}
           
           <button 
             onClick={onClose} 
             className="absolute top-4 right-4 bg-black/20 hover:bg-black/40 text-white rounded-full p-2 backdrop-blur-md transition-all"
           >
             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
               <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
             </svg>
           </button>
        </div>

        {/* Contenuto Scrollabile */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
            
            {/* Intestazione */}
            <div>
                <div className="flex justify-between items-start mb-2">
                     <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${getTypeColor(wine.type)}`}>
                        {wine.type}
                     </span>
                     <span className="text-sm font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">
                        {wine.quantity} Bottiglie
                     </span>
                </div>
                <h2 className="text-3xl font-serif font-bold text-gray-900 leading-tight mb-1">{wine.name}</h2>
                <p className="text-lg text-gray-600 font-medium">{wine.producer}</p>
            </div>

            {/* Dati Tecnici */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4 border-y border-gray-100">
                <div>
                    <span className="block text-xs text-gray-400 uppercase tracking-wider">Annata</span>
                    <span className="font-semibold text-gray-800">{wine.year}</span>
                </div>
                <div>
                    <span className="block text-xs text-gray-400 uppercase tracking-wider">Vitigno</span>
                    <span className="font-semibold text-gray-800">{wine.grape || 'N/D'}</span>
                </div>
                <div>
                    <span className="block text-xs text-gray-400 uppercase tracking-wider">Regione</span>
                    <span className="font-semibold text-gray-800">{wine.region || 'N/D'}</span>
                </div>
                <div>
                    <span className="block text-xs text-gray-400 uppercase tracking-wider">Alcol</span>
                    <span className="font-semibold text-gray-800">{wine.alcohol || 'N/D'}</span>
                </div>
            </div>

            {/* Sezione Sommelier */}
            <div className="space-y-4">
                <h3 className="text-lg font-serif font-bold text-gray-900 flex items-center gap-2">
                    <span className="w-1 h-6 bg-wine-600 rounded-full"></span>
                    Consigli del Sommelier
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-stone-50 p-4 rounded-xl border border-stone-100">
                        <div className="flex items-center gap-2 mb-2 text-wine-800 font-bold text-sm uppercase">
                            <ThermometerIcon className="w-5 h-5" /> Servizio
                        </div>
                        <p className="text-sm text-gray-600 mb-1"><span className="font-semibold">Temp:</span> {wine.servingTemp}</p>
                        <p className="text-sm text-gray-600 italic">"{wine.servingAdvice}"</p>
                    </div>

                    <div className="bg-stone-50 p-4 rounded-xl border border-stone-100">
                        <div className="flex items-center gap-2 mb-2 text-wine-800 font-bold text-sm uppercase">
                            <BoxIcon className="w-5 h-5" /> Conservazione
                        </div>
                        <p className="text-sm text-gray-600 mb-1"><span className="font-semibold">Temp:</span> {wine.storageTemp}</p>
                        <p className="text-sm text-gray-600 italic">"{wine.storageAdvice}"</p>
                    </div>
                </div>
            </div>

            {/* Abbinamenti */}
            {wine.foodPairings && wine.foodPairings.length > 0 && (
                <div className="space-y-3">
                     <h3 className="text-lg font-serif font-bold text-gray-900 flex items-center gap-2">
                        <span className="w-1 h-6 bg-orange-400 rounded-full"></span>
                        Abbinamenti Cibo
                    </h3>
                    <div className="flex flex-wrap gap-2">
                        {wine.foodPairings.map((pair, idx) => (
                            <span key={idx} className="bg-orange-50 text-orange-800 px-3 py-1.5 rounded-lg border border-orange-100 text-sm font-medium">
                                {pair}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Info Cantina */}
            <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-600 space-y-2">
                <div className="flex justify-between">
                    <span>Posizione in cantina:</span>
                    <span className="font-semibold text-gray-900">{wine.location || 'Non specificata'}</span>
                </div>
                <div className="flex justify-between">
                    <span>Data acquisto:</span>
                    <span className="font-semibold text-gray-900">{wine.purchaseDate}</span>
                </div>
                <div className="flex justify-between">
                     <span>Valore stimato:</span>
                     <span className="font-semibold text-gray-900">€ {wine.price.toFixed(2)}</span>
                </div>
            </div>

            <div className="h-12"></div> {/* Spacer */}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-gray-100 bg-white sticky bottom-0 grid grid-cols-2 gap-3 shadow-[0_-5px_15px_rgba(0,0,0,0.05)]">
             <button 
               onClick={() => {
                   if(confirm("Eliminare definitivamente questo vino?")) {
                       onDelete(wine.id);
                       onClose();
                   }
               }}
               className="py-3.5 px-4 text-red-600 bg-red-50 hover:bg-red-100 rounded-xl font-medium transition-colors text-center"
             >
               Elimina
             </button>
             <button 
               onClick={() => {
                   onConsume(wine);
                   if (wine.quantity <= 1) onClose(); // Close if last bottle
               }}
               className="py-3.5 px-4 bg-wine-600 text-white hover:bg-wine-700 rounded-xl font-bold shadow-lg shadow-wine-200 transition-colors flex items-center justify-center gap-2"
             >
               <StarIcon className="w-5 h-5" filled={false} />
               Stappa e Vota
             </button>
        </div>

      </div>
    </div>
  );
};

export default WineDetailModal;
