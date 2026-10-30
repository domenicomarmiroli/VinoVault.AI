import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { BillingConfig, BillingPlan, formatPrice, getBillingConfig, startCheckout } from '../services/billing';

// Scelta del piano Premium: i prezzi arrivano da Stripe, così sono sempre quelli addebitati.
export const UpgradePanel: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { t, language } = useLanguage();
  const [config, setConfig] = useState<BillingConfig | null>(null);
  const [busyPlan, setBusyPlan] = useState<BillingPlan['id'] | null>(null);
  const [error, setError] = useState('');

  useEffect(() => { getBillingConfig().then(setConfig); }, []);

  const choose = async (plan: BillingPlan['id']) => {
    setBusyPlan(plan);
    setError('');
    try { await startCheckout(plan); }
    catch (e: any) { setError(e.message); setBusyPlan(null); }
  };

  const monthly = config?.plans.find(p => p.id === 'monthly');
  const yearly = config?.plans.find(p => p.id === 'yearly');
  const yearlySaving = monthly && yearly && monthly.amount > 0
    ? Math.round((1 - yearly.amount / (monthly.amount * 12)) * 100)
    : 0;

  return (
    <div className={`rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-white ${compact ? 'p-4' : 'p-5'} space-y-3`}>
      <div>
        <h3 className="font-serif font-bold text-gray-900 text-lg">{t('upgrade_title')}</h3>
        <p className="text-xs text-gray-600 mt-1 leading-relaxed">{t('upgrade_desc')}</p>
      </div>
      {!config ? (
        <div className="h-12 rounded-xl bg-amber-100/60 animate-pulse" />
      ) : !config.enabled ? (
        <p className="text-xs font-bold text-amber-800 bg-amber-100 rounded-lg px-3 py-2">{t('upgrade_unavailable')}</p>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {[monthly, yearly].filter(Boolean).map(plan => (
            <button
              key={plan!.id}
              onClick={() => choose(plan!.id)}
              disabled={busyPlan !== null}
              className={`relative rounded-xl border-2 px-3 py-3 text-left transition-all disabled:opacity-60 ${plan!.id === 'yearly' ? 'border-amber-400 bg-white' : 'border-gray-200 bg-white hover:border-amber-300'}`}
            >
              {plan!.id === 'yearly' && yearlySaving > 0 && (
                <span className="absolute -top-2 right-2 bg-amber-400 text-amber-950 text-[10px] font-black px-1.5 py-0.5 rounded-md">-{yearlySaving}%</span>
              )}
              <span className="block text-[10px] font-black uppercase tracking-widest text-gray-500">{t(plan!.id === 'yearly' ? 'upgrade_yearly' : 'upgrade_monthly')}</span>
              <span className="block text-lg font-bold text-gray-900 mt-0.5">
                {formatPrice(plan!, language)}<span className="text-xs font-medium text-gray-500">{t(plan!.interval === 'year' ? 'per_year' : 'per_month')}</span>
              </span>
              {busyPlan === plan!.id && <span className="block text-[10px] text-amber-700 mt-1">{t('upgrade_redirecting')}</span>}
            </button>
          ))}
        </div>
      )}
      {error && <p className="text-xs text-red-600 font-medium">{error}</p>}
      {config?.enabled && <p className="text-[10px] text-gray-400">{t('upgrade_fine_print')}</p>}
    </div>
  );
};

// Pulsante «Funzione Premium» per le sezioni bloccate: apre la scelta del piano.
export const UpgradeButton: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setOpen(true); }}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-400 text-amber-950 rounded-lg text-xs font-bold hover:bg-amber-300 transition-colors ${className}`}
      >
        🔒 {t('premium_feature')} · {t('upgrade_title')}
      </button>
      {open && createPortal(
        <div className="fixed inset-0 bg-black/60 z-[400] flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setOpen(false)}>
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-2 relative" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setOpen(false)} className="absolute top-3 right-4 text-gray-400 hover:text-gray-700 z-10" aria-label="Chiudi">✕</button>
            <UpgradePanel />
          </div>
        </div>,
        document.body
      )}
    </>
  );
};
