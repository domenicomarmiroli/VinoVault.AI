
import React, { useState, useEffect, useRef } from 'react';
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
  // Usiamo un ref per il token per garantire che le chiamate API abbiano sempre il valore più recente
  const tokenRef = useRef<string | null>(localStorage.getItem('vinovault_token'));
  const [token, setToken] = useState<string | null>(tokenRef.current);
  
  const [userRole, setUserRole] = useState<'user' | 'admin'>('user'); 
  const [userPremium, setUserPremium] = useState(false);
  const { t, setLanguage, language } = useLanguage();

  const [activeTab, setActiveTab] = useState<'inventory' | 'shop' | 'sommelier' | 'restaurant' | 'analytics' | 'history' | 'admin'>('inventory');
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  
  const [wines, setWines] = useState<Wine[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  
  // Stati critici per il coordinamento del login
  const [isInitializing, setIsInitializing] = useState(true);
  const [isAuthProcessing, setIsAuthProcessing] = useState(false);
  const [authStatus, setAuthStatus] = useState<string>('Avvio...');
  
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [ratingModalEntry, setRatingModalEntry] = useState<HistoryEntry | null>(null);
  const [restaurantData, setRestaurantData] = useState<Restaurant | null>(null);
  const [sharedPairingData, setSharedPairingData] = useState<any | null>(null);
  const [showAuth, setShowAuth] = useState(false);

  const API_BASE = '';

  const authFetch = async (url: string, options: RequestInit = {}) => {
      // Usa il token dal ref o dal localStorage (più affidabile dello state React durante i redirect)
      const currentToken = tokenRef.current || localStorage.getItem('vinovault_token');
      const headers = {
          'Content-Type': 'application/json',
          ...(options.headers || {}),
          'Authorization': `Bearer ${currentToken}`
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
      console.log("App: Salvataggio sessione per", userEmail);
      localStorage.setItem('vinovault_token', newToken);
      tokenRef.current = newToken;
      setToken(newToken);
      setShowAuth(false);
      
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
      
      if (restaurantData) setActiveTab('restaurant');
      else setActiveTab('inventory');
      
      // Fermiamo l'animazione di caricamento solo DOPO che lo stato è pronto
      setIsAuthProcessing(false);
      setIsInitializing(false);
  };

  const handleLogout = () => {
      localStorage.removeItem('vinovault_token');
      tokenRef.current = null;
      setToken(null);
      setUserRole('user');
      setUserPremium(false);
      setShowAuth(false);
      navigateTo('/');
  };

  // 1. Auth Resolver: Intercetta il ritorno da Google
  useEffect(() => {
    const resolveGoogleRedirect = async () => {
        const hash = window.location.hash;
        const search = window.location.search;
        
        const paramsFromHash = new URLSearchParams(hash.substring(1));
        const paramsFromSearch = new URLSearchParams(search);
        
        const idToken = paramsFromHash.get('id_token') || paramsFromSearch.get('id_token');
        const stateStr = paramsFromHash.get('state') || paramsFromSearch.get('state');

        if (idToken) {
            setAuthStatus('Ricezione credenziali Google...');
            setIsAuthProcessing(true);
            setIsInitializing(true);

            try {
                let refFromState = null;
                if (stateStr) {
                    try {
                        const state = JSON.parse(decodeURIComponent(stateStr));
                        if (state.ref) refFromState = state.ref;
                        if (state.language) setLanguage(state.language);
                    } catch (e) {}
                }

                setAuthStatus('Sincronizzazione server...');
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
                    setAuthStatus('Utente riconosciuto correttamente!');
                    // Puliamo l'URL PRIMA di chiamare handleLogin per evitare loop
                    window.history.replaceState({}, document.title, window.location.pathname);
                    handleLogin(data.token, data.user.email);
                } else {
                    setAuthStatus('Errore: ' + (data.error || 'Accesso negato'));
                    setTimeout(() => setIsInitializing(false), 3000);
                }
            } catch (err) {
                setAuthStatus('Connessione al server fallita.');
                setTimeout(() => setIsInitializing(false), 3000);
            }
        } else {
            // Se non c'è un id_token, controlliamo se siamo già loggati normalmente
            const savedToken = localStorage.getItem('vinovault_token');
            if (savedToken) {
                tokenRef.current = savedToken;
                setToken(savedToken);
                // La decodifica del ruolo avverrà al primo fetch o possiamo farla qui
            }
            setIsInitializing(false);
        }
    };

    resolveGoogleRedirect();
  }, []);

  // 2. Data Fetcher: Carica i dati solo se abbiamo un token e NON stiamo elaborando il login
  useEffect(() => {
    if (!token || isInitializing || isAuthProcessing) return;
    
    const fetchData = async () => {
      try {
        setAuthStatus('Scaricamento cantina...');
        const [winesRes, historyRes, locationsRes] = await Promise.all([
          authFetch('/api/wines'),
          authFetch('/api/history'),
          authFetch('/api/locations')
        ]);
        
        if (winesRes.status === 401 || winesRes.status === 403) { 
            console.warn("Sessione scaduta o non valida.");
            handleLogout(); 
            return; 
        }

        setWines(await winesRes.json());
        setHistory(await historyRes.json());
        setLocations(await locationsRes.json());
        setIsOfflineMode(false);
        setIsLoaded(true);
      } catch (e) {
        setIsOfflineMode(true);
        setIsLoaded(true);
      }
    };
    fetchData();
  }, [token, isInitializing, isAuthProcessing]);

  useEffect(() => {
    const handlePopState = () => setCurrentPath(window.location.pathname);
    window.addEventListener('popstate', handlePopState);
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    const shareId = params.get('s');
    if (shareId) {
        fetch(`/api/shares/${shareId}`).then(res => res.json()).then(data => { if (data && !data.error) setSharedPairingData(data); });
    }
    if (ref) {
        fetch(`/api/restaurants/${ref}`).then(res => res.json()).then(data => { if (data) { setRestaurantData(data); if (!localStorage.getItem('vinovault_token')) setShowAuth(true); else setActiveTab('restaurant'); } });
    }
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

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
        if (!res.ok) throw new Error();
        await authFetch(`/api/wines/${wine.id}`, { method: 'PUT', body: JSON.stringify({ quantity: Math.max(0, wine.quantity - 1) }) });
        setRatingModalEntry(historyEntry);
    } catch (e) { alert("Errore connessione."); }
  };

  const handleAddToHistory = async (entryData: Partial<HistoryEntry>) => {
      const historyEntry: HistoryEntry = {
          id: generateId(), wineId: 'ext_' + generateId(), name: entryData.name || '?',
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
      } catch (e) { alert("Errore registrazione bevuta."); }
  };

  const handleUpdateHistoryEntry = async (id: string, rating: number, notes: string, location?: string) => {
    setHistory(prev => prev.map(h => h.id === id ? { ...h, rating, notes, location: location !== undefined ? location : h.location } : h));
    try {
        await authFetch(`/api/history/${id}`, { method: 'PUT', body: JSON.stringify({ rating, notes, location }) });
    } catch (e) { alert("Errore salvataggio recensione."); }
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
        <div className="h-screen w-screen bg-white flex flex-col items-center justify-center p-6 text-center">
            <LoadingScreen message="Verifica Accesso" subMessage={authStatus} />
            <div className="mt-20 text-[10px] text-gray-300 font-mono animate-pulse uppercase tracking-[0.2em]">
                {window.location.hash ? 'Hash Link detected' : 'Standard session'}
            </div>
        </div>
      );
  }

  if (currentPath === '/ristoranti') return <RestaurantBusinessView onBack={() => navigateTo('/')} onContact={() => {}} />;
  if (currentPath.startsWith('/guida/')) {
    const Guide = { 'cantina-digitale': DigitalCellarGuide, 'sommelier-a-casa': SommelierHomeGuide, 'al-ristorante': RestaurantGuide, 'acquisti-intelligenti': ShopGuide, 'analisi-e-roi': AnalyticsGuide, 'analisi-sommelier': SommelierAnalysisGuide, 'storico-degustazioni': HistoryGuide }[currentPath.split('/')[2]];
    return Guide ? <Guide onBack={() => navigateTo('/')} onStart={() => { setShowAuth(true); navigateTo('/'); }} /> : <LandingPage onStart={() => setShowAuth(true)} onOpenGuide={(slug) => navigateTo(`/guida/${slug}`)} />;
  }
  if (currentPath === '/guide') return <AllGuidesView onBack={() => navigateTo('/')} onOpenGuide={(slug) => navigateTo(`/guida/${slug}`)} />;

  if (!token) {
    if (showAuth) return <AuthForm onLogin={handleLogin} onBack={() => { setShowAuth(false); navigateTo('/'); }} referralRef={restaurantData?.slug} />;
    return (
      <>
          <LandingPage onStart={() => setShowAuth(true)} onOpenGuide={(slug) => navigateTo(`/guida/${slug}`)} onViewAllGuides={() => navigateTo('/guide')} onOpenBusiness={() => navigateTo('/ristoranti')} />
          {sharedPairingData && <SharedPairingModal data={sharedPairingData} onClose={() => { setSharedPairingData(null); window.history.replaceState({}, '', '/'); }} />}
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
        {userRole === 'admin' && activeTab === 'admin' && <div className="absolute inset-0 z-20"><AdminView onLogout={handleLogout} token={token || ''} /></div>}
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
    </div>
  );
};

const App: React.FC = () => <LanguageProvider><AppContent /></LanguageProvider>;
export default App;
