
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Wine, WineType, Location } from '../types';
import { ThermometerIcon, ClockIcon, BoxIcon, WineIcon, StarIcon, PlusIcon } from './Icons';

interface WineDetailModalProps {
  wine: Wine | null;
  locations: Location[];
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

const WineDetailModal: React.FC<WineDetailModalProps> = ({ wine, locations, onClose, onConsume, onUpdateWine, onDelete }) => {
  if (!wine) return null;

  const handleQuantityChange = (delta: number) => {
      if (wine.quantity + delta < 0) return;
      onUpdateWine({ ...wine, quantity: wine.quantity + delta });
  };

  const handleLocationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      onUpdateWine({ ...wine, location: e.target.value });
  };

  const content = (
    <div className="fixed inset-0 bg-black/70 z-[200] flex items-end md:items-center justify-center animate-in fade-in duration-200 backdrop-blur-sm">
      
      {/* 
         LAYOUT FULL SCREEN SU MOBILE:
         - h-[100dvh] su mobile per coprire totalmente l'app
         - rounded-t-2xl su mobile (sheet style) o rounded-none se preferiamo full screen totale
         - md:max-h-[85vh] su desktop
      */}
      <div className="bg-white w-full h-[100dvh] md:h-auto md:max-h-[85vh] md:max-w-2xl md:rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-300">
        
        {/* 1. Header Immagine (Fisso) */}
        <div className="relative h-48 md:h-56 bg-gray-100 flex-shrink-0">
           {wine.imageUrl ? (
              <>
                <img src={wine.imageUrl} alt={wine.name} className="w-full h-full object-cover blur-sm opacity-50 absolute inset-0" />
                <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-black/30"></div>
                <img src={wine.imageUrl} alt={wine.name} className="absolute inset-0 w-full h-full object-contain p-4 drop-shadow-xl" />
              </>
           ) : (
             <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-400">
               <WineIcon className="w-16 h-16" />
             </div>
           )}
           
           <button 
             onClick={onClose} 
             className="absolute top-4 right-4 bg-black/30 hover:bg-black/50 text-white rounded-full p-2 backdrop-blur-md transition-all z-10"
           >
             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
               <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
             </svg>
           </button>
        </div>

        {/* 2. Contenuto (Scrollabile ed Espandibile) */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-white">
            
            {/* Intestazione */}
            <div>
                <div className="flex justify-between items-start mb-3">
                     <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${getTypeColor(wine.type)}`}>
                        {wine.type}
                     </span>
                     <div className="flex items-center bg-gray-50 rounded-lg p-1 border border-gray-200 shadow-sm">
                        <button 
                             onClick={() => handleQuantityChange(-1)} 
                             className="w-8 h-8 flex items-center justify-center text-gray-500 hover:bg-white rounded hover:shadow-sm transition-all"
                             disabled={wine.quantity <= 0}
                        >
                            -
                        </button>
                        <span className="text-base font-bold text-gray-900 w-8 text-center">{wine.quantity}</span>
                        <button 
                             onClick={() => handleQuantityChange(1)} 
                             className="w-8 h-8 flex items-center justify-center text-wine-600 hover:bg-white rounded hover:shadow-sm transition-all"
                        >
                            +
                        </button>
                     </div>
                </div>
                <h2 className="text-3xl font-serif font-bold text-gray-900 leading-tight mb-1">{wine.name}</h2>
                <p className="text-lg text-gray-600 font-medium">{wine.producer}</p>
            </div>

            {/* Dati Tecnici */}
            <div className="grid grid-cols-2 gap-3 py-4 border-y border-gray-100 bg-gray-50/50 -mx-2 px-4 rounded-xl">
                <div>
                    <span className="block text-[10px] text-gray-400 uppercase tracking-wider font-bold">Annata</span>
                    <span className="font-semibold text-gray-800">{wine.year}</span>
                </div>
                <div>
                    <span className="block text-[10px] text-gray-400 uppercase tracking-wider font-bold">Vitigno</span>
                    <span className="font-semibold text-gray-800 truncate">{wine.grape || 'N/D'}</span>
                </div>
                <div>
                    <span className="block text-[10px] text-gray-400 uppercase tracking-wider font-bold">Regione</span>
                    <span className="font-semibold text-gray-800 truncate">{wine.region || 'N/D'}</span>
                </div>
                <div>
                    <span className="block text-[10px] text-gray-400 uppercase tracking-wider font-bold">Alcol</span>
                    <span className="font-semibold text-gray-800">{wine.alcohol || 'N/D'}</span>
                </div>
            </div>

            {/* Sezione Sommelier */}
            <div className="space-y-3">
                <h3 className="text-lg font-serif font-bold text-gray-900 flex items-center gap-2">
                    <span className="w-1.5 h-5 bg-wine-600 rounded-full"></span>
                    Consigli del Sommelier
                </h3>
                
                <div className="grid grid-cols-1 gap-3">
                    <div className="bg-stone-50 p-4 rounded-xl border border-stone-100 flex gap-4 items-start">
                        <ThermometerIcon className="w-6 h-6 text-wine-800 mt-0.5" />
                        <div>
                            <p className="text-xs font-bold text-wine-900 uppercase mb-1">Servizio</p>
                            <p className="text-sm text-gray-700 font-medium">{wine.servingTemp}</p>
                            <p className="text-xs text-gray-500 italic mt-0.5">"{wine.servingAdvice}"</p>
                        </div>
                    </div>

                    <div className="bg-stone-50 p-4 rounded-xl border border-stone-100 flex gap-4 items-start">
                        <BoxIcon className="w-6 h-6 text-wine-800 mt-0.5" />
                        <div>
                             <p className="text-xs font-bold text-wine-900 uppercase mb-1">Conservazione</p>
                             <p className="text-sm text-gray-700 font-medium">{wine.storageTemp}</p>
                             <p className="text-xs text-gray-500 italic mt-0.5">"{wine.storageAdvice}"</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Abbinamenti */}
            {wine.foodPairings && wine.foodPairings.length > 0 && (
                <div className="space-y-3">
                     <h3 className="text-lg font-serif font-bold text-gray-900 flex items-center gap-2">
                        <span className="w-1.5 h-5 bg-orange-400 rounded-full"></span>
                        Abbinamenti
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
            
            {/* Info Cantina Footer */}
            <div className="pt-4 border-t border-gray-100 pb-8 md:pb-0">
                <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                         <span className="text-xs text-gray-400 uppercase font-bold">Posizione</span>
                         <select 
                            value={wine.location}
                            onChange={handleLocationChange}
                            className="text-sm font-medium text-wine-700 bg-gray-50 border border-gray-200 rounded-lg py-1 px-3 outline-none focus:ring-2 focus:ring-wine-500"
                         >
                            {locations.map(loc => (
                                <option key={loc.id} value={loc.name}>{loc.name}</option>
                            ))}
                         </select>
                    </div>
                    <div className="flex items-center justify-between">
                         <span className="text-xs text-gray-400 uppercase font-bold">Data Acquisto</span>
                         <span className="text-sm font-medium text-gray-600">{wine.purchaseDate}</span>
                    </div>
                </div>
            </div>
        </div>

        {/* 3. Footer Azioni (Fisso nel Flex) */}
        <div className="shrink-0 p-4 border-t border-gray-100 bg-white grid grid-cols-2 gap-3 pb-8 md:pb-4 safe-area-pb">
             <button 
               onClick={() => {
                   if(confirm("Eliminare definitivamente questo vino?")) {
                       onDelete(wine.id);
                       onClose();
                   }
               }}
               className="py-3.5 px-4 text-red-600 bg-red-50 hover:bg-red-100 rounded-xl font-bold transition-colors text-center text-sm"
             >
               Elimina
             </button>
             <button 
               onClick={() => {
                   onConsume(wine);
                   if (wine.quantity <= 1) onClose(); 
               }}
               className="py-3.5 px-4 bg-wine-600 text-white hover:bg-wine-700 rounded-xl font-bold shadow-lg shadow-wine-200 transition-colors flex items-center justify-center gap-2 text-sm"
             >
               <StarIcon className="w-5 h-5" filled={false} />
               Stappa e Vota
             </button>
        </div>

      </div>
    </div>
  );

  return createPortal(content, document.body);
};

export default WineDetailModal;
