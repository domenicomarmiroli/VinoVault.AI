
import React, { useState } from 'react';
import { Wine } from '../types';
import WineCard from '../components/WineCard';
import AddWineModal from '../components/AddWineModal';
import { PlusIcon } from '../components/Icons';

interface InventoryViewProps {
  wines: Wine[];
  onAddWine: (wine: Wine) => void;
  onConsume: (wine: Wine) => void;
  onDelete: (id: string) => void;
}

const InventoryView: React.FC<InventoryViewProps> = ({ wines, onAddWine, onConsume, onDelete }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredWines = wines.filter(w => 
    w.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    w.producer.toLowerCase().includes(searchTerm.toLowerCase()) ||
    w.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalBottles = wines.reduce((acc, curr) => acc + curr.quantity, 0);
  const totalValue = wines.reduce((acc, curr) => acc + (curr.price * curr.quantity), 0);

  return (
    <div className="relative h-full flex flex-col">
      {/* Header Stats */}
      <div className="bg-white border-b border-gray-200 p-4 sticky top-0 z-10">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-serif font-bold text-gray-900">La Mia Cantina</h1>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-wine-600 text-white p-2 rounded-full shadow-lg hover:bg-wine-700 transition-colors"
          >
            <PlusIcon className="w-6 h-6" />
          </button>
        </div>
        
        <div className="flex gap-4 mb-4 overflow-x-auto pb-2">
            <div className="bg-stone-50 p-3 rounded-lg min-w-[120px] border border-stone-100">
                <span className="text-xs text-gray-500 uppercase tracking-wide">Bottiglie</span>
                <p className="text-xl font-bold text-gray-800">{totalBottles}</p>
            </div>
            <div className="bg-stone-50 p-3 rounded-lg min-w-[120px] border border-stone-100">
                <span className="text-xs text-gray-500 uppercase tracking-wide">Valore</span>
                <p className="text-xl font-bold text-gray-800">€ {totalValue.toFixed(2)}</p>
            </div>
            <div className="bg-stone-50 p-3 rounded-lg min-w-[120px] border border-stone-100">
                <span className="text-xs text-gray-500 uppercase tracking-wide">Etichette</span>
                <p className="text-xl font-bold text-gray-800">{wines.length}</p>
            </div>
        </div>

        <input 
          type="text" 
          placeholder="Cerca vino, produttore..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-gray-100 border-none rounded-lg py-2 px-4 text-gray-700 focus:ring-2 focus:ring-wine-500 outline-none"
        />
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-24">
        {filteredWines.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p>Nessun vino trovato.</p>
            <p className="text-sm">Inizia aggiungendo una bottiglia!</p>
          </div>
        ) : (
          filteredWines.map(wine => (
            <WineCard 
              key={wine.id} 
              wine={wine} 
              onConsume={onConsume} 
              onDelete={onDelete}
            />
          ))
        )}
      </div>

      <AddWineModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onAdd={onAddWine}
      />
    </div>
  );
};

export default InventoryView;
