
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { HistoryEntry } from '../types';
import { StarIcon } from './Icons';
import PriceComparison from './PriceComparison'; // New import

interface RateWineModalProps {
  entry: HistoryEntry | null;
  onClose: () => void;
  onSave: (id: string, rating: number, notes: string) => void;
}

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
                
                {/* NEW: Price Comparison Feature */}
                <div className="border-t border-gray-100 pt-4">
                     <PriceComparison 
                        name={entry.name} 
                        producer={entry.producer} 
                        year={entry.year} 
                     />
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
