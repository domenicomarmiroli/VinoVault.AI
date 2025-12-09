import React, { useState } from 'react';
import { Wine, WineType } from '../types';
import { ThermometerIcon, ClockIcon, BoxIcon } from './Icons';

interface WineCardProps {
  wine: Wine;
  onConsume: (wine: Wine) => void;
  onDelete: (id: string) => void;
}

const getTypeColor = (type: WineType) => {
  switch (type) {
    case WineType.RED: return 'bg-red-100 text-red-800 border-red-200';
    case WineType.WHITE: return 'bg-yellow-50 text-yellow-800 border-yellow-200';
    case WineType.ROSE: return 'bg-pink-100 text-pink-800 border-pink-200';
    case WineType.SPARKLING: return 'bg-amber-100 text-amber-800 border-amber-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const WineCard: React.FC<WineCardProps> = ({ wine, onConsume, onDelete }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
      <div className="p-4 flex gap-4">
        <div 
          className="w-24 h-24 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden cursor-pointer"
          onClick={() => setExpanded(!expanded)}
        >
          {wine.imageUrl ? (
            <img src={wine.imageUrl} alt={wine.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <span className="text-xs text-center p-2">No Img</span>
            </div>
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start">
            <h3 className="text-lg font-bold text-gray-900 truncate pr-2">{wine.name}</h3>
            <span className={`text-xs px-2 py-1 rounded-full border ${getTypeColor(wine.type)}`}>
              {wine.type}
            </span>
          </div>
          <p className="text-sm text-gray-600 truncate">{wine.producer} • {wine.year}</p>
          <p className="text-xs text-gray-500 mt-1">{wine.region}</p>
          
          <div className="flex items-center gap-4 mt-3">
             <div className="flex items-center text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded">
               <span className="font-semibold text-gray-700 mr-1">{wine.quantity}</span> bott.
             </div>
             <div className="flex items-center text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded">
               <span className="font-semibold text-gray-700 mr-1">{wine.location}</span>
             </div>
             {wine.price > 0 && (
                <div className="text-xs text-gray-400">
                  € {wine.price.toFixed(2)}
                </div>
             )}
          </div>
        </div>
      </div>

      {/* Expanded Advice Section */}
      <div className={`bg-stone-50 border-t border-gray-100 transition-all duration-300 ${expanded ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'} overflow-hidden`}>
        <div className="p-4 text-sm text-gray-700 space-y-3">
          
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white p-3 rounded-lg border border-gray-200">
               <div className="flex items-center gap-2 mb-1 text-wine-700 font-semibold text-xs uppercase tracking-wide">
                  <ThermometerIcon className="w-4 h-4" /> Conservazione
               </div>
               <p className="text-xs text-gray-600 font-medium">{wine.storageTemp}</p>
               <p className="text-xs text-gray-500 mt-1 italic leading-tight">{wine.storageAdvice}</p>
            </div>
            <div className="bg-white p-3 rounded-lg border border-gray-200">
               <div className="flex items-center gap-2 mb-1 text-wine-700 font-semibold text-xs uppercase tracking-wide">
                  <ThermometerIcon className="w-4 h-4" /> Servizio
               </div>
               <p className="text-xs text-gray-600 font-medium">{wine.servingTemp}</p>
               <div className="flex items-start gap-1 mt-2">
                 <ClockIcon className="w-3 h-3 text-gray-400 mt-0.5" />
                 <p className="text-xs text-gray-500 italic leading-tight">{wine.servingAdvice}</p>
               </div>
            </div>
          </div>

          <div className="flex justify-between text-xs text-gray-400 px-1">
             <span>Acquistato il: {wine.purchaseDate}</span>
          </div>

          {wine.foodPairings.length > 0 && (
             <div>
                <span className="font-semibold text-gray-900 block mb-1 text-xs uppercase tracking-wide">Abbinamenti</span>
                <div className="flex flex-wrap gap-2">
                  {wine.foodPairings.map((pair, idx) => (
                    <span key={idx} className="bg-orange-50 text-orange-800 text-xs px-2 py-1 rounded-md border border-orange-100">
                      {pair}
                    </span>
                  ))}
                </div>
             </div>
          )}

          <div className="flex gap-2 mt-4 pt-2 border-t border-gray-200">
            <button 
              onClick={() => onConsume(wine)}
              className="flex-1 bg-wine-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-wine-700 transition-colors flex items-center justify-center gap-2"
            >
              <BoxIcon className="w-4 h-4" />
              Consuma / Apri
            </button>
            <button 
               onClick={() => onDelete(wine.id)}
               className="px-4 py-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg text-sm font-medium transition-colors"
            >
              Rimuovi
            </button>
          </div>
        </div>
      </div>
      
      {!expanded && (
        <button onClick={() => setExpanded(true)} className="w-full py-1 bg-gray-50 text-gray-400 text-xs text-center hover:bg-gray-100">
          Vedi Scheda Sommelier
        </button>
      )}
    </div>
  );
};

export default WineCard;