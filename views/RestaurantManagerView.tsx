
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
        <div>
            <p className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] mb-1">Area Gestore Ristorante</p>
            <h1 className="text-2xl font-serif font-black text-gray-900 leading-tight">
                {restaurant.name}
            </h1>
        </div>
        <button onClick={onLogout} className="text-gray-400 hover:text-wine-700 p-2"><RestaurantIcon className="w-6 h-6" filled /></button>
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

        {/* Menu Editor Section */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                    <RestaurantIcon className="w-5 h-5 text-emerald-600" />
                    Carta dei Vini Digitale
                </h3>
                <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="text-[10px] font-black uppercase text-emerald-600 bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-100 flex items-center gap-1.5 active:scale-95 transition-all"
                >
                    <CameraIcon className="w-3.5 h-3.5" />
                    Foto Menu
                </button>
            </div>
            
            <p className="text-xs text-gray-500 mb-3 leading-relaxed">
                Inserisci qui l'elenco dei vini disponibili (Formato: Nome | Produttore | Annata | Prezzo). 
                L'IA userà questo testo per consigliare i clienti.
            </p>

            <textarea 
                value={menuText}
                onChange={e => setMenuText(e.target.value)}
                className="w-full h-64 p-3 border border-gray-200 rounded-xl bg-gray-50 font-mono text-xs focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
                placeholder="Esempio: Chianti Classico | Antinori | 2019 | 35€"
            />
            
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />

            <button 
                onClick={handleSave}
                disabled={isSaving || menuText === restaurant.menu_context}
                className="w-full mt-4 py-3.5 bg-emerald-600 text-white font-black uppercase text-xs tracking-widest rounded-xl shadow-lg shadow-emerald-100 disabled:opacity-30 disabled:shadow-none active:scale-[0.98] transition-all"
            >
                Salva Modifiche Carta
            </button>
        </div>

        {/* Marketing Kit */}
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-6 rounded-[2rem] text-white shadow-xl relative overflow-hidden">
            <h3 className="text-xl font-serif font-bold mb-6">Marketing Kit Locale</h3>
            
            <div className="flex flex-col md:flex-row gap-6 items-center">
                <div className="bg-white p-3 rounded-2xl shrink-0">
                    <img 
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(restaurantUrl)}`} 
                        className="w-32 h-32"
                        alt="QR Code Ristorante"
                    />
                </div>
                
                <div className="flex-1 space-y-4 w-full">
                    <p className="text-xs text-gray-400 leading-relaxed">
                        Mostra questo QR Code sui tavoli o nel menu fisico. I clienti potranno accedere istantaneamente al loro Sommelier Personale sincronizzato con la tua cantina.
                    </p>
                    
                    <div className="space-y-2">
                        <label className="text-[9px] font-black uppercase text-gray-500 tracking-widest ml-1">Link Diretto</label>
                        <div className="flex bg-white/10 rounded-xl overflow-hidden border border-white/10">
                            <input 
                                readOnly 
                                value={restaurantUrl} 
                                className="flex-1 bg-transparent px-3 py-2 text-xs font-mono truncate outline-none"
                            />
                            <button 
                                onClick={copyToClipboard}
                                className={`px-4 font-bold text-[10px] uppercase transition-all ${showCopyFeedback ? 'bg-green-500 text-white' : 'bg-emerald-500 text-gray-900'}`}
                            >
                                {showCopyFeedback ? 'Fatto!' : 'Copia'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* Help Tip */}
        <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl flex gap-3">
             <div className="bg-blue-100 p-2 rounded-full h-fit"><ChartBarIcon className="w-4 h-4 text-blue-600" /></div>
             <p className="text-xs text-blue-700 leading-relaxed">
                <strong>Pro Tip:</strong> Tieni la carta aggiornata per migliorare l'accuratezza dei consigli IA. Se finisci una bottiglia, cancellala dal testo sopra.
             </p>
        </div>
      </div>
    </div>
  );
};

export default RestaurantManagerView;
