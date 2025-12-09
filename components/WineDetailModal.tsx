
import React from 'react';
import { Wine, WineType } from '../types';
import { ThermometerIcon, ClockIcon, BoxIcon, WineIcon, StarIcon, PlusIcon } from './Icons';

interface WineDetailModalProps {
  wine: Wine | null;
  onClose: () => void;
  onConsume: (wine: Wine) => void;
  onUpdateWine: (wine: Wine) => void;
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

const WineDetailModal: React.FC<WineDetailModalProps> = ({ wine, onClose, onConsume, onUpdateWine, onDelete }) => {
  if (!wine) return null;

  const handleQuantityChange = (delta: number) => {
      if (wine.quantity + delta < 0) return;
      onUpdateWine({ ...wine, quantity: wine.quantity + delta });
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-[100] flex items-center justify-center p-2 md:p-4 backdrop-blur-sm animate-in fade-in duration-200">
      
      {/* 
         LAYOUT FLEXBOX RIGIDO:
         - h-[90dvh] su mobile per lasciare margini ed evitare conflitti con URL bar
         - flex flex-col: Forza il footer a stare sotto al contenuto
      */}
      <div className="bg-white w-full h-[90dvh] md:h-auto md:max-h-[85vh] md:max-w-2xl rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-300">
        
        {/* 1. Header Immagine (Fisso) */}
        <div className="relative h-40 md:h-56 bg-gray-100 flex-shrink-0">
           {wine.imageUrl ? (
              <>
                <img src={wine.imageUrl} alt={wine.name} className="w-full h-full object-cover blur-sm opacity-50 absolute inset-0" />
                <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-black/30"></div>
                <img src={wine.imageUrl} alt={wine.name} className="absolute inset-0 w-full h-full object-contain p-2 md:p-4 drop-shadow-xl" />
              </>
           ) : (
             <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-400">
               <WineIcon className="w-16 h-16" />
             </div>
           )}
           
           <button 
             onClick={onClose} 
             className="absolute top-3 right-3 bg-black/30 hover:bg-black/50 text-white rounded-full p-2 backdrop-blur-md transition-all z-10"
           >
             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
               <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
             </svg>
           </button>
        </div>

        {/* 2. Contenuto (Scrollabile ed Espandibile) */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5 bg-white">
            
            {/* Intestazione */}
            <div>
                <div className="flex justify-between items-start mb-2">
                     <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border ${getTypeColor(wine.type)}`}>
                        {wine.type}
                     </span>
                     <div className="flex items-center bg-gray-100 rounded-lg p-1 border border-gray-200">
                        <button 
                             onClick={() => handleQuantityChange(-1)} 
                             className="w-7 h-7 flex items-center justify-center text-gray-500 hover:bg-white rounded hover:shadow-sm"
                             disabled={wine.quantity <= 0}
                        >
                            -
                        </button>
                        <span className="text-sm font-bold text-gray-900 w-8 text-center">{wine.quantity}</span>
                        <button 
                             onClick={() => handleQuantityChange(1)} 
                             className="w-7 h-7 flex items-center justify-center text-wine-600 hover:bg-white rounded hover:shadow-sm"
                        >
                            +
                        </button>
                     </div>
                </div>
                <h2 className="text-2xl font-serif font-bold text-gray-900 leading-tight mb-1">{wine.name}</h2>
                <p className="text-base text-gray-600 font-medium">{wine.producer}</p>
            </div>

            {/* Dati Tecnici */}
            <div className="grid grid-cols-2 gap-3 py-3 border-y border-gray-100 bg-gray-50/50 rounded-xl p-3">
                <div>
                    <span className="block text-[9px] text-gray-400 uppercase tracking-wider">Annata</span>
                    <span className="font-semibold text-gray-800 text-sm">{wine.year}</span>
                </div>
                <div>
                    <span className="block text-[9px] text-gray-400 uppercase tracking-wider">Vitigno</span>
                    <span className="font-semibold text-gray-800 text-sm truncate">{wine.grape || 'N/D'}</span>
                </div>
                <div>
                    <span className="block text-[9px] text-gray-400 uppercase tracking-wider">Regione</span>
                    <span className="font-semibold text-gray-800 text-sm truncate">{wine.region || 'N/D'}</span>
                </div>
                <div>
                    <span className="block text-[9px] text-gray-400 uppercase tracking-wider">Alcol</span>
                    <span className="font-semibold text-gray-800 text-sm">{wine.alcohol || 'N/D'}</span>
                </div>
            </div>

            {/* Sezione Sommelier */}
            <div className="space-y-3">
                <h3 className="text-base font-serif font-bold text-gray-900 flex items-center gap-2">
                    <span className="w-1 h-4 bg-wine-600 rounded-full"></span>
                    Consigli del Sommelier
                </h3>
                
                <div className="grid grid-cols-1 gap-3">
                    <div className="bg-stone-50 p-3 rounded-xl border border-stone-100 flex gap-3 items-start">
                        <ThermometerIcon className="w-5 h-5 text-wine-800 mt-0.5" />
                        <div>
                            <p className="text-xs font-bold text-wine-900 uppercase mb-0.5">Servizio</p>
                            <p className="text-sm text-gray-700 font-medium">{wine.servingTemp}</p>
                            <p className="text-xs text-gray-500 italic">"{wine.servingAdvice}"</p>
                        </div>
                    </div>

                    <div className="bg-stone-50 p-3 rounded-xl border border-stone-100 flex gap-3 items-start">
                        <BoxIcon className="w-5 h-5 text-wine-800 mt-0.5" />
                        <div>
                             <p className="text-xs font-bold text-wine-900 uppercase mb-0.5">Conservazione</p>
                             <p className="text-sm text-gray-700 font-medium">{wine.storageTemp}</p>
                             <p className="text-xs text-gray-500 italic">"{wine.storageAdvice}"</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Abbinamenti */}
            {wine.foodPairings && wine.foodPairings.length > 0 && (
                <div className="space-y-2">
                     <h3 className="text-base font-serif font-bold text-gray-900 flex items-center gap-2">
                        <span className="w-1 h-4 bg-orange-400 rounded-full"></span>
                        Abbinamenti
                    </h3>
                    <div className="flex flex-wrap gap-2">
                        {wine.foodPairings.map((pair, idx) => (
                            <span key={idx} className="bg-orange-50 text-orange-800 px-2 py-1 rounded-lg border border-orange-100 text-xs font-medium">
                                {pair}
                            </span>
                        ))}
                    </div>
                </div>
            )}
            
            {/* Info Cantina Footer */}
            <div className="text-xs text-gray-400 pt-2 border-t border-gray-100 flex justify-between">
                <span>Posizione: {wine.location}</span>
                <span>Acquistato: {wine.purchaseDate}</span>
            </div>
        </div>

        {/* 3. Footer Azioni (Fisso nel Flex) */}
        <div className="shrink-0 p-4 border-t border-gray-100 bg-white grid grid-cols-2 gap-3 pb-safe">
             <button 
               onClick={() => {
                   if(confirm("Eliminare definitivamente questo vino?")) {
                       onDelete(wine.id);
                       onClose();
                   }
               }}
               className="py-3 px-4 text-red-600 bg-red-50 hover:bg-red-100 rounded-xl font-medium transition-colors text-center text-sm"
             >
               Elimina
             </button>
             <button 
               onClick={() => {
                   onConsume(wine);
                   if (wine.quantity <= 1) onClose(); 
               }}
               className="py-3 px-4 bg-wine-600 text-white hover:bg-wine-700 rounded-xl font-bold shadow-lg shadow-wine-200 transition-colors flex items-center justify-center gap-2 text-sm"
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
