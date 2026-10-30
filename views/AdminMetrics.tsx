import React, { useEffect, useState } from 'react';

// Cruscotto della Fase 0: chi arriva, chi si attiva, chi torna, quanto costa l'AI.
interface Metrics {
  days: number;
  trackingSince: string | null;
  totals: { users: number; premium: number; paying: number; signups: number; marketing_ok: number };
  active: { dau: number; wau: number; mau: number };
  perDay: { day: string; signups: number; visits: number; active: number }[];
  bySource: { source: string; n: number }[];
  heardFrom: { answer: string; n: number }[];
  activation: { cohort: number; activated: number };
  retention: { after_days: number; eligible: number; returned: number }[];
  features: { endpoint: string; calls: number; users: number; cost_usd: number }[];
  aiCost: { cost_usd: number; calls: number; users: number; byPlan: { plan: string; users: number; cost_usd: number }[]; topUsers: { email: string; calls: number; cost_usd: number }[] };
  visitsBySource: { source: string; n: number }[];
  leads: { total: number; new: number };
  campaigns: { id: string; name: string; from: string; to: string; signups: number; activated: number; returned_7d: number; said_fair: number }[];
}

const FEATURE_NAMES: Record<string, string> = {
  'analyze-label': 'Scansione etichetta', 'analyze-purchase': 'Shop Advisor', 'suggest-pairing': 'Sommelier a casa',
  'suggest-restaurant-pairing': 'Carta vini al ristorante', 'analyze-restaurant': 'Audit ristorante (B2B)',
  'extract-text': 'Lettura menu (OCR)', 'cellar-report': 'Report sommelier', 'search-prices': 'Confronto prezzi', 'revalue': 'Ricalcolo valore cantina',
};
const HEARD_NAMES: Record<string, string> = {
  fiera: 'Fiera o evento', biglietto: 'Biglietto da visita', passaparola: 'Un amico', social: 'Social',
  google: 'Ricerca Google', locale: 'Ristorante o enoteca', altro: 'Altro', 'non risposto': 'Non risposto',
};

const usd = (n: number) => `$${(n || 0).toFixed(n >= 0.1 ? 2 : 4)}`;
const pct = (num: number, den: number) => (den > 0 ? `${Math.round((num / den) * 100)}%` : '–');
const dayLabel = (iso: string) => new Date(iso).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' });

const Kpi = ({ label, value, hint }: { label: string; value: React.ReactNode; hint?: string }) => (
  <div className="bg-white rounded-2xl border border-gray-200 p-4">
    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{label}</p>
    <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
    {hint && <p className="text-[11px] text-gray-500 mt-1">{hint}</p>}
  </div>
);

const Card = ({ title, children, note }: { title: string; children: React.ReactNode; note?: string }) => (
  <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-3">
    <h3 className="font-bold text-gray-800">{title}</h3>
    {children}
    {note && <p className="text-[11px] text-gray-400 leading-snug">{note}</p>}
  </div>
);

const CountList = ({ rows, names }: { rows: { label: string; n: number }[]; names?: Record<string, string> }) => {
  const max = Math.max(1, ...rows.map(r => r.n));
  if (rows.length === 0) return <p className="text-sm text-gray-400">Nessun dato nel periodo.</p>;
  return (
    <div className="space-y-1.5">
      {rows.map(r => (
        <div key={r.label} className="flex items-center gap-3 text-sm">
          <span className="w-40 shrink-0 truncate text-gray-700">{names?.[r.label] || r.label}</span>
          <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden"><div className="h-full bg-wine-600 rounded-full" style={{ width: `${(r.n / max) * 100}%` }} /></div>
          <span className="w-10 text-right font-bold text-gray-900">{r.n}</span>
        </div>
      ))}
    </div>
  );
};

const AdminMetrics: React.FC<{ token: string }> = ({ token }) => {
  const [days, setDays] = useState(30);
  const [data, setData] = useState<Metrics | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    setError('');
    fetch(`/api/admin/metrics?days=${days}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(async res => { if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Errore'); return res.json(); })
      .then(setData)
      .catch(e => setError(e.message));
  }, [days, token]);

  if (error) return <div className="p-6 text-red-600 bg-red-50 rounded-2xl">{error}</div>;
  if (!data) return <div className="p-8 text-center text-gray-400">Calcolo metriche...</div>;

  const maxSignups = Math.max(1, ...data.perDay.map(d => d.signups));
  const costPerActiveUser = data.aiCost.users > 0 ? data.aiCost.cost_usd / data.aiCost.users : 0;
  const ret = (n: number) => data.retention.find(r => r.after_days === n) || { eligible: 0, returned: 0 };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-gray-500">
          Ultimi {data.days} giorni{data.trackingSince ? ` · attività tracciata dal ${new Date(data.trackingSince).toLocaleDateString('it-IT')}` : ' · tracciamento appena attivato'}
        </p>
        <div className="flex bg-white border border-gray-200 rounded-xl p-1">
          {[7, 30, 90].map(d => (
            <button key={d} onClick={() => setDays(d)} className={`px-3 py-1 text-xs font-bold rounded-lg ${days === d ? 'bg-wine-700 text-white' : 'text-gray-500'}`}>{d} gg</button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Kpi label="Iscritti nel periodo" value={data.totals.signups} hint={`${data.totals.users} in totale`} />
        <Kpi label="Attivati" value={pct(data.activation.activated, data.activation.cohort)} hint={`${data.activation.activated} su ${data.activation.cohort}: almeno un vino o un'analisi`} />
        <Kpi label="Utenti attivi" value={data.active.mau} hint={`oggi ${data.active.dau} · 7 gg ${data.active.wau} · 30 gg ${data.active.mau}`} />
        <Kpi label="Premium" value={data.totals.premium} hint={`${data.totals.paying} paganti con Stripe`} />
        <Kpi label="Tornati dopo 7 giorni" value={pct(ret(7).returned, ret(7).eligible)} hint={`${ret(7).returned} su ${ret(7).eligible} iscritti da almeno 7 giorni`} />
        <Kpi label="Tornati dopo 30 giorni" value={pct(ret(30).returned, ret(30).eligible)} hint={`${ret(30).returned} su ${ret(30).eligible} iscritti da almeno 30 giorni`} />
        <Kpi label="Costo AI nel periodo" value={usd(data.aiCost.cost_usd)} hint={`${data.aiCost.calls} analisi · ${usd(costPerActiveUser)} per utente che usa l'AI`} />
        <Kpi label="Contatti business" value={data.leads.total} hint={`${data.leads.new} da ricontattare`} />
      </div>

      {data.campaigns.map(c => (
        <div key={c.id} className="bg-wine-50 border border-wine-100 rounded-2xl p-5">
          <p className="text-[10px] font-black uppercase tracking-widest text-wine-700">Campagna · {dayLabel(c.from)} – {dayLabel(c.to)}</p>
          <h3 className="font-serif font-bold text-lg text-gray-900">{c.name}</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3 text-sm">
            <div><span className="block text-2xl font-bold">{c.signups}</span>iscritti in quei giorni</div>
            <div><span className="block text-2xl font-bold">{c.said_fair}</span>dicono «fiera» o «biglietto»</div>
            <div><span className="block text-2xl font-bold">{pct(c.activated, c.signups)}</span>attivati</div>
            <div><span className="block text-2xl font-bold">{pct(c.returned_7d, c.signups)}</span>tornati dopo 7 giorni</div>
          </div>
          <p className="text-[11px] text-gray-500 mt-3">I biglietti stampati portano ad aiknow.wine senza codice: conta chi si iscrive in quei giorni e chi risponde «fiera» o «biglietto» al primo accesso.</p>
        </div>
      ))}

      <Card title="Iscrizioni al giorno" note="Passa il mouse su una barra per vedere iscritti, visite anonime alla home e utenti attivi di quel giorno.">
        <div className="flex items-end gap-[3px] h-40">
          {data.perDay.map(d => (
            <div key={d.day} className="flex-1 h-full flex flex-col justify-end items-center" title={`${dayLabel(d.day)}: ${d.signups} iscritti, ${d.visits} visite, ${d.active} attivi`}>
              <div className="w-full bg-wine-600 rounded-t" style={{ height: `${(d.signups / maxSignups) * 100}%`, minHeight: d.signups ? 3 : 0 }} />
            </div>
          ))}
        </div>
        <div className="flex justify-between text-[10px] text-gray-400">
          <span>{dayLabel(data.perDay[0].day)}</span><span>{dayLabel(data.perDay[data.perDay.length - 1].day)}</span>
        </div>
        <p className="text-xs text-gray-500">
          Visite nel periodo: <strong>{data.perDay.reduce((s, d) => s + d.visits, 0)}</strong> · iscritti: <strong>{data.totals.signups}</strong>
          {' '}· conversione visita → iscrizione: <strong>{pct(data.totals.signups, data.perDay.reduce((s, d) => s + d.visits, 0))}</strong>
        </p>
      </Card>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card title="Da dove arrivano gli iscritti" note="Dal link (?src=, utm, aiknow.wine/qr/...) o dal sito di provenienza. «diretto» = indirizzo digitato o QR senza codice.">
          <CountList rows={data.bySource.map(r => ({ label: r.source, n: r.n }))} />
        </Card>
        <Card title="Come ci hai conosciuto (risposte al primo accesso)">
          <CountList rows={data.heardFrom.map(r => ({ label: r.answer, n: r.n }))} names={HEARD_NAMES} />
        </Card>
      </div>

      <Card title="Funzioni usate e costo AI" note="Costo stimato dal listino Anthropic in base ai token di ogni chiamata; la fattura reale può differire di poco.">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-[10px] uppercase tracking-widest text-gray-400 text-left"><tr><th className="py-2">Funzione</th><th className="text-right">Usi</th><th className="text-right">Utenti</th><th className="text-right">Costo</th><th className="text-right">Per uso</th></tr></thead>
            <tbody className="divide-y divide-gray-100">
              {data.features.map(f => (
                <tr key={f.endpoint}>
                  <td className="py-2 text-gray-800">{FEATURE_NAMES[f.endpoint] || f.endpoint}</td>
                  <td className="text-right font-bold">{f.calls}</td>
                  <td className="text-right">{f.users}</td>
                  <td className="text-right">{usd(f.cost_usd)}</td>
                  <td className="text-right text-gray-500">{usd(f.calls ? f.cost_usd / f.calls : 0)}</td>
                </tr>
              ))}
              {data.features.length === 0 && <tr><td colSpan={5} className="py-3 text-gray-400">Nessuna analisi nel periodo.</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card title="Costo AI per piano">
          <div className="space-y-2 text-sm">
            {data.aiCost.byPlan.map(p => (
              <div key={p.plan} className="flex justify-between"><span className="capitalize text-gray-700">{p.plan}</span><span><strong>{usd(p.cost_usd)}</strong> · {p.users} utenti · {usd(p.users ? p.cost_usd / p.users : 0)} a testa</span></div>
            ))}
            {data.aiCost.byPlan.length === 0 && <p className="text-gray-400">Nessun dato.</p>}
          </div>
        </Card>
        <Card title="Utenti che costano di più" note="Utile per decidere il limite del piano Free e scoprire usi anomali.">
          <div className="space-y-1.5 text-sm">
            {data.aiCost.topUsers.map(u => (
              <div key={u.email} className="flex justify-between gap-3"><span className="truncate text-gray-700">{u.email}</span><span className="shrink-0"><strong>{usd(u.cost_usd)}</strong> · {u.calls} analisi</span></div>
            ))}
            {data.aiCost.topUsers.length === 0 && <p className="text-gray-400">Nessun dato.</p>}
          </div>
        </Card>
      </div>

      <Card title="Ritorno degli utenti" note="Tornato = ha aperto l'app almeno una volta dal giorno N dopo l'iscrizione. Conta solo chi si è iscritto dopo l'attivazione del tracciamento.">
        <div className="grid grid-cols-3 gap-3 text-center">
          {[1, 7, 30].map(n => (
            <div key={n} className="bg-gray-50 rounded-xl p-3">
              <p className="text-2xl font-bold text-gray-900">{pct(ret(n).returned, ret(n).eligible)}</p>
              <p className="text-xs text-gray-500">dopo {n} {n === 1 ? 'giorno' : 'giorni'} ({ret(n).returned}/{ret(n).eligible})</p>
            </div>
          ))}
        </div>
      </Card>

      <Card title="Visite anonime alla home per sorgente">
        <CountList rows={data.visitsBySource.map(r => ({ label: r.source, n: r.n }))} />
      </Card>
    </div>
  );
};

export default AdminMetrics;
