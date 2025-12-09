import React from 'react';
import { HistoryEntry } from '../types';
import { WineIcon, ClockIcon } from '../components/Icons';

interface HistoryViewProps {
  history: HistoryEntry[];
  onClearHistory: () => void;
}

const HistoryView: React.FC<HistoryViewProps> = ({ history, onClearHistory }) => {
  return (
    <div className="h-full flex flex-col bg-stone-50">
      <div className="bg-white border-b border-gray-200 p-6 shadow-sm z-10 sticky top-0">
        <div className="flex justify-between items-center">
            <h1 className="text-2xl font-serif font-bold text-gray-900 flex items-center gap-2">
                <ClockIcon className="w-8 h-8 text-wine-600" />
                Storico Consumazioni
            </h1>
            {history.length > 0 && (
                <button onClick={onClearHistory} className="text-xs text-red-500 hover:text-red-700 underline">
                    Pulisci
                </button>
            )}
        </div>
        <p className="text-sm text-gray-500 mt-1">
            Diario delle bottiglie aperte e consumate.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 pb-24">
        {history.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p>Nessuna bottiglia consumata di recente.</p>
          </div>
        ) : (
            <div className="space-y-4">
                {history.map((entry) => (
                    <div key={entry.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex gap-4 items-center">
                         <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                            {entry.imageUrl ? (
                                <img src={entry.imageUrl} alt={entry.name} className="w-full h-full object-cover opacity-75 grayscale" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-300">
                                    <WineIcon className="w-6 h-6" />
                                </div>
                            )}
                         </div>
                         <div className="flex-1">
                             <div className="flex justify-between items-start">
                                 <div>
                                    <h3 className="text-gray-900 font-bold line-through decoration-gray-400">{entry.name}</h3>
                                    <p className="text-xs text-gray-500">{entry.producer} • {entry.year}</p>
                                 </div>
                                 <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                                     {new Date(entry.consumedDate).toLocaleDateString('it-IT')}
                                 </span>
                             </div>
                             <p className="text-xs text-gray-400 mt-2">
                                Prezzo: € {entry.price.toFixed(2)}
                             </p>
                         </div>
                    </div>
                ))}
            </div>
        )}
      </div>
    </div>
  );
};

export default HistoryView;