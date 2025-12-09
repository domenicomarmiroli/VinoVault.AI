
import React, { useState } from 'react';
import { HistoryEntry } from '../types';
import { WineIcon, ClockIcon, LogoutIcon, StarIcon, PencilIcon } from '../components/Icons';
import RateWineModal from '../components/RateWineModal';

interface HistoryViewProps {
  history: HistoryEntry[];
  onClearHistory: () => void;
  onLogout: () => void;
  onUpdateHistoryEntry: (id: string, rating: number, notes: string) => void;
}

const HistoryView: React.FC<HistoryViewProps> = ({ history, onClearHistory, onLogout, onUpdateHistoryEntry }) => {
  const [selectedEntry, setSelectedEntry] = useState<HistoryEntry | null>(null);

  return (
    <div className="h-full flex flex-col bg-stone-50">
      <div className="bg-white border-b border-gray-200 p-6 shadow-sm z-10 sticky top-0">
        <div className="flex justify-between items-start">
            <div>
                <h1 className="text-2xl font-serif font-bold text-gray-900 flex items-center gap-2">
                    <ClockIcon className="w-8 h-8 text-wine-600" />
                    Storico
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                    Diario delle bottiglie consumate.
                </p>
            </div>
             <div className="flex gap-2">
                {history.length > 0 && (
                    <button onClick={onClearHistory} className="text-xs text-red-500 hover:text-red-700 underline self-center mr-2">
                        Pulisci
                    </button>
                )}
                <button 
                    onClick={onLogout}
                    className="text-gray-400 hover:text-wine-700"
                    title="Esci"
                >
                    <LogoutIcon className="w-6 h-6" />
                </button>
             </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 pb-24">
        {history.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p>Nessuna bottiglia consumata di recente.</p>
          </div>
        ) : (
            <div className="space-y-4">
                {history.map((entry) => (
                    <div 
                        key={entry.id} 
                        onClick={() => setSelectedEntry(entry)}
                        className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex gap-4 items-start cursor-pointer hover:shadow-md transition-shadow relative group"
                    >
                         {/* Edit Badge Overlay */}
                         <div className="absolute top-2 right-2 text-gray-300 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                            <PencilIcon className="w-4 h-4" />
                         </div>

                         <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 mt-1">
                            {entry.imageUrl ? (
                                <img src={entry.imageUrl} alt={entry.name} className="w-full h-full object-cover opacity-75 grayscale" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-300">
                                    <WineIcon className="w-6 h-6" />
                                </div>
                            )}
                         </div>
                         <div className="flex-1 min-w-0">
                             <div className="flex justify-between items-start mb-1">
                                <div>
                                    <h3 className="text-gray-900 font-bold line-through decoration-gray-400 truncate">{entry.name}</h3>
                                    <p className="text-xs text-gray-500 truncate">{entry.producer} • {entry.year}</p>
                                </div>
                             </div>
                             
                             <div className="flex items-center gap-2 mb-2">
                                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                                     {new Date(entry.consumedDate).toLocaleDateString('it-IT')}
                                 </span>
                                 {entry.rating ? (
                                     <div className="flex text-yellow-400">
                                         {[...Array(entry.rating)].map((_, i) => (
                                             <StarIcon key={i} filled className="w-3 h-3" />
                                         ))}
                                     </div>
                                 ) : (
                                     <span className="text-[10px] text-wine-600 font-medium bg-wine-50 px-2 py-0.5 rounded-full">Vota</span>
                                 )}
                             </div>

                             {entry.notes && (
                                 <p className="text-xs text-gray-600 italic border-l-2 border-wine-200 pl-2 mt-2 line-clamp-2">
                                     "{entry.notes}"
                                 </p>
                             )}
                         </div>
                    </div>
                ))}
            </div>
        )}
      </div>

      <RateWineModal 
        entry={selectedEntry} 
        onClose={() => setSelectedEntry(null)} 
        onSave={onUpdateHistoryEntry}
      />
    </div>
  );
};

export default HistoryView;
