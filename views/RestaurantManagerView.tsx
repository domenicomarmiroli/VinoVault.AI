
import React, { useState, useRef } from 'react';
import { Restaurant } from '../types';
import { RestaurantIcon, CameraIcon, ChartBarIcon, ExternalLinkIcon } from '../components/Icons';
import { extractTextFromMedia } from '../services/geminiService';
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
                const MAX_WIDTH = 1000;
                const MAX_HEIGHT = 1000;
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

const RestaurantManagerView: React.FC<RestaurantManagerViewProps> = ({ restaurant, onUpdateRestaurant, onLogout }) => {
  const [menuText, setMenuText] = useState(restaurant.menu_context || '');
  const [isSaving, setIsSaving] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [showCopyFeedback, setShowCopyFeedback] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { t } = useLanguage();

  const restaurantUrl = `https://www.aiknow.wine/?ref=${restaurant.slug}`;

  const handleSave = async () => {
      setIsSaving(true);
      try {
          await onUpdateRestaurant({ menu_context: menuText });
          alert("Carta vini aggiornata con successo!");
      } catch (e) {
          alert("Errore durante il salvataggio.");
      } finally {
          setIsSaving(false);
      }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setIsExtracting(true);
      try {
          const base64 = await compressImage(file);
          const extractedText = await extractTextFromMedia(base64, 'image/jpeg');
          setMenuText(prev => (prev ? prev + "\n" : "") + extractedText);
      } catch (err) {
          alert("Errore durante l'estrazione del testo. Riprova con una foto più nitida.");
      } finally {
          setIsExtracting(false);
      }
  };

  const copyToClipboard = () => {
      navigator.clipboard.writeText(restaurantUrl);
      setShowCopyFeedback(true);
      setTimeout(() => setShowCopyFeedback(false), 2000);
  };

  return (
    <div className="h-full flex flex-col bg-stone-50 overflow-hidden relative">
      {(isSaving || isExtracting) && (
          <LoadingScreen 
            message={isSaving ? "Salvataggio..." : "Analisi Carta Vini..."} 
            subMessage={isSaving ? "Aggiorno il database del tuo locale." : "L'IA sta trascrivendo i vini dalla foto."} 
          />
      )}

      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-6 shadow-sm z-10 flex justify-between items-start">
        <div className="min-w-0">
            <p className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] mb-1">Area Gestore Ristorante</p>
            <h1 className="text-2xl font-serif font-black text-gray-900 leading-tight truncate">
                {restaurant.name}
            </h1>
        </div>
        <button onClick={onLogout} className="text-gray-400 hover:text-wine-700 p-2 shrink-0"><RestaurantIcon className="w-6 h-6" filled /></button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 pb-32 space-y-6">
        
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

        {/* Marketing Kit - REDESIGNED */}
        <div className="bg-gray-900 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden group">
            {/* Decorative background effects */}
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-emerald-500/20 transition-all duration-700"></div>
            <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>

            <div className="relative z-10 space-y-8">
                <div className="text-center md:text-left">
                    <h3 className="text-2xl font-serif font-bold mb-2">Marketing Kit</h3>
                    <p className="text-xs text-gray-400 leading-relaxed max-w-xs mx-auto md:mx-0">
                        Scarica o copia questi strumenti per promuovere il Sommelier IA nel tuo locale.
                    </p>
                </div>
                
                <div className="flex flex-col md:flex-row gap-8 items-center">
                    {/* QR Code with custom styling */}
                    <div className="bg-white p-4 rounded-[2rem] shadow-xl shrink-0 group-hover:scale-105 transition-transform duration-500 border-4 border-emerald-500/20">
                        <img 
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(restaurantUrl)}`} 
                            className="w-36 h-36"
                            alt="QR Code Ristorante"
                        />
                    </div>
                    
                    <div className="flex-1 space-y-6 w-full text-center md:text-left">
                        <div>
                            <p className="text-sm font-medium text-gray-200 mb-2">Tavoli e Menu</p>
                            <p className="text-[11px] text-gray-400 leading-relaxed">
                                Stampa questo codice sui tavoli. I clienti accederanno direttamente ai consigli abbinati ai tuoi piatti.
                            </p>
                        </div>
                        
                        <div className="space-y-2">
                            <label className="text-[9px] font-black uppercase text-emerald-500 tracking-widest block mb-1">Direct Link</label>
                            <div className="flex items-center bg-white/5 border border-white/10 rounded-2xl p-1 overflow-hidden transition-all focus-within:border-emerald-500/50 focus-within:bg-white/10">
                                <input 
                                    readOnly 
                                    value={restaurantUrl} 
                                    className="flex-1 bg-transparent px-4 py-2.5 text-xs font-mono truncate outline-none text-gray-300"
                                />
                                <button 
                                    onClick={copyToClipboard}
                                    className={`px-6 py-2.5 rounded-xl font-black text-[10px] uppercase transition-all flex items-center gap-2 ${showCopyFeedback ? 'bg-green-500 text-white' : 'bg-emerald-600 text-white hover:bg-emerald-500'}`}
                                >
                                    {showCopyFeedback ? 'Copiato!' : 'Copia'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* Menu Editor Section */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-200">
            <div className="flex justify-between items-center mb-5">
                <div className="flex items-center gap-3">
                    <div className="bg-emerald-50 p-2 rounded-xl">
                        <RestaurantIcon className="w-6 h-6 text-emerald-600" />
                    </div>
                    <h3 className="font-bold text-gray-800 text-lg">Carta Digitale</h3>
                </div>
                <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="text-[10px] font-black uppercase text-emerald-600 bg-emerald-50 px-3 py-2 rounded-xl border border-emerald-100 flex items-center gap-1.5 active:scale-95 transition-all"
                >
                    <CameraIcon className="w-4 h-4" />
                    Aggiorna da Foto
                </button>
            </div>
            
            <p className="text-xs text-gray-500 mb-4 leading-relaxed">
                Elenca i vini (Nome | Produttore | Annata | Prezzo).<br/>
                L'IA consiglierà i tuoi clienti basandosi su questo elenco.
            </p>

            <div className="relative">
                <textarea 
                    value={menuText}
                    onChange={e => setMenuText(e.target.value)}
                    className="w-full h-72 p-4 border border-gray-200 rounded-2xl bg-stone-50 font-mono text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none resize-none shadow-inner"
                    placeholder="Esempio: Bolgheri Sassicaia | Tenuta San Guido | 2020 | 250€"
                />
            </div>
            
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />

            <button 
                onClick={handleSave}
                disabled={isSaving || menuText === restaurant.menu_context}
                className="w-full mt-5 py-4 bg-emerald-600 text-white font-black uppercase text-xs tracking-widest rounded-2xl shadow-xl shadow-emerald-100 disabled:opacity-30 disabled:shadow-none active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
                {isSaving ? 'Salvataggio in corso...' : 'Pubblica Cambiamenti Carta'}
            </button>
        </div>

        {/* Help Tip */}
        <div className="p-5 bg-blue-50/50 border border-blue-100 rounded-3xl flex gap-4">
             <div className="bg-blue-100 p-2.5 rounded-2xl h-fit shadow-sm"><ChartBarIcon className="w-5 h-5 text-blue-600" /></div>
             <div>
                 <p className="text-xs text-blue-700 font-bold mb-1 tracking-tight">Consiglio del Sommelier</p>
                 <p className="text-[11px] text-blue-600/80 leading-relaxed">
                    Mantieni la lista aggiornata rimuovendo le bottiglie esaurite per garantire consigli sempre affidabili ai tuoi ospiti.
                 </p>
             </div>
        </div>
      </div>
    </div>
  );
};

export default RestaurantManagerView;
