
import React, { useState, useEffect, useRef } from 'react';
import { Restaurant } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { RestaurantIcon, CameraIcon, LogoutIcon, ExternalLinkIcon } from '../components/Icons';
import { extractTextFromMedia } from '../services/geminiService';
import LoadingScreen from '../components/LoadingScreen';

interface RestaurantCellarViewProps {
    onLogout: () => void;
}

const RestaurantCellarView: React.FC<RestaurantCellarViewProps> = ({ onLogout }) => {
    const { t } = useLanguage();
    const [restaurant, setRestaurant] = useState<Partial<Restaurant>>({ name: '', slug: '', menu_context: '' });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [extracting, setExtracting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        fetch('/api/my-restaurant', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('vinovault_token')}` }
        })
        .then(res => res.json())
        .then(data => {
            if (data) setRestaurant(data);
            setLoading(false);
        });
    }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const res = await fetch('/api/my-restaurant', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('vinovault_token')}` 
                },
                body: JSON.stringify(restaurant)
            });
            if (res.ok) alert(t('save') + " OK!");
            else {
                const err = await res.json();
                alert(err.error || "Errore");
            }
        } finally { setSaving(false); }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setExtracting(true);
        try {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = async () => {
                const base64 = reader.result as string;
                const text = await extractTextFromMedia(base64, file.type);
                setRestaurant(prev => ({ ...prev, menu_context: (prev.menu_context || '') + "\n" + text }));
            };
        } catch (e) { alert("Errore lettura"); }
        finally { setExtracting(false); }
    };

    const qrUrl = restaurant.slug ? `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(`https://www.aiknow.wine/?ref=${restaurant.slug}`)}` : null;

    if (loading) return <div className="h-full flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-wine-600"></div></div>;

    return (
        <div className="h-full flex flex-col bg-stone-50 overflow-hidden">
            {extracting && <LoadingScreen message={t('ai_analyzing')} subMessage="Sto leggendo la tua carta dei vini..." />}
            
            <div className="bg-white border-b border-gray-200 p-6 shadow-sm flex justify-between items-start">
                <div>
                    <h1 className="text-2xl font-serif font-bold text-gray-900 flex items-center gap-2">
                        <RestaurantIcon className="w-8 h-8 text-wine-600" filled />
                        {t('rest_manage_title')}
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">{t('rest_manage_desc')}</p>
                </div>
                <button onClick={onLogout} className="text-gray-400 hover:text-wine-700 p-2"><LogoutIcon className="w-6 h-6" /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 pb-32 space-y-6">
                <form onSubmit={handleSave} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
                    <div>
                        <label className="block text-xs font-black uppercase text-gray-400 mb-1">{t('rest_name_label')}</label>
                        <input 
                            type="text" required value={restaurant.name} 
                            onChange={e => setRestaurant({ ...restaurant, name: e.target.value })}
                            className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-wine-600 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-black uppercase text-gray-400 mb-1">{t('rest_slug_label')}</label>
                        <input 
                            type="text" required value={restaurant.slug} 
                            onChange={e => setRestaurant({ ...restaurant, slug: e.target.value.toLowerCase().replace(/ /g, '-') })}
                            className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-wine-600 outline-none font-mono"
                            placeholder="il-mio-ristorante"
                        />
                        <p className="text-[10px] text-gray-400 mt-1">{t('rest_slug_hint').replace('{slug}', restaurant.slug || '...')}</p>
                    </div>

                    <div>
                        <div className="flex justify-between items-center mb-1">
                            <label className="block text-xs font-black uppercase text-gray-400">{t('rest_menu_label')}</label>
                            <button 
                                type="button" onClick={() => fileInputRef.current?.click()}
                                className="text-[10px] font-black text-wine-600 flex items-center gap-1 uppercase tracking-wider hover:underline"
                            >
                                <CameraIcon className="w-3 h-3" /> {t('rest_extract_btn')}
                            </button>
                            <input type="file" ref={fileInputRef} className="hidden" accept="image/*,application/pdf" onChange={handleFileUpload} />
                        </div>
                        <textarea 
                            value={restaurant.menu_context}
                            onChange={e => setRestaurant({ ...restaurant, menu_context: e.target.value })}
                            className="w-full h-48 p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-wine-600 outline-none text-xs font-mono"
                            placeholder="Vino A | Produttore | 2020 | 30€..."
                        />
                    </div>

                    <button 
                        type="submit" disabled={saving}
                        className="w-full py-4 bg-wine-700 text-white font-black uppercase text-xs tracking-widest rounded-xl shadow-lg active:scale-95 transition-all"
                    >
                        {saving ? t('loading') : t('rest_save_btn')}
                    </button>
                </form>

                {qrUrl && (
                    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm text-center">
                        <h3 className="font-serif font-bold text-lg mb-1">{t('rest_qr_title')}</h3>
                        <p className="text-xs text-gray-500 mb-6">{t('rest_qr_desc')}</p>
                        
                        <div className="bg-stone-50 p-6 rounded-2xl inline-block border border-gray-100 mb-6">
                            <img src={qrUrl} alt="QR Code" className="w-48 h-48" />
                        </div>

                        <div className="flex flex-col gap-3">
                             <a 
                                href={qrUrl} download={`qr-code-${restaurant.slug}.png`}
                                className="w-full py-3 bg-gray-900 text-white font-bold rounded-xl text-sm"
                             >
                                Scarica QR Code
                             </a>
                             <a 
                                href={`https://www.aiknow.wine/?ref=${restaurant.slug}`} target="_blank"
                                className="text-xs text-wine-600 font-bold flex items-center justify-center gap-1 hover:underline"
                             >
                                Apri vista cliente <ExternalLinkIcon className="w-3 h-3" />
                             </a>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RestaurantCellarView;
