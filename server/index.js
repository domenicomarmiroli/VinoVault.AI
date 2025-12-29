
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
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_wine_key_change_me';
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// --- DATABASE ---
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// --- AUTH MIDDLEWARE ---
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.sendStatus(401);
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

const authenticateAdmin = (req, res, next) => {
    authenticateToken(req, res, () => {
        if (req.user && req.user.role === 'admin') {
            next();
        } else {
            res.status(403).json({ error: 'Access denied: Admins only' });
        }
    });
};

// --- API ROUTES ---

// Config
app.get('/api/config', (req, res) => {
    res.json({ googleClientId: GOOGLE_CLIENT_ID || '' });
});

// Auth
app.post('/api/auth/google', async (req, res) => {
    const token = req.body.token;
    const language = req.body.language;
    const ref = req.body.ref;

    if (!GOOGLE_CLIENT_ID) return res.status(500).json({ error: 'Google Client ID missing' });
    if (!token) return res.status(400).json({ error: 'Google token missing' });

    try {
        const client = new OAuth2Client(GOOGLE_CLIENT_ID);
        const ticket = await client.verifyIdToken({ idToken: token, audience: GOOGLE_CLIENT_ID });
        const payload = ticket.getPayload();
        if (!payload || !payload.email) return res.status(400).json({ error: 'Invalid Google payload' });
        
        const { email, sub: googleId, email_verified } = payload;
        if (!email_verified) return res.status(401).json({ error: 'Email not verified' });

        let result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        let user = result.rows[0];

        if (!user) {
            const userId = 'u_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
            const newUserResult = await pool.query(
                "INSERT INTO users (id, email, google_id, role, is_premium, language, ref_restaurant_slug) VALUES ($1, $2, $3, 'user', FALSE, $4, $5) RETURNING *",
                [userId, email, googleId, language || 'it', ref || null]
            );
            user = newUserResult.rows[0];
        } else if (user.google_id !== googleId) {
            await pool.query('UPDATE users SET google_id = $1 WHERE id = $2', [googleId, user.id]);
            user.google_id = googleId;
        }

        const jwtToken = jwt.sign({ 
            userId: user.id, 
            email: user.email, 
            role: user.role, 
            isPremium: user.is_premium, 
            language: user.language || 'it' 
        }, JWT_SECRET, { expiresIn: '30d' });

        res.json({ token: jwtToken, user: { id: user.id, email: user.email, role: user.role, is_premium: user.is_premium, language: user.language || 'it' } });
    } catch (err) {
        console.error("Auth error:", err);
        res.status(500).json({ error: 'Google auth failed' });
    }
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

app.post('/api/auth/register', async (req, res) => {
    const { email, password, language, ref } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const userId = 'u_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
        await pool.query(
            "INSERT INTO users (id, email, password, role, is_premium, language, ref_restaurant_slug) VALUES ($1, $2, $3, 'user', FALSE, $4, $5)",
            [userId, email, hashedPassword, language || 'it', ref || null]
        );
        const token = jwt.sign({ userId, email, role: 'user', isPremium: false, language: language || 'it' }, JWT_SECRET, { expiresIn: '30d' });
        res.json({ token, user: { id: userId, email: email, role: 'user', is_premium: false, language: language || 'it' } });
    } catch (err) {
        if (err.code === '23505') return res.status(400).json({ error: 'Email already exists' });
        res.status(500).json({ error: 'Registration failed' });
    }
});

// Price Search
app.get('/api/search-prices', authenticateToken, async (req, res) => {
    const { query } = req.query;
    if (!query) return res.status(400).json({ error: 'Query is required' });

    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Trova i prezzi online attuali per il seguente vino: ${query}. 
            Restituisci un array JSON di oggetti con questa struttura: 
            { "source": "Nome Sito", "price": 12.34, "currency": "EUR", "link": "URL" }. 
            Includi solo i risultati più rilevanti e affidabili.`,
            config: {
                tools: [{ googleSearch: {} }],
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            source: { type: Type.STRING },
                            price: { type: Type.NUMBER },
                            currency: { type: Type.STRING },
                            link: { type: Type.STRING }
                        },
                        required: ["source", "price", "currency", "link"]
                    }
                }
            }
        });

        res.json(JSON.parse(response.text || "[]"));
    } catch (err) {
        console.error("Search prices error:", err);
        res.status(500).json({ error: 'Search failed' });
    }
});

// Wines
app.get('/api/wines', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM wines WHERE user_id = $1 ORDER BY created_at DESC', [req.user.userId]);
        res.json(result.rows.map(w => ({
            id: w.id, name: w.name, producer: w.producer, year: w.year, type: w.type, region: w.region, 
            price: parseFloat(w.price), quantity: w.quantity, location: w.location, storageTemp: w.storage_temp,
            storageAdvice: w.storage_advice, servingTemp: w.serving_temp, servingAdvice: w.serving_advice,
            foodPairings: w.food_pairings, imageUrl: w.image_url, drinkWindow: w.drink_window, marketPrice: parseFloat(w.market_price)
        })));
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
    } catch (err) { res.status(500).json({ error: 'Failed to add wine' }); }
});

app.put('/api/wines/:id', authenticateToken, async (req, res) => {
    const updates = req.body;
    const fields = Object.keys(updates).map((key, i) => `${key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`)} = $${i + 1}`).join(', ');
    const values = Object.values(updates);
    try {
        await pool.query(`UPDATE wines SET ${fields} WHERE id = $${values.length + 1} AND user_id = $${values.length + 2}`, [...values, req.params.id, req.user.userId]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: 'Update failed' }); }
});

app.delete('/api/wines/:id', authenticateToken, async (req, res) => {
    try {
        await pool.query('DELETE FROM wines WHERE id = $1 AND user_id = $2', [req.params.id, req.user.userId]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: 'Delete failed' }); }
});

// History
app.get('/api/history', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM history WHERE user_id = $1 ORDER BY consumed_date DESC', [req.user.userId]);
        res.json(result.rows.map(h => ({ 
            ...h, 
            price: parseFloat(h.price), 
            consumedDate: h.consumed_date, 
            wineId: h.wine_id, 
            imageUrl: h.image_url,
            location: h.location
        })));
    } catch (err) { res.status(500).json({ error: 'Failed to fetch history' }); }
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
    } catch (err) { res.status(500).json({ error: 'Failed to save history' }); }
});

app.put('/api/history/:id', authenticateToken, async (req, res) => {
    const { rating, notes, location } = req.body;
    try {
        const result = await pool.query(
            'UPDATE history SET rating = $1, notes = $2, location = $3 WHERE id = $4 AND user_id = $5 RETURNING *', 
            [rating || 0, notes || '', location || '', req.params.id, req.user.userId]
        );
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Recensione non trovata per questo utente.' });
        }
        res.json({ success: true });
    } catch (err) { 
        console.error("Update history error:", err);
        res.status(500).json({ error: 'Update failed' }); 
    }
});

app.delete('/api/history/:id', authenticateToken, async (req, res) => {
    try {
        await pool.query('DELETE FROM history WHERE id = $1 AND user_id = $2', [req.params.id, req.user.userId]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: 'Delete failed' }); }
});

// Locations
app.get('/api/locations', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM locations WHERE user_id = $1', [req.user.userId]);
        res.json(result.rows);
    } catch (err) { res.status(500).json({ error: 'Failed to fetch locations' }); }
});

app.post('/api/locations', authenticateToken, async (req, res) => {
    const { id, name } = req.body;
    try {
        await pool.query('INSERT INTO locations (id, user_id, name) VALUES ($1, $2, $3)', [id, req.user.userId, name]);
        res.status(201).json({ id, name });
    } catch (err) { res.status(500).json({ error: 'Failed to add location' }); }
});

app.delete('/api/locations/:id', authenticateToken, async (req, res) => {
    try {
        await pool.query('DELETE FROM locations WHERE id = $1 AND user_id = $2', [req.params.id, req.user.userId]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: 'Delete failed' }); }
});

// Users & Profile
app.get('/api/users/me', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query('SELECT id, email, role, is_premium, language, ai_usage_count FROM users WHERE id = $1', [req.user.userId]);
        res.json(result.rows[0]);
    } catch (err) { res.status(500).json({ error: 'Fetch failed' }); }
});

app.put('/api/users/me/language', authenticateToken, async (req, res) => {
    try {
        await pool.query('UPDATE users SET language = $1 WHERE id = $2', [req.body.language, req.user.userId]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: 'Update failed' }); }
});

app.post('/api/users/track-ai', authenticateToken, async (req, res) => {
    try {
        await pool.query('UPDATE users SET ai_usage_count = ai_usage_count + 1 WHERE id = $1', [req.user.userId]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: 'Track failed' }); }
});

// --- ADMIN ROUTES ---

// Get all users
app.get('/api/users', authenticateAdmin, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT u.id, u.email, u.role, u.is_premium, u.language, u.ai_usage_count, u.ref_restaurant_slug,
            COALESCE((SELECT SUM(quantity) FROM wines WHERE user_id = u.id), 0) as wine_count
            FROM users u ORDER BY created_at DESC
        `);
        res.json(result.rows);
    } catch (err) { res.status(500).json({ error: 'Fetch failed' }); }
});

// Delete user
app.delete('/api/users/:id', authenticateAdmin, async (req, res) => {
    try {
        const check = await pool.query('SELECT role FROM users WHERE id = $1', [req.params.id]);
        if (check.rows[0]?.role === 'admin') return res.status(403).json({ error: 'Cannot delete admin' });

        await pool.query('DELETE FROM users WHERE id = $1', [req.params.id]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: 'Delete failed' }); }
});

// Toggle Premium
app.put('/api/users/:id/premium', authenticateAdmin, async (req, res) => {
    try {
        await pool.query('UPDATE users SET is_premium = NOT is_premium WHERE id = $1', [req.params.id]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: 'Update failed' }); }
});

// Reset Password
app.put('/api/users/:id/reset-password', authenticateAdmin, async (req, res) => {
    const { newPassword } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await pool.query('UPDATE users SET password = $1 WHERE id = $2', [hashedPassword, req.params.id]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: 'Reset failed' }); }
});

// Restaurants Management
app.get('/api/admin/restaurants', authenticateAdmin, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT r.*, u.email as manager_email,
            (SELECT COUNT(*) FROM users WHERE ref_restaurant_slug = r.slug) as user_count,
            (SELECT SUM(ai_usage_count) FROM users WHERE ref_restaurant_slug = r.slug) as total_ai_usage
            FROM restaurants r 
            LEFT JOIN users u ON r.manager_id = u.id
            ORDER BY r.created_at DESC
        `);
        res.json(result.rows);
    } catch (err) { res.status(500).json({ error: 'Fetch failed' }); }
});

app.post('/api/admin/restaurants', authenticateAdmin, async (req, res) => {
    const { id, name, slug, menu_context, manager_id } = req.body;
    const restId = id || 'r_' + Math.random().toString(36).substr(2, 9);
    try {
        await pool.query(
            `INSERT INTO restaurants (id, name, slug, menu_context, manager_id) VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, slug = EXCLUDED.slug, menu_context = EXCLUDED.menu_context, manager_id = EXCLUDED.manager_id`,
            [restId, name, slug, menu_context, manager_id || null]
        );
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: 'Save failed' }); }
});

// B2B & Public
app.get('/api/restaurants/:slug', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM restaurants WHERE slug = $1', [req.params.slug]);
        res.json(result.rows[0]);
    } catch (err) { res.status(500).json({ error: 'Fetch failed' }); }
});

app.post('/api/shares', async (req, res) => {
    const id = Math.random().toString(36).substr(2, 8);
    try {
        await pool.query('INSERT INTO shares (id, data) VALUES ($1, $2)', [id, req.body.data]);
        res.json({ id });
    } catch (err) { res.status(500).json({ error: 'Share failed' }); }
});

app.get('/api/shares/:id', async (req, res) => {
    try {
        const result = await pool.query('SELECT data FROM shares WHERE id = $1', [req.params.id]);
        if (result.rows[0]) res.json(result.rows[0].data);
        else res.status(404).json({ error: 'Not found' });
    } catch (err) { res.status(500).json({ error: 'Fetch failed' }); }
});

// --- STATIC FILES & CATCH-ALL (MUST BE LAST) ---
const distPath = path.resolve(__dirname, '../dist');
app.use(express.static(distPath));

app.get('*', (req, res) => {
    res.sendFile(path.resolve(distPath, 'index.html'));
});

// DB Init & Start
const initDb = async () => {
    const client = await pool.connect();
    try {
        await client.query(`CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, email TEXT UNIQUE NOT NULL, password TEXT, role TEXT DEFAULT 'user', is_premium BOOLEAN DEFAULT FALSE, language TEXT DEFAULT 'it', ai_usage_count INTEGER DEFAULT 0, google_id TEXT, ref_restaurant_slug TEXT, created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP);`);
        await client.query(`ALTER TABLE users ALTER COLUMN password DROP NOT NULL;`);
        await client.query(`CREATE TABLE IF NOT EXISTS wines (id TEXT PRIMARY KEY, user_id TEXT REFERENCES users(id) ON DELETE CASCADE, name TEXT NOT NULL, producer TEXT, year TEXT, type TEXT, region TEXT, grape TEXT, alcohol TEXT, purchase_date TEXT, price DECIMAL, quantity INTEGER DEFAULT 1, location TEXT, storage_temp TEXT, storage_advice TEXT, serving_temp TEXT, serving_advice TEXT, food_pairings TEXT[], image_url TEXT, drink_window TEXT, market_price DECIMAL, created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP);`);
        await client.query(`CREATE TABLE IF NOT EXISTS history (id TEXT PRIMARY KEY, user_id TEXT REFERENCES users(id) ON DELETE CASCADE, wine_id TEXT, name TEXT, producer TEXT, year TEXT, type TEXT, price DECIMAL, image_url TEXT, consumed_date TEXT, rating INTEGER DEFAULT 0, notes TEXT, location TEXT, created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP);`);
        
        // MIGRATIONS
        await client.query(`ALTER TABLE history ADD COLUMN IF NOT EXISTS location TEXT;`);
        
        await client.query(`CREATE TABLE IF NOT EXISTS locations (id TEXT PRIMARY KEY, user_id TEXT REFERENCES users(id) ON DELETE CASCADE, name TEXT NOT NULL);`);
        
        await client.query(`CREATE TABLE IF NOT EXISTS restaurants (id TEXT PRIMARY KEY, slug TEXT UNIQUE NOT NULL, name TEXT NOT NULL, menu_context TEXT, created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP);`);
        await client.query(`ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS manager_id TEXT REFERENCES users(id) ON DELETE SET NULL;`);
        
        await client.query(`CREATE TABLE IF NOT EXISTS shares (id TEXT PRIMARY KEY, data JSONB NOT NULL, created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP);`);
        console.log("DB Ready");
    } catch (e) { console.error("DB Init Error", e); }
    finally { client.release(); }
};

app.listen(PORT, () => {
    console.log(`Server on port ${PORT}`);
    initDb();   
});
