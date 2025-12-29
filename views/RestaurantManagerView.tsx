

import React, { useState, useRef } from 'react';
import { Restaurant, RestaurantAnalysis } from '../types';
// Added WineIcon and PlusIcon to the imports
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
  const [isSaving, setIsSaving] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [showCopyFeedback, setShowCopyFeedback] = useState(false);
  const [report, setReport] = useState<RestaurantAnalysis | null>(restaurant.menu_analysis || null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const foodInputRef = useRef<HTMLInputElement>(null);
  const { t, language } = useLanguage();

  const restaurantUrl = `https://www.aiknow.wine/?ref=${restaurant.slug}`;

  const handleSave = async () => {
      setIsSaving(true);
      try {
          await onUpdateRestaurant({ menu_context: wineList, food_menu: foodMenu, menu_analysis: report || undefined });
          alert("Dati salvati con successo!");
      } catch (e) { alert("Errore durante il salvataggio."); }
      finally { setIsSaving(false); }
  };

  const runProfessionalAnalysis = async () => {
      if (!wineList || !foodMenu) {
          alert("Carica sia la carta vini che il menù piatti per l'analisi.");
          return;
      }
      setIsAnalyzing(true);
      try {
          const analysis = await analyzeRestaurantcompleteness(wineList, foodMenu, language);
          setReport(analysis);
          await onUpdateRestaurant({ menu_analysis: analysis });
      } catch (err) { alert("Errore analisi professionale."); }
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
          else { alert("Usa JPG o PDF."); setIsExtracting(false); return; }
          const text = await extractTextFromMedia(processedData, mimeType);
          if (type === 'wine') setWineList(prev => (prev ? prev + "\n" : "") + text);
          else setFoodMenu(prev => (prev ? prev + "\n" : "") + text);
      } catch (err) { alert("Errore estrazione testo."); }
      finally { setIsExtracting(false); }
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
            <p className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] mb-1">Pannello Direzione</p>
            <h1 className="text-2xl font-serif font-black text-gray-900 leading-tight truncate">{restaurant.name}</h1>
        </div>
        <button onClick={onLogout} className="text-gray-400 hover:text-wine-700 p-2 shrink-0"><RestaurantIcon className="w-6 h-6" filled /></button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 pb-32 space-y-6">
        
        {/* Marketing Kit */}
        <div className="bg-gray-900 rounded-[2.5rem] p-6 text-white shadow-xl relative overflow-hidden flex flex-col items-center text-center">
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
            <div className="relative z-10 w-full space-y-4">
                <div className="bg-white p-3 rounded-[2rem] shadow-xl w-fit mx-auto border-4 border-emerald-500/20">
                    <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(restaurantUrl)}`} className="w-32 h-32" alt="QR" />
                </div>
                <div className="flex flex-col sm:flex-row items-stretch bg-white/5 border border-white/10 rounded-2xl p-1 overflow-hidden gap-1">
                    <input readOnly value={restaurantUrl} className="flex-1 bg-transparent px-3 py-2 text-[10px] font-mono truncate outline-none text-gray-300 text-center sm:text-left" />
                    <button onClick={copyToClipboard} className={`px-4 py-2 rounded-xl font-black text-[10px] uppercase transition-all ${showCopyFeedback ? 'bg-green-500 text-white' : 'bg-emerald-600 text-white'}`}>
                        {showCopyFeedback ? 'Fatto!' : 'Copia Link'}
                    </button>
                </div>
            </div>
        </div>

        {/* Data Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Wine List Section */}
            <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-200">
                <div className="flex justify-between items-center mb-3">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2 text-sm"><WineIcon className="w-4 h-4 text-emerald-600" filled /> Carta Vini</h3>
                    <button onClick={() => fileInputRef.current?.click()} className="text-[9px] font-black uppercase text-emerald-700 bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-100 flex items-center gap-1 active:scale-95 transition-all">
                        <CameraIcon className="w-3 h-3" /> Foto/PDF
                    </button>
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*,application/pdf" onChange={(e) => handleFileUpload(e, 'wine')} />
                </div>
                <textarea value={wineList} onChange={e => setWineList(e.target.value)} className="w-full h-40 p-3 border border-gray-100 rounded-xl bg-stone-50 font-mono text-[10px] focus:ring-1 focus:ring-emerald-500 outline-none resize-none" placeholder="Vini..." />
            </div>

            {/* Food Menu Section */}
            <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-200">
                <div className="flex justify-between items-center mb-3">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2 text-sm"><ChefIcon className="w-4 h-4 text-orange-600" filled /> Menù Piatti</h3>
                    <button onClick={() => foodInputRef.current?.click()} className="text-[9px] font-black uppercase text-orange-700 bg-orange-50 px-2.5 py-1.5 rounded-lg border border-orange-100 flex items-center gap-1 active:scale-95 transition-all">
                        <CameraIcon className="w-3 h-3" /> Foto/PDF
                    </button>
                    <input type="file" ref={foodInputRef} className="hidden" accept="image/*,application/pdf" onChange={(e) => handleFileUpload(e, 'food')} />
                </div>
                <textarea value={foodMenu} onChange={e => setFoodMenu(e.target.value)} className="w-full h-40 p-3 border border-gray-100 rounded-xl bg-stone-50 font-mono text-[10px] focus:ring-1 focus:ring-orange-500 outline-none resize-none" placeholder="Piatti..." />
            </div>
        </div>

        {/* Global Action */}
        <div className="flex gap-3">
            <button onClick={handleSave} className="flex-1 py-4 bg-gray-200 text-gray-700 font-black uppercase text-[10px] tracking-widest rounded-2xl active:scale-[0.98] transition-all">Salva Dati</button>
            <button onClick={runProfessionalAnalysis} className="flex-[2] py-4 bg-emerald-600 text-white font-black uppercase text-[10px] tracking-widest rounded-2xl shadow-lg shadow-emerald-100 active:scale-[0.98] transition-all flex items-center justify-center gap-2">
                <ShieldCheckIcon className="w-4 h-4" filled /> Genera Analisi Strategica
            </button>
        </div>

        {/* Analysis Report Display */}
        {report && (
            <div className="space-y-6 animate-in slide-in-from-bottom duration-500">
                <div className="bg-white rounded-[2rem] border border-emerald-100 overflow-hidden shadow-xl">
                    <div className="bg-emerald-600 p-6 text-white flex justify-between items-end">
                        <div>
                            <h2 className="text-2xl font-serif font-black">Audit Sommelier Professionale</h2>
                            <p className="text-[10px] uppercase font-bold opacity-80 mt-1">Generato il {new Date(report.generatedAt).toLocaleDateString()}</p>
                        </div>
                        <div className="text-right">
                            <span className="block text-4xl font-black">{report.score}/100</span>
                            <span className="text-[9px] uppercase font-bold opacity-80">Qualità Cantina</span>
                        </div>
                    </div>

                    <div className="p-6 space-y-8">
                        <div>
                            <h3 className="text-xs font-black uppercase text-gray-400 tracking-[0.2em] mb-3">Executive Summary</h3>
                            <p className="text-sm text-gray-700 leading-relaxed italic border-l-4 border-emerald-500 pl-4">"{report.summary}"</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-green-50 p-4 rounded-2xl border border-green-100">
                                <h4 className="text-[10px] font-black text-green-700 uppercase mb-2">Punti di Forza</h4>
                                <ul className="space-y-1.5">
                                    {report.strengths.map((s, i) => <li key={i} className="text-xs text-green-800 flex gap-2"><span>✓</span> {s}</li>)}
                                </ul>
                            </div>
                            <div className="bg-red-50 p-4 rounded-2xl border border-red-100">
                                <h4 className="text-[10px] font-black text-red-700 uppercase mb-2">Punti di Debolezza</h4>
                                <ul className="space-y-1.5">
                                    {report.weaknesses.map((w, i) => <li key={i} className="text-xs text-red-800 flex gap-2"><span>⚠</span> {w}</li>)}
                                </ul>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-xs font-black uppercase text-gray-400 tracking-[0.2em]">Analisi per Portata</h3>
                            {report.courseDetails.map((detail, idx) => (
                                <div key={idx} className="bg-stone-50 rounded-2xl p-5 border border-stone-100">
                                    <h4 className="font-black text-gray-900 text-sm uppercase mb-2 tracking-tight">{detail.course}</h4>
                                    <p className="text-[11px] text-gray-600 mb-4">{detail.feedback}</p>
                                    
                                    <div className="grid grid-cols-1 gap-3">
                                        <div className="flex flex-wrap gap-2">
                                            <span className="text-[9px] font-bold text-gray-400 w-full uppercase">Top Match in Carta:</span>
                                            {detail.bestMatches.map((m, i) => <span key={i} className="bg-white border border-emerald-200 text-emerald-800 text-[10px] px-2 py-1 rounded-lg font-bold shadow-sm">{m}</span>)}
                                        </div>
                                        {detail.unsuitableWines.length > 0 && (
                                            <div className="flex flex-wrap gap-2">
                                                <span className="text-[9px] font-bold text-gray-400 w-full uppercase text-red-400">Poco adatti:</span>
                                                {detail.unsuitableWines.map((m, i) => <span key={i} className="bg-white border border-red-100 text-red-400 text-[10px] px-2 py-1 rounded-lg italic line-through opacity-70">{m}</span>)}
                                            </div>
                                        )}
                                        <div className="flex flex-wrap gap-2 mt-1">
                                            <span className="text-[9px] font-bold text-gray-400 w-full uppercase text-blue-500">Suggerimenti d'Acquisto:</span>
                                            {detail.missingStyles.map((m, i) => <span key={i} className="bg-blue-50 border border-blue-200 text-blue-800 text-[10px] px-2 py-1 rounded-lg font-bold flex items-center gap-1"><PlusIcon className="w-2.5 h-2.5" /> {m}</span>)}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="bg-indigo-900 p-6 rounded-[2rem] text-white">
                             <h4 className="text-xs font-black uppercase text-indigo-300 mb-2 flex items-center gap-2"><StarIcon className="w-4 h-4" filled /> Consiglio Strategico</h4>
                             <p className="text-sm leading-relaxed text-indigo-50">{report.strategicAdvice}</p>
                        </div>
                    </div>
                </div>
            </div>
        )}
        
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
      </div>
    </div>
  );
};

export default RestaurantManagerView;
