
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

// Aumentato limite per gestire le immagini caricate (anche se compresse)
app.use(express.json({ limit: '10mb' }));
app.use(cors());

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

// --- ADMIN API ---

app.get('/api/users', authenticateAdmin, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT u.id, u.email, u.role, u.is_premium, u.ref_restaurant_slug, u.ai_usage_count,
            (SELECT COUNT(*) FROM wines WHERE user_id = u.id) as wine_count
            FROM users u ORDER BY created_at DESC
        `);
        res.json(result.rows);
    } catch (err) { res.status(500).json({ error: 'Fetch users failed' }); }
});

app.delete('/api/users/:id', authenticateAdmin, async (req, res) => {
    try {
        await pool.query('DELETE FROM users WHERE id = $1 AND role != $2', [req.params.id, 'admin']);
        res.sendStatus(200);
    } catch (err) { res.status(500).json({ error: 'Delete failed' }); }
});

app.put('/api/users/:id/role', authenticateAdmin, async (req, res) => {
    const { role } = req.body;
    if (!['user', 'restaurant'].includes(role)) return res.status(400).json({ error: 'Invalid role' });
    try {
        await pool.query('UPDATE users SET role = $1 WHERE id = $2', [role, req.params.id]);
        res.sendStatus(200);
    } catch (err) { res.status(500).json({ error: 'Update failed' }); }
});

app.put('/api/users/:id/premium', authenticateAdmin, async (req, res) => {
    try {
        await pool.query('UPDATE users SET is_premium = NOT is_premium WHERE id = $1', [req.params.id]);
        res.sendStatus(200);
    } catch (err) { res.status(500).json({ error: 'Update failed' }); }
});

app.get('/api/admin/restaurants', authenticateAdmin, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT r.*, 
            (SELECT COUNT(*) FROM users WHERE ref_restaurant_slug = r.slug) as user_count
            FROM restaurants r ORDER BY created_at DESC
        `);
        res.json(result.rows);
    } catch (err) { res.status(500).json({ error: 'Fetch restaurants failed' }); }
});

// --- RESTAURANT API ---

app.get('/api/my-restaurant', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM restaurants WHERE owner_id = $1', [req.user.userId]);
        res.json(result.rows[0] || null);
    } catch (err) { res.status(500).json({ error: 'Fetch failed' }); }
});

app.post('/api/my-restaurant', authenticateToken, async (req, res) => {
    if (req.user.role !== 'restaurant' && req.user.role !== 'admin') return res.status(403).json({ error: 'Solo ristoranti abilitati' });
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
        if (err.code === '23505') return res.status(400).json({ error: 'Slug già in uso' });
        res.status(500).json({ error: 'Save failed' }); 
    }
});

// --- AUTH ---

app.post('/api/auth/register', async (req, res) => {
    const { email, password, language, ref } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const userId = 'u_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
        // FORZATO RUOLO USER. RISTORANTE SOLO VIA ADMIN
        await pool.query(
            "INSERT INTO users (id, email, password, role, is_premium, language, ref_restaurant_slug) VALUES ($1, $2, $3, $4, $5, $6, $7)",
            [userId, email, hashedPassword, 'user', false, language || 'it', ref || null]
        );
        const token = jwt.sign({ userId, email, role: 'user', isPremium: false, language: language || 'it' }, JWT_SECRET, { expiresIn: '30d' });
        res.json({ token, user: { id: userId, email, role: 'user' } });
    } catch (err) { 
        if (err.code === '23505') return res.status(400).json({ error: 'Email già registrata' });
        res.status(500).json({ error: 'Registration failed' }); 
    }
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

app.get('/api/users/me', authenticateToken, async (req, res) => {
    const result = await pool.query('SELECT id, email, role, is_premium, language, ai_usage_count FROM users WHERE id = $1', [req.user.userId]);
    res.json(result.rows[0]);
});

app.get('/api/wines', authenticateToken, async (req, res) => {
    // RESTITUIAMO I VINI MA CON ATTENZIONE AL PESO
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
        console.log("Database initialized");
    } finally { client.release(); }
};

app.listen(PORT, () => { console.log(`Server running on port ${PORT}`); initDb(); });
