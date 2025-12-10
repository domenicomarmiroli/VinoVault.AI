
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

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

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

// --- DB INITIALIZATION ---
const initDb = async () => {
  try {
    // 1. Create Users Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2. Create/Update Wines Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS wines (
        id TEXT PRIMARY KEY,
        user_id TEXT REFERENCES users(id),
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
        user_id TEXT REFERENCES users(id),
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
        user_id TEXT REFERENCES users(id),
        name TEXT NOT NULL
      );
    `);

    // 5. Add columns if missing (Migration for existing tables)
    try {
        await pool.query(`ALTER TABLE wines ADD COLUMN IF NOT EXISTS user_id TEXT REFERENCES users(id);`);
        await pool.query(`ALTER TABLE history ADD COLUMN IF NOT EXISTS user_id TEXT REFERENCES users(id);`);
        await pool.query(`ALTER TABLE locations ADD COLUMN IF NOT EXISTS user_id TEXT REFERENCES users(id);`);
        
        // History Reviews Migration
        await pool.query(`ALTER TABLE history ADD COLUMN IF NOT EXISTS rating INTEGER DEFAULT 0;`);
        await pool.query(`ALTER TABLE history ADD COLUMN IF NOT EXISTS notes TEXT;`);
        await pool.query(`ALTER TABLE history ADD COLUMN IF NOT EXISTS type TEXT;`); // NEW
        
        // Analytics Migration
        await pool.query(`ALTER TABLE wines ADD COLUMN IF NOT EXISTS drink_window TEXT;`);
        await pool.query(`ALTER TABLE wines ADD COLUMN IF NOT EXISTS market_price DECIMAL DEFAULT 0;`);
    } catch (e) {
        console.log("Migration columns already exist or skipped");
    }

    console.log("Database tables checked/created successfully.");
  } catch (error) {
    console.error("Error initializing database tables:", error);
  }
};

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
                'INSERT INTO users (id, email, password) VALUES ($1, $2, $3)',
                [userId, email, hashedPassword]
            );

            // Default Locations
            await pool.query(`
                INSERT INTO locations (id, user_id, name) VALUES 
                ($1, $2, 'Cantina'),
                ($3, $2, 'Frigo Cucina'),
                ($4, $2, 'Scaffale')
            `, [userId + '_l1', userId, userId + '_l2', userId + '_l3']);

            user = { id: userId, email: email };
        }

        const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '30d' });
        res.json({ token, user: { id: user.id, email: user.email } });

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
            'INSERT INTO users (id, email, password) VALUES ($1, $2, $3)',
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
        const token = jwt.sign({ userId, email }, JWT_SECRET, { expiresIn: '30d' });
        res.json({ token, user: { id: userId, email } });

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

        const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '30d' });
        res.json({ token, user: { id: user.id, email: user.email } });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Login failed' });
    }
});


// --- PROTECTED API ROUTES ---

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

// PUT Update Wine (Quantity, Location, etc.)
app.put('/api/wines/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { quantity, location } = req.body;
  
  try {
    // If quantity is explicitly 0 or less, delete
    if (quantity !== undefined && quantity <= 0) {
      await pool.query('DELETE FROM wines WHERE id = $1 AND user_id = $2', [id, req.user.userId]);
      return res.json({ message: 'Deleted' });
    }

    // Dynamic update query
    const fields = [];
    const values = [];
    let idx = 1;

    if (quantity !== undefined) {
        fields.push(`quantity = $${idx++}`);
        values.push(quantity);
    }
    if (location !== undefined) {
        fields.push(`location = $${idx++}`);
        values.push(location);
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

// --- SERVE FRONTEND ---
const distPath = path.join(__dirname, '../dist');
app.use(express.static(distPath));

app.get('*', (req, res) => {
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
