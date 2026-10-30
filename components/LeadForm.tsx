import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { getFirstTouch } from '../services/acquisition';

// Contatti business (ristoranti, enoteche, cantine): finiscono nell'area admin, sezione «Contatti».
const KINDS = ['ristorante', 'enoteca', 'cantina', 'distributore', 'altro'] as const;

const LeadForm: React.FC = () => {
  const { t, language } = useLanguage();
  const [form, setForm] = useState({ name: '', business: '', kind: 'ristorante', email: '', phone: '', city: '', message: '', website: '' });
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [key]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('sending');
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, privacyAccepted, language, source: getFirstTouch() }),
      });
      setStatus(res.ok ? 'sent' : 'error');
    } catch {
      setStatus('error');
    }
  };

  if (status === 'sent') {
    return <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-8 text-center text-emerald-800 font-bold">{t('lead_sent')}</div>;
  }

  const input = 'w-full p-3 border border-gray-200 rounded-xl bg-white focus:border-emerald-500 outline-none text-sm';

  return (
    <form onSubmit={submit} className="grid md:grid-cols-2 gap-3 text-left">
      <input required placeholder={t('lead_name')} value={form.name} onChange={set('name')} className={input} autoComplete="name" />
      <input placeholder={t('lead_business')} value={form.business} onChange={set('business')} className={input} autoComplete="organization" />
      <select value={form.kind} onChange={set('kind')} className={input} aria-label={t('lead_kind')}>
        {KINDS.map(k => <option key={k} value={k}>{t(`lead_kind_${k}`)}</option>)}
      </select>
      <input placeholder={t('lead_city')} value={form.city} onChange={set('city')} className={input} autoComplete="address-level2" />
      <input required type="email" placeholder={t('lead_email')} value={form.email} onChange={set('email')} className={input} autoComplete="email" />
      <input type="tel" placeholder={t('lead_phone')} value={form.phone} onChange={set('phone')} className={input} autoComplete="tel" />
      <textarea placeholder={t('lead_message')} value={form.message} onChange={set('message')} rows={3} className={`${input} md:col-span-2`} />
      {/* campo nascosto: lo compilano solo i bot */}
      <input type="text" tabIndex={-1} autoComplete="off" value={form.website} onChange={set('website')} className="hidden" aria-hidden="true" />
      <label className="md:col-span-2 flex items-start gap-2.5 text-xs text-gray-600 leading-snug cursor-pointer">
        <input type="checkbox" required checked={privacyAccepted} onChange={(e) => setPrivacyAccepted(e.target.checked)} className="mt-0.5 w-4 h-4 accent-emerald-600 shrink-0" />
        <span>{t('lead_privacy')} <a href="/privacy" target="_blank" rel="noopener" className="underline">Privacy</a></span>
      </label>
      {status === 'error' && <p className="md:col-span-2 text-sm text-red-600">{t('lead_error')}</p>}
      <button type="submit" disabled={status === 'sending'} className="md:col-span-2 bg-emerald-600 text-white py-4 rounded-2xl font-bold text-lg hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 disabled:opacity-60">
        {status === 'sending' ? t('lead_sending') : t('lead_submit')}
      </button>
    </form>
  );
};

export default LeadForm;
