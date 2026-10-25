
import React, { useState, useEffect } from 'react';
import { Wine, WineType, Location, LocationKind, LocationLayout } from '../types';
import WineCard from '../components/WineCard';
import AddWineModal from '../components/AddWineModal';
import WineDetailModal from '../components/WineDetailModal';
import LocationManagerModal from '../components/LocationManagerModal';
import LocationConfiguratorModal from '../components/LocationConfiguratorModal';
import Cellar3DModal from '../components/Cellar3DModal';
import { formatSlot, is3DLocation, slotInRange } from '../services/cellarLayout';
import OnboardingModal from '../components/OnboardingModal'; 
import UserProfileModal from '../components/UserProfileModal'; 
import { PlusIcon, CogIcon, UserIcon, HelpIcon } from '../components/Icons';
import { Logo } from '../components/Logo';
import { useLanguage } from '../contexts/LanguageContext';
import { classifyWineType, wineTypeMatchesFilter } from '../services/wineTypeClassifier';

interface InventoryViewProps {
  wines: Wine[];
  locations: Location[];
  onAddWine: (wine: Wine) => void;
  onUpdateWine: (wine: Wine) => void;
  onConsume: (wine: Wine) => void;
  onDelete: (id: string) => void;
  onAddLocation: (name: string) => void;
  onUpdateLocation: (id: string, kind: LocationKind, layout?: LocationLayout) => void;
  onDeleteLocation: (id: string) => void;
  onLogout: () => void;
  onAiUsed: () => void; 
  isPremium: boolean; 
}

type FilterType = 'all' | WineType | 'still';

const InventoryView: React.FC<InventoryViewProps> = ({ 
    wines, locations, onAddWine, onUpdateWine, onConsume, onDelete, onAddLocation, onUpdateLocation, onDeleteLocation, onLogout, onAiUsed, isPremium
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLocManagerOpen, setIsLocManagerOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false); 
  const [isProfileOpen, setIsProfileOpen] = useState(false); 
  const [selectedWineId, setSelectedWineId] = useState<string | null>(null);
  const selectedWine = selectedWineId ? wines.find(w => w.id === selectedWineId) || null : null;
  const setSelectedWine = (w: Wine | null) => setSelectedWineId(w ? w.id : null);
  const [configLocation, setConfigLocation] = useState<Location | null>(null);
  const [viewer3D, setViewer3D] = useState<{ locationId: string | null; placingWineId?: string | null } | null>(null);
  const has3DLocations = locations.some(is3DLocation);

  const slotLabelFor = (wine: Wine) => {
    const loc = locations.find(l => l.name === wine.location);
    if (!is3DLocation(loc)) return undefined;
    const slots = (wine.cellarSlots || []).filter(s => slotInRange(loc.layout, s));
    if (slots.length === 0) return 'Da posizionare';
    if (slots.length === 1) return formatSlot(loc.layout, slots[0], loc.kind);
    return `${slots.length}/${wine.quantity} posizionate`;
  };
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [locationFilter, setLocationFilter] = useState<string>('all');
  
  const { t } = useLanguage();

  // Controllo Primo Accesso (Tutorial)
  useEffect(() => {
    const hasSeenTutorial = localStorage.getItem('vinovault_tutorial_seen');
    if (!hasSeenTutorial) {
      setIsHelpOpen(true);
    }
  }, []);

  const handleCloseHelp = () => {
    setIsHelpOpen(false);
    localStorage.setItem('vinovault_tutorial_seen', 'true');
  };

  const getUserEmail = () => {
    const token = localStorage.getItem('vinovault_token');
    if (!token) return null;
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.email;
    } catch (e) {
        return null;
    }
  };

  const filteredWines = wines.filter(w => {
    // FILTRO CRITICO: Non mostrare bottiglie finite
    if (w.quantity <= 0) return false;

    const nameMatch = w.name?.toLowerCase() || '';
    const producerMatch = w.producer?.toLowerCase() || '';
    const typeMatch = w.type?.toLowerCase() || '';
    const term = searchTerm.toLowerCase();

    const matchesSearch = 
        nameMatch.includes(term) || 
        producerMatch.includes(term) ||
        typeMatch.includes(term);
    
    let matchesFilter = true;
    if (activeFilter !== 'all') {
        if (activeFilter === 'still') {
            matchesFilter = classifyWineType(w.type) !== 'sparkling';
        } else {
            matchesFilter = wineTypeMatchesFilter(w.type, activeFilter);
        }
    }

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
      <div className="bg-white px-4 md:px-6 pt-3 md:pt-5 pb-2 md:pb-4 sticky top-0 z-10 shadow-sm">
        <div className="flex justify-between items-center mb-2">
          <div className="transform scale-90 origin-left md:hidden">
             <Logo className="w-10 h-10" />
          </div>
          <h1 className="hidden md:block text-2xl font-serif font-bold text-gray-900">{t('nav_cellar')}</h1>

          <div className="flex gap-1.5">
             <button 
                onClick={() => setIsHelpOpen(true)}
                className="bg-wine-50 text-wine-700 p-2 rounded-full hover:bg-wine-100 transition-colors"
             >
                <HelpIcon className="w-5 h-5" />
             </button>

             <button 
                onClick={() => setIsProfileOpen(true)}
                className="bg-gray-100 text-gray-700 p-2 rounded-full hover:bg-gray-200 transition-colors border border-gray-200"
            >
                <UserIcon className="w-5 h-5" />
            </button>

            <button 
                onClick={() => setIsLocManagerOpen(true)}
                className="bg-gray-100 text-gray-600 p-2 rounded-full hover:bg-gray-200 transition-colors"
            >
                <CogIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        <div className="flex gap-2 mb-3 text-xs text-gray-500 bg-gray-50 p-2 md:p-3 rounded-lg justify-around md:justify-start md:gap-8">
            <div className="text-center md:text-left">
                <span className="block font-bold text-gray-900 text-base md:text-xl">{totalBottles}</span>
                {t('bottles')}
            </div>
            <div className="w-px bg-gray-200 md:hidden"></div>
            <div className="text-center md:text-left">
                <span className="block font-bold text-gray-900 text-base md:text-xl">{wines.filter(w => w.quantity > 0).length}</span>
                {t('labels')}
            </div>
            <div className="w-px bg-gray-200 md:hidden"></div>
            <div className="text-center md:text-left">
                <span className="block font-bold text-gray-900 text-base md:text-xl">€{totalValue.toFixed(0)}</span>
                {t('value')}
            </div>
        </div>

        <div className="flex gap-2 mb-2 md:max-w-xl">
             <input
                type="text"
                placeholder={t('search_placeholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 bg-gray-100 border-none rounded-xl py-2 px-4 text-sm text-gray-700 focus:ring-2 focus:ring-wine-500 outline-none"
            />
            <select
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                className="bg-gray-100 border-none rounded-xl py-2 px-2 text-sm text-gray-700 focus:ring-2 focus:ring-wine-500 outline-none max-w-[100px] md:max-w-[160px] truncate"
            >
                <option value="all">{t('location')}</option>
                {locations.map(loc => (
                    <option key={loc.id} value={loc.name}>{loc.name}</option>
                ))}
            </select>
            {has3DLocations && (
                <button
                    onClick={() => {
                        const selected = locations.find(l => l.name === locationFilter);
                        setViewer3D({ locationId: is3DLocation(selected) ? selected.id : null });
                    }}
                    className="shrink-0 flex items-center gap-1.5 bg-wine-700 text-white rounded-xl py-2 px-3 text-xs font-bold hover:bg-wine-800 shadow-sm"
                    title="Apri la cantina in 3D"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="m21 7.5-9-5.25L3 7.5m18 0-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" /></svg>
                    <span className="hidden sm:inline">Vista 3D</span>
                </button>
            )}
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
            <button onClick={() => setActiveFilter('all')} className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-medium transition-colors border ${activeFilter === 'all' ? 'bg-wine-600 text-white border-wine-600' : 'bg-white text-gray-600 border-gray-200'}`}>{t('filter_all')}</button>
            <button onClick={() => setActiveFilter(WineType.RED)} className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-medium transition-colors border ${activeFilter === WineType.RED ? 'bg-wine-600 text-white border-wine-600' : 'bg-white text-gray-600 border-gray-200'}`}>{t('filter_red')}</button>
            <button onClick={() => setActiveFilter(WineType.WHITE)} className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-medium transition-colors border ${activeFilter === WineType.WHITE ? 'bg-wine-600 text-white border-wine-600' : 'bg-white text-gray-600 border-gray-200'}`}>{t('filter_white')}</button>
            <button onClick={() => setActiveFilter(WineType.SPARKLING)} className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-medium transition-colors border ${activeFilter === WineType.SPARKLING ? 'bg-wine-600 text-white border-wine-600' : 'bg-white text-gray-600 border-gray-200'}`}>{t('filter_bubbles')}</button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-6 pb-32">
        {filteredWines.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p>{t('no_wines')}</p>
          </div>
        ) : (
          <div className="space-y-3 md:space-y-0 md:grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 md:gap-4 md:items-start">
            {filteredWines.map(wine => (
              <WineCard
                key={wine.id}
                wine={wine}
                slotLabel={slotLabelFor(wine)}
                onClick={(w) => setSelectedWine(w)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Floating Action Button (FAB) for adding wine */}
      <button
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-24 md:bottom-8 right-6 md:right-8 z-30 bg-wine-600 text-white w-14 h-14 rounded-full shadow-xl shadow-wine-900/20 flex items-center justify-center hover:bg-wine-700 transition-transform active:scale-95"
        aria-label={t('add_wine')}
      >
        <PlusIcon className="w-8 h-8" />
      </button>

      <AddWineModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAdd={onAddWine}
        locations={locations}
        inventory={wines}
        onAiUsed={onAiUsed}
      />

      <LocationManagerModal 
        isOpen={isLocManagerOpen}
        onClose={() => setIsLocManagerOpen(false)}
        locations={locations}
        onAddLocation={onAddLocation}
        onDeleteLocation={onDeleteLocation}
        onConfigure={(loc) => setConfigLocation(loc)}
        onOpen3D={(loc) => { setIsLocManagerOpen(false); setViewer3D({ locationId: loc.id }); }}
      />

      <LocationConfiguratorModal
        isOpen={!!configLocation}
        location={configLocation}
        wines={wines}
        onClose={() => setConfigLocation(null)}
        onSave={(kind, layout) => configLocation && onUpdateLocation(configLocation.id, kind, layout)}
      />

      <Cellar3DModal
        isOpen={!!viewer3D}
        locations={locations}
        initialLocationId={viewer3D?.locationId || null}
        initialPlacingWineId={viewer3D?.placingWineId || null}
        wines={wines}
        onClose={() => setViewer3D(null)}
        onUpdateWine={onUpdateWine}
        onOpenWine={(w) => { setViewer3D(null); setSelectedWine(w); }}
      />

      <OnboardingModal
        isOpen={isHelpOpen}
        onClose={handleCloseHelp}
      />

      <UserProfileModal 
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        onLogout={onLogout}
        userEmail={getUserEmail()}
      />

      <WineDetailModal 
        wine={selectedWine}
        locations={locations}
        onClose={() => setSelectedWine(null)}
        onConsume={onConsume}
        onUpdateWine={onUpdateWine}
        onDelete={onDelete}
        isPremium={isPremium}
        onPlaceIn3D={(w) => {
            const loc = locations.find(l => l.name === w.location);
            setViewer3D({ locationId: loc?.id || null, placingWineId: w.id });
        }}
      />
    </div> 
  );
};

export default InventoryView;
