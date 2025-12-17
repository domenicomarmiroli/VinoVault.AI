
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
import { GoogleGenAI } from "@google/genai";

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

// --- STATIC FILES SERVING ---
const distPath = path.resolve(__dirname, '../dist');
const publicPath = path.resolve(process.cwd(), 'public');

app.use(express.static(distPath));
app.use(express.static(publicPath));

// Database Connection with Timeout
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  connectionTimeoutMillis: 10000, // Increased timeout
  idleTimeoutMillis: 30000,
});

// --- HEALTH CHECK ENDPOINT ---
app.get('/health', (req, res) => {
  res.status(200).send('OK');
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

// --- DB INITIALIZATION ---
const initDb = async () => {
  console.log("Initializing DB tables...");
  let client;
  try {
    client = await pool.connect();
    // 1. Users
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password TEXT,
        role TEXT DEFAULT 'user',
        is_premium BOOLEAN DEFAULT FALSE,
        language TEXT DEFAULT 'it',
        ai_usage_count INTEGER DEFAULT 0,
        google_id TEXT,
        ref_restaurant_slug TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2. Wines
    await client.query(`
      CREATE TABLE IF NOT EXISTS wines (
        id TEXT PRIMARY KEY,
        user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        producer TEXT,
        year TEXT,
        type TEXT,
        region TEXT,
        grape TEXT,
        alcohol TEXT,
        purchase_date TEXT,
        price DECIMAL,
        quantity INTEGER DEFAULT 1,
        location TEXT,
        storage_temp TEXT,
        storage_advice TEXT,
        serving_temp TEXT,
        serving_advice TEXT,
        food_pairings TEXT[],
        image_url TEXT,
        drink_window TEXT,
        market_price DECIMAL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 3. History
    await client.query(`
      CREATE TABLE IF NOT EXISTS history (
        id TEXT PRIMARY KEY,
        user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
        wine_id TEXT,
        name TEXT,
        producer TEXT,
        year TEXT,
        type TEXT,
        price DECIMAL,
        image_url TEXT,
        consumed_date TEXT,
        rating INTEGER DEFAULT 0,
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 4. Locations
    await client.query(`
      CREATE TABLE IF NOT EXISTS locations (
        id TEXT PRIMARY KEY,
        user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
        name TEXT NOT NULL
      );
    `);

    // 5. Restaurants
    await client.query(`
      CREATE TABLE IF NOT EXISTS restaurants (
        id TEXT PRIMARY KEY,
        slug TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        menu_context TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // MIGRATIONS: Add new columns if they don't exist
    try {
        await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'it';`);
        await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT FALSE;`);
        await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS ai_usage_count INTEGER DEFAULT 0;`);
        await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id TEXT;`);
        await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS ref_restaurant_slug TEXT;`);
        
        await client.query(`ALTER TABLE wines ADD COLUMN IF NOT EXISTS storage_temp TEXT;`);
        await client.query(`ALTER TABLE wines ADD COLUMN IF NOT EXISTS storage_advice TEXT;`);
        await client.query(`ALTER TABLE wines ADD COLUMN IF NOT EXISTS serving_temp TEXT;`);
        await client.query(`ALTER TABLE wines ADD COLUMN IF NOT EXISTS serving_advice TEXT;`);
        await client.query(`ALTER TABLE wines ADD COLUMN IF NOT EXISTS food_pairings TEXT[];`);
        await client.query(`ALTER TABLE wines ADD COLUMN IF NOT EXISTS image_url TEXT;`);
        await client.query(`ALTER TABLE wines ADD COLUMN IF NOT EXISTS drink_window TEXT;`);
        await client.query(`ALTER TABLE wines ADD COLUMN IF NOT EXISTS market_price DECIMAL;`);
    } catch (e) {
        console.log("Migration check skipped/error (non-fatal):", e.message);
    }

    console.log("Database tables checked/created successfully.");
  } catch (error) {
    console.error("Error initializing database tables:", error);
  } finally {
    if (client) client.release();
  }
};

// --- AUTH ROUTES ---
app.post('/api/auth/register', async (req, res) => {
    const { email, password, language, ref } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const userId = Date.now().toString(36) + Math.random().toString(36).substr(2);
        const userLang = language || 'it';
        const userRef = ref || null;

        await pool.query(
            "INSERT INTO users (id, email, password, role, is_premium, language, ref_restaurant_slug) VALUES ($1, $2, $3, 'user', FALSE, $4, $5)",
            [userId, email, hashedPassword, userLang, userRef]
        );

        await pool.query(`
            INSERT INTO locations (id, user_id, name) VALUES 
            ($1, $2, 'Cantina'),
            ($3, $2, 'Frigo Cucina'),
            ($4, $2, 'Scaffale')
        `, [userId + '_l1', userId, userId + '_l2', userId + '_l3']);

        const token = jwt.sign(
            { userId, email, role: 'user', isPremium: false, language: userLang }, 
            JWT_SECRET, 
            { expiresIn: '30d' }
        );
        res.json({ token, user: { id: userId, email, role: 'user', is_premium: false, language: userLang } });

    } catch (err) {
        if (err.code === '23505') return res.status(400).json({ error: 'Email already exists' });
        res.status(500).json({ error: 'Registration failed' });
    }
});

app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        const user = result.rows[0];

        if (!user) return res.status(400).json({ error: 'User not found' });

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) return res.status(400).json({ error: 'Invalid password' });

        const token = jwt.sign(
            { userId: user.id, email: user.email, role: user.role, isPremium: user.is_premium, language: user.language || 'it' }, 
            JWT_SECRET, 
            { expiresIn: '30d' }
        );
        res.json({ token, user: { id: user.id, email: user.email, role: user.role, is_premium: user.is_premium, language: user.language || 'it' } });
    } catch (err) {
        res.status(500).json({ error: 'Login failed' });
    }
});

app.post('/api/auth/google', async (req, res) => {
    const { token, clientId, language, ref } = req.body;
    try {
        const client = new OAuth2Client(clientId);
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: clientId,
        });
        const payload = ticket.getPayload();
        const email = payload.email;
        const googleId = payload.sub;
        
        let result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        let user = result.rows[0];
        let userId = '';
        let userLang = language || 'it';
        let userRef = ref || null;

        if (!user) {
             userId = Date.now().toString(36) + Math.random().toString(36).substr(2);
             await pool.query(
                "INSERT INTO users (id, email, google_id, role, is_premium, language, ref_restaurant_slug) VALUES ($1, $2, $3, 'user', FALSE, $4, $5)",
                [userId, email, googleId, userLang, userRef]
            );
            await pool.query(`
                INSERT INTO locations (id, user_id, name) VALUES 
                ($1, $2, 'Cantina'),
                ($3, $2, 'Frigo Cucina'),
                ($4, $2, 'Scaffale')
            `, [userId + '_l1', userId, userId + '_l2', userId + '_l3']);
            user = { id: userId, email, role: 'user', is_premium: false, language: userLang };
        } else {
             if (!user.google_id) {
                 await pool.query('UPDATE users SET google_id = $1 WHERE id = $2', [googleId, user.id]);
             }
             userLang = user.language || userLang;
        }

        const jwtToken = jwt.sign(
            { userId: user.id, email: user.email, role: user.role, isPremium: user.is_premium, language: userLang }, 
            JWT_SECRET, 
            { expiresIn: '30d' }
        );
        res.json({ token: jwtToken, user: { id: user.id, email: user.email, role: user.role, is_premium: user.is_premium, language: userLang } });

    } catch (err) {
        res.status(500).json({ error: 'Google authentication failed' });
    }
});

// --- USER ROUTES ---
app.get('/api/users/me', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT id, email, role, is_premium, language, ai_usage_count, created_at FROM users WHERE id = $1',
            [req.user.userId]
        );
        if (result.rows.length === 0) return res.sendStatus(404);
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch user profile' });
    }
});

app.put('/api/users/me/language', authenticateToken, async (req, res) => {
    const { language } = req.body;
    try {
        await pool.query('UPDATE users SET language = $1 WHERE id = $2', [language, req.user.userId]);
        res.json({ message: 'Language updated' });
    } catch (err) {
        res.status(500).json({ error: 'Update failed' });
    }
});

app.put('/api/users/me/password', authenticateToken, async (req, res) => {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) return res.status(400).json({error: "Password too short"});
    
    try {
        const hashed = await bcrypt.hash(newPassword, 10);
        await pool.query('UPDATE users SET password = $1 WHERE id = $2', [hashed, req.user.userId]);
        res.json({ message: 'Password updated' });
    } catch(err) {
        res.status(500).json({ error: 'Failed' });
    }
});

app.post('/api/users/track-ai', authenticateToken, async (req, res) => {
    try {
        await pool.query('UPDATE users SET ai_usage_count = ai_usage_count + 1 WHERE id = $1', [req.user.userId]);
        res.sendStatus(200);
    } catch (e) { res.sendStatus(500); }
});

// --- WINE ROUTES ---
app.get('/api/wines', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM wines WHERE user_id = $1 ORDER BY created_at DESC', [req.user.userId]);
        const mappedWines = result.rows.map(w => ({
            id: w.id,
            name: w.name,
            producer: w.producer,
            year: w.year,
            type: w.type,
            region: w.region,
            grape: w.grape,
            alcohol: w.alcohol,
            purchaseDate: w.purchase_date,
            price: parseFloat(w.price),
            quantity: w.quantity,
            location: w.location,
            storageTemp: w.storage_temp,
            storageAdvice: w.storage_advice,
            servingTemp: w.serving_temp,
            servingAdvice: w.serving_advice,
            foodPairings: w.food_pairings,
            imageUrl: w.image_url,
            drinkWindow: w.drink_window,
            marketPrice: parseFloat(w.market_price)
        }));
        res.json(mappedWines);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/wines', authenticateToken, async (req, res) => {
    const wine = req.body;
    try {
        await pool.query(
            `INSERT INTO wines (id, user_id, name, producer, year, type, region, grape, alcohol, purchase_date, price, quantity, location, storage_temp, storage_advice, serving_temp, serving_advice, food_pairings, image_url, drink_window, market_price)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)`,
            [
                wine.id, req.user.userId, wine.name, wine.producer, wine.year, wine.type, 
                wine.region, wine.grape, wine.alcohol, wine.purchaseDate, wine.price, 
                wine.quantity, wine.location, wine.storageTemp, wine.storageAdvice, 
                wine.servingTemp, wine.servingAdvice, wine.foodPairings, wine.imageUrl,
                wine.drinkWindow, wine.marketPrice
            ]
        );
        res.status(201).json(wine);
    } catch (err) {
        res.status(500).json({ error: 'Failed to add wine' });
    }
});

app.put('/api/wines/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const updates = req.body;
    const fields = Object.keys(updates).map((key, idx) => {
        const dbKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
        return `${dbKey} = $${idx + 2}`;
    });
    if (fields.length === 0) return res.sendStatus(200);
    try {
        await pool.query(
            `UPDATE wines SET ${fields.join(', ')} WHERE id = $1 AND user_id = $${Object.keys(updates).length + 2}`,
            [id, ...Object.values(updates), req.user.userId] 
        );
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Update failed' });
    }
});

app.delete('/api/wines/:id', authenticateToken, async (req, res) => {
    try {
        await pool.query('DELETE FROM wines WHERE id = $1 AND user_id = $2', [req.params.id, req.user.userId]);
        res.sendStatus(200);
    } catch (err) {
        res.status(500).json({ error: 'Delete failed' });
    }
});

// --- HISTORY ROUTES ---
app.get('/api/history', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM history WHERE user_id = $1 ORDER BY consumed_date DESC', [req.user.userId]);
        const mapped = result.rows.map(r => ({
            id: r.id,
            wineId: r.wine_id,
            name: r.name,
            producer: r.producer,
            year: r.year,
            type: r.type,
            price: parseFloat(r.price),
            imageUrl: r.image_url,
            consumedDate: r.consumed_date,
            rating: r.rating,
            notes: r.notes
        }));
        res.json(mapped);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/history', authenticateToken, async (req, res) => {
    const h = req.body;
    try {
        await pool.query(
            `INSERT INTO history (id, user_id, wine_id, name, producer, year, type, price, image_url, consumed_date, rating, notes)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
            [h.id, req.user.userId, h.wineId, h.name, h.producer, h.year, h.type, h.price, h.imageUrl, h.consumedDate, h.rating, h.notes]
        );
        res.status(201).json(h);
    } catch (err) {
        res.status(500).json({ error: 'Failed to add history' });
    }
});

app.put('/api/history/:id', authenticateToken, async (req, res) => {
    const { rating, notes } = req.body;
    try {
        await pool.query('UPDATE history SET rating = $1, notes = $2 WHERE id = $3 AND user_id = $4', [rating, notes, req.params.id, req.user.userId]);
        res.sendStatus(200);
    } catch (err) {
        res.status(500).json({ error: 'Update failed' });
    }
});

// NEW: Delete individual history entry
app.delete('/api/history/:id', authenticateToken, async (req, res) => {
    try {
        await pool.query('DELETE FROM history WHERE id = $1 AND user_id = $2', [req.params.id, req.user.userId]);
        res.sendStatus(200);
    } catch (err) {
        res.status(500).json({ error: 'Delete failed' });
    }
});

app.delete('/api/history', authenticateToken, async (req, res) => {
    try {
        await pool.query('DELETE FROM history WHERE user_id = $1', [req.user.userId]);
        res.sendStatus(200);
    } catch (err) { res.status(500).json({ error: 'Delete failed' }); }
});

// --- LOCATION ROUTES ---
app.get('/api/locations', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM locations WHERE user_id = $1', [req.user.userId]);
        res.json(result.rows);
    } catch (err) { res.status(500).json({ error: 'Fetch failed' }); }
});

app.post('/api/locations', authenticateToken, async (req, res) => {
    const { id, name } = req.body;
    try {
        await pool.query('INSERT INTO locations (id, user_id, name) VALUES ($1, $2, $3)', [id, req.user.userId, name]);
        res.sendStatus(201);
    } catch (err) { res.status(500).json({ error: 'Add failed' }); }
});

app.delete('/api/locations/:id', authenticateToken, async (req, res) => {
    try {
        await pool.query('DELETE FROM locations WHERE id = $1 AND user_id = $2', [req.params.id, req.user.userId]);
        res.sendStatus(200);
    } catch (err) { res.status(500).json({ error: 'Delete failed' }); }
});

// --- RESTAURANT PUBLIC ROUTES ---
app.get('/api/restaurants/:ref', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM restaurants WHERE slug = $1', [req.params.ref]);
        if (result.rows.length > 0) {
            res.json(result.rows[0]);
        } else {
            res.json(null);
        }
    } catch (e) { res.status(500).json({error: "Error fetching restaurant"}); }
});

// --- PRICE SEARCH ROUTE ---
app.get('/api/search-prices', authenticateToken, async (req, res) => {
    const { query } = req.query;
    if (!query) return res.status(400).json({ error: 'Query required' });
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Cerca online i prezzi attuali per: "${query}".
            Restituisci un array JSON contenente dai 3 ai 5 negozi che vendono questo vino.
            Schema oggetto: { "source": "Nome Negozio", "price": numero }`,
            config: { tools: [{ googleSearch: {} }] }
        });
        let jsonText = response.text || "[]";
        jsonText = jsonText.replace(/```json/g, '').replace(/```/g, '').trim();
        let data = [];
        try {
            const match = jsonText.match(/\[.*\]/s);
            data = match ? JSON.parse(match[0]) : JSON.parse(jsonText);
        } catch (e) { console.error("JSON Parse Error:", jsonText); }
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: 'Search failed' });
    }
});

// --- ADMIN ROUTES ---
app.get('/api/users', authenticateAdmin, async (req, res) => {
    try {
        const result = await pool.query('SELECT id, email, role, is_premium, ai_usage_count, ref_restaurant_slug, created_at FROM users ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (e) { res.sendStatus(500); }
});

app.delete('/api/users/:id', authenticateAdmin, async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const userId = req.params.id;
        await client.query('DELETE FROM wines WHERE user_id = $1', [userId]);
        await client.query('DELETE FROM history WHERE user_id = $1', [userId]);
        await client.query('DELETE FROM locations WHERE user_id = $1', [userId]);
        const result = await client.query('DELETE FROM users WHERE id = $1', [userId]);
        await client.query('COMMIT');
        if (result.rowCount === 0) res.status(404).json({ error: "User not found" });
        else res.sendStatus(200);
    } catch (e) {
        await client.query('ROLLBACK');
        res.status(500).json({ error: e.message });
    } finally { client.release(); }
});

app.put('/api/users/:id/premium', authenticateAdmin, async (req, res) => {
    try {
        await pool.query('UPDATE users SET is_premium = NOT is_premium WHERE id = $1', [req.params.id]);
        res.sendStatus(200);
    } catch (e) { res.sendStatus(500); }
});

app.get('/api/admin/restaurants', authenticateAdmin, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT r.*, COUNT(u.id) as user_count, COALESCE(SUM(u.ai_usage_count), 0) as total_ai_usage
            FROM restaurants r LEFT JOIN users u ON u.ref_restaurant_slug = r.slug
            GROUP BY r.id ORDER BY r.created_at DESC`);
        const rows = result.rows.map(r => ({
            ...r, user_count: parseInt(r.user_count || 0), total_ai_usage: parseInt(r.total_ai_usage || 0)
        }));
        res.json(rows);
    } catch(e) { res.sendStatus(500); }
});

app.post('/api/admin/restaurants', authenticateAdmin, async (req, res) => {
    const { id, name, slug, menu_context } = req.body;
    try {
        if (id) await pool.query('UPDATE restaurants SET name=$1, slug=$2, menu_context=$3 WHERE id=$4', [name, slug, menu_context, id]);
        else {
             const newId = Date.now().toString(36);
             await pool.query('INSERT INTO restaurants (id, name, slug, menu_context) VALUES ($1, $2, $3, $4)', [newId, name, slug, menu_context]);
        }
        res.sendStatus(200);
    } catch(e) { res.sendStatus(500); }
});

app.delete('/api/admin/restaurants/:id', authenticateAdmin, async (req, res) => {
    try {
        await pool.query('DELETE FROM restaurants WHERE id = $1', [req.params.id]);
        res.sendStatus(200);
    } catch(e) { res.sendStatus(500); }
});

app.get('/api/config', (req, res) => {
    res.json({ googleClientId: GOOGLE_CLIENT_ID || '' });
});

app.get('*', (req, res) => {
  res.sendFile(path.resolve(distPath, 'index.html'));
});

const startServer = () => {
  app.listen(PORT, () => console.log(`Server listening on ${PORT}`));
  if (process.env.DATABASE_URL) {
    initDb().catch(e => console.error("Background DB Init failed:", e));
  } else console.warn("DATABASE_URL not found, skipping DB init.");
};

startServer();
