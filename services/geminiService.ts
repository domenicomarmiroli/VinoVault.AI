
import { GoogleGenAI, Type } from "@google/genai";
import { Wine, WineType, PairingSuggestion, PurchaseAnalysis, WineDeal, RestaurantSuggestion } from "../types";

// Helper to remove base64 prefix
const cleanBase64 = (base64: string) => {
  return base64.replace(/^data:image\/(png|jpg|jpeg|webp);base64,/, "");
};

// Helper to clean Markdown JSON blocks (```json ... ```)
const cleanJson = (text: string) => {
    return text.replace(/```json/g, '').replace(/```/g, '').trim();
};

// Initialize Gemini Client safely
const apiKey = process.env.API_KEY;
const ai = new GoogleGenAI({ apiKey: apiKey || "dummy_key" });

/**
 * Analyzes a wine label image to extract details and provide professional advice.
 */
export const analyzeWineLabel = async (base64Image: string): Promise<Partial<Wine>> => {
  if (!apiKey) throw new Error("Chiave API mancante. Configurala su Render.");

  const model = "gemini-2.5-flash"; 
  
  const systemInstruction = `Sei un sommelier professionista e un gestore di cantina meticoloso. 
  Analizza l'immagine dell'etichetta di vino per estrarre TUTTI i dati tecnici visibili o deducibili.
  
  Per "drinkWindow", stima l'intervallo di anni ideale per bere il vino (es. "2026-2030") basandoti su annata, vitigno e regione.
  Per "marketPrice", stima il valore attuale medio in Euro di questa bottiglia specifica.
  
  Rispondi SEMPRE SOLTANTO con un JSON valido (senza markdown) secondo lo schema fornito.`;

  try {
      const response = await ai.models.generateContent({
        model,
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: "image/jpeg",
                data: cleanBase64(base64Image),
              },
            },
            {
              text: "Analizza questa etichetta. Estrai dati tecnici, finestra di bevibilità e stima valore mercato.",
            },
          ],
        },
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              producer: { type: Type.STRING },
              year: { type: Type.STRING },
              type: { type: Type.STRING, enum: Object.values(WineType) },
              region: { type: Type.STRING },
              grape: { type: Type.STRING },
              alcohol: { type: Type.STRING },
              storageTemp: { type: Type.STRING },
              storageAdvice: { type: Type.STRING },
              servingTemp: { type: Type.STRING },
              servingAdvice: { type: Type.STRING },
              foodPairings: { type: Type.ARRAY, items: { type: Type.STRING } },
              price: { type: Type.NUMBER },
              drinkWindow: { type: Type.STRING, description: "Year range e.g. 2026-2030" },
              marketPrice: { type: Type.NUMBER, description: "Estimated market value in EUR" }
            },
            required: ["name", "producer", "type", "storageTemp", "servingAdvice", "storageAdvice", "grape", "drinkWindow", "marketPrice"]
          },
        },
      });

      const text = response.text;
      if (!text) throw new Error("Nessuna risposta da Gemini");
      
      try {
          return JSON.parse(cleanJson(text));
      } catch (e) {
          console.error("JSON Parse Error. Raw text:", text);
          throw new Error("Il formato dei dati ricevuto dall'IA non è valido.");
      }
  } catch (err: any) {
      console.error("Gemini API Error:", err);
      throw new Error(err.message || "Errore di comunicazione con l'IA");
  }
};

/**
 * Suggests wine pairings based on a menu and current inventory.
 */
export const suggestPairing = async (
  menu: string, 
  guests: number, 
  inventory: Wine[], 
  style: 'single' | 'multiple'
): Promise<PairingSuggestion[]> => {
  if (!apiKey) throw new Error("Chiave API mancante.");

  const model = "gemini-2.5-flash";

  const inventoryList = inventory.map(w => 
    `ID: ${w.id}, Nome: ${w.name} (${w.year}), Tipo: ${w.type}, Vitigno: ${w.grape}, Qta: ${w.quantity}`
  ).join("\n");

  const prompt = `
    Menu: "${menu}" (${guests} persone).
    Cantina Utente:
    ${inventoryList}
    
    Suggerisci abbinamenti. Privilegia la cantina utente.
  `;

  try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          systemInstruction: "Sei un sommelier di alto livello. Rispondi in JSON puro.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                courseName: { type: Type.STRING },
                dishName: { type: Type.STRING },
                reasoning: { type: Type.STRING },
                suggestedWineId: { type: Type.STRING, nullable: true },
                fallbackWineName: { type: Type.STRING }
              },
              required: ["courseName", "dishName", "reasoning", "fallbackWineName"]
            }
          }
        }
      });

      const text = response.text;
      if (!text) throw new Error("Nessuna risposta da Gemini");

      return JSON.parse(cleanJson(text));
  } catch (err: any) {
      throw new Error(err.message || "Errore Sommelier");
  }
};


/**
 * Analyzes a potential purchase considering the price and the current user's cellar.
 */
export const analyzePurchase = async (
    base64Image: string, 
    inputPrice: number, 
    inventory: Wine[]
): Promise<PurchaseAnalysis> => {
    if (!apiKey) throw new Error("Chiave API mancante.");

    const model = "gemini-2.5-flash";

    // Summarize inventory for context
    const inventorySummary = inventory.map(w => `${w.quantity}x ${w.name} (${w.type}, ${w.region})`).join(", ");

    const systemInstruction = `Sei un Advisor di investimenti vinicoli e Sommelier.
    Analizza la foto del vino e il prezzo inserito dall'utente (€${inputPrice}).
    1. Identifica il vino.
    2. Stima il prezzo medio di mercato.
    3. Valuta se il prezzo inserito è un affare.
    4. Analizza la cantina attuale dell'utente e decidi se questo vino è una buona aggiunta (diversificazione) o se è ridondante.
    Cantina Attuale: [${inventorySummary}]
    `;

    try {
        const response = await ai.models.generateContent({
            model,
            contents: {
                parts: [
                    { inlineData: { mimeType: "image/jpeg", data: cleanBase64(base64Image) } },
                    { text: `Prezzo offerta: ${inputPrice}€. Analizza questo vino. È un buon acquisto? Completa la mia cantina?` }
                ]
            },
            config: {
                systemInstruction,
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        wineDetails: {
                            type: Type.OBJECT,
                            properties: {
                                name: { type: Type.STRING },
                                producer: { type: Type.STRING },
                                year: { type: Type.STRING },
                                type: { type: Type.STRING, enum: Object.values(WineType) },
                                region: { type: Type.STRING },
                                grape: { type: Type.STRING },
                                alcohol: { type: Type.STRING },
                            }
                        },
                        marketPriceEstimate: { type: Type.NUMBER, description: "Prezzo medio online" },
                        isGoodDeal: { type: Type.BOOLEAN },
                        dealRating: { type: Type.STRING, enum: ['Bad', 'Fair', 'Good', 'Excellent'] },
                        qualityScore: { type: Type.NUMBER, description: "Punteggio 1-100 basato su critica internazionale" },
                        sommelierNotes: { type: Type.STRING, description: "Descrizione breve gusto e naso" },
                        cellarFit: {
                            type: Type.OBJECT,
                            properties: {
                                isRecommended: { type: Type.BOOLEAN },
                                reasoning: { type: Type.STRING, description: "Spiega perché comprarlo o no basandoti sulla cantina attuale" }
                            }
                        }
                    },
                    required: ["marketPriceEstimate", "dealRating", "cellarFit", "wineDetails", "qualityScore"]
                }
            }
        });

        const text = response.text;
        if (!text) throw new Error("Nessuna risposta da Gemini");

        return JSON.parse(cleanJson(text));
    } catch (err: any) {
        throw new Error(err.message || "Errore Shop Advisor");
    }
}

// Mappa dei pattern di ricerca per i principali e-commerce (Smart Links)
// Usata SOLO come fallback se l'AI non trova il link diretto
const MERCHANT_PATTERNS: Record<string, string> = {
    'tannico': 'https://www.tannico.it/catalogsearch/result/?q=',
    'callmewine': 'https://www.callmewine.com/ricerca.html?keys=',
    'vivino': 'https://www.vivino.com/search/wines?q=',
    'vino.com': 'https://www.vino.com/ricerca?q=',
    'xtrawine': 'https://www.xtrawine.com/it/ricerca?q=',
    'bernabei': 'https://www.bernabei.it/catalogsearch/result/?q=',
    'signorvino': 'https://www.signorvino.com/it/cerca?q=',
    'decanto': 'https://www.decanto.it/it/ricerca?s=',
    'gallienoteca': 'https://www.gallienoteca.it/it/ricerca?s='
};

// Genera un link di ricerca sicuro basato sul negozio
const generateSmartLink = (merchantName: string, query: string): string => {
    const normalizedMerchant = merchantName.toLowerCase().replace(/\s/g, '');
    const encodedQuery = encodeURIComponent(query);
    
    // Trova se il nome del merchant contiene una delle chiavi note
    const matchedKey = Object.keys(MERCHANT_PATTERNS).find(key => normalizedMerchant.includes(key));
    
    if (matchedKey) {
        return `${MERCHANT_PATTERNS[matchedKey]}${encodedQuery}`;
    }
    
    // Fallback: Ricerca specifica su Google per quel sito
    return `https://www.google.com/search?q=${encodeURIComponent(`site:${merchantName} acquista ${query}`)}`;
};

/**
 * Uses Google Search Grounding to find real-time best deals for a wine.
 */
export const findBestDeals = async (name: string, producer: string, year: string): Promise<WineDeal[]> => {
    if (!apiKey) throw new Error("Chiave API mancante.");

    const model = "gemini-2.5-flash";
    const fullWineName = `${producer} ${name} ${year}`;
    
    // Query molto specifica per attivare la ricerca prodotti
    const query = `trova prezzo acquisto online bottiglia "${fullWineName}"`;

    const systemInstruction = `
        Sei un Personal Shopper di vini esperto.
        Usa Google Search per trovare le migliori offerte reali.
        
        Il tuo compito è estrarre l'URL PRECISO della pagina del prodotto dai risultati di ricerca.
        
        Regole:
        1. Identifica Negozio e Prezzo.
        2. COPIA L'URL esatto dai risultati di ricerca (grounding) che punta alla pagina di vendita.
        3. Se non trovi un URL diretto, lascia il campo "link" vuoto.
        4. NON INVENTARE URL.
        
        Restituisci ESCLUSIVAMENTE un array JSON:
        [
          {
            "merchant": "Nome Negozio",
            "price": 25.50,
            "currency": "EUR",
            "link": "https://www.tannico.it/..." 
          }
        ]
    `;

    try {
        const response = await ai.models.generateContent({
            model,
            contents: query,
            config: {
                systemInstruction,
                tools: [{ googleSearch: {} }], 
            }
        });
        
        const text = response.text;
        if (!text) throw new Error("Nessun risultato trovato");
        
        const jsonStr = cleanJson(text);
        let deals: any[] = JSON.parse(jsonStr);

        // HYBRID APPROACH IMPROVED: Prefer Real Link, Fallback to Smart Link
        const validDeals: WineDeal[] = deals.map(deal => {
            let finalLink = deal.link;

            // Validazione base del link: deve esistere e iniziare con http
            const isValidUrl = finalLink && typeof finalLink === 'string' && finalLink.startsWith('http');
            
            if (!isValidUrl) {
                // Se l'AI non ha trovato il link diretto, usiamo il generatore sicuro
                finalLink = generateSmartLink(deal.merchant, fullWineName);
            }

            return {
                merchant: deal.merchant,
                price: deal.price,
                currency: deal.currency || 'EUR',
                link: finalLink
            };
        });

        return validDeals.filter(d => d.price > 0);

    } catch (err: any) {
        console.error("Deal Search Error:", err);
        throw new Error("Impossibile trovare offerte al momento.");
    }
}

/**
 * Analyzes restaurant wine list photos and suggests pairings for a dish.
 */
export const suggestRestaurantPairing = async (
    images: string[], 
    dish: string
): Promise<RestaurantSuggestion[]> => {
    if (!apiKey) throw new Error("Chiave API mancante.");

    const model = "gemini-2.5-flash";

    // Prepare content parts: images + prompt
    const parts: any[] = images.map(img => ({
        inlineData: { mimeType: "image/jpeg", data: cleanBase64(img) }
    }));

    parts.push({
        text: `Sto mangiando: "${dish}".
        Analizza queste foto della carta dei vini.
        1. Leggi i vini disponibili (Nome, Produttore, Annata, Prezzo).
        2. Seleziona i 3 MIGLIORI abbinamenti per il mio piatto, bilanciando qualità/prezzo.
        3. Se il prezzo non è leggibile, stima 0 o lascia vuoto.`
    });

    const systemInstruction = `Sei un Sommelier al ristorante che aiuta il cliente a scegliere dalla carta.
    Devi leggere le immagini (OCR), capire il piatto del cliente e suggerire le 3 opzioni migliori.
    Fornisci una spiegazione convincente per ogni abbinamento.
    Rispondi SEMPRE con un JSON valido.`;

    try {
        const response = await ai.models.generateContent({
            model,
            contents: { parts },
            config: {
                systemInstruction,
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            name: { type: Type.STRING },
                            producer: { type: Type.STRING },
                            year: { type: Type.STRING },
                            price: { type: Type.NUMBER },
                            type: { type: Type.STRING },
                            reasoning: { type: Type.STRING, description: "Perché sta bene con il piatto" },
                            matchScore: { type: Type.NUMBER, description: "1-100" }
                        },
                        required: ["name", "producer", "reasoning", "matchScore"]
                    }
                }
            }
        });

        const text = response.text;
        if (!text) throw new Error("Nessuna risposta da Gemini");

        return JSON.parse(cleanJson(text));
    } catch (err: any) {
        throw new Error(err.message || "Errore analisi carta vini");
    }
};
