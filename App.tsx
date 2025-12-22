
import React, { useState, useEffect } from 'react';
import { Wine, HistoryEntry, Location, Restaurant, Language } from './types';
import InventoryView from './views/InventoryView';
import SommelierView from './views/SommelierView';
import HistoryView from './views/HistoryView';
import ShopView from './views/ShopView';
import AnalyticsView from './views/AnalyticsView';
import RestaurantView from './views/RestaurantView';
import AdminView from './views/AdminView';
import DigitalCellarGuide from './views/DigitalCellarGuide'; // NEW
import AuthForm from './components/AuthForm';
import RateWineModal from './components/RateWineModal';
import LandingPage from './components/LandingPage'; 
import SharedPairingModal from './components/SharedPairingModal';
import { WineIcon, ChefIcon, HistoryIcon, ShopIcon, ChartBarIcon, RestaurantIcon, ShieldCheckIcon } from './components/Icons';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';

const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2, 9);

const AppContent: React.FC = () => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('vinovault_token'));
  const [userRole, setUserRole] = useState<'user' | 'admin'>('user'); 
  const [userPremium, setUserPremium] = useState(false);
  const { t, setLanguage } = useLanguage();

  const [activeTab, setActiveTab] = useState<'inventory' | 'sommelier' | 'shop' | 'history' | 'analytics' | 'restaurant' | 'admin'>('inventory');
  const [currentPage, setCurrentPage] = useState<'main' | 'guide-cellar'>('main'); // NEW
  
  const [wines, setWines] = useState<Wine[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [ratingModalEntry, setRatingModalEntry] = useState<HistoryEntry | null>(null);
  const [restaurantData, setRestaurantData] = useState<Restaurant | null>(null);
  const [sharedPairingData, setSharedPairingData] = useState<any | null>(null);
  
  const [showAuth, setShowAuth] = useState(false);

  const API_BASE = '';

  const authFetch = async (url: string, options: RequestInit = {}) => {
      const headers = {
          'Content-Type': 'application/json',
          ...(options.headers || {}),
          'Authorization': `Bearer ${token}`
      };
      const fullUrl = url.startsWith('/api') ? `${API_BASE}${url}` : url;
      return fetch(fullUrl, { ...options, headers });
  };

  const handleLogin = (newToken: string, email: string) => {
      localStorage.setItem('vinovault_token', newToken);
      setToken(newToken);
      setShowAuth(false);
      setCurrentPage('main'); // Reset to main app view
      
      try {
        const payload = JSON.parse(atob(newToken.split('.')[1]));
        if (payload.role) setUserRole(payload.role);
        if (payload.isPremium) setUserPremium(payload.isPremium);
        if (payload.language) setLanguage(payload.language as Language);
      } catch (e) { console.error("Token parse error", e); }

      setWines([]);
      setHistory([]);
      setLocations([]);
      setIsLoaded(false);

      const params = new URLSearchParams(window.location.search);
      if (params.get('ref') || restaurantData) {
          setActiveTab('restaurant');
      } else {
          setActiveTab('inventory');
      }
  };

  const handleLogout = () => {
      localStorage.removeItem('vinovault_token');
      setToken(null);
      setUserRole('user');
      setUserPremium(false);
      setShowAuth(false);
  };

  useEffect(() => {
      const params = new URLSearchParams(window.location.search);
      const ref = params.get('ref');
      const shareId = params.get('s');
      const pageParam = params.get('p'); // NEW

      if (pageParam === 'cantina-digitale') {
          setCurrentPage('guide-cellar');
      }

      // Se c'è un ID breve per il pairing, caricalo dal server
      if (shareId) {
          fetch(`/api/shares/${shareId}`)
            .then(res => res.json())
            .then(data => {
                if (data && !data.error) setSharedPairingData(data);
            })
            .catch(e => console.error("Failed to load share", e));
      }

      if (ref) {
          if (!localStorage.getItem('vinovault_token')) {
              setShowAuth(true);
          }
          fetch(`/api/restaurants/${ref}`)
            .then(res => res.json())
            .then(data => {
                if (data) {
                    setRestaurantData(data);
                    if (localStorage.getItem('vinovault_token')) setActiveTab('restaurant');
                } else {
                    setRestaurantData({ id: 'temp', name: ref, slug: ref, menu_context: '' });
                    if (localStorage.getItem('vinovault_token')) setActiveTab('restaurant');
                }
            })
            .catch(e => console.error(e));
          if (!shareId) window.history.replaceState({}, document.title, window.location.pathname);
      }
  }, []);

  useEffect(() => {
    if (!token) return;
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.role) setUserRole(payload.role);
        if (payload.isPremium) setUserPremium(payload.isPremium);
        if (payload.language) setLanguage(payload.language as Language);
    } catch (e) {}

    const fetchData = async () => {
      try {
        const [winesRes, historyRes, locationsRes] = await Promise.all([
          authFetch('/api/wines'),
          authFetch('/api/history'),
          authFetch('/api/locations')
        ]);
        if (winesRes.status === 401 || winesRes.status === 403) { handleLogout(); return; }
        if (!winesRes.ok) throw new Error("API Unreachable");

        setWines(await winesRes.json());
        setHistory(await historyRes.json());
        setLocations(await locationsRes.json());
        setIsOfflineMode(false);
      } catch (e) {
        setIsOfflineMode(true);
      } finally {
        setIsLoaded(true);
      }
    };
    fetchData();
  }, [token]);


  const handleAddWine = async (newWine: Wine) => {
     const wineToAdd = { ...newWine, id: newWine.id || generateId() };
     if (isOfflineMode) { setWines(prev => [wineToAdd, ...prev]); return; }
     try {
         const res = await authFetch('/api/wines', { method: 'POST', body: JSON.stringify(wineToAdd) });
         if (!res.ok) throw new Error("Errore");
         setWines(prev => [wineToAdd, ...prev]);
     } catch (e) { alert("Errore salvataggio."); }
  };

  const handleUpdateWine = async (updatedWine: Wine) => {
      setWines(prev => prev.map(w => w.id === updatedWine.id ? updatedWine : w));
      if (!isOfflineMode) {
          try {
              const { id, ...updates } = updatedWine;
              await authFetch(`/api/wines/${id}`, { method: 'PUT', body: JSON.stringify(updates) });
          } catch (e) {}
      }
  };

  const handleConsume = async (wine: Wine) => {
    const historyEntry: HistoryEntry = {
      id: generateId(), wineId: wine.id, name: wine.name, producer: wine.producer, year: wine.year, 
      type: wine.type, price: wine.price, imageUrl: wine.imageUrl, consumedDate: new Date().toISOString(), 
      rating: 0, notes: ''
    };
    setHistory(prev => [historyEntry, ...prev]);
    setWines(prev => prev.map(w => w.id === wine.id ? { ...w, quantity: w.quantity - 1 } : w));
    setRatingModalEntry(historyEntry);
    if (!isOfflineMode) {
        try {
            await Promise.all([
                authFetch('/api/history', { method: 'POST', body: JSON.stringify(historyEntry) }),
                authFetch(`/api/wines/${wine.id}`, { method: 'PUT', body: JSON.stringify({ quantity: wine.quantity - 1 }) })
            ]);
        } catch (e) {}
    }
  };

  const handleAddToHistory = async (entryData: Partial<HistoryEntry>) => {
      const historyEntry: HistoryEntry = {
          id: generateId(), wineId: 'external_' + generateId(), name: entryData.name || '?',
          producer: entryData.producer || '?', year: entryData.year || 'N/A', type: entryData.type || 'Altro',
          price: entryData.price || 0, consumedDate: entryData.consumedDate || new Date().toISOString(),
          rating: 0, notes: restaurantData ? `Bevuto @ ${restaurantData.name}` : ''
      };
      setHistory(prev => [historyEntry, ...prev]);
      setRatingModalEntry(historyEntry);
      if (!isOfflineMode) {
          try { await authFetch('/api/history', { method: 'POST', body: JSON.stringify(historyEntry) }); } catch(e) {}
      }
  };

  const handleUpdateHistoryEntry = async (id: string, rating: number, notes: string) => {
    setHistory(prev => prev.map(h => h.id === id ? { ...h, rating, notes } : h));
    if (!isOfflineMode) {
        try { await authFetch(`/api/history/${id}`, { method: 'PUT', body: JSON.stringify({ rating, notes }) }); } catch (e) {}
    }
  };

  const handleDeleteHistoryEntry = async (id: string) => {
    if(!confirm(t('confirm'))) return;
    const entry = history.find(h => h.id === id);
    if (!entry) return;
    setHistory(prev => prev.filter(h => h.id !== id));
    if (entry.wineId && !entry.wineId.startsWith('external_')) {
        setWines(prev => prev.map(w => w.id === entry.wineId ? { ...w, quantity: w.quantity + 1 } : w));
    }
    if (!isOfflineMode) {
        try {
            await authFetch(`/api/history/${id}`, { method: 'DELETE' });
            if (entry.wineId && !entry.wineId.startsWith('external_')) {
                const targetWine = wines.find(w => w.id === entry.wineId);
                if (targetWine) await authFetch(`/api/wines/${targetWine.id}`, { method: 'PUT', body: JSON.stringify({ quantity: (targetWine.quantity || 0) + 1 }) });
            }
        } catch (e) {}
    }
  };

  const handleDelete = async (id: string) => {
    if(!confirm(t('confirm'))) return;
    if (isOfflineMode) { setWines(prev => prev.filter(w => w.id !== id)); return; }
    const oldWines = [...wines];
    setWines(prev => prev.filter(w => w.id !== id));
    try {
        const res = await authFetch(`/api/wines/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error("Delete failed");
    } catch (e) { setWines(oldWines); }
  };

  const handleClearHistory = async () => {
    if(!confirm(t('confirm'))) return;
    if (isOfflineMode) { setHistory([]); return; }
    try { await authFetch('/api/history', { method: 'DELETE' }); setHistory([]); } catch(e) {}
  };

  const handleAddLocation = async (name: string) => {
      const newLoc: Location = { id: generateId(), name };
      setLocations(prev => [...prev, newLoc]);
      if(!isOfflineMode) {
          try { await authFetch('/api/locations', { method: 'POST', body: JSON.stringify(newLoc) }); } catch(e) {}
      }
  };

  const handleDeleteLocation = async (id: string) => {
      setLocations(prev => prev.filter(l => l.id !== id));
      if(!isOfflineMode) { try { await authFetch(`/api/locations/${id}`, { method: 'DELETE' }); } catch(e) {} }
  };
  
  // --- RENDERING LOGIC ---

  // 1. Show SEO Guides
  if (currentPage === 'guide-cellar') {
      return (
        <DigitalCellarGuide 
            onBack={() => { setCurrentPage('main'); window.history.replaceState({}, '', '/'); }} 
            onStart={() => { setShowAuth(true); setCurrentPage('main'); }} 
        />
      );
  }

  // 2. Show Auth or Landing
  if (!token) {
      if (showAuth) {
          return (
             <>
                {restaurantData && (
                    <div className="fixed top-0 left-0 right-0 z-[100] bg-wine-700 text-white p-4 text-center shadow-lg animate-in slide-in-from-top">
                        <p className="font-serif font-bold text-lg">{restaurantData.name}</p>
                    </div>
                )}
                <AuthForm 
                    onLogin={handleLogin} 
                    onBack={() => setShowAuth(false)} 
                    referralRef={restaurantData?.slug} 
                />
             </>
          );
      } else {
          return (
            <>
                <LandingPage 
                    onStart={() => setShowAuth(true)} 
                    onOpenGuide={(slug) => {
                        if (slug === 'cantina-digitale') setCurrentPage('guide-cellar');
                    }}
                />
                {sharedPairingData && (
                    <SharedPairingModal 
                        data={sharedPairingData} 
                        onClose={() => {
                            setSharedPairingData(null);
                            window.history.replaceState({}, document.title, window.location.pathname);
                        }} 
                    />
                )}
            </>
          );
      }
  }

  if (!isLoaded && !isOfflineMode) return (
    <div className="h-screen flex items-center justify-center bg-gray-50 text-wine-800 flex-col gap-2">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-wine-800"></div>
      <p>{t('loading')}</p>
    </div>
  );

  return (
    <div className="flex flex-col h-full w-full md:max-w-md mx-auto bg-white shadow-2xl overflow-hidden md:border-x md:border-gray-200">
      {isOfflineMode && <div className="bg-amber-100 text-amber-800 text-xs text-center py-1 px-2 border-b border-amber-200">⚠️ Offline Mode</div>}
      {restaurantData && (
        <div className="bg-wine-700 text-white px-4 py-2 flex justify-between items-center relative z-20 shadow-md">
            <div>
                <p className="text-xs font-bold uppercase tracking-wider opacity-80">Check-in</p>
                <p className="font-serif font-bold">{restaurantData.name}</p>
            </div>
            <button onClick={() => { setRestaurantData(null); setActiveTab('inventory'); }} className="bg-white/20 hover:bg-white/30 rounded-full p-1">✕</button>
        </div>
      )}
      <main className="flex-1 overflow-hidden relative">
        <div className={`absolute inset-0 transition-opacity duration-300 ${activeTab === 'inventory' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
             {activeTab === 'inventory' && <InventoryView wines={wines} locations={locations} onAddWine={handleAddWine} onUpdateWine={handleUpdateWine} onConsume={handleConsume} onDelete={handleDelete} onAddLocation={handleAddLocation} onDeleteLocation={handleDeleteLocation} onLogout={handleLogout} onAiUsed={() => authFetch('/api/users/track-ai', { method: 'POST' })} isPremium={userPremium} />}
        </div>
        <div className={`absolute inset-0 transition-opacity duration-300 ${activeTab === 'shop' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
             {activeTab === 'shop' && <ShopView inventory={wines} onLogout={handleLogout} onAddToInventory={handleAddWine} onAiUsed={() => authFetch('/api/users/track-ai', { method: 'POST' })} isPremium={userPremium} />}
        </div>
        <div className={`absolute inset-0 transition-opacity duration-300 ${activeTab === 'restaurant' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
             {activeTab === 'restaurant' && <RestaurantView onLogout={handleLogout} onAddToHistory={handleAddToHistory} onAiUsed={() => authFetch('/api/users/track-ai', { method: 'POST' })} restaurantData={restaurantData} />}
        </div>
        <div className={`absolute inset-0 transition-opacity duration-300 ${activeTab === 'sommelier' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
             {activeTab === 'sommelier' && <SommelierView inventory={wines} onLogout={handleLogout} onAiUsed={() => authFetch('/api/users/track-ai', { method: 'POST' })} onConsume={handleConsume} />}
        </div>
        <div className={`absolute inset-0 transition-opacity duration-300 ${activeTab === 'history' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
             {activeTab === 'history' && <HistoryView history={history} onClearHistory={handleClearHistory} onLogout={handleLogout} onUpdateHistoryEntry={handleUpdateHistoryEntry} onDeleteHistoryEntry={handleDeleteHistoryEntry} isPremium={userPremium} />}
        </div>
        <div className={`absolute inset-0 transition-opacity duration-300 ${activeTab === 'analytics' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
             {activeTab === 'analytics' && <AnalyticsView inventory={wines} history={history} onLogout={handleLogout} isPremium={userPremium} onAiUsed={() => authFetch('/api/users/track-ai', { method: 'POST' })} />}
        </div>
        {userRole === 'admin' && (
            <div className={`absolute inset-0 transition-opacity duration-300 ${activeTab === 'admin' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
                 {activeTab === 'admin' && <AdminView onLogout={handleLogout} token={token || ''} />}
            </div>
        )}
      </main>
      <nav className="bg-white border-t border-gray-200 flex justify-between px-2 pb-safe z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.02)] overflow-x-auto no-scrollbar">
        {[
          { id: 'inventory', icon: WineIcon, label: t('nav_cellar') },
          { id: 'shop', icon: ShopIcon, label: t('nav_shop') },
          { id: 'restaurant', icon: RestaurantIcon, label: t('nav_restaurant') },
          { id: 'sommelier', icon: ChefIcon, label: t('nav_sommelier') },
          { id: 'analytics', icon: ChartBarIcon, label: t('nav_data') },
          { id: 'history', icon: HistoryIcon, label: t('nav_history') }
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`flex flex-col items-center p-2 rounded-xl transition-all min-w-[3.5rem] ${activeTab === tab.id ? 'text-wine-700' : 'text-gray-400'}`}>
            <tab.icon className="w-6 h-6 mb-1" filled={activeTab === tab.id} />
            <span className="text-[8px] font-bold uppercase tracking-wider">{tab.label}</span>
          </button>
        ))}
        {userRole === 'admin' && (
            <button onClick={() => setActiveTab('admin')} className={`flex flex-col items-center p-2 rounded-xl transition-all min-w-[3.5rem] ${activeTab === 'admin' ? 'text-wine-700' : 'text-gray-400'}`}>
                <ShieldCheckIcon className="w-6 h-6 mb-1" filled={activeTab === 'admin'} />
                <span className="text-[8px] font-bold uppercase tracking-wider">{t('nav_admin')}</span>
            </button>
        )}
      </nav>
      <RateWineModal entry={ratingModalEntry} onClose={() => setRatingModalEntry(null)} onSave={handleUpdateHistoryEntry} onDelete={handleDeleteHistoryEntry} isPremium={userPremium} />
      {sharedPairingData && (
        <SharedPairingModal 
            data={sharedPairingData} 
            onClose={() => {
                setSharedPairingData(null);
                window.history.replaceState({}, document.title, window.location.pathname);
            }} 
        />
      )}
    </div>
  );
};

const App: React.FC = () => <LanguageProvider><AppContent /></LanguageProvider>;
export default App;
