
import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Wine, WineType, Location, PurchaseAnalysis } from '../types';
import { analyzeWineLabel, analyzePurchase } from '../services/geminiService';
import { CameraIcon } from './Icons';
import { useLanguage } from '../contexts/LanguageContext';
import { useAnalysisStyle } from '../contexts/AnalysisStyleContext';
import WineFactsGrid from './WineFactsGrid';
import WineStyleChart from './WineStyleChart';

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
  inventory: Wine[];
  onAiUsed: () => void;
}

const AddWineModal: React.FC<AddWineModalProps> = ({ isOpen, onClose, onAdd, locations, inventory, onAiUsed }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'upload' | 'result'>('upload');
  const { t, language } = useLanguage();
  const { analysisStyle } = useAnalysisStyle();

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<PurchaseAnalysis | null>(null);
  const [editedYear, setEditedYear] = useState('');
  const [yearPromptVisible, setYearPromptVisible] = useState(false);
  const [pendingYear, setPendingYear] = useState('');

  const [cellarFields, setCellarFields] = useState({
    price: 0,
    quantity: 1,
    location: '',
    purchaseDate: new Date().toISOString().split('T')[0]
  });

  const runFullAnalysis = async (image: string, knownYear?: string) => {
      setLoading(true);
      try {
          const result = await analyzePurchase({ type: 'image', data: image }, 0, inventory, language, analysisStyle, knownYear);
          if (!result.wineDetails) {
              result.wineDetails = { name: 'Sconosciuto', producer: 'Sconosciuto', year: 'N/A', type: WineType.RED as any };
          }
          setAnalysis(result);
          setEditedYear(result.wineDetails?.year && result.wineDetails.year !== 'N/A' ? result.wineDetails.year : '');
          setCellarFields(prev => ({ ...prev, location: prev.location || (locations.length > 0 ? locations[0].name : '') }));
          onAiUsed();
          setStep('result');
      } catch (err: any) {
          alert(`${t('error')}: ${err.message}`);
      } finally {
          setLoading(false);
      }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
        const compressedBase64 = await compressImage(file);
        setImagePreview(compressedBase64);
        // Prima lettura rapida dell'etichetta: ci serve solo a sapere se
        // l'annata è leggibile prima di avviare la valutazione completa.
        const quickScan = await analyzeWineLabel(compressedBase64, language, analysisStyle);
        setLoading(false);
        if (!quickScan.year) {
            setPendingYear('');
            setYearPromptVisible(true);
            return;
        }
        await runFullAnalysis(compressedBase64, quickScan.year);
    } catch (error: any) {
      setLoading(false);
      alert(`${t('error')}: ${error.message || ''}`);
    }
  };

  const confirmPendingYear = async () => {
      if (!pendingYear || !imagePreview) return;
      setYearPromptVisible(false);
      await runFullAnalysis(imagePreview, pendingYear);
  };

  const handleAddToCellar = () => {
      if (!analysis || !editedYear) return;
      const details = analysis.wineDetails;
      const newWine: Wine = {
          id: generateId(),
          name: details?.name || 'Sconosciuto',
          producer: details?.producer || 'Sconosciuto',
          year: editedYear,
          type: (details?.type as any) || WineType.RED,
          region: details?.region || '',
          grape: details?.grape || '',
          alcohol: details?.alcohol || '',
          purchaseDate: cellarFields.purchaseDate,
          price: cellarFields.price || 0,
          quantity: cellarFields.quantity || 1,
          location: cellarFields.location || (locations.length > 0 ? locations[0].name : 'Cantina'),
          storageTemp: '12-16°C',
          storageAdvice: 'Conservare al riparo dalla luce',
          servingTemp: details?.servingTemp || '16-18°C',
          servingAdvice: 'Aprire 30 min prima',
          foodPairings: details?.foodPairings || [],
          imageUrl: imagePreview || undefined,
          drinkWindow: details?.drinkWindow || `${new Date().getFullYear()}-${new Date().getFullYear() + 3}`,
          marketPrice: Number(analysis.marketPriceEstimate) || cellarFields.price || 0,
          qualityScore: analysis.qualityScore,
          wineStyle: analysis.wineStyle
      };
      onAdd(newWine);
      handleClose();
  };

  const handleClose = () => {
    setImagePreview(null);
    setAnalysis(null);
    setEditedYear('');
    setYearPromptVisible(false);
    setPendingYear('');
    setCellarFields({ price: 0, quantity: 1, location: '', purchaseDate: new Date().toISOString().split('T')[0] });
    setStep('upload');
    setLoading(false);
    onClose();
  };

  const getQualityColor = (score: number) => {
      if (score >= 90) return 'border-emerald-500 text-emerald-600 bg-emerald-50';
      if (score >= 80) return 'border-wine-500 text-wine-600 bg-wine-50';
      if (score >= 70) return 'border-yellow-500 text-yellow-600 bg-yellow-50';
      return 'border-gray-300 text-gray-500 bg-gray-50';
  };

  if (!isOpen) return null;

  const content = (
    <div className="fixed inset-0 bg-black/70 z-[200] flex items-center justify-center p-0 md:p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full h-[100dvh] md:h-auto md:max-h-[90vh] md:max-w-lg md:rounded-2xl shadow-xl flex flex-col relative overflow-hidden rounded-none">

        {yearPromptVisible && (
          <div className="absolute inset-0 bg-black/60 z-[210] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl p-5 w-full max-w-sm animate-in slide-in-from-bottom duration-300">
              <p className="text-sm font-bold text-amber-700 mb-1">Annata non rilevata</p>
              <p className="text-sm text-gray-600 mb-4">Non riesco a leggere l'annata dall'etichetta. Indicala per completare la valutazione.</p>
              <select
                value={pendingYear}
                onChange={e => setPendingYear(e.target.value)}
                className="w-full p-3 border border-amber-400 ring-1 ring-amber-200 rounded-lg bg-white mb-4"
                autoFocus
              >
                <option value="">{t('year')}...</option>
                {years.map(y => (<option key={y} value={y.toString()}>{y}</option>))}
              </select>
              <div className="flex gap-3">
                <button onClick={handleClose} className="flex-1 py-3 text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-xl font-medium">{t('cancel')}</button>
                <button onClick={confirmPendingYear} disabled={!pendingYear} className="flex-1 py-3 bg-wine-700 text-white hover:bg-wine-800 rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed">Continua</button>
              </div>
            </div>
          </div>
        )}

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
              <p className="text-xs text-gray-400 text-center px-4 leading-relaxed">
                L'analisi AI dell'etichetta è il primo passo: calcola punteggio, profilo sensoriale, abbinamenti e finestra di consumo del vino. Se l'annata non è leggibile te la chiederemo prima di procedere.
              </p>
            </div>
          ) : analysis && (
            <div className="space-y-4 animate-in slide-in-from-bottom duration-500">
              {imagePreview && (<div className="w-28 h-28 mx-auto rounded-lg overflow-hidden border border-gray-200 shadow-sm"><img src={imagePreview} alt="Preview" className="w-full h-full object-cover" /></div>)}

              <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
                  <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0 pr-4">
                          <span className="text-xs font-bold text-gray-400 uppercase">{analysis.wineDetails?.type || 'VINO'}</span>
                          <h2 className="text-xl font-serif font-bold text-gray-900 leading-tight line-clamp-2">{analysis.wineDetails?.name || 'Sconosciuto'}</h2>
                          <p className="text-gray-600 truncate flex items-center gap-1">
                              <span>{analysis.wineDetails?.producer || ''} •</span>
                              <select
                                  value={editedYear}
                                  onChange={e => setEditedYear(e.target.value)}
                                  className={`text-sm border rounded px-1 py-0.5 bg-white ${!editedYear ? 'border-amber-400 ring-1 ring-amber-200 text-amber-700' : 'border-gray-300'}`}
                              >
                                  <option value="">{t('year')}...</option>
                                  {years.map(y => (<option key={y} value={y.toString()}>{y}</option>))}
                              </select>
                          </p>
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

              <WineFactsGrid
                  grape={analysis.wineDetails?.grape}
                  type={analysis.wineDetails?.type}
                  alcohol={analysis.wineDetails?.alcohol}
                  year={editedYear}
                  drinkWindow={analysis.wineDetails?.drinkWindow}
                  foodPairings={analysis.wineDetails?.foodPairings}
                  serving={analysis.wineDetails?.servingTemp ? `Consigliato servire a ${analysis.wineDetails.servingTemp}` : undefined}
              />

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
                  </div>
              )}

              <WineStyleChart style={analysis.wineStyle} />

              <div className="bg-white p-4 rounded-xl border border-gray-200 space-y-3">
                  <h4 className="text-xs font-bold uppercase text-stone-500 mb-1">Dati di cantina</h4>
                  <div className="grid grid-cols-2 gap-3">
                      <div><label className="block text-xs text-gray-500 mb-1">{t('price')} (€)</label><input type="number" step="0.01" value={cellarFields.price} onChange={e => setCellarFields({...cellarFields, price: parseFloat(e.target.value) || 0})} className="w-full p-2.5 text-sm border border-gray-300 rounded-lg bg-white" /></div>
                      <div><label className="block text-xs text-gray-500 mb-1">{t('quantity')}</label><div className="flex items-center gap-1"><button type="button" onClick={() => setCellarFields({...cellarFields, quantity: Math.max(1, cellarFields.quantity - 1)})} className="w-9 h-9 bg-white border border-gray-300 rounded-lg text-gray-600 font-bold">-</button><input type="number" min="1" value={cellarFields.quantity} onChange={e => setCellarFields({...cellarFields, quantity: parseInt(e.target.value) || 1})} className="w-full min-w-0 flex-1 p-2.5 text-sm border border-gray-300 rounded-lg text-center bg-white h-9" /><button type="button" onClick={() => setCellarFields({...cellarFields, quantity: cellarFields.quantity + 1})} className="w-9 h-9 bg-white border border-gray-300 rounded-lg text-wine-600 font-bold">+</button></div></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                      <div><label className="block text-xs text-gray-500 mb-1">{t('purchase_date')}</label><input type="date" value={cellarFields.purchaseDate} onChange={e => setCellarFields({...cellarFields, purchaseDate: e.target.value})} className="w-full p-2.5 text-sm border border-gray-300 rounded-lg bg-white" /></div>
                      <div><label className="block text-xs text-gray-500 mb-1">{t('location')}</label><select value={cellarFields.location} onChange={e => setCellarFields({...cellarFields, location: e.target.value})} className="w-full p-2.5 text-sm border border-gray-300 rounded-lg bg-white"><option value="" disabled>Select...</option>{locations.map(loc => (<option key={loc.id} value={loc.name}>{loc.name}</option>))}</select></div>
                  </div>
              </div>
            </div>
          )}
        </div>

        {step === 'result' && (
             <div className="shrink-0 bg-white p-4 border-t border-gray-100 flex gap-3 pb-8 md:pb-4 safe-area-pb">
                <button type="button" onClick={handleClose} className="flex-1 py-3 text-gray-600 font-medium hover:bg-gray-100 rounded-xl transition-colors">{t('cancel')}</button>
                <button type="button" onClick={handleAddToCellar} disabled={!editedYear} className="flex-1 py-3 bg-wine-600 text-white font-medium rounded-xl hover:bg-wine-700 shadow-lg shadow-wine-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed">{t('save')}</button>
            </div>
        )}
      </div>
    </div>
  );

  return createPortal(content, document.body);
};

export default AddWineModal;
