
import React, { useState } from 'react';
import { HistoryEntry, WineType, Wine } from '../types';
import { WineIcon, ClockIcon, LogoutIcon, StarIcon, PencilIcon, UserIcon } from '../components/Icons';
import RateWineModal from '../components/RateWineModal';
import { useLanguage } from '../contexts/LanguageContext';
import AnalysisView from './AnalysisView';

interface HistoryViewProps {
  wines: Wine[];
  history: HistoryEntry[];
  onClearHistory: () => void;
  onLogout: () => void;
  onUpdateHistoryEntry: (id: string, rating: number, notes: string) => void;
  onDeleteHistoryEntry: (id: string) => void;
  isPremium: boolean;
  onAiUsed: () => void;
}

type SortOption = 'date_desc' | 'date_asc' | 'rating_desc' | 'rating_asc';
type FilterType = 'all' | WineType;

const HistoryView: React.FC<HistoryViewProps> = ({ wines, history, onClearHistory, onLogout, onUpdateHistoryEntry, onDeleteHistoryEntry, isPremium, onAiUsed }) => {
  const [viewMode, setViewMode] = useState<'diary' | 'analysis'>('diary');
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
      if (sortOrder === 'rating_desc') return (Number(b.rating) || 0) - (Number(a.rating) || 0);
      if (sortOrder === 'rating_asc') return (Number(a.rating) || 0) - (Number(b.rating) || 0);
      return 0;
  });

  if (viewMode === 'analysis') {
      return (
          <div className="h-full flex flex-col bg-slate-50">
              <div className="bg-white border-b border-gray-200 px-6 pt-6 pb-2 shadow-sm z-10 sticky top-0 flex justify-between items-center">
                  <button onClick={() => setViewMode('diary')} className="text-wine-600 font-bold text-sm flex items-center gap-1">
                      ← {t('nav_history')}
                  </button>
                  <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400">Analisi Sommelier</h2>
                  <div className="w-10"></div>
              </div>
              <div className="flex-1 overflow-hidden">
                <AnalysisView inventory={wines} history={history} onLogout={onLogout} onAiUsed={onAiUsed} isPremium={isPremium} />
              </div>
          </div>
      );
  }

  return (
    <div className="h-full flex flex-col bg-stone-50">
      <div className="bg-white border-b border-gray-200 px-6 pt-6 pb-2 shadow-sm z-10 sticky top-0">
        <div className="flex justify-between items-start mb-4">
            <div>
                <h1 className="text-2xl font-serif font-bold text-gray-900 flex items-center gap-2">
                    <ClockIcon className="w-8 h-8 text-wine-600" />
                    Il Tuo Diario
                </h1>
                <p className="text-sm text-gray-500 mt-1">Ogni calice ha una storia da ricordare.</p>
            </div>
             <div className="flex gap-2">
                <button onClick={() => setViewMode('analysis')} className="bg-purple-50 text-purple-700 p-2 rounded-full border border-purple-100 hover:bg-purple-100 transition-colors" title="Analisi IA">
                    <UserIcon className="w-6 h-6" filled />
                </button>
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
          <div className="text-center py-12 text-gray-400">
            <WineIcon className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p>Non hai ancora registrato bevute.</p>
          </div>
        ) : (
            <div className="space-y-4">
                {filteredHistory.map((entry) => (
                    <div key={entry.id} onClick={() => setSelectedEntry(entry)} className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex flex-col gap-3 cursor-pointer hover:shadow-md transition-all relative group">
                         <div className="absolute top-4 right-4 text-gray-300 md:opacity-0 md:group-hover:opacity-100 transition-opacity"><PencilIcon className="w-4 h-4" /></div>
                         
                         <div className="flex gap-4 items-center">
                            <div className="w-14 h-14 bg-gray-50 rounded-xl overflow-hidden flex-shrink-0 relative border border-gray-100">
                                {entry.imageUrl ? <img src={entry.imageUrl} alt={entry.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-300"><WineIcon className="w-6 h-6" /></div>}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="text-gray-900 font-bold truncate leading-tight">{entry.name}</h3>
                                <p className="text-xs text-gray-500 truncate">{entry.producer} • {entry.year}</p>
                            </div>
                            <div className="flex flex-col items-end">
                                {entry.rating && Number(entry.rating) > 0 ? (
                                    <div className="flex text-yellow-400 gap-0.5">
                                        {Array.from({ length: Number(entry.rating) }).map((_, i) => (<StarIcon key={i} filled className="w-3 h-3" />))}
                                    </div>
                                ) : (
                                    <span className="text-[9px] text-gray-400 border border-gray-200 px-1.5 py-0.5 rounded-full uppercase font-bold">Da votare</span>
                                )}
                                <span className="text-[10px] text-gray-400 mt-1 font-mono uppercase">{new Date(entry.consumedDate).toLocaleDateString()}</span>
                            </div>
                         </div>

                         {entry.notes && (
                            <div className="bg-stone-50 p-3 rounded-xl border border-stone-100 italic text-sm text-gray-600 line-clamp-3">
                                "{entry.notes}"
                            </div>
                         )}
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
