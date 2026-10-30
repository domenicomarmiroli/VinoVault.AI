// Sveglia notturna per un altro servizio (il bot giornaliero su Render, piano gratuito).
// Indipendente dal resto dell'app: si attiva solo se BOT_WAKE_URL e BOT_WAKE_TOKEN sono impostate,
// e un suo errore non tocca VinoVault (tutto è dentro try/catch e timer separati).
//
//   BOT_WAKE_URL        es. https://bitget-bot-giornaliero.onrender.com/api/bot/wake
//   BOT_WAKE_TOKEN      il codice segreto (WAKE_TOKEN del bot)
//   BOT_WAKE_TIME_UTC   orario giornaliero, predefinito "00:20" (dopo la chiusura delle 00:00 UTC)

const RETRIES = 3;
const RETRY_DELAY_MS = 5 * 60 * 1000;
const REQUEST_TIMEOUT_MS = 3 * 60 * 1000; // il servizio gratuito può impiegare un minuto a svegliarsi

export function nextRunAt(now, timeUtc = '00:20') {
  const [h, m] = String(timeUtc).split(':').map((x) => parseInt(x, 10));
  const t = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), h || 0, m || 0, 0));
  if (t <= now) t.setUTCDate(t.getUTCDate() + 1);
  return t;
}

export async function wakeOnce(url, token, fetchImpl = globalThis.fetch) {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), REQUEST_TIMEOUT_MS);
  try {
    const r = await fetchImpl(url, { method: 'POST', headers: { 'X-Wake-Token': token }, signal: ctl.signal });
    const body = await r.text().catch(() => '');
    return { ok: r.ok, status: r.status, body: body.slice(0, 200) };
  } finally {
    clearTimeout(timer);
  }
}

export function startBotWakeup(env = process.env, { fetchImpl = globalThis.fetch, log = console } = {}) {
  const url = env.BOT_WAKE_URL;
  const token = env.BOT_WAKE_TOKEN;
  if (!url || !token) return null;
  if (!/^https:\/\//.test(url)) { log.warn('[sveglia bot] BOT_WAKE_URL deve iniziare con https://: sveglia disattivata'); return null; }
  if (typeof fetchImpl !== 'function') { log.warn('[sveglia bot] fetch non disponibile: sveglia disattivata'); return null; }
  let timer = null;
  const attempt = async (n) => {
    try {
      const r = await wakeOnce(url, token, fetchImpl);
      if (r.ok) { log.log(`[sveglia bot] ok (${r.status}) ${r.body}`); return schedule(); }
      log.warn(`[sveglia bot] risposta ${r.status}: ${r.body}`);
    } catch (e) {
      log.warn(`[sveglia bot] errore: ${e && e.name}`);
    }
    if (n < RETRIES) { timer = setTimeout(() => attempt(n + 1), RETRY_DELAY_MS); return; }
    log.warn('[sveglia bot] tentativi esauriti: il bot recupererà al prossimo risveglio');
    schedule();
  };
  const schedule = () => {
    const at = nextRunAt(new Date(), env.BOT_WAKE_TIME_UTC || '00:20');
    timer = setTimeout(() => attempt(1), at - Date.now());
    if (timer.unref) timer.unref();
    log.log(`[sveglia bot] prossima sveglia ${at.toISOString()}`);
  };
  schedule();
  return { stop: () => clearTimeout(timer) };
}
