
import React, { useState, useEffect } from 'react';
import { Wine, HistoryEntry, Location, Restaurant, Language } from './types';
import InventoryView from './views/InventoryView';
import HistoryView from './views/HistoryView';
import ShopView from './views/ShopView';
import AnalyticsView from './views/AnalyticsView';
import RestaurantView from './views/RestaurantView';
import SommelierView from './views/SommelierView';
import AdminView from './views/AdminView';
import DigitalCellarGuide from './views/DigitalCellarGuide';
import SommelierHomeGuide from './views/SommelierHomeGuide';
import RestaurantGuide from './views/RestaurantGuide';
import ShopGuide from './views/ShopGuide';
import AnalyticsGuide from './views/AnalyticsGuide';
import SommelierAnalysisGuide from './views/SommelierAnalysisGuide';
import HistoryGuide from './views/HistoryGuide';
import AllGuidesView from './views/AllGuidesView';
import RestaurantBusinessView from './views/RestaurantBusinessView';
import AuthForm from './components/AuthForm';
import RateWineModal from './components/RateWineModal';
import LandingPage from './components/LandingPage'; 
import SharedPairingModal from './components/SharedPairingModal';
import LoadingScreen from './components/LoadingScreen';
import { WineIcon, HistoryIcon, ShopIcon, ChartBarIcon, RestaurantIcon, ShieldCheckIcon, ChefIcon } from './components/Icons';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';

const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2, 9);

const AppContent: React.FC = () => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('vinovault_token'));
  const [userRole, setUserRole] = useState<'user' | 'admin'>('user'); 
  const [userPremium, setUserPremium] = useState(false);
  const { t, setLanguage, language } = useLanguage();

  const [activeTab, setActiveTab] = useState<'inventory' | 'shop' | 'sommelier' | 'restaurant' | 'analytics' | 'history' | 'admin'>('inventory');
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  
  const [wines, setWines] = useState<Wine[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isAuthProcessing, setIsAuthProcessing] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true); 
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

  const navigateTo = (path: string) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
    window.scrollTo(0, 0);
  };

  const handleLogin = (newToken: string, userEmail: string) => {
      console.log("App: Login successful for", userEmail);
      localStorage.setItem('vinovault_token', newToken);
      setToken(newToken);
      setShowAuth(false);
      setIsAuthProcessing(false);
      setIsInitializing(false);
      
      try {
        const parts = newToken.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1]));
          if (payload.role) setUserRole(payload.role);
          if (payload.isPremium !== undefined) setUserPremium(payload.isPremium);
          if (payload.language) setLanguage(payload.language as Language);
        }
      } catch (e) { console.error("Token parse error", e); }

      setWines([]);
      setHistory([]);
      setLocations([]);
      setIsLoaded(false);
      
      if (restaurantData) {
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
      navigateTo('/');
  };

  /**
   * EQUIVALENTE DI getRedirectResult
   * Analizza l'URL al caricamento per intercettare il ritorno da Google
   */
  useEffect(() => {
    const handleRedirectResult = async () => {
        console.log("AuthCheck: Initializing...");
        const fullUrl = window.location.href;
        const hash = window.location.hash;
        const search = window.location.search;
        
        console.log("AuthCheck: URL Detected ->", { 
            hash: hash ? "Found" : "Empty", 
            search: search ? "Found" : "Empty",
            origin: window.location.origin 
        });

        // Cerchiamo l'id_token sia nell'hash che nella query (per compatibilità WebView)
        const paramsFromHash = new URLSearchParams(hash.substring(1));
        const paramsFromSearch = new URLSearchParams(search);
        
        const idToken = paramsFromHash.get('id_token') || paramsFromSearch.get('id_token');
        const stateStr = paramsFromHash.get('state') || paramsFromSearch.get('state');

        if (idToken) {
            console.log("AuthCheck: Google ID Token detected! Processing...");
            setIsAuthProcessing(true);
            setIsInitializing(true); // Teniamo la schermata di caricamento

            try {
                let refFromState = null;
                if (stateStr) {
                    try {
                        const state = JSON.parse(decodeURIComponent(stateStr));
                        if (state.ref) refFromState = state.ref;
                        if (state.language) setLanguage(state.language);
                    } catch (e) {
                        console.warn("AuthCheck: Could not parse state JSON", e);
                    }
                }

                const res = await fetch('/api/auth/google', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        token: idToken,
                        language: language,
                        ref: refFromState
                    })
                });
                
                const data = await res.json();
                
                if (res.ok) {
                    console.log("AuthCheck: Server validated token successfully.");
                    // Puliamo l'URL dai parametri sensibili
                    window.history.replaceState({}, document.title, window.location.pathname);
                    handleLogin(data.token, data.user.email);
                } else {
                    console.error("AuthCheck: Server rejected token", data.error);
                    throw new Error(data.error || "Google login failed");
                }
            } catch (err) {
                console.error("AuthCheck: Critical Error", err);
                setIsAuthProcessing(false);
                setIsInitializing(false);
                alert("Errore durante l'accesso. Riprova o controlla la connessione.");
            }
        } else {
            console.log("AuthCheck: No redirect token found in URL.");
            setIsInitializing(false);
        }
    };

    handleRedirectResult();
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };

    window.addEventListener('popstate', handlePopState);

    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    const shareId = params.get('s');

    if (shareId) {
        fetch(`/api/shares/${shareId}`)
          .then(res => res.json())
          .then(data => {
              if (data && !data.error) setSharedPairingData(data);
          })
          .catch(e => console.error("Failed to load share", e));
    }

    if (ref) {
        fetch(`/api/restaurants/${ref}`)
          .then(res => res.json())
          .then(data => {
              if (data) {
                setRestaurantData(data);
                if (!localStorage.getItem('vinovault_token')) setShowAuth(true);
                else setActiveTab('restaurant');
              }
          })
          .catch(e => console.error(e));
    }

    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    if (!token) return;
    const fetchData = async () => {
      try {
        const [winesRes, historyRes, locationsRes] = await Promise.all([
          authFetch('/api/wines'),
          authFetch('/api/history'),
          authFetch('/api/locations')
        ]);
        if (winesRes.status === 401 || winesRes.status === 403) { handleLogout(); return; }
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
     try {
         const res = await authFetch('/api/wines', { method: 'POST', body: JSON.stringify(wineToAdd) });
         if (!res.ok) throw new Error();
         setWines(prev => [wineToAdd, ...prev]);
     } catch (e) { alert("Errore Salvataggio"); }
  };

  const handleUpdateWine = async (updatedWine: Wine) => {
      setWines(prev => prev.map(w => w.id === updatedWine.id ? updatedWine : w));
      try {
          const { id, ...updates } = updatedWine;
          await authFetch(`/api/wines/${id}`, { method: 'PUT', body: JSON.stringify(updates) });
      } catch (e) {}
  };

  const handleConsume = async (wine: Wine) => {
    const historyEntry: HistoryEntry = {
      id: generateId(), wineId: wine.id, name: wine.name, producer: wine.producer, year: wine.year, 
      type: wine.type, price: wine.price, imageUrl: wine.imageUrl, consumedDate: new Date().toISOString(), 
      rating: 0, notes: '', location: 'Cantina' 
    };
    
    setWines(prev => prev.map(w => w.id === wine.id ? { ...w, quantity: Math.max(0, w.quantity - 1) } : w));
    setHistory(prev => [historyEntry, ...prev]);
    
    try {
        const res = await authFetch('/api/history', { method: 'POST', body: JSON.stringify(historyEntry) });
        if (!res.ok) throw new Error("Errore creazione storico");
        await authFetch(`/api/wines/${wine.id}`, { method: 'PUT', body: JSON.stringify({ quantity: Math.max(0, wine.quantity - 1) }) });
        setRatingModalEntry(historyEntry);
    } catch (e) {
        alert("Impossibile stappare: errore di connessione col server.");
    }
  };

  const handleAddToHistory = async (entryData: Partial<HistoryEntry>) => {
      const historyEntry: HistoryEntry = {
          id: generateId(), wineId: 'external_' + generateId(), name: entryData.name || '?',
          producer: entryData.producer || '?', year: entryData.year || 'N/A', type: entryData.type || 'Altro',
          price: entryData.price || 0, consumedDate: entryData.consumedDate || new Date().toISOString(),
          rating: 0, notes: restaurantData ? `Bevuto presso ${restaurantData.name}` : '',
          location: restaurantData ? restaurantData.name : (entryData.location || '')
      };
      
      setHistory(prev => [historyEntry, ...prev]);
      
      try {
          const res = await authFetch('/api/history', { method: 'POST', body: JSON.stringify(historyEntry) });
          if (!res.ok) throw new Error();
          setRatingModalEntry(historyEntry);
      } catch (e) {
          alert("Errore nel registrare la bevuta al ristorante.");
      }
  };

  const handleUpdateHistoryEntry = async (id: string, rating: number, notes: string, location?: string) => {
    setHistory(prev => prev.map(h => h.id === id ? { ...h, rating, notes, location: location !== undefined ? location : h.location } : h));
    try {
        const res = await authFetch(`/api/history/${id}`, { method: 'PUT', body: JSON.stringify({ rating, notes, location }) });
        if (!res.ok) throw new Error("Errore persistenza recensione");
    } catch (e) {
        alert("Attenzione: la recensione non è stata salvata sul server. Controlla la connessione.");
    }
  };

  const handleDeleteHistoryEntry = (id: string) => {
    if(!confirm(t('confirm'))) return;
    setHistory(prev => prev.filter(h => h.id !== id));
    authFetch(`/api/history/${id}`, { method: 'DELETE' });
  };

  const handleDelete = (id: string) => {
    if(!confirm(t('confirm'))) return;
    setWines(prev => prev.filter(w => w.id !== id));
    authFetch(`/api/wines/${id}`, { method: 'DELETE' });
  };

  const handleAddLocation = (name: string) => {
      const newLoc: Location = { id: generateId(), name };
      setLocations(prev => [...prev, newLoc]);
      authFetch('/api/locations', { method: 'POST', body: JSON.stringify(newLoc) });
  };

  const handleDeleteLocation = (id: string) => {
      setLocations(prev => prev.filter(l => l.id !== id));
      authFetch(`/api/locations/${id}`, { method: 'DELETE' });
  };
  
  if (isInitializing || isAuthProcessing) {
      return (
        <div className="h-screen w-screen flex flex-col items-center justify-center bg-white">
            <LoadingScreen message="Verifica Identità" subMessage="Stiamo completando l'accesso con Google. Attendi un istante..." />
            {/* Debug label opzionale solo se il caricamento dura troppo */}
            <div className="mt-40 text-[10px] text-gray-300 font-mono">Auth Resolver v1.2</div>
        </div>
      );
  }

  if (currentPath === '/ristoranti') {
    return <RestaurantBusinessView onBack={() => navigateTo('/')} onContact={() => {}} />;
  }

  if (currentPath === '/guida/cantina-digitale') {
    return <DigitalCellarGuide onBack={() => navigateTo('/')} onStart={() => { setShowAuth(true); navigateTo('/'); }} />;
  }
  
  if (currentPath === '/guida/sommelier-a-casa') {
    return <SommelierHomeGuide onBack={() => navigateTo('/')} onStart={() => { setShowAuth(true); navigateTo('/'); }} />;
  }

  if (currentPath === '/guida/al-ristorante') {
    return <RestaurantGuide onBack={() => navigateTo('/')} onStart={() => { setShowAuth(true); navigateTo('/'); }} />;
  }

  if (currentPath === '/guida/acquisti-intelligenti') {
    return <ShopGuide onBack={() => navigateTo('/')} onStart={() => { setShowAuth(true); navigateTo('/'); }} />;
  }

  if (currentPath === '/guida/analisi-e-roi') {
    return <AnalyticsGuide onBack={() => navigateTo('/')} onStart={() => { setShowAuth(true); navigateTo('/'); }} />;
  }

  if (currentPath === '/guida/analisi-sommelier') {
    return <SommelierAnalysisGuide onBack={() => navigateTo('/')} onStart={() => { setShowAuth(true); navigateTo('/'); }} />;
  }

  if (currentPath === '/guida/storico-degustazioni') {
    return <HistoryGuide onBack={() => navigateTo('/')} onStart={() => { setShowAuth(true); navigateTo('/'); }} />;
  }

  if (currentPath === '/guide') {
    return <AllGuidesView onBack={() => navigateTo('/')} onOpenGuide={(slug) => navigateTo(`/guida/${slug}`)} />;
  }

  if (!token && showAuth) {
    return (
       <AuthForm 
          onLogin={handleLogin} 
          onBack={() => { setShowAuth(false); navigateTo('/'); }} 
          referralRef={restaurantData?.slug} 
      />
    );
  }

  if (!token) {
    return (
      <>
          <LandingPage 
              onStart={() => setShowAuth(true)} 
              onOpenGuide={(slug) => navigateTo(`/guida/${slug}`)}
              onViewAllGuides={() => navigateTo('/guide')}
              onOpenBusiness={() => navigateTo('/ristoranti')}
          />
          {sharedPairingData && (
              <SharedPairingModal 
                  data={sharedPairingData} 
                  onClose={() => { setSharedPairingData(null); window.history.replaceState({}, '', '/'); }} 
              />
          )}
      </>
    );
  }

  if (!isLoaded && !isOfflineMode) return (
    <div className="h-screen flex items-center justify-center bg-gray-50 flex-col gap-2">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-wine-800"></div>
      <p>{t('loading')}</p>
    </div>
  );

  return (
    <div className="flex flex-col h-full w-full md:max-w-md mx-auto bg-white shadow-2xl overflow-hidden md:border-x md:border-gray-200">
      {isOfflineMode && <div className="bg-amber-100 text-amber-800 text-xs text-center py-1 px-2 border-b border-amber-200">⚠️ Offline Mode</div>}
      <main className="flex-1 overflow-hidden relative">
        <div className={`absolute inset-0 transition-opacity duration-300 ${activeTab === 'inventory' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
             <InventoryView wines={wines} locations={locations} onAddWine={handleAddWine} onUpdateWine={handleUpdateWine} onConsume={handleConsume} onDelete={handleDelete} onAddLocation={handleAddLocation} onDeleteLocation={handleDeleteLocation} onLogout={handleLogout} onAiUsed={() => authFetch('/api/users/track-ai', { method: 'POST' })} isPremium={userPremium} />
        </div>
        <div className={`absolute inset-0 transition-opacity duration-300 ${activeTab === 'shop' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
             <ShopView inventory={wines} onLogout={handleLogout} onAddToInventory={handleAddWine} onAiUsed={() => authFetch('/api/users/track-ai', { method: 'POST' })} isPremium={userPremium} />
        </div>
        <div className={`absolute inset-0 transition-opacity duration-300 ${activeTab === 'sommelier' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
             <SommelierView inventory={wines} onLogout={handleLogout} onAiUsed={() => authFetch('/api/users/track-ai', { method: 'POST' })} onConsume={handleConsume} />
        </div>
        <div className={`absolute inset-0 transition-opacity duration-300 ${activeTab === 'restaurant' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
             <RestaurantView onLogout={handleLogout} onAddToHistory={handleAddToHistory} onAiUsed={() => authFetch('/api/users/track-ai', { method: 'POST' })} onClearRestaurant={() => { setRestaurantData(null); window.history.replaceState({}, '', '/'); }} restaurantData={restaurantData} />
        </div>
        <div className={`absolute inset-0 transition-opacity duration-300 ${activeTab === 'history' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
             <HistoryView wines={wines} history={history} onClearHistory={() => setHistory([])} onLogout={handleLogout} onUpdateHistoryEntry={handleUpdateHistoryEntry} onDeleteHistoryEntry={handleDeleteHistoryEntry} isPremium={userPremium} onAiUsed={() => authFetch('/api/users/track-ai', { method: 'POST' })} />
        </div>
        <div className={`absolute inset-0 transition-opacity duration-300 ${activeTab === 'analytics' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
             <AnalyticsView inventory={wines} history={history} onLogout={handleLogout} isPremium={userPremium} onAiUsed={() => authFetch('/api/users/track-ai', { method: 'POST' })} />
        </div>
        {userRole === 'admin' && activeTab === 'admin' && (
            <div className="absolute inset-0 z-20">
                 <AdminView onLogout={handleLogout} token={token || ''} />
            </div>
        )}
      </main>
      <nav className="bg-white border-t border-gray-200 flex justify-between px-2 pb-safe z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.02)] overflow-x-auto no-scrollbar">
        {[
          { id: 'inventory', icon: WineIcon, label: t('nav_cellar') },
          { id: 'shop', icon: ShopIcon, label: t('nav_shop') },
          { id: 'sommelier', icon: ChefIcon, label: t('nav_sommelier') },
          { id: 'restaurant', icon: RestaurantIcon, label: t('nav_restaurant') },
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
              onClose={() => { setSharedPairingData(null); window.history.replaceState({}, '', '/'); }} 
          />
      )}
    </div>
  );
};

const App: React.FC = () => <LanguageProvider><AppContent /></LanguageProvider>;
export default App;
