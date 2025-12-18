
import React, { useState } from 'react';
import { Wine, PairingSuggestion } from '../types';
import { suggestPairing } from '../services/geminiService';
import { ChefIcon, LogoutIcon, ThermometerIcon, ClockIcon, StarIcon, ShoppingCartIcon, WineIcon } from '../components/Icons';
import { useLanguage } from '../contexts/LanguageContext';
import LoadingScreen from '../components/LoadingScreen';

interface SommelierViewProps {
  inventory: Wine[];
  onLogout: () => void;
  onAiUsed: () => void;
  onConsume: (wine: Wine) => void;
}

const SommelierView: React.FC<SommelierViewProps> = ({ inventory, onLogout, onAiUsed, onConsume }) => {
  const [menuText, setMenuText] = useState('');
  const [style, setStyle] = useState<'single' | 'multiple'>('multiple');
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<PairingSuggestion[]>([]);
  const [showCopyFeedback, setShowCopyFeedback] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  
  const { t, language } = useLanguage();

  const handleSuggestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!menuText.trim()) return;

    setLoading(true);
    setSuggestions([]);
    try {
      const availableInventory = inventory.filter(w => w.quantity > 0);
      const results = await suggestPairing(menuText, 4, availableInventory, style, language);
      setSuggestions(results);
      onAiUsed(); 
    } catch (error: any) {
      console.error(error);
      alert(`${t('error')}: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    if (!menuText || suggestions.length === 0 || isSharing) return;

    setIsSharing(true);
    try {
        const shareData = {
            menu: menuText,
            suggestions: suggestions.map(s => ({
                course: s.courseName,
                dish: s.dishName,
                wine: s.options[0]?.wineName,
                reason: s.options[0]?.reasoning,
                temp: s.options[0]?.servingTemp,
                advice: s.options[0]?.servingAdvice
            }))
        };

        const res = await fetch('/api/shares', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ data: shareData })
        });
        
        if (!res.ok) throw new Error("Sharing failed");
        
        const { id } = await res.json();
        const shareUrl = `${window.location.origin}${window.location.pathname}?s=${id}`;

        await navigator.clipboard.writeText(shareUrl);
        setShowCopyFeedback(true);
        setTimeout(() => setShowCopyFeedback(false), 3000);
    } catch (e) {
        alert("Errore nella generazione del link di condivisione.");
    } finally {
        setIsSharing(false);
    }
  };

  const getInventoryWine = (id?: string) => inventory.find(w => w.id === id);

  return (
    <div className="h-full flex flex-col bg-stone-50 overflow-hidden relative">
      {loading && <LoadingScreen message={t('ai_analyzing')} subMessage="Il Sommelier sta consultando la tua cantina..." />}

      <div className="bg-white border-b border-gray-200 p-6 shadow-sm z-10 flex justify-between items-start">
        <div>
            <h1 className="text-2xl font-serif font-bold text-gray-900 flex items-center gap-2">
                <ChefIcon className="w-8 h-8 text-wine-600" />
                {t('sommelier_title')}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
                {t('sommelier_desc')}
            </p>
        </div>
        <button 
            onClick={onLogout}
            className="text-gray-400 hover:text-wine-700 p-2"
            title={t('logout')}
        >
            <LogoutIcon className="w-6 h-6" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 pb-24">
        <form onSubmit={handleSuggestion} className="bg-white rounded-xl shadow-sm p-4 border border-gray-200 mb-6">
            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Menu</label>
                <textarea 
                    value={menuText}
                    onChange={(e) => setMenuText(e.target.value)}
                    placeholder={t('menu_placeholder')}
                    className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-wine-500 outline-none resize-none"
                    required
                />
            </div>

            <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('service_type')}</label>
                <div className="grid grid-cols-2 gap-3">
                    <button
                        type="button"
                        onClick={() => setStyle('multiple')}
                        className={`p-3 rounded-xl border text-sm font-bold transition-all flex flex-col items-center justify-center gap-1 ${
                            style === 'multiple' 
                            ? 'bg-wine-50 border-wine-600 text-wine-800 ring-1 ring-wine-600 shadow-sm' 
                            : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50 hover:border-gray-300'
                        }`}
                    >
                        <span>🍽️ {t('per_course')}</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setStyle('single')}
                        className={`p-3 rounded-xl border text-sm font-bold transition-all flex flex-col items-center justify-center gap-1 ${
                            style === 'single' 
                            ? 'bg-wine-50 border-wine-600 text-wine-800 ring-1 ring-wine-600 shadow-sm' 
                            : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50 hover:border-gray-300'
                        }`}
                    >
                        <span>🍾 {t('single_wine')}</span>
                    </button>
                </div>
            </div>

            <button 
                type="submit" 
                disabled={loading}
                className={`w-full py-3 rounded-lg text-white font-medium shadow-md transition-all ${
                    loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-wine-600 hover:bg-wine-700'
                }`}
            >
                {t('ask_sommelier')}
            </button>
        </form>

        {suggestions.length > 0 && (
            <div className="space-y-8 animate-in slide-in-from-bottom duration-500 pb-12">
                <div className="flex justify-between items-center border-l-4 border-wine-500 pl-3">
                    <h3 className="text-xl font-serif font-bold text-gray-800">Suggerimenti</h3>
                    <button 
                        onClick={handleShare}
                        disabled={isSharing}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${showCopyFeedback ? 'bg-green-600 text-white' : 'bg-wine-50 text-wine-700 hover:bg-wine-100 border border-wine-100'} ${isSharing ? 'opacity-50' : ''}`}
                    >
                        {showCopyFeedback ? '✓ Link Copiato' : isSharing ? 'Generazione...' : <><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0-10.628a2.25 2.25 0 1 0 0-4.5 2.25 2.25 0 0 0 0 4.5Zm0 10.628a2.25 2.25 0 1 0 0-4.5 2.25 2.25 0 0 0 0 4.5Z" /></svg> {t('share_pairing')}</>}
                    </button>
                </div>
                
                {suggestions.map((suggestion, idx) => (
                    <div key={idx} className="space-y-2">
                        <div className="flex items-center gap-2">
                            <span className="font-bold text-wine-900 uppercase text-sm tracking-wider bg-wine-100 px-2 py-1 rounded">
                                {suggestion.courseName}
                            </span>
                            <span className="text-sm text-gray-600 italic border-l border-gray-300 pl-2">
                                {suggestion.dishName}
                            </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {suggestion.options.map((option, optIdx) => {
                                const ownedWine = option.type === 'owned' && option.wineId 
                                    ? getInventoryWine(option.wineId) 
                                    : null;

                                return (
                                    <div key={optIdx} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-full hover:shadow-md transition-shadow">
                                        <div className="bg-gray-50 px-3 py-1.5 border-b border-gray-100 flex justify-between items-center">
                                            <span className="text-xs font-bold text-gray-500 uppercase">Option {optIdx + 1}</span>
                                            {ownedWine ? (
                                                <span className="text-[10px] font-bold text-green-700 bg-green-100 px-1.5 py-0.5 rounded uppercase">In Cellar</span>
                                            ) : (
                                                <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded uppercase">To Buy</span>
                                            )}
                                        </div>

                                        <div className="p-3 flex-1 flex flex-col">
                                            <p className="text-sm text-gray-600 italic mb-3 flex-grow">
                                                "{option.reasoning}"
                                            </p>

                                            <div className="flex gap-4 mb-3 text-xs text-gray-500 bg-stone-50 p-2 rounded-lg border border-stone-100">
                                                <div className="flex items-center gap-1.5">
                                                    <ThermometerIcon className="w-4 h-4 text-wine-600" />
                                                    <span>{option.servingTemp || '16-18°C'}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <ClockIcon className="w-4 h-4 text-wine-600" />
                                                    <span className="truncate">{option.servingAdvice || 'Aprire prima'}</span>
                                                </div>
                                            </div>

                                            {ownedWine ? (
                                                <div className="bg-green-50/50 border border-green-100 rounded-lg p-3 flex flex-col gap-2">
                                                    <div className="flex gap-2 items-start">
                                                        <div className="w-10 h-10 bg-white rounded flex items-center justify-center flex-shrink-0 border border-green-100 overflow-hidden">
                                                            {ownedWine.imageUrl ? (
                                                                <img src={ownedWine.imageUrl} className="w-full h-full object-cover" />
                                                            ) : (
                                                                <WineIcon className="text-green-600 w-5 h-5" />
                                                            )}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="font-bold text-gray-900 text-sm leading-tight truncate">{ownedWine.name}</p>
                                                            <p className="text-[10px] text-gray-500">{ownedWine.year} • {ownedWine.producer}</p>
                                                        </div>
                                                    </div>
                                                    <button 
                                                        onClick={() => onConsume(ownedWine)}
                                                        className="w-full py-2 bg-green-600 text-white text-xs font-bold rounded-lg hover:bg-green-700 shadow-sm flex items-center justify-center gap-2 mt-2"
                                                    >
                                                        <StarIcon className="w-3 h-3" filled={false} />
                                                        Open
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-3 flex gap-3 items-center">
                                                     <div className="w-10 h-10 bg-white rounded flex items-center justify-center flex-shrink-0 border border-blue-100">
                                                        <ShoppingCartIcon className="text-blue-400 w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-gray-900 text-sm leading-tight">{option.wineName}</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        )}
      </div>
    </div>
  );
};

export default SommelierView;
