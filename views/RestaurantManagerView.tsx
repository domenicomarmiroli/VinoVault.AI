
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

        {/* Marketing Kit - VERTICAL LAYOUT */}
        <div className="bg-gray-900 rounded-[2.5rem] p-6 text-white shadow-2xl relative overflow-hidden flex flex-col items-center text-center">
            {/* Background effects */}
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>

            <div className="relative z-10 w-full space-y-6">
                <div>
                    <h3 className="text-2xl font-serif font-bold mb-1">Marketing Kit</h3>
                    <p className="text-[10px] text-gray-400 uppercase tracking-widest">Promuovi il tuo Sommelier IA</p>
                </div>

                {/* QR Code - TOP */}
                <div className="bg-white p-4 rounded-[2rem] shadow-xl w-fit mx-auto border-4 border-emerald-500/20">
                    <img 
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(restaurantUrl)}`} 
                        className="w-40 h-40"
                        alt="QR Code Ristorante"
                    />
                </div>
                
                {/* Description - MIDDLE */}
                <div className="space-y-2 max-w-xs mx-auto">
                    <p className="text-sm font-bold text-gray-100">Per Tavoli e Menu</p>
                    <p className="text-xs text-gray-400 leading-relaxed px-2">
                        Stampa il codice qui sopra e posizionalo sui tavoli. I tuoi ospiti potranno consultare la tua carta vini digitale in autonomia.
                    </p>
                </div>

                {/* Link and Copy Button - BOTTOM */}
                <div className="space-y-3 pt-2">
                    <div className="flex flex-col gap-2">
                        <label className="text-[9px] font-black uppercase text-emerald-500 tracking-widest block text-left ml-4">Link Diretto Sommelier</label>
                        <div className="flex flex-col sm:flex-row items-stretch bg-white/5 border border-white/10 rounded-2xl p-1.5 overflow-hidden gap-2">
                            <input 
                                readOnly 
                                value={restaurantUrl} 
                                className="flex-1 bg-transparent px-3 py-2 text-xs font-mono truncate outline-none text-gray-300 border-b sm:border-b-0 sm:border-r border-white/10 text-center sm:text-left"
                            />
                            <button 
                                onClick={copyToClipboard}
                                className={`px-6 py-3 rounded-xl font-black text-[10px] uppercase transition-all flex items-center justify-center gap-2 ${showCopyFeedback ? 'bg-green-500 text-white' : 'bg-emerald-600 text-white hover:bg-emerald-500'}`}
                            >
                                {showCopyFeedback ? (
                                    <><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" /></svg> Copiato!</>
                                ) : (
                                    <><ExternalLinkIcon className="w-3.5 h-3.5" /> Copia Link</>
                                )}
                            </button>
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
                    Foto Menu
                </button>
            </div>
            
            <p className="text-xs text-gray-500 mb-4 leading-relaxed">
                Aggiorna l'elenco dei vini disponibili (Nome | Produttore | Annata | Prezzo).
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
                {isSaving ? 'Salvataggio in corso...' : 'Salva Carta dei Vini'}
            </button>
        </div>

        {/* Help Tip */}
        <div className="p-5 bg-blue-50/50 border border-blue-100 rounded-3xl flex gap-4">
             <div className="bg-blue-100 p-2.5 rounded-2xl h-fit shadow-sm"><ChartBarIcon className="w-5 h-5 text-blue-600" /></div>
             <div>
                 <p className="text-xs text-blue-700 font-bold mb-1 tracking-tight">Consiglio del Sommelier</p>
                 <p className="text-[11px] text-blue-600/80 leading-relaxed">
                    Un menu testuale ben strutturato permette all'IA di fornire consigli molto più precisi ai tuoi clienti.
                 </p>
             </div>
        </div>
      </div>
    </div>
  );
};

export default RestaurantManagerView;
