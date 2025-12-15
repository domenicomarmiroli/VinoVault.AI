
import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Wine, WineType, Location } from '../types';
import { analyzeWineLabel } from '../services/geminiService';
import { CameraIcon, PlusIcon } from './Icons';
import { useLanguage } from '../contexts/LanguageContext';

const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2, 9);

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
                } else reject(new Error("Canvas context error"));
            };
            img.onerror = (err) => reject(err);
        };
        reader.onerror = (err) => reject(err);
    });
};

const years = Array.from({length: 81}, (_, i) => (new Date().getFullYear() + 1) - i);

interface AddWineModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (wine: Wine) => void;
  locations: Location[];
  onAiUsed: () => void;
}

const AddWineModal: React.FC<AddWineModalProps> = ({ isOpen, onClose, onAdd, locations, onAiUsed }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'upload' | 'verify'>('upload');
  const { t, language } = useLanguage();
  
  const [formData, setFormData] = useState<Partial<Wine>>({
    name: '',
    producer: '',
    year: '',
    type: WineType.RED,
    region: '',
    quantity: 1,
    location: '',
    price: 0,
    purchaseDate: new Date().toISOString().split('T')[0],
    drinkWindow: '',
    marketPrice: 0
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
        const compressedBase64 = await compressImage(file);
        setImagePreview(compressedBase64);
        try {
            const analysis = await analyzeWineLabel(compressedBase64, language);
            setFormData(prev => ({ ...prev, ...analysis, price: analysis.price || prev.price, quantity: 1, location: prev.location }));
            onAiUsed();
            setStep('verify');
        } catch (err: any) {
            alert(`${t('error')}: ${err.message}`);
            setStep('verify');
        } finally {
            setLoading(false);
        }
    } catch (error) {
      setLoading(false);
      alert(t('error'));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newWine: Wine = {
      id: generateId(),
      name: formData.name || 'Sconosciuto',
      producer: formData.producer || 'Sconosciuto',
      year: formData.year || 'N/A',
      type: formData.type || WineType.RED,
      region: formData.region || '',
      grape: formData.grape || '',
      alcohol: formData.alcohol || '',
      purchaseDate: formData.purchaseDate || new Date().toISOString(),
      price: formData.price || 0,
      quantity: formData.quantity || 1,
      location: formData.location || (locations.length > 0 ? locations[0].name : 'Cantina'),
      storageTemp: formData.storageTemp || '12-16°C',
      storageAdvice: formData.storageAdvice || 'Conservare al riparo dalla luce',
      servingTemp: formData.servingTemp || '16-18°C',
      servingAdvice: formData.servingAdvice || 'Aprire 30 min prima',
      foodPairings: formData.foodPairings || [],
      imageUrl: imagePreview || undefined,
      drinkWindow: formData.drinkWindow || `${new Date().getFullYear()}-${new Date().getFullYear() + 3}`,
      marketPrice: formData.marketPrice || formData.price || 0
    };
    onAdd(newWine);
    handleClose();
  };

  const handleClose = () => {
    setFormData({ quantity: 1, location: '', price: 0, purchaseDate: new Date().toISOString().split('T')[0] });
    setImagePreview(null);
    setStep('upload');
    setLoading(false);
    onClose();
  };

  if (!isOpen) return null;

  const content = (
    <div className="fixed inset-0 bg-black/70 z-[200] flex items-center justify-center p-0 md:p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full h-[100dvh] md:h-auto md:max-h-[90vh] md:max-w-lg md:rounded-2xl shadow-xl flex flex-col relative overflow-hidden rounded-none">
        
        <div className="p-4 border-b border-gray-100 flex-shrink-0 flex justify-between items-center bg-white">
             <h2 className="text-xl font-bold text-gray-900 font-serif">{t('add_title')}</h2>
             <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 p-2">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 bg-gray-50 pb-32">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-wine-600"></div>
              <p className="text-wine-700 animate-pulse text-center">{t('ai_analyzing')}</p>
            </div>
          ) : step === 'upload' ? (
            <div className="space-y-4 pt-4">
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="w-full border-2 border-dashed border-wine-300 rounded-xl p-8 flex flex-col items-center justify-center hover:bg-wine-50 transition-colors group bg-white"
              >
                <div className="bg-wine-100 p-4 rounded-full mb-3 group-hover:scale-110 transition-transform"><CameraIcon className="w-8 h-8 text-wine-600" /></div>
                <span className="text-lg font-medium text-wine-900">{t('scan_label')}</span>
                <span className="text-sm text-wine-500 mt-1">{t('upload_desc')}</span>
              </button>
              <input type="file" accept="image/*" capture="environment" ref={fileInputRef} className="hidden" onChange={handleFileChange} />
              <button onClick={() => setStep('verify')} className="w-full py-3 bg-white border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors">{t('manual_insert')}</button>
            </div>
          ) : (
            <form id="add-wine-form" onSubmit={handleSubmit} className="space-y-4">
              {imagePreview && (<div className="w-32 h-32 mx-auto mb-4 rounded-lg overflow-hidden border border-gray-200 shadow-sm"><img src={imagePreview} alt="Preview" className="w-full h-full object-cover" /></div>)}
              <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-xs font-medium text-gray-500 mb-1">{t('name')}</label><input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full p-3 border border-gray-300 rounded-lg bg-white" /></div>
                  <div><label className="block text-xs font-medium text-gray-500 mb-1">{t('producer')}</label><input required type="text" value={formData.producer} onChange={e => setFormData({...formData, producer: e.target.value})} className="w-full p-3 border border-gray-300 rounded-lg bg-white" /></div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                  <div><label className="block text-xs font-medium text-gray-500 mb-1">{t('year')}</label><select value={formData.year} onChange={e => setFormData({...formData, year: e.target.value})} className="w-full p-3 border border-gray-300 rounded-lg bg-white"><option value="">N/A</option>{years.map(y => (<option key={y} value={y.toString()}>{y}</option>))}</select></div>
                  <div className="col-span-2"><label className="block text-xs font-medium text-gray-500 mb-1">{t('type')}</label><select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as WineType})} className="w-full p-3 border border-gray-300 rounded-lg bg-white">{Object.values(WineType).map(t => <option key={t} value={t}>{t}</option>)}</select></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                   <div><label className="block text-xs font-medium text-gray-500 mb-1">{t('price')} (€)</label><input type="number" step="0.01" value={formData.price} onChange={e => setFormData({...formData, price: parseFloat(e.target.value)})} className="w-full p-3 border border-gray-300 rounded-lg bg-white" /></div>
                   <div className="min-w-0"><label className="block text-xs font-medium text-gray-500 mb-1">{t('quantity')}</label><div className="flex items-center gap-1 w-full"><button type="button" onClick={() => setFormData({...formData, quantity: Math.max(1, (formData.quantity || 1) - 1)})} className="w-10 h-11 bg-white border border-gray-300 rounded-lg text-gray-600 font-bold">-</button><input type="number" min="1" value={formData.quantity} onChange={e => setFormData({...formData, quantity: parseInt(e.target.value)})} className="w-full min-w-0 flex-1 p-3 border border-gray-300 rounded-lg text-center bg-white h-11" /><button type="button" onClick={() => setFormData({...formData, quantity: (formData.quantity || 1) + 1})} className="w-10 h-11 bg-white border border-gray-300 rounded-lg text-wine-600 font-bold">+</button></div></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs font-medium text-gray-500 mb-1">{t('purchase_date')}</label><input type="date" value={formData.purchaseDate} onChange={e => setFormData({...formData, purchaseDate: e.target.value})} className="w-full p-3 border border-gray-300 rounded-lg bg-white" /></div>
                <div><label className="block text-xs font-medium text-gray-500 mb-1">{t('location')}</label><select value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} className="w-full p-3 border border-gray-300 rounded-lg bg-white"><option value="" disabled>Select...</option>{locations.map(loc => (<option key={loc.id} value={loc.name}>{loc.name}</option>))}</select></div>
              </div>
               <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 space-y-3">
                  <h4 className="text-xs font-bold uppercase text-indigo-700 mb-2">Analytics & Investimento</h4>
                  <div className="grid grid-cols-2 gap-3">
                      <div><label className="block text-xs text-gray-500">{t('market_estimate')} (€)</label><input type="number" value={formData.marketPrice || formData.price} onChange={e => setFormData({...formData, marketPrice: parseFloat(e.target.value)})} className="w-full p-2 text-sm bg-white border border-indigo-200 rounded-lg" /></div>
                      <div><label className="block text-xs text-gray-500">{t('drink_window')}</label><input type="text" value={formData.drinkWindow} onChange={e => setFormData({...formData, drinkWindow: e.target.value})} className="w-full p-2 text-sm bg-white border border-indigo-200 rounded-lg" /></div>
                  </div>
              </div>
              <div className="bg-white p-4 rounded-xl border border-gray-200 space-y-3">
                  <h4 className="text-xs font-bold uppercase text-stone-500 mb-2">Sommelier Data</h4>
                  <div className="grid grid-cols-2 gap-3">
                      <div><label className="block text-xs text-gray-500">{t('storage_temp')}</label><input type="text" value={formData.storageTemp} onChange={e => setFormData({...formData, storageTemp: e.target.value})} className="w-full p-2 text-sm bg-gray-50 border border-gray-200 rounded-lg" /></div>
                      <div><label className="block text-xs text-gray-500">{t('serving_temp')}</label><input type="text" value={formData.servingTemp} onChange={e => setFormData({...formData, servingTemp: e.target.value})} className="w-full p-2 text-sm bg-gray-50 border border-gray-200 rounded-lg" /></div>
                  </div>
                  <div><label className="block text-xs text-gray-500">{t('advice')}</label><input type="text" value={formData.storageAdvice} onChange={e => setFormData({...formData, storageAdvice: e.target.value})} className="w-full p-2 text-sm bg-gray-50 border border-gray-200 rounded-lg" /></div>
                  <div><label className="block text-xs text-gray-500">{t('advice')} (Serving)</label><input type="text" value={formData.servingAdvice} onChange={e => setFormData({...formData, servingAdvice: e.target.value})} className="w-full p-2 text-sm bg-gray-50 border border-gray-200 rounded-lg" /></div>
              </div>
            </form>
          )}
        </div>

        {step === 'verify' && (
             <div className="shrink-0 bg-white p-4 border-t border-gray-100 flex gap-3 pb-8 md:pb-4 safe-area-pb">
                <button type="button" onClick={handleClose} className="flex-1 py-3 text-gray-600 font-medium hover:bg-gray-100 rounded-xl transition-colors">{t('cancel')}</button>
                <button type="submit" form="add-wine-form" className="flex-1 py-3 bg-wine-600 text-white font-medium rounded-xl hover:bg-wine-700 shadow-lg shadow-wine-200 transition-all">{t('save')}</button>
            </div>
        )}
      </div>
    </div>
  );

  return createPortal(content, document.body);
};

export default AddWineModal;
