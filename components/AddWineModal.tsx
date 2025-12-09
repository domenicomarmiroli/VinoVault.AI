
import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Wine, WineType, Location } from '../types';
import { analyzeWineLabel } from '../services/geminiService';
import { CameraIcon, PlusIcon } from './Icons';

// Helper per generare ID univoci
const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2, 9);

interface AddWineModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (wine: Wine) => void;
  locations: Location[];
}

const AddWineModal: React.FC<AddWineModalProps> = ({ isOpen, onClose, onAdd, locations }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'upload' | 'verify'>('upload');
  
  // Form State
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
      // Convert to Base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        setImagePreview(base64String);
        
        // Call Gemini
        try {
            const analysis = await analyzeWineLabel(base64String);
            setFormData(prev => ({
                ...prev,
                ...analysis,
                price: analysis.price || prev.price,
                quantity: 1,
                location: prev.location 
            }));
            setStep('verify');
        } catch (err: any) {
            console.error("Analysis failed", err);
            // Mostra l'errore reale
            alert(`Errore: ${err.message || "Impossibile analizzare l'immagine"}`);
            setStep('verify');
        } finally {
            setLoading(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      setLoading(false);
      console.error(error);
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
        
        {/* Header Fissa */}
        <div className="p-4 border-b border-gray-100 flex-shrink-0 flex justify-between items-center bg-white">
             <h2 className="text-xl font-bold text-gray-900 font-serif">Aggiungi Vino</h2>
             <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 p-2">
               ✕
             </button>
        </div>

        {/* Content Scrollabile */}
        <div className="flex-1 overflow-y-auto p-4 bg-gray-50 pb-32">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-wine-600"></div>
              <p className="text-wine-700 animate-pulse text-center">Il Sommelier sta analizzando l'etichetta...</p>
            </div>
          ) : step === 'upload' ? (
            <div className="space-y-4 pt-4">
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="w-full border-2 border-dashed border-wine-300 rounded-xl p-8 flex flex-col items-center justify-center hover:bg-wine-50 transition-colors group bg-white"
              >
                <div className="bg-wine-100 p-4 rounded-full mb-3 group-hover:scale-110 transition-transform">
                    <CameraIcon className="w-8 h-8 text-wine-600" />
                </div>
                <span className="text-lg font-medium text-wine-900">Scatta foto etichetta</span>
                <span className="text-sm text-wine-500 mt-1">L'IA estrarrà i dati per te</span>
              </button>
              <input 
                type="file" 
                accept="image/*"
                capture="environment" 
                ref={fileInputRef} 
                className="hidden" 
                onChange={handleFileChange}
              />
              
              <div className="relative flex items-center py-2">
                <div className="flex-grow border-t border-gray-200"></div>
                <span className="flex-shrink-0 mx-4 text-gray-400 text-sm">oppure</span>
                <div className="flex-grow border-t border-gray-200"></div>
              </div>

              <button 
                onClick={() => setStep('verify')}
                className="w-full py-3 bg-white border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors"
              >
                Inserisci Manualmente
              </button>
            </div>
          ) : (
            <form id="add-wine-form" onSubmit={handleSubmit} className="space-y-4">
              {imagePreview && (
                <div className="w-32 h-32 mx-auto mb-4 rounded-lg overflow-hidden border border-gray-200 shadow-sm">
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                  <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Nome</label>
                      <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full p-3 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-wine-500 outline-none transition-all" />
                  </div>
                  <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Produttore</label>
                      <input required type="text" value={formData.producer} onChange={e => setFormData({...formData, producer: e.target.value})} className="w-full p-3 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-wine-500 outline-none transition-all" />
                  </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                  <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Annata</label>
                      <input type="text" value={formData.year} onChange={e => setFormData({...formData, year: e.target.value})} className="w-full p-3 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-wine-500 outline-none transition-all" />
                  </div>
                  <div className="col-span-2">
                      <label className="block text-xs font-medium text-gray-500 mb-1">Tipologia</label>
                      <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as WineType})} className="w-full p-3 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-wine-500 outline-none transition-all">
                          {Object.values(WineType).map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                  </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                   <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Prezzo (€)</label>
                      <input type="number" step="0.01" value={formData.price} onChange={e => setFormData({...formData, price: parseFloat(e.target.value)})} className="w-full p-3 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-wine-500 outline-none transition-all" />
                   </div>
                   <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Quantità</label>
                      <div className="flex items-center gap-1">
                          <button type="button" onClick={() => setFormData({...formData, quantity: Math.max(1, (formData.quantity || 1) - 1)})} className="w-12 h-11 bg-white border border-gray-300 rounded-lg text-gray-600 font-bold hover:bg-gray-50">-</button>
                          <input 
                              type="number" 
                              min="1" 
                              value={formData.quantity} 
                              onChange={e => setFormData({...formData, quantity: parseInt(e.target.value)})} 
                              className="flex-1 p-3 border border-gray-300 rounded-lg text-center bg-white outline-none h-11" 
                          />
                          <button type="button" onClick={() => setFormData({...formData, quantity: (formData.quantity || 1) + 1})} className="w-12 h-11 bg-white border border-gray-300 rounded-lg text-wine-600 font-bold hover:bg-gray-50">+</button>
                      </div>
                   </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Data Acquisto</label>
                    <input type="date" value={formData.purchaseDate} onChange={e => setFormData({...formData, purchaseDate: e.target.value})} className="w-full p-3 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-wine-500 outline-none transition-all" />
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Posizione</label>
                    <select 
                        value={formData.location} 
                        onChange={e => setFormData({...formData, location: e.target.value})} 
                        className="w-full p-3 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-wine-500 outline-none transition-all"
                    >
                        <option value="" disabled>Seleziona...</option>
                        {locations.map(loc => (
                            <option key={loc.id} value={loc.name}>{loc.name}</option>
                        ))}
                    </select>
                </div>
              </div>

               {/* Advanced Analytics Fields */}
               <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 space-y-3">
                  <h4 className="text-xs font-bold uppercase text-indigo-700 mb-2">Analytics & Investimento</h4>
                  <div className="grid grid-cols-2 gap-3">
                      <div>
                          <label className="block text-xs text-gray-500">Valore Mercato (€)</label>
                          <input type="number" value={formData.marketPrice || formData.price} onChange={e => setFormData({...formData, marketPrice: parseFloat(e.target.value)})} className="w-full p-2 text-sm bg-white border border-indigo-200 rounded-lg" />
                      </div>
                      <div>
                          <label className="block text-xs text-gray-500">Finestra Consumo (es. 2026-2028)</label>
                          <input type="text" value={formData.drinkWindow} onChange={e => setFormData({...formData, drinkWindow: e.target.value})} className="w-full p-2 text-sm bg-white border border-indigo-200 rounded-lg" />
                      </div>
                  </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-gray-200 space-y-3">
                  <h4 className="text-xs font-bold uppercase text-stone-500 mb-2">Dati Sommelier (Modificabili)</h4>
                  <div className="grid grid-cols-2 gap-3">
                      <div>
                          <label className="block text-xs text-gray-500">Temp. Conservazione</label>
                          <input type="text" value={formData.storageTemp} onChange={e => setFormData({...formData, storageTemp: e.target.value})} className="w-full p-2 text-sm bg-gray-50 border border-gray-200 rounded-lg" />
                      </div>
                      <div>
                          <label className="block text-xs text-gray-500">Temp. Servizio</label>
                          <input type="text" value={formData.servingTemp} onChange={e => setFormData({...formData, servingTemp: e.target.value})} className="w-full p-2 text-sm bg-gray-50 border border-gray-200 rounded-lg" />
                      </div>
                  </div>
                  <div>
                      <label className="block text-xs text-gray-500">Consigli Conservazione</label>
                      <input type="text" value={formData.storageAdvice} onChange={e => setFormData({...formData, storageAdvice: e.target.value})} className="w-full p-2 text-sm bg-gray-50 border border-gray-200 rounded-lg" />
                  </div>
                  <div>
                      <label className="block text-xs text-gray-500">Quando aprire</label>
                      <input type="text" value={formData.servingAdvice} onChange={e => setFormData({...formData, servingAdvice: e.target.value})} className="w-full p-2 text-sm bg-gray-50 border border-gray-200 rounded-lg" />
                  </div>
              </div>
            </form>
          )}
        </div>

        {/* Footer Actions Fixed */}
        {step === 'verify' && (
             <div className="shrink-0 bg-white p-4 border-t border-gray-100 flex gap-3 pb-8 md:pb-4 safe-area-pb">
                <button type="button" onClick={handleClose} className="flex-1 py-3 text-gray-600 font-medium hover:bg-gray-100 rounded-xl transition-colors">
                  Annulla
                </button>
                <button type="submit" form="add-wine-form" className="flex-1 py-3 bg-wine-600 text-white font-medium rounded-xl hover:bg-wine-700 shadow-lg shadow-wine-200 transition-all">
                  Salva in Cantina
                </button>
            </div>
        )}
      </div>
    </div>
  );

  return createPortal(content, document.body);
};

export default AddWineModal;
