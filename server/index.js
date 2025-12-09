
import express from 'express';
import pkg from 'pg';
const { Pool } = pkg;
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Increased limit for base64 images

// Database Connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// --- DB INITIALIZATION ---
const initDb = async () => {
  try {
    const queryText = `
      CREATE TABLE IF NOT EXISTS wines (
        id TEXT PRIMARY KEY,
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
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS history (
        id TEXT PRIMARY KEY,
        wine_id TEXT,
        name TEXT,
        producer TEXT,
        year TEXT,
        price DECIMAL,
        image_url TEXT,
        consumed_date TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await pool.query(queryText);
    console.log("Database tables checked/created successfully.");
  } catch (error) {
    console.error("Error initializing database tables:", error);
  }
};

// --- API ROUTES ---

// GET All Wines
app.get('/api/wines', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM wines ORDER BY created_at DESC');
    // Map snake_case DB columns to camelCase JS objects
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
      imageUrl: row.image_url
    }));
    res.json(wines);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// POST Add Wine
app.post('/api/wines', async (req, res) => {
  const w = req.body;
  try {
    const query = `
      INSERT INTO wines (
        id, name, producer, year, type, region, grape, alcohol, 
        purchase_date, price, quantity, location, storage_temp, storage_advice,
        serving_temp, serving_advice, food_pairings, image_url
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
      RETURNING *
    `;
    const values = [
      w.id, w.name, w.producer, w.year, w.type, w.region, w.grape, w.alcohol,
      w.purchaseDate, w.price, w.quantity, w.location, w.storageTemp, w.storageAdvice,
      w.servingTemp, w.servingAdvice, w.foodPairings, w.imageUrl
    ];
    await pool.query(query, values);
    res.status(201).json({ message: 'Wine added' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database insert error' });
  }
});

// PUT Update Quantity (Consume)
app.put('/api/wines/:id', async (req, res) => {
  const { id } = req.params;
  const { quantity } = req.body;
  try {
    if (quantity <= 0) {
      await pool.query('DELETE FROM wines WHERE id = $1', [id]);
    } else {
      await pool.query('UPDATE wines SET quantity = $1 WHERE id = $2', [quantity, id]);
    }
    res.json({ message: 'Updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Update error' });
  }
});

// DELETE Wine
app.delete('/api/wines/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM wines WHERE id = $1', [id]);
    res.json({ message: 'Deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Delete error' });
  }
});

// GET History
app.get('/api/history', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM history ORDER BY consumed_date DESC');
    const history = result.rows.map(row => ({
      id: row.id,
      wineId: row.wine_id,
      name: row.name,
      producer: row.producer,
      year: row.year,
      price: parseFloat(row.price),
      imageUrl: row.image_url,
      consumedDate: row.consumed_date
    }));
    res.json(history);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// POST Add to History
app.post('/api/history', async (req, res) => {
  const h = req.body;
  try {
    const query = `
      INSERT INTO history (id, wine_id, name, producer, year, price, image_url, consumed_date)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `;
    await pool.query(query, [h.id, h.wineId, h.name, h.producer, h.year, h.price, h.imageUrl, h.consumedDate]);
    res.status(201).json({ message: 'History added' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'History insert error' });
  }
});

// DELETE Clear History
app.delete('/api/history', async (req, res) => {
  try {
    await pool.query('DELETE FROM history');
    res.json({ message: 'History cleared' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'History clear error' });
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
