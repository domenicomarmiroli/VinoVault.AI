
import React, { useState, useEffect, useMemo } from 'react';
import { Wine, HistoryEntry, CellarReport } from '../types';
import { ChartBarIcon, LogoutIcon, WineIcon, ReportIcon } from '../components/Icons';
import CellarReportModal from '../components/CellarReportModal';
import { generateCellarReport, getSavedCellarReport } from '../services/geminiService';
import { useLanguage } from '../contexts/LanguageContext';
import { useAnalysisStyle } from '../contexts/AnalysisStyleContext';
import { classifyWineType } from '../services/wineTypeClassifier';
import { AnimatedNumber, StatTile, Card, Donut, useMounted } from '../components/DashboardWidgets';
import { UpgradeButton } from '../components/UpgradePanel';

const REPORT_COOLDOWN_BOTTLES = 10;

interface AnalyticsViewProps {
  inventory: Wine[];
  history: HistoryEntry[];
  onLogout: () => void;
  isPremium: boolean;
  onAiUsed: () => void;
}

type DrinkStatus = 'wait' | 'ready' | 'past' | 'unknown';

const getDrinkStatus = (drinkWindow?: string): DrinkStatus => {
  const years = (drinkWindow || '').match(/\d{4}/g);
  if (!years || years.length === 0) return 'unknown';
  const start = Number(years[0]);
  const end = Number(years[years.length - 1]);
  const now = new Date().getFullYear();
  if (now < start) return 'wait';
  if (now > end) return 'past';
  return 'ready';
};

const DRINK_META: Record<DrinkStatus, { label: string; color: string; text: string }> = {
  wait: { label: 'Da attendere', color: 'bg-sky-400', text: 'text-sky-700' },
  ready: { label: 'Pronti da bere', color: 'bg-emerald-500', text: 'text-emerald-700' },
  past: { label: 'Oltre il picco', color: 'bg-amber-500', text: 'text-amber-700' },
  unknown: { label: 'Non indicata', color: 'bg-gray-300', text: 'text-gray-500' },
};

const AnalyticsView: React.FC<AnalyticsViewProps> = ({ inventory, history, onLogout, isPremium, onAiUsed }) => {
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  const [cellarReport, setCellarReport] = useState<CellarReport | null>(null);
  const [savedHistoryCount, setSavedHistoryCount] = useState(0);
  const { t, language } = useLanguage();
  const { analysisStyle } = useAnalysisStyle();
  const mounted = useMounted();

  useEffect(() => {
      getSavedCellarReport().then(({ report, historyCount }) => {
          if (report) {
              setCellarReport(report);
              setSavedHistoryCount(historyCount);
          }
      });
  }, []);

  const safeInventory = useMemo(() => (Array.isArray(inventory) ? inventory : []).filter(w => Number(w.quantity) > 0), [inventory]);
  const safeHistory = Array.isArray(history) ? history : [];

  const data = useMemo(() => {
    const qty = (w: Wine) => Number(w.quantity || 0);
    const totalPurchaseCost = safeInventory.reduce((s, w) => s + Number(w.price || 0) * qty(w), 0);
    const totalMarketValue = safeInventory.reduce((s, w) => s + (Number(w.marketPrice) || Number(w.price) || 0) * qty(w), 0);
    const totalBottles = safeInventory.reduce((s, w) => s + qty(w), 0);
    const roi = totalPurchaseCost > 0 ? ((totalMarketValue - totalPurchaseCost) / totalPurchaseCost) * 100 : 0;
    const avgPrice = totalBottles > 0 ? totalPurchaseCost / totalBottles : 0;

    const scored = safeInventory.filter(w => typeof w.qualityScore === 'number');
    const avgQuality = scored.length ? scored.reduce((s, w) => s + Number(w.qualityScore), 0) / scored.length : 0;

    const typeSplit: Record<string, number> = { red: 0, white: 0, rose: 0, sparkling: 0, dessert: 0, other: 0 };
    safeInventory.forEach(w => { typeSplit[classifyWineType(w.type)] += qty(w); });

    const drink: Record<DrinkStatus, number> = { wait: 0, ready: 0, past: 0, unknown: 0 };
    safeInventory.forEach(w => { drink[getDrinkStatus(w.drinkWindow)] += qty(w); });

    const qualityBuckets = [
      { label: '<70', min: 0, max: 69, count: 0 },
      { label: '70-79', min: 70, max: 79, count: 0 },
      { label: '80-89', min: 80, max: 89, count: 0 },
      { label: '90+', min: 90, max: 100, count: 0 },
    ];
    scored.forEach(w => {
      const b = qualityBuckets.find(x => Number(w.qualityScore) >= x.min && Number(w.qualityScore) <= x.max);
      if (b) b.count += qty(w);
    });

    const regionCounts: Record<string, number> = {};
    safeInventory.forEach(w => { const r = w.region || 'Sconosciuta'; regionCounts[r] = (regionCounts[r] || 0) + qty(w); });
    const regions = Object.entries(regionCounts).sort((a, b) => b[1] - a[1]).slice(0, 6);

    const mostValuable = [...safeInventory].sort((a, b) => (Number(b.marketPrice) || Number(b.price) || 0) - (Number(a.marketPrice) || Number(a.price) || 0)).slice(0, 5);

    const now = new Date().getFullYear();
    const drinkSoon = safeInventory
      .map(w => ({ w, end: Number(((w.drinkWindow || '').match(/\d{4}/g) || []).slice(-1)[0]) }))
      .filter(x => x.end && x.end <= now + 1)
      .sort((a, b) => a.end - b.end)
      .slice(0, 8);

    const consumedValue = safeHistory.reduce((s, h) => s + (Number(h.price) || 0), 0);

    return { totalPurchaseCost, totalMarketValue, totalBottles, roi, avgPrice, avgQuality, typeSplit, drink, qualityBuckets, regions, mostValuable, drinkSoon, consumedValue, labels: safeInventory.length };
  }, [safeInventory, safeHistory]);

  const bottlesSinceReport = safeHistory.length - savedHistoryCount;
  const canRegenerate = !cellarReport || bottlesSinceReport >= REPORT_COOLDOWN_BOTTLES;

  const handleOpenReport = async () => {
      if (!isPremium) { alert("Premium Only"); return; }
      if (cellarReport && !canRegenerate) { setIsReportOpen(true); return; }
      if (safeInventory.length < 3) { alert("Aggiungi più vini per permettere un'analisi accurata."); return; }

      setIsReportOpen(true);
      setReportLoading(true);
      try {
          const report = await generateCellarReport(safeInventory, safeHistory, language, analysisStyle);
          setCellarReport(report);
          setSavedHistoryCount(safeHistory.length);
          onAiUsed();
      } catch (err: any) {
          alert(`${t('error')}: ${err.message}`);
          setIsReportOpen(false);
      } finally {
          setReportLoading(false);
      }
  };

  const maxQuality = Math.max(1, ...data.qualityBuckets.map(b => b.count));
  const maxRegion = Math.max(1, ...data.regions.map(r => r[1]));
  const drinkTotal = Math.max(1, Object.values(data.drink).reduce((a, b) => a + b, 0));

  return (
    <div className="h-full flex flex-col bg-stone-50 overflow-hidden">
      <div className="bg-white border-b border-gray-200 p-6 shadow-sm z-10 flex justify-between items-start">
        <div>
            <h1 className="text-2xl font-serif font-bold text-gray-900 flex items-center gap-2"><ChartBarIcon className="w-8 h-8 text-wine-600" filled /> {t('nav_data')}</h1>
            <p className="text-sm text-gray-500 mt-1">{t('analytics_desc')}</p>
        </div>
        <button onClick={onLogout} className="text-gray-400 hover:text-wine-700 p-2"><LogoutIcon className="w-6 h-6" /></button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-8 pb-24 space-y-5">

        {/* Hero patrimonio + report AI */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-gray-900 via-indigo-950 to-wine-800 text-white p-6 md:p-8 shadow-xl animate-in fade-in zoom-in-95 duration-700">
          <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-cyan-400/15 blur-3xl animate-pulse" />
          <div className="absolute -left-10 -bottom-24 w-64 h-64 rounded-full bg-wine-500/30 blur-3xl" />
          <WineIcon className="absolute right-6 bottom-0 w-40 h-40 opacity-[0.06]" filled />
          <div className="relative flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-white/60">{t('cellar_equity')}</p>
              <p className="text-5xl md:text-6xl font-black tracking-tight mt-1 tabular-nums"><AnimatedNumber value={data.totalMarketValue} prefix="€" duration={1600} /></p>
              <div className="flex flex-wrap gap-x-6 gap-y-1 mt-2 text-sm">
                <span className={`font-bold ${data.roi >= 0 ? 'text-emerald-300' : 'text-red-300'}`}>{data.roi >= 0 ? '▲ +' : '▼ '}<AnimatedNumber value={data.roi} decimals={1} suffix="%" /> {t('roi')}</span>
                <span className="text-white/60">Pagato: €{data.totalPurchaseCost.toLocaleString('it-IT', { maximumFractionDigits: 0 })}</span>
              </div>
            </div>
            <div className="lg:max-w-sm bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
              <p className="font-bold flex items-center gap-2"><ReportIcon className="w-5 h-5" filled /> {t('ai_analysis')}</p>
              <p className="text-xs text-white/60 mt-1">Il sommelier AI studia la tua cantina e i tuoi gusti.</p>
              {isPremium ? (
                <>
                  <button onClick={handleOpenReport} className="mt-3 w-full py-2.5 rounded-xl bg-white text-indigo-950 font-black text-sm hover:scale-[1.02] active:scale-95 transition-transform shadow-lg">
                    {!cellarReport ? t('generate_report') : canRegenerate ? 'Aggiorna Report' : 'Vedi Report'}
                  </button>
                  {cellarReport && !canRegenerate && (
                    <p className="text-[11px] text-white/50 mt-2">Nuova analisi tra {REPORT_COOLDOWN_BOTTLES - bottlesSinceReport} bottiglie bevute.</p>
                  )}
                </>
              ) : (
                <UpgradeButton className="mt-3 w-full justify-center py-2.5 text-sm" />
              )}
            </div>
          </div>
        </div>

        {/* Contatori */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <StatTile label={t('bottles')} value={data.totalBottles} accent="bg-wine-500" delay={100} />
          <StatTile label={t('labels')} value={data.labels} accent="bg-indigo-500" delay={175} />
          <StatTile label={t('avg_price')} value={data.avgPrice} prefix="€" decimals={2} accent="bg-amber-500" delay={250} />
          <StatTile label="Qualità media" value={data.avgQuality} suffix="/100" accent="bg-emerald-500" delay={325} />
          <StatTile label="Pronti da bere" value={data.drink.ready} accent="bg-cyan-500" delay={400} hint={`su ${data.totalBottles} bottiglie`} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          <Card title={t('cellar_composition')} subtitle="Per tipologia, in bottiglie" delay={100}>
            <Donut data={data.typeSplit} mounted={mounted} size="w-32 h-32" />
          </Card>

          <Card title="Finestra di consumo" subtitle="Lo stato di maturazione delle tue bottiglie" delay={175}>
            <div className="flex h-4 rounded-full overflow-hidden bg-gray-100 mb-5">
              {(Object.keys(DRINK_META) as DrinkStatus[]).map((k, i) => (
                <div key={k} className={`${DRINK_META[k].color} transition-all ease-out`} style={{ width: mounted ? `${(data.drink[k] / drinkTotal) * 100}%` : '0%', transitionDuration: '1000ms', transitionDelay: `${i * 120}ms` }} />
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3">
              {(Object.keys(DRINK_META) as DrinkStatus[]).filter(k => k !== 'unknown' || data.drink.unknown > 0).map(k => (
                <div key={k} className="p-3 rounded-xl bg-gray-50">
                  <p className={`text-[10px] font-black uppercase tracking-widest ${DRINK_META[k].text}`}>{DRINK_META[k].label}</p>
                  <p className="text-2xl font-black text-gray-900 tabular-nums"><AnimatedNumber value={data.drink[k]} /></p>
                </div>
              ))}
            </div>
          </Card>

          <Card title="Qualità della collezione" subtitle="Bottiglie per punteggio AI" delay={250} className="md:col-span-2 xl:col-span-1">
            <div className="h-44 flex items-end gap-3">
              {data.qualityBuckets.map((b, i) => (
                <div key={b.label} className="flex-1 h-full flex flex-col justify-end items-center">
                  <span className="text-xs font-black text-gray-700 mb-1 tabular-nums">{b.count}</span>
                  <div
                    className={`w-full rounded-t-xl bg-gradient-to-t ${i === 3 ? 'from-emerald-600 to-emerald-300' : i === 2 ? 'from-wine-700 to-wine-400' : i === 1 ? 'from-amber-500 to-amber-300' : 'from-gray-400 to-gray-300'} transition-all ease-out`}
                    style={{ height: mounted ? `${(b.count / maxQuality) * 85}%` : '0%', minHeight: b.count ? 6 : 0, transitionDuration: '900ms', transitionDelay: `${i * 100}ms` }}
                  />
                  <span className="text-[10px] font-bold text-gray-400 mt-1.5">{b.label}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <Card title={t('top_regions')} subtitle="Da dove arrivano i tuoi vini" delay={150}>
            <div className="space-y-3.5">
              {data.regions.map(([region, count], idx) => (
                <div key={region}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-gray-700 flex items-center gap-2 min-w-0">
                      <span className="w-5 h-5 rounded-full bg-wine-50 text-wine-700 text-[10px] flex items-center justify-center font-black shrink-0">{idx + 1}</span>
                      <span className="truncate">{region}</span>
                    </span>
                    <span className="text-gray-900 font-bold shrink-0">{count} <span className="text-gray-400 text-xs font-normal">bt</span></span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden ml-7">
                    <div className="h-full rounded-full bg-gradient-to-r from-wine-700 to-wine-400 transition-all ease-out" style={{ width: mounted ? `${(count / maxRegion) * 100}%` : '0%', transitionDuration: '1000ms', transitionDelay: `${idx * 100}ms` }} />
                  </div>
                </div>
              ))}
              {data.regions.length === 0 && <p className="text-xs text-gray-400">Nessun vino in cantina.</p>}
            </div>
          </Card>

          <Card title="Le bottiglie più preziose" subtitle="Per valore di mercato stimato" delay={225}>
            <div className="space-y-2">
              {data.mostValuable.map((w, i) => (
                <div key={w.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 transition-colors animate-in fade-in slide-in-from-bottom-4" style={{ animationDelay: `${300 + i * 80}ms` }}>
                  <span className="text-xs font-black text-gray-300 w-4">{i + 1}</span>
                  <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden shrink-0 border border-gray-100">
                    {w.imageUrl ? <img src={w.imageUrl} alt={w.name} className="w-full h-full object-cover" /> : <WineIcon className="w-5 h-5 m-2.5 text-gray-300" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-gray-900 truncate">{w.name}</p>
                    <p className="text-xs text-gray-500 truncate">{w.producer} · {w.year}</p>
                  </div>
                  <span className="text-sm font-black text-indigo-900 tabular-nums">€{(Number(w.marketPrice) || Number(w.price) || 0).toFixed(0)}</span>
                </div>
              ))}
              {data.mostValuable.length === 0 && <p className="text-xs text-gray-400">Nessun vino in cantina.</p>}
            </div>
          </Card>
        </div>

        <Card
          title="Da bere presto"
          subtitle="Bottiglie con la finestra di consumo che si chiude entro il prossimo anno"
          delay={200}
          right={<span className="text-[10px] font-black uppercase tracking-widest text-amber-700 bg-amber-50 border border-amber-100 px-2 py-1 rounded-full">{data.drinkSoon.length} vini</span>}
        >
          {data.drinkSoon.length === 0 ? (
            <p className="text-sm text-gray-400">Nessuna bottiglia in scadenza: la tua cantina è in forma.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {data.drinkSoon.map(({ w, end }) => (
                <div key={w.id} className={`p-3 rounded-2xl border ${end < new Date().getFullYear() ? 'bg-amber-50 border-amber-100' : 'bg-emerald-50/60 border-emerald-100'}`}>
                  <p className="text-sm font-bold text-gray-900 truncate">{w.name}</p>
                  <p className="text-xs text-gray-500 truncate">{w.producer} · {w.year}</p>
                  <p className={`text-[11px] font-bold mt-1 ${end < new Date().getFullYear() ? 'text-amber-700' : 'text-emerald-700'}`}>
                    {end < new Date().getFullYear() ? `Oltre il picco dal ${end}` : `Da bere entro il ${end}`}
                  </p>
                </div>
              ))}
            </div>
          )}
        </Card>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <StatTile label={t('total_drunk')} value={safeHistory.length} accent="bg-wine-500" delay={150} />
          <StatTile label={t('value_drunk')} value={data.consumedValue} prefix="€" accent="bg-emerald-500" delay={225} />
          <StatTile label={t('avg_drunk_price')} value={safeHistory.length ? data.consumedValue / safeHistory.length : 0} prefix="€" decimals={2} accent="bg-amber-500" delay={300} />
        </div>
      </div>
      <CellarReportModal isOpen={isReportOpen} onClose={() => setIsReportOpen(false)} report={cellarReport} loading={reportLoading} inventory={safeInventory} history={safeHistory} />
    </div>
  );
};

export default AnalyticsView;
