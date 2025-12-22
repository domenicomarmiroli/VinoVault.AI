
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

// Database Connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 30000,
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
  let client;
  try {
    client = await pool.connect();
    // 1. Users - Assicuriamoci che tutte le colonne necessarie esistano
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

    // Altre tabelle...
    await client.query(`CREATE TABLE IF NOT EXISTS wines (id TEXT PRIMARY KEY, user_id TEXT REFERENCES users(id) ON DELETE CASCADE, name TEXT NOT NULL, producer TEXT, year TEXT, type TEXT, region TEXT, grape TEXT, alcohol TEXT, purchase_date TEXT, price DECIMAL, quantity INTEGER DEFAULT 1, location TEXT, storage_temp TEXT, storage_advice TEXT, serving_temp TEXT, serving_advice TEXT, food_pairings TEXT[], image_url TEXT, drink_window TEXT, market_price DECIMAL, created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP);`);
    await client.query(`CREATE TABLE IF NOT EXISTS history (id TEXT PRIMARY KEY, user_id TEXT REFERENCES users(id) ON DELETE CASCADE, wine_id TEXT, name TEXT, producer TEXT, year TEXT, type TEXT, price DECIMAL, image_url TEXT, consumed_date TEXT, rating INTEGER DEFAULT 0, notes TEXT, created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP);`);
    await client.query(`CREATE TABLE IF NOT EXISTS locations (id TEXT PRIMARY KEY, user_id TEXT REFERENCES users(id) ON DELETE CASCADE, name TEXT NOT NULL);`);
    await client.query(`CREATE TABLE IF NOT EXISTS restaurants (id TEXT PRIMARY KEY, slug TEXT UNIQUE NOT NULL, name TEXT NOT NULL, menu_context TEXT, created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP);`);
    await client.query(`CREATE TABLE IF NOT EXISTS shares (id TEXT PRIMARY KEY, data JSONB NOT NULL, created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP);`);

    console.log("Database tables initialized.");
  } catch (error) {
    console.error("Error initializing database:", error);
  } finally {
    if (client) client.release();
  }
};

// --- ROUTES ---

// Auth Routes
app.post('/api/auth/register', async (req, res) => {
    const { email, password, language, ref } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const userId = Date.now().toString(36) + Math.random().toString(36).substr(2);
        await pool.query(
            "INSERT INTO users (id, email, password, role, is_premium, language, ref_restaurant_slug) VALUES ($1, $2, $3, 'user', FALSE, $4, $5)",
            [userId, email, hashedPassword, language || 'it', ref || null]
        );
        const token = jwt.sign({ userId, email, role: 'user', isPremium: false, language: language || 'it' }, JWT_SECRET, { expiresIn: '30d' });
        res.json({ token, user: { id: userId, email, role: 'user', is_premium: false, language: language || 'it' } });
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
        if (!user || !(await bcrypt.compare(password, user.password))) return res.status(400).json({ error: 'Invalid credentials' });
        const token = jwt.sign({ userId: user.id, email: user.email, role: user.role, isPremium: user.is_premium, language: user.language || 'it' }, JWT_SECRET, { expiresIn: '30d' });
        res.json({ token, user: { id: user.id, email: user.email, role: user.role, is_premium: user.is_premium, language: user.language || 'it' } });
    } catch (err) { res.status(500).json({ error: 'Login failed' }); }
});

app.post('/api/auth/google', async (req, res) => {
    const { token, language, ref } = req.body;
    
    if (!GOOGLE_CLIENT_ID) {
        console.error("GOOGLE_CLIENT_ID missing in env variables.");
        return res.status(500).json({ error: 'Server: Google Client ID not configured.' });
    }

    try {
        const client = new OAuth2Client(GOOGLE_CLIENT_ID);
        // Verifica del token
        const ticket = await client.verifyIdToken({ 
            idToken: token, 
            audience: GOOGLE_CLIENT_ID 
        });
        
        const payload = ticket.getPayload();
        if (!payload || !payload.email) {
            console.error("Google ticket payload invalid.");
            return res.status(400).json({ error: 'Token Google non valido o email mancante.' });
        }

        const { email, sub: googleId } = payload;
        console.log(`Google Auth attempt for email: ${email}`);
        
        // 1. Cerca utente esistente per google_id o per email
        let result = await pool.query('SELECT * FROM users WHERE google_id = $1 OR email = $2', [googleId, email]);
        let user = result.rows[0];

        if (!user) {
            console.log(`Creating new Google user: ${email}`);
            // 2. Nuovo utente: Crea l'account direttamente
            const userId = Date.now().toString(36) + Math.random().toString(36).substr(2);
            try {
                const newUserResult = await pool.query(
                    "INSERT INTO users (id, email, google_id, role, is_premium, language, ref_restaurant_slug) VALUES ($1, $2, $3, 'user', FALSE, $4, $5) RETURNING *",
                    [userId, email, googleId, language || 'it', ref || null]
                );
                user = newUserResult.rows[0];
            } catch (insertErr) {
                console.error("Error creating new Google user in DB:", insertErr);
                return res.status(500).json({ error: 'Errore durante la creazione del nuovo account.' });
            }
        } else {
            console.log(`Existing user found for: ${email}`);
            // 3. Utente esistente: aggiorna google_id se non presente
            if (!user.google_id) {
                console.log(`Linking Google ID to existing email account: ${email}`);
                await pool.query('UPDATE users SET google_id = $1 WHERE id = $2', [googleId, user.id]);
                user.google_id = googleId;
            }
        }

        // 4. Genera Token JWT per la sessione dell'app
        const jwtToken = jwt.sign({ 
            userId: user.id, 
            email: user.email, 
            role: user.role, 
            isPremium: user.is_premium, 
            language: user.language || language || 'it' 
        }, JWT_SECRET, { expiresIn: '30d' });

        res.json({ token: jwtToken, user });

    } catch (err) {
        console.error("Detailed Google Auth Error:", err);
        res.status(500).json({ error: 'Errore critico durante l\'autenticazione con Google: ' + err.message });
    }
});

// Wines & History
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
    const { id } = req.params;
    const updates = req.body;
    const fields = Object.keys(updates).map((key, idx) => {
        const dbKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
        return `${dbKey} = $${idx + 2}`;
    });
    try {
        await pool.query(`UPDATE wines SET ${fields.join(', ')} WHERE id = $1 AND user_id = $${Object.keys(updates).length + 2}`, [id, ...Object.values(updates), req.user.userId]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: 'Update failed' }); }
});

app.delete('/api/wines/:id', authenticateToken, async (req, res) => {
    try {
        await pool.query('DELETE FROM wines WHERE id = $1 AND user_id = $2', [req.params.id, req.user.userId]);
        res.sendStatus(200);
    } catch (err) { res.status(500).json({ error: 'Delete failed' }); }
});

app.get('/api/history', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM history WHERE user_id = $1 ORDER BY consumed_date DESC', [req.user.userId]);
        res.json(result.rows.map(r => ({
            id: r.id, wineId: r.wine_id, name: r.name, producer: r.producer, year: r.year, type: r.type, price: parseFloat(r.price), imageUrl: r.image_url, consumedDate: r.consumed_date, rating: r.rating, notes: r.notes
        })));
    } catch (err) { res.status(500).json({ error: err.message }); }
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
    } catch (err) { res.status(500).json({ error: 'Failed to add history' }); }
});

app.get('/api/users/me', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query('SELECT id, email, role, is_premium, language, ai_usage_count FROM users WHERE id = $1', [req.user.userId]);
        res.json(result.rows[0]);
    } catch (err) { res.status(500).json({ error: 'Fetch failed' }); }
});

app.get('/api/config', (req, res) => res.json({ googleClientId: GOOGLE_CLIENT_ID || '' }));

app.get('*', (req, res) => res.sendFile(path.resolve(distPath, 'index.html')));

app.listen(PORT, () => {
    console.log(`Server listening on ${PORT}`);
    if (process.env.DATABASE_URL) initDb();
});
