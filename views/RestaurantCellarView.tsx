
import React, { useState, useEffect, useRef } from 'react';
import { Restaurant } from '../types';
import { RestaurantIcon, CameraIcon, LogoutIcon, ExternalLinkIcon } from '../components/Icons';
import { extractTextFromMedia } from '../services/geminiService';
import LoadingScreen from '../components/LoadingScreen';
import { useLanguage } from '../contexts/LanguageContext';

interface RestaurantCellarViewProps {
    onLogout: () => void;
}

const RestaurantCellarView: React.FC<RestaurantCellarViewProps> = ({ onLogout }) => {
    const { t } = useLanguage();
    const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
    const [loading, setLoading] = useState(true);
    const [extracting, setExtracting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        fetch('/api/my-restaurant', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('vinovault_token')}` }
        })
        .then(res => res.json())
        .then(data => {
            setRestaurant(data);
            setLoading(false);
        });
    }, []);

    const handleSave = async () => {
        if (!restaurant) return;
        const res = await fetch('/api/my-restaurant', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('vinovault_token')}` 
            },
            body: JSON.stringify({ name: restaurant.name, menu_context: restaurant.menu_context })
        });
        if (res.ok) alert("Salvataggio completato!");
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !restaurant) return;
        setExtracting(true);
        try {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = async () => {
                const text = await extractTextFromMedia(reader.result as string, file.type);
                setRestaurant({ ...restaurant, menu_context: (restaurant.menu_context || '') + "\n" + text });
            };
        } catch (e) { alert("Errore IA"); }
        finally { setExtracting(false); }
    };

    if (loading) return <div className="h-full flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-wine-600"></div></div>;
    if (!restaurant) return <div className="p-8 text-center text-gray-500">Nessun ristorante associato al tuo profilo. Contatta l'assistenza.</div>;

    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(`https://www.aiknow.wine/?ref=${restaurant.slug}`)}`;

    return (
        <div className="h-full flex flex-col bg-stone-50 overflow-hidden">
            {extracting && <LoadingScreen message="IA Sommelier al lavoro..." subMessage="Sto leggendo la tua carta dei vini fisica per digitalizzarla." />}
            
            <div className="bg-white border-b border-gray-200 p-6 shadow-sm flex justify-between items-start">
                <div>
                    <h1 className="text-2xl font-serif font-bold text-gray-900 flex items-center gap-2">
                        <RestaurantIcon className="w-8 h-8 text-wine-600" filled />
                        La Tua Carta Vini
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">Configura il menu digitale per i tuoi clienti.</p>
                </div>
                <button onClick={onLogout} className="text-gray-400 p-2"><LogoutIcon className="w-6 h-6" /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 pb-32 space-y-6">
                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
                    <div>
                        <label className="block text-xs font-black uppercase text-gray-400 mb-1">Nome del Locale</label>
                        <input 
                            type="text" value={restaurant.name} 
                            onChange={e => setRestaurant({ ...restaurant, name: e.target.value })}
                            className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-wine-600"
                        />
                    </div>

                    <div>
                        <div className="flex justify-between items-end mb-1">
                            <label className="block text-xs font-black uppercase text-gray-400">Contenuto Carta (Testo)</label>
                            <button 
                                onClick={() => fileInputRef.current?.click()}
                                className="text-[10px] font-black text-wine-600 flex items-center gap-1 uppercase hover:underline"
                            >
                                <CameraIcon className="w-3 h-3" /> Estrai da Foto/PDF
                            </button>
                            <input type="file" ref={fileInputRef} className="hidden" accept="image/*,application/pdf" onChange={handleFileUpload} />
                        </div>
                        <textarea 
                            value={restaurant.menu_context}
                            onChange={e => setRestaurant({ ...restaurant, menu_context: e.target.value })}
                            className="w-full h-48 p-3 border border-gray-200 rounded-xl text-xs font-mono outline-none focus:ring-2 focus:ring-wine-600"
                            placeholder="Vino | Produttore | Annata | Prezzo..."
                        />
                    </div>

                    <button 
                        onClick={handleSave}
                        className="w-full py-4 bg-wine-700 text-white font-black uppercase text-xs tracking-widest rounded-xl shadow-lg active:scale-95 transition-all"
                    >
                        Salva Carta Vini
                    </button>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm text-center">
                    <h3 className="font-serif font-bold text-lg mb-4">Il Tuo QR Code Clienti</h3>
                    <div className="bg-stone-50 p-4 rounded-xl inline-block border border-gray-100 mb-4">
                        <img src={qrUrl} alt="QR Code" className="w-48 h-48" />
                    </div>
                    <div className="flex flex-col gap-2">
                         <a href={qrUrl} download="qr-carta-vini.png" className="w-full py-3 bg-gray-900 text-white font-bold rounded-xl text-sm">Scarica QR Code</a>
                         <button 
                            onClick={() => {
                                navigator.clipboard.writeText(`https://www.aiknow.wine/?ref=${restaurant.slug}`);
                                alert("Link copiato!");
                            }}
                            className="text-xs text-wine-600 font-bold flex items-center justify-center gap-1 hover:underline"
                         >
                            Copia Link Pubblico <ExternalLinkIcon className="w-3 h-3" />
                         </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RestaurantCellarView;
