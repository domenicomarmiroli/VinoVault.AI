
import React, { useState, useEffect, useRef } from 'react';
import { Wine, HistoryEntry, Location, Restaurant, Language } from './types';
import InventoryView from './views/InventoryView';
import HistoryView from './views/HistoryView';
import ShopView from './views/ShopView';
import AnalyticsView from './views/AnalyticsView';
import RestaurantView from './views/RestaurantView';
import SommelierView from './views/SommelierView';
import AdminView from './views/AdminView';
import RestaurantCellarView from './views/RestaurantCellarView';
import AuthForm from './components/AuthForm';
import LandingPage from './components/LandingPage'; 
import LoadingScreen from './components/LoadingScreen';
import { WineIcon, HistoryIcon, ShopIcon, ChartBarIcon, RestaurantIcon, ShieldCheckIcon, ChefIcon, UserIcon } from './components/Icons';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';

const AppContent: React.FC = () => {
  const tokenRef = useRef<string | null>(localStorage.getItem('vinovault_token'));
  const [token, setToken] = useState<string | null>(tokenRef.current);
  
  const [userRole, setUserRole] = useState<'user' | 'admin' | 'restaurant'>('user'); 
  const [userPremium, setUserPremium] = useState(false);
  const { t, language } = useLanguage();

  const [activeTab, setActiveTab] = useState<string>('inventory');
  
  const [wines, setWines] = useState<Wine[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [isInitializing, setIsInitializing] = useState(true);
  const [restaurantData, setRestaurantData] = useState<Restaurant | null>(null);
  const [showAuth, setShowAuth] = useState(false);

  const authFetch = async (url: string, options: RequestInit = {}) => {
      const currentToken = tokenRef.current || localStorage.getItem('vinovault_token');
      const headers = { 'Content-Type': 'application/json', ...(options.headers || {}), 'Authorization': `Bearer ${currentToken}` };
      return fetch(url, { ...options, headers });
  };

  const handleLogin = (newToken: string) => {
      localStorage.setItem('vinovault_token', newToken);
      tokenRef.current = newToken;
      setToken(newToken);
      setShowAuth(false);
      try {
        const payload = JSON.parse(atob(newToken.split('.')[1]));
        setUserRole(payload.role || 'user');
        setUserPremium(payload.isPremium || false);
        
        if (payload.role === 'admin') setActiveTab('admin');
        else if (payload.role === 'restaurant') setActiveTab('wine_list_mgmt');
        else setActiveTab('inventory');
      } catch (e) {}
      setIsInitializing(false);
  };

  const handleLogout = () => {
      localStorage.removeItem('vinovault_token');
      tokenRef.current = null;
      setToken(null);
      setUserRole('user');
      setUserPremium(false);
      window.history.pushState({}, '', '/');
  };

  useEffect(() => {
    if (!token) { setIsInitializing(false); return; }
    const fetchData = async () => {
      try {
        const [winesRes, historyRes, profileRes] = await Promise.all([
          authFetch('/api/wines'),
          authFetch('/api/history'),
          authFetch('/api/users/me')
        ]);
        if (profileRes.ok) {
            const profile = await profileRes.json();
            setUserPremium(profile.is_premium || false);
            setUserRole(profile.role || 'user');
            if (profile.role === 'admin') setActiveTab('admin');
            else if (profile.role === 'restaurant') setActiveTab('wine_list_mgmt');
        }
        if (winesRes.ok) setWines(await winesRes.json());
        if (historyRes.ok) setHistory(await historyRes.json());
      } catch (e) { console.error(e); }
      finally { setIsInitializing(false); }
    };
    fetchData();
  }, [token]);

  const getTabs = () => {
    if (userRole === 'admin') {
        return [
          { id: 'admin', icon: ShieldCheckIcon, label: 'Admin' }
        ];
    }
    if (userRole === 'restaurant') {
        return [
          { id: 'shop', icon: ShopIcon, label: t('nav_shop') },
          { id: 'sommelier', icon: ChefIcon, label: t('nav_sommelier') },
          { id: 'wine_list_mgmt', icon: RestaurantIcon, label: 'Carta Vini' }
        ];
    }
    return [
      { id: 'inventory', icon: WineIcon, label: t('nav_cellar') },
      { id: 'shop', icon: ShopIcon, label: t('nav_shop') },
      { id: 'sommelier', icon: ChefIcon, label: t('nav_sommelier') },
      { id: 'restaurant', icon: RestaurantIcon, label: t('nav_restaurant') },
      { id: 'analytics', icon: ChartBarIcon, label: t('nav_data') },
      { id: 'history', icon: HistoryIcon, label: t('nav_history') }
    ];
  };

  if (isInitializing) return <LoadingScreen />;

  if (!token) {
    if (showAuth) return <AuthForm onLogin={handleLogin} onBack={() => setShowAuth(false)} referralRef={restaurantData?.slug} />;
    return <LandingPage onStart={() => setShowAuth(true)} onOpenGuide={() => {}} />;
  }

  return (
    <div className="flex flex-col h-full w-full md:max-w-md mx-auto bg-white shadow-2xl overflow-hidden md:border-x md:border-gray-200">
      <main className="flex-1 overflow-hidden relative">
        {userRole === 'admin' ? (
             <div className="absolute inset-0"><AdminView onLogout={handleLogout} token={token || ''} /></div>
        ) : userRole === 'restaurant' ? (
            <>
                <div className={`absolute inset-0 transition-opacity ${activeTab === 'shop' ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}><ShopView inventory={[]} onLogout={handleLogout} onAddToInventory={() => {}} onAiUsed={() => {}} isPremium={userPremium} /></div>
                <div className={`absolute inset-0 transition-opacity ${activeTab === 'sommelier' ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}><SommelierView inventory={[]} onLogout={handleLogout} onAiUsed={() => {}} onConsume={() => {}} /></div>
                <div className={`absolute inset-0 transition-opacity ${activeTab === 'wine_list_mgmt' ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}><RestaurantCellarView onLogout={handleLogout} /></div>
            </>
        ) : (
            <>
                <div className={`absolute inset-0 transition-opacity ${activeTab === 'inventory' ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}><InventoryView wines={wines} locations={[]} onAddWine={() => {}} onUpdateWine={() => {}} onConsume={() => {}} onDelete={() => {}} onAddLocation={() => {}} onDeleteLocation={() => {}} onLogout={handleLogout} onAiUsed={() => {}} isPremium={userPremium} /></div>
                <div className={`absolute inset-0 transition-opacity ${activeTab === 'shop' ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}><ShopView inventory={wines} onLogout={handleLogout} onAddToInventory={() => {}} onAiUsed={() => {}} isPremium={userPremium} /></div>
                <div className={`absolute inset-0 transition-opacity ${activeTab === 'sommelier' ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}><SommelierView inventory={wines} onLogout={handleLogout} onAiUsed={() => {}} onConsume={() => {}} /></div>
                <div className={`absolute inset-0 transition-opacity ${activeTab === 'restaurant' ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}><RestaurantView onLogout={handleLogout} onAddToHistory={() => {}} onAiUsed={() => {}} onClearRestaurant={() => {}} restaurantData={restaurantData} /></div>
                <div className={`absolute inset-0 transition-opacity ${activeTab === 'analytics' ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}><AnalyticsView inventory={wines} history={history} onLogout={handleLogout} isPremium={userPremium} onAiUsed={() => {}} /></div>
                <div className={`absolute inset-0 transition-opacity ${activeTab === 'history' ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}><HistoryView wines={wines} history={history} onClearHistory={() => {}} onLogout={handleLogout} onUpdateHistoryEntry={() => {}} onDeleteHistoryEntry={() => {}} isPremium={userPremium} onAiUsed={() => {}} /></div>
            </>
        )}
      </main>
      <nav className="bg-white border-t border-gray-200 flex justify-between px-2 pb-safe z-50 overflow-x-auto">
        {getTabs().map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex-1 flex flex-col items-center p-2 rounded-xl transition-all min-w-[3.5rem] ${activeTab === tab.id ? 'text-wine-700' : 'text-gray-400'}`}>
            <tab.icon className="w-6 h-6 mb-1" filled={activeTab === tab.id} />
            <span className="text-[8px] font-bold uppercase tracking-wider">{tab.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
};

const App: React.FC = () => <LanguageProvider><AppContent /></LanguageProvider>;
export default App;
