import React, { useState, useEffect } from 'react';
import { Wine, HistoryEntry } from './types';
import InventoryView from './views/InventoryView';
import SommelierView from './views/SommelierView';
import HistoryView from './views/HistoryView';
import { WineIcon, ChefIcon, HistoryIcon } from './components/Icons';

// Helper per generare ID sicuri anche su mobile/http
const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2, 9);

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'inventory' | 'sommelier' | 'history'>('inventory');
  const [wines, setWines] = useState<Wine[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  
  // New state to track if we are using the DB or LocalStorage
  const [isOfflineMode, setIsOfflineMode] = useState(false);

  // Load Data
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Try connecting to the backend
        const [winesRes, historyRes] = await Promise.all([
          fetch('/api/wines'),
          fetch('/api/history')
        ]);

        if (!winesRes.ok || !historyRes.ok) throw new Error("API Unreachable");

        const winesData = await winesRes.json();
        const historyData = await historyRes.json();

        setWines(winesData);
        setHistory(historyData);
        setIsOfflineMode(false);
      } catch (e) {
        console.warn("Backend unavailable, falling back to LocalStorage", e);
        setIsOfflineMode(true);
        
        // Load from LocalStorage as fallback
        const localWines = localStorage.getItem('vinovault_wines');
        const localHistory = localStorage.getItem('vinovault_history');
        if (localWines) setWines(JSON.parse(localWines));
        if (localHistory) setHistory(JSON.parse(localHistory));
      } finally {
        setIsLoaded(true);
      }
    };

    fetchData();
  }, []);

  // Sync with LocalStorage if in Offline Mode
  useEffect(() => {
    if (isOfflineMode && isLoaded) {
      localStorage.setItem('vinovault_wines', JSON.stringify(wines));
      localStorage.setItem('vinovault_history', JSON.stringify(history));
    }
  }, [wines, history, isOfflineMode, isLoaded]);

  const handleAddWine = async (newWine: Wine) => {
     // Ensure ID is set if missing (safety check)
     const wineToAdd = { ...newWine, id: newWine.id || generateId() };

     if (isOfflineMode) {
         setWines(prev => [wineToAdd, ...prev]);
         return;
     }

     try {
         const res = await fetch('/api/wines', {
             method: 'POST',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify(wineToAdd)
         });
         if (!res.ok) throw new Error("Errore salvataggio");
         setWines(prev => [wineToAdd, ...prev]);
     } catch (e) {
         console.error(e);
         alert("Errore salvataggio su DB. Passaggio alla modalità locale.");
         setIsOfflineMode(true);
         setWines(prev => [wineToAdd, ...prev]);
     }
  };

  const handleConsume = async (wine: Wine) => {
    const historyEntry: HistoryEntry = {
      id: generateId(), // Sostituito crypto.randomUUID
      wineId: wine.id,
      name: wine.name,
      producer: wine.producer,
      year: wine.year,
      price: wine.price,
      imageUrl: wine.imageUrl,
      consumedDate: new Date().toISOString()
    };
    
    // Optimistic Update locally first
    const oldWines = [...wines];
    const oldHistory = [...history];

    setHistory(prev => [historyEntry, ...prev]);
    setWines(prev => prev.map(w => {
        if (w.id === wine.id) return { ...w, quantity: w.quantity - 1 };
        return w;
    }).filter(w => w.quantity > 0));

    if (!isOfflineMode) {
        try {
            const [histRes, wineRes] = await Promise.all([
                fetch('/api/history', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(historyEntry)
                }),
                fetch(`/api/wines/${wine.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ quantity: wine.quantity - 1 })
                })
            ]);

            if (!histRes.ok || !wineRes.ok) throw new Error("Sync failed");
            alert(`Hai aperto 1 bottiglia di ${wine.name}.`);
        } catch (e) {
            console.error(e);
            alert("Errore sincronizzazione DB. I dati sono stati salvati solo in locale.");
            setIsOfflineMode(true);
            // We keep the local state updates because we switched to offline mode
        }
    } else {
        alert(`Hai aperto 1 bottiglia di ${wine.name} (Modalità Locale).`);
    }
  };

  const handleDelete = async (id: string) => {
    if(!confirm("Rimuovere definitivamente?")) return;

    if (isOfflineMode) {
        setWines(prev => prev.filter(w => w.id !== id));
        return;
    }

    // Optimistic delete
    const oldWines = [...wines];
    setWines(prev => prev.filter(w => w.id !== id));

    try {
        const res = await fetch(`/api/wines/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error("Delete failed");
    } catch (e) {
        console.error(e);
        alert("Errore eliminazione su DB. Ripristino...");
        setWines(oldWines);
    }
  };

  const handleClearHistory = async () => {
    if(!confirm("Vuoi cancellare tutto lo storico?")) return;

    if (isOfflineMode) {
        setHistory([]);
        return;
    }

    try {
        await fetch('/api/history', { method: 'DELETE' });
        setHistory([]);
    } catch(e) {
        alert("Errore durante la cancellazione");
    }
  };
  
  if (!isLoaded) return (
    <div className="h-screen flex items-center justify-center bg-gray-50 text-wine-800 flex-col gap-2">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-wine-800"></div>
      <p>Caricamento Cantina...</p>
    </div>
  );

  return (
    <div className="flex flex-col h-full w-full md:max-w-md mx-auto bg-white shadow-2xl overflow-hidden md:border-x md:border-gray-200">
      
      {/* Offline Mode Banner */}
      {isOfflineMode && (
        <div className="bg-amber-100 text-amber-800 text-xs text-center py-1 px-2 border-b border-amber-200">
          ⚠️ Modalità Locale: Database non connesso. I dati sono salvati nel browser.
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden relative">
        <div className={`absolute inset-0 transition-opacity duration-300 ${activeTab === 'inventory' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
             {activeTab === 'inventory' && (
                <InventoryView 
                    wines={wines} 
                    onAddWine={handleAddWine}
                    onConsume={handleConsume} 
                    onDelete={handleDelete}
                />
             )}
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