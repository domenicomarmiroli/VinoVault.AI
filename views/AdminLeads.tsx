import React, { useEffect, useState } from 'react';

// Contatti arrivati dal modulo della pagina business, con lo stato della trattativa.
interface Lead {
  id: number; name: string; business: string | null; kind: string | null; email: string; phone: string | null;
  city: string | null; message: string | null; language: string | null; source: string | null; status: string; created_at: string;
}

const STATUSES = ['nuovo', 'contattato', 'pilota', 'cliente', 'scartato'];
const KIND_NAMES: Record<string, string> = { ristorante: 'Ristorante', enoteca: 'Enoteca', cantina: 'Cantina', distributore: 'Distributore', altro: 'Altro' };
const STATUS_STYLE: Record<string, string> = {
  nuovo: 'bg-amber-100 text-amber-800', contattato: 'bg-blue-100 text-blue-800', pilota: 'bg-purple-100 text-purple-800',
  cliente: 'bg-emerald-100 text-emerald-800', scartato: 'bg-gray-100 text-gray-500',
};

const AdminLeads: React.FC<{ token: string; onCountChange?: (n: number) => void }> = ({ token, onCountChange }) => {
  const [leads, setLeads] = useState<Lead[] | null>(null);

  useEffect(() => {
    fetch('/api/admin/leads', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => (res.ok ? res.json() : []))
      .then((rows: Lead[]) => { setLeads(rows); onCountChange?.(rows.length); })
      .catch(() => setLeads([]));
  }, [token]);

  const updateStatus = async (id: number, status: string) => {
    const previous = leads;
    setLeads(prev => prev?.map(l => (l.id === id ? { ...l, status } : l)) || null);
    const res = await fetch(`/api/admin/leads/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status }),
    }).catch(() => null);
    if (!res || !res.ok) { setLeads(previous); alert('Aggiornamento non riuscito'); }
  };

  if (!leads) return <div className="p-8 text-center text-gray-400">Caricamento...</div>;
  if (leads.length === 0) {
    return <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center text-gray-500">Nessun contatto ancora. Arrivano dal modulo in fondo alla pagina /ristoranti.</div>;
  }

  return (
    <div className="space-y-3">
      {leads.map(l => (
        <div key={l.id} className="bg-white rounded-2xl border border-gray-200 p-4 space-y-2">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="font-bold text-gray-900">{l.name}{l.business && <span className="font-normal text-gray-500"> · {l.business}</span>}</p>
              <p className="text-xs text-gray-500">
                {KIND_NAMES[l.kind || ''] || l.kind}{l.city ? ` · ${l.city}` : ''} · {new Date(l.created_at).toLocaleDateString('it-IT')}{l.source ? ` · da ${l.source}` : ''}
              </p>
            </div>
            <select value={l.status} onChange={(e) => updateStatus(l.id, e.target.value)} className={`text-xs font-bold rounded-lg px-2 py-1 border-0 ${STATUS_STYLE[l.status] || ''}`}>
              {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
            <a href={`mailto:${l.email}`} className="text-wine-700 underline">{l.email}</a>
            {l.phone && <a href={`tel:${l.phone}`} className="text-wine-700 underline">{l.phone}</a>}
          </div>
          {l.message && <p className="text-sm text-gray-600 bg-gray-50 rounded-xl p-3 whitespace-pre-wrap">{l.message}</p>}
        </div>
      ))}
    </div>
  );
};

export default AdminLeads;
