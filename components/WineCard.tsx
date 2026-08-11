
import React from 'react';
import { Wine, WineType } from '../types';
import DrinkabilityBadge from './DrinkabilityBadge';
import { MapPinIcon } from './Icons';

interface WineCardProps {
  wine: Wine;
  onClick: (wine: Wine) => void;
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

const getQualityColor = (score: number) => {
  if (score >= 90) return 'border-emerald-500 text-emerald-600 bg-emerald-50';
  if (score >= 80) return 'border-wine-500 text-wine-600 bg-wine-50';
  if (score >= 70) return 'border-yellow-500 text-yellow-600 bg-yellow-50';
  return 'border-gray-300 text-gray-500 bg-gray-50';
};

const WineCard: React.FC<WineCardProps> = ({ wine, onClick }) => {
  return (
    <div 
        onClick={() => onClick(wine)}
        className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all active:scale-[0.98] cursor-pointer flex h-30"
    >
        {/* Immagine a Sinistra */}
        <div className="w-24 bg-gray-100 flex-shrink-0 relative overflow-hidden">
          {wine.imageUrl ? (
            <img src={wine.imageUrl} alt={wine.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-300 bg-gray-50">
               <span className="text-[10px] text-center px-1">No Foto</span>
            </div>
          )}
          {/* Badge quantità sovrapposto - Mostra solo se > 1 */}
          {wine.quantity > 1 && (
            <div className="absolute bottom-0 left-0 right-0 bg-wine-800/80 text-white text-[10px] font-bold text-center py-0.5 backdrop-blur-sm shadow-sm">
               {wine.quantity} pz
            </div>
          )}
          {/* Badge voto qualità (solo se presente, es. da Shop Advisor) */}
          {wine.qualityScore !== undefined && (
            <div className={`absolute top-1 right-1 w-7 h-7 rounded-full flex items-center justify-center border-2 text-[11px] font-black shadow-sm ${getQualityColor(wine.qualityScore)}`}>
              {wine.qualityScore}
            </div>
          )}
        </div>
        
        {/* Info a Destra */}
        <div className="flex-1 p-3 flex flex-col justify-between min-w-0">
          <div>
              <div className="flex justify-between items-start mb-1">
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${getTypeColor(wine.type)}`}>
                  {wine.type}
                </span>
                <div className="flex items-center gap-1">
                   <DrinkabilityBadge drinkWindow={wine.drinkWindow} />
                   <span className="text-[10px] text-gray-400 font-mono ml-1">
                     {wine.year}
                   </span>
                </div>
              </div>
              <h3 className="text-base font-bold text-gray-900 truncate leading-tight mb-0.5">{wine.name}</h3>
              <p className="text-xs text-gray-600 truncate">{wine.producer}</p>
          </div>
          
          <div className="flex justify-between items-end mt-2">
             <div className="flex flex-col gap-1 min-w-0 flex-1 mr-2">
                <div className="text-xs text-gray-500 truncate">
                    {wine.region}
                </div>
                {wine.location && (
                    <div className="flex items-center gap-1 text-[10px] text-wine-600 font-medium bg-wine-50 px-1.5 py-0.5 rounded w-fit max-w-full">
                        <MapPinIcon className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">{wine.location}</span>
                    </div>
                )}
             </div>
             {wine.price > 0 && (
                <div className="text-sm font-semibold text-gray-700 whitespace-nowrap">
                  € {wine.price.toFixed(0)}
                </div>
             )}
          </div>
        </div>
    </div>
  );
};

export default WineCard;
