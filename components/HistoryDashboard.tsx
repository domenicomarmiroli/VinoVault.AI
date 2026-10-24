import React, { useEffect, useMemo, useState } from 'react';
import { HistoryEntry, Wine, CellarValueHistory } from '../types';
import { getCellarValueHistory, revalueCellar } from '../services/cellarValueService';
import { classifyWineType } from '../services/wineTypeClassifier';

interface HistoryDashboardProps {
  history: HistoryEntry[];
  wines: Wine[];
  onWinesRevalued: (updates: { id: string; marketPrice: number }[]) => void;
  onAiUsed: () => void;
}

const MONTHS_IT = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'];

const useCountUp = (target: number, duration = 1200) => {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(target * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return value;
};

const StatTile: React.FC<{ label: string; value: number; prefix?: string; suffix?: string; decimals?: number; accent: string; delay: number }> = ({ label, value, prefix = '', suffix = '', decimals = 0, accent, delay }) => {
  const animated = useCountUp(value);
  return (
    <div
      className="relative overflow-hidden bg-white rounded-2xl border border-gray-100 shadow-sm p-4 animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both hover:shadow-md hover:-translate-y-0.5 transition-all"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className={`absolute -right-6 -top-6 w-20 h-20 rounded-full opacity-15 ${accent}`} />
      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{label}</p>
      <p className="text-2xl md:text-3xl font-black text-gray-900 mt-1 tabular-nums">
        {prefix}{animated.toLocaleString('it-IT', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}{suffix}
      </p>
    </div>
  );
};

const HistoryDashboard: React.FC<HistoryDashboardProps> = ({ history, wines, onWinesRevalued, onAiUsed }) => {
  const [mounted, setMounted] = useState(false);
  const [valueHistory, setValueHistory] = useState<CellarValueHistory | null>(null);
  const [revaluing, setRevaluing] = useState(false);
  const [revalueMessage, setRevalueMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [hoverMonth, setHoverMonth] = useState<number | null>(null);
  const [hoverPoint, setHoverPoint] = useState<number | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);
    getCellarValueHistory().then(setValueHistory).catch(() => setValueHistory({ snapshots: [], lastRevaluationAt: null, nextAvailableAt: null, canRevalue: true }));
    return () => clearTimeout(t);
  }, []);

  const months = useMemo(() => {
    const now = new Date();
    const buckets = Array.from({ length: 12 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
      return { key: `${d.getFullYear()}-${d.getMonth()}`, label: MONTHS_IT[d.getMonth()], year: d.getFullYear(), count: 0, cost: 0 };
    });
    history.forEach(h => {
      const d = new Date(h.consumedDate);
      if (isNaN(d.getTime())) return;
      const b = buckets.find(x => x.key === `${d.getFullYear()}-${d.getMonth()}`);
      if (b) { b.count += 1; b.cost += Number(h.price) || 0; }
    });
    return buckets;
  }, [history]);

  const stats = useMemo(() => {
    const totalSpent = history.reduce((s, h) => s + (Number(h.price) || 0), 0);
    const rated = history.filter(h => Number(h.rating) > 0);
    const avgRating = rated.length ? rated.reduce((s, h) => s + Number(h.rating), 0) / rated.length : 0;
    const cellarValue = wines.filter(w => w.quantity > 0).reduce((s, w) => s + (Number(w.marketPrice) || Number(w.price) || 0) * Number(w.quantity || 0), 0);
    const cellarCost = wines.filter(w => w.quantity > 0).reduce((s, w) => s + (Number(w.price) || 0) * Number(w.quantity || 0), 0);

    const producerCounts: Record<string, number> = {};
    history.forEach(h => { if (h.producer) producerCounts[h.producer] = (producerCounts[h.producer] || 0) + 1; });
    const topProducer = Object.entries(producerCounts).sort((a, b) => b[1] - a[1])[0];

    const best = [...rated].sort((a, b) => Number(b.rating) - Number(a.rating))[0];
    const priciest = [...history].sort((a, b) => (Number(b.price) || 0) - (Number(a.price) || 0))[0];

    const typeSplit = { red: 0, white: 0, rose: 0, sparkling: 0, dessert: 0, other: 0 } as Record<string, number>;
    history.forEach(h => { typeSplit[classifyWineType(h.type)] += 1; });

    const busiest = [...months].sort((a, b) => b.count - a.count)[0];

    return { totalSpent, avgRating, cellarValue, cellarCost, topProducer, best, priciest, typeSplit, busiest };
  }, [history, wines, months]);

  const handleRevalue = async () => {
    setRevaluing(true);
    setRevalueMessage(null);
    try {
      const result = await revalueCellar();
      onWinesRevalued(result.wines);
      onAiUsed();
      const fresh = await getCellarValueHistory();
      setValueHistory(fresh);
      setRevalueMessage({ type: 'ok', text: `Valore aggiornato: €${result.totalValue.toLocaleString('it-IT', { maximumFractionDigits: 0 })}` });
    } catch (e: any) {
      setRevalueMessage({ type: 'err', text: e.message });
    } finally {
      setRevaluing(false);
    }
  };

  const maxCount = Math.max(1, ...months.map(m => m.count));
  const maxCost = Math.max(1, ...months.map(m => m.cost));

  // Grafico valore cantina: snapshot reali + punto "oggi" calcolato dai prezzi attuali
  const valuePoints = useMemo(() => {
    const pts = (valueHistory?.snapshots || []).map(s => ({ date: new Date(s.date), value: s.totalValue }));
    if (pts.length === 0 || Math.abs(pts[pts.length - 1].value - stats.cellarValue) > 0.5) {
      pts.push({ date: new Date(), value: stats.cellarValue });
    }
    return pts;
  }, [valueHistory, stats.cellarValue]);

  const W = 600, H = 220, PAD = 28;
  const vMax = Math.max(1, ...valuePoints.map(p => p.value)) * 1.1;
  const vMin = Math.min(...valuePoints.map(p => p.value)) * 0.85;
  const xFor = (i: number) => valuePoints.length === 1 ? W / 2 : PAD + (i * (W - PAD * 2)) / (valuePoints.length - 1);
  const yFor = (v: number) => H - PAD - ((v - vMin) / Math.max(1, vMax - vMin)) * (H - PAD * 2);
  const linePath = valuePoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${xFor(i)} ${yFor(p.value)}`).join(' ');
  const areaPath = valuePoints.length > 1 ? `${linePath} L ${xFor(valuePoints.length - 1)} ${H - PAD} L ${xFor(0)} ${H - PAD} Z` : '';

  const nextDate = valueHistory?.nextAvailableAt ? new Date(valueHistory.nextAvailableAt) : null;
  const daysLeft = nextDate ? Math.max(0, Math.ceil((nextDate.getTime() - Date.now()) / 86400000)) : 0;
  const canRevalue = valueHistory ? valueHistory.canRevalue : true;

  const gain = stats.cellarValue - stats.cellarCost;
  const gainPct = stats.cellarCost > 0 ? (gain / stats.cellarCost) * 100 : 0;

  const typeColors: Record<string, string> = { red: '#991b1b', white: '#E8DCB0', rose: '#f472b6', sparkling: '#f59e0b', dessert: '#fb923c', other: '#cbd5e1' };
  const typeLabels: Record<string, string> = { red: 'Rossi', white: 'Bianchi', rose: 'Rosati', sparkling: 'Bollicine', dessert: 'Dolci', other: 'Altro' };
  const totalTyped = Object.values(stats.typeSplit).reduce((a, b) => a + b, 0) || 1;
  let donutOffset = 0;

  return (
    <div className="space-y-5">
      {/* Hero valore cantina */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-wine-900 via-wine-700 to-wine-500 text-white p-6 md:p-8 shadow-xl animate-in fade-in zoom-in-95 duration-700">
        <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-white/10 blur-2xl animate-pulse" />
        <div className="absolute -left-10 -bottom-20 w-56 h-56 rounded-full bg-cyan-400/20 blur-3xl" />
        <div className="relative flex flex-col md:flex-row md:items-end md:justify-between gap-5">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-white/70">Valore attuale della cantina</p>
            <HeroValue value={stats.cellarValue} />
            <p className={`text-sm font-bold mt-1 ${gain >= 0 ? 'text-emerald-300' : 'text-red-300'}`}>
              {gain >= 0 ? '▲' : '▼'} €{Math.abs(gain).toLocaleString('it-IT', { maximumFractionDigits: 0 })} ({gainPct >= 0 ? '+' : ''}{gainPct.toFixed(1)}%) rispetto al prezzo d'acquisto
            </p>
          </div>
          <div className="flex flex-col items-start md:items-end gap-2">
            <button
              onClick={handleRevalue}
              disabled={!canRevalue || revaluing}
              className="group relative px-5 py-3 rounded-2xl bg-white text-wine-800 font-black text-sm shadow-lg hover:shadow-2xl hover:scale-[1.03] active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center gap-2"
            >
              <svg className={`w-4 h-4 ${revaluing ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" /></svg>
              {revaluing ? 'Ricalcolo in corso...' : 'Ricalcola valore di mercato'}
            </button>
            <p className="text-[11px] text-white/70">
              {canRevalue ? 'Disponibile ora · utilizzabile 1 volta al mese' : `Prossimo ricalcolo tra ${daysLeft} giorni${nextDate ? ` (${nextDate.toLocaleDateString('it-IT')})` : ''}`}
            </p>
            {revalueMessage && (
              <p className={`text-xs font-bold px-3 py-1.5 rounded-lg animate-in fade-in slide-in-from-top-2 ${revalueMessage.type === 'ok' ? 'bg-emerald-500/20 text-emerald-100' : 'bg-red-500/20 text-red-100'}`}>{revalueMessage.text}</p>
            )}
          </div>
        </div>
      </div>

      {/* Stat tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatTile label="Bottiglie bevute" value={history.length} accent="bg-wine-500" delay={100} />
        <StatTile label="Spesa in bevute" value={stats.totalSpent} prefix="€" accent="bg-amber-500" delay={200} />
        <StatTile label="Voto medio" value={stats.avgRating} decimals={1} suffix=" ★" accent="bg-yellow-400" delay={300} />
        <StatTile label="Bottiglie in cantina" value={wines.reduce((s, w) => s + Math.max(0, w.quantity), 0)} accent="bg-cyan-500" delay={400} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Grafico bevute + costo */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="font-serif font-bold text-lg text-gray-900">Bevute nel tempo</h3>
              <p className="text-xs text-gray-400">Ultimi 12 mesi · bottiglie e spesa</p>
            </div>
            <div className="flex gap-3 text-[10px] font-bold uppercase text-gray-500">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-wine-600" /> Bottiglie</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> Spesa</span>
            </div>
          </div>
          <div className="relative h-52 flex items-end gap-1.5">
            {months.map((m, i) => (
              <div
                key={m.key}
                className="flex-1 h-full flex flex-col justify-end items-center relative cursor-pointer"
                onMouseEnter={() => setHoverMonth(i)}
                onMouseLeave={() => setHoverMonth(null)}
                onClick={() => setHoverMonth(hoverMonth === i ? null : i)}
              >
                {hoverMonth === i && (
                  <div className="absolute bottom-full mb-2 z-10 bg-gray-900 text-white text-[11px] rounded-lg px-2.5 py-1.5 whitespace-nowrap shadow-xl animate-in fade-in zoom-in-95 duration-150">
                    <p className="font-bold">{m.label} {m.year}</p>
                    <p>{m.count} bottiglie · €{m.cost.toFixed(0)}</p>
                  </div>
                )}
                <div className="w-full flex items-end justify-center gap-0.5 h-full">
                  <div
                    className={`w-1/2 rounded-t-md bg-gradient-to-t from-wine-700 to-wine-400 transition-all ease-out ${hoverMonth === i ? 'brightness-125' : ''}`}
                    style={{ height: mounted ? `${(m.count / maxCount) * 100}%` : '0%', transitionDuration: '900ms', transitionDelay: `${i * 50}ms`, minHeight: m.count ? 4 : 0 }}
                  />
                  <div
                    className="w-1/3 rounded-t-md bg-gradient-to-t from-amber-500 to-amber-300 transition-all ease-out"
                    style={{ height: mounted ? `${(m.cost / maxCost) * 100}%` : '0%', transitionDuration: '900ms', transitionDelay: `${i * 50 + 120}ms`, minHeight: m.cost ? 4 : 0 }}
                  />
                </div>
                <span className={`text-[9px] mt-1.5 font-bold ${hoverMonth === i ? 'text-wine-700' : 'text-gray-400'}`}>{m.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Grafico valore nel tempo */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 animate-in fade-in slide-in-from-bottom-4 duration-700" style={{ animationDelay: '150ms' }}>
          <div className="mb-4">
            <h3 className="font-serif font-bold text-lg text-gray-900">Valore della cantina nel tempo</h3>
            <p className="text-xs text-gray-400">Ogni ricalcolo aggiunge un punto al grafico</p>
          </div>
          <div className="relative">
            <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-52 overflow-visible">
              <defs>
                <linearGradient id="valueArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#933d76" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#933d76" stopOpacity="0" />
                </linearGradient>
                <linearGradient id="valueLine" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#701a45" />
                  <stop offset="100%" stopColor="#22d3ee" />
                </linearGradient>
              </defs>
              {[0, 1, 2, 3].map(i => (
                <line key={i} x1={PAD} x2={W - PAD} y1={PAD + (i * (H - PAD * 2)) / 3} y2={PAD + (i * (H - PAD * 2)) / 3} stroke="#f1f5f9" strokeDasharray="4 4" />
              ))}
              {areaPath && <path d={areaPath} fill="url(#valueArea)" className="transition-opacity duration-1000" style={{ opacity: mounted ? 1 : 0 }} />}
              {valuePoints.length > 1 && (
                <path
                  d={linePath} fill="none" stroke="url(#valueLine)" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"
                  pathLength={1}
                  style={{ strokeDasharray: 1, strokeDashoffset: mounted ? 0 : 1, transition: 'stroke-dashoffset 1.6s cubic-bezier(.4,0,.2,1)' }}
                />
              )}
              {valuePoints.map((p, i) => (
                <g key={i} onMouseEnter={() => setHoverPoint(i)} onMouseLeave={() => setHoverPoint(null)} className="cursor-pointer">
                  <circle cx={xFor(i)} cy={yFor(p.value)} r={14} fill="transparent" />
                  <circle
                    cx={xFor(i)} cy={yFor(p.value)} r={hoverPoint === i ? 7 : 5}
                    fill="white" stroke="#701a45" strokeWidth="3"
                    className="transition-all duration-200"
                    style={{ opacity: mounted ? 1 : 0, transition: `opacity 400ms ${800 + i * 120}ms, r 200ms` }}
                  />
                  {hoverPoint === i && (
                    <g>
                      <rect x={xFor(i) - 60} y={yFor(p.value) - 48} width="120" height="34" rx="8" fill="#111827" />
                      <text x={xFor(i)} y={yFor(p.value) - 34} textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">€{p.value.toLocaleString('it-IT', { maximumFractionDigits: 0 })}</text>
                      <text x={xFor(i)} y={yFor(p.value) - 20} textAnchor="middle" fill="#9ca3af" fontSize="10">{p.date.toLocaleDateString('it-IT')}</text>
                    </g>
                  )}
                </g>
              ))}
            </svg>
            {(valueHistory?.snapshots.length || 0) === 0 && (
              <p className="text-center text-xs text-gray-400 mt-2">Premi "Ricalcola valore di mercato" per registrare il primo punto e iniziare a tracciare l'andamento.</p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* Donut tipologie bevute */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 animate-in fade-in slide-in-from-bottom-4 duration-700" style={{ animationDelay: '200ms' }}>
          <h3 className="font-serif font-bold text-lg text-gray-900 mb-3">Cosa bevi</h3>
          <div className="flex items-center gap-5">
            <svg viewBox="0 0 42 42" className="w-28 h-28 -rotate-90 shrink-0">
              <circle cx="21" cy="21" r="15.9" fill="none" stroke="#f1f5f9" strokeWidth="6" />
              {Object.entries(stats.typeSplit).filter(([, c]) => c > 0).map(([k, c]) => {
                const pct = (c / totalTyped) * 100;
                const el = (
                  <circle key={k} cx="21" cy="21" r="15.9" fill="none" stroke={typeColors[k]} strokeWidth="6"
                    strokeDasharray={`${mounted ? pct : 0} ${100 - (mounted ? pct : 0)}`} strokeDashoffset={-donutOffset}
                    style={{ transition: 'stroke-dasharray 1.2s ease-out' }} />
                );
                donutOffset += pct;
                return el;
              })}
            </svg>
            <div className="space-y-1.5 text-sm">
              {Object.entries(stats.typeSplit).filter(([, c]) => c > 0).map(([k, c]) => (
                <div key={k} className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full border border-black/5" style={{ background: typeColors[k] }} />
                  <span className="text-gray-600">{typeLabels[k]}</span>
                  <span className="font-bold text-gray-900">{Math.round((c / totalTyped) * 100)}%</span>
                </div>
              ))}
              {history.length === 0 && <p className="text-xs text-gray-400">Nessuna bevuta registrata.</p>}
            </div>
          </div>
        </div>

        {/* Highlights */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-700" style={{ animationDelay: '300ms' }}>
          <h3 className="font-serif font-bold text-lg text-gray-900">I tuoi record</h3>
          <Highlight icon="🏆" label="Miglior voto" value={stats.best ? `${stats.best.name} · ${'★'.repeat(Number(stats.best.rating))}` : '—'} />
          <Highlight icon="💎" label="Bottiglia più preziosa bevuta" value={stats.priciest && Number(stats.priciest.price) > 0 ? `${stats.priciest.name} · €${Number(stats.priciest.price).toFixed(0)}` : '—'} />
          <Highlight icon="🍇" label="Produttore preferito" value={stats.topProducer ? `${stats.topProducer[0]} · ${stats.topProducer[1]} bottiglie` : '—'} />
          <Highlight icon="📅" label="Mese più attivo" value={stats.busiest && stats.busiest.count > 0 ? `${stats.busiest.label} ${stats.busiest.year} · ${stats.busiest.count} bottiglie` : '—'} />
        </div>

        {/* Investimento */}
        <div className="bg-gradient-to-br from-indigo-50 to-cyan-50 rounded-3xl border border-indigo-100 shadow-sm p-5 animate-in fade-in slide-in-from-bottom-4 duration-700 md:col-span-2 lg:col-span-1" style={{ animationDelay: '400ms' }}>
          <h3 className="font-serif font-bold text-lg text-indigo-950 mb-3">Investimento</h3>
          <div className="space-y-3">
            <Bar label="Pagato" value={stats.cellarCost} max={Math.max(stats.cellarCost, stats.cellarValue)} color="from-slate-400 to-slate-300" mounted={mounted} />
            <Bar label="Valore di mercato" value={stats.cellarValue} max={Math.max(stats.cellarCost, stats.cellarValue)} color="from-indigo-600 to-cyan-400" mounted={mounted} />
          </div>
          <p className="text-xs text-indigo-800/70 mt-4 leading-relaxed">
            {gain >= 0 ? 'La tua cantina vale più di quanto l\'hai pagata: ottime scelte!' : 'Il valore stimato è sotto il prezzo pagato: ricalcola per aggiornare le stime.'}
          </p>
        </div>
      </div>
    </div>
  );
};

const HeroValue: React.FC<{ value: number }> = ({ value }) => {
  const v = useCountUp(value, 1600);
  return <p className="text-5xl md:text-6xl font-black tracking-tight mt-1 tabular-nums">€{v.toLocaleString('it-IT', { maximumFractionDigits: 0 })}</p>;
};

const Highlight: React.FC<{ icon: string; label: string; value: string }> = ({ icon, label, value }) => (
  <div className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition-colors">
    <span className="text-xl leading-none">{icon}</span>
    <div className="min-w-0">
      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{label}</p>
      <p className="text-sm font-bold text-gray-800 truncate">{value}</p>
    </div>
  </div>
);

const Bar: React.FC<{ label: string; value: number; max: number; color: string; mounted: boolean }> = ({ label, value, max, color, mounted }) => (
  <div>
    <div className="flex justify-between text-xs font-bold text-indigo-900 mb-1">
      <span>{label}</span><span>€{value.toLocaleString('it-IT', { maximumFractionDigits: 0 })}</span>
    </div>
    <div className="h-3 bg-white rounded-full overflow-hidden">
      <div className={`h-full rounded-full bg-gradient-to-r ${color} transition-all duration-1000 ease-out`} style={{ width: mounted && max > 0 ? `${(value / max) * 100}%` : '0%' }} />
    </div>
  </div>
);

export default HistoryDashboard;
