
import React, { useState, useEffect } from 'react';
import { Wine, WineType, Location } from '../types';
import WineCard from '../components/WineCard';
import AddWineModal from '../components/AddWineModal';
import WineDetailModal from '../components/WineDetailModal';
import LocationManagerModal from '../components/LocationManagerModal';
import OnboardingModal from '../components/OnboardingModal'; 
import UserProfileModal from '../components/UserProfileModal'; 
import { PlusIcon, CogIcon, UserIcon, HelpIcon } from '../components/Icons';
import { Logo } from '../components/Logo';
import { useLanguage } from '../contexts/LanguageContext';

interface InventoryViewProps {
  wines: Wine[];
  locations: Location[];
  onAddWine: (wine: Wine) => void;
  onUpdateWine: (wine: Wine) => void;
  onConsume: (wine: Wine) => void;
  onDelete: (id: string) => void;
  onAddLocation: (name: string) => void;
  onDeleteLocation: (id: string) => void;
  onLogout: () => void;
  onAiUsed: () => void; 
  isPremium: boolean; 
}

type FilterType = 'all' | WineType | 'still';

const InventoryView: React.FC<InventoryViewProps> = ({ 
    wines, locations, onAddWine, onUpdateWine, onConsume, onDelete, onAddLocation, onDeleteLocation, onLogout, onAiUsed, isPremium
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLocManagerOpen, setIsLocManagerOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false); 
  const [isProfileOpen, setIsProfileOpen] = useState(false); 
  const [selectedWine, setSelectedWine] = useState<Wine | null>(null);
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
            matchesFilter = w.type !== WineType.SPARKLING;
        } else {
            matchesFilter = w.type === activeFilter;
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
      <div className="bg-white px-4 pt-3 pb-2 sticky top-0 z-10 shadow-sm">
        <div className="flex justify-between items-center mb-2">
          <div className="transform scale-90 origin-left">
             <Logo className="w-10 h-10" />
          </div>

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
            
            {/* FAB replaces the header button for better mobile UX */}
          </div>
        </div>
        
        <div className="flex gap-2 mb-3 text-xs text-gray-500 bg-gray-50 p-2 rounded-lg justify-around">
            <div className="text-center">
                <span className="block font-bold text-gray-900 text-base">{totalBottles}</span>
                {t('bottles')}
            </div>
            <div className="w-px bg-gray-200"></div>
            <div className="text-center">
                <span className="block font-bold text-gray-900 text-base">{wines.length}</span>
                {t('labels')}
            </div>
            <div className="w-px bg-gray-200"></div>
            <div className="text-center">
                <span className="block font-bold text-gray-900 text-base">€{totalValue.toFixed(0)}</span>
                {t('value')}
            </div>
        </div>

        <div className="flex gap-2 mb-2">
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
                className="bg-gray-100 border-none rounded-xl py-2 px-2 text-sm text-gray-700 focus:ring-2 focus:ring-wine-500 outline-none max-w-[100px] truncate"
            >
                <option value="all">{t('location')}</option>
                {locations.map(loc => (
                    <option key={loc.id} value={loc.name}>{loc.name}</option>
                ))}
            </select>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar -mx-4 px-4">
            <button onClick={() => setActiveFilter('all')} className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-medium transition-colors border ${activeFilter === 'all' ? 'bg-wine-600 text-white border-wine-600' : 'bg-white text-gray-600 border-gray-200'}`}>{t('filter_all')}</button>
            <button onClick={() => setActiveFilter(WineType.RED)} className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-medium transition-colors border ${activeFilter === WineType.RED ? 'bg-wine-600 text-white border-wine-600' : 'bg-white text-gray-600 border-gray-200'}`}>{t('filter_red')}</button>
            <button onClick={() => setActiveFilter(WineType.WHITE)} className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-medium transition-colors border ${activeFilter === WineType.WHITE ? 'bg-wine-600 text-white border-wine-600' : 'bg-white text-gray-600 border-gray-200'}`}>{t('filter_white')}</button>
            <button onClick={() => setActiveFilter(WineType.SPARKLING)} className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-medium transition-colors border ${activeFilter === WineType.SPARKLING ? 'bg-wine-600 text-white border-wine-600' : 'bg-white text-gray-600 border-gray-200'}`}>{t('filter_bubbles')}</button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-32">
        {filteredWines.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p>{t('no_wines')}</p>
          </div>
        ) : (
          filteredWines.map(wine => (
            <WineCard 
              key={wine.id} 
              wine={wine} 
              onClick={(w) => setSelectedWine(w)}
            />
          ))
        )}
      </div>

      {/* Floating Action Button (FAB) for adding wine */}
      <button 
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-24 right-6 z-30 bg-wine-600 text-white w-14 h-14 rounded-full shadow-xl shadow-wine-900/20 flex items-center justify-center hover:bg-wine-700 transition-transform active:scale-95"
        aria-label={t('add_wine')}
      >
        <PlusIcon className="w-8 h-8" />
      </button>

      <AddWineModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onAdd={onAddWine}
        locations={locations}
        onAiUsed={onAiUsed} 
      />

      <LocationManagerModal 
        isOpen={isLocManagerOpen}
        onClose={() => setIsLocManagerOpen(false)}
        locations={locations}
        onAddLocation={onAddLocation}
        onDeleteLocation={onDeleteLocation}
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
      />
    </div> 
  );
};

export default InventoryView;
