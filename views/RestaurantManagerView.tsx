
import React, { useState, useRef, useEffect } from 'react';
import { Restaurant, RestaurantAnalysis } from '../types';
import { RestaurantIcon, CameraIcon, ChartBarIcon, ExternalLinkIcon, ChefIcon, StarIcon, ShieldCheckIcon, WineIcon, PlusIcon } from '../components/Icons';
import { extractTextFromMedia, analyzeRestaurantcompleteness } from '../services/geminiService';
import { useLanguage } from '../contexts/LanguageContext';
import LoadingScreen from '../components/LoadingScreen';

interface RestaurantManagerViewProps {
  restaurant: Restaurant;
  onUpdateRestaurant: (updates: Partial<Restaurant>) => Promise<void>;
  onLogout: () => void;
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
                const MAX_WIDTH = 1200;
                const MAX_HEIGHT = 1200;
                let width = img.width;
                let height = img.height;
                if (width > height) { if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; } }
                else { if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; } }
                canvas.width = width; canvas.height = height;
                const ctx = canvas.getContext('2d');
                if (ctx) { ctx.drawImage(img, 0, 0, width, height); resolve(canvas.toDataURL('image/jpeg', 0.8)); }
                else reject(new Error("Canvas error"));
            };
            img.onerror = (err) => reject(err);
        };
        reader.onerror = (err) => reject(err);
    });
};

const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
    });
};

const RestaurantManagerView: React.FC<RestaurantManagerViewProps> = ({ restaurant, onUpdateRestaurant, onLogout }) => {
  const [wineList, setWineList] = useState(restaurant.menu_context || '');
  const [foodMenu, setFoodMenu] = useState(restaurant.food_menu || '');
  const [report, setReport] = useState<RestaurantAnalysis | null>(restaurant.menu_analysis || null);
  
  const [isSaving, setIsSaving] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [showCopyFeedback, setShowCopyFeedback] = useState(false);
  
  const wineFileInputRef = useRef<HTMLInputElement>(null);
  const foodFileInputRef = useRef<HTMLInputElement>(null);
  const { language } = useLanguage();

  // Sincronizza lo stato se le props cambiano esternamente
  useEffect(() => {
      setWineList(restaurant.menu_context || '');
      setFoodMenu(restaurant.food_menu || '');
      setReport(restaurant.menu_analysis || null);
  }, [restaurant]);

  const restaurantUrl = `https://www.aiknow.wine/?ref=${restaurant.slug}`;

  const handleSave = async () => {
      setIsSaving(true);
      try {
          await onUpdateRestaurant({ 
              menu_context: wineList, 
              food_menu: foodMenu, 
              menu_analysis: report || undefined 
          });
          alert("Dati salvati con successo!");
      } catch (e) { alert("Errore durante il salvataggio."); }
      finally { setIsSaving(false); }
  };

  const runProfessionalAnalysis = async () => {
      if (!wineList || !foodMenu) {
          alert("Inserisci sia la Carta Vini che il Menù Piatti per ricevere l'analisi professionale.");
          return;
      }
      setIsAnalyzing(true);
      try {
          const analysis = await analyzeRestaurantcompleteness(wineList, foodMenu, language);
          setReport(analysis);
          // Salviamo immediatamente il report per persistenza
          await onUpdateRestaurant({ 
              menu_context: wineList,
              food_menu: foodMenu,
              menu_analysis: analysis 
          });
      } catch (err) { alert("Errore durante l'analisi strategica."); }
      finally { setIsAnalyzing(false); }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'wine' | 'food') => {
      const file = e.target.files?.[0];
      if (!file) return;
      setIsExtracting(true);
      try {
          let processedData = "";
          let mimeType = file.type;
          if (file.type === 'application/pdf') processedData = await readFileAsBase64(file);
          else if (file.type.startsWith('image/')) { processedData = await compressImage(file); mimeType = 'image/jpeg'; }
          else { alert("Carica un'immagine JPG/PNG o un PDF."); setIsExtracting(false); return; }
          const text = await extractTextFromMedia(processedData, mimeType);
          if (type === 'wine') setWineList(prev => (prev ? prev + "\n" : "") + text);
          else setFoodMenu(prev => (prev ? prev + "\n" : "") + text);
      } catch (err) { alert("Errore nell'estrazione del testo."); }
      finally { setIsExtracting(false); if (e.target) e.target.value = ""; }
  };

  const copyToClipboard = () => {
      navigator.clipboard.writeText(restaurantUrl);
      setShowCopyFeedback(true);
      setTimeout(() => setShowCopyFeedback(false), 2000);
  };

  return (
    <div className="h-full flex flex-col bg-stone-50 overflow-hidden relative">
      {(isSaving || isExtracting || isAnalyzing) && (
          <LoadingScreen 
            message={isAnalyzing ? "Analisi Strategica..." : isSaving ? "Salvataggio..." : "Lettura Documento..."} 
            subMessage={isAnalyzing ? "Incrocio piatti e vini per un report professionale." : "Aggiorno il database del tuo locale."} 
          />
      )}

      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-6 shadow-sm z-10 flex justify-between items-start">
        <div className="min-w-0">
            <p className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] mb-1">Pannello Direzione Locale</p>
            <h1 className="text-2xl font-serif font-black text-gray-900 leading-tight truncate">{restaurant.name}</h1>
        </div>
        <button onClick={onLogout} className="text-gray-400 hover:text-wine-700 p-2 shrink-0 border border-gray-100 rounded-xl"><RestaurantIcon className="w-6 h-6" filled /></button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 pb-32 space-y-8">
        
        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-3">
             <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center text-center">
                 <span className="text-2xl font-black text-emerald-600">{restaurant.user_count || 0}</span>
                 <span className="text-[9px] uppercase font-bold text-gray-400 tracking-widest">Utenti Registrati</span>
             </div>
             <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center text-center">
                 <span className="text-2xl font-black text-purple-600">{restaurant.total_ai_usage || 0}</span>
                 <span className="text-[9px] uppercase font-bold text-gray-400 tracking-widest">Consulti IA Totali</span>
             </div>
        </div>

        {/* Marketing Kit - Descriptive Vertical Layout */}
        <div className="bg-gray-900 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden flex flex-col items-center text-center">
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
            <div className="relative z-10 w-full space-y-8">
                <div>
                    <h3 className="text-2xl font-serif font-bold mb-1">Marketing Kit</h3>
                    <p className="text-xs text-gray-400 leading-relaxed max-w-xs mx-auto">Strumenti pronti all'uso per promuovere il tuo Sommelier IA digitale.</p>
                </div>

                <div className="bg-white p-4 rounded-[2rem] shadow-xl w-fit mx-auto border-4 border-emerald-500/20">
                    <img src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(restaurantUrl)}`} className="w-44 h-44" alt="QR" />
                </div>
                
                <div className="space-y-3">
                    <p className="text-sm font-bold text-gray-100">Per i tuoi tavoli e menu fisici</p>
                    <p className="text-xs text-gray-400 leading-relaxed max-w-xs mx-auto">
                        Stampa e posiziona questo codice sui tavoli del locale. I tuoi clienti potranno consultare la tua carta vini in autonomia ricevendo abbinamenti istantanei.
                    </p>
                </div>

                <div className="space-y-4 pt-2 w-full">
                    <div className="flex flex-col gap-2">
                        <label className="text-[9px] font-black uppercase text-emerald-500 tracking-widest block text-left ml-4">Link Diretto Sommelier</label>
                        <div className="flex items-center bg-white/5 border border-white/10 rounded-2xl p-1.5 overflow-hidden">
                            <input readOnly value={restaurantUrl} className="flex-1 bg-transparent px-4 py-2 text-xs font-mono truncate outline-none text-gray-300" />
                            <button onClick={copyToClipboard} className={`px-6 py-2.5 rounded-xl font-black text-[10px] uppercase transition-all flex items-center gap-2 ${showCopyFeedback ? 'bg-green-500 text-white' : 'bg-emerald-600 text-white hover:bg-emerald-500'}`}>
                                {showCopyFeedback ? 'Copiato!' : 'Copia'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* Data Inputs - FULL WIDTH */}
        <div className="space-y-8">
            {/* Wine List Section */}
            <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-200">
                <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-3">
                        <div className="bg-emerald-50 p-2.5 rounded-xl text-emerald-600">
                            <WineIcon className="w-6 h-6" filled />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-800 text-lg">Carta Digitale dei Vini</h3>
                            <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">Database principale</p>
                        </div>
                    </div>
                    <button onClick={() => wineFileInputRef.current?.click()} className="text-[10px] font-black uppercase text-emerald-700 bg-emerald-50 px-3 py-2 rounded-xl border border-emerald-200 flex items-center gap-1.5 active:scale-95 transition-all shadow-sm">
                        <CameraIcon className="w-4 h-4" /> Carica Foto / PDF
                    </button>
                    <input type="file" ref={wineFileInputRef} className="hidden" accept="image/*,application/pdf" onChange={(e) => handleFileUpload(e, 'wine')} />
                </div>
                <textarea 
                    value={wineList} 
                    onChange={e => setWineList(e.target.value)} 
                    className="w-full h-80 p-5 border border-gray-200 rounded-[1.5rem] bg-stone-50 font-mono text-[11px] focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none resize-none transition-all shadow-inner" 
                    placeholder="Esempio: Champagne Brut Réserve | Charles Heidsieck | NV | 95€" 
                />
                <button onClick={handleSave} className="w-full mt-4 py-3 bg-gray-100 text-gray-600 font-bold uppercase text-[10px] tracking-widest rounded-xl hover:bg-gray-200 transition-all">Salva solo Carta Vini</button>
            </div>

            {/* Food Menu Section */}
            <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-200">
                <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-3">
                        <div className="bg-orange-50 p-2.5 rounded-xl text-orange-600">
                            <ChefIcon className="w-6 h-6" filled />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-800 text-lg">Menù Gastronomico</h3>
                            <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">Contesto per abbinamenti</p>
                        </div>
                    </div>
                    <button onClick={() => foodFileInputRef.current?.click()} className="text-[10px] font-black uppercase text-orange-700 bg-orange-50 px-3 py-2 rounded-xl border border-orange-200 flex items-center gap-1.5 active:scale-95 transition-all shadow-sm">
                        <CameraIcon className="w-4 h-4" /> Carica Foto / PDF
                    </button>
                    <input type="file" ref={foodFileInputRef} className="hidden" accept="image/*,application/pdf" onChange={(e) => handleFileUpload(e, 'food')} />
                </div>
                <textarea 
                    value={foodMenu} 
                    onChange={e => setFoodMenu(e.target.value)} 
                    className="w-full h-64 p-5 border border-gray-200 rounded-[1.5rem] bg-stone-50 font-mono text-[11px] focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 outline-none resize-none transition-all shadow-inner" 
                    placeholder="Inserisci i tuoi piatti..." 
                />
                <button onClick={handleSave} className="w-full mt-4 py-3 bg-gray-100 text-gray-600 font-bold uppercase text-[10px] tracking-widest rounded-xl hover:bg-gray-200 transition-all">Salva solo Menù Piatti</button>
            </div>
        </div>

        {/* Professional Analysis Action */}
        <div className="space-y-4">
            <button onClick={runProfessionalAnalysis} className="w-full py-5 bg-emerald-600 text-white font-black uppercase text-xs tracking-widest rounded-2xl shadow-xl shadow-emerald-200 active:scale-[0.98] transition-all flex items-center justify-center gap-3">
                <ShieldCheckIcon className="w-5 h-5" filled /> 
                Genera Analisi Strategica IA
            </button>
            <p className="text-[10px] text-gray-400 text-center uppercase font-bold tracking-widest">Incrocia cucina e cantina in un report professionale</p>
        </div>

        {/* Analysis Report Display */}
        {report && (
            <div className="space-y-6 animate-in slide-in-from-bottom duration-500">
                <div className="bg-white rounded-[2.5rem] border border-emerald-100 overflow-hidden shadow-2xl">
                    <div className="bg-emerald-600 p-8 text-white flex justify-between items-end relative overflow-hidden">
                        <div className="absolute top-0 right-0 -mr-10 -mt-10 opacity-10"><ShieldCheckIcon className="w-48 h-48" filled /></div>
                        <div className="relative z-10">
                            <h2 className="text-3xl font-serif font-black">Audit Strategico</h2>
                            <p className="text-[10px] uppercase font-bold opacity-80 mt-1 tracking-widest">Aggiornato il {new Date(report.generatedAt).toLocaleDateString()}</p>
                        </div>
                        <div className="text-right relative z-10">
                            <span className="block text-5xl font-black">{report.score}/100</span>
                            <span className="text-[10px] uppercase font-bold opacity-80">Qualità Coerenza</span>
                        </div>
                    </div>

                    <div className="p-8 space-y-8">
                        <div>
                            <h3 className="text-xs font-black uppercase text-gray-400 tracking-[0.2em] mb-4">Executive Summary</h3>
                            <p className="text-base text-gray-800 leading-relaxed italic border-l-4 border-emerald-500 pl-6 py-2 bg-stone-50 rounded-r-2xl">"{report.summary}"</p>
                        </div>

                        {/* Stacked Strength & Weakness sections instead of Grid for better readability */}
                        <div className="space-y-6">
                            <div className="bg-green-50 p-6 rounded-3xl border border-green-100">
                                <h4 className="text-[10px] font-black text-green-700 uppercase mb-4 tracking-widest">Punti di Forza</h4>
                                <ul className="space-y-3">
                                    {report.strengths.map((s, i) => <li key={i} className="text-xs text-green-800 flex gap-3"><span className="shrink-0 text-emerald-500">✓</span> {s}</li>)}
                                </ul>
                            </div>
                            <div className="bg-red-50 p-6 rounded-3xl border border-red-100">
                                <h4 className="text-[10px] font-black text-red-700 uppercase mb-4 tracking-widest">Aree di Miglioramento</h4>
                                <ul className="space-y-3">
                                    {report.weaknesses.map((w, i) => <li key={i} className="text-xs text-red-800 flex gap-3"><span className="shrink-0 text-red-400">⚠</span> {w}</li>)}
                                </ul>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <h3 className="text-xs font-black uppercase text-gray-400 tracking-[0.2em]">Analisi per Portata</h3>
                            {report.courseDetails.map((detail, idx) => (
                                <div key={idx} className="bg-stone-50 rounded-[2rem] p-6 border border-stone-100 shadow-inner">
                                    <h4 className="font-black text-gray-900 text-base uppercase mb-2 tracking-tight">{detail.course}</h4>
                                    <p className="text-xs text-gray-600 mb-6 leading-relaxed">{detail.feedback}</p>
                                    
                                    <div className="space-y-5">
                                        <div className="flex flex-wrap gap-2">
                                            <span className="text-[9px] font-black text-gray-400 w-full uppercase mb-1">Migliori Abbinamenti:</span>
                                            {detail.bestMatches.map((m, i) => <span key={i} className="bg-white border border-emerald-200 text-emerald-800 text-[10px] px-3 py-1.5 rounded-xl font-bold shadow-sm">{m}</span>)}
                                        </div>
                                        {detail.unsuitableWines.length > 0 && (
                                            <div className="flex flex-wrap gap-2">
                                                <span className="text-[9px] font-black text-gray-400 w-full uppercase mb-1 text-red-400">Poco consigliati:</span>
                                                {detail.unsuitableWines.map((m, i) => <span key={i} className="bg-white border border-red-100 text-red-400 text-[10px] px-3 py-1.5 rounded-xl italic line-through opacity-60">{m}</span>)}
                                            </div>
                                        )}
                                        <div className="flex flex-wrap gap-2 mt-2 pt-4 border-t border-stone-200/50">
                                            <span className="text-[9px] font-black text-indigo-500 w-full uppercase mb-1">Gap Analysis:</span>
                                            {detail.missingStyles.map((m, i) => <span key={i} className="bg-indigo-50 border border-indigo-200 text-indigo-800 text-[10px] px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5"><PlusIcon className="w-3 h-3" /> {m}</span>)}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="bg-indigo-900 p-8 rounded-[2.5rem] text-white shadow-xl">
                             <h4 className="text-xs font-black uppercase text-indigo-300 mb-4 flex items-center gap-2 tracking-[0.2em]"><StarIcon className="w-5 h-5" filled /> Consiglio Strategico</h4>
                             <p className="text-base leading-relaxed text-indigo-50 font-medium italic">"{report.strategicAdvice}"</p>
                        </div>
                    </div>
                </div>
            </div>
        )}
        
      </div>
    </div>
  );
};

export default RestaurantManagerView;
