
import express from 'express';
import pkg from 'pg';
const { Pool } = pkg;
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import Anthropic from '@anthropic-ai/sdk';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_wine_key_change_me';
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;

const cleanJson = (text) => {
    if (!text) return '{}';
    let cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const firstBrace = cleaned.indexOf('{');
    const firstBracket = cleaned.indexOf('[');
    const lastBrace = cleaned.lastIndexOf('}');
    const lastBracket = cleaned.lastIndexOf(']');
    let start = -1, end = -1;
    if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) { start = firstBrace; end = lastBrace; }
    else if (firstBracket !== -1) { start = firstBracket; end = lastBracket; }
    if (start !== -1 && end !== -1) return cleaned.substring(start, end + 1);
    return cleaned;
};

const anthropic = new Anthropic({ apiKey: process.env.API_KEY });
const MODEL = 'claude-opus-4-8';

const getLanguageName = (code) => {
    switch(code) {
        case 'en': return 'English'; case 'fr': return 'French';
        case 'es': return 'Spanish'; case 'de': return 'German';
        default: return 'Italian';
    }
};

const extractText = (response) => {
    const block = response.content.find(b => b.type === 'text');
    return block ? block.text : '';
};

const cleanBase64 = (base64) => base64.replace(/^data:(image\/(png|jpg|jpeg|webp)|application\/pdf);base64,/, '');

app.use(cors());
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

const mapWineToFrontend = (w) => ({
    id: w.id, name: w.name, producer: w.producer, year: w.year, type: w.type,
    region: w.region, grape: w.grape, alcohol: w.alcohol, purchaseDate: w.purchase_date,
    price: parseFloat(w.price) || 0, quantity: parseInt(w.quantity) || 0, location: w.location,
    storageTemp: w.storage_temp || '', storageAdvice: w.storage_advice || '',
    servingTemp: w.serving_temp || '', servingAdvice: w.serving_advice || '',
    foodPairings: w.food_pairings || [], imageUrl: w.image_url,
    drinkWindow: w.drink_window || '', marketPrice: parseFloat(w.market_price) || 0
});

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.sendStatus(401);
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user; next();
  });
};

const authenticateAdmin = (req, res, next) => {
    authenticateToken(req, res, () => {
        if (req.user && req.user.role === 'admin') next();
        else res.status(403).json({ error: 'Access denied' });
    });
};

// --- AI ENDPOINTS ---

app.post('/api/ai/analyze-label', authenticateToken, async (req, res) => {
    const { base64Image, lang = 'it' } = req.body;
    const langName = getLanguageName(lang);
    try {
        const response = await anthropic.messages.create({
            model: MODEL, max_tokens: 1024,
            system: `Sei un sommelier professionista. Estrai dati tecnici dall'etichetta del vino e rispondi ESCLUSIVAMENTE in JSON valido in ${langName}. Nessun testo aggiuntivo, solo JSON.\nSchema JSON richiesto: {"name": string, "producer": string, "year": string, "type": string, "region": string, "grape": string, "alcohol": string, "storageTemp": string, "storageAdvice": string, "servingTemp": string, "servingAdvice": string, "foodPairings": string[], "price": number, "drinkWindow": string, "marketPrice": number}`,
            messages: [{ role: 'user', content: [
                { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: cleanBase64(base64Image) } },
                { type: 'text', text: `Analizza questa etichetta di vino in ${langName}. Rispondi solo in JSON.` }
            ]}]
        });
        res.json(JSON.parse(cleanJson(extractText(response))));
    } catch (err) { res.status(500).json({ error: err.message || 'Errore AI' }); }
});

app.post('/api/ai/suggest-pairing', authenticateToken, async (req, res) => {
    const { menu, guests, inventory, style, lang = 'it' } = req.body;
    const langName = getLanguageName(lang);
    const inventoryList = inventory.map(w => `ID: ${w.id}, Nome: ${w.name} (${w.year}), Tipo: ${w.type}`).join('\n');
    try {
        const response = await anthropic.messages.create({
            model: MODEL, max_tokens: 2048,
            system: `Sei un sommelier esperto. Rispondi ESCLUSIVAMENTE in JSON valido in ${langName}. Solo array JSON.\nSchema: array di {"courseName": string, "dishName": string, "options": [{"wineId": string|null, "wineName": string, "reasoning": string, "type": "owned"|"purchase", "servingTemp": string, "servingAdvice": string}]}`,
            messages: [{ role: 'user', content: `Menu: ${menu}. Ospiti: ${guests}. Inventario:\n${inventoryList}\nStile: ${style}. Rispondi SOLO con l'array JSON.` }]
        });
        res.json(JSON.parse(cleanJson(extractText(response) || '[]')));
    } catch (err) { res.status(500).json({ error: err.message || 'Errore Sommelier' }); }
});

app.post('/api/ai/analyze-purchase', authenticateToken, async (req, res) => {
    const { input, inputPrice, inventory, lang = 'it' } = req.body;
    const langName = getLanguageName(lang);
    const inventoryContext = inventory.map(w => `${w.quantity}x ${w.name} (${w.type})`).join(', ');
    try {
        const contentParts = [];
        if (input.type === 'image') {
            contentParts.push({ type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: cleanBase64(input.data) } });
        } else {
            contentParts.push({ type: 'text', text: input.data });
        }
        contentParts.push({ type: 'text', text: `Prezzo offerto: €${inputPrice}. Cantina attuale: ${inventoryContext || 'vuota'}. Analizza in ${langName}. Rispondi SOLO in JSON.` });
        const response = await anthropic.messages.create({
            model: MODEL, max_tokens: 2048,
            system: `Agisci come Broker di vini e Sommelier professionista. Il campo 'qualityScore' è da 0 a 100 INDIPENDENTEMENTE DAL PREZZO.\nSchema JSON: {"wineDetails": {"name": string, "producer": string, "year": string, "type": string, "region": string, "grape": string, "alcohol": string, "foodPairings": string[]}, "marketPriceEstimate": number, "isGoodDeal": boolean, "dealRating": "Excellent"|"Good"|"Fair"|"Bad", "qualityScore": number, "sommelierNotes": string, "cellarFit": {"isRecommended": boolean, "reasoning": string}}`,
            messages: [{ role: 'user', content: contentParts }]
        });
        res.json(JSON.parse(cleanJson(extractText(response))));
    } catch (err) { res.status(500).json({ error: err.message || 'Errore Shop Advisor' }); }
});

app.post('/api/ai/suggest-restaurant-pairing', authenticateToken, async (req, res) => {
    const { menuSource, dish, lang = 'it' } = req.body;
    const langName = getLanguageName(lang);
    try {
        const contentParts = [];
        if (menuSource.type === 'images') {
            for (const img of menuSource.data) {
                contentParts.push({ type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: cleanBase64(img) } });
            }
        } else {
            contentParts.push({ type: 'text', text: menuSource.data });
        }
        contentParts.push({ type: 'text', text: `Scegli i migliori vini per: ${dish}. Max 2 per fascia (Economica/Media/Alta) o 3 totali se carta piccola. Rispondi in ${langName} solo JSON.` });
        const response = await anthropic.messages.create({
            model: MODEL, max_tokens: 2048,
            system: `Sommelier Digitale. Calcola matchScore 0-100 per ogni vino. Rispondi SOLO in JSON.\nSchema: [{"name": string, "producer": string, "year": string, "type": string, "price": number, "matchScore": number, "reasoning": string, "priceCategory": "Fascia Economica"|"Fascia Media"|"Fascia Alta"}]`,
            messages: [{ role: 'user', content: contentParts }]
        });
        res.json(JSON.parse(cleanJson(extractText(response) || '[]')));
    } catch (err) { res.status(500).json({ error: err.message || 'Errore analisi carta vini' }); }
});

app.post('/api/ai/analyze-restaurant', authenticateToken, async (req, res) => {
    const { wineList, foodMenu, lang = 'it' } = req.body;
    const langName = getLanguageName(lang);
    try {
        const response = await anthropic.messages.create({
            model: MODEL, max_tokens: 3000,
            system: `Master Sommelier. Il campo 'score' è da 0.0 a 10.0 MAX.\nSchema JSON: {"score": number, "summary": string, "strengths": string[], "weaknesses": string[], "courseDetails": [{"course": string, "feedback": string, "bestMatches": string[], "unsuitableWines": string[], "missingStyles": string[]}], "strategicAdvice": string}`,
            messages: [{ role: 'user', content: `Audit Tecnico in ${langName}.\nCARTA VINI: ${wineList}\nMENU: ${foodMenu}` }]
        });
        const result = JSON.parse(cleanJson(extractText(response)));
        res.json({ ...result, generatedAt: new Date().toISOString() });
    } catch (err) { res.status(500).json({ error: 'Errore analisi professionale' }); }
});

app.post('/api/ai/extract-text', authenticateToken, async (req, res) => {
    const { base64Data, mimeType } = req.body;
    try {
        const isImage = mimeType.startsWith('image/');
        const contentParts = isImage
            ? [
                { type: 'image', source: { type: 'base64', media_type: mimeType, data: cleanBase64(base64Data) } },
                { type: 'text', text: 'OCR PROFESSIONALE. Estrai il testo mantenendo struttura e prezzi.' }
              ]
            : [{ type: 'text', text: `Estrai il testo dal contenuto (${mimeType}): ${base64Data}` }];
        const response = await anthropic.messages.create({
            model: MODEL, max_tokens: 4096,
            messages: [{ role: 'user', content: contentParts }]
        });
        res.json({ text: extractText(response) });
    } catch (err) { res.status(500).json({ error: 'Errore lettura media' }); }
});

app.post('/api/ai/cellar-report', authenticateToken, async (req, res) => {
    const { inventory, history, lang = 'it' } = req.body;
    const langName = getLanguageName(lang);
    const inventoryText = inventory.map(w => `- ${w.name} (${w.year}), ${w.producer}, ${w.type}`).join('\n');
    try {
        const response = await anthropic.messages.create({
            model: MODEL, max_tokens: 2048,
            system: `Sommelier Senior. Rispondi ESCLUSIVAMENTE in JSON valido in ${langName}.\nSchema: {"overallAssessment": string, "palateProfile": string, "gapAnalysis": string, "buyRecommendations": [{"wineName": string, "reason": string, "type": string}], "drinkNowStrategy": string}`,
            messages: [{ role: 'user', content: `Analizza cantina in ${langName} solo JSON:\n${inventoryText}` }]
        });
        res.json(JSON.parse(cleanJson(extractText(response) || '{}')));
    } catch (err) { res.status(500).json({ error: err.message || 'Errore report' }); }
});

// --- EXISTING ENDPOINTS ---

app.get('/api/config', (req, res) => {
    res.json({ googleClientId: GOOGLE_CLIENT_ID || '' });
});

app.post('/api/auth/google', async (req, res) => {
    const token = req.body.token;
    const language = req.body.language;
    const ref = req.body.ref;
    if (!GOOGLE_CLIENT_ID || !token) return res.status(400).json({ error: 'Missing params' });
    try {
        const client = new OAuth2Client(GOOGLE_CLIENT_ID);
        const ticket = await client.verifyIdToken({ idToken: token, audience: GOOGLE_CLIENT_ID });
        const payload = ticket.getPayload();
        if (!payload || !payload.email) return res.status(400).json({ error: 'Invalid payload' });
        const { email, sub: googleId } = payload;
        let result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        let user = result.rows[0];
        if (!user) {
            const userId = 'u_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
            const newUserResult = await pool.query(
                "INSERT INTO users (id, email, google_id, role, is_premium, language, ref_restaurant_slug) VALUES ($1, $2, $3, 'user', FALSE, $4, $5) RETURNING *",
                [userId, email, googleId, language || 'it', ref || null]
            );
            user = newUserResult.rows[0];
        }
        const jwtToken = jwt.sign({ userId: user.id, email: user.email, role: user.role, isPremium: user.is_premium, language: user.language || 'it' }, JWT_SECRET, { expiresIn: '30d' });
        res.json({ token: jwtToken, user: { id: user.id, email: user.email, role: user.role, is_premium: user.is_premium, language: user.language || 'it' } });
    } catch (err) { res.status(500).json({ error: 'Google auth failed' }); }
});

app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        const user = result.rows[0];
        if (!user || !user.password || !(await bcrypt.compare(password, user.password))) return res.status(400).json({ error: 'Invalid credentials' });
        const token = jwt.sign({ userId: user.id, email: user.email, role: user.role, isPremium: user.is_premium, language: user.language || 'it' }, JWT_SECRET, { expiresIn: '30d' });
        res.json({ token, user: { id: user.id, email: user.email, role: user.role, is_premium: user.is_premium, language: user.language || 'it' } });
    } catch (err) { res.status(500).json({ error: 'Login failed' }); }
});

app.get('/api/users/me', authenticateToken, async (req, res) => {
    try {
        const userResult = await pool.query('SELECT id, email, role, is_premium, language, ai_usage_count FROM users WHERE id = $1', [req.user.userId]);
        const user = userResult.rows[0];
        if (!user) return res.status(404).json({ error: 'User not found' });
        const restResult = await pool.query(`SELECT r.*, (SELECT COUNT(*) FROM users WHERE ref_restaurant_slug = r.slug) as user_count, (SELECT SUM(ai_usage_count) FROM users WHERE ref_restaurant_slug = r.slug) as total_ai_usage FROM restaurants r WHERE r.manager_id = $1`, [user.id]);
        if (restResult.rows[0]) {
            const rest = restResult.rows[0];
            if (typeof rest.menu_analysis === 'string') try { rest.menu_analysis = JSON.parse(rest.menu_analysis); } catch(e) {}
            user.managed_restaurant = rest;
        }
        res.json(user);
    } catch (err) { res.status(500).json({ error: 'Fetch failed' }); }
});

app.put('/api/managed-restaurant', authenticateToken, async (req, res) => {
    const { menu_context, food_menu, menu_analysis } = req.body;
    try {
        const updates = []; const values = []; let idx = 1;
        if (menu_context !== undefined) { updates.push(`menu_context = $${idx++}`); values.push(menu_context); }
        if (food_menu !== undefined) { updates.push(`food_menu = $${idx++}`); values.push(food_menu); }
        if (menu_analysis !== undefined) { updates.push(`menu_analysis = $${idx++}`); values.push(menu_analysis ? JSON.stringify(menu_analysis) : null); }
        if (updates.length === 0) return res.status(400).json({ error: 'No fields' });
        values.push(req.user.userId);
        const result = await pool.query(`UPDATE restaurants SET ${updates.join(', ')} WHERE manager_id = $${idx} RETURNING *`, values);
        if (result.rowCount === 0) return res.status(403).json({ error: 'Forbidden' });
        const fullResult = await pool.query(`SELECT r.*, (SELECT COUNT(*) FROM users WHERE ref_restaurant_slug = r.slug) as user_count, (SELECT SUM(ai_usage_count) FROM users WHERE ref_restaurant_slug = r.slug) as total_ai_usage FROM restaurants r WHERE r.id = $1`, [result.rows[0].id]);
        const rest = fullResult.rows[0];
        if (typeof rest.menu_analysis === 'string') try { rest.menu_analysis = JSON.parse(rest.menu_analysis); } catch(e) {}
        res.json({ success: true, restaurant: rest });
    } catch (err) { res.status(500).json({ error: 'Update failed' }); }
});

app.post('/api/users/track-ai', authenticateToken, async (req, res) => {
    try {
        await pool.query('UPDATE users SET ai_usage_count = ai_usage_count + 1 WHERE id = $1', [req.user.userId]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: 'Track failed' }); }
});

app.get('/api/search-prices', authenticateToken, async (req, res) => {
    const { query } = req.query;
    try {
        const response = await anthropic.messages.create({
            model: MODEL, max_tokens: 1024,
            system: 'Sei un esperto di prezzi vini. Rispondi ESCLUSIVAMENTE con un array JSON valido, nessun testo aggiuntivo.',
            messages: [{ role: 'user', content: `Stima i prezzi di mercato per: ${query}. Rispondi SOLO con: [{ "source": "Stima di mercato", "price": 12.34, "currency": "EUR", "link": "" }]` }]
        });
        res.json(JSON.parse(cleanJson(extractText(response))));
    } catch (err) { res.status(500).json({ error: 'Search failed' }); }
});

app.get('/api/wines', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM wines WHERE user_id = $1 ORDER BY created_at DESC', [req.user.userId]);
        res.json(result.rows.map(mapWineToFrontend));
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/wines', authenticateToken, async (req, res) => {
    const wine = req.body;
    try {
        await pool.query(
            `INSERT INTO wines (id, user_id, name, producer, year, type, region, grape, alcohol, purchase_date, price, quantity, location, storage_temp, storage_advice, serving_temp, serving_advice, food_pairings, image_url, drink_window, market_price)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)`,
            [wine.id, req.user.userId, wine.name, wine.producer, wine.year, wine.type, wine.region, wine.grape, wine.alcohol, wine.purchaseDate, wine.price, wine.quantity, wine.location, wine.storageTemp, wine.storageAdvice, wine.servingTemp, wine.servingAdvice, wine.foodPairings, wine.imageUrl, wine.drinkWindow, wine.marketPrice]
        );
        res.status(201).json(wine);
    } catch (err) { res.status(500).json({ error: 'Failed' }); }
});

app.put('/api/wines/:id', authenticateToken, async (req, res) => {
    const updates = req.body;
    const fields = Object.keys(updates).map((key, i) => `${key.replace(/[A-Z]/g, l => `_${l.toLowerCase()}`)} = $${i + 1}`).join(', ');
    const values = Object.values(updates);
    try {
        await pool.query(`UPDATE wines SET ${fields} WHERE id = $${values.length + 1} AND user_id = $${values.length + 2}`, [...values, req.params.id, req.user.userId]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: 'Failed' }); }
});

app.delete('/api/wines/:id', authenticateToken, async (req, res) => {
    try {
        await pool.query('DELETE FROM wines WHERE id = $1 AND user_id = $2', [req.params.id, req.user.userId]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: 'Failed' }); }
});

app.get('/api/history', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM history WHERE user_id = $1 ORDER BY consumed_date DESC', [req.user.userId]);
        res.json(result.rows.map(h => ({
            id: h.id, wineId: h.wine_id, name: h.name, producer: h.producer, year: h.year, type: h.type,
            price: parseFloat(h.price) || 0, imageUrl: h.image_url, consumedDate: h.consumed_date,
            rating: h.rating || 0, notes: h.notes || '', location: h.location || 'Cantina'
        })));
    } catch (err) { res.status(500).json({ error: 'Failed' }); }
});

app.post('/api/history', authenticateToken, async (req, res) => {
    const h = req.body;
    try {
        await pool.query(
            `INSERT INTO history (id, user_id, wine_id, name, producer, year, type, price, image_url, consumed_date, rating, notes, location)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
            [h.id, req.user.userId, h.wineId, h.name, h.producer, h.year, h.type, h.price, h.imageUrl, h.consumedDate, h.rating || 0, h.notes || '', h.location || 'Cantina']
        );
        res.status(201).json(h);
    } catch (err) { res.status(500).json({ error: 'Failed' }); }
});

app.put('/api/history/:id', authenticateToken, async (req, res) => {
    const { rating, notes, location } = req.body;
    try {
        await pool.query('UPDATE history SET rating = $1, notes = $2, location = $3 WHERE id = $4 AND user_id = $5', [rating || 0, notes || '', location || '', req.params.id, req.user.userId]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: 'Failed' }); }
});

app.delete('/api/history/:id', authenticateToken, async (req, res) => {
    try {
        await pool.query('DELETE FROM history WHERE id = $1 AND user_id = $2', [req.params.id, req.user.userId]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: 'Failed to delete history entry' }); }
});

app.get('/api/locations', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM locations WHERE user_id = $1', [req.user.userId]);
        res.json(result.rows);
    } catch (err) { res.status(500).json({ error: 'Failed' }); }
});

app.post('/api/locations', authenticateToken, async (req, res) => {
    const { id, name } = req.body;
    try {
        await pool.query('INSERT INTO locations (id, user_id, name) VALUES ($1, $2, $3)', [id, req.user.userId, name]);
        res.status(201).json({ id, name });
    } catch (err) { res.status(500).json({ error: 'Failed' }); }
});

app.delete('/api/locations/:id', authenticateToken, async (req, res) => {
    try {
        await pool.query('DELETE FROM locations WHERE id = $1 AND user_id = $2', [req.params.id, req.user.userId]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: 'Failed' }); }
});

app.get('/api/users', authenticateAdmin, async (req, res) => {
    try {
        const result = await pool.query(`SELECT u.id, u.email, u.role, u.is_premium, u.language, u.ai_usage_count, u.ref_restaurant_slug, COALESCE((SELECT SUM(quantity) FROM wines WHERE user_id = u.id), 0) as wine_count FROM users u ORDER BY created_at DESC`);
        res.json(result.rows);
    } catch (err) { res.status(500).json({ error: 'Failed' }); }
});

app.get('/api/admin/restaurants', authenticateAdmin, async (req, res) => {
    try {
        const result = await pool.query(`SELECT r.*, u.email as manager_email, (SELECT COUNT(*) FROM users WHERE ref_restaurant_slug = r.slug) as user_count, (SELECT SUM(ai_usage_count) FROM users WHERE ref_restaurant_slug = r.slug) as total_ai_usage FROM restaurants r LEFT JOIN users u ON r.manager_id = u.id ORDER BY r.created_at DESC`);
        res.json(result.rows);
    } catch (err) { res.status(500).json({ error: 'Failed' }); }
});

app.post('/api/admin/restaurants', authenticateAdmin, async (req, res) => {
    const { id, name, slug, menu_context, food_menu, manager_id, menu_analysis } = req.body;
    const restId = id || 'r_' + Math.random().toString(36).substr(2, 9);
    try {
        await pool.query(
            `INSERT INTO restaurants (id, name, slug, menu_context, food_menu, manager_id, menu_analysis) VALUES ($1, $2, $3, $4, $5, $6, $7)
             ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, slug = EXCLUDED.slug, menu_context = EXCLUDED.menu_context, food_menu = EXCLUDED.food_menu, manager_id = EXCLUDED.manager_id, menu_analysis = EXCLUDED.menu_analysis`,
            [restId, name, slug, menu_context, food_menu, manager_id || null, menu_analysis ? JSON.stringify(menu_analysis) : null]
        );
        res.json({ success: true });
    } catch (err) {
        console.error('Admin Restaurant Save Error:', err);
        res.status(500).json({ error: 'Save failed' });
    }
});

app.get('/api/restaurants/:slug', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM restaurants WHERE slug = $1', [req.params.slug]);
        res.json(result.rows[0]);
    } catch (err) { res.status(500).json({ error: 'Failed' }); }
});

app.post('/api/shares', async (req, res) => {
    const id = Math.random().toString(36).substr(2, 8);
    try {
        await pool.query('INSERT INTO shares (id, data) VALUES ($1, $2)', [id, req.body.data]);
        res.json({ id });
    } catch (err) { res.status(500).json({ error: 'Failed' }); }
});

app.get('/api/shares/:id', async (req, res) => {
    try {
        const result = await pool.query('SELECT data FROM shares WHERE id = $1', [req.params.id]);
        if (result.rows[0]) res.json(result.rows[0].data);
        else res.status(404).json({ error: 'Not found' });
    } catch (err) { res.status(500).json({ error: 'Failed' }); }
});

const distPath = path.resolve(__dirname, '../dist');
app.use(express.static(distPath));
app.get('*', (req, res) => res.sendFile(path.resolve(distPath, 'index.html')));

const initDb = async () => {
    const client = await pool.connect();
    try {
        await client.query(`CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, email TEXT UNIQUE NOT NULL, password TEXT, role TEXT DEFAULT 'user', is_premium BOOLEAN DEFAULT FALSE, language TEXT DEFAULT 'it', ai_usage_count INTEGER DEFAULT 0, google_id TEXT, ref_restaurant_slug TEXT, created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP);`);
        await client.query(`CREATE TABLE IF NOT EXISTS wines (id TEXT PRIMARY KEY, user_id TEXT REFERENCES users(id) ON DELETE CASCADE, name TEXT NOT NULL, producer TEXT, year TEXT, type TEXT, region TEXT, grape TEXT, alcohol TEXT, purchase_date TEXT, price DECIMAL, quantity INTEGER DEFAULT 1, location TEXT, storage_temp TEXT, storage_advice TEXT, serving_temp TEXT, serving_advice TEXT, food_pairings TEXT[], image_url TEXT, drink_window TEXT, market_price DECIMAL, created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP);`);
        await client.query(`CREATE TABLE IF NOT EXISTS history (id TEXT PRIMARY KEY, user_id TEXT REFERENCES users(id) ON DELETE CASCADE, wine_id TEXT, name TEXT, producer TEXT, year TEXT, type TEXT, price DECIMAL, image_url TEXT, consumed_date TEXT, rating INTEGER DEFAULT 0, notes TEXT, location TEXT, created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP);`);
        await client.query(`CREATE TABLE IF NOT EXISTS locations (id TEXT PRIMARY KEY, user_id TEXT REFERENCES users(id) ON DELETE CASCADE, name TEXT NOT NULL);`);
        await client.query(`CREATE TABLE IF NOT EXISTS restaurants (id TEXT PRIMARY KEY, slug TEXT UNIQUE NOT NULL, name TEXT NOT NULL, menu_context TEXT, food_menu TEXT, menu_analysis JSONB, manager_id TEXT REFERENCES users(id) ON DELETE SET NULL, created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP);`);
        await client.query(`CREATE TABLE IF NOT EXISTS shares (id TEXT PRIMARY KEY, data JSONB NOT NULL, created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP);`);
        await client.query(`ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS food_menu TEXT;`);
        await client.query(`ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS menu_analysis JSONB;`);
        console.log('DB Ready');
    } catch (e) { console.error('DB Init Error', e); }
    finally { client.release(); }
};

app.listen(PORT, () => { console.log(`Server on port ${PORT}`); initDb(); });