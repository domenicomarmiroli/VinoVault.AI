import React, { Suspense, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Location, LocationKind, LocationLayout, Wine } from '../types';
import { defaultLayout, LAYOUT_LIMITS, layoutCapacity, sanitizeLayout, slotInRange } from '../services/cellarLayout';
import { Loader3D } from './Cellar3DModal';

const Cellar3D = React.lazy(() => import('./Cellar3D'));

interface Props {
  isOpen: boolean;
  location: Location | null;
  wines: Wine[];
  onClose: () => void;
  onSave: (kind: LocationKind, layout?: LocationLayout) => void;
}

const Stepper: React.FC<{ label: string; value: number; min: number; max: number; onChange: (v: number) => void }> = ({ label, value, min, max, onChange }) => (
  <div>
    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">{label}</p>
    <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl overflow-hidden">
      <button type="button" onClick={() => onChange(Math.max(min, value - 1))} disabled={value <= min} className="w-9 h-9 text-gray-500 hover:bg-gray-100 disabled:opacity-30 font-bold">−</button>
      <input type="number" min={min} max={max} value={value} onChange={e => onChange(Math.max(min, Math.min(max, parseInt(e.target.value) || min)))} className="w-full min-w-0 text-center bg-transparent font-bold text-gray-900 outline-none" />
      <button type="button" onClick={() => onChange(Math.min(max, value + 1))} disabled={value >= max} className="w-9 h-9 text-wine-700 hover:bg-gray-100 disabled:opacity-30 font-bold">+</button>
    </div>
  </div>
);

const KIND_OPTIONS: { kind: LocationKind; icon: string; title: string; desc: string }[] = [
  { kind: 'generic', icon: '📦', title: 'Generica', desc: 'Solo il nome, senza posti' },
  { kind: 'rack', icon: '🪵', title: 'Scaffale', desc: 'Colonne e ripiani in legno' },
  { kind: 'fridge', icon: '🧊', title: 'Cantinetta frigo', desc: 'Ripiani a temperatura controllata' },
];

const LocationConfiguratorModal: React.FC<Props> = ({ isOpen, location, wines, onClose, onSave }) => {
  const [kind, setKind] = useState<LocationKind>('generic');
  const [layout, setLayout] = useState<LocationLayout | undefined>();
  const [quick, setQuick] = useState({ columns: 3, shelves: 6, bottles: 6 });

  useEffect(() => {
    if (!isOpen || !location) return;
    const k = location.kind || 'generic';
    setKind(k);
    setLayout(location.layout || defaultLayout(k));
    if (location.layout?.columns.length) {
      const c = location.layout.columns[0];
      setQuick({ columns: location.layout.columns.length, shelves: c.shelves, bottles: c.bottlesPerShelf });
    }
  }, [isOpen, location]);

  const locWines = useMemo(() => location ? wines.filter(w => w.location === location.name && w.quantity > 0) : [], [wines, location]);
  const clean = useMemo(() => sanitizeLayout(kind, layout), [kind, layout]);
  const lostBottles = useMemo(() => locWines.reduce((s, w) => s + (w.cellarSlots || []).filter(sl => !clean || !slotInRange(clean, sl)).length, 0), [locWines, clean]);

  if (!isOpen || !location) return null;

  const changeKind = (k: LocationKind) => {
    setKind(k);
    if (k === 'generic') return;
    if (k === 'fridge') setLayout(prev => ({ columns: [prev?.columns[0] || { shelves: 6, bottlesPerShelf: 6 }] }));
    if (k === 'rack' && (!layout || layout.columns.length === 0)) setLayout(defaultLayout('rack'));
  };

  const updateColumn = (i: number, patch: Partial<{ shelves: number; bottlesPerShelf: number }>) =>
    setLayout(prev => prev ? { columns: prev.columns.map((c, ci) => ci === i ? { ...c, ...patch } : c) } : prev);

  const applyQuick = () => setLayout({ columns: Array.from({ length: quick.columns }, () => ({ shelves: quick.shelves, bottlesPerShelf: quick.bottles })) });

  const content = (
    <div className="fixed inset-0 z-[400] bg-black/70 backdrop-blur-sm flex items-center justify-center p-0 md:p-6 animate-in fade-in duration-200" onClick={onClose}>
      <div className="bg-white w-full h-[100dvh] md:h-[88vh] md:max-w-6xl md:rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300" onClick={e => e.stopPropagation()}>
        <div className="shrink-0 flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <h2 className="font-serif font-bold text-xl text-gray-900">Configura “{location.name}”</h2>
            <p className="text-xs text-gray-500">Definisci la struttura per sapere esattamente dove si trova ogni bottiglia.</p>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-full hover:bg-gray-100 text-gray-500">✕</button>
        </div>

        <div className="flex-1 min-h-0 flex flex-col lg:flex-row">
          <div className="lg:w-[420px] shrink-0 overflow-y-auto p-5 space-y-6 border-b lg:border-b-0 lg:border-r border-gray-100 max-h-[50%] lg:max-h-none">
            <div className="grid grid-cols-3 gap-2">
              {KIND_OPTIONS.map(o => (
                <button key={o.kind} onClick={() => changeKind(o.kind)} className={`p-3 rounded-2xl border text-left transition-all ${kind === o.kind ? 'border-wine-600 bg-wine-50 ring-1 ring-wine-600' : 'border-gray-200 hover:border-gray-300'}`}>
                  <span className="text-2xl">{o.icon}</span>
                  <p className="text-xs font-bold text-gray-900 mt-1">{o.title}</p>
                  <p className="text-[10px] text-gray-500 leading-tight">{o.desc}</p>
                </button>
              ))}
            </div>

            {kind === 'fridge' && layout && (
              <div className="grid grid-cols-2 gap-3 animate-in fade-in slide-in-from-bottom-4">
                <Stepper label="Ripiani" value={layout.columns[0].shelves} min={1} max={LAYOUT_LIMITS.shelves} onChange={v => updateColumn(0, { shelves: v })} />
                <Stepper label="Bottiglie per ripiano" value={layout.columns[0].bottlesPerShelf} min={1} max={LAYOUT_LIMITS.bottlesPerShelf} onChange={v => updateColumn(0, { bottlesPerShelf: v })} />
              </div>
            )}

            {kind === 'rack' && layout && (
              <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4">
                <div className="p-3 rounded-2xl bg-gray-50 border border-gray-100">
                  <p className="text-xs font-bold text-gray-700 mb-2">Configurazione rapida</p>
                  <div className="grid grid-cols-3 gap-2">
                    <Stepper label="Colonne" value={quick.columns} min={1} max={LAYOUT_LIMITS.columns} onChange={v => setQuick(q => ({ ...q, columns: v }))} />
                    <Stepper label="Ripiani" value={quick.shelves} min={1} max={LAYOUT_LIMITS.shelves} onChange={v => setQuick(q => ({ ...q, shelves: v }))} />
                    <Stepper label="Bott./rip." value={quick.bottles} min={1} max={LAYOUT_LIMITS.bottlesPerShelf} onChange={v => setQuick(q => ({ ...q, bottles: v }))} />
                  </div>
                  <button onClick={applyQuick} className="mt-3 w-full py-2 text-xs font-bold rounded-xl bg-white border border-gray-200 hover:bg-gray-100">Applica a tutto lo scaffale</button>
                </div>

                <div>
                  <p className="text-xs font-bold text-gray-700 mb-2">Colonne (ognuna può avere ripiani diversi)</p>
                  <div className="space-y-2">
                    {layout.columns.map((c, i) => (
                      <div key={i} className="p-3 rounded-2xl border border-gray-200 animate-in fade-in slide-in-from-bottom-4">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs font-black text-gray-500 uppercase tracking-widest">Colonna {i + 1}</span>
                          {layout.columns.length > 1 && (
                            <button onClick={() => setLayout({ columns: layout.columns.filter((_, ci) => ci !== i) })} className="text-xs text-red-500 hover:underline">Rimuovi</button>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <Stepper label="Ripiani" value={c.shelves} min={1} max={LAYOUT_LIMITS.shelves} onChange={v => updateColumn(i, { shelves: v })} />
                          <Stepper label="Bottiglie per ripiano" value={c.bottlesPerShelf} min={1} max={LAYOUT_LIMITS.bottlesPerShelf} onChange={v => updateColumn(i, { bottlesPerShelf: v })} />
                        </div>
                      </div>
                    ))}
                  </div>
                  {layout.columns.length < LAYOUT_LIMITS.columns && (
                    <button onClick={() => setLayout({ columns: [...layout.columns, { ...layout.columns[layout.columns.length - 1] }] })} className="mt-2 w-full py-2.5 text-xs font-bold rounded-xl border-2 border-dashed border-gray-300 text-gray-500 hover:border-wine-400 hover:text-wine-700">+ Aggiungi colonna</button>
                  )}
                </div>
              </div>
            )}

            {kind === 'generic' && (
              <p className="text-sm text-gray-500">Le bottiglie in questa posizione avranno solo il nome della posizione, senza ripiano o posto.</p>
            )}

            {kind !== 'generic' && clean && (
              <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-100 text-sm text-emerald-900">
                Capienza totale: <b>{layoutCapacity(clean)}</b> bottiglie
              </div>
            )}
            {lostBottles > 0 && (
              <div className="p-3 rounded-2xl bg-amber-50 border border-amber-100 text-xs text-amber-900">
                {lostBottles} {lostBottles === 1 ? 'bottiglia posizionata finirà' : 'bottiglie posizionate finiranno'} fuori dalla nuova struttura e {lostBottles === 1 ? 'tornerà' : 'torneranno'} "da posizionare".
              </div>
            )}
          </div>

          <div className="relative flex-1 min-h-[280px] bg-[radial-gradient(ellipse_at_top,_#57534e_0%,_#292524_45%,_#0c0a09_100%)]">
            {kind !== 'generic' && clean ? (
              <Suspense fallback={<Loader3D />}>
                <Cellar3D kind={kind as 'rack' | 'fridge'} layout={clean} wines={locWines} interaction="preview" className="absolute inset-0" />
              </Suspense>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white/50 gap-2">
                <span className="text-5xl">📦</span>
                <p className="text-sm">Scegli Scaffale o Cantinetta frigo per l'anteprima 3D</p>
              </div>
            )}
            <p className="absolute top-3 left-3 text-[10px] font-black uppercase tracking-widest text-white/60">Anteprima 3D</p>
          </div>
        </div>

        <div className="shrink-0 flex gap-3 p-4 border-t border-gray-100">
          <button onClick={onClose} className="flex-1 md:flex-none md:px-8 py-3 rounded-xl text-gray-600 font-bold hover:bg-gray-100">Annulla</button>
          <button onClick={() => { onSave(kind, clean); onClose(); }} className="flex-1 md:ml-auto md:flex-none md:px-10 py-3 rounded-xl bg-wine-700 text-white font-bold hover:bg-wine-800 shadow-lg">Salva configurazione</button>
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
};

export default LocationConfiguratorModal;
