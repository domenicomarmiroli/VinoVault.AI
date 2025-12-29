
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

// --- ADMIN: ASSOCIATION ---
app.put('/api/admin/restaurants/:id/owner', authenticateAdmin, async (req, res) => {
    const { ownerEmail } = req.body;
    try {
        const userRes = await pool.query('SELECT id FROM users WHERE email = $1', [ownerEmail]);
        if (userRes.rowCount === 0) return res.status(404).json({ error: 'Utente non trovato' });
        
        const userId = userRes.rows[0].id;
        // 1. Associa il ristorante all'utente
        await pool.query('UPDATE restaurants SET owner_id = $1 WHERE id = $2', [userId, req.params.id]);
        // 2. Promuovi l'utente a ruolo ristorante
        await pool.query("UPDATE users SET role = 'restaurant' WHERE id = $1 AND role != 'admin'", [userId]);
        
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: 'Update failed' }); }
});

// --- RESTAURANT: SELF MANAGEMENT ---
app.get('/api/my-restaurant', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM restaurants WHERE owner_id = $1', [req.user.userId]);
        res.json(result.rows[0] || null);
    } catch (err) { res.status(500).json({ error: 'Fetch failed' }); }
});

app.post('/api/my-restaurant', authenticateToken, async (req, res) => {
    const { name, menu_context } = req.body;
    try {
        await pool.query('UPDATE restaurants SET name = $1, menu_context = $2 WHERE owner_id = $3', [name, menu_context, req.user.userId]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: 'Save failed' }); }
});

// --- STANDARD AUTH & DATA ---
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
    const result = await pool.query('SELECT id, email, role, is_premium, language FROM users WHERE id = $1', [req.user.userId]);
    res.json(result.rows[0]);
});

app.get('/api/admin/restaurants', authenticateAdmin, async (req, res) => {
    const result = await pool.query(`
        SELECT r.*, u.email as owner_email,
        (SELECT COUNT(*) FROM users WHERE ref_restaurant_slug = r.slug) as user_count
        FROM restaurants r 
        LEFT JOIN users u ON r.owner_id = u.id
        ORDER BY r.created_at DESC
    `);
    res.json(result.rows);
});

app.post('/api/admin/restaurants', authenticateAdmin, async (req, res) => {
    const { name, slug, menu_context } = req.body;
    const id = 'r_' + Math.random().toString(36).substr(2, 9);
    await pool.query('INSERT INTO restaurants (id, name, slug, menu_context) VALUES ($1, $2, $3, $4)', [id, name, slug, menu_context]);
    res.json({ success: true });
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
        await client.query(`CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, email TEXT UNIQUE NOT NULL, password TEXT, role TEXT DEFAULT 'user', is_premium BOOLEAN DEFAULT FALSE, language TEXT DEFAULT 'it', ai_usage_count INTEGER DEFAULT 0, created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP);`);
        await client.query(`CREATE TABLE IF NOT EXISTS restaurants (id TEXT PRIMARY KEY, slug TEXT UNIQUE NOT NULL, name TEXT NOT NULL, menu_context TEXT, owner_id TEXT UNIQUE REFERENCES users(id), created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP);`);
        console.log("DB Ready");
    } finally { client.release(); }
};

app.listen(PORT, () => { console.log(`Server on ${PORT}`); initDb(); });
