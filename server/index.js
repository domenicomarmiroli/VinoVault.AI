
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

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

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
        if (req.user && req.user.role === 'admin') next();
        else res.status(403).json({ error: 'Admins only' });
    });
};

// --- RESTAURANT API ---

app.get('/api/my-restaurant', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM restaurants WHERE owner_id = $1', [req.user.userId]);
        res.json(result.rows[0] || null);
    } catch (err) { res.status(500).json({ error: 'Fetch failed' }); }
});

app.post('/api/my-restaurant', authenticateToken, async (req, res) => {
    const { name, slug, menu_context } = req.body;
    try {
        const result = await pool.query(
            `INSERT INTO restaurants (id, name, slug, menu_context, owner_id) 
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT (owner_id) DO UPDATE SET name = EXCLUDED.name, slug = EXCLUDED.slug, menu_context = EXCLUDED.menu_context
             RETURNING *`,
            ['r_' + Math.random().toString(36).substr(2, 9), name, slug, menu_context, req.user.userId]
        );
        res.json(result.rows[0]);
    } catch (err) { 
        if (err.code === '23505') return res.status(400).json({ error: 'Slug già in uso da un altro ristorante' });
        res.status(500).json({ error: 'Save failed' }); 
    }
});

// --- STANDARD API ---

app.get('/api/config', (req, res) => res.json({ googleClientId: GOOGLE_CLIENT_ID || '' }));

app.post('/api/auth/google', async (req, res) => {
    const { token, language, ref } = req.body;
    if (!GOOGLE_CLIENT_ID || !token) return res.status(400).json({ error: 'Missing data' });
    try {
        const client = new OAuth2Client(GOOGLE_CLIENT_ID);
        const ticket = await client.verifyIdToken({ idToken: token, audience: GOOGLE_CLIENT_ID });
        const payload = ticket.getPayload();
        const { email, sub: googleId } = payload;
        let result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        let user = result.rows[0];
        if (!user) {
            const userId = 'u_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
            const newUser = await pool.query(
                "INSERT INTO users (id, email, google_id, role, is_premium, language, ref_restaurant_slug) VALUES ($1, $2, $3, 'user', FALSE, $4, $5) RETURNING *",
                [userId, email, googleId, language || 'it', ref || null]
            );
            user = newUser.rows[0];
        }
        const jwtToken = jwt.sign({ userId: user.id, email: user.email, role: user.role, isPremium: user.is_premium, language: user.language || 'it' }, JWT_SECRET, { expiresIn: '30d' });
        res.json({ token: jwtToken, user });
    } catch (err) { res.status(500).json({ error: 'Google auth failed' }); }
});

app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        const user = result.rows[0];
        if (!user || !user.password || !(await bcrypt.compare(password, user.password))) return res.status(400).json({ error: 'Invalid credentials' });
        const token = jwt.sign({ userId: user.id, email: user.email, role: user.role, isPremium: user.is_premium, language: user.language || 'it' }, JWT_SECRET, { expiresIn: '30d' });
        res.json({ token, user });
    } catch (err) { res.status(500).json({ error: 'Login failed' }); }
});

app.post('/api/auth/register', async (req, res) => {
    const { email, password, language, ref, role } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const userId = 'u_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
        const finalRole = role === 'restaurant' ? 'restaurant' : 'user';
        await pool.query(
            "INSERT INTO users (id, email, password, role, is_premium, language, ref_restaurant_slug) VALUES ($1, $2, $3, $4, $5, $6, $7)",
            [userId, email, hashedPassword, finalRole, false, language || 'it', ref || null]
        );
        const token = jwt.sign({ userId, email, role: finalRole, isPremium: false, language: language || 'it' }, JWT_SECRET, { expiresIn: '30d' });
        res.json({ token, user: { id: userId, email, role: finalRole } });
    } catch (err) { res.status(500).json({ error: 'Registration failed' }); }
});

app.get('/api/users/me', authenticateToken, async (req, res) => {
    const result = await pool.query('SELECT id, email, role, is_premium, language FROM users WHERE id = $1', [req.user.userId]);
    res.json(result.rows[0]);
});

app.get('/api/wines', authenticateToken, async (req, res) => {
    const result = await pool.query('SELECT * FROM wines WHERE user_id = $1 ORDER BY created_at DESC', [req.user.userId]);
    res.json(result.rows);
});

app.post('/api/wines', authenticateToken, async (req, res) => {
    const wine = req.body;
    await pool.query(
        `INSERT INTO wines (id, user_id, name, producer, year, type, region, grape, alcohol, purchase_date, price, quantity, location, storage_temp, storage_advice, serving_temp, serving_advice, food_pairings, image_url, drink_window, market_price)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)`,
        [wine.id, req.user.userId, wine.name, wine.producer, wine.year, wine.type, wine.region, wine.grape, wine.alcohol, wine.purchaseDate, wine.price, wine.quantity, wine.location, wine.storageTemp, wine.storageAdvice, wine.servingTemp, wine.servingAdvice, wine.foodPairings, wine.imageUrl, wine.drinkWindow, wine.marketPrice]
    );
    res.status(201).json(wine);
});

app.get('/api/restaurants/:slug', async (req, res) => {
    const result = await pool.query('SELECT * FROM restaurants WHERE slug = $1', [req.params.slug]);
    res.json(result.rows[0]);
});

const distPath = path.resolve(__dirname, '../dist');
app.use(express.static(distPath));
app.get('*', (req, res) => res.sendFile(path.resolve(distPath, 'index.html')));

const initDb = async () => {
    const client = await pool.connect();
    try {
        await client.query(`CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, email TEXT UNIQUE NOT NULL, password TEXT, role TEXT DEFAULT 'user', is_premium BOOLEAN DEFAULT FALSE, language TEXT DEFAULT 'it', ai_usage_count INTEGER DEFAULT 0, google_id TEXT, ref_restaurant_slug TEXT, created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP);`);
        await client.query(`CREATE TABLE IF NOT EXISTS restaurants (id TEXT PRIMARY KEY, slug TEXT UNIQUE NOT NULL, name TEXT NOT NULL, menu_context TEXT, owner_id TEXT UNIQUE, created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP);`);
        await client.query(`CREATE TABLE IF NOT EXISTS wines (id TEXT PRIMARY KEY, user_id TEXT REFERENCES users(id) ON DELETE CASCADE, name TEXT NOT NULL, producer TEXT, year TEXT, type TEXT, region TEXT, grape TEXT, alcohol TEXT, purchase_date TEXT, price DECIMAL, quantity INTEGER DEFAULT 1, location TEXT, storage_temp TEXT, storage_advice TEXT, serving_temp TEXT, serving_advice TEXT, food_pairings TEXT[], image_url TEXT, drink_window TEXT, market_price DECIMAL, created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP);`);
        console.log("DB Ready");
    } finally { client.release(); }
};

app.listen(PORT, () => { console.log(`Server on port ${PORT}`); initDb(); });
