
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { HistoryEntry } from '../types';
import { StarIcon, ShoppingCartIcon, ExternalLinkIcon } from './Icons';

interface RateWineModalProps {
  entry: HistoryEntry | null;
  onClose: () => void;
  onSave: (id: string, rating: number, notes: string) => void;
}

const getRestockLinks = (name: string, producer: string, year: string) => {
    const query = encodeURIComponent(`${producer} ${name} ${year}`);
    return [
        { name: 'Google Shopping', url: `https://www.google.com/search?tbm=shop&q=${query}`, color: 'bg-blue-600' },
        { name: 'Trovaprezzi', url: `https://www.trovaprezzi.it/prezzi_vini-liquori-bevande?q=${query}`, color: 'bg-orange-500' },
        { name: 'Tannico', url: `https://www.tannico.it/catalogsearch/result/?q=${query}`, color: 'bg-red-800' },
        { name: 'Vivino', url: `https://www.vivino.com/search/wines?q=${query}`, color: 'bg-purple-600' },
        { name: 'Callmewine', url: `https://www.callmewine.com/cerca.html?search_text=${query}`, color: 'bg-wine-700' },
    ];
};

const RateWineModal: React.FC<RateWineModalProps> = ({ entry, onClose, onSave }) => {
  const [rating, setRating] = useState(0);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (entry) {
        setRating(entry.rating || 0);
        setNotes(entry.notes || '');
    }
  }, [entry]);

  if (!entry) return null;

  const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      onSave(entry.id, rating, notes);
      onClose();
  };

  const links = getRestockLinks(entry.name, entry.producer, entry.year);

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
            <form onSubmit={handleSubmit} className="space-y-4">
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

                <button 
                    type="submit" 
                    className="w-full py-3 bg-wine-600 text-white font-bold rounded-xl hover:bg-wine-700 transition-colors shadow-lg shadow-wine-100"
                >
                    Salva Recensione
                </button>
            </form>

            {/* Restock Section */}
            <div className="pt-4 border-t border-gray-100">
                <h4 className="text-xs font-bold uppercase text-gray-500 tracking-wider mb-3 flex items-center gap-2">
                    <ShoppingCartIcon className="w-4 h-4" />
                    Ricompralo Online
                </h4>
                <div className="space-y-2">
                    {links.map((link) => (
                        <a 
                            key={link.name} 
                            href={link.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-xl border border-gray-200 transition-colors group"
                        >
                            <span className="text-sm font-medium text-gray-700">{link.name}</span>
                            <ExternalLinkIcon className="w-4 h-4 text-gray-400 group-hover:text-wine-600" />
                        </a>
                    ))}
                </div>
            </div>
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
};

export default RateWineModal;
