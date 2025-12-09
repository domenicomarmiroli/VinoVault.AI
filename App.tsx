
import React, { useState, useEffect } from 'react';
import { Wine, HistoryEntry, Location } from './types';
import InventoryView from './views/InventoryView';
import SommelierView from './views/SommelierView';
import HistoryView from './views/HistoryView';
import AuthForm from './components/AuthForm';
import RateWineModal from './components/RateWineModal';
import { WineIcon, ChefIcon, HistoryIcon } from './components/Icons';

// Helper per generare ID sicuri anche su mobile/http
const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2, 9);

const App: React.FC = () => {
  // Auth State
  const [token, setToken] = useState<string | null>(localStorage.getItem('vinovault_token'));
  const [userEmail, setUserEmail] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<'inventory' | 'sommelier' | 'history'>('inventory');
  const [wines, setWines] = useState<Wine[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  
  // Instant Review State
  const [ratingModalEntry, setRatingModalEntry] = useState<HistoryEntry | null>(null);

  // Helper per fetch autenticate
  const authFetch = async (url: string, options: RequestInit = {}) => {
      const headers = {
          'Content-Type': 'application/json',
          ...(options.headers || {}),
          'Authorization': `Bearer ${token}`
      };
      return fetch(url, { ...options, headers });
  };

  // Login handler
  const handleLogin = (newToken: string, email: string) => {
      localStorage.setItem('vinovault_token', newToken);
      setToken(newToken);
      setUserEmail(email);
      // Reset data on new login
      setWines([]);
      setHistory([]);
      setLocations([]);
      setIsLoaded(false);
  };

  const handleLogout = () => {
      localStorage.removeItem('vinovault_token');
      setToken(null);
      setUserEmail(null);
  };

  // Load Data
  useEffect(() => {
    if (!token) return;

    const fetchData = async () => {
      try {
        // Try connecting to the backend with Token
        const [winesRes, historyRes, locationsRes] = await Promise.all([
          authFetch('/api/wines'),
          authFetch('/api/history'),
          authFetch('/api/locations')
        ]);

        if (winesRes.status === 401 || winesRes.status === 403) {
            handleLogout();
            return;
        }

        if (!winesRes.ok || !historyRes.ok || !locationsRes.ok) throw new Error("API Unreachable");

        const winesData = await winesRes.json();
        const historyData = await historyRes.json();
        const locationsData = await locationsRes.json();

        setWines(winesData);
        setHistory(historyData);
        setLocations(locationsData);
        setIsOfflineMode(false);
      } catch (e) {
        console.warn("Backend unavailable, falling back to LocalStorage", e);
        setIsOfflineMode(true);
        // Fallback logic for offline removed for simplicity in multi-user context or kept for cache
      } finally {
        setIsLoaded(true);
      }
    };

    fetchData();
  }, [token]);


  const handleAddWine = async (newWine: Wine) => {
     const wineToAdd = { ...newWine, id: newWine.id || generateId() };

     if (isOfflineMode) {
         setWines(prev => [wineToAdd, ...prev]);
         return;
     }

     try {
         const res = await authFetch('/api/wines', {
             method: 'POST',
             body: JSON.stringify(wineToAdd)
         });
         if (!res.ok) throw new Error("Errore salvataggio");
         setWines(prev => [wineToAdd, ...prev]);
     } catch (e) {
         console.error(e);
         alert("Errore salvataggio.");
     }
  };

  const handleConsume = async (wine: Wine) => {
    const historyEntry: HistoryEntry = {
      id: generateId(),
      wineId: wine.id,
      name: wine.name,
      producer: wine.producer,
      year: wine.year,
      price: wine.price,
      imageUrl: wine.imageUrl,
      consumedDate: new Date().toISOString(),
      rating: 0,
      notes: ''
    };
    
    // Optimistic Update
    setHistory(prev => [historyEntry, ...prev]);
    setWines(prev => prev.map(w => {
        if (w.id === wine.id) return { ...w, quantity: w.quantity - 1 };
        return w;
    }).filter(w => w.quantity > 0));
    
    // Trigger Instant Review Modal
    setRatingModalEntry(historyEntry);

    if (!isOfflineMode) {
        try {
            await Promise.all([
                authFetch('/api/history', {
                    method: 'POST',
                    body: JSON.stringify(historyEntry)
                }),
                authFetch(`/api/wines/${wine.id}`, {
                    method: 'PUT',
                    body: JSON.stringify({ quantity: wine.quantity - 1 })
                })
            ]);
        } catch (e) {
            console.error(e);
            alert("Errore sincronizzazione.");
        }
    }
  };

  const handleUpdateHistoryEntry = async (id: string, rating: number, notes: string) => {
    // Optimistic Update
    setHistory(prev => prev.map(h => 
        h.id === id ? { ...h, rating, notes } : h
    ));

    if (!isOfflineMode) {
        try {
            await authFetch(`/api/history/${id}`, {
                method: 'PUT',
                body: JSON.stringify({ rating, notes })
            });
        } catch (e) {
            console.error(e);
            alert("Errore salvataggio recensione.");
        }
    }
  };

  const handleDelete = async (id: string) => {
    if(!confirm("Rimuovere definitivamente?")) return;

    if (isOfflineMode) {
        setWines(prev => prev.filter(w => w.id !== id));
        return;
    }

    const oldWines = [...wines];
    setWines(prev => prev.filter(w => w.id !== id));

    try {
        const res = await authFetch(`/api/wines/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error("Delete failed");
    } catch (e) {
        console.error(e);
        alert("Errore eliminazione.");
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
        await authFetch('/api/history', { method: 'DELETE' });
        setHistory([]);
    } catch(e) {
        alert("Errore durante la cancellazione");
    }
  };

  const handleAddLocation = async (name: string) => {
      const newLoc: Location = { id: generateId(), name };
      setLocations(prev => [...prev, newLoc]);
      
      if(!isOfflineMode) {
          try {
              await authFetch('/api/locations', {
                  method: 'POST',
                  body: JSON.stringify(newLoc)
              });
          } catch(e) { console.error(e); }
      }
  };

  const handleDeleteLocation = async (id: string) => {
      setLocations(prev => prev.filter(l => l.id !== id));
      if(!isOfflineMode) {
          try {
              await authFetch(`/api/locations/${id}`, { method: 'DELETE' });
          } catch(e) { console.error(e); }
      }
  };
  
  // --- AUTH GUARD ---
  if (!token) {
      return <AuthForm onLogin={handleLogin} />;
  }

  if (!isLoaded && !isOfflineMode) return (
    <div className="h-screen flex items-center justify-center bg-gray-50 text-wine-800 flex-col gap-2">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-wine-800"></div>
      <p>Apertura Cantina...</p>
    </div>
  );

  return (
    <div className="flex flex-col h-full w-full md:max-w-md mx-auto bg-white shadow-2xl overflow-hidden md:border-x md:border-gray-200">
      
      {/* Offline Mode Banner */}
      {isOfflineMode && (
        <div className="bg-amber-100 text-amber-800 text-xs text-center py-1 px-2 border-b border-amber-200">
          ⚠️ Modalità Offline
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden relative">
        <div className={`absolute inset-0 transition-opacity duration-300 ${activeTab === 'inventory' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
             {activeTab === 'inventory' && (
                <InventoryView 
                    wines={wines} 
                    locations={locations}
                    onAddWine={handleAddWine}
                    onConsume={handleConsume} 
                    onDelete={handleDelete}
                    onAddLocation={handleAddLocation}
                    onDeleteLocation={handleDeleteLocation}
                    onLogout={handleLogout}
                />
             )}
        </div>
        <div className={`absolute inset-0 transition-opacity duration-300 ${activeTab === 'sommelier' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
             {activeTab === 'sommelier' && <SommelierView inventory={wines} onLogout={handleLogout} />}
        </div>
        <div className={`absolute inset-0 transition-opacity duration-300 ${activeTab === 'history' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
             {activeTab === 'history' && (
                <HistoryView 
                    history={history} 
                    onClearHistory={handleClearHistory} 
                    onLogout={handleLogout}
                    onUpdateHistoryEntry={handleUpdateHistoryEntry}
                />
             )}
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

      {/* Instant Review Modal */}
      <RateWineModal 
        entry={ratingModalEntry}
        onClose={() => setRatingModalEntry(null)}
        onSave={handleUpdateHistoryEntry}
      />
    </div>
  );
};

export default App;
