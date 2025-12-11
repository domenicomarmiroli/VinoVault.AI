

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Wine, WineType, Location } from '../types';
import { ThermometerIcon, BoxIcon, WineIcon, StarIcon, ChartBarIcon, PencilIcon } from './Icons';
import DrinkabilityBadge from './DrinkabilityBadge';

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
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Wine | null>(null);

  useEffect(() => {
    if (wine) {
      setFormData({ ...wine });
      setIsEditing(false);
    }
  }, [wine]);

  if (!wine || !formData) return null;

  const handleSave = () => {
    if (formData) {
      onUpdateWine(formData);
      setIsEditing(false);
    }
  };

  const handleChange = (field: keyof Wine, value: any) => {
    setFormData(prev => prev ? ({ ...prev, [field]: value }) : null);
  };

  const handleQuantityChange = (delta: number) => {
      if (formData.quantity + delta < 0) return;
      const newQty = formData.quantity + delta;
      handleChange('quantity', newQty);
      // If we are NOT in full edit mode, we want to persist quantity changes immediately
      if (!isEditing) {
          onUpdateWine({ ...formData, quantity: newQty });
      }
  };

  const handleLocationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const newLoc = e.target.value;
      handleChange('location', newLoc);
      // Persist immediately if not in edit mode
      if (!isEditing) {
          onUpdateWine({ ...formData, location: newLoc });
      }
  };

  const content = (
    <div className="fixed inset-0 bg-black/70 z-[200] flex items-end md:items-center justify-center animate-in fade-in duration-200 backdrop-blur-sm">
      <div className="bg-white w-full h-[100dvh] md:h-auto md:max-h-[85vh] md:max-w-2xl md:rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-300">
        
        {/* 1. Header Immagine (Fisso) */}
        <div className="relative h-48 md:h-56 bg-gray-100 flex-shrink-0">
           {formData.imageUrl ? (
              <>
                <img src={formData.imageUrl} alt={formData.name} className="w-full h-full object-cover blur-sm opacity-50 absolute inset-0" />
                <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-black/30"></div>
                <img src={formData.imageUrl} alt={formData.name} className="absolute inset-0 w-full h-full object-contain p-4 drop-shadow-xl" />
              </>
           ) : (
             <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-400">
               <WineIcon className="w-16 h-16" />
             </div>
           )}
           
           <div className="absolute top-4 right-4 flex gap-2 z-10">
               {/* Edit Button */}
               <button 
                onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                className={`rounded-full p-2 backdrop-blur-md transition-all shadow-sm flex items-center justify-center ${isEditing ? 'bg-wine-600 text-white hover:bg-wine-700' : 'bg-black/30 text-white hover:bg-black/50'}`}
                title={isEditing ? "Salva Modifiche" : "Modifica Vino"}
               >
                   {isEditing ? (
                       <span className="text-xs font-bold px-2">Salva</span>
                   ) : (
                       <PencilIcon className="w-5 h-5" />
                   )}
               </button>

               <button 
                 onClick={() => { setIsEditing(false); onClose(); }}
                 className="bg-black/30 hover:bg-black/50 text-white rounded-full p-2 backdrop-blur-md transition-all"
               >
                 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                   <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                 </svg>
               </button>
           </div>
        </div>

        {/* 2. Contenuto (Scrollabile ed Espandibile) */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-white">
            
            {/* Intestazione */}
            <div>
                <div className="flex justify-between items-start mb-3">
                     {isEditing ? (
                         <select 
                            value={formData.type} 
                            onChange={(e) => handleChange('type', e.target.value)}
                            className="text-xs font-bold uppercase tracking-wide border border-gray-300 rounded p-1"
                         >
                             {Object.values(WineType).map(t => <option key={t} value={t}>{t}</option>)}
                         </select>
                     ) : (
                         <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${getTypeColor(formData.type)}`}>
                            {formData.type}
                         </span>
                     )}
                     
                     <div className="flex items-center bg-gray-50 rounded-lg p-1 border border-gray-200 shadow-sm">
                        <button 
                             onClick={() => handleQuantityChange(-1)} 
                             className="w-8 h-8 flex items-center justify-center text-gray-500 hover:bg-white rounded hover:shadow-sm transition-all"
                             disabled={formData.quantity <= 0}
                        >
                            -
                        </button>
                        <span className="text-base font-bold text-gray-900 w-8 text-center">{formData.quantity}</span>
                        <button 
                             onClick={() => handleQuantityChange(1)} 
                             className="w-8 h-8 flex items-center justify-center text-wine-600 hover:bg-white rounded hover:shadow-sm transition-all"
                        >
                            +
                        </button>
                     </div>
                </div>
                
                {isEditing ? (
                    <div className="space-y-2 mb-2">
                        <input 
                            type="text" 
                            value={formData.name} 
                            onChange={(e) => handleChange('name', e.target.value)}
                            className="w-full text-2xl font-serif font-bold text-gray-900 border-b border-gray-300 focus:border-wine-500 outline-none placeholder-gray-300"
                            placeholder="Nome Vino"
                        />
                        <input 
                            type="text" 
                            value={formData.producer} 
                            onChange={(e) => handleChange('producer', e.target.value)}
                            className="w-full text-lg text-gray-600 font-medium border-b border-gray-300 focus:border-wine-500 outline-none placeholder-gray-300"
                            placeholder="Produttore"
                        />
                    </div>
                ) : (
                    <>
                        <h2 className="text-3xl font-serif font-bold text-gray-900 leading-tight mb-1">{formData.name}</h2>
                        <p className="text-lg text-gray-600 font-medium">{formData.producer}</p>
                    </>
                )}
            </div>

            {/* Dati Tecnici */}
            <div className="grid grid-cols-2 gap-3 py-4 border-y border-gray-100 bg-gray-50/50 -mx-2 px-4 rounded-xl">
                <div>
                    <span className="block text-[10px] text-gray-400 uppercase tracking-wider font-bold">Annata</span>
                    {isEditing ? (
                        <input type="text" value={formData.year} onChange={(e) => handleChange('year', e.target.value)} className="w-full bg-white border border-gray-300 rounded px-1 py-0.5 text-sm" />
                    ) : (
                        <span className="font-semibold text-gray-800">{formData.year}</span>
                    )}
                </div>
                <div>
                    <span className="block text-[10px] text-gray-400 uppercase tracking-wider font-bold">Vitigno</span>
                    {isEditing ? (
                        <input type="text" value={formData.grape} onChange={(e) => handleChange('grape', e.target.value)} className="w-full bg-white border border-gray-300 rounded px-1 py-0.5 text-sm" />
                    ) : (
                        <span className="font-semibold text-gray-800 truncate">{formData.grape || 'N/D'}</span>
                    )}
                </div>
                <div>
                    <span className="block text-[10px] text-gray-400 uppercase tracking-wider font-bold">Regione</span>
                    {isEditing ? (
                        <input type="text" value={formData.region} onChange={(e) => handleChange('region', e.target.value)} className="w-full bg-white border border-gray-300 rounded px-1 py-0.5 text-sm" />
                    ) : (
                        <span className="font-semibold text-gray-800 truncate">{formData.region || 'N/D'}</span>
                    )}
                </div>
                <div>
                    <span className="block text-[10px] text-gray-400 uppercase tracking-wider font-bold">Alcol</span>
                    {isEditing ? (
                        <input type="text" value={formData.alcohol} onChange={(e) => handleChange('alcohol', e.target.value)} className="w-full bg-white border border-gray-300 rounded px-1 py-0.5 text-sm" />
                    ) : (
                        <span className="font-semibold text-gray-800">{formData.alcohol || 'N/D'}</span>
                    )}
                </div>
            </div>

            {/* Analytics & Drinkability */}
            <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 space-y-3">
                 <h3 className="text-xs font-bold uppercase text-indigo-800 flex items-center gap-2">
                     <ChartBarIcon className="w-4 h-4" filled />
                     Investimento & Evoluzione
                 </h3>
                 <div className="flex justify-between items-center gap-4">
                     <div className="flex-1">
                         <span className="block text-[10px] text-indigo-400 uppercase font-bold">Finestra Consumo</span>
                         {isEditing ? (
                             <input type="text" value={formData.drinkWindow} onChange={(e) => handleChange('drinkWindow', e.target.value)} className="w-full bg-white border border-indigo-200 rounded px-1 py-0.5 text-sm mt-1" />
                         ) : (
                             <div className="flex items-center gap-2 mt-0.5">
                                 <span className="text-sm font-bold text-indigo-900">{formData.drinkWindow || 'N/A'}</span>
                                 <DrinkabilityBadge drinkWindow={formData.drinkWindow} />
                             </div>
                         )}
                     </div>
                     <div className="text-right flex-1">
                         <span className="block text-[10px] text-indigo-400 uppercase font-bold">Valore Stimato</span>
                         {isEditing ? (
                             <input type="number" value={formData.marketPrice || formData.price} onChange={(e) => handleChange('marketPrice', parseFloat(e.target.value))} className="w-full bg-white border border-indigo-200 rounded px-1 py-0.5 text-sm mt-1 text-right" />
                         ) : (
                             <span className="text-lg font-bold text-indigo-900">€{formData.marketPrice?.toFixed(0) || formData.price}</span>
                         )}
                     </div>
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
                        <div className="flex-1">
                            <p className="text-xs font-bold text-wine-900 uppercase mb-1">Servizio</p>
                            {isEditing ? (
                                <div className="space-y-1">
                                    <input type="text" value={formData.servingTemp} onChange={(e) => handleChange('servingTemp', e.target.value)} placeholder="Temp." className="w-full bg-white border border-gray-200 rounded px-1 py-0.5 text-sm" />
                                    <input type="text" value={formData.servingAdvice} onChange={(e) => handleChange('servingAdvice', e.target.value)} placeholder="Consiglio" className="w-full bg-white border border-gray-200 rounded px-1 py-0.5 text-sm" />
                                </div>
                            ) : (
                                <>
                                    <p className="text-sm text-gray-700 font-medium">{formData.servingTemp}</p>
                                    <p className="text-xs text-gray-500 italic mt-0.5">"{formData.servingAdvice}"</p>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="bg-stone-50 p-4 rounded-xl border border-stone-100 flex gap-4 items-start">
                        <BoxIcon className="w-6 h-6 text-wine-800 mt-0.5" />
                        <div className="flex-1">
                             <p className="text-xs font-bold text-wine-900 uppercase mb-1">Conservazione</p>
                             {isEditing ? (
                                <div className="space-y-1">
                                    <input type="text" value={formData.storageTemp} onChange={(e) => handleChange('storageTemp', e.target.value)} placeholder="Temp." className="w-full bg-white border border-gray-200 rounded px-1 py-0.5 text-sm" />
                                    <input type="text" value={formData.storageAdvice} onChange={(e) => handleChange('storageAdvice', e.target.value)} placeholder="Consiglio" className="w-full bg-white border border-gray-200 rounded px-1 py-0.5 text-sm" />
                                </div>
                             ) : (
                                <>
                                    <p className="text-sm text-gray-700 font-medium">{formData.storageTemp}</p>
                                    <p className="text-xs text-gray-500 italic mt-0.5">"{formData.storageAdvice}"</p>
                                </>
                             )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Abbinamenti */}
            {(formData.foodPairings.length > 0 || isEditing) && (
                <div className="space-y-3">
                     <h3 className="text-lg font-serif font-bold text-gray-900 flex items-center gap-2">
                        <span className="w-1.5 h-5 bg-orange-400 rounded-full"></span>
                        Abbinamenti
                    </h3>
                    {isEditing ? (
                        <textarea 
                            value={formData.foodPairings.join(', ')} 
                            onChange={(e) => handleChange('foodPairings', e.target.value.split(',').map(s => s.trim()))}
                            className="w-full bg-gray-50 border border-gray-300 rounded-lg p-2 text-sm"
                            placeholder="Separati da virgola"
                        />
                    ) : (
                        <div className="flex flex-wrap gap-2">
                            {formData.foodPairings.map((pair, idx) => (
                                <span key={idx} className="bg-orange-50 text-orange-800 px-3 py-1.5 rounded-lg border border-orange-100 text-sm font-medium">
                                    {pair}
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            )}
            
            {/* Info Cantina Footer */}
            <div className="pt-4 border-t border-gray-100 pb-8 md:pb-0">
                <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                         <span className="text-xs text-gray-400 uppercase font-bold">Posizione</span>
                         <select 
                            value={formData.location}
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
                         {isEditing ? (
                             <input type="date" value={formData.purchaseDate} onChange={(e) => handleChange('purchaseDate', e.target.value)} className="bg-gray-50 border border-gray-300 rounded px-2 py-1 text-sm" />
                         ) : (
                             <span className="text-sm font-medium text-gray-600">{formData.purchaseDate}</span>
                         )}
                    </div>
                </div>
            </div>
        </div>

        {/* 3. Footer Azioni (Fisso nel Flex) */}
        {!isEditing && (
            <div className="shrink-0 p-4 border-t border-gray-100 bg-white grid grid-cols-2 gap-3 pb-8 md:pb-4 safe-area-pb">
                 <button 
                   onClick={() => {
                       if(confirm("Eliminare definitivamente questo vino?")) {
                           onDelete(formData.id);
                           onClose();
                       }
                   }}
                   className="py-3.5 px-4 text-red-600 bg-red-50 hover:bg-red-100 rounded-xl font-bold transition-colors text-center text-sm"
                 >
                   Elimina
                 </button>
                 <button 
                   onClick={() => {
                       onConsume(formData);
                       if (formData.quantity <= 1) onClose(); 
                   }}
                   className="py-3.5 px-4 bg-wine-600 text-white hover:bg-wine-700 rounded-xl font-bold shadow-lg shadow-wine-200 transition-colors flex items-center justify-center gap-2 text-sm"
                 >
                   <StarIcon className="w-5 h-5" filled={false} />
                   Stappa e Vota
                 </button>
            </div>
        )}
        
        {isEditing && (
            <div className="shrink-0 p-4 border-t border-gray-100 bg-white pb-8 md:pb-4 safe-area-pb">
                 <button 
                   onClick={handleSave}
                   className="w-full py-3.5 px-4 bg-green-600 text-white hover:bg-green-700 rounded-xl font-bold shadow-lg transition-colors text-center text-sm"
                 >
                   Salva Modifiche
                 </button>
            </div>
        )}

      </div>
    </div>
  );

  return createPortal(content, document.body);
};

export default WineDetailModal;
