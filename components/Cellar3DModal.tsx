import React, { Suspense, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { CellarSlot, Location, Wine } from '../types';
import type { PickInfo } from './Cellar3D';
import { computeOccupancy, formatSlot, is3DLocation, layoutCapacity, slotInRange } from '../services/cellarLayout';
import { classifyWineType } from '../services/wineTypeClassifier';
import { WINE_CATEGORY_COLORS, WINE_CATEGORY_LABELS } from './DashboardWidgets';
import { WineIcon } from './Icons';

const Cellar3D = React.lazy(() => import('./Cellar3D'));

interface Cellar3DModalProps {
  isOpen: boolean;
  locations: Location[];
  initialLocationId: string | null;
  initialPlacingWineId?: string | null;
  wines: Wine[];
  onClose: () => void;
  onUpdateWine: (wine: Wine) => void;
  onOpenWine: (wine: Wine) => void;
}

const placedCount = (wine: Wine, loc: Location) =>
  is3DLocation(loc) ? (wine.cellarSlots || []).filter(s => slotInRange(loc.layout, s)).length : 0;

export const Loader3D: React.FC = () => (
  <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-white/70">
    <div className="w-10 h-10 rounded-full border-4 border-white/20 border-t-white animate-spin" />
    <p className="text-xs">Carico il motore 3D...</p>
  </div>
);

const Cellar3DModal: React.FC<Cellar3DModalProps> = ({ isOpen, locations, initialLocationId, initialPlacingWineId, wines, onClose, onUpdateWine, onOpenWine }) => {
  const locations3D = useMemo(() => locations.filter(is3DLocation), [locations]);
  const [locationId, setLocationId] = useState<string | null>(initialLocationId);
  const [placingId, setPlacingId] = useState<string | null>(initialPlacingWineId || null);
  const [placeMode, setPlaceMode] = useState<'slot' | 'shelf'>('slot');
  const [hover, setHover] = useState<PickInfo | null>(null);
  const [selected, setSelected] = useState<Extract<PickInfo, { type: 'bottle' }> | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setLocationId(initialLocationId || locations3D[0]?.id || null);
    setPlacingId(initialPlacingWineId || null);
    setSelected(null);
    setHover(null);
  }, [isOpen, initialLocationId, initialPlacingWineId]);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(id);
  }, [toast]);

  const location = locations3D.find(l => l.id === locationId) || null;
  const locWines = useMemo(() => location ? wines.filter(w => w.location === location.name && w.quantity > 0) : [], [wines, location]);
  const placing = placingId ? wines.find(w => w.id === placingId) || null : null;

  const stats = useMemo(() => {
    if (!location || !is3DLocation(location)) return { capacity: 0, occupied: 0 };
    return { capacity: layoutCapacity(location.layout), occupied: computeOccupancy(location.layout, locWines).placed.length };
  }, [location, locWines]);

  const unplaced = location ? locWines.filter(w => placedCount(w, location) < w.quantity) : [];
  const placedWines = location ? locWines.filter(w => placedCount(w, location) > 0) : [];

  if (!isOpen) return null;

  const updateSlots = (wine: Wine, slots: CellarSlot[]) => onUpdateWine({ ...wine, cellarSlots: slots });

  const selectFromList = (w: Wine) => {
    if (!location || !is3DLocation(location)) return;
    const occ = computeOccupancy(location.layout, [w]).placed[0];
    if (occ) setSelected({ type: 'bottle', wine: w, column: occ.column, shelf: occ.shelf, position: occ.position, approximate: occ.approximate, slotIndex: occ.slotIndex });
  };

  const handlePick = (info: PickInfo) => {
    if (!location || !is3DLocation(location)) return;
    if (placing) {
      const current = (placing.cellarSlots || []).filter(s => slotInRange(location.layout, s));
      if (info.type === 'bottle') {
        if (info.wine.id === placing.id) {
          updateSlots(placing, (placing.cellarSlots || []).filter((s, i) => i !== info.slotIndex && slotInRange(location.layout, s)));
          setToast('Bottiglia tolta da questa posizione');
        } else {
          setToast(`Posto occupato da ${info.wine.name}`);
        }
        return;
      }
      const slot: CellarSlot = info.type === 'slot'
        ? { column: info.column, shelf: info.shelf, position: info.position }
        : { column: info.column, shelf: info.shelf };
      if (current.length < placing.quantity) {
        updateSlots(placing, [...current, slot]);
      } else if (placing.quantity === 1) {
        updateSlots(placing, [slot]);
        setToast('Bottiglia spostata');
      } else {
        setToast(`Tutte le ${placing.quantity} bottiglie sono già posizionate: tocca una di esse per toglierla`);
      }
      return;
    }
    if (info.type === 'bottle') setSelected(info);
  };

  const hoverText = (() => {
    if (!hover || !location || !is3DLocation(location)) return null;
    if (hover.type === 'bottle') return { title: hover.wine.name, sub: `${hover.wine.producer} · ${hover.wine.year}`, slot: (hover.approximate ? 'Sul ' : '') + formatSlot(location.layout, hover.approximate ? { column: hover.column, shelf: hover.shelf } : hover, location.kind) };
    if (hover.type === 'slot') return { title: 'Posto libero', sub: '', slot: formatSlot(location.layout, hover, location.kind) };
    return { title: 'Ripiano', sub: '', slot: formatSlot(location.layout, hover, location.kind) };
  })();

  const interaction = placing ? (placeMode === 'slot' ? 'place-slot' : 'place-shelf') : 'view';
  const placingPlaced = placing && location ? placedCount(placing, location) : 0;

  const content = (
    <div className="fixed inset-0 z-[400] bg-stone-950 flex flex-col animate-in fade-in duration-300">
      {/* Header */}
      <div className="shrink-0 flex flex-wrap items-center gap-3 px-4 md:px-6 py-3 bg-stone-900/80 border-b border-white/10 text-white">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-2xl">{location?.kind === 'fridge' ? '🧊' : '🪵'}</span>
          {locations3D.length > 1 ? (
            <select value={locationId || ''} onChange={e => { setLocationId(e.target.value); setSelected(null); setPlacingId(null); }} className="bg-white/10 border border-white/10 rounded-lg px-2 py-1.5 text-sm font-bold outline-none">
              {locations3D.map(l => <option key={l.id} value={l.id} className="text-gray-900">{l.name}</option>)}
            </select>
          ) : <h2 className="font-serif font-bold text-lg truncate">{location?.name}</h2>}
        </div>
        <div className="flex gap-2 text-xs">
          <span className="px-2.5 py-1 rounded-full bg-white/10"><b>{stats.occupied}</b> / {stats.capacity} posti occupati</span>
          <span className="hidden sm:inline px-2.5 py-1 rounded-full bg-white/10">{location?.kind === 'fridge' ? 'Cantinetta frigo' : 'Scaffale'}</span>
        </div>
        <button onClick={onClose} className="ml-auto w-9 h-9 rounded-full hover:bg-white/10 flex items-center justify-center" aria-label="Chiudi">✕</button>
      </div>

      <div className="flex-1 min-h-0 flex flex-col lg:flex-row">
        {/* Scena 3D */}
        <div className="relative flex-1 min-h-[45%] bg-[radial-gradient(ellipse_at_top,_#57534e_0%,_#292524_45%,_#0c0a09_100%)]">
          {location && is3DLocation(location) ? (
            <Suspense fallback={<Loader3D />}>
              <Cellar3D
                kind={location.kind as 'rack' | 'fridge'}
                layout={location.layout}
                wines={locWines}
                interaction={interaction}
                highlightWineId={placing?.id || selected?.wine.id || null}
                onPick={handlePick}
                onHover={setHover}
                className="absolute inset-0"
              />
            </Suspense>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-white/60 text-sm p-6 text-center">
              Nessuna posizione 3D configurata. Apri "Gestisci posizioni" e scegli Scaffale o Cantinetta frigo.
            </div>
          )}

          {hoverText && (
            <div className="absolute top-3 left-3 max-w-xs bg-black/70 backdrop-blur text-white rounded-xl px-3 py-2 pointer-events-none animate-in fade-in duration-150">
              <p className="text-sm font-bold truncate">{hoverText.title}</p>
              {hoverText.sub && <p className="text-xs text-white/70 truncate">{hoverText.sub}</p>}
              <p className="text-[11px] text-emerald-300 font-bold mt-0.5">{hoverText.slot}</p>
            </div>
          )}

          {toast && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-white text-gray-900 text-xs font-bold px-3 py-2 rounded-xl shadow-xl animate-in fade-in slide-in-from-top-2">{toast}</div>
          )}

          <p className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[10px] text-white/50 whitespace-nowrap pointer-events-none">
            Trascina per ruotare · rotella o pizzico per lo zoom · tasto destro o due dita per spostarti
          </p>

          {selected && !placing && location && is3DLocation(location) && (
            <div className="absolute bottom-8 left-3 right-3 md:right-auto md:w-80 bg-white rounded-2xl shadow-2xl p-4 animate-in fade-in slide-in-from-bottom-4">
              <div className="flex gap-3">
                <div className="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden shrink-0">
                  {selected.wine.imageUrl ? <img src={selected.wine.imageUrl} className="w-full h-full object-cover" alt={selected.wine.name} /> : <WineIcon className="w-6 h-6 m-3 text-gray-300" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-gray-900 truncate">{selected.wine.name}</p>
                  <p className="text-xs text-gray-500 truncate">{selected.wine.producer} · {selected.wine.year}</p>
                  <p className="text-[11px] text-emerald-700 font-bold mt-0.5">{formatSlot(location.layout, selected.approximate ? { column: selected.column, shelf: selected.shelf } : selected, location.kind)}</p>
                </div>
                <button onClick={() => setSelected(null)} className="text-gray-400 self-start">✕</button>
              </div>
              <div className="flex gap-2 mt-3">
                <button onClick={() => onOpenWine(selected.wine)} className="flex-1 py-2 text-xs font-bold rounded-lg bg-gray-100 hover:bg-gray-200">Apri scheda</button>
                <button onClick={() => { setPlacingId(selected.wine.id); setSelected(null); }} className="flex-1 py-2 text-xs font-bold rounded-lg bg-wine-700 text-white hover:bg-wine-800">Sposta</button>
              </div>
            </div>
          )}
        </div>

        {/* Pannello laterale */}
        <aside className="shrink-0 lg:w-96 max-h-[45%] lg:max-h-none overflow-y-auto bg-white border-t lg:border-t-0 lg:border-l border-gray-200 p-4 space-y-5">
          {placing ? (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
              <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-100">
                <p className="text-[10px] font-black uppercase tracking-widest text-emerald-700">Stai posizionando</p>
                <p className="font-bold text-gray-900 mt-1">{placing.name}</p>
                <p className="text-xs text-gray-500">{placing.producer} · {placing.year}</p>
                <div className="mt-3 h-2 rounded-full bg-white overflow-hidden">
                  <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${Math.min(100, (placingPlaced / Math.max(1, placing.quantity)) * 100)}%` }} />
                </div>
                <p className="text-xs text-emerald-800 mt-1"><b>{placingPlaced}</b> di {placing.quantity} bottiglie posizionate</p>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-500 mb-1.5">Precisione</p>
                <div className="flex p-1 bg-gray-100 rounded-xl">
                  <button onClick={() => setPlaceMode('slot')} className={`flex-1 py-2 text-xs font-bold rounded-lg ${placeMode === 'slot' ? 'bg-white shadow-sm text-wine-700' : 'text-gray-500'}`}>Posto esatto</button>
                  <button onClick={() => setPlaceMode('shelf')} className={`flex-1 py-2 text-xs font-bold rounded-lg ${placeMode === 'shelf' ? 'bg-white shadow-sm text-wine-700' : 'text-gray-500'}`}>Solo ripiano</button>
                </div>
                <p className="text-[11px] text-gray-400 mt-1.5 leading-snug">
                  {placeMode === 'slot' ? 'Tocca un posto libero (cerchio verde) per mettere lì la bottiglia.' : 'Tocca un ripiano: la bottiglia sarà assegnata al ripiano, senza posto preciso.'} Tocca una bottiglia evidenziata per toglierla.
                </p>
              </div>
              <button onClick={() => setPlacingId(null)} className="w-full py-3 rounded-xl bg-wine-700 text-white font-bold hover:bg-wine-800">Fine</button>
            </div>
          ) : (
            <>
              <div>
                <h3 className="font-serif font-bold text-gray-900 mb-2">Da posizionare</h3>
                {unplaced.length === 0 ? (
                  <p className="text-xs text-gray-400">Tutte le bottiglie di questa posizione hanno un posto.</p>
                ) : (
                  <div className="space-y-1.5">
                    {unplaced.map(w => (
                      <div key={w.id} className="flex items-center gap-2 p-2 rounded-xl bg-amber-50/60 border border-amber-100">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: WINE_CATEGORY_COLORS[classifyWineType(w.type)] }} />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold text-gray-900 truncate">{w.name}</p>
                          <p className="text-[11px] text-gray-500">{placedCount(w, location!)} / {w.quantity} posizionate</p>
                        </div>
                        <button onClick={() => setPlacingId(w.id)} className="text-xs font-bold px-2.5 py-1.5 rounded-lg bg-wine-700 text-white hover:bg-wine-800">Posiziona</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <h3 className="font-serif font-bold text-gray-900 mb-2">In questa posizione</h3>
                <div className="space-y-1">
                  {placedWines.map(w => (
                    <button key={w.id} onClick={() => selectFromList(w)} className="w-full flex items-center gap-2 p-2 rounded-xl hover:bg-gray-50 text-left">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: WINE_CATEGORY_COLORS[classifyWineType(w.type)] }} />
                      <span className="text-sm text-gray-800 truncate flex-1">{w.name}</span>
                      <span className="text-[11px] text-gray-400">{placedCount(w, location!)} bt</span>
                    </button>
                  ))}
                  {placedWines.length === 0 && <p className="text-xs text-gray-400">Nessuna bottiglia posizionata.</p>}
                </div>
              </div>
              <div className="flex flex-wrap gap-x-3 gap-y-1 pt-2 border-t border-gray-100">
                {Object.entries(WINE_CATEGORY_LABELS).filter(([k]) => k !== 'other').map(([k, label]) => (
                  <span key={k} className="flex items-center gap-1 text-[11px] text-gray-500"><span className="w-2 h-2 rounded-full" style={{ background: WINE_CATEGORY_COLORS[k] }} />{label}</span>
                ))}
                <span className="text-[11px] text-gray-400">· semitrasparente = solo ripiano</span>
              </div>
            </>
          )}
        </aside>
      </div>
    </div>
  );

  return createPortal(content, document.body);
};

export default Cellar3DModal;
