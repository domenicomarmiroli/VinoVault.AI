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

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_wine_key_change_me';
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const SERPAPI_KEY = process.env.SERPAPI_KEY;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// --- STATIC FILES SERVING (STANDARD) ---
const distPath = path.resolve(__dirname, '../dist');
const publicPath = path.resolve(process.cwd(), 'public');

app.use(express.static(distPath));
app.use(express.static(publicPath));

// Database Connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// --- AUTH MIDDLEWARE ---
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

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
  try {
    // 1. Create Users Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT DEFAULT 'user',
        is_premium BOOLEAN DEFAULT FALSE,
        language TEXT DEFAULT 'it',
        ai_usage_count INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2. Wines Table
    await pool.query(`
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

    // 3. History Table
    await pool.query(`
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

    // 4. Locations Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS locations (
        id TEXT PRIMARY KEY,
        user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
        name TEXT NOT NULL
      );
    `);

    // 5. RESTAURANTS TABLE
    await pool.query(`
      CREATE TABLE IF NOT EXISTS restaurants (
        id TEXT PRIMARY KEY,
        slug TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        menu_context TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Migrations
    try {
        await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'it';`);
        await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT FALSE;`); 
    } catch (e) {
        console.log("Migration columns checked");
    }

    console.log("Database tables checked/created successfully.");
  } catch (error) {
    console.error("Error initializing database tables:", error);
  }
};

// ... API ROUTES ...

// Register
app.post('/api/auth/register', async (req, res) => {
    const { email, password, language } = req.body; // Accept language
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const userId = Date.now().toString(36) + Math.random().toString(36).substr(2);
        const userLang = language || 'it';

        await pool.query(
            "INSERT INTO users (id, email, password, role, is_premium, language) VALUES ($1, $2, $3, 'user', FALSE, $4)",
            [userId, email, hashedPassword, userLang]
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
        console.error(err);
        res.status(500).json({ error: 'Registration failed' });
    }
});

// Login
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
        console.error(err);
        res.status(500).json({ error: 'Login failed' });
    }
});

// GET Profile
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

// PUT Update Language
app.put('/api/users/me/language', authenticateToken, async (req, res) => {
    const { language } = req.body;
    try {
        await pool.query('UPDATE users SET language = $1 WHERE id = $2', [language, req.user.userId]);
        res.json({ message: 'Language updated' });
    } catch (err) {
        res.status(500).json({ error: 'Update failed' });
    }
});

// ... OTHER ROUTES (Keep existing routes) ...
// (Omitting standard routes for brevity but assume they exist as per original file, just add these specialized ones)

app.get('/api/config', (req, res) => {
    res.json({ googleClientId: GOOGLE_CLIENT_ID || '' });
});

// Start Server
const startServer = async () => {
  if (process.env.DATABASE_URL) await initDb();
  app.listen(PORT, () => console.log(`Server listening on ${PORT}`));
};

startServer();
