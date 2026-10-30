// Abbonamento Premium con Stripe (Checkout + portale clienti + webhook).
// Disattivo finché non sono impostate le variabili d'ambiente:
//   STRIPE_SECRET_KEY        chiave segreta (sk_live_... o sk_test_...)
//   STRIPE_WEBHOOK_SECRET    segreto dell'endpoint webhook (whsec_...)
//   STRIPE_PRICE_MONTHLY     id del prezzo mensile (price_...)
//   STRIPE_PRICE_YEARLY      id del prezzo annuale (price_...)
//   APP_URL                  indirizzo pubblico dell'app (predefinito https://aiknow.wine)
import crypto from 'crypto';

// STRIPE_API_BASE serve solo ai test locali con un finto Stripe.
const STRIPE_API = process.env.STRIPE_API_BASE || 'https://api.stripe.com/v1';
const ACTIVE_STATUSES = ['active', 'trialing', 'past_due'];
const SIGNATURE_TOLERANCE_SECONDS = 300;

// Stripe vuole i parametri annidati come form: line_items[0][price]=...
const encodeForm = (obj, prefix = '', out = new URLSearchParams()) => {
    for (const [key, value] of Object.entries(obj)) {
        if (value === undefined || value === null) continue;
        const name = prefix ? `${prefix}[${key}]` : key;
        if (typeof value === 'object') encodeForm(value, name, out);
        else out.append(name, String(value));
    }
    return out;
};

export const verifyStripeSignature = (rawBody, header, secret, nowSeconds = Math.floor(Date.now() / 1000)) => {
    if (!header || !secret) return false;
    const signatures = [];
    let timestamp = null;
    for (const item of header.split(',')) {
        const [k, v] = item.split('=');
        if (k === 't') timestamp = Number(v);
        else if (k === 'v1' && v) signatures.push(v);
    }
    if (!timestamp || signatures.length === 0) return false;
    if (Math.abs(nowSeconds - timestamp) > SIGNATURE_TOLERANCE_SECONDS) return false;
    const expected = crypto.createHmac('sha256', secret).update(`${timestamp}.${rawBody.toString('utf8')}`).digest('hex');
    const expectedBuf = Buffer.from(expected, 'hex');
    return signatures.some(sig => {
        const sigBuf = Buffer.from(sig, 'hex');
        return sigBuf.length === expectedBuf.length && crypto.timingSafeEqual(sigBuf, expectedBuf);
    });
};

export const createBilling = ({ pool, authenticateToken, trackEvent }) => {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    const appUrl = (process.env.APP_URL || 'https://aiknow.wine').replace(/\/$/, '');
    const plans = [
        { id: 'monthly', priceId: process.env.STRIPE_PRICE_MONTHLY },
        { id: 'yearly', priceId: process.env.STRIPE_PRICE_YEARLY },
    ].filter(p => p.priceId);
    const enabled = Boolean(secretKey && plans.length > 0);

    const stripe = async (method, path, params) => {
        const res = await fetch(`${STRIPE_API}${path}`, {
            method,
            headers: { Authorization: `Bearer ${secretKey}`, 'Content-Type': 'application/x-www-form-urlencoded' },
            body: params ? encodeForm(params).toString() : undefined,
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error?.message || `Stripe ${res.status}`);
        return data;
    };

    // Prezzi letti da Stripe e tenuti in memoria per un'ora: il prezzo mostrato è sempre quello che verrà addebitato.
    let priceCache = { at: 0, plans: [] };
    const loadPlans = async () => {
        if (Date.now() - priceCache.at < 60 * 60 * 1000 && priceCache.plans.length) return priceCache.plans;
        const loaded = await Promise.all(plans.map(async (p) => {
            const price = await stripe('GET', `/prices/${encodeURIComponent(p.priceId)}`);
            return { id: p.id, amount: (price.unit_amount || 0) / 100, currency: price.currency, interval: price.recurring?.interval || null };
        }));
        priceCache = { at: Date.now(), plans: loaded };
        return loaded;
    };

    const setPremiumFromSubscription = async (subscription, userIdHint) => {
        const status = subscription.status;
        const active = ACTIVE_STATUSES.includes(status);
        const periodEnd = subscription.current_period_end || subscription.items?.data?.[0]?.current_period_end || null;
        const priceId = subscription.items?.data?.[0]?.price?.id;
        const plan = plans.find(p => p.priceId === priceId)?.id || null;
        const userId = userIdHint || subscription.metadata?.userId || null;
        // Un Premium regalato dall'admin non viene tolto dalla fine di un abbonamento Stripe.
        const result = await pool.query(
            `UPDATE users SET
                stripe_subscription_id = $1,
                premium_plan = COALESCE($2, premium_plan),
                premium_until = CASE WHEN $3::bigint IS NULL THEN premium_until ELSE to_timestamp($3::bigint) END,
                is_premium = CASE WHEN $4 THEN TRUE WHEN premium_source = 'admin' THEN is_premium ELSE FALSE END,
                premium_source = CASE WHEN $4 THEN 'stripe' ELSE premium_source END
             WHERE (stripe_customer_id = $5 OR id = $6) RETURNING id`,
            [subscription.id, plan, periodEnd, active, subscription.customer, userId]
        );
        return result.rows[0]?.id || null;
    };

    const webhookHandler = async (req, res) => {
        if (!enabled || !webhookSecret) return res.status(503).json({ error: 'Pagamenti non configurati' });
        if (!verifyStripeSignature(req.body, req.headers['stripe-signature'], webhookSecret)) {
            return res.status(400).json({ error: 'Firma non valida' });
        }
        let event;
        try { event = JSON.parse(req.body.toString('utf8')); } catch { return res.status(400).json({ error: 'JSON non valido' }); }
        try {
            const obj = event.data?.object || {};
            if (event.type === 'checkout.session.completed' && obj.mode === 'subscription') {
                const userId = obj.client_reference_id || obj.metadata?.userId;
                if (userId) {
                    await pool.query('UPDATE users SET stripe_customer_id = $1 WHERE id = $2', [obj.customer, userId]);
                    if (obj.subscription) {
                        const subscription = await stripe('GET', `/subscriptions/${encodeURIComponent(obj.subscription)}`);
                        await setPremiumFromSubscription(subscription, userId);
                    }
                    trackEvent(userId, 'subscription_started', { plan: obj.metadata?.plan || null, amount: (obj.amount_total || 0) / 100 });
                }
            } else if (event.type === 'customer.subscription.updated' || event.type === 'customer.subscription.created') {
                await setPremiumFromSubscription(obj);
            } else if (event.type === 'customer.subscription.deleted') {
                const userId = await setPremiumFromSubscription({ ...obj, status: 'canceled' });
                if (userId) trackEvent(userId, 'subscription_canceled', null);
            }
            res.json({ received: true });
        } catch (err) {
            console.error('Stripe webhook error', event?.type, err.message);
            res.status(500).json({ error: 'Webhook non elaborato' });
        }
    };

    const registerRoutes = (app) => {
        app.get('/api/billing/config', authenticateToken, async (req, res) => {
            if (!enabled) return res.json({ enabled: false, plans: [] });
            try { res.json({ enabled: true, plans: await loadPlans() }); }
            catch (err) { console.error('Stripe prices error', err.message); res.json({ enabled: false, plans: [] }); }
        });

        app.post('/api/billing/checkout', authenticateToken, async (req, res) => {
            if (!enabled) return res.status(503).json({ error: 'I pagamenti non sono ancora attivi.' });
            const plan = plans.find(p => p.id === req.body?.plan);
            if (!plan) return res.status(400).json({ error: 'Piano non valido' });
            try {
                const userResult = await pool.query('SELECT id, email, language, stripe_customer_id, is_premium, premium_source FROM users WHERE id = $1', [req.user.userId]);
                const user = userResult.rows[0];
                if (!user) return res.status(404).json({ error: 'Utente non trovato' });
                if (user.is_premium && user.premium_source === 'stripe') return res.status(409).json({ error: 'Hai già un abbonamento attivo.' });
                const session = await stripe('POST', '/checkout/sessions', {
                    mode: 'subscription',
                    line_items: [{ price: plan.priceId, quantity: 1 }],
                    client_reference_id: user.id,
                    customer: user.stripe_customer_id || undefined,
                    customer_email: user.stripe_customer_id ? undefined : user.email,
                    metadata: { userId: user.id, plan: plan.id },
                    subscription_data: { metadata: { userId: user.id, plan: plan.id } },
                    allow_promotion_codes: 'true',
                    locale: ['it', 'en', 'fr', 'es', 'de'].includes(user.language) ? user.language : 'auto',
                    success_url: `${appUrl}/?billing=success`,
                    cancel_url: `${appUrl}/?billing=cancel`,
                });
                trackEvent(user.id, 'checkout_started', { plan: plan.id });
                res.json({ url: session.url });
            } catch (err) {
                console.error('Stripe checkout error', err.message);
                res.status(502).json({ error: 'Pagamento non disponibile al momento, riprova.' });
            }
        });

        app.post('/api/billing/portal', authenticateToken, async (req, res) => {
            if (!enabled) return res.status(503).json({ error: 'I pagamenti non sono ancora attivi.' });
            try {
                const userResult = await pool.query('SELECT stripe_customer_id FROM users WHERE id = $1', [req.user.userId]);
                const customer = userResult.rows[0]?.stripe_customer_id;
                if (!customer) return res.status(404).json({ error: 'Nessun abbonamento da gestire.' });
                const session = await stripe('POST', '/billing_portal/sessions', { customer, return_url: appUrl });
                res.json({ url: session.url });
            } catch (err) {
                console.error('Stripe portal error', err.message);
                res.status(502).json({ error: 'Portale non disponibile al momento, riprova.' });
            }
        });
    };

    const initBillingDb = async (client) => {
        await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;`);
        await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;`);
        await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS premium_plan TEXT;`);
        await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS premium_until TIMESTAMP WITH TIME ZONE;`);
        await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS premium_source TEXT;`);
    };

    return { enabled, webhookHandler, registerRoutes, initBillingDb };
};
