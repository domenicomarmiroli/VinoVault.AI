
import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { CellarReport, Wine, HistoryEntry } from '../types';
import { ReportIcon, ShoppingCartIcon, ClockIcon, UserIcon, StarIcon, WineIcon } from './Icons';
import { AnimatedNumber } from './DashboardWidgets';

interface CellarReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: CellarReport | null;
  loading: boolean;
  inventory: Wine[];
  history: HistoryEntry[];
}

const getScoreColor = (score: number) => {
  if (score >= 85) return '#34d399';
  if (score >= 65) return '#f0abfc';
  if (score >= 40) return '#fbbf24';
  return '#f87171';
};

const ScoreGauge: React.FC<{ score: number; mounted: boolean }> = ({ score, mounted }) => {
  const s = Math.max(0, Math.min(100, score || 0));
  const circumference = 2 * Math.PI * 40;
  const offset = circumference - ((mounted ? s : 0) / 100) * circumference;
  return (
    <div className="relative w-32 h-32 shrink-0">
      <div className="absolute inset-2 rounded-full blur-xl opacity-40" style={{ background: getScoreColor(s) }} />
      <svg viewBox="0 0 100 100" className="relative w-full h-full -rotate-90">
        <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,.15)" strokeWidth="9" />
        <circle
          cx="50" cy="50" r="40" fill="none" stroke={getScoreColor(s)} strokeWidth="9" strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1.6s cubic-bezier(.4,0,.2,1)' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-black text-white leading-none tabular-nums"><AnimatedNumber value={s} duration={1600} /></span>
        <span className="text-[9px] font-bold uppercase tracking-widest text-white/70 mt-1">Salute</span>
      </div>
    </div>
  );
};

const BREAKDOWN_LABELS: Record<string, string> = {
  variety: 'Varietà', quality: 'Qualità', balance: 'Equilibrio', readiness: 'Maturità', value: 'Rapporto qualità/prezzo',
};

const LOADING_MESSAGES = [
  'Il Sommelier sta stappando la tua cantina...',
  'Confronto i voti dello storico con le bottiglie in cantina...',
  'Controllo le finestre di beva...',
  'Cerco le lacune nel tuo profilo...',
  'Scelgo i consigli d\'acquisto su misura...',
];

const Section: React.FC<{ delay: number; className?: string; children: React.ReactNode }> = ({ delay, className = '', children }) => (
  <div className={`animate-in fade-in slide-in-from-bottom-4 duration-700 ${className}`} style={{ animationDelay: `${delay}ms` }}>{children}</div>
);

const parseDrinkWindowEnd = (drinkWindow?: string) => {
  const years = (drinkWindow || '').match(/\d{4}/g);
  return years ? Number(years[years.length - 1]) : null;
};

const CellarReportModal: React.FC<CellarReportModalProps> = ({ isOpen, onClose, report, loading, inventory, history }) => {
  const [msgIndex, setMsgIndex] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (!isOpen || loading || !report) { setMounted(false); return; }
    const id = setTimeout(() => setMounted(true), 150);
    return () => clearTimeout(id);
  }, [isOpen, loading, report]);

  useEffect(() => {
    if (!loading) return;
    const id = setInterval(() => setMsgIndex(i => (i + 1) % LOADING_MESSAGES.length), 2200);
    return () => clearInterval(id);
  }, [loading]);

  const avgRating = useMemo(() => {
    const rated = history.filter(h => (h.rating || 0) > 0);
    return rated.length ? rated.reduce((sum, h) => sum + (h.rating || 0), 0) / rated.length : 0;
  }, [history]);

  const topRated = useMemo(() => [...history].filter(h => (h.rating || 0) >= 4).sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 4), [history]);

  const drinkNow = useMemo(() => {
    if (report?.drinkNowPicks?.length) return report.drinkNowPicks;
    const currentYear = new Date().getFullYear();
    return inventory
      .filter(w => { const end = parseDrinkWindowEnd(w.drinkWindow); return end !== null && currentYear >= end - 1; })
      .slice(0, 4)
      .map(w => w.name);
  }, [inventory, report]);

  const bottles = inventory.reduce((s, w) => s + Math.max(0, w.quantity || 0), 0);

  if (!isOpen) return null;

  const content = (
    <div className="fixed inset-0 bg-black/70 z-[200] flex items-center justify-center p-0 md:p-6 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
      <div className="bg-stone-50 w-full h-[100dvh] md:h-auto md:max-h-[92vh] md:max-w-5xl md:rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="relative overflow-hidden bg-gradient-to-br from-wine-950 via-wine-800 to-indigo-900 p-6 md:p-8 text-white shrink-0">
          <div className="absolute -right-20 -top-20 w-72 h-72 rounded-full bg-fuchsia-400/20 blur-3xl animate-pulse" />
          <div className="absolute -left-16 -bottom-24 w-64 h-64 rounded-full bg-cyan-400/15 blur-3xl" />
          <div className="relative flex justify-between items-start gap-4">
            <div>
              <h2 className="text-xl md:text-2xl font-serif font-bold flex items-center gap-2"><ReportIcon className="w-6 h-6" filled /> Analisi Sommelier</h2>
              <p className="text-white/60 text-xs mt-1">Report personale su cantina, consumi e gusti.</p>
            </div>
            <button onClick={onClose} aria-label="Chiudi" className="text-white/70 hover:text-white hover:bg-white/10 rounded-full w-9 h-9 flex items-center justify-center transition-colors">✕</button>
          </div>

          {!loading && report && (
            <div className="relative flex flex-col md:flex-row md:items-center gap-5 mt-5">
              <div className="flex items-center gap-5">
                <ScoreGauge score={report.score} mounted={mounted} />
                {report.headline && (
                  <p className="md:hidden font-serif text-lg italic leading-snug">“{report.headline}”</p>
                )}
              </div>
              <div className="flex-1 min-w-0 space-y-4">
                {report.headline && <p className="hidden md:block font-serif text-2xl italic leading-snug animate-in fade-in slide-in-from-bottom-4 duration-700">“{report.headline}”</p>}
                <div className="grid grid-cols-3 gap-2 md:max-w-md">
                  {[
                    { label: 'Bottiglie', value: bottles, decimals: 0 },
                    { label: 'Bevute', value: history.length, decimals: 0 },
                    { label: 'Voto medio', value: avgRating, decimals: 1 },
                  ].map((s, i) => (
                    <div key={s.label} className="bg-white/10 backdrop-blur rounded-2xl p-2.5 text-center border border-white/10 animate-in fade-in zoom-in-95 duration-500" style={{ animationDelay: `${200 + i * 100}ms` }}>
                      <span className="block text-xl font-black tabular-nums"><AnimatedNumber value={s.value} decimals={s.decimals} /></span>
                      <span className="text-[9px] uppercase font-bold text-white/60 tracking-wide">{s.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 px-6 space-y-6">
              <div className="relative w-20 h-20">
                <div className="absolute inset-0 rounded-full border-4 border-wine-100" />
                <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-wine-600 border-r-wine-400 animate-spin" />
                <WineIcon className="absolute inset-0 m-auto w-8 h-8 text-wine-600 animate-pulse" filled />
              </div>
              <p key={msgIndex} className="text-wine-800 text-sm font-medium text-center animate-in fade-in slide-in-from-bottom-4 duration-500">{LOADING_MESSAGES[msgIndex]}</p>
            </div>
          ) : report ? (
            <div className="p-4 md:p-6 grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-5">

              <Section delay={100} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 lg:col-span-2">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                  <div className="md:col-span-3">
                    <h3 className="font-serif font-bold text-gray-900 mb-2 text-lg border-l-4 border-wine-600 pl-3">Valutazione Generale</h3>
                    <p className="text-gray-600 text-sm leading-relaxed">{report.overallAssessment || 'In valutazione...'}</p>
                    {(report.strengths?.length || 0) > 0 && (
                      <ul className="mt-3 space-y-1.5">
                        {report.strengths!.map((s, i) => (
                          <li key={i} className="text-sm text-gray-700 flex gap-2"><span className="text-emerald-500 font-bold">✓</span>{s}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                  {report.scoreBreakdown && (
                    <div className="md:col-span-2 space-y-2.5">
                      {Object.entries(BREAKDOWN_LABELS).map(([key, label], i) => {
                        const v = Math.max(0, Math.min(100, Number((report.scoreBreakdown as any)[key]) || 0));
                        return (
                          <div key={key}>
                            <div className="flex justify-between text-xs mb-1"><span className="font-bold text-gray-600">{label}</span><span className="font-black text-gray-900 tabular-nums">{Math.round(v)}</span></div>
                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full rounded-full transition-all ease-out" style={{ width: mounted ? `${v}%` : '0%', background: `linear-gradient(90deg, #701a45, ${getScoreColor(v)})`, transitionDuration: '1100ms', transitionDelay: `${300 + i * 120}ms` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </Section>

              <Section delay={200} className="bg-gradient-to-br from-purple-50 to-fuchsia-50 p-5 rounded-2xl border border-purple-100">
                <h3 className="font-bold text-purple-900 mb-3 flex items-center gap-2 text-sm uppercase tracking-wide"><UserIcon className="w-4 h-4" filled /> Il Tuo Profilo</h3>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {report.palateTags?.map((tag, i) => (
                    <span key={i} className="text-xs font-bold text-purple-800 bg-white px-2.5 py-1 rounded-full border border-purple-200 shadow-sm animate-in fade-in zoom-in-95 duration-300" style={{ animationDelay: `${300 + i * 70}ms` }}>{tag}</span>
                  ))}
                </div>
                <p className="text-purple-900/80 text-sm leading-relaxed">{report.palateProfile || 'Analisi in corso...'}</p>
              </Section>

              <Section delay={250} className="bg-gradient-to-br from-orange-50 to-amber-50 p-5 rounded-2xl border border-orange-100">
                <h3 className="font-bold text-orange-900 mb-3 text-sm uppercase tracking-wide">Cosa Manca</h3>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {report.gapTags?.map((tag, i) => (
                    <span key={i} className="text-xs font-bold text-orange-800 bg-white px-2.5 py-1 rounded-full border border-orange-200 shadow-sm animate-in fade-in zoom-in-95 duration-300" style={{ animationDelay: `${350 + i * 70}ms` }}>{tag}</span>
                  ))}
                </div>
                <p className="text-orange-900/80 text-sm leading-relaxed">{report.gapAnalysis || 'In analisi...'}</p>
              </Section>

              <Section delay={300} className="lg:col-span-2">
                <h3 className="font-serif font-bold text-gray-900 text-lg mb-3 pl-1">Consigli per gli Acquisti</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {report.buyRecommendations?.length ? report.buyRecommendations.map((rec, idx) => (
                    <div key={idx} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex gap-3 hover:shadow-md hover:-translate-y-0.5 transition-all animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: `${400 + idx * 90}ms` }}>
                      <div className="bg-gradient-to-br from-wine-600 to-wine-800 w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-white shadow-sm"><ShoppingCartIcon className="w-5 h-5" /></div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-gray-900 text-sm leading-tight">{rec.wineName}</h4>
                        <div className="flex flex-wrap gap-1.5 mt-1 mb-1.5">
                          {rec.type && <span className="text-[10px] uppercase font-bold text-gray-500 bg-gray-50 px-1.5 py-0.5 rounded">{rec.type}</span>}
                          {rec.priceRange && <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">{rec.priceRange}</span>}
                        </div>
                        <p className="text-gray-600 text-xs leading-relaxed">{rec.reason}</p>
                      </div>
                    </div>
                  )) : <p className="text-xs text-gray-400 italic">Nessun consiglio specifico.</p>}
                </div>
              </Section>

              {topRated.length > 0 && (
                <Section delay={350} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                  <h3 className="font-serif font-bold text-gray-900 text-lg mb-3">I Tuoi Preferiti</h3>
                  <div className="space-y-2">
                    {topRated.map((h, idx) => (
                      <div key={idx} className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 transition-colors">
                        <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden shrink-0 border border-gray-100">
                          {h.imageUrl ? <img src={h.imageUrl} alt={h.name} className="w-full h-full object-cover" /> : <WineIcon className="w-5 h-5 m-2.5 text-gray-300" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-gray-900 text-sm truncate">{h.name}</p>
                          <p className="text-xs text-gray-500 truncate">{h.producer} · {h.year}</p>
                        </div>
                        <div className="flex items-center gap-0.5 shrink-0">
                          {[1, 2, 3, 4, 5].map(i => (
                            <StarIcon key={i} className={`w-3.5 h-3.5 ${i <= (h.rating || 0) ? 'text-amber-400' : 'text-gray-200'}`} filled={i <= (h.rating || 0)} />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </Section>
              )}

              <Section delay={400} className={`bg-gradient-to-br from-emerald-50 to-teal-50 p-5 rounded-2xl border border-emerald-100 ${topRated.length === 0 ? 'lg:col-span-2' : ''}`}>
                <h3 className="font-bold text-emerald-900 mb-2 flex items-center gap-2 text-sm uppercase tracking-wide"><ClockIcon className="w-4 h-4" filled /> Strategia di Consumo</h3>
                <p className="text-emerald-900/80 text-sm leading-relaxed mb-3">{report.drinkNowStrategy || 'Goditi un calice della tua collezione.'}</p>
                {drinkNow.length > 0 && (
                  <>
                    <p className="text-[10px] font-black uppercase tracking-widest text-emerald-700 mb-1.5">Da aprire per primi</p>
                    <div className="flex flex-wrap gap-1.5">
                      {drinkNow.map((name, i) => (
                        <span key={i} className="text-xs font-bold text-emerald-800 bg-white px-2.5 py-1 rounded-full border border-emerald-200 shadow-sm">{name}</span>
                      ))}
                    </div>
                  </>
                )}
              </Section>
            </div>
          ) : (
            <div className="p-8 text-center text-gray-500">Nessun report disponibile.</div>
          )}
        </div>

        <div className="p-4 bg-white border-t border-gray-100 shrink-0 md:hidden">
          <button onClick={onClose} className="w-full py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors">Chiudi Report</button>
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
};

export default CellarReportModal;
