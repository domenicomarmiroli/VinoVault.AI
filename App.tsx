import React, { useState, useEffect } from 'react';
import { Wine, HistoryEntry } from './types';
import InventoryView from './views/InventoryView';
import SommelierView from './views/SommelierView';
import HistoryView from './views/HistoryView';
import { WineIcon, ChefIcon, HistoryIcon } from './components/Icons';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'inventory' | 'sommelier' | 'history'>('inventory');
  const [wines, setWines] = useState<Wine[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from LocalStorage
  useEffect(() => {
    const savedWines = localStorage.getItem('vinovault_wines');
    const savedHistory = localStorage.getItem('vinovault_history');
    
    if (savedWines) {
      try {
        setWines(JSON.parse(savedWines));
      } catch (e) { console.error("Failed to load inventory", e); }
    }

    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) { console.error("Failed to load history", e); }
    }

    setIsLoaded(true);
  }, []);

  // Save to LocalStorage
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('vinovault_wines', JSON.stringify(wines));
      localStorage.setItem('vinovault_history', JSON.stringify(history));
    }
  }, [wines, history, isLoaded]);

  // Handle Consumption
  const handleConsume = (wine: Wine) => {
    // 1. Add to History
    const historyEntry: HistoryEntry = {
      id: crypto.randomUUID(),
      wineId: wine.id,
      name: wine.name,
      producer: wine.producer,
      year: wine.year,
      price: wine.price,
      imageUrl: wine.imageUrl,
      consumedDate: new Date().toISOString()
    };
    
    setHistory(prev => [historyEntry, ...prev]);

    // 2. Decrement or Remove from Inventory
    setWines(prev => prev.map(w => {
      if (w.id === wine.id) {
        return { ...w, quantity: w.quantity - 1 };
      }
      return w;
    }).filter(w => w.quantity > 0));

    alert(`Hai aperto 1 bottiglia di ${wine.name}. È stata aggiunta allo Storico.`);
  };

  const handleClearHistory = () => {
    if(confirm("Vuoi cancellare tutto lo storico?")) {
        setHistory([]);
    }
  };

  if (!isLoaded) return <div className="h-screen flex items-center justify-center bg-gray-50 text-wine-800">Caricamento Cantina...</div>;

  return (
    <div className="flex flex-col h-full max-w-md mx-auto bg-white shadow-2xl overflow-hidden md:border-x md:border-gray-200">
      
      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden relative">
        <div className={`absolute inset-0 transition-opacity duration-300 ${activeTab === 'inventory' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
             {activeTab === 'inventory' && <InventoryView wines={wines} setWines={setWines} onConsume={handleConsume} />}
        </div>
        <div className={`absolute inset-0 transition-opacity duration-300 ${activeTab === 'sommelier' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
             {activeTab === 'sommelier' && <SommelierView inventory={wines} />}
        </div>
        <div className={`absolute inset-0 transition-opacity duration-300 ${activeTab === 'history' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
             {activeTab === 'history' && <HistoryView history={history} onClearHistory={handleClearHistory} />}
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav className="bg-white border-t border-gray-200 flex justify-around p-2 pb-safe z-50">
        <button 
          onClick={() => setActiveTab('inventory')}
          className={`flex flex-col items-center p-2 rounded-lg transition-colors w-20 ${activeTab === 'inventory' ? 'text-wine-600 bg-wine-50' : 'text-gray-400 hover:text-gray-600'}`}
        >
          <WineIcon className="w-6 h-6 mb-1" />
          <span className="text-[10px] font-medium uppercase tracking-wide">Cantina</span>
        </button>

        <button 
          onClick={() => setActiveTab('sommelier')}
          className={`flex flex-col items-center p-2 rounded-lg transition-colors w-20 ${activeTab === 'sommelier' ? 'text-wine-600 bg-wine-50' : 'text-gray-400 hover:text-gray-600'}`}
        >
          <ChefIcon className="w-6 h-6 mb-1" />
          <span className="text-[10px] font-medium uppercase tracking-wide">Sommelier</span>
        </button>

        <button 
          onClick={() => setActiveTab('history')}
          className={`flex flex-col items-center p-2 rounded-lg transition-colors w-20 ${activeTab === 'history' ? 'text-wine-600 bg-wine-50' : 'text-gray-400 hover:text-gray-600'}`}
        >
          <HistoryIcon className="w-6 h-6 mb-1" />
          <span className="text-[10px] font-medium uppercase tracking-wide">Storico</span>
        </button>
      </nav>
    </div>
  );
};

export default App;