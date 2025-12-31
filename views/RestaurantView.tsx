
import React, { useState, useRef } from 'react';
import { suggestRestaurantPairing } from '../services/geminiService';
import { RestaurantSuggestion, HistoryEntry, Restaurant } from '../types';
import { CameraIcon, LogoutIcon, RestaurantIcon, PlusIcon, HelpIcon } from '../components/Icons';
import { useLanguage } from '../contexts/LanguageContext';
import LoadingScreen from '../components/LoadingScreen';

interface RestaurantViewProps {
  onLogout: () => void;
  onAddToHistory: (entry: Partial<HistoryEntry>) => void;
  onAiUsed: () => void;
  onClearRestaurant: () => void;
  restaurantData: Restaurant | null; 
}

const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 800;
                const MAX_HEIGHT = 800;
                let width = img.width;
                let height = img.height;
                if (width > height) {
                    if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
                } else {
                    if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; }
                }
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.drawImage(img, 0, 0, width, height);
                    resolve(canvas.toDataURL('image/jpeg', 0.7));
                } else reject(new Error("Canvas error"));
            };
            img.onerror = (err) => reject(err);
        };
        reader.onerror = (err) => reject(err);
    });
};

const RestaurantView: React.FC<RestaurantViewProps> = ({ onLogout, onAddToHistory, onAiUsed, onClearRestaurant, restaurantData }) => {
  const [dish, setDish] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<RestaurantSuggestion[]>([]);
  const [selectedWine, setSelectedWine] = useState<RestaurantSuggestion | null>(null);
  const [confirmPrice, setConfirmPrice] = useState<string>('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { t, language } = useLanguage();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
        const files = Array.from(e.target.files) as File[];
        const remainingSlots = 3 - images.length;
        const filesToProcess = files.slice(0, remainingSlots);

        for (const file of filesToProcess) {
            try {
                const compressed = await compressImage(file);
                setImages(prev => [...prev, compressed]);
            } catch(err) {
                console.error("Compression error", err);
                alert(t('error'));
            }
        }
    }
  };

  const removeImage = (index: number) => {
      setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleAnalyze = async (e: React.FormEvent) => {
      e.preventDefault();
      const hasPreloadedMenu = restaurantData && restaurantData.menu_context;
      if (!dish || (!hasPreloadedMenu && images.length === 0)) return;

      setLoading(true);
      setSuggestions([]);
      try {
          let source: { type: 'images' | 'text', data: string[] | string };
          if (hasPreloadedMenu) {
              source = { type: 'text', data: restaurantData.menu_context! };
          } else {
              source = { type: 'images', data: images };
          }

          const results = await suggestRestaurantPairing(source, dish, language);
          setSuggestions(results);
          onAiUsed();
      } catch (error: any) {
          alert(`${t('error')}: ${error.message}`);
      } finally {
          setLoading(false);
      }
  };

  const handleSelectWine = (suggestion: RestaurantSuggestion) => {
      setSelectedWine(suggestion);
      setConfirmPrice(suggestion.price?.toString() || '');
  };

  const handleConfirmSelection = () => {
      if (!selectedWine) return;
      onAddToHistory({
          name: selectedWine.name,
          producer: selectedWine.producer,
          year: selectedWine.year,
          type: selectedWine.type, 
          price: parseFloat(confirmPrice) || 0,
          consumedDate: new Date().toISOString()
      });
      setSelectedWine(null);
      setSuggestions([]);
      setDish('');
      setImages([]);
  };

  const groupedSuggestions = suggestions.reduce((acc, curr) => {
      const category = curr.priceCategory || 'default';
      if (!acc[category]) acc[category] = [];
      acc[category].push(curr);
      return acc;
  }, {} as Record<string, RestaurantSuggestion[]>);

  const categoryOrder = ['Fascia Economica', 'Fascia Media', 'Fascia Alta', 'default'];
  const sortedCategories = Object.keys(groupedSuggestions).sort((a, b) => {
      return categoryOrder.indexOf(a) - categoryOrder.indexOf(b);
  });

  const hasPreloadedMenu = restaurantData && restaurantData.menu_context;

  return (
    <div className="h-full flex flex-col bg-stone-50 overflow-hidden relative">
      {loading && <LoadingScreen message={t('ai_analyzing')} subMessage="Analisi del menu e ricerca abbinamenti in corso..." />}

      <div className="bg-white border-b border-gray-200 p-6 shadow-sm z-10 flex justify-between items-start">
        <div className="flex-1 min-w-0">
            {hasPreloadedMenu ? (
                <>
                    <p className="text-[10px] font-black text-wine-600 uppercase tracking-[0.2em] mb-1">Sommelier Virtuale</p>
                    <h1 className="text-3xl font-serif font-black text-gray-900 leading-tight truncate">{restaurantData.name}</h1>
                    <p className="text-sm text-gray-500 mt-1 leading-tight">{t('menu_ready').replace('{name}', restaurantData.name)}</p>
                    <button onClick={onClearRestaurant} className="mt-3 text-[9px] font-black text-gray-400 uppercase tracking-widest bg-gray-50 px-2.5 py-1.5 rounded-lg border border-gray-100 hover:bg-red-50 hover:text-red-500 hover:border-red-100 transition-all flex items-center gap-1.5 shadow-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3 h-3"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" /></svg>
                        {t('exit_restaurant')}
                    </button>
                </>
            ) : (
                <>
                    <h1 className="text-2xl font-serif font-bold text-gray-900 flex items-center gap-2">
                        <RestaurantIcon className="w-8 h-8 text-wine-600" filled />
                        {t('nav_restaurant')}
                    </h1>
                    <p className="text-sm text-gray-500 mt-1 leading-tight">{t('restaurant_desc_scan')}</p>
                </>
            )}
        </div>
        <button onClick={onLogout} className="text-gray-400 hover:text-wine-700 p-2 shrink-0"><LogoutIcon className="w-6 h-6" /></button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 pb-32 space-y-6">
        {suggestions.length === 0 && (
            <div className="space-y-4">
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                    <label className="block text-sm font-bold text-gray-700 mb-2">{t('what_eating')}</label>
                    <textarea 
                        value={dish}
                        onChange={(e) => setDish(e.target.value)}
                        placeholder={t('dish_placeholder')}
                        className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-wine-600 outline-none resize-none h-40"
                    />
                </div>

                {hasPreloadedMenu ? (
                    <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
                        <div className="bg-green-100 p-2 rounded-full text-green-700"><RestaurantIcon className="w-6 h-6" filled /></div>
                        <div>
                            <p className="font-bold text-green-800 text-sm">{t('menu_card_loaded')}</p>
                            <p className="text-xs text-green-600">{t('sommelier_knows').replace('{name}', restaurantData.name)}</p>
                        </div>
                    </div>
                ) : (
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">{t('wine_list_photos').replace('{count}', images.length.toString())}</label>
                        <div className="grid grid-cols-3 gap-2">
                            {images.map((img, idx) => (
                                <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 group">
                                    <img src={img} className="w-full h-full object-cover" />
                                    <button onClick={() => removeImage(idx)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-90 shadow-sm">✕</button>
                                </div>
                            ))}
                            {images.length < 3 && (
                                <button onClick={() => fileInputRef.current?.click()} className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center hover:bg-gray-50 transition-colors bg-white">
                                    <CameraIcon className="w-6 h-6 text-gray-400 mb-1" />
                                    <span className="text-[10px] text-gray-500 font-bold uppercase">{t('photo_btn')}</span>
                                </button>
                            )}
                        </div>
                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" capture="environment" multiple onChange={handleFileChange} />
                    </div>
                )}

                <button onClick={handleAnalyze} disabled={!dish || (!hasPreloadedMenu && images.length === 0) || loading} className="w-full py-4 bg-wine-700 text-white font-bold rounded-xl shadow-lg hover:bg-wine-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all mt-4">{t('find_pairing_btn')}</button>
            </div>
        )}

        {suggestions.length > 0 && (
            <div className="space-y-6 animate-in slide-in-from-bottom duration-500">
                <div className="flex justify-between items-center px-1">
                     <h2 className="text-xl font-serif font-bold text-gray-900">{t('best_pairings_title')}</h2>
                     <button onClick={() => setSuggestions([])} className="text-xs text-wine-600 font-black uppercase tracking-widest hover:underline">{t('new_search')}</button>
                </div>

                {sortedCategories.map(catKey => {
                    const items = groupedSuggestions[catKey];
                    if (!items || items.length === 0) return null;
                    return (
                        <div key={catKey}>
                            <h3 className="font-black text-gray-400 uppercase text-[9px] tracking-[0.2em] mb-3 border-b border-gray-100 pb-1.5 ml-1">
                                {catKey === 'default' ? 'Consigli' : catKey}
                            </h3>
                            <div className="space-y-3">
                                {items.map((wine, idx) => {
                                    const safeScore = Number(wine.matchScore);
                                    const matchScore = isNaN(safeScore) ? 0 : safeScore;
                                    
                                    return (
                                        <div key={idx} onClick={() => handleSelectWine(wine)} className={`bg-white p-4 rounded-2xl shadow-sm border border-gray-200 cursor-pointer transition-all hover:shadow-md ${selectedWine === wine ? 'ring-2 ring-wine-600 bg-wine-50' : ''}`}>
                                            <div className="flex justify-between items-start mb-2">
                                                 <div>
                                                     <h3 className="font-bold text-gray-900 leading-tight">{wine.name || 'Vino senza nome'}</h3>
                                                     <p className="text-xs text-gray-600">{wine.producer || 'Sconosciuto'} • {wine.year || 'N/A'}</p>
                                                 </div>
                                                 {wine.price && wine.price > 0 ? <div className="text-lg font-bold text-gray-800 whitespace-nowrap ml-2">€{wine.price}</div> : null}
                                            </div>
                                            
                                            <div className="flex items-center gap-2 mb-3">
                                                 <div className="bg-green-100 text-green-800 text-[10px] font-black px-2 py-0.5 rounded-lg uppercase">
                                                     {t('match_score')} {Math.round(matchScore)}%
                                                 </div>
                                                 <span className="text-[10px] text-gray-400 uppercase font-black tracking-widest">{wine.type}</span>
                                            </div>
                                            
                                            <p className="text-sm text-gray-600 italic border-l-2 border-wine-100 pl-3 leading-relaxed">
                                                "{wine.reasoning || 'Nessun commento disponibile.'}"
                                            </p>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
                
                <div className="mt-6 p-4 bg-indigo-50 border border-indigo-100 rounded-2xl flex gap-3 items-start animate-in fade-in duration-700">
                    <div className="bg-indigo-100 p-2 rounded-full text-indigo-600 shrink-0"><HelpIcon className="w-4 h-4" /></div>
                    <div>
                        <p className="text-sm text-indigo-900 font-bold">{t('tap_to_rate_title')}</p>
                        <p className="text-xs text-indigo-700 mt-1 leading-relaxed">{t('tap_to_rate_desc')}</p>
                    </div>
                </div>
            </div>
        )}

        {selectedWine && (
            <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                 <div className="bg-white w-full max-w-md p-8 rounded-[2rem] shadow-2xl animate-in zoom-in-95 duration-200">
                     <h3 className="font-serif font-black text-xl mb-4 text-center">{t('confirm_choice_title')}</h3>
                     <p className="text-sm text-gray-600 text-center mb-8 leading-relaxed">{t('confirm_choice_desc').replace('{wine}', selectedWine.name)}</p>
                     
                     <div className="mb-10">
                         <label className="block text-[10px] font-black uppercase text-gray-400 mb-2 text-center tracking-[0.2em]">{t('price_paid_label')}</label>
                         <input 
                             type="number" 
                             value={confirmPrice} 
                             onChange={(e) => setConfirmPrice(e.target.value)}
                             className="w-32 mx-auto block text-center p-2 text-3xl font-black border-b-2 border-wine-600 focus:outline-none bg-transparent"
                             autoFocus
                         />
                     </div>
                     
                     <div className="flex flex-col gap-3">
                         <button onClick={handleConfirmSelection} className="w-full py-4 bg-wine-600 text-white font-black uppercase text-xs tracking-widest rounded-2xl shadow-xl shadow-wine-100 hover:bg-wine-700 transition-all active:scale-[0.98]">{t('drink_and_rate')}</button>
                         <button onClick={() => setSelectedWine(null)} className="w-full py-3.5 bg-gray-50 text-gray-400 font-black uppercase text-[10px] tracking-widest rounded-2xl hover:bg-gray-100 transition-colors">{t('cancel')}</button>
                     </div>
                 </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default RestaurantView;
