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
import fs from 'fs';

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

// --- DIAGNOSTICA FILESYSTEM (DEBUG) ---
const logDirectory = (dirPath, name) => {
    try {
        if (fs.existsSync(dirPath)) {
            const files = fs.readdirSync(dirPath);
            console.log(`[DEBUG] Contenuto cartella ${name} (${dirPath}):`, files);
        } else {
            console.log(`[DEBUG] Cartella ${name} NON trovata in: ${dirPath}`);
        }
    } catch (e) {
        console.error(`[DEBUG] Errore lettura ${name}:`, e.message);
    }
};

// Log paths on startup
const distPath = path.resolve(__dirname, '../dist');
const publicPath = path.resolve(process.cwd(), 'public');
console.log("[DEBUG] Server Startup Checks:");
console.log("CWD:", process.cwd());
console.log("__dirname:", __dirname);
logDirectory(distPath, 'DIST');
logDirectory(publicPath, 'PUBLIC');

// --- STATIC ASSETS MANUAL HANDLING ---
app.get('/logo.png', (req, res) => {
    // Tentativi con varie combinazioni (anche Case Sensitive)
    const candidates = [
        path.join(distPath, 'logo.png'),
        path.join(distPath, 'Logo.png'),
        path.join(publicPath, 'logo.png'),
        path.join(publicPath, 'Logo.png'),
        path.join(process.cwd(), 'logo.png')
    ];

    for (const p of candidates) {
        if (fs.existsSync(p)) {
            console.log(`[ASSET SUCCESS] Serving logo from: ${p}`);
            res.setHeader('Content-Type', 'image/png');
            return res.sendFile(p);
        }
    }
    
    console.error('[ASSET ERROR] logo.png NOT FOUND. Checked paths:', candidates);
    res.status(404).send('Image not found');
});

app.get('/favicon.ico', (req, res) => {
    const candidates = [
        path.join(distPath, 'favicon.ico'),
        path.join(publicPath, 'favicon.ico'),
        path.join(process.cwd(), 'favicon.ico')
    ];

    for (const p of candidates) {
        if (fs.existsSync(p)) {
            res.setHeader('Content-Type', 'image/x-icon');
            return res.sendFile(p);
        }
    }
    res.status(404).send('Not found');
});

// --- STATIC FILES SERVING (STANDARD) ---
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
    // 1. Create Users Table with ROLE and STATS and PREMIUM
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT DEFAULT 'user',
        is_premium BOOLEAN DEFAULT FALSE,
        ai_usage_count INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2. Create/Update Wines Table
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

    // 3. Create/Update History Table
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

    // 4. Create/Update Locations Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS locations (
        id TEXT PRIMARY KEY,
        user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
        name TEXT NOT NULL
      );
    `);

    // 5. Add columns if missing (Migration for existing tables)
    try {
        await pool.query(`ALTER TABLE wines ADD COLUMN IF NOT EXISTS user_id TEXT REFERENCES users(id) ON DELETE CASCADE;`);
        await pool.query(`ALTER TABLE history ADD COLUMN IF NOT EXISTS user_id TEXT REFERENCES users(id) ON DELETE CASCADE;`);
        await pool.query(`ALTER TABLE locations ADD COLUMN IF NOT EXISTS user_id TEXT REFERENCES users(id) ON DELETE CASCADE;`);
        
        await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';`);
        await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS ai_usage_count INTEGER DEFAULT 0;`); 
        await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT FALSE;`); // NEW

        // History Reviews Migration
        await pool.query(`ALTER TABLE history ADD COLUMN IF NOT EXISTS rating INTEGER DEFAULT 0;`);
        await pool.query(`ALTER TABLE history ADD COLUMN IF NOT EXISTS notes TEXT;`);
        await pool.query(`ALTER TABLE history ADD COLUMN IF NOT EXISTS type TEXT;`); 
        
        // Analytics Migration
        await pool.query(`ALTER TABLE wines ADD COLUMN IF NOT EXISTS drink_window TEXT;`);
        await pool.query(`ALTER TABLE wines ADD COLUMN IF NOT EXISTS market_price DECIMAL DEFAULT 0;`);
    } catch (e) {
        console.log("Migration columns already exist or skipped");
    }

    // 6. Create Default Admin User
    try {
        const adminEmail = 'admin@vinovault.ai';
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [adminEmail]);
        if (result.rows.length === 0) {
            const adminPassword = await bcrypt.hash('admin123', 10);
            await pool.query(
                "INSERT INTO users (id, email, password, role, is_premium) VALUES ($1, $2, $3, 'admin', TRUE)",
                ['admin_001', adminEmail, adminPassword]
            );
            console.log("Default Admin user created.");
        }
    } catch(e) {
        console.error("Error creating default admin", e);
    }

    console.log("Database tables checked/created successfully.");
  } catch (error) {
    console.error("Error initializing database tables:", error);
  }
};

// --- PUBLIC CONFIG ROUTE ---
app.get('/api/config', (req, res) => {
    // Espone solo configurazioni pubbliche sicure al frontend
    res.json({
        googleClientId: GOOGLE_CLIENT_ID || ''
    });
});

// --- SERPAPI PROXY ROUTE (NEW) - PROTECTED (PREMIUM ONLY) ---
app.get('/api/search-prices', authenticateToken, async (req, res) => {
    const { query } = req.query;
    
    // PREMIUM CHECK
    if (!req.user.isPremium) {
        return res.status(403).json({ error: 'Funzionalità riservata agli utenti Premium.' });
    }

    if (!SERPAPI_KEY) {
        return res.status(503).json({ error: 'Servizio ricerca prezzi non configurato (SERPAPI_KEY mancante)' });
    }
    if (!query) return res.status(400).json({ error: 'Query mancante' });

    try {
        const params = new URLSearchParams({
            engine: 'google_shopping',
            q: query,
            api_key: SERPAPI_KEY,
            location: 'Italy',
            gl: 'it',
            hl: 'it',
            num: '10' // Scarichiamo i primi 10 per poi filtrare/ordinare
        });

        const response = await fetch(`https://serpapi.com/search.json?${params.toString()}`);
        const data = await response.json();

        if (data.error) {
            console.error("SerpApi Error:", data.error);
            return res.status(500).json({ error: 'Errore durante la ricerca prezzi' });
        }

        const results = data.shopping_results || [];

        // Mappatura corretta basata sul JSON di SerpApi Google Shopping
        const topDeals = results
            .sort((a, b) => (a.extracted_price || 0) - (b.extracted_price || 0)) // Ordina per prezzo
            .slice(0, 3) // Prendi i primi 3
            .map(item => ({
                source: item.source,
                price: item.extracted_price,
                currency: 'EUR', // Assumiamo Euro dato gl=it
                link: item.product_link, // CORRETTO: usa 'product_link' non 'link'
                thumbnail: item.thumbnail
            }));

        res.json(topDeals);

    } catch (err) {
        console.error("Search API Error", err);
        res.status(500).json({ error: 'Errore di connessione al servizio prezzi' });
    }
});


// --- AUTH ROUTES ---

// Google Login
app.post('/api/auth/google', async (req, res) => {
    const { token: googleToken, clientId } = req.body;
    
    if (!googleToken) {
        return res.status(400).json({ error: 'Token mancante' });
    }

    try {
        const client = new OAuth2Client(clientId || GOOGLE_CLIENT_ID);
        const ticket = await client.verifyIdToken({
            idToken: googleToken,
            audience: clientId || GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        const email = payload.email;

        // Check if user exists
        let result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        let user = result.rows[0];

        if (!user) {
            // Register new Google User
            const userId = Date.now().toString(36) + Math.random().toString(36).substr(2);
            // Random password - user uses Google to login
            const randomPassword = Math.random().toString(36).slice(-8);
            const hashedPassword = await bcrypt.hash(randomPassword, 10);

            await pool.query(
                "INSERT INTO users (id, email, password, role, is_premium) VALUES ($1, $2, $3, 'user', FALSE)",
                [userId, email, hashedPassword]
            );

            // Default Locations
            await pool.query(`
                INSERT INTO locations (id, user_id, name) VALUES 
                ($1, $2, 'Cantina'),
                ($3, $2, 'Frigo Cucina'),
                ($4, $2, 'Scaffale')
            `, [userId + '_l1', userId, userId + '_l2', userId + '_l3']);

            user = { id: userId, email: email, role: 'user', is_premium: false };
        }

        const token = jwt.sign(
            { userId: user.id, email: user.email, role: user.role, isPremium: user.is_premium }, 
            JWT_SECRET, 
            { expiresIn: '30d' }
        );
        res.json({ token, user: { id: user.id, email: user.email, role: user.role, is_premium: user.is_premium } });

    } catch (err) {
        console.error("Google Auth Error:", err);
        res.status(401).json({ error: 'Autenticazione Google fallita' });
    }
});

// Register
app.post('/api/auth/register', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    try {
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        const userId = Date.now().toString(36) + Math.random().toString(36).substr(2);

        // Insert User
        await pool.query(
            "INSERT INTO users (id, email, password, role, is_premium) VALUES ($1, $2, $3, 'user', FALSE)",
            [userId, email, hashedPassword]
        );

        // Add Default Locations for this user
        await pool.query(`
            INSERT INTO locations (id, user_id, name) VALUES 
            ($1, $2, 'Cantina'),
            ($3, $2, 'Frigo Cucina'),
            ($4, $2, 'Scaffale')
        `, [
            userId + '_l1',
            userId,
            userId + '_l2',
            userId + '_l3'
        ]);

        // Generate Token
        const token = jwt.sign(
            { userId, email, role: 'user', isPremium: false }, 
            JWT_SECRET, 
            { expiresIn: '30d' }
        );
        res.json({ token, user: { id: userId, email, role: 'user', is_premium: false } });

    } catch (err) {
        if (err.code === '23505') { // Unique violation
            return res.status(400).json({ error: 'Email already exists' });
        }
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
            { userId: user.id, email: user.email, role: user.role, isPremium: user.is_premium }, 
            JWT_SECRET, 
            { expiresIn: '30d' }
        );
        res.json({ token, user: { id: user.id, email: user.email, role: user.role, is_premium: user.is_premium } });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Login failed' });
    }
});

// --- ADMIN API ROUTES ---

// GET All Users with Stats
app.get('/api/users', authenticateAdmin, async (req, res) => {
    try {
        // Advanced query to count wines per user
        const query = `
            SELECT 
                u.id, 
                u.email, 
                u.role, 
                u.is_premium,
                u.created_at, 
                u.ai_usage_count,
                COUNT(w.id) as wine_count
            FROM users u
            LEFT JOIN wines w ON u.id = w.user_id
            GROUP BY u.id
            ORDER BY u.created_at DESC
        `;
        const result = await pool.query(query);
        res.json(result.rows);
    } catch(err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// PUT Toggle Premium
app.put('/api/users/:id/premium', authenticateAdmin, async (req, res) => {
    const { id } = req.params;
    try {
        // Toggle boolean value
        await pool.query('UPDATE users SET is_premium = NOT is_premium WHERE id = $1', [id]);
        res.json({ message: 'Premium status toggled' });
    } catch(err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to toggle premium' });
    }
});

// DELETE User
app.delete('/api/users/:id', authenticateAdmin, async (req, res) => {
    const { id } = req.params;
    // Prevent deleting self
    if (id === req.user.userId) return res.status(400).json({ error: 'Cannot delete yourself' });

    try {
        await pool.query('DELETE FROM users WHERE id = $1', [id]);
        // Cascading delete handles wines/history/locations due to schema
        res.json({ message: 'User deleted' });
    } catch(err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to delete user' });
    }
});

// PUT Reset Password
app.put('/api/users/:id/reset-password', authenticateAdmin, async (req, res) => {
    const { id } = req.params;
    const { newPassword } = req.body;
    
    if (!newPassword) return res.status(400).json({ error: 'New password required' });

    try {
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await pool.query('UPDATE users SET password = $1 WHERE id = $2', [hashedPassword, id]);
        res.json({ message: 'Password reset successful' });
    } catch(err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to reset password' });
    }
});


// --- PROTECTED API ROUTES ---

// TELEMETRY: Track AI Usage
app.post('/api/users/track-ai', authenticateToken, async (req, res) => {
    try {
        await pool.query('UPDATE users SET ai_usage_count = COALESCE(ai_usage_count, 0) + 1 WHERE id = $1', [req.user.userId]);
        res.sendStatus(200);
    } catch(err) {
        console.error("Telemetry error", err);
        // Don't break the client flow if telemetry fails
        res.sendStatus(200); 
    }
});

// GET All Wines (User Scoped)
app.get('/api/wines', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
        'SELECT * FROM wines WHERE user_id = $1 ORDER BY created_at DESC', 
        [req.user.userId]
    );
    
    const wines = result.rows.map(row => ({
      id: row.id,
      name: row.name,
      producer: row.producer,
      year: row.year,
      type: row.type,
      region: row.region,
      grape: row.grape,
      alcohol: row.alcohol,
      purchaseDate: row.purchase_date,
      price: parseFloat(row.price),
      quantity: row.quantity,
      location: row.location,
      storageTemp: row.storage_temp,
      storageAdvice: row.storage_advice,
      servingTemp: row.serving_temp,
      servingAdvice: row.serving_advice,
      foodPairings: row.food_pairings,
      imageUrl: row.image_url,
      drinkWindow: row.drink_window,
      marketPrice: row.market_price ? parseFloat(row.market_price) : 0
    }));
    res.json(wines);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// POST Add Wine (User Scoped)
app.post('/api/wines', authenticateToken, async (req, res) => {
  const w = req.body;
  try {
    const query = `
      INSERT INTO wines (
        id, user_id, name, producer, year, type, region, grape, alcohol, 
        purchase_date, price, quantity, location, storage_temp, storage_advice,
        serving_temp, serving_advice, food_pairings, image_url, drink_window, market_price
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
    `;
    const values = [
      w.id, req.user.userId, w.name, w.producer, w.year, w.type, w.region, w.grape, w.alcohol,
      w.purchaseDate, w.price, w.quantity, w.location, w.storageTemp, w.storageAdvice,
      w.servingTemp, w.servingAdvice, w.foodPairings, w.imageUrl, w.drinkWindow, w.marketPrice
    ];
    await pool.query(query, values);
    res.status(201).json({ message: 'Wine added' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database insert error' });
  }
});

// PUT Update Wine (Any field)
app.put('/api/wines/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const updates = req.body; // Expecting { name: '...', quantity: 5, ... }
  
  try {
    // If quantity is explicitly 0 or less, delete
    if (updates.quantity !== undefined && updates.quantity <= 0) {
      await pool.query('DELETE FROM wines WHERE id = $1 AND user_id = $2', [id, req.user.userId]);
      return res.json({ message: 'Deleted' });
    }

    // Dynamic update query
    const fields = [];
    const values = [];
    let idx = 1;

    // Allowed columns to update to prevent SQL injection or bad data
    const allowedColumns = [
        'name', 'producer', 'year', 'type', 'region', 'grape', 'alcohol',
        'purchase_date', 'price', 'quantity', 'location', 
        'storage_temp', 'storage_advice', 'serving_temp', 'serving_advice', 
        'food_pairings', 'image_url', 'drink_window', 'market_price'
    ];

    for (const [key, value] of Object.entries(updates)) {
        // Map JS camelCase to DB snake_case if necessary
        let dbCol = key;
        if (key === 'purchaseDate') dbCol = 'purchase_date';
        if (key === 'storageTemp') dbCol = 'storage_temp';
        if (key === 'storageAdvice') dbCol = 'storage_advice';
        if (key === 'servingTemp') dbCol = 'serving_temp';
        if (key === 'servingAdvice') dbCol = 'serving_advice';
        if (key === 'foodPairings') dbCol = 'food_pairings';
        if (key === 'imageUrl') dbCol = 'image_url';
        if (key === 'drinkWindow') dbCol = 'drink_window';
        if (key === 'marketPrice') dbCol = 'market_price';

        if (allowedColumns.includes(dbCol)) {
            fields.push(`${dbCol} = $${idx++}`);
            values.push(value);
        }
    }

    if (fields.length === 0) return res.json({ message: 'Nothing to update' });

    values.push(id);
    values.push(req.user.userId);

    const query = `UPDATE wines SET ${fields.join(', ')} WHERE id = $${idx++} AND user_id = $${idx++}`;
    
    await pool.query(query, values);

    res.json({ message: 'Updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Update error' });
  }
});

// DELETE Wine (User Scoped)
app.delete('/api/wines/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM wines WHERE id = $1 AND user_id = $2', [id, req.user.userId]);
    res.json({ message: 'Deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Delete error' });
  }
});

// GET History (User Scoped)
app.get('/api/history', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
        'SELECT * FROM history WHERE user_id = $1 ORDER BY consumed_date DESC',
        [req.user.userId]
    );
    const history = result.rows.map(row => ({
      id: row.id,
      wineId: row.wine_id,
      name: row.name,
      producer: row.producer,
      year: row.year,
      type: row.type, // Added
      price: parseFloat(row.price),
      imageUrl: row.image_url,
      consumedDate: row.consumed_date,
      rating: row.rating,
      notes: row.notes
    }));
    res.json(history);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// POST Add to History (User Scoped)
app.post('/api/history', authenticateToken, async (req, res) => {
  const h = req.body;
  try {
    const query = `
      INSERT INTO history (id, user_id, wine_id, name, producer, year, type, price, image_url, consumed_date)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    `;
    await pool.query(query, [h.id, req.user.userId, h.wineId, h.name, h.producer, h.year, h.type, h.price, h.imageUrl, h.consumedDate]);
    res.status(201).json({ message: 'History added' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'History insert error' });
  }
});

// PUT Update History (Rating & Notes)
app.put('/api/history/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { rating, notes } = req.body;
    try {
        await pool.query(
            'UPDATE history SET rating = $1, notes = $2 WHERE id = $3 AND user_id = $4',
            [rating, notes, id, req.user.userId]
        );
        res.json({ message: 'History updated' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Update failed' });
    }
});

// DELETE Clear History (User Scoped)
app.delete('/api/history', authenticateToken, async (req, res) => {
  try {
    await pool.query('DELETE FROM history WHERE user_id = $1', [req.user.userId]);
    res.json({ message: 'History cleared' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'History clear error' });
  }
});

// --- LOCATIONS API (User Scoped) ---
app.get('/api/locations', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
        'SELECT * FROM locations WHERE user_id = $1 ORDER BY name ASC',
        [req.user.userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

app.post('/api/locations', authenticateToken, async (req, res) => {
    const { id, name } = req.body;
    try {
        await pool.query('INSERT INTO locations (id, user_id, name) VALUES ($1, $2, $3)', [id, req.user.userId, name]);
        res.status(201).json({ message: 'Location added' });
    } catch(err) {
        res.status(500).json({ error: 'Insert error' });
    }
});

app.delete('/api/locations/:id', authenticateToken, async (req, res) => {
    try {
        await pool.query('DELETE FROM locations WHERE id = $1 AND user_id = $2', [req.params.id, req.user.userId]);
        res.json({ message: 'Deleted' });
    } catch(err) {
        res.status(500).json({ error: 'Delete error' });
    }
});
 
// --- CATCH-ALL ROUTE FOR SPA ---
app.get('*', (req, res) => {
  // Security: Don't serve HTML for asset requests
  if (req.path.includes('.')) {
      return res.status(404).send('Not Found');
  }
  res.sendFile(path.join(distPath, 'index.html'));
});

// Start Server AFTER DB Init attempt
const startServer = async () => {
  if (process.env.DATABASE_URL) {
    await initDb();
  }
  app.listen(PORT, () => {
    console.log(`Server listening on ${PORT}`);
  });
};

startServer();