// Fase 0 del lancio: misurare chi arriva, chi usa l'app, quanto costa l'AI e raccogliere i contatti business.
// Tutto resta nel nostro database: nessuno strumento di terze parti, nessun cookie di profilazione.

// Prezzi Anthropic in dollari per milione di token (listino ottobre 2026).
// Se nell'app cambia modello, aggiungerlo qui: le chiamate a un modello sconosciuto vengono registrate con costo 0.
const MODEL_PRICES = [
    { prefix: 'claude-opus-5-5', input: 4, output: 20 },
    { prefix: 'claude-haiku-4-5', input: 1, output: 5 },
];
const CACHE_WRITE_MULTIPLIER = 1.25;
const CACHE_READ_MULTIPLIER = 0.1;
const WEB_SEARCH_USD = 10 / 1000; // 10 dollari ogni 1.000 ricerche web

// Periodi delle campagne offline (es. fiere): le iscrizioni in questi giorni vengono contate a parte,
// perché i biglietti già stampati portano a https://aiknow.wine senza codice sorgente.
export const CAMPAIGNS = [
    { id: 'fivi-2026', name: 'Mercato dei Vini FIVI, Bologna', from: '2026-11-21', to: '2026-11-24' },
];

// Risposte possibili a «Come ci hai conosciuto?»
export const HEARD_FROM_OPTIONS = ['fiera', 'biglietto', 'passaparola', 'social', 'google', 'locale', 'altro'];

export const LEAD_KINDS = ['ristorante', 'enoteca', 'cantina', 'distributore', 'altro'];
const LEAD_STATUSES = ['nuovo', 'contattato', 'pilota', 'cliente', 'scartato'];

const TZ = 'Europe/Rome';

const clip = (value, max = 200) => (typeof value === 'string' ? value.trim().slice(0, max) : '');
const slug = (value) => clip(value, 60).toLowerCase().replace(/[^a-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '');

const referrerSource = (referrer) => {
    if (!referrer) return '';
    let host = '';
    try { host = new URL(referrer).hostname.replace(/^www\./, ''); } catch { return ''; }
    if (!host || host.endsWith('aiknow.wine') || host.endsWith('onrender.com')) return '';
    const known = ['google', 'bing', 'instagram', 'facebook', 'tiktok', 'linkedin', 'youtube', 'whatsapp', 'pinterest'];
    const match = known.find(k => host.includes(k));
    return match || host;
};

// Calcola la sorgente di un'iscrizione a partire dal primo contatto salvato dal browser.
export const normalizeSignupSource = (raw) => {
    const r = raw && typeof raw === 'object' ? raw : {};
    const meta = {
        src: clip(r.src, 60), utm_source: clip(r.utm_source, 60), utm_medium: clip(r.utm_medium, 60),
        utm_campaign: clip(r.utm_campaign, 100), referrer: clip(r.referrer, 300), landing: clip(r.landing, 200),
        first_seen: clip(r.first_seen, 40),
    };
    const source = slug(meta.src) || slug(meta.utm_source) || slug(referrerSource(meta.referrer)) || 'diretto';
    return { source, meta };
};

export const estimateCostUsd = (model, usage) => {
    if (!usage) return 0;
    const price = MODEL_PRICES.find(p => (model || '').startsWith(p.prefix));
    const searches = Number(usage.server_tool_use?.web_search_requests) || 0;
    if (!price) return searches * WEB_SEARCH_USD;
    const perToken = (dollarsPerMillion) => dollarsPerMillion / 1_000_000;
    return (Number(usage.input_tokens) || 0) * perToken(price.input)
        + (Number(usage.output_tokens) || 0) * perToken(price.output)
        + (Number(usage.cache_creation_input_tokens) || 0) * perToken(price.input) * CACHE_WRITE_MULTIPLIER
        + (Number(usage.cache_read_input_tokens) || 0) * perToken(price.input) * CACHE_READ_MULTIPLIER
        + searches * WEB_SEARCH_USD;
};

// Limite semplice per le richieste pubbliche (visite, contatti): finestra mobile in memoria per IP.
const createRateLimiter = (max, windowMs) => {
    const hits = new Map();
    return (key) => {
        const now = Date.now();
        const recent = (hits.get(key) || []).filter(t => now - t < windowMs);
        if (recent.length >= max) { hits.set(key, recent); return false; }
        recent.push(now);
        hits.set(key, recent);
        if (hits.size > 5000) hits.clear();
        return true;
    };
};

export const createGrowth = ({ pool, anthropic, authenticateToken, authenticateAdmin }) => {
    const initGrowthDb = async (client) => {
        await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS signup_source TEXT;`);
        await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS signup_meta JSONB;`);
        await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS heard_from TEXT;`);
        await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMP WITH TIME ZONE;`);
        await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS privacy_accepted_at TIMESTAMP WITH TIME ZONE;`);
        await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS marketing_consent BOOLEAN DEFAULT FALSE;`);
        await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS marketing_consent_at TIMESTAMP WITH TIME ZONE;`);
        await client.query(`CREATE TABLE IF NOT EXISTS user_activity_days (user_id TEXT REFERENCES users(id) ON DELETE CASCADE, day DATE NOT NULL, PRIMARY KEY (user_id, day));`);
        await client.query(`CREATE TABLE IF NOT EXISTS events (id BIGSERIAL PRIMARY KEY, user_id TEXT REFERENCES users(id) ON DELETE CASCADE, name TEXT NOT NULL, props JSONB, created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP);`);
        await client.query(`CREATE INDEX IF NOT EXISTS events_name_created_idx ON events (name, created_at);`);
        // user_id resta NULL se l'utente cancella l'account: i costi restano nei totali ma non sono più collegati a una persona.
        await client.query(`CREATE TABLE IF NOT EXISTS ai_calls (id BIGSERIAL PRIMARY KEY, user_id TEXT REFERENCES users(id) ON DELETE SET NULL, endpoint TEXT NOT NULL, model TEXT, input_tokens INTEGER DEFAULT 0, output_tokens INTEGER DEFAULT 0, cache_read_tokens INTEGER DEFAULT 0, cache_write_tokens INTEGER DEFAULT 0, web_searches INTEGER DEFAULT 0, cost_usd NUMERIC(12,6) DEFAULT 0, created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP);`);
        await client.query(`CREATE INDEX IF NOT EXISTS ai_calls_created_idx ON ai_calls (created_at);`);
        await client.query(`CREATE INDEX IF NOT EXISTS ai_calls_user_idx ON ai_calls (user_id, created_at);`);
        // Visite anonime alla home: nessun IP, nessun identificativo del visitatore.
        await client.query(`CREATE TABLE IF NOT EXISTS visits (id BIGSERIAL PRIMARY KEY, source TEXT, path TEXT, created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP);`);
        await client.query(`CREATE TABLE IF NOT EXISTS leads (id BIGSERIAL PRIMARY KEY, name TEXT NOT NULL, business TEXT, kind TEXT, email TEXT NOT NULL, phone TEXT, city TEXT, message TEXT, language TEXT, source TEXT, status TEXT DEFAULT 'nuovo', created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP);`);
    };

    const trackEvent = (userId, name, props) => {
        pool.query('INSERT INTO events (user_id, name, props) VALUES ($1, $2, $3)', [userId || null, name, props ? JSON.stringify(props) : null])
            .catch(e => console.error('trackEvent failed', name, e.message));
    };

    // Un giorno di attività per utente: basta una scrittura al giorno, il resto lo filtra la memoria.
    const seenToday = new Map();
    const recordActivity = (userId) => {
        if (!userId) return;
        const today = new Date().toLocaleDateString('sv-SE', { timeZone: TZ });
        if (seenToday.get(userId) === today) return;
        seenToday.set(userId, today);
        if (seenToday.size > 20000) seenToday.clear();
        pool.query(`INSERT INTO user_activity_days (user_id, day) VALUES ($1, $2) ON CONFLICT DO NOTHING`, [userId, today])
            .then(() => pool.query('UPDATE users SET last_seen_at = NOW() WHERE id = $1', [userId]))
            .catch(e => { seenToday.delete(userId); console.error('recordActivity failed', e.message); });
    };

    // Chiamata a Claude con registrazione di token e costo stimato. Stessa firma di anthropic.messages.create.
    const aiCreate = async (userId, endpoint, params) => {
        const response = await anthropic.messages.create(params);
        const usage = response.usage || {};
        const model = response.model || params.model;
        pool.query(
            `INSERT INTO ai_calls (user_id, endpoint, model, input_tokens, output_tokens, cache_read_tokens, cache_write_tokens, web_searches, cost_usd)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
            [userId || null, endpoint, model, usage.input_tokens || 0, usage.output_tokens || 0,
             usage.cache_read_input_tokens || 0, usage.cache_creation_input_tokens || 0,
             usage.server_tool_use?.web_search_requests || 0, estimateCostUsd(model, usage)]
        ).catch(e => console.error('ai_calls insert failed', e.message));
        return response;
    };

    const monthlyAiCalls = async (userId) => {
        const result = await pool.query(
            `SELECT COUNT(*)::int AS n FROM ai_calls WHERE user_id = $1 AND created_at >= date_trunc('month', NOW() AT TIME ZONE '${TZ}') AT TIME ZONE '${TZ}'`,
            [userId]
        );
        return result.rows[0]?.n || 0;
    };

    const visitLimiter = createRateLimiter(60, 60 * 60 * 1000);
    const leadLimiter = createRateLimiter(5, 60 * 60 * 1000);

    const registerRoutes = (app) => {
        // Visita anonima della home (una per sessione del browser).
        app.post('/api/visits', async (req, res) => {
            if (!visitLimiter(req.ip)) return res.status(204).end();
            try {
                const { source } = normalizeSignupSource(req.body?.source);
                await pool.query('INSERT INTO visits (source, path) VALUES ($1, $2)', [source, clip(req.body?.path, 120) || '/']);
                res.status(204).end();
            } catch (err) { res.status(204).end(); }
        });

        app.put('/api/users/me/heard-from', authenticateToken, async (req, res) => {
            const heardFrom = HEARD_FROM_OPTIONS.includes(req.body?.heardFrom) ? req.body.heardFrom : null;
            if (!heardFrom) return res.status(400).json({ error: 'Risposta non valida' });
            try {
                await pool.query('UPDATE users SET heard_from = $1 WHERE id = $2', [heardFrom, req.user.userId]);
                trackEvent(req.user.userId, 'heard_from', { value: heardFrom });
                res.json({ success: true });
            } catch (err) { res.status(500).json({ error: 'Salvataggio non riuscito' }); }
        });

        app.put('/api/users/me/preferences', authenticateToken, async (req, res) => {
            if (typeof req.body?.marketingConsent !== 'boolean') return res.status(400).json({ error: 'Valore non valido' });
            try {
                await pool.query(
                    'UPDATE users SET marketing_consent = $1, marketing_consent_at = NOW() WHERE id = $2',
                    [req.body.marketingConsent, req.user.userId]
                );
                res.json({ success: true });
            } catch (err) { res.status(500).json({ error: 'Salvataggio non riuscito' }); }
        });

        // Modulo contatti della pagina business (ristoranti, enoteche, cantine).
        app.post('/api/leads', async (req, res) => {
            const body = req.body || {};
            if (body.website) return res.json({ success: true }); // campo trappola per i bot
            if (!leadLimiter(req.ip)) return res.status(429).json({ error: 'Troppe richieste, riprova più tardi.' });
            const name = clip(body.name, 120);
            const email = clip(body.email, 200).toLowerCase();
            if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: 'Nome ed email validi sono obbligatori.' });
            if (body.privacyAccepted !== true) return res.status(400).json({ error: "Serve l'accettazione dell'informativa privacy." });
            try {
                const kind = LEAD_KINDS.includes(body.kind) ? body.kind : 'altro';
                await pool.query(
                    'INSERT INTO leads (name, business, kind, email, phone, city, message, language, source) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
                    [name, clip(body.business, 160), kind, email, clip(body.phone, 40), clip(body.city, 80), clip(body.message, 2000), clip(body.language, 5), normalizeSignupSource(body.source).source]
                );
                res.json({ success: true });
            } catch (err) {
                console.error('Lead save failed', err);
                res.status(500).json({ error: 'Invio non riuscito, riprova.' });
            }
        });

        app.get('/api/admin/leads', authenticateAdmin, async (req, res) => {
            try {
                const result = await pool.query('SELECT * FROM leads ORDER BY created_at DESC LIMIT 500');
                res.json(result.rows);
            } catch (err) { res.status(500).json({ error: 'Failed' }); }
        });

        app.put('/api/admin/leads/:id', authenticateAdmin, async (req, res) => {
            if (!LEAD_STATUSES.includes(req.body?.status)) return res.status(400).json({ error: 'Stato non valido' });
            try {
                await pool.query('UPDATE leads SET status = $1 WHERE id = $2', [req.body.status, req.params.id]);
                res.json({ success: true });
            } catch (err) { res.status(500).json({ error: 'Failed' }); }
        });

        app.get('/api/admin/metrics', authenticateAdmin, async (req, res) => {
            const days = Math.min(Math.max(parseInt(req.query.days, 10) || 30, 7), 365);
            try {
                res.json(await buildMetrics(days));
            } catch (err) {
                console.error('Metrics error', err);
                res.status(500).json({ error: 'Calcolo metriche non riuscito' });
            }
        });
    };

    const localDay = (column) => `(${column} AT TIME ZONE '${TZ}')::date`;
    const today = `(NOW() AT TIME ZONE '${TZ}')::date`;

    const buildMetrics = async (days) => {
        const since = `${today} - ${days - 1}`;
        const q = (sql, params = []) => pool.query(sql, params).then(r => r.rows);

        const [totals, active, perDay, bySource, heardFrom, activation, retention, features, aiCost, aiByPlan, topUsers, visitsBySource, leads, tracking] = await Promise.all([
            q(`SELECT COUNT(*)::int AS users,
                      COUNT(*) FILTER (WHERE is_premium)::int AS premium,
                      COUNT(*) FILTER (WHERE stripe_subscription_id IS NOT NULL AND is_premium)::int AS paying,
                      COUNT(*) FILTER (WHERE ${localDay('created_at')} >= ${since})::int AS signups,
                      COUNT(*) FILTER (WHERE marketing_consent)::int AS marketing_ok
               FROM users`),
            q(`SELECT COUNT(DISTINCT user_id) FILTER (WHERE day = ${today})::int AS dau,
                      COUNT(DISTINCT user_id) FILTER (WHERE day > ${today} - 7)::int AS wau,
                      COUNT(DISTINCT user_id) FILTER (WHERE day > ${today} - 30)::int AS mau
               FROM user_activity_days`),
            q(`SELECT d::date AS day,
                      (SELECT COUNT(*) FROM users u WHERE ${localDay('u.created_at')} = d::date)::int AS signups,
                      (SELECT COUNT(*) FROM visits v WHERE ${localDay('v.created_at')} = d::date)::int AS visits,
                      (SELECT COUNT(DISTINCT a.user_id) FROM user_activity_days a WHERE a.day = d::date)::int AS active
               FROM generate_series(${since}, ${today}, interval '1 day') d ORDER BY d`),
            q(`SELECT COALESCE(signup_source, 'prima del tracciamento') AS source, COUNT(*)::int AS n
               FROM users WHERE ${localDay('created_at')} >= ${since} GROUP BY 1 ORDER BY n DESC`),
            q(`SELECT COALESCE(heard_from, 'non risposto') AS answer, COUNT(*)::int AS n
               FROM users WHERE ${localDay('created_at')} >= ${since} GROUP BY 1 ORDER BY n DESC`),
            // Attivato = ha aggiunto almeno un vino o usato almeno una funzione AI.
            q(`SELECT COUNT(*)::int AS cohort,
                      COUNT(*) FILTER (WHERE EXISTS (SELECT 1 FROM wines w WHERE w.user_id = u.id)
                                          OR EXISTS (SELECT 1 FROM ai_calls a WHERE a.user_id = u.id)
                                          OR EXISTS (SELECT 1 FROM events e WHERE e.user_id = u.id AND e.name = 'wine_added'))::int AS activated
               FROM users u WHERE ${localDay('u.created_at')} >= ${since}`),
            // Ritorno a N giorni = attivo in almeno un giorno a partire dal giorno N dopo l'iscrizione.
            // Solo per chi si è iscritto dopo l'inizio del tracciamento, altrimenti i vecchi utenti risulterebbero mai tornati.
            q(`WITH start AS (SELECT MIN(day) AS d FROM user_activity_days),
                    cohort AS (SELECT u.id, ${localDay('u.created_at')} AS signup_day FROM users u, start WHERE start.d IS NOT NULL AND ${localDay('u.created_at')} >= start.d)
               SELECT n AS after_days,
                      COUNT(*) FILTER (WHERE c.signup_day <= ${today} - n)::int AS eligible,
                      COUNT(*) FILTER (WHERE c.signup_day <= ${today} - n AND EXISTS (SELECT 1 FROM user_activity_days a WHERE a.user_id = c.id AND a.day >= c.signup_day + n)) ::int AS returned
               FROM cohort c CROSS JOIN (VALUES (1), (7), (30)) AS t(n) GROUP BY n ORDER BY n`),
            q(`SELECT endpoint, COUNT(*)::int AS calls, COUNT(DISTINCT user_id)::int AS users, COALESCE(SUM(cost_usd), 0)::float AS cost_usd
               FROM ai_calls WHERE ${localDay('created_at')} >= ${since} GROUP BY endpoint ORDER BY calls DESC`),
            q(`SELECT COALESCE(SUM(cost_usd), 0)::float AS cost_usd, COUNT(*)::int AS calls, COUNT(DISTINCT user_id)::int AS users,
                      COALESCE(SUM(input_tokens), 0)::bigint AS input_tokens, COALESCE(SUM(output_tokens), 0)::bigint AS output_tokens
               FROM ai_calls WHERE ${localDay('created_at')} >= ${since}`),
            q(`SELECT CASE WHEN u.is_premium THEN 'premium' WHEN u.id IS NULL THEN 'account eliminati' ELSE 'free' END AS plan,
                      COUNT(DISTINCT a.user_id)::int AS users, COALESCE(SUM(a.cost_usd), 0)::float AS cost_usd
               FROM ai_calls a LEFT JOIN users u ON u.id = a.user_id
               WHERE ${localDay('a.created_at')} >= ${since} GROUP BY 1`),
            q(`SELECT u.email, COUNT(*)::int AS calls, COALESCE(SUM(a.cost_usd), 0)::float AS cost_usd
               FROM ai_calls a JOIN users u ON u.id = a.user_id
               WHERE ${localDay('a.created_at')} >= ${since} GROUP BY u.email ORDER BY cost_usd DESC LIMIT 5`),
            q(`SELECT source, COUNT(*)::int AS n FROM visits WHERE ${localDay('created_at')} >= ${since} GROUP BY source ORDER BY n DESC LIMIT 15`),
            q(`SELECT COUNT(*)::int AS total, COUNT(*) FILTER (WHERE status = 'nuovo')::int AS new FROM leads`),
            q(`SELECT MIN(day) AS since FROM user_activity_days`),
        ]);

        const campaigns = await Promise.all(CAMPAIGNS.map(async (c) => {
            const [row] = await q(
                `SELECT COUNT(*)::int AS signups,
                        COUNT(*) FILTER (WHERE EXISTS (SELECT 1 FROM wines w WHERE w.user_id = u.id) OR EXISTS (SELECT 1 FROM ai_calls a WHERE a.user_id = u.id))::int AS activated,
                        COUNT(*) FILTER (WHERE EXISTS (SELECT 1 FROM user_activity_days a WHERE a.user_id = u.id AND a.day >= ${localDay('u.created_at')} + 7))::int AS returned_7d,
                        COUNT(*) FILTER (WHERE u.heard_from = 'fiera' OR u.heard_from = 'biglietto')::int AS said_fair
                 FROM users u WHERE ${localDay('u.created_at')} BETWEEN $1::date AND $2::date`,
                [c.from, c.to]
            );
            return { ...c, ...row };
        }));

        return {
            days, generatedAt: new Date().toISOString(), trackingSince: tracking[0]?.since || null,
            totals: totals[0], active: active[0], perDay, bySource, heardFrom,
            activation: activation[0], retention, features,
            aiCost: { ...aiCost[0], byPlan: aiByPlan, topUsers },
            visitsBySource, leads: leads[0], campaigns,
        };
    };

    return { initGrowthDb, trackEvent, recordActivity, aiCreate, monthlyAiCalls, registerRoutes };
};
