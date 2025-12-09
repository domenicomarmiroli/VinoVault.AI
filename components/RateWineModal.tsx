
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { HistoryEntry, WineDeal } from '../types';
import { StarIcon, ShoppingCartIcon, ExternalLinkIcon } from './Icons';
import { findBestDeals } from '../services/geminiService';

interface RateWineModalProps {
  entry: HistoryEntry | null;
  onClose: () => void;
  onSave: (id: string, rating: number, notes: string) => void;
}

const RateWineModal: React.FC<RateWineModalProps> = ({ entry, onClose, onSave }) => {
  const [rating, setRating] = useState(0);
  const [notes, setNotes] = useState('');
  
  // Deal Search State
  const [deals, setDeals] = useState<WineDeal[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    if (entry) {
        setRating(entry.rating || 0);
        setNotes(entry.notes || '');
        // Reset search state on new entry
        setDeals([]);
        setIsSearching(false);
        setSearchError('');
        setHasSearched(false);
    }
  }, [entry]);

  if (!entry) return null;

  const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      onSave(entry.id, rating, notes);
      onClose();
  };

  const handleSearchDeals = async () => {
      setIsSearching(true);
      setSearchError('');
      setDeals([]);
      
      try {
          const results = await findBestDeals(entry.name, entry.producer, entry.year);
          setDeals(results);
      } catch (err: any) {
          setSearchError("Non sono riuscito a trovare offerte aggiornate al momento.");
      } finally {
          setIsSearching(false);
          setHasSearched(true);
      }
  };

  const content = (
    <div className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        <div className="bg-gray-50 p-4 border-b border-gray-100 flex justify-between items-center shrink-0">
            <div>
                <h3 className="font-serif font-bold text-lg text-gray-900">Scheda Degustazione</h3>
                <p className="text-xs text-gray-500">{entry.name}</p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>

        <div className="overflow-y-auto p-6 space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Rating Stars */}
                <div className="flex flex-col items-center justify-center space-y-2">
                    <label className="text-xs font-bold uppercase text-gray-500 tracking-wider">Punteggio</label>
                    <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button
                                key={star}
                                type="button"
                                onClick={() => setRating(star)}
                                className={`w-8 h-8 transition-transform active:scale-90 ${
                                    star <= rating ? 'text-yellow-400' : 'text-gray-200'
                                }`}
                            >
                                <StarIcon filled={star <= rating} className="w-full h-full" />
                            </button>
                        ))}
                    </div>
                </div>

                {/* Notes */}
                <div>
                    <label className="block text-xs font-bold uppercase text-gray-500 tracking-wider mb-2">Note & Commenti</label>
                    <textarea 
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Com'era il vino? Aromi, abbinamenti, impressioni..."
                        className="w-full p-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-wine-500 outline-none h-32 resize-none bg-gray-50"
                    />
                </div>

                {/* AI Deal Search Section - MOVED INSIDE FORM AND ABOVE SAVE BUTTON */}
                <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-100">
                    <h4 className="text-xs font-bold uppercase text-indigo-800 tracking-wider mb-3 flex items-center gap-2">
                        <ShoppingCartIcon className="w-4 h-4" filled />
                        Ricompralo al Miglior Prezzo
                    </h4>

                    {!hasSearched && !isSearching && (
                        <button 
                            type="button"
                            onClick={handleSearchDeals}
                            className="w-full py-2.5 bg-white text-indigo-600 font-bold rounded-lg border border-indigo-200 hover:bg-indigo-50 transition-colors flex items-center justify-center gap-2 text-sm shadow-sm"
                        >
                            🔍 Cerca Offerte con AI
                        </button>
                    )}

                    {isSearching && (
                        <div className="flex flex-col items-center justify-center py-4 space-y-2">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600"></div>
                            <p className="text-xs text-indigo-500 animate-pulse">L'AI sta cercando i prezzi migliori...</p>
                        </div>
                    )}

                    {searchError && (
                        <div className="p-2 bg-red-50 text-red-600 text-xs rounded-lg text-center mb-2 border border-red-100">
                            {searchError}
                            <button type="button" onClick={handleSearchDeals} className="block w-full mt-1 font-bold underline">Riprova</button>
                        </div>
                    )}

                    {deals.length > 0 && (
                        <div className="space-y-2 animate-in slide-in-from-bottom duration-300 mt-2">
                            {deals.map((deal, idx) => (
                                <a 
                                    key={idx} 
                                    href={deal.link} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-between p-2.5 bg-white hover:bg-gray-50 rounded-lg border border-indigo-100 transition-all group shadow-sm"
                                >
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold text-gray-800">{deal.merchant}</span>
                                        <span className="text-[10px] text-gray-400">Offerta Online</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-green-600 font-bold bg-green-50 px-2 py-0.5 rounded border border-green-100">
                                            €{deal.price.toFixed(2)}
                                        </span>
                                        <ExternalLinkIcon className="w-3 h-3 text-gray-400" />
                                    </div>
                                </a>
                            ))}
                            <p className="text-[9px] text-gray-400 text-center mt-1">Powered by Google Search Grounding</p>
                        </div>
                    )}
                    
                    {hasSearched && deals.length === 0 && !isSearching && !searchError && (
                         <div className="text-center py-2 text-gray-400 text-xs italic">
                             Nessuna offerta trovata.
                         </div>
                    )}
                </div>

                <button 
                    type="submit" 
                    className="w-full py-3 bg-wine-600 text-white font-bold rounded-xl hover:bg-wine-700 transition-colors shadow-lg shadow-wine-100"
                >
                    Salva Recensione
                </button>
            </form>
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
};

export default RateWineModal;
