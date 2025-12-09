import React, { useState } from 'react';
import { Wine, WineType } from '../types';
import WineCard from '../components/WineCard';
import AddWineModal from '../components/AddWineModal';
import WineDetailModal from '../components/WineDetailModal';
import { PlusIcon } from '../components/Icons';

interface InventoryViewProps {
  wines: Wine[];
  onAddWine: (wine: Wine) => void;
  onConsume: (wine: Wine) => void;
  onDelete: (id: string) => void;
}

type FilterType = 'all' | WineType | 'still';

const InventoryView: React.FC<InventoryViewProps> = ({ wines, onAddWine, onConsume, onDelete }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedWine, setSelectedWine] = useState<Wine | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');

  const filters: { label: string, value: FilterType }[] = [
    { label: 'Tutti', value: 'all' },
    { label: 'Rossi', value: WineType.RED },
    { label: 'Bianchi', value: WineType.WHITE },
    { label: 'Bollicine', value: WineType.SPARKLING },
    { label: 'Fermi', value: 'still' },
  ];

  const filteredWines = wines.filter(w => {
    // Text Search
    const matchesSearch = 
        w.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        w.producer.toLowerCase().includes(searchTerm.toLowerCase()) ||
        w.type.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Category Filter
    let matchesFilter = true;
    if (activeFilter !== 'all') {
        if (activeFilter === 'still') {
            matchesFilter = w.type !== WineType.SPARKLING;
        } else {
            matchesFilter = w.type === activeFilter;
        }
    }

    return matchesSearch && matchesFilter;
  });

  const totalBottles = wines.reduce((acc, curr) => acc + curr.quantity, 0);
  const totalValue = wines.reduce((acc, curr) => acc + (curr.price * curr.quantity), 0);

  return (
    <div className="relative h-full flex flex-col bg-gray-50">
      {/* Header Stats & Search */}
      <div className="bg-white px-4 pt-4 pb-2 sticky top-0 z-10 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-serif font-bold text-gray-900">La Mia Cantina</h1>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-wine-600 text-white p-2.5 rounded-full shadow-lg hover:bg-wine-700 transition-colors active:scale-95 flex items-center justify-center"
          >
            <PlusIcon className="w-6 h-6" />
          </button>
        </div>
        
        {/* Quick Stats */}
        <div className="flex gap-2 mb-4 text-xs text-gray-500 bg-gray-50 p-2 rounded-lg justify-around">
            <div className="text-center">
                <span className="block font-bold text-gray-900 text-lg">{totalBottles}</span>
                Bottiglie
            </div>
            <div className="w-px bg-gray-200"></div>
            <div className="text-center">
                <span className="block font-bold text-gray-900 text-lg">{wines.length}</span>
                Etichette
            </div>
            <div className="w-px bg-gray-200"></div>
            <div className="text-center">
                <span className="block font-bold text-gray-900 text-lg">€{totalValue.toFixed(0)}</span>
                Valore
            </div>
        </div>

        {/* Search Bar */}
        <input 
          type="text" 
          placeholder="Cerca vino, produttore..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-gray-100 border-none rounded-xl py-2.5 px-4 text-sm text-gray-700 focus:ring-2 focus:ring-wine-500 outline-none mb-3"
        />

        {/* Filter Pills - Horizontal Scroll */}
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar -mx-4 px-4">
            {filters.map(f => (
                <button
                    key={f.label}
                    onClick={() => setActiveFilter(f.value)}
                    className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                        activeFilter === f.value 
                        ? 'bg-wine-600 text-white border-wine-600' 
                        : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                    }`}
                >
                    {f.label}
                </button>
            ))}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-32">
        {filteredWines.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p>Nessun vino trovato.</p>
            {activeFilter !== 'all' && <p className="text-xs mt-1">Prova a cambiare i filtri.</p>}
          </div>
        ) : (
          filteredWines.map(wine => (
            <WineCard 
              key={wine.id} 
              wine={wine} 
              onClick={(w) => setSelectedWine(w)}
            />
          ))
        )}
      </div>

      <AddWineModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onAdd={onAddWine}
      />

      {/* Detail Modal */}
      <WineDetailModal 
        wine={selectedWine} 
        onClose={() => setSelectedWine(null)}
        onConsume={onConsume}
        onDelete={onDelete}
      />
    </div>
  );
};

export default InventoryView;