// Da dove arriva chi si iscrive: si salva il primo contatto (link con ?src= o utm, sito di provenienza)
// e lo si invia al server solo al momento della registrazione.
const FIRST_TOUCH_KEY = 'aiknow_first_touch';
const VISIT_SENT_KEY = 'aiknow_visit_sent';

export interface FirstTouch {
  src?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  referrer?: string;
  landing?: string;
  first_seen?: string;
}

const safeGet = (storage: Storage, key: string) => { try { return storage.getItem(key); } catch { return null; } };
const safeSet = (storage: Storage, key: string, value: string) => { try { storage.setItem(key, value); } catch { /* archiviazione non disponibile */ } };

export const getFirstTouch = (): FirstTouch | null => {
  const raw = safeGet(localStorage, FIRST_TOUCH_KEY);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
};

// Da chiamare all'avvio dell'app. Conta anche una visita anonima alla home (una per sessione del browser).
export const captureVisit = (isLoggedIn: boolean) => {
  const params = new URLSearchParams(window.location.search);
  const fromUrl: FirstTouch = {
    src: params.get('src') || undefined,
    utm_source: params.get('utm_source') || undefined,
    utm_medium: params.get('utm_medium') || undefined,
    utm_campaign: params.get('utm_campaign') || undefined,
  };
  const hasCampaign = Boolean(fromUrl.src || fromUrl.utm_source);
  const stored = getFirstTouch();
  // Primo contatto: si tiene il primo, ma un link di campagna vince su una visita diretta precedente.
  if (!stored || (hasCampaign && !stored.src && !stored.utm_source)) {
    const touch: FirstTouch = {
      ...fromUrl,
      referrer: document.referrer || undefined,
      landing: window.location.pathname,
      first_seen: new Date().toISOString(),
    };
    safeSet(localStorage, FIRST_TOUCH_KEY, JSON.stringify(touch));
  }

  if (isLoggedIn || safeGet(sessionStorage, VISIT_SENT_KEY)) return;
  safeSet(sessionStorage, VISIT_SENT_KEY, '1');
  const current = getFirstTouch();
  fetch('/api/visits', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ source: { ...current, ...(hasCampaign ? fromUrl : {}) }, path: window.location.pathname }),
  }).catch(() => { /* la statistica non deve mai bloccare l'app */ });

  // Toglie ?src= e utm dalla barra degli indirizzi, così non finiscono nei link condivisi.
  if (hasCampaign) {
    ['src', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'].forEach(k => params.delete(k));
    const query = params.toString();
    window.history.replaceState({}, '', window.location.pathname + (query ? `?${query}` : '') + window.location.hash);
  }
};
