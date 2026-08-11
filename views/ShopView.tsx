
import React, { useState, useRef } from 'react';
import { Wine, PurchaseAnalysis } from '../types';
import { analyzePurchase } from '../services/geminiService';
import { CameraIcon, LogoutIcon, ShopIcon, WineIcon, ExternalLinkIcon, ChefIcon } from '../components/Icons';
import PriceComparison from '../components/PriceComparison';
import { useLanguage } from '../contexts/LanguageContext';
import { useAnalysisStyle } from '../contexts/AnalysisStyleContext';
import LoadingScreen from '../components/LoadingScreen';

interface ShopViewProps {
  inventory: Wine[];
  onLogout: () => void;
  onAddToInventory: (wine: Wine) => void;
  onAiUsed: () => void;
  isPremium: boolean;
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

const ShopView: React.FC<ShopViewProps> = ({ inventory, onLogout, onAddToInventory, onAiUsed, isPremium }) => {
  const [mode, setMode] = useState<'camera' | 'link'>('camera');
  const [image, setImage] = useState<string | null>(null);
  const [linkUrl, setLinkUrl] = useState('');
  const [price, setPrice] = useState<number | ''>('');
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<PurchaseAnalysis | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { t, language } = useLanguage();
  const { analysisStyle } = useAnalysisStyle();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          try {
              const compressed = await compressImage(file);
              setImage(compressed);
          } catch(err) {
              alert(t('error'));
          }
      }
  };

  const handleAnalyze = async (e: React.FormEvent) => {
      e.preventDefault();
      if (mode === 'camera' && !image) return;
      if (mode === 'link' && !linkUrl) return;
      if (!price) { alert(t('error')); return; }

      const inputPrice = Number(price);
      setLoading(true);
      setAnalysis(null);
      try {
          const input = mode === 'camera' ? { type: 'image' as const, data: image! } : { type: 'url' as const, data: linkUrl };
          const result = await analyzePurchase(input, inputPrice, inventory, language, analysisStyle);
          
          if (!result.wineDetails) {
              // Added missing 'year' property to satisfy the PurchaseAnalysis interface requirements
              result.wineDetails = { name: 'Unknown', producer: 'Unknown', year: 'N/A', type: 'Rosso' as any };
          }
          
          setAnalysis(result);
          onAiUsed(); 
      } catch (error: any) {
          alert(`${t('error')}: ${error.message}`);
      } finally {
          setLoading(false);
      }
  };

  const handleBuy = () => {
      if (!analysis) return;
      const today = new Date().toISOString().split('T')[0];
      const safeMarketPrice = Number(analysis.marketPriceEstimate) || Number(price) || 0;
      
      const newWine: Wine = {
          id: '',
          name: analysis.wineDetails?.name || 'Nuovo Acquisto',
          producer: analysis.wineDetails?.producer || 'Sconosciuto',
          year: analysis.wineDetails?.year || 'N/A',
          type: analysis.wineDetails?.type as any || 'Rosso',
          region: analysis.wineDetails?.region || '',
          grape: analysis.wineDetails?.grape || '',
          alcohol: analysis.wineDetails?.alcohol || '',
          purchaseDate: today,
          price: Number(price) || safeMarketPrice,
          quantity: 1,
          location: 'Da posizionare',
          storageTemp: '12-16°C',
          storageAdvice: 'Da verificare',
          servingTemp: '16-18°C',
          servingAdvice: 'Aprire prima',
          foodPairings: analysis.wineDetails?.foodPairings || [],
          imageUrl: image || analysis.imageUrl || undefined,
          drinkWindow: `${new Date().getFullYear()}-${new Date().getFullYear() + 3}`,
          marketPrice: safeMarketPrice,
          qualityScore: analysis.qualityScore
      };
      onAddToInventory(newWine);
      setImage(null);
      setLinkUrl('');
      setPrice('');
      setAnalysis(null);
  };

  const getDealColor = (rating: string) => {
      switch(rating) {
          case 'Excellent': return 'bg-green-100 text-green-800 border-green-200';
          case 'Good': return 'bg-blue-50 text-blue-800 border-blue-200';
          case 'Fair': return 'bg-yellow-50 text-yellow-800 border-yellow-200';
          default: return 'bg-red-50 text-red-800 border-red-200';
      }
  };

  const getDealText = (rating: string) => {
      switch(rating) {
          case 'Excellent': return t('deal_excellent');
          case 'Good': return t('deal_good');
          case 'Fair': return t('deal_fair');
          default: return t('deal_bad');
      }
  };

  const getQualityColor = (score: number) => {
      if (score >= 90) return 'border-emerald-500 text-emerald-600 bg-emerald-50';
      if (score >= 80) return 'border-wine-500 text-wine-600 bg-wine-50';
      if (score >= 70) return 'border-yellow-500 text-yellow-600 bg-yellow-50';
      return 'border-gray-300 text-gray-500 bg-gray-50';
  };

  return (
    <div className="h-full flex flex-col bg-stone-50 overflow-hidden relative">
      {loading && (
        <LoadingScreen 
          message={t('ai_analyzing')} 
          subMessage={t('loading_shop')} 
        />
      )}

      <div className="bg-white border-b border-gray-200 p-6 shadow-sm z-10 flex justify-between items-start">
        <div>
            <h1 className="text-2xl font-serif font-bold text-gray-900 flex items-center gap-2">
                <ShopIcon className="w-8 h-8 text-wine-600" filled />
                {t('shop_title')}
            </h1>
            <p className="text-sm text-gray-500 mt-1">{t('shop_desc')}</p>
        </div>
        <button onClick={onLogout} className="text-gray-400 hover:text-wine-700 p-2"><LogoutIcon className="w-6 h-6" /></button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 pb-24">
        {!analysis && (
            <div className="space-y-6">
                <div className="flex p-1 bg-gray-200 rounded-xl">
                    <button onClick={() => setMode('camera')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${mode === 'camera' ? 'bg-white shadow-sm text-wine-700' : 'text-gray-500 hover:text-gray-700'}`}>
                        <CameraIcon className="w-4 h-4" /> {t('photo_mode')}
                    </button>
                    <button onClick={() => setMode('link')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${mode === 'link' ? 'bg-white shadow-sm text-wine-700' : 'text-gray-500 hover:text-gray-700'}`}>
                        <ExternalLinkIcon className="w-4 h-4" /> {t('link_mode')}
                    </button>
                </div>

                {mode === 'camera' ? (
                    <div onClick={() => fileInputRef.current?.click()} className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center transition-all cursor-pointer ${image ? 'border-wine-500 bg-wine-50' : 'border-gray-300 hover:bg-gray-50'}`}>
                        {image ? <img src={image} alt="Preview" className="h-48 object-contain rounded shadow-sm" /> : <><div className="bg-wine-100 p-4 rounded-full mb-3"><CameraIcon className="w-8 h-8 text-wine-600" /></div><span className="font-medium text-gray-600">{t('scan_label')}</span></>}
                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" capture="environment" onChange={handleFileChange} />
                    </div>
                ) : (
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                        <label className="block text-sm font-bold text-gray-700 mb-2">Link</label>
                        <input type="url" value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-wine-600 outline-none" placeholder="https://..." />
                    </div>
                )}

                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                    <label className="block text-sm font-bold text-gray-700 mb-2">{t('offer_price')} (€) <span className="text-red-500">*</span></label>
                    <input type="number" required value={price} onChange={(e) => setPrice(Number(e.target.value))} className="w-full p-3 text-lg border border-gray-300 rounded-xl focus:ring-2 focus:ring-wine-600 outline-none" />
                </div>

                <button onClick={handleAnalyze} disabled={loading} className="w-full py-4 bg-wine-700 text-white font-bold rounded-xl shadow-lg hover:bg-wine-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all">
                    {loading ? t('ai_analyzing') : t('analyze_btn')}
                </button>
            </div>
        )}

        {analysis && (
            <div className="space-y-4 animate-in slide-in-from-bottom duration-500">
                <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex justify-between items-start">
                        <div className="flex-1 min-w-0 pr-4">
                            <span className="text-xs font-bold text-gray-400 uppercase">{analysis.wineDetails?.type || 'VINO'}</span>
                            <h2 className="text-2xl font-serif font-bold text-gray-900 leading-tight truncate">{analysis.wineDetails?.name || 'Sconosciuto'}</h2>
                            <p className="text-gray-600 truncate">{analysis.wineDetails?.producer || ''} • {analysis.wineDetails?.year || ''}</p>
                        </div>
                        {analysis.qualityScore !== undefined && (
                            <div className="flex flex-col items-center ml-2 shrink-0">
                                <div className={`w-14 h-14 rounded-full flex items-center justify-center border-4 text-xl font-black shadow-sm ${getQualityColor(analysis.qualityScore)}`}>
                                    {analysis.qualityScore}
                                </div>
                                <span className="text-[8px] font-black uppercase text-gray-400 mt-1 tracking-widest">Qualità</span>
                            </div>
                        )}
                    </div>
                    <p className="mt-3 text-sm text-gray-600 italic border-l-2 border-wine-300 pl-3">"{analysis.sommelierNotes}"</p>
                </div>

                {((analysis.strengths?.length || 0) > 0 || (analysis.weaknesses?.length || 0) > 0) && (
                    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 space-y-4">
                        {(analysis.strengths?.length || 0) > 0 && (
                            <div>
                                <h4 className="text-[10px] font-black text-emerald-700 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Punti di forza
                                </h4>
                                <ul className="space-y-1.5">
                                    {analysis.strengths.map((s, i) => (
                                        <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                                            <span className="text-emerald-500 font-bold mt-0.5">✓</span>
                                            <span>{s}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        {(analysis.weaknesses?.length || 0) > 0 && (
                            <div>
                                <h4 className="text-[10px] font-black text-amber-700 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span> Da considerare
                                </h4>
                                <ul className="space-y-1.5">
                                    {analysis.weaknesses.map((w, i) => (
                                        <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                                            <span className="text-amber-500 font-bold mt-0.5">!</span>
                                            <span>{w}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        {(analysis.bestOccasions?.length || 0) > 0 && (
                            <div>
                                <h4 className="text-[10px] font-black text-wine-700 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-wine-500"></span> Occasioni consigliate
                                </h4>
                                <div className="flex flex-wrap gap-1.5">
                                    {analysis.bestOccasions.map((o, i) => (
                                        <span key={i} className="text-xs font-medium text-wine-800 bg-wine-50 border border-wine-100 px-2.5 py-1 rounded-full">{o}</span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                <div className={`p-5 rounded-xl border ${getDealColor(analysis.dealRating)}`}>
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="font-bold uppercase tracking-wide text-sm flex items-center gap-2">{t('price')} <span className="bg-white/50 px-2 py-0.5 rounded text-xs border border-black/10">{getDealText(analysis.dealRating)}</span></h3>
                    </div>
                    <div className="flex justify-between items-end mb-4">
                        <div><p className="text-xs opacity-70 mb-1">{t('offer_price')}</p><p className="text-2xl font-bold">€{Number(price).toFixed(2)}</p></div>
                        <div className="text-right">
                            <p className="text-xs opacity-70 mb-1">{t('market_estimate')}</p>
                            <p className="text-xl font-semibold opacity-90">~€{Number(analysis.marketPriceEstimate).toFixed(2)}</p>
                        </div>
                    </div>
                     <div className="bg-white/50 rounded-xl p-2">
                        <PriceComparison name={analysis.wineDetails?.name || ''} producer={analysis.wineDetails?.producer || ''} year={analysis.wineDetails?.year || ''} isPremium={isPremium} />
                    </div>
                </div>

                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-5 rounded-xl border border-indigo-100">
                    <h3 className="font-bold text-indigo-900 flex items-center gap-2"><WineIcon className="w-5 h-5" filled /> {t('cellar_fit')}</h3>
                    <p className="text-sm text-indigo-800 leading-relaxed mt-2">{analysis.cellarFit?.reasoning || 'N/A'}</p>
                </div>

                <div className="flex gap-3 pt-2">
                    <button onClick={() => { setAnalysis(null); setImage(null); setLinkUrl(''); setPrice(''); }} className="flex-1 py-3 text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl font-medium">{t('new_analysis')}</button>
                    <button onClick={handleBuy} className="flex-1 py-3 bg-wine-700 text-white hover:bg-wine-800 rounded-xl font-bold shadow-lg shadow-wine-200">{t('buy_add')}</button>
                </div>
            </div>
        )}
      </div>
    </div>
  ); 
};

export default ShopView;
