

import React, { useState } from 'react';
import { Wine, WineType, Location } from '../types';
import WineCard from '../components/WineCard';
import AddWineModal from '../components/AddWineModal';
import WineDetailModal from '../components/WineDetailModal';
import LocationManagerModal from '../components/LocationManagerModal';
import { PlusIcon, CogIcon, LogoutIcon } from '../components/Icons';
import { Logo } from '../components/Logo';

interface InventoryViewProps {
  wines: Wine[];
  locations: Location[];
  onAddWine: (wine: Wine) => void;
  onUpdateWine: (wine: Wine) => void;
  onConsume: (wine: Wine) => void;
  onDelete: (id: string) => void;
  onAddLocation: (name: string) => void;
  onDeleteLocation: (id: string) => void;
  onLogout: () => void;
  onAiUsed: () => void; // New prop
}

type FilterType = 'all' | WineType | 'still';

const InventoryView: React.FC<InventoryViewProps> = ({ 
    wines, locations, onAddWine, onUpdateWine, onConsume, onDelete, onAddLocation, onDeleteLocation, onLogout, onAiUsed 
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLocManagerOpen, setIsLocManagerOpen] = useState(false);
  const [selectedWine, setSelectedWine] = useState<Wine | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [locationFilter, setLocationFilter] = useState<string>('all');

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

    // Location Filter
    let matchesLocation = true;
    if (locationFilter !== 'all') {
        matchesLocation = w.location === locationFilter;
    }

    return matchesSearch && matchesFilter && matchesLocation;
  });

  const totalBottles = wines.reduce((acc, curr) => acc + curr.quantity, 0);
  const totalValue = wines.reduce((acc, curr) => acc + (curr.price * curr.quantity), 0);

  return (
    <div className="relative h-full flex flex-col bg-gray-50">
      {/* Header Stats & Search */}
      <div className="bg-white px-4 pt-4 pb-2 sticky top-0 z-10 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          {/* Logo Brand */}
          <div className="transform scale-90 origin-left">
             <Logo className="w-10 h-10" />
          </div>

          <div className="flex gap-2">
             <button 
                onClick={onLogout}
                className="bg-gray-100 text-wine-700 p-2.5 rounded-full hover:bg-wine-50 transition-colors"
                title="Esci"
            >
                <LogoutIcon className="w-6 h-6" />
            </button>
            <button 
                onClick={() => setIsLocManagerOpen(true)}
                className="bg-gray-100 text-gray-600 p-2.5 rounded-full hover:bg-gray-200 transition-colors"
            >
                <CogIcon className="w-6 h-6" />
            </button>
            <button 
                onClick={() => setIsModalOpen(true)}
                className="bg-wine-600 text-white p-2.5 rounded-full shadow-lg hover:bg-wine-700 transition-colors active:scale-95 flex items-center justify-center"
            >
                <PlusIcon className="w-6 h-6" />
            </button>
          </div>
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

        {/* Search Bar & Location Filter */}
        <div className="flex gap-2 mb-3">
             <input 
                type="text" 
                placeholder="Cerca in cantina..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 bg-gray-100 border-none rounded-xl py-2.5 px-4 text-sm text-gray-700 focus:ring-2 focus:ring-wine-500 outline-none"
            />
            <select
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                className="bg-gray-100 border-none rounded-xl py-2.5 px-2 text-sm text-gray-700 focus:ring-2 focus:ring-wine-500 outline-none max-w-[100px] truncate"
            >
                <option value="all">Posizione</option>
                {locations.map(loc => (
                    <option key={loc.id} value={loc.name}>{loc.name}</option>
                ))}
            </select>
        </div>

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
        locations={locations}
        onAiUsed={onAiUsed} // Pass tracking
      />

      <LocationManagerModal 
        isOpen={isLocManagerOpen}
        onClose={() => setIsLocManagerOpen(false)}
        locations={locations}
        onAddLocation={onAddLocation}
        onDeleteLocation={onDeleteLocation}
      />

      {/* Detail Modal */}
      <WineDetailModal 
        wine={selectedWine}
        locations={locations}
        onClose={() => setSelectedWine(null)}
        onConsume={onConsume}
        onUpdateWine={onUpdateWine}
        onDelete={onDelete}
      />
    </div>
  );
};

export default InventoryView;