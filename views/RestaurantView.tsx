

import React, { useState, useRef } from 'react';
import { suggestRestaurantPairing } from '../services/geminiService';
import { RestaurantSuggestion, HistoryEntry } from '../types';
import { CameraIcon, LogoutIcon, RestaurantIcon, PlusIcon } from '../components/Icons';

interface RestaurantViewProps {
  onLogout: () => void;
  onAddToHistory: (entry: Partial<HistoryEntry>) => void;
  onAiUsed: () => void;
}

const RestaurantView: React.FC<RestaurantViewProps> = ({ onLogout, onAddToHistory, onAiUsed }) => {
  const [dish, setDish] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<RestaurantSuggestion[]>([]);
  const [selectedWine, setSelectedWine] = useState<RestaurantSuggestion | null>(null);
  const [confirmPrice, setConfirmPrice] = useState<string>('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
        const files = Array.from(e.target.files) as File[];
        // Limit to 3 images total
        const remainingSlots = 3 - images.length;
        const filesToProcess = files.slice(0, remainingSlots);

        filesToProcess.forEach(file => {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImages(prev => [...prev, reader.result as string]);
            };
            reader.readAsDataURL(file);
        });
    }
  };

  const removeImage = (index: number) => {
      setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleAnalyze = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!dish || images.length === 0) return;

      setLoading(true);
      setSuggestions([]);
      try {
          const results = await suggestRestaurantPairing(images, dish);
          setSuggestions(results);
          onAiUsed(); // Track
      } catch (error: any) {
          alert(`Errore analisi: ${error.message}`);
      } finally {
          setLoading(false);
      }
  };

  const handleSelectWine = (suggestion: RestaurantSuggestion) => {
      setSelectedWine(suggestion);
      setConfirmPrice(suggestion.price?.toString() || '');
  };

  const handleConfirmSelection = () => {
      if (!selectedWine) return;

      // Add to history directly
      onAddToHistory({
          name: selectedWine.name,
          producer: selectedWine.producer,
          year: selectedWine.year,
          type: selectedWine.type, // Added type
          price: parseFloat(confirmPrice) || 0,
          consumedDate: new Date().toISOString()
      });
      
      // Reset
      setSelectedWine(null);
      setSuggestions([]);
      setDish('');
      setImages([]);
  };

  return (
    <div className="h-full flex flex-col bg-stone-50 overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-6 shadow-sm z-10 flex justify-between items-start">
        <div>
            <h1 className="text-2xl font-serif font-bold text-gray-900 flex items-center gap-2">
                <RestaurantIcon className="w-8 h-8 text-wine-600" filled />
                Al Ristorante
            </h1>
            <p className="text-sm text-gray-500 mt-1">
                Scatta foto al menu, dimmi cosa mangi e ti dirò cosa bere.
            </p>
        </div>
        <button onClick={onLogout} className="text-gray-400 hover:text-wine-700 p-2">
            <LogoutIcon className="w-6 h-6" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 pb-24 space-y-6">
        
        {/* Input Section */}
        {suggestions.length === 0 && (
            <div className="space-y-4">
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                    <label className="block text-sm font-bold text-gray-700 mb-2">Cosa stai mangiando?</label>
                    <textarea 
                        value={dish}
                        onChange={(e) => setDish(e.target.value)}
                        placeholder="Es. Tagliata di manzo con rucola e grana..."
                        className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-wine-600 outline-none resize-none h-24"
                    />
                </div>

                {/* Image Upload Grid */}
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Carta dei Vini ({images.length}/3)</label>
                    <div className="grid grid-cols-3 gap-2">
                        {images.map((img, idx) => (
                            <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 group">
                                <img src={img} className="w-full h-full object-cover" />
                                <button 
                                    onClick={() => removeImage(idx)}
                                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-90 shadow-sm"
                                >
                                    ✕
                                </button>
                            </div>
                        ))}
                        
                        {images.length < 3 && (
                            <button 
                                onClick={() => fileInputRef.current?.click()}
                                className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center hover:bg-gray-50 transition-colors bg-white"
                            >
                                <CameraIcon className="w-6 h-6 text-gray-400 mb-1" />
                                <span className="text-[10px] text-gray-500 font-bold uppercase">Foto</span>
                            </button>
                        )}
                    </div>
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        accept="image/*"
                        capture="environment" 
                        multiple
                        onChange={handleFileChange} 
                    />
                </div>

                <button 
                    onClick={handleAnalyze}
                    disabled={!dish || images.length === 0 || loading}
                    className="w-full py-4 bg-wine-700 text-white font-bold rounded-xl shadow-lg hover:bg-wine-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all mt-4"
                >
                    {loading ? 'Il Sommelier sta leggendo il menu...' : 'Analizza Carta dei Vini'}
                </button>
                
                {loading && (
                    <div className="text-center text-xs text-gray-500 italic animate-pulse">
                        L'operazione potrebbe richiedere qualche secondo...
                    </div>
                )}
            </div>
        )}

        {/* Results Section */}
        {suggestions.length > 0 && (
            <div className="space-y-4 animate-in slide-in-from-bottom duration-500">
                <div className="flex justify-between items-center">
                     <h2 className="text-xl font-serif font-bold text-gray-900">Migliori Abbinamenti</h2>
                     <button 
                        onClick={() => setSuggestions([])}
                        className="text-sm text-wine-600 font-medium hover:underline"
                     >
                        Nuova Ricerca
                     </button>
                </div>

                {suggestions.map((wine, idx) => (
                    <div 
                        key={idx} 
                        onClick={() => handleSelectWine(wine)}
                        className={`bg-white p-4 rounded-xl shadow-sm border border-gray-200 cursor-pointer transition-all hover:shadow-md ${selectedWine === wine ? 'ring-2 ring-wine-600 bg-wine-50' : ''}`}
                    >
                        <div className="flex justify-between items-start mb-2">
                             <div>
                                 <h3 className="font-bold text-gray-900 leading-tight">{wine.name}</h3>
                                 <p className="text-xs text-gray-600">{wine.producer} • {wine.year}</p>
                             </div>
                             {wine.price > 0 && (
                                 <div className="text-lg font-bold text-gray-800">€{wine.price}</div>
                             )}
                        </div>
                        
                        <div className="flex items-center gap-2 mb-3">
                             <div className="bg-green-100 text-green-800 text-xs font-bold px-2 py-0.5 rounded">
                                 Match {wine.matchScore}%
                             </div>
                             <span className="text-xs text-gray-400 uppercase font-bold tracking-wider">{wine.type}</span>
                        </div>
                        
                        <p className="text-sm text-gray-600 italic border-l-2 border-wine-200 pl-3">
                            "{wine.reasoning}"
                        </p>
                    </div>
                ))}
            </div>
        )}

        {/* Confirmation Modal (Bottom Sheet) */}
        {selectedWine && (
            <div className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm flex items-end justify-center">
                 <div className="bg-white w-full max-w-md p-6 pb-12 rounded-t-2xl shadow-xl animate-in slide-in-from-bottom duration-300">
                     <h3 className="font-serif font-bold text-lg mb-4 text-center">Conferma Scelta</h3>
                     <p className="text-sm text-gray-600 text-center mb-4">
                         Hai scelto <strong>{selectedWine.name}</strong>. <br/>
                         Conferma il prezzo per aggiungerlo al tuo storico bevute.
                     </p>
                     
                     <div className="mb-6">
                         <label className="block text-xs font-bold uppercase text-gray-500 mb-1 text-center">Prezzo Pagato (€)</label>
                         <input 
                             type="number" 
                             value={confirmPrice} 
                             onChange={(e) => setConfirmPrice(e.target.value)}
                             className="w-32 mx-auto block text-center p-2 text-xl font-bold border-b-2 border-wine-600 focus:outline-none bg-transparent"
                             autoFocus
                         />
                     </div>
                     
                     <div className="flex gap-3">
                         <button 
                            onClick={() => setSelectedWine(null)}
                            className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl"
                         >
                            Annulla
                         </button>
                         <button 
                            onClick={handleConfirmSelection}
                            className="flex-1 py-3 bg-wine-600 text-white font-bold rounded-xl shadow-lg"
                         >
                            Bevi e Vota
                         </button>
                     </div>
                 </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default RestaurantView;