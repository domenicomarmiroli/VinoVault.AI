
import React, { useState } from 'react';
import { HistoryEntry, WineType } from '../types';
import { WineIcon, ClockIcon, LogoutIcon, StarIcon, PencilIcon } from '../components/Icons';
import RateWineModal from '../components/RateWineModal';
import { useLanguage } from '../contexts/LanguageContext';

interface HistoryViewProps {
  history: HistoryEntry[];
  onClearHistory: () => void;
  onLogout: () => void;
  onUpdateHistoryEntry: (id: string, rating: number, notes: string) => void;
  onDeleteHistoryEntry: (id: string) => void;
  isPremium: boolean;
}

type SortOption = 'date_desc' | 'date_asc' | 'rating_desc' | 'rating_asc';
type FilterType = 'all' | WineType;

const HistoryView: React.FC<HistoryViewProps> = ({ history, onClearHistory, onLogout, onUpdateHistoryEntry, onDeleteHistoryEntry, isPremium }) => {
  const [selectedEntry, setSelectedEntry] = useState<HistoryEntry | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [sortOrder, setSortOrder] = useState<SortOption>('date_desc');
  const { t } = useLanguage();

  const filters: { label: string, value: FilterType }[] = [
      { label: t('filter_all'), value: 'all' },
      { label: t('filter_red'), value: WineType.RED },
      { label: t('filter_white'), value: WineType.WHITE },
      { label: t('filter_bubbles'), value: WineType.SPARKLING },
  ];

  const filteredHistory = history.filter(h => {
      const matchesSearch = 
          h.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
          h.producer.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (h.notes && h.notes.toLowerCase().includes(searchTerm.toLowerCase()));
      let matchesFilter = true;
      if (activeFilter !== 'all') {
          matchesFilter = h.type === activeFilter;
      }
      return matchesSearch && matchesFilter;
  }).sort((a, b) => {
      if (sortOrder === 'date_desc') return new Date(b.consumedDate).getTime() - new Date(a.consumedDate).getTime();
      if (sortOrder === 'date_asc') return new Date(a.consumedDate).getTime() - new Date(b.consumedDate).getTime();
      if (sortOrder === 'rating_desc') return (b.rating || 0) - (a.rating || 0);
      if (sortOrder === 'rating_asc') return (a.rating || 0) - (b.rating || 0);
      return 0;
  });

  return (
    <div className="h-full flex flex-col bg-stone-50">
      <div className="bg-white border-b border-gray-200 px-6 pt-6 pb-2 shadow-sm z-10 sticky top-0">
        <div className="flex justify-between items-start mb-4">
            <div>
                <h1 className="text-2xl font-serif font-bold text-gray-900 flex items-center gap-2">
                    <ClockIcon className="w-8 h-8 text-wine-600" />
                    {t('nav_history')}
                </h1>
                <p className="text-sm text-gray-500 mt-1">{t('history_desc')}</p>
            </div>
             <div className="flex gap-2">
                {history.length > 0 && (
                    <button onClick={onClearHistory} className="text-xs text-red-500 hover:text-red-700 underline self-center mr-2">
                        {t('clear')}
                    </button>
                )}
                <button onClick={onLogout} className="text-gray-400 hover:text-wine-700" title={t('logout')}><LogoutIcon className="w-6 h-6" /></button>
             </div>
        </div>

        <div className="flex gap-2 mb-3">
             <input type="text" placeholder={t('search_history')} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="flex-1 bg-gray-100 border-none rounded-xl py-2 px-4 text-sm text-gray-700 focus:ring-2 focus:ring-wine-500 outline-none"/>
            <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value as SortOption)} className="bg-gray-100 border-none rounded-xl py-2 px-2 text-sm text-gray-700 focus:ring-2 focus:ring-wine-500 outline-none max-w-[120px]">
                <option value="date_desc">{t('sort_recent')}</option>
                <option value="date_asc">{t('sort_oldest')}</option>
                <option value="rating_desc">{t('sort_rating_high')}</option>
                <option value="rating_asc">{t('sort_rating_low')}</option>
            </select>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar -mx-6 px-6">
            {filters.map(f => (
                <button key={f.label} onClick={() => setActiveFilter(f.value)} className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-medium transition-colors border ${activeFilter === f.value ? 'bg-wine-600 text-white border-wine-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>{f.label}</button>
            ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 pb-24">
        {filteredHistory.length === 0 ? (
          <div className="text-center py-12 text-gray-400"><p>{t('no_history')}</p></div>
        ) : (
            <div className="space-y-4">
                {filteredHistory.map((entry) => (
                    <div key={entry.id} onClick={() => setSelectedEntry(entry)} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex gap-4 items-start cursor-pointer hover:shadow-md transition-shadow relative group">
                         <div className="absolute top-2 right-2 text-gray-300 md:opacity-0 md:group-hover:opacity-100 transition-opacity"><PencilIcon className="w-4 h-4" /></div>
                         <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 mt-1 relative">
                            {entry.imageUrl ? <img src={entry.imageUrl} alt={entry.name} className="w-full h-full object-cover opacity-90 grayscale-[20%]" /> : <div className="w-full h-full flex items-center justify-center text-gray-300"><WineIcon className="w-6 h-6" /></div>}
                            {entry.type && <div className="absolute bottom-0 left-0 right-0 bg-black/40 text-[8px] text-white text-center py-0.5 truncate px-1 backdrop-blur-sm">{entry.type}</div>}
                         </div>
                         <div className="flex-1 min-w-0">
                             <div className="flex justify-between items-start mb-1">
                                <div><h3 className="text-gray-900 font-bold line-through decoration-gray-400 decoration-2 truncate">{entry.name}</h3><p className="text-xs text-gray-500 truncate">{entry.producer} • {entry.year}</p></div>
                                {entry.price > 0 && <div className="text-sm font-bold text-gray-600 whitespace-nowrap ml-2">€{entry.price.toFixed(2)}</div>}
                             </div>
                             <div className="flex items-center flex-wrap gap-2 mb-2">
                                <span className="text-xs bg-wine-50 text-wine-800 border border-wine-100 px-2 py-0.5 rounded font-medium flex items-center gap-1"><ClockIcon className="w-3 h-3" /> {t('drunk_on')} {new Date(entry.consumedDate).toLocaleDateString()}</span>
                                 {entry.rating ? <div className="flex text-yellow-400">{[...Array(entry.rating)].map((_, i) => (<StarIcon key={i} filled className="w-3 h-3" />))}</div> : <span className="text-[10px] text-gray-400 font-medium border border-dashed border-gray-300 px-2 py-0.5 rounded-full">{t('not_rated')}</span>}
                             </div>
                             {entry.notes && <p className="text-xs text-gray-600 italic border-l-2 border-wine-200 pl-2 mt-2 line-clamp-2">"{entry.notes}"</p>}
                         </div>
                    </div>
                ))}
            </div>
        )}
      </div>

      <RateWineModal entry={selectedEntry} onClose={() => setSelectedEntry(null)} onSave={onUpdateHistoryEntry} onDelete={onDeleteHistoryEntry} isPremium={isPremium} />
    </div>
  );
};

export default HistoryView;
