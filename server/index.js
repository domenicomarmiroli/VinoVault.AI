
import express from 'express';
import pkg from 'pg';
const { Pool } = pkg;
import cors from 'cors';
import compression from 'compression';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import Anthropic from '@anthropic-ai/sdk';
import sharp from 'sharp';
import { randomUUID } from 'crypto';
import { startBotWakeup } from './botWakeup.js';
import { createGrowth, normalizeSignupSource } from './growth.js';
import { createBilling } from './billing.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_wine_key_change_me';
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;

const cleanJson = (text) => {
    if (!text) return '{}';
    let cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const firstBrace = cleaned.indexOf('{');
    const firstBracket = cleaned.indexOf('[');
    const lastBrace = cleaned.lastIndexOf('}');
    const lastBracket = cleaned.lastIndexOf(']');
    let start = -1, end = -1;
    if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) { start = firstBrace; end = lastBrace; }
    else if (firstBracket !== -1) { start = firstBracket; end = lastBracket; }
    if (start !== -1 && end !== -1) return cleaned.substring(start, end + 1);
    return cleaned;
};

const anthropic = new Anthropic({ apiKey: process.env.API_KEY });
const MODEL = 'claude-haiku-4-5';
// Il report sommelier è limitato (1 ogni 10 bottiglie bevute), quindi può usare un modello più capace a sforzo ridotto.
const CELLAR_REPORT_MODEL = 'claude-opus-5-5';

const getLanguageName = (code) => {
    switch(code) {
        case 'en': return 'English'; case 'fr': return 'French';
        case 'es': return 'Spanish'; case 'de': return 'German';
        default: return 'Italian';
    }
};

const getToneInstructions = (tone) => tone === 'sommelier'
    ? "REGISTRO: SOMMELIER PROFESSIONISTA. Scrivi un'analisi lunga e densa, come faresti per un cliente esperto: usa terminologia tecnica precisa (struttura, tannini, acidità, persistenza aromatica, note al naso e al palato distinte, potenziale evolutivo, abbinamento per concordanza/contrasto, riferimenti a stile del produttore/denominazione). Ogni lista (punti di forza, punti deboli, ecc.) deve avere il MASSIMO numero di elementi richiesto dallo schema, con dettagli tecnici specifici e mai generici. Non semplificare: l'utente vuole profondità analitica."
    : "REGISTRO: DIVULGATIVO E AMICHEVOLE. Scrivi frasi brevi e dirette per un appassionato NON esperto: evita gergo tecnico (o traducilo in parole semplicissime), dai consigli pratici e concreti (es. 'perfetto per una pizza margherita' invece di descrizioni astratte). Ogni lista può avere meno elementi, ma ognuno deve essere chiaro e immediatamente utile senza bisogno di conoscenze enologiche.";

const extractText = (response) => {
    const block = response.content.find(b => b.type === 'text');
    return block ? block.text : '';
};

const cleanBase64 = (base64) => base64.replace(/^data:(image\/(png|jpg|jpeg|webp)|application\/pdf);base64,/, '');

const extractOgImage = async (pageUrl) => {
    try {
        const pageRes = await fetch(pageUrl, { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(8000) });
        const html = await pageRes.text();
        const match = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)
            || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i)
            || html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i);
        if (!match) return null;
        let imageUrl = match[1];
        if (imageUrl.startsWith('//')) imageUrl = 'https:' + imageUrl;
        else if (imageUrl.startsWith('/')) imageUrl = new URL(imageUrl, pageUrl).href;
        const imgRes = await fetch(imageUrl, { signal: AbortSignal.timeout(8000) });
        const contentType = imgRes.headers.get('content-type') || 'image/jpeg';
        if (!contentType.startsWith('image/')) return null;
        const buffer = Buffer.from(await imgRes.arrayBuffer());
        return `data:${contentType};base64,${buffer.toString('base64')}`;
    } catch (e) {
        console.error('OG image extraction failed', e.message);
        return null;
    }
};

const compressStoredImage = async (dataUri) => {
    if (!dataUri || !dataUri.startsWith('data:image')) return dataUri;
    try {
        const buffer = Buffer.from(cleanBase64(dataUri), 'base64');
        const output = await sharp(buffer)
            .resize({ width: 500, height: 500, fit: 'inside', withoutEnlargement: true })
            .jpeg({ quality: 65 })
            .toBuffer();
        return `data:image/jpeg;base64,${output.toString('base64')}`;
    } catch (e) {
        console.error('Image compression failed', e);
        return dataUri;
    }
};

// Render è dietro un proxy: serve per leggere l'IP reale nei limiti di richieste.
app.set('trust proxy', 1);
// Il webhook di Stripe va letto come testo grezzo per verificarne la firma: deve stare prima di express.json.
app.post('/api/billing/webhook', express.raw({ type: 'application/json' }), (req, res) => billing.webhookHandler(req, res));
app.use(cors());
app.use(compression());
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

const mapWineToFrontend = (w) => ({
    id: w.id, name: w.name, producer: w.producer, year: w.year, type: w.type,
    region: w.region, grape: w.grape, alcohol: w.alcohol, purchaseDate: w.purchase_date,
    price: parseFloat(w.price) || 0, quantity: parseInt(w.quantity) || 0, location: w.location,
    storageTemp: w.storage_temp || '', storageAdvice: w.storage_advice || '',
    servingTemp: w.serving_temp || '', servingAdvice: w.serving_advice || '',
    foodPairings: w.food_pairings || [], imageUrl: w.image_url,
    drinkWindow: w.drink_window || '', marketPrice: parseFloat(w.market_price) || 0,
    qualityScore: w.quality_score !== null && w.quality_score !== undefined ? parseInt(w.quality_score) : undefined,
    wineStyle: w.wine_style ? (typeof w.wine_style === 'string' ? JSON.parse(w.wine_style) : w.wine_style) : undefined,
    cellarSlots: w.cellar_slots ? (typeof w.cellar_slots === 'string' ? JSON.parse(w.cellar_slots) : w.cellar_slots) : []
});

const mapLocationToFrontend = (l) => ({
    id: l.id, name: l.name, kind: l.kind || 'generic',
    layout: l.layout ? (typeof l.layout === 'string' ? JSON.parse(l.layout) : l.layout) : undefined
});

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.sendStatus(401);
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    growth.recordActivity(user.userId);
    next();
  });
};

const authenticateAdmin = (req, res, next) => {
    authenticateToken(req, res, () => {
        if (req.user && req.user.role === 'admin') next();
        else res.status(403).json({ error: 'Access denied' });
    });
};

const growth = createGrowth({ pool, anthropic, authenticateToken, authenticateAdmin });
const billing = createBilling({ pool, authenticateToken, trackEvent: growth.trackEvent });
growth.registerRoutes(app);
billing.registerRoutes(app);

// --- AI ENDPOINTS ---

app.post('/api/ai/analyze-label', authenticateToken, async (req, res) => {
    const { base64Image, lang = 'it', tone = 'pop' } = req.body;
    const langName = getLanguageName(lang);
    try {
        const response = await growth.aiCreate(req.user.userId, 'analyze-label', {
            model: MODEL, max_tokens: 1536, temperature: 0,
            system: `Sei un esperto di vino che analizza etichette da foto per un'app di gestione cantina. Leggi con attenzione ogni dettaglio visibile (nome, produttore, annata, denominazione/regione, vitigno, gradazione) e, se un dato non è leggibile, deducilo in modo plausibile dal contesto (tipologia di vino, denominazione, stile dell'etichetta) invece di lasciarlo vuoto quando possibile. Se l'annata non è davvero leggibile né deducibile con ragionevole certezza, lascia il campo "year" vuoto: lo inserirà l'utente a mano.
${getToneInstructions(tone)}
Linee guida per i campi:
- alcohol: formato "13.5%" (usa il punto decimale)
- foodPairings: 3-5 abbinamenti concreti e specifici (piatti reali, non categorie generiche)
- drinkWindow: intervallo di anni realistico in base a tipologia e annata, es. "2025-2029"
- storageAdvice / servingAdvice: massimo 2 frasi ciascuna, consigli pratici e immediatamente applicabili
- price: se non stimabile dall'etichetta, usa 0
- marketPrice: stima onesta del prezzo di mercato attuale in euro, basata su produttore/denominazione/annata
- qualityScore (0-100): valuta la QUALITÀ INTRINSECA del vino (produttore, denominazione, annata, reputazione), IDENTICO indipendentemente dal registro linguistico richiesto sopra. Guida: 90-100 eccellenza assoluta, 80-89 ottimo, 70-79 buono, 60-69 nella media, <60 modesto.
- wineStyle: profilo sensoriale OGGETTIVO del vino, identico indipendentemente dal registro linguistico. freshRich (1-6, 1=molto fresco, 6=molto ricco/opulento), sweetness/body/acidity/tannin/wood/persistence (1-5, 1=minimo, 5=massimo; per i bianchi il tannin sarà tipicamente 1). aromas: 4-6 descrittori aromatici brevi e concreti (es. "Mela", "Frutti rossi", "Vaniglia").

Rispondi ESCLUSIVAMENTE con JSON valido in ${langName}, nessun testo aggiuntivo.
Schema JSON richiesto: {"name": string, "producer": string, "year": string, "type": string, "region": string, "grape": string, "alcohol": string, "storageTemp": string, "storageAdvice": string, "servingTemp": string, "servingAdvice": string, "foodPairings": string[], "price": number, "drinkWindow": string, "marketPrice": number, "qualityScore": number, "wineStyle": {"freshRich": number, "sweetness": number, "body": number, "acidity": number, "tannin": number, "wood": number, "persistence": number, "aromas": string[]}}`,
            messages: [{ role: 'user', content: [
                { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: cleanBase64(base64Image) } },
                { type: 'text', text: `Analizza questa etichetta di vino in ${langName}. Rispondi solo in JSON.` }
            ]}]
        });
        res.json(JSON.parse(cleanJson(extractText(response))));
    } catch (err) { res.status(500).json({ error: err.message || 'Errore AI' }); }
});

app.post('/api/ai/suggest-pairing', authenticateToken, async (req, res) => {
    const { menu, guests, inventory, style, lang = 'it', tone = 'pop' } = req.body;
    const langName = getLanguageName(lang);
    const inventoryList = inventory.map(w => `ID: ${w.id}, Nome: ${w.name} (${w.year}), Tipo: ${w.type}, Vitigno: ${w.grape || 'N/D'}`).join('\n');
    try {
        const response = await growth.aiCreate(req.user.userId, 'suggest-pairing', {
            model: MODEL, max_tokens: 2048,
            system: `Sei un sommelier che consiglia abbinamenti cibo-vino per una cena, ragionando su ingredienti principali, metodo di cottura, intensità del piatto e struttura del vino (non solo sul tipo di carne/pesce).
${getToneInstructions(tone)}
Regole:
- Per ogni portata del menu, proponi opzioni scegliendo PRIMA tra i vini disponibili in inventario (type:"owned", wineId valorizzato con l'ID esatto dell'inventario); se nessun vino in cantina è davvero adatto, proponi un vino da acquistare (type:"purchase", wineId: null, wineName con un'indicazione concreta es. "Un Vermentino di Sardegna").
- Non forzare un abbinamento con l'inventario se la scelta è scadente: meglio suggerire un acquisto mirato.
- reasoning: 1-2 frasi che spiegano PERCHÉ funziona quell'abbinamento con quel piatto specifico.
- servingAdvice: consiglio pratico su temperatura/decantazione/bicchiere, massimo 1 frase.
- Se "Stile" è "single", proponi una sola opzione ottimale per portata; se "multiple", proponi 2-3 opzioni con profili diversi.

Rispondi ESCLUSIVAMENTE con un array JSON valido in ${langName}, nessun testo aggiuntivo.
Schema: array di {"courseName": string, "dishName": string, "options": [{"wineId": string|null, "wineName": string, "reasoning": string, "type": "owned"|"purchase", "servingTemp": string, "servingAdvice": string}]}`,
            messages: [{ role: 'user', content: `Menu: ${menu}. Ospiti: ${guests}. Inventario disponibile:\n${inventoryList || 'vuoto'}\nStile richiesto: ${style}. Rispondi SOLO con l'array JSON.` }]
        });
        res.json(JSON.parse(cleanJson(extractText(response) || '[]')));
    } catch (err) { res.status(500).json({ error: err.message || 'Errore Sommelier' }); }
});

app.post('/api/ai/analyze-purchase', authenticateToken, async (req, res) => {
    const { input, inputPrice, inventory, lang = 'it', tone = 'pop', knownYear } = req.body;
    const langName = getLanguageName(lang);
    const inventoryContext = inventory.map(w => `${w.quantity}x ${w.name} (${w.type})`).join(', ');
    try {
        const contentParts = [];
        let extractedImageUrl = null;
        if (input.type === 'image') {
            contentParts.push({ type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: cleanBase64(input.data) } });
        } else {
            contentParts.push({ type: 'text', text: input.data });
            extractedImageUrl = await extractOgImage(input.data);
        }
        const yearHint = knownYear
            ? `L'annata è già confermata dall'utente: ${knownYear}. Usa esattamente questo valore per wineDetails.year, non cercare di rilevarla diversamente.`
            : '';
        contentParts.push({ type: 'text', text: `Prezzo offerto: €${inputPrice}. Cantina attuale: ${inventoryContext || 'vuota'}. ${yearHint} Analizza in ${langName}. Rispondi SOLO in JSON.` });
        const response = await growth.aiCreate(req.user.userId, 'analyze-purchase', {
            model: MODEL, max_tokens: 2048, temperature: 0,
            system: `Agisci come broker di vini esperto che valuta se un acquisto conviene, indipendentemente dal prezzo richiesto.
${getToneInstructions(tone)}
IMPORTANTE: qualityScore, marketPriceEstimate e dealRating sono valutazioni OGGETTIVE basate solo sulle caratteristiche del vino (produttore, denominazione, annata, reputazione) e sul prezzo. Devono essere IDENTICHE indipendentemente dal registro linguistico richiesto sopra: cambia solo il modo di scrivere le spiegazioni testuali, mai i numeri o le valutazioni.
Regole di valutazione:
- qualityScore (0-100): valuta la QUALITÀ INTRINSECA del vino (produttore, denominazione, annata, reputazione) SENZA farti influenzare dal prezzo offerto. Guida: 90-100 eccellenza assoluta, 80-89 ottimo, 70-79 buono, 60-69 nella media, <60 modesto.
- marketPriceEstimate: stima onesta e realistica del prezzo di mercato attuale in euro per quella bottiglia specifica.
- dealRating: confronta inputPrice con marketPriceEstimate. "Excellent" se il prezzo offerto è nettamente sotto mercato, "Good" se leggermente sotto o in linea, "Fair" se leggermente sopra, "Bad" se nettamente sopra mercato.
- sommelierNotes: introduzione breve (1-2 frasi) sul carattere generale del vino.
- strengths: 3-4 punti di forza SPECIFICI del vino (non generici), ognuno una frase breve autonoma.
- weaknesses: 2-3 limiti o aspetti da considerare (es. non adatto a lungo invecchiamento, prezzo elevato per lo stile, annata non ottimale) — se il vino non ha reali punti deboli, indica cautele oggettive tipo "da consumare entro pochi anni".
- bestOccasions: 2-4 occasioni/contesti di consumo concreti (es. "aperitivo estivo", "cena di pesce importante"), non abbinamenti cibo generici già coperti altrove.
- cellarFit: valuta se questo vino colma una lacuna reale nella cantina attuale dell'utente (es. stile/tipologia mancante) o se è ridondante; motiva in 1-2 frasi concrete.
- wineDetails.drinkWindow: intervallo di anni realistico in base a tipologia e annata, es. "2025-2029".
- wineDetails.servingTemp: temperatura di servizio consigliata, es. "16-18°C".
- wineStyle: profilo sensoriale OGGETTIVO del vino, basato su tipologia/denominazione/vitigno/annata, identico indipendentemente dal registro linguistico. freshRich (1-6, 1=molto fresco, 6=molto ricco/opulento), sweetness/body/acidity/tannin/wood/persistence (1-5, 1=minimo, 5=massimo; per i bianchi il tannin sarà tipicamente 1). aromas: 4-6 descrittori aromatici brevi e concreti (es. "Mela", "Frutti rossi", "Vaniglia").

Rispondi ESCLUSIVAMENTE con JSON valido in ${langName}, nessun testo aggiuntivo.
Schema JSON: {"wineDetails": {"name": string, "producer": string, "year": string, "type": string, "region": string, "grape": string, "alcohol": string, "foodPairings": string[], "drinkWindow": string, "servingTemp": string}, "marketPriceEstimate": number, "isGoodDeal": boolean, "dealRating": "Excellent"|"Good"|"Fair"|"Bad", "qualityScore": number, "sommelierNotes": string, "strengths": string[], "weaknesses": string[], "bestOccasions": string[], "cellarFit": {"isRecommended": boolean, "reasoning": string}, "wineStyle": {"freshRich": number, "sweetness": number, "body": number, "acidity": number, "tannin": number, "wood": number, "persistence": number, "aromas": string[]}}`,
            messages: [{ role: 'user', content: contentParts }]
        });
        const result = JSON.parse(cleanJson(extractText(response)));
        if (knownYear && result.wineDetails) result.wineDetails.year = knownYear;
        if (extractedImageUrl) result.imageUrl = await compressStoredImage(extractedImageUrl);
        res.json(result);
    } catch (err) { res.status(500).json({ error: err.message || 'Errore Shop Advisor' }); }
});

app.post('/api/ai/suggest-restaurant-pairing', authenticateToken, async (req, res) => {
    const { menuSource, dish, lang = 'it', tone = 'pop' } = req.body;
    const langName = getLanguageName(lang);
    try {
        const contentParts = [];
        if (menuSource.type === 'images') {
            for (const img of menuSource.data) {
                contentParts.push({ type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: cleanBase64(img) } });
            }
        } else {
            contentParts.push({ type: 'text', text: menuSource.data });
        }
        contentParts.push({ type: 'text', text: `Scegli i migliori vini per: ${dish}. Max 2 per fascia (Economica/Media/Alta) o 3 totali se carta piccola. Rispondi in ${langName} solo JSON.` });
        const response = await growth.aiCreate(req.user.userId, 'suggest-restaurant-pairing', {
            model: MODEL, max_tokens: 2048, temperature: 0,
            system: `Sei un sommelier digitale che consulta la carta vini di un ristorante per consigliare il miglior abbinamento con il piatto scelto dal cliente.
${getToneInstructions(tone)}
IMPORTANTE: matchScore e priceCategory sono valutazioni OGGETTIVE, identiche indipendentemente dal registro linguistico richiesto: cambia solo lo stile delle spiegazioni testuali.
Regole:
- Leggi con attenzione i vini realmente presenti nella carta (nome, produttore, annata, prezzo se indicato): non inventare vini assenti dalla carta.
- matchScore (0-100): quanto il vino si abbina bene al piatto specifico, considerando ingredienti, cottura, intensità e struttura del vino. Guida: 85-100 abbinamento eccellente, 70-84 buono, 50-69 accettabile, <50 sconsigliato.
- reasoning: 1 frase concreta sul perché funziona (o non forzare abbinamenti deboli).
- priceCategory: classifica in base al prezzo relativo rispetto agli altri vini della stessa carta.

Rispondi ESCLUSIVAMENTE con un array JSON valido in ${langName}, nessun testo aggiuntivo.
Schema: [{"name": string, "producer": string, "year": string, "type": string, "price": number, "matchScore": number, "reasoning": string, "priceCategory": "Fascia Economica"|"Fascia Media"|"Fascia Alta"}]`,
            messages: [{ role: 'user', content: contentParts }]
        });
        res.json(JSON.parse(cleanJson(extractText(response) || '[]')));
    } catch (err) { res.status(500).json({ error: err.message || 'Errore analisi carta vini' }); }
});

app.post('/api/ai/analyze-restaurant', authenticateToken, async (req, res) => {
    const { wineList, foodMenu, lang = 'it' } = req.body;
    const langName = getLanguageName(lang);
    try {
        const response = await growth.aiCreate(req.user.userId, 'analyze-restaurant', {
            model: MODEL, max_tokens: 3000, temperature: 0,
            system: `Sei un Master Sommelier che esegue un audit tecnico professionale della carta vini di un ristorante, verificandone la coerenza con il menu cibo.
Analisi da svolgere:
- Copertura stilistica: la carta copre adeguatamente le tipologie necessarie per il menu (bianchi freschi, rossi strutturati, bollicine, vini da dessert, ecc.)?
- Rapporto qualità/prezzo e ampiezza delle fasce di prezzo.
- Per ogni portata del menu (courseDetails), identifica i vini della carta più adatti (bestMatches) e quelli palesemente inadatti (unsuitableWines), ed evidenzia stili di vino mancanti per quella portata (missingStyles).
- score (0.0-10.0): valutazione complessiva rigorosa. Guida: 9-10 carta eccellente e ben calibrata, 7-8.9 buona con margini di miglioramento, 5-6.9 sufficiente ma con lacune evidenti, <5 carta inadeguata al menu.
- strategicAdvice: 2-3 azioni concrete e prioritarie che il ristoratore dovrebbe fare per migliorare la carta.

Rispondi ESCLUSIVAMENTE con JSON valido in ${langName}, nessun testo aggiuntivo.
Schema JSON: {"score": number, "summary": string, "strengths": string[], "weaknesses": string[], "courseDetails": [{"course": string, "feedback": string, "bestMatches": string[], "unsuitableWines": string[], "missingStyles": string[]}], "strategicAdvice": string}`,
            messages: [{ role: 'user', content: `Audit Tecnico in ${langName}.\nCARTA VINI: ${wineList}\nMENU: ${foodMenu}` }]
        });
        const result = JSON.parse(cleanJson(extractText(response)));
        res.json({ ...result, generatedAt: new Date().toISOString() });
    } catch (err) { res.status(500).json({ error: 'Errore analisi professionale' }); }
});

app.post('/api/ai/extract-text', authenticateToken, async (req, res) => {
    const { base64Data, mimeType } = req.body;
    try {
        const isImage = mimeType.startsWith('image/');
        const contentParts = isImage
            ? [
                { type: 'image', source: { type: 'base64', media_type: mimeType, data: cleanBase64(base64Data) } },
                { type: 'text', text: 'OCR PROFESSIONALE. Estrai il testo mantenendo struttura e prezzi.' }
              ]
            : [{ type: 'text', text: `Estrai il testo dal contenuto (${mimeType}): ${base64Data}` }];
        const response = await growth.aiCreate(req.user.userId, 'extract-text', {
            model: MODEL, max_tokens: 4096,
            messages: [{ role: 'user', content: contentParts }]
        });
        res.json({ text: extractText(response) });
    } catch (err) { res.status(500).json({ error: 'Errore lettura media' }); }
});

const CELLAR_REPORT_COOLDOWN_BOTTLES = 10;

app.get('/api/cellar-report', authenticateToken, async (req, res) => {
    try {
        const userResult = await pool.query('SELECT cellar_report, cellar_report_history_count FROM users WHERE id = $1', [req.user.userId]);
        const user = userResult.rows[0];
        if (!user || !user.cellar_report) return res.json({ report: null, historyCount: 0 });
        const report = typeof user.cellar_report === 'string' ? JSON.parse(user.cellar_report) : user.cellar_report;
        res.json({ report, historyCount: user.cellar_report_history_count || 0 });
    } catch (err) { res.status(500).json({ error: 'Fetch failed' }); }
});

app.post('/api/ai/cellar-report', authenticateToken, async (req, res) => {
    const { inventory, history, lang = 'it', tone = 'pop' } = req.body;
    const langName = getLanguageName(lang);
    const currentHistoryCount = (history || []).length;
    try {
        const userResult = await pool.query('SELECT cellar_report, cellar_report_history_count FROM users WHERE id = $1', [req.user.userId]);
        const existingUser = userResult.rows[0];
        if (existingUser && existingUser.cellar_report) {
            const savedCount = existingUser.cellar_report_history_count || 0;
            if (currentHistoryCount - savedCount < CELLAR_REPORT_COOLDOWN_BOTTLES) {
                const cachedReport = typeof existingUser.cellar_report === 'string' ? JSON.parse(existingUser.cellar_report) : existingUser.cellar_report;
                return res.json(cachedReport);
            }
        }
    } catch (e) { console.error('Cellar report cache check failed', e); }
    const currentYear = new Date().getFullYear();
    const inventoryText = (inventory || []).filter(w => Number(w.quantity) > 0).map(w => [
        w.name, w.producer || '-', w.year || '-', w.type || '-', w.grape || '-', w.region || '-',
        `${w.quantity}bt`, w.price ? `pagato €${w.price}` : '-', w.marketPrice ? `mercato €${w.marketPrice}` : '-',
        w.qualityScore ? `qualità ${w.qualityScore}/100` : '-', w.drinkWindow ? `beva ${w.drinkWindow}` : '-'
    ].join(' | ')).join('\n');
    const historyText = [...(history || [])]
        .sort((a, b) => new Date(b.consumedDate).getTime() - new Date(a.consumedDate).getTime())
        .slice(0, 60)
        .map(h => [
            (h.consumedDate || '').slice(0, 10), h.name, h.producer || '-', h.year || '-', h.type || '-',
            h.rating ? `voto ${h.rating}/5` : 'non votato', h.price ? `€${h.price}` : '-',
            h.location ? `dove: ${h.location}` : '', h.notes ? `note: "${h.notes}"` : ''
        ].filter(Boolean).join(' | ')).join('\n');
    try {
        const requestBody = {
            max_tokens: 4096,
            system: `Sei un Master Sommelier che offre a un appassionato una consulenza personale sulla sua cantina domestica. Ricevi l'inventario attuale e lo storico delle bottiglie bevute (con voti 1-5, note personali e luoghi). Il tuo compito è restituire un report preciso, personale e utile, non generico.

${getToneInstructions(tone)}

Come ragionare:
- Lo storico è il segnale più affidabile dei gusti reali: i vini votati 4-5 e le note personali indicano cosa ama, quelli votati 1-2 cosa evitare. Pesali più della semplice composizione della cantina.
- Confronta ciò che l'utente ama bere con ciò che ha in cantina: le discrepanze sono il cuore dei consigli.
- Sii specifico: cita vini, produttori, vitigni e numeri reali presi dai dati. Mai frasi che andrebbero bene per chiunque.
- L'anno corrente è ${currentYear}: usalo per giudicare le finestre di beva.
- I numeri (score e scoreBreakdown) sono valutazioni oggettive e non cambiano con il registro linguistico richiesto.

Campi da produrre:
- headline: una frase brevissima (max 8 parole) che fotografa il tipo di appassionato, es. "Esploratore di bianchi aromatici del Nord".
- score (0-100): salute complessiva della cantina. 85-100 eccellente ed equilibrata, 65-84 buona con margini, 40-64 sbilanciata, <40 appena avviata.
- scoreBreakdown: cinque punteggi 0-100 che spiegano lo score: variety (varietà di tipologie, regioni, vitigni), quality (livello qualitativo medio), balance (equilibrio tra stili e fasce di prezzo), readiness (quante bottiglie sono nella finestra giusta, poche oltre il picco), value (rapporto qualità/prezzo pagato).
- overallAssessment: 2-3 frasi oneste su punti di forza e squilibri, con dati concreti (es. percentuali, conteggi).
- strengths: 2-3 punti di forza specifici della cantina, frasi brevi.
- palateTags: 3-6 tag brevissimi (2-3 parole) sul profilo di gusto.
- palateProfile: 2 frasi sul profilo di gusto, citando i vini più apprezzati dello storico.
- gapTags: 2-5 tag brevissimi su stili, tipologie o fasce mancanti.
- gapAnalysis: 1-2 frasi sulle lacune rispetto ai gusti dell'utente.
- buyRecommendations: 4 consigli d'acquisto concreti (etichetta o denominazione + produttore quando possibile), coerenti con i gusti e che colmino le lacune. Per ciascuno: wineName, type (tipologia), priceRange (es. "15-25€"), reason (1 frase che collega il consiglio ai gusti o a un vino amato).
- drinkNowPicks: fino a 4 nomi ESATTI di vini presenti in cantina da aprire per primi (finestra in chiusura o oltre il picco).
- drinkNowStrategy: 1-2 frasi su come organizzare le prossime aperture.

Rispondi ESCLUSIVAMENTE con un oggetto JSON valido, testi in ${langName}, senza markdown né testo aggiuntivo, con questo schema:
{"headline": string, "score": number, "scoreBreakdown": {"variety": number, "quality": number, "balance": number, "readiness": number, "value": number}, "overallAssessment": string, "strengths": string[], "palateTags": string[], "palateProfile": string, "gapTags": string[], "gapAnalysis": string, "buyRecommendations": [{"wineName": string, "type": string, "priceRange": string, "reason": string}], "drinkNowPicks": string[], "drinkNowStrategy": string}`,
            messages: [{ role: 'user', content: `<cantina formato="nome | produttore | annata | tipologia | vitigno | regione | quantità | prezzo pagato | valore di mercato | qualità | finestra di beva">\n${inventoryText || 'vuota'}\n</cantina>\n\n<storico formato="data | nome | produttore | annata | tipologia | voto | prezzo | luogo | note" ordine="dal più recente">\n${historyText || 'nessuna bottiglia bevuta'}\n</storico>\n\nGenera il report in ${langName}.` }]
        };
        let response;
        try {
            response = await growth.aiCreate(req.user.userId, 'cellar-report', { ...requestBody, model: CELLAR_REPORT_MODEL, output_config: { effort: 'low' } });
        } catch (primaryErr) {
            // Se il modello principale non è disponibile per questa chiave API, il report non deve rompersi.
            console.error(`Cellar report: ${CELLAR_REPORT_MODEL} non disponibile, uso ${MODEL}`, primaryErr?.status, primaryErr?.message);
            response = await growth.aiCreate(req.user.userId, 'cellar-report', { ...requestBody, model: MODEL });
        }
        if (response.stop_reason === 'refusal') return res.status(422).json({ error: 'Analisi non disponibile al momento, riprova più tardi.' });
        const report = JSON.parse(cleanJson(extractText(response) || '{}'));
        try {
            await pool.query(
                'UPDATE users SET cellar_report = $1, cellar_report_history_count = $2, cellar_report_generated_at = NOW() WHERE id = $3',
                [JSON.stringify(report), currentHistoryCount, req.user.userId]
            );
        } catch (e) { console.error('Cellar report save failed', e); }
        res.json(report);
    } catch (err) { res.status(500).json({ error: err.message || 'Errore report' }); }
});

// --- EXISTING ENDPOINTS ---

app.get('/api/config', (req, res) => {
    res.json({ googleClientId: GOOGLE_CLIENT_ID || '' });
});

app.post('/api/auth/google', async (req, res) => {
    const token = req.body.token;
    const language = req.body.language;
    const ref = req.body.ref;
    const marketingConsent = req.body.marketingConsent === true;
    if (!GOOGLE_CLIENT_ID || !token) return res.status(400).json({ error: 'Missing params' });
    try {
        const client = new OAuth2Client(GOOGLE_CLIENT_ID);
        const ticket = await client.verifyIdToken({ idToken: token, audience: GOOGLE_CLIENT_ID });
        const payload = ticket.getPayload();
        if (!payload || !payload.email) return res.status(400).json({ error: 'Invalid payload' });
        const { email, sub: googleId } = payload;
        let result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        let user = result.rows[0];
        if (!user) {
            if (req.body.privacyAccepted !== true) return res.status(400).json({ error: "Per registrarti devi accettare l'informativa privacy e i termini." });
            const userId = 'u_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
            const { source, meta } = normalizeSignupSource(req.body.source);
            const newUserResult = await pool.query(
                `INSERT INTO users (id, email, google_id, role, is_premium, language, ref_restaurant_slug, signup_source, signup_meta, privacy_accepted_at, marketing_consent, marketing_consent_at)
                 VALUES ($1, $2, $3, 'user', FALSE, $4, $5, $6, $7, NOW(), $8, CASE WHEN $8 THEN NOW() ELSE NULL END) RETURNING *`,
                [userId, email, googleId, language || 'it', ref || null, ref ? 'ristorante' : source, JSON.stringify(meta), marketingConsent]
            );
            user = newUserResult.rows[0];
            growth.trackEvent(user.id, 'signup', { method: 'google', source: user.signup_source });
        }
        const jwtToken = jwt.sign({ userId: user.id, email: user.email, role: user.role, isPremium: user.is_premium, language: user.language || 'it' }, JWT_SECRET, { expiresIn: '30d' });
        res.json({ token: jwtToken, user: { id: user.id, email: user.email, role: user.role, is_premium: user.is_premium, language: user.language || 'it' } });
    } catch (err) { res.status(500).json({ error: 'Google auth failed' }); }
});

app.post('/api/auth/register', async (req, res) => {
    const { email, password, language, ref } = req.body;
    const marketingConsent = req.body.marketingConsent === true;
    if (!email || !password) return res.status(400).json({ error: 'Email e password richiesti' });
    if (password.length < 6) return res.status(400).json({ error: 'La password deve avere almeno 6 caratteri' });
    if (req.body.privacyAccepted !== true) return res.status(400).json({ error: "Per registrarti devi accettare l'informativa privacy e i termini." });
    try {
        const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
        if (existing.rows[0]) return res.status(400).json({ error: 'Email già registrata' });
        const hashedPassword = await bcrypt.hash(password, 10);
        const userId = 'u_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
        const { source, meta } = normalizeSignupSource(req.body.source);
        const result = await pool.query(
            `INSERT INTO users (id, email, password, role, is_premium, language, ref_restaurant_slug, signup_source, signup_meta, privacy_accepted_at, marketing_consent, marketing_consent_at)
             VALUES ($1, $2, $3, 'user', FALSE, $4, $5, $6, $7, NOW(), $8, CASE WHEN $8 THEN NOW() ELSE NULL END) RETURNING *`,
            [userId, email, hashedPassword, language || 'it', ref || null, ref ? 'ristorante' : source, JSON.stringify(meta), marketingConsent]
        );
        const user = result.rows[0];
        growth.trackEvent(user.id, 'signup', { method: 'email', source: user.signup_source });
        const token = jwt.sign({ userId: user.id, email: user.email, role: user.role, isPremium: user.is_premium, language: user.language || 'it' }, JWT_SECRET, { expiresIn: '30d' });
        res.json({ token, user: { id: user.id, email: user.email, role: user.role, is_premium: user.is_premium, language: user.language || 'it' } });
    } catch (err) {
        console.error('Register error:', err);
        res.status(500).json({ error: 'Registrazione fallita' });
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

app.get('/api/users/me', authenticateToken, async (req, res) => {
    try {
        const userResult = await pool.query(
            `SELECT id, email, role, is_premium, language, ai_usage_count, cellar_report, cellar_report_history_count,
                    heard_from, marketing_consent, premium_source, premium_plan, premium_until,
                    (stripe_customer_id IS NOT NULL) AS has_billing_account
             FROM users WHERE id = $1`, [req.user.userId]);
        const user = userResult.rows[0];
        if (!user) return res.status(404).json({ error: 'User not found' });
        user.ai_usage_month = await growth.monthlyAiCalls(user.id);
        if (typeof user.cellar_report === 'string') try { user.cellar_report = JSON.parse(user.cellar_report); } catch(e) {}
        const restResult = await pool.query(`SELECT r.*, (SELECT COUNT(*) FROM users WHERE ref_restaurant_slug = r.slug) as user_count, (SELECT SUM(ai_usage_count) FROM users WHERE ref_restaurant_slug = r.slug) as total_ai_usage FROM restaurants r WHERE r.manager_id = $1`, [user.id]);
        if (restResult.rows[0]) {
            const rest = restResult.rows[0];
            if (typeof rest.menu_analysis === 'string') try { rest.menu_analysis = JSON.parse(rest.menu_analysis); } catch(e) {}
            user.managed_restaurant = rest;
        }
        res.json(user);
    } catch (err) { res.status(500).json({ error: 'Fetch failed' }); }
});

// Cancellazione account da parte dell'utente.
// Requisito obbligatorio Apple (App Store Review 5.1.1 v) e Google Play (Data deletion).
// I dati collegati (vini, storico, posizioni) vengono eliminati in cascata dal database.
app.delete('/api/users/me', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query('SELECT role FROM users WHERE id = $1', [req.user.userId]);
        const user = result.rows[0];
        if (!user) return res.status(404).json({ error: 'Utente non trovato' });
        if (user.role === 'admin') {
            return res.status(403).json({ error: "Gli account amministratore non possono essere eliminati dall'app. Contatta il supporto." });
        }
        await pool.query('DELETE FROM users WHERE id = $1', [req.user.userId]);
        res.json({ success: true });
    } catch (err) {
        console.error('Account deletion error:', err);
        res.status(500).json({ error: "Eliminazione non riuscita" });
    }
});

app.put('/api/users/me/password', authenticateToken, async (req, res) => {
    const { newPassword } = req.body || {};
    if (typeof newPassword !== 'string' || newPassword.length < 6) return res.status(400).json({ error: 'La password deve avere almeno 6 caratteri' });
    try {
        await pool.query('UPDATE users SET password = $1 WHERE id = $2', [await bcrypt.hash(newPassword, 10), req.user.userId]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: 'Aggiornamento non riuscito' }); }
});

app.put('/api/users/me/language', authenticateToken, async (req, res) => {
    const { language } = req.body || {};
    if (!['it', 'en', 'fr', 'es', 'de'].includes(language)) return res.status(400).json({ error: 'Lingua non valida' });
    try {
        await pool.query('UPDATE users SET language = $1 WHERE id = $2', [language, req.user.userId]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: 'Aggiornamento non riuscito' }); }
});

app.put('/api/managed-restaurant', authenticateToken, async (req, res) => {
    const { menu_context, food_menu, menu_analysis } = req.body;
    try {
        const updates = []; const values = []; let idx = 1;
        if (menu_context !== undefined) { updates.push(`menu_context = $${idx++}`); values.push(menu_context); }
        if (food_menu !== undefined) { updates.push(`food_menu = $${idx++}`); values.push(food_menu); }
        if (menu_analysis !== undefined) { updates.push(`menu_analysis = $${idx++}`); values.push(menu_analysis ? JSON.stringify(menu_analysis) : null); }
        if (updates.length === 0) return res.status(400).json({ error: 'No fields' });
        values.push(req.user.userId);
        const result = await pool.query(`UPDATE restaurants SET ${updates.join(', ')} WHERE manager_id = $${idx} RETURNING *`, values);
        if (result.rowCount === 0) return res.status(403).json({ error: 'Forbidden' });
        const fullResult = await pool.query(`SELECT r.*, (SELECT COUNT(*) FROM users WHERE ref_restaurant_slug = r.slug) as user_count, (SELECT SUM(ai_usage_count) FROM users WHERE ref_restaurant_slug = r.slug) as total_ai_usage FROM restaurants r WHERE r.id = $1`, [result.rows[0].id]);
        const rest = fullResult.rows[0];
        if (typeof rest.menu_analysis === 'string') try { rest.menu_analysis = JSON.parse(rest.menu_analysis); } catch(e) {}
        res.json({ success: true, restaurant: rest });
    } catch (err) { res.status(500).json({ error: 'Update failed' }); }
});

app.post('/api/users/track-ai', authenticateToken, async (req, res) => {
    try {
        await pool.query('UPDATE users SET ai_usage_count = ai_usage_count + 1 WHERE id = $1', [req.user.userId]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: 'Track failed' }); }
});

app.get('/api/search-prices', authenticateToken, async (req, res) => {
    const { query } = req.query;
    try {
        const response = await growth.aiCreate(req.user.userId, 'search-prices', {
            model: MODEL, max_tokens: 1500,
            tools: [{ type: 'web_search_20250305', name: 'web_search', max_uses: 4 }],
            system: `Sei un assistente che cerca prezzi REALI di vini su negozi online italiani ed europei (es. Tannico, Vino.com, Callmewine, Bernabei, Wineplatform, Xtrawine, Google Shopping) usando la ricerca web.
Regole:
- Cerca il vino esatto richiesto (nome, produttore, annata) e trova fino a 5 offerte REALI trovate nella ricerca, ordinate dal prezzo più basso al più alto.
- NON INVENTARE prezzi o negozi: usa solo dati effettivamente trovati nei risultati di ricerca.
- source: nome del negozio/sito reale.
- price: prezzo numerico in euro come trovato (solo numero, senza simbolo).
- link: URL diretto alla pagina del prodotto se disponibile nei risultati, altrimenti stringa vuota.
- Se non trovi abbastanza risultati affidabili, restituisci un array più corto o vuoto piuttosto che inventare dati.

Rispondi ESCLUSIVAMENTE con un array JSON valido, nessun testo aggiuntivo, nessuna spiegazione.
Schema: [{"source": string, "price": number, "currency": "EUR", "link": string}]`,
            messages: [{ role: 'user', content: `Cerca i prezzi attuali online per: ${query}` }]
        });
        const textBlocks = response.content.filter(b => b.type === 'text');
        const finalText = textBlocks.length > 0 ? textBlocks[textBlocks.length - 1].text : '[]';
        const prices = JSON.parse(cleanJson(finalText) || '[]');
        res.json(Array.isArray(prices) ? prices.slice(0, 5) : []);
    } catch (err) {
        console.error('Price search error:', err);
        res.status(500).json({ error: 'Search failed' });
    }
});

app.get('/api/wines', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM wines WHERE user_id = $1 ORDER BY created_at DESC', [req.user.userId]);
        res.json(result.rows.map(mapWineToFrontend));
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/wines', authenticateToken, async (req, res) => {
    const wine = req.body;
    try {
        if (wine.imageUrl) wine.imageUrl = await compressStoredImage(wine.imageUrl);
        await pool.query(
            `INSERT INTO wines (id, user_id, name, producer, year, type, region, grape, alcohol, purchase_date, price, quantity, location, storage_temp, storage_advice, serving_temp, serving_advice, food_pairings, image_url, drink_window, market_price, quality_score, wine_style, cellar_slots)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24)`,
            [wine.id, req.user.userId, wine.name, wine.producer, wine.year, wine.type, wine.region, wine.grape, wine.alcohol, wine.purchaseDate, wine.price, wine.quantity, wine.location, wine.storageTemp, wine.storageAdvice, wine.servingTemp, wine.servingAdvice, wine.foodPairings, wine.imageUrl, wine.drinkWindow, wine.marketPrice, wine.qualityScore ?? null, wine.wineStyle ? JSON.stringify(wine.wineStyle) : null, JSON.stringify(wine.cellarSlots || [])]
        );
        growth.trackEvent(req.user.userId, 'wine_added', { withPhoto: Boolean(wine.imageUrl) });
        res.status(201).json(wine);
    } catch (err) { res.status(500).json({ error: 'Failed' }); }
});

// Unici campi modificabili: i nomi delle colonne non arrivano mai dal client.
const WINE_UPDATABLE_COLUMNS = {
    name: 'name', producer: 'producer', year: 'year', type: 'type', region: 'region', grape: 'grape',
    alcohol: 'alcohol', purchaseDate: 'purchase_date', price: 'price', quantity: 'quantity', location: 'location',
    storageTemp: 'storage_temp', storageAdvice: 'storage_advice', servingTemp: 'serving_temp', servingAdvice: 'serving_advice',
    foodPairings: 'food_pairings', imageUrl: 'image_url', drinkWindow: 'drink_window', marketPrice: 'market_price',
    qualityScore: 'quality_score', wineStyle: 'wine_style', cellarSlots: 'cellar_slots',
};

app.put('/api/wines/:id', authenticateToken, async (req, res) => {
    try {
        const body = req.body && typeof req.body === 'object' ? req.body : {};
        const columns = [];
        const values = [];
        for (const [key, column] of Object.entries(WINE_UPDATABLE_COLUMNS)) {
            if (!Object.prototype.hasOwnProperty.call(body, key)) continue;
            let value = body[key];
            if (key === 'imageUrl' && value) value = await compressStoredImage(value);
            if (key === 'wineStyle') value = value ? JSON.stringify(value) : null;
            if (key === 'cellarSlots') value = JSON.stringify(Array.isArray(value) ? value : []);
            columns.push(column);
            values.push(value);
        }
        if (columns.length === 0) return res.status(400).json({ error: 'Nessun campo da aggiornare' });
        const setClause = columns.map((c, i) => `${c} = $${i + 1}`).join(', ');
        await pool.query(`UPDATE wines SET ${setClause} WHERE id = $${values.length + 1} AND user_id = $${values.length + 2}`, [...values, req.params.id, req.user.userId]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: 'Failed' }); }
});

app.delete('/api/wines/:id', authenticateToken, async (req, res) => {
    try {
        await pool.query('DELETE FROM wines WHERE id = $1 AND user_id = $2', [req.params.id, req.user.userId]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: 'Failed' }); }
});

const REVALUATION_COOLDOWN_DAYS = 30;

app.get('/api/cellar-value-history', authenticateToken, async (req, res) => {
    try {
        const snapshots = await pool.query('SELECT total_value, bottle_count, created_at FROM cellar_value_snapshots WHERE user_id = $1 ORDER BY created_at ASC', [req.user.userId]);
        const userResult = await pool.query('SELECT last_revaluation_at FROM users WHERE id = $1', [req.user.userId]);
        const lastAt = userResult.rows[0]?.last_revaluation_at || null;
        let nextAvailableAt = null;
        let canRevalue = true;
        if (lastAt) {
            const next = new Date(lastAt);
            next.setDate(next.getDate() + REVALUATION_COOLDOWN_DAYS);
            nextAvailableAt = next.toISOString();
            canRevalue = new Date() >= next;
        }
        res.json({
            snapshots: snapshots.rows.map(s => ({ totalValue: parseFloat(s.total_value) || 0, bottleCount: s.bottle_count, date: s.created_at })),
            lastRevaluationAt: lastAt,
            nextAvailableAt,
            canRevalue
        });
    } catch (err) { res.status(500).json({ error: err.message || 'Errore caricamento storico valore cantina' }); }
});

app.post('/api/wines/revalue', authenticateToken, async (req, res) => {
    try {
        const userResult = await pool.query('SELECT last_revaluation_at FROM users WHERE id = $1', [req.user.userId]);
        const lastAt = userResult.rows[0]?.last_revaluation_at;
        const now = new Date();
        if (lastAt) {
            const next = new Date(lastAt);
            next.setDate(next.getDate() + REVALUATION_COOLDOWN_DAYS);
            if (now < next) {
                return res.status(429).json({ error: 'Puoi ricalcolare il valore della cantina una volta al mese.', nextAvailableAt: next.toISOString() });
            }
        }

        const winesResult = await pool.query('SELECT id, name, producer, year, type, region, grape, quantity, market_price FROM wines WHERE user_id = $1 AND quantity > 0', [req.user.userId]);
        const wines = winesResult.rows;
        if (wines.length === 0) return res.status(400).json({ error: 'La cantina è vuota: aggiungi qualche vino prima di ricalcolare il valore.' });

        const list = wines.map(w => `${w.id}|${w.name || ''}|${w.producer || ''}|${w.year || ''}|${w.region || ''}|${w.grape || ''}`).join('\n');
        const response = await growth.aiCreate(req.user.userId, 'revalue', {
            model: MODEL, max_tokens: 4096, temperature: 0,
            system: `Sei un esperto di mercato enologico. Riceverai un elenco di vini nel formato "id|nome|produttore|annata|regione|vitigno", uno per riga. Per OGNUNO, stima il prezzo di mercato ATTUALE e realistico in euro per una singola bottiglia, basandoti su produttore, denominazione, annata e reputazione. Rispondi ESCLUSIVAMENTE con un array JSON valido, nessun testo aggiuntivo, un elemento per ogni id ricevuto (stesso id, non alterarlo). Schema: [{"id": string, "marketPrice": number}]`,
            messages: [{ role: 'user', content: `Elenco vini:\n${list}` }]
        });
        const updates = JSON.parse(cleanJson(extractText(response)));
        const updateMap = new Map((Array.isArray(updates) ? updates : []).map(u => [String(u.id), Number(u.marketPrice) || 0]));

        const updatedWines = [];
        for (const w of wines) {
            const newPrice = updateMap.get(w.id);
            const finalPrice = (newPrice && newPrice > 0) ? newPrice : (parseFloat(w.market_price) || 0);
            if (newPrice && newPrice > 0) {
                await pool.query('UPDATE wines SET market_price = $1 WHERE id = $2 AND user_id = $3', [newPrice, w.id, req.user.userId]);
            }
            updatedWines.push({ id: w.id, marketPrice: finalPrice });
        }

        const totalValue = wines.reduce((sum, w) => {
            const matched = updatedWines.find(u => u.id === w.id);
            return sum + (matched ? matched.marketPrice : 0) * Number(w.quantity || 0);
        }, 0);
        const bottleCount = wines.reduce((sum, w) => sum + Number(w.quantity || 0), 0);

        const snapshotId = randomUUID();
        await pool.query('INSERT INTO cellar_value_snapshots (id, user_id, total_value, bottle_count) VALUES ($1, $2, $3, $4)', [snapshotId, req.user.userId, totalValue, bottleCount]);
        await pool.query('UPDATE users SET last_revaluation_at = NOW() WHERE id = $1', [req.user.userId]);

        const nextAvailableAt = new Date(now);
        nextAvailableAt.setDate(nextAvailableAt.getDate() + REVALUATION_COOLDOWN_DAYS);

        res.json({ wines: updatedWines, totalValue, bottleCount, revaluedAt: now.toISOString(), nextAvailableAt: nextAvailableAt.toISOString() });
    } catch (err) { res.status(500).json({ error: err.message || 'Errore nel ricalcolo del valore della cantina' }); }
});

app.get('/api/history', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM history WHERE user_id = $1 ORDER BY consumed_date DESC', [req.user.userId]);
        res.json(result.rows.map(h => ({
            id: h.id, wineId: h.wine_id, name: h.name, producer: h.producer, year: h.year, type: h.type,
            price: parseFloat(h.price) || 0, imageUrl: h.image_url, consumedDate: h.consumed_date,
            rating: h.rating || 0, notes: h.notes || '', location: h.location || 'Cantina'
        })));
    } catch (err) { res.status(500).json({ error: 'Failed' }); }
});

app.post('/api/history', authenticateToken, async (req, res) => {
    const h = req.body;
    try {
        if (h.imageUrl) h.imageUrl = await compressStoredImage(h.imageUrl);
        await pool.query(
            `INSERT INTO history (id, user_id, wine_id, name, producer, year, type, price, image_url, consumed_date, rating, notes, location)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
            [h.id, req.user.userId, h.wineId, h.name, h.producer, h.year, h.type, h.price, h.imageUrl, h.consumedDate, h.rating || 0, h.notes || '', h.location || 'Cantina']
        );
        growth.trackEvent(req.user.userId, 'bottle_opened', { fromCellar: !String(h.wineId || '').startsWith('ext_') });
        res.status(201).json(h);
    } catch (err) { res.status(500).json({ error: 'Failed' }); }
});

app.put('/api/history/:id', authenticateToken, async (req, res) => {
    const { rating, notes, location } = req.body;
    try {
        await pool.query('UPDATE history SET rating = $1, notes = $2, location = $3 WHERE id = $4 AND user_id = $5', [rating || 0, notes || '', location || '', req.params.id, req.user.userId]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: 'Failed' }); }
});

app.delete('/api/history/:id', authenticateToken, async (req, res) => {
    try {
        await pool.query('DELETE FROM history WHERE id = $1 AND user_id = $2', [req.params.id, req.user.userId]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: 'Failed to delete history entry' }); }
});

app.get('/api/locations', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM locations WHERE user_id = $1', [req.user.userId]);
        res.json(result.rows.map(mapLocationToFrontend));
    } catch (err) { res.status(500).json({ error: 'Failed' }); }
});

app.post('/api/locations', authenticateToken, async (req, res) => {
    const { id, name, kind = 'generic', layout = null } = req.body;
    try {
        await pool.query('INSERT INTO locations (id, user_id, name, kind, layout) VALUES ($1, $2, $3, $4, $5)', [id, req.user.userId, name, kind, layout ? JSON.stringify(layout) : null]);
        res.status(201).json({ id, name, kind, layout });
    } catch (err) { res.status(500).json({ error: 'Failed' }); }
});

app.put('/api/locations/:id', authenticateToken, async (req, res) => {
    const { kind = 'generic', layout = null } = req.body;
    if (!['generic', 'rack', 'fridge'].includes(kind)) return res.status(400).json({ error: 'Tipo di posizione non valido' });
    try {
        await pool.query('UPDATE locations SET kind = $1, layout = $2 WHERE id = $3 AND user_id = $4', [kind, layout ? JSON.stringify(layout) : null, req.params.id, req.user.userId]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: 'Failed' }); }
});

app.delete('/api/locations/:id', authenticateToken, async (req, res) => {
    try {
        await pool.query('DELETE FROM locations WHERE id = $1 AND user_id = $2', [req.params.id, req.user.userId]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: 'Failed' }); }
});

app.get('/api/users', authenticateAdmin, async (req, res) => {
    try {
        const result = await pool.query(`SELECT u.id, u.email, u.role, u.is_premium, u.premium_source, u.language, u.ai_usage_count, u.ref_restaurant_slug, u.signup_source, u.heard_from, u.created_at, u.last_seen_at, u.marketing_consent, COALESCE((SELECT SUM(quantity) FROM wines WHERE user_id = u.id), 0) as wine_count, (SELECT COUNT(*) FROM ai_calls a WHERE a.user_id = u.id)::int AS ai_calls_count, (SELECT COALESCE(SUM(cost_usd), 0) FROM ai_calls a WHERE a.user_id = u.id)::float AS ai_cost_usd FROM users u ORDER BY created_at DESC`);
        res.json(result.rows);
    } catch (err) { res.status(500).json({ error: 'Failed' }); }
});

// Premium regalato dall'admin (es. contatti della fiera): non viene toccato dai rinnovi Stripe.
app.put('/api/users/:id/premium', authenticateAdmin, async (req, res) => {
    try {
        const result = await pool.query(
            `UPDATE users SET is_premium = NOT is_premium, premium_source = CASE WHEN is_premium THEN NULL ELSE 'admin' END
             WHERE id = $1 AND NOT (is_premium AND premium_source = 'stripe') RETURNING is_premium`,
            [req.params.id]
        );
        if (result.rowCount === 0) return res.status(409).json({ error: "L'utente ha un abbonamento Stripe attivo: gestiscilo da Stripe." });
        res.json({ success: true, is_premium: result.rows[0].is_premium });
    } catch (err) { res.status(500).json({ error: 'Failed' }); }
});

app.put('/api/users/:id/reset-password', authenticateAdmin, async (req, res) => {
    const { newPassword } = req.body || {};
    if (typeof newPassword !== 'string' || newPassword.length < 6) return res.status(400).json({ error: 'La password deve avere almeno 6 caratteri' });
    try {
        await pool.query('UPDATE users SET password = $1 WHERE id = $2', [await bcrypt.hash(newPassword, 10), req.params.id]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: 'Failed' }); }
});

app.delete('/api/users/:id', authenticateAdmin, async (req, res) => {
    try {
        const result = await pool.query("DELETE FROM users WHERE id = $1 AND role <> 'admin'", [req.params.id]);
        if (result.rowCount === 0) return res.status(404).json({ error: 'Utente non trovato o amministratore' });
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: 'Failed' }); }
});

app.post('/api/admin/recompress-images', authenticateAdmin, async (req, res) => {
    try {
        let winesProcessed = 0, historyProcessed = 0;
        const wines = await pool.query(`SELECT id, image_url FROM wines WHERE image_url IS NOT NULL AND length(image_url) > 60000`);
        for (const w of wines.rows) {
            const compressed = await compressStoredImage(w.image_url);
            await pool.query('UPDATE wines SET image_url = $1 WHERE id = $2', [compressed, w.id]);
            winesProcessed++;
        }
        const history = await pool.query(`SELECT id, image_url FROM history WHERE image_url IS NOT NULL AND length(image_url) > 60000`);
        for (const h of history.rows) {
            const compressed = await compressStoredImage(h.image_url);
            await pool.query('UPDATE history SET image_url = $1 WHERE id = $2', [compressed, h.id]);
            historyProcessed++;
        }
        res.json({ success: true, winesProcessed, historyProcessed });
    } catch (err) {
        console.error('Recompress error:', err);
        res.status(500).json({ error: 'Recompress failed' });
    }
});

app.get('/api/admin/restaurants', authenticateAdmin, async (req, res) => {
    try {
        const result = await pool.query(`SELECT r.*, u.email as manager_email, (SELECT COUNT(*) FROM users WHERE ref_restaurant_slug = r.slug) as user_count, (SELECT SUM(ai_usage_count) FROM users WHERE ref_restaurant_slug = r.slug) as total_ai_usage FROM restaurants r LEFT JOIN users u ON r.manager_id = u.id ORDER BY r.created_at DESC`);
        res.json(result.rows);
    } catch (err) { res.status(500).json({ error: 'Failed' }); }
});

app.post('/api/admin/restaurants', authenticateAdmin, async (req, res) => {
    const { id, name, slug, menu_context, food_menu, manager_id, menu_analysis } = req.body;
    const restId = id || 'r_' + Math.random().toString(36).substr(2, 9);
    try {
        await pool.query(
            `INSERT INTO restaurants (id, name, slug, menu_context, food_menu, manager_id, menu_analysis) VALUES ($1, $2, $3, $4, $5, $6, $7)
             ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, slug = EXCLUDED.slug, menu_context = EXCLUDED.menu_context, food_menu = EXCLUDED.food_menu, manager_id = EXCLUDED.manager_id, menu_analysis = EXCLUDED.menu_analysis`,
            [restId, name, slug, menu_context, food_menu, manager_id || null, menu_analysis ? JSON.stringify(menu_analysis) : null]
        );
        res.json({ success: true });
    } catch (err) {
        console.error('Admin Restaurant Save Error:', err);
        res.status(500).json({ error: 'Save failed' });
    }
});

app.delete('/api/admin/restaurants/:id', authenticateAdmin, async (req, res) => {
    try {
        await pool.query('DELETE FROM restaurants WHERE id = $1', [req.params.id]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: 'Failed' }); }
});

app.get('/api/restaurants/:slug', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM restaurants WHERE slug = $1', [req.params.slug]);
        res.json(result.rows[0]);
    } catch (err) { res.status(500).json({ error: 'Failed' }); }
});

app.post('/api/shares', async (req, res) => {
    const id = Math.random().toString(36).substr(2, 8);
    try {
        await pool.query('INSERT INTO shares (id, data) VALUES ($1, $2)', [id, req.body.data]);
        res.json({ id });
    } catch (err) { res.status(500).json({ error: 'Failed' }); }
});

app.get('/api/shares/:id', async (req, res) => {
    try {
        const result = await pool.query('SELECT data FROM shares WHERE id = $1', [req.params.id]);
        if (result.rows[0]) res.json(result.rows[0].data);
        else res.status(404).json({ error: 'Not found' });
    } catch (err) { res.status(500).json({ error: 'Failed' }); }
});

const distPath = path.resolve(__dirname, '../dist');
app.use(express.static(distPath));
// Vecchi indirizzi dell'Academy: redirect permanente al nuovo percorso /guide/<slug>
app.get('/guida/:slug', (req, res) => res.redirect(301, `/guide/${encodeURIComponent(req.params.slug)}`));
// --- SEO: sitemap.xml e robots.txt per Google Search Console ---
// Le guide si leggono dal file dell'Academy: ogni nuova guida entra da sola nella sitemap.
const SITE_URL = (process.env.SITE_URL || 'https://aiknow.wine').replace(/\/$/, '');
const guideSlugs = (() => {
    try {
        const src = fs.readFileSync(path.resolve(__dirname, '../constants/academy.ts'), 'utf8');
        return [...new Set([...src.matchAll(/slug:\s*'([a-z0-9-]+)'/g)].map(m => m[1]))];
    } catch (e) { console.error('Sitemap: guide non lette', e.message); return []; }
})();
app.get('/sitemap.xml', (req, res) => {
    const pages = [
        { loc: '/', priority: '1.0' },
        { loc: '/guide', priority: '0.8' },
        ...guideSlugs.map(slug => ({ loc: `/guide/${slug}`, priority: '0.7' })),
        ...['/ristoranti', '/restaurants', '/restaurants-fr', '/restaurantes', '/restaurants-de'].map(loc => ({ loc, priority: '0.6' })),
        { loc: '/privacy', priority: '0.2' },
        { loc: '/termini', priority: '0.2' },
    ];
    const body = pages.map(p => `  <url><loc>${SITE_URL}${p.loc}</loc><priority>${p.priority}</priority></url>`).join('\n');
    res.type('application/xml').send(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`);
});
app.get('/robots.txt', (req, res) => {
    res.type('text/plain').send(`User-agent: *\nAllow: /\nDisallow: /api/\nDisallow: /qr/\n\nSitemap: ${SITE_URL}/sitemap.xml\n`);
});
// Verifica di Search Console con file HTML: GOOGLE_SITE_VERIFICATION = nome del file dato da Google (es. google1234abcd.html)
if (process.env.GOOGLE_SITE_VERIFICATION) {
    const file = process.env.GOOGLE_SITE_VERIFICATION.replace(/^\//, '');
    app.get(`/${file}`, (req, res) => res.type('text/html').send(`google-site-verification: ${file}`));
}

// Link brevi per i materiali stampati: aiknow.wine/qr/fivi26 → home con sorgente tracciata
app.get('/qr/:src', (req, res) => res.redirect(302, `/?src=${encodeURIComponent(String(req.params.src).slice(0, 60))}`));
app.get('*', (req, res) => res.sendFile(path.resolve(distPath, 'index.html')));

const initDb = async () => {
    const client = await pool.connect();
    try {
        await client.query(`CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, email TEXT UNIQUE NOT NULL, password TEXT, role TEXT DEFAULT 'user', is_premium BOOLEAN DEFAULT FALSE, language TEXT DEFAULT 'it', ai_usage_count INTEGER DEFAULT 0, google_id TEXT, ref_restaurant_slug TEXT, created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP);`);
        await client.query(`CREATE TABLE IF NOT EXISTS wines (id TEXT PRIMARY KEY, user_id TEXT REFERENCES users(id) ON DELETE CASCADE, name TEXT NOT NULL, producer TEXT, year TEXT, type TEXT, region TEXT, grape TEXT, alcohol TEXT, purchase_date TEXT, price DECIMAL, quantity INTEGER DEFAULT 1, location TEXT, storage_temp TEXT, storage_advice TEXT, serving_temp TEXT, serving_advice TEXT, food_pairings TEXT[], image_url TEXT, drink_window TEXT, market_price DECIMAL, created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP);`);
        await client.query(`CREATE TABLE IF NOT EXISTS history (id TEXT PRIMARY KEY, user_id TEXT REFERENCES users(id) ON DELETE CASCADE, wine_id TEXT, name TEXT, producer TEXT, year TEXT, type TEXT, price DECIMAL, image_url TEXT, consumed_date TEXT, rating INTEGER DEFAULT 0, notes TEXT, location TEXT, created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP);`);
        await client.query(`CREATE TABLE IF NOT EXISTS locations (id TEXT PRIMARY KEY, user_id TEXT REFERENCES users(id) ON DELETE CASCADE, name TEXT NOT NULL);`);
        await client.query(`CREATE TABLE IF NOT EXISTS restaurants (id TEXT PRIMARY KEY, slug TEXT UNIQUE NOT NULL, name TEXT NOT NULL, menu_context TEXT, food_menu TEXT, menu_analysis JSONB, manager_id TEXT REFERENCES users(id) ON DELETE SET NULL, created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP);`);
        await client.query(`CREATE TABLE IF NOT EXISTS shares (id TEXT PRIMARY KEY, data JSONB NOT NULL, created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP);`);
        await client.query(`CREATE TABLE IF NOT EXISTS cellar_value_snapshots (id TEXT PRIMARY KEY, user_id TEXT REFERENCES users(id) ON DELETE CASCADE, total_value DECIMAL, bottle_count INTEGER, created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP);`);
        await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS last_revaluation_at TIMESTAMP WITH TIME ZONE;`);
        await client.query(`ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS food_menu TEXT;`);
        await client.query(`ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS menu_analysis JSONB;`);
        await client.query(`ALTER TABLE wines ADD COLUMN IF NOT EXISTS quality_score INTEGER;`);
        await client.query(`ALTER TABLE wines ADD COLUMN IF NOT EXISTS wine_style JSONB;`);
        await client.query(`ALTER TABLE wines ADD COLUMN IF NOT EXISTS cellar_slots JSONB;`);
        await client.query(`ALTER TABLE locations ADD COLUMN IF NOT EXISTS kind TEXT DEFAULT 'generic';`);
        await client.query(`ALTER TABLE locations ADD COLUMN IF NOT EXISTS layout JSONB;`);
        await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS cellar_report JSONB;`);
        await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS cellar_report_history_count INTEGER DEFAULT 0;`);
        await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS cellar_report_generated_at TIMESTAMP WITH TIME ZONE;`);
        await growth.initGrowthDb(client);
        await billing.initBillingDb(client);
        console.log('DB Ready');
    } catch (e) { console.error('DB Init Error', e); }
    finally { client.release(); }
};

app.listen(PORT, () => { console.log(`Server on port ${PORT}`); initDb(); try { startBotWakeup(); } catch (e) { console.warn('[sveglia bot] non avviata', e && e.name); } });
