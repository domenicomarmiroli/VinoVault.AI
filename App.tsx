
import React, { useState, useEffect } from 'react';
import { Wine, HistoryEntry, Location } from './types';
import InventoryView from './views/InventoryView';
import SommelierView from './views/SommelierView';
import HistoryView from './views/HistoryView';
import ShopView from './views/ShopView';
import AnalyticsView from './views/AnalyticsView';
import RestaurantView from './views/RestaurantView';
import AuthForm from './components/AuthForm';
import RateWineModal from './components/RateWineModal';
import { WineIcon, ChefIcon, HistoryIcon, ShopIcon, ChartBarIcon, RestaurantIcon } from './components/Icons';

// Helper per generare ID sicuri anche su mobile/http
const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2, 9);

const App: React.FC = () => {
  // Auth State
  const [token, setToken] = useState<string | null>(localStorage.getItem('vinovault_token'));
  const [userEmail, setUserEmail] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<'inventory' | 'sommelier' | 'shop' | 'history' | 'analytics' | 'restaurant'>('inventory');
  const [wines, setWines] = useState<Wine[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  
  // Instant Review State
  const [ratingModalEntry, setRatingModalEntry] = useState<HistoryEntry | null>(null);

  // Helper per fetch autenticate
  // UPDATE: Uso stringa vuota per usare percorsi relativi (es. /api/wines)
  // Questo funziona sia in Dev (grazie al proxy vite) che in Prod (express serve static + api)
  const API_BASE = '';

  const authFetch = async (url: string, options: RequestInit = {}) => {
      const headers = {
          'Content-Type': 'application/json',
          ...(options.headers || {}),
          'Authorization': `Bearer ${token}`
      };
      // Costruzione URL sicura
      const fullUrl = url.startsWith('/api') ? `${API_BASE}${url}` : url;
      return fetch(fullUrl, { ...options, headers });
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

  const handleUpdateWine = async (updatedWine: Wine) => {
      // Update local state immediately (Optimistic UI)
      setWines(prev => prev.map(w => w.id === updatedWine.id ? updatedWine : w));

      if (!isOfflineMode) {
          try {
              // Send updated fields (quantity and location support)
              await authFetch(`/api/wines/${updatedWine.id}`, {
                  method: 'PUT',
                  body: JSON.stringify({ 
                      quantity: updatedWine.quantity,
                      location: updatedWine.location 
                  })
              });
          } catch (e) {
              console.error("Errore aggiornamento vino", e);
          }
      }
  };

  // Consumo standard da inventario
  const handleConsume = async (wine: Wine) => {
    const historyEntry: HistoryEntry = {
      id: generateId(),
      wineId: wine.id,
      name: wine.name,
      producer: wine.producer,
      year: wine.year,
      type: wine.type, // Added type
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

  // Aggiunta diretta allo storico (es. Ristorante)
  const handleAddToHistory = async (entryData: Partial<HistoryEntry>) => {
      const historyEntry: HistoryEntry = {
          id: generateId(),
          wineId: 'external_' + generateId(), // ID fittizio per vini esterni
          name: entryData.name || 'Sconosciuto',
          producer: entryData.producer || 'Sconosciuto',
          year: entryData.year || 'N/A',
          type: entryData.type || 'Altro', // Added type
          price: entryData.price || 0,
          imageUrl: undefined, // Non abbiamo foto bottiglia dal ristorante solitamente
          consumedDate: entryData.consumedDate || new Date().toISOString(),
          rating: 0,
          notes: ''
      };

      setHistory(prev => [historyEntry, ...prev]);
      setRatingModalEntry(historyEntry);

      if (!isOfflineMode) {
          try {
              await authFetch('/api/history', {
                  method: 'POST',
                  body: JSON.stringify(historyEntry)
              });
          } catch(e) {
              console.error("Errore salvataggio storico", e);
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
                    onUpdateWine={handleUpdateWine}
                    onConsume={handleConsume} 
                    onDelete={handleDelete}
                    onAddLocation={handleAddLocation}
                    onDeleteLocation={handleDeleteLocation}
                    onLogout={handleLogout}
                />
             )}
        </div>
        
        <div className={`absolute inset-0 transition-opacity duration-300 ${activeTab === 'shop' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
             {activeTab === 'shop' && (
                <ShopView 
                    inventory={wines} 
                    onLogout={handleLogout}
                    onAddToInventory={handleAddWine}
                />
             )}
        </div>

        <div className={`absolute inset-0 transition-opacity duration-300 ${activeTab === 'restaurant' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
             {activeTab === 'restaurant' && (
                <RestaurantView 
                    onLogout={handleLogout}
                    onAddToHistory={handleAddToHistory}
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

        <div className={`absolute inset-0 transition-opacity duration-300 ${activeTab === 'analytics' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
             {activeTab === 'analytics' && (
                <AnalyticsView 
                    inventory={wines} 
                    history={history}
                    onLogout={handleLogout}
                />
             )}
        </div>
      </main>

      {/* Bottom Navigation - Updated with Restaurant Icon */}
      <nav className="bg-white border-t border-gray-200 flex justify-between px-2 pb-safe z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.02)] overflow-x-auto no-scrollbar">
        <button 
          onClick={() => setActiveTab('inventory')}
          className={`flex flex-col items-center p-2 rounded-xl transition-all min-w-[3.5rem] ${activeTab === 'inventory' ? 'text-wine-700' : 'text-gray-400 hover:text-gray-600'}`}
        >
          <WineIcon className="w-6 h-6 mb-1 transition-transform active:scale-90" filled={activeTab === 'inventory'} />
          <span className={`text-[8px] font-bold uppercase tracking-wider ${activeTab === 'inventory' ? 'opacity-100' : 'opacity-70'}`}>Cantina</span>
        </button>

        <button 
          onClick={() => setActiveTab('shop')}
          className={`flex flex-col items-center p-2 rounded-xl transition-all min-w-[3.5rem] ${activeTab === 'shop' ? 'text-wine-700' : 'text-gray-400 hover:text-gray-600'}`}
        >
          <ShopIcon className="w-6 h-6 mb-1 transition-transform active:scale-90" filled={activeTab === 'shop'} />
          <span className={`text-[8px] font-bold uppercase tracking-wider ${activeTab === 'shop' ? 'opacity-100' : 'opacity-70'}`}>Shop</span>
        </button>

        {/* New Restaurant Tab */}
        <button 
          onClick={() => setActiveTab('restaurant')}
          className={`flex flex-col items-center p-2 rounded-xl transition-all min-w-[3.5rem] ${activeTab === 'restaurant' ? 'text-wine-700' : 'text-gray-400 hover:text-gray-600'}`}
        >
          <RestaurantIcon className="w-6 h-6 mb-1 transition-transform active:scale-90" filled={activeTab === 'restaurant'} />
          <span className={`text-[8px] font-bold uppercase tracking-wider ${activeTab === 'restaurant' ? 'opacity-100' : 'opacity-70'}`}>Ristorante</span>
        </button>

        <button 
          onClick={() => setActiveTab('sommelier')}
          className={`flex flex-col items-center p-2 rounded-xl transition-all min-w-[3.5rem] ${activeTab === 'sommelier' ? 'text-wine-700' : 'text-gray-400 hover:text-gray-600'}`}
        >
          <ChefIcon className="w-6 h-6 mb-1 transition-transform active:scale-90" filled={activeTab === 'sommelier'} />
          <span className={`text-[8px] font-bold uppercase tracking-wider ${activeTab === 'sommelier' ? 'opacity-100' : 'opacity-70'}`}>Chef</span>
        </button>
        
        <button 
          onClick={() => setActiveTab('analytics')}
          className={`flex flex-col items-center p-2 rounded-xl transition-all min-w-[3.5rem] ${activeTab === 'analytics' ? 'text-wine-700' : 'text-gray-400 hover:text-gray-600'}`}
        >
          <ChartBarIcon className="w-6 h-6 mb-1 transition-transform active:scale-90" filled={activeTab === 'analytics'} />
          <span className={`text-[8px] font-bold uppercase tracking-wider ${activeTab === 'analytics' ? 'opacity-100' : 'opacity-70'}`}>Dati</span>
        </button>

        <button 
          onClick={() => setActiveTab('history')}
          className={`flex flex-col items-center p-2 rounded-xl transition-all min-w-[3.5rem] ${activeTab === 'history' ? 'text-wine-700' : 'text-gray-400 hover:text-gray-600'}`}
        >
          <HistoryIcon className="w-6 h-6 mb-1 transition-transform active:scale-90" filled={activeTab === 'history'} />
          <span className={`text-[8px] font-bold uppercase tracking-wider ${activeTab === 'history' ? 'opacity-100' : 'opacity-70'}`}>Storico</span>
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
