

import React, { useState } from 'react';
import { Wine, PairingSuggestion, PairingOption } from '../types';
import { suggestPairing } from '../services/geminiService';
import { ChefIcon, WineIcon, LogoutIcon, ThermometerIcon, ClockIcon, MapPinIcon, StarIcon, ShoppingCartIcon } from '../components/Icons';

interface SommelierViewProps {
  inventory: Wine[];
  onLogout: () => void;
  onAiUsed: () => void;
  onConsume: (wine: Wine) => void;
}

const SommelierView: React.FC<SommelierViewProps> = ({ inventory, onLogout, onAiUsed, onConsume }) => {
  const [menuText, setMenuText] = useState('');
  const [guests, setGuests] = useState(2);
  const [style, setStyle] = useState<'single' | 'multiple'>('multiple');
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<PairingSuggestion[]>([]);

  const handleSuggestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!menuText.trim()) return;

    setLoading(true);
    setSuggestions([]);
    try {
      const results = await suggestPairing(menuText, guests, inventory, style);
      setSuggestions(results);
      onAiUsed(); // Track
    } catch (error: any) {
      console.error(error);
      alert(`Errore Sommelier: ${error.message || "Riprova più tardi."}`);
    } finally {
      setLoading(false);
    }
  };

  const getInventoryWine = (id?: string) => inventory.find(w => w.id === id);

  return (
    <div className="h-full flex flex-col bg-stone-50 overflow-hidden">
       {/* Header */}
      <div className="bg-white border-b border-gray-200 p-6 shadow-sm z-10 flex justify-between items-start">
        <div>
            <h1 className="text-2xl font-serif font-bold text-gray-900 flex items-center gap-2">
                <ChefIcon className="w-8 h-8 text-wine-600" />
                Sommelier Virtuale
            </h1>
            <p className="text-sm text-gray-500 mt-1">
                Inserisci il menu e lascia che l'IA trovi il vino perfetto nella tua cantina.
            </p>
        </div>
        <button 
            onClick={onLogout}
            className="text-gray-400 hover:text-wine-700 p-2"
            title="Esci"
        >
            <LogoutIcon className="w-6 h-6" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 pb-24">
        {/* Input Form */}
        <form onSubmit={handleSuggestion} className="bg-white rounded-xl shadow-sm p-4 border border-gray-200 mb-6">
            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Il Menu del Pranzo/Cena</label>
                <textarea 
                    value={menuText}
                    onChange={(e) => setMenuText(e.target.value)}
                    placeholder="Es. Antipasto di salumi, Lasagne al ragù, Arrosto di vitello..."
                    className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-wine-500 outline-none resize-none"
                    required
                />
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ospiti</label>
                    <input 
                        type="number" 
                        min="1" 
                        value={guests} 
                        onChange={(e) => setGuests(parseInt(e.target.value))}
                        className="w-full p-2 border border-gray-300 rounded-lg"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tipologia Servizio</label>
                    <select 
                        value={style} 
                        onChange={(e) => setStyle(e.target.value as 'single' | 'multiple')}
                        className="w-full p-2 border border-gray-300 rounded-lg"
                    >
                        <option value="multiple">Abbinamento per portata</option>
                        <option value="single">Vino unico per tutto</option>
                    </select>
                </div>
            </div>

            <button 
                type="submit" 
                disabled={loading}
                className={`w-full py-3 rounded-lg text-white font-medium shadow-md transition-all ${
                    loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-wine-600 hover:bg-wine-700'
                }`}
            >
                {loading ? 'Consultazione in corso...' : 'Chiedi al Sommelier'}
            </button>
        </form>

        {/* Results */}
        {suggestions.length > 0 && (
            <div className="space-y-8">
                <h3 className="text-xl font-serif font-bold text-gray-800 border-l-4 border-wine-500 pl-3">Suggerimenti</h3>
                
                {suggestions.map((suggestion, idx) => (
                    <div key={idx} className="space-y-2">
                        {/* Course Header */}
                        <div className="flex items-center gap-2">
                            <span className="font-bold text-wine-900 uppercase text-sm tracking-wider bg-wine-100 px-2 py-1 rounded">
                                {suggestion.courseName}
                            </span>
                            <span className="text-sm text-gray-600 italic border-l border-gray-300 pl-2">
                                {suggestion.dishName}
                            </span>
                        </div>

                        {/* Options Grid (Stacked on mobile, Side by side on larger screens) */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {suggestion.options.map((option, optIdx) => {
                                const ownedWine = option.type === 'owned' && option.wineId 
                                    ? getInventoryWine(option.wineId) 
                                    : null;

                                return (
                                    <div key={optIdx} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-full">
                                        <div className="bg-gray-50 px-3 py-1.5 border-b border-gray-100 flex justify-between items-center">
                                            <span className="text-xs font-bold text-gray-500 uppercase">Opzione {optIdx + 1}</span>
                                            {ownedWine ? (
                                                <span className="text-[10px] font-bold text-green-700 bg-green-100 px-1.5 py-0.5 rounded uppercase">In Cantina</span>
                                            ) : (
                                                <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded uppercase">Da Comprare</span>
                                            )}
                                        </div>

                                        <div className="p-3 flex-1 flex flex-col">
                                            <p className="text-sm text-gray-600 italic mb-3 flex-grow">
                                                "{option.reasoning}"
                                            </p>

                                            {/* Serving Details Row */}
                                            <div className="flex gap-4 mb-3 text-xs text-gray-500 bg-stone-50 p-2 rounded-lg border border-stone-100">
                                                <div className="flex items-center gap-1.5" title="Temperatura Servizio">
                                                    <ThermometerIcon className="w-4 h-4 text-wine-600" />
                                                    <span>{option.servingTemp || '16-18°C'}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5" title="Quando aprire">
                                                    <ClockIcon className="w-4 h-4 text-wine-600" />
                                                    <span className="truncate">{option.servingAdvice || 'Aprire prima'}</span>
                                                </div>
                                            </div>

                                            {ownedWine ? (
                                                <div className="bg-green-50/50 border border-green-100 rounded-lg p-3 flex flex-col gap-2">
                                                    <div className="flex gap-2 items-start">
                                                        <div className="w-10 h-10 bg-white rounded flex items-center justify-center flex-shrink-0 border border-green-100 overflow-hidden">
                                                            {ownedWine.imageUrl ? (
                                                                <img src={ownedWine.imageUrl} className="w-full h-full object-cover" />
                                                            ) : (
                                                                <WineIcon className="text-green-600 w-5 h-5" />
                                                            )}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="font-bold text-gray-900 text-sm leading-tight truncate">{ownedWine.name}</p>
                                                            <p className="text-[10px] text-gray-500">{ownedWine.year} • {ownedWine.producer}</p>
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="flex justify-between items-center text-[10px] text-gray-500 mt-1">
                                                        <div className="flex items-center gap-1">
                                                            <MapPinIcon className="w-3 h-3" /> {ownedWine.location}
                                                        </div>
                                                        <div className="font-bold">€{ownedWine.price}</div>
                                                    </div>

                                                    <button 
                                                        onClick={() => onConsume(ownedWine)}
                                                        className="w-full py-2 bg-green-600 text-white text-xs font-bold rounded-lg hover:bg-green-700 shadow-sm flex items-center justify-center gap-2 mt-2"
                                                    >
                                                        <StarIcon className="w-3 h-3" filled={false} />
                                                        Stappa Ora
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-3 flex gap-3 items-center">
                                                     <div className="w-10 h-10 bg-white rounded flex items-center justify-center flex-shrink-0 border border-blue-100">
                                                        <ShoppingCartIcon className="text-blue-400 w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-gray-900 text-sm leading-tight">{option.wineName}</p>
                                                        <p className="text-[10px] text-gray-500">Suggerimento acquisto</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        )}
      </div>
    </div>
  );
};

export default SommelierView;