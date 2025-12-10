
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

/**
 * Uses Google Search Grounding to find real-time best deals for a wine.
 */
export const findBestDeals = async (name: string, producer: string, year: string): Promise<WineDeal[]> => {
    if (!apiKey) throw new Error("Chiave API mancante.");

    const model = "gemini-2.5-flash";
    // Query mirata sui principali e-commerce italiani per evitare blog/recensioni
    const query = `site:tannico.it OR site:callmewine.com OR site:vino.com OR site:vivino.com OR site:xtrawine.com OR site:bernabei.it acquista "${producer} ${name} ${year}" prezzo`;

    const systemInstruction = `
        Sei un Personal Shopper di vini esperto.
        Usa Google Search per trovare i PREZZI REALI ATTUALI di questo vino.
        
        REGOLE CRITICHE ANTI-ALLUCINAZIONE:
        1. RIPORTA SOLO URL REALI che trovi esplicitamente nei risultati di ricerca (Grounding). NON inventare o costruire URL (es. vietato scrivere "tannico.it/nome-vino" se non lo hai letto).
        2. Se non trovi un link diretto funzionante alla pagina prodotto, SCARTA l'offerta.
        3. Cerca l'annata specifica. Se non la trovi, cerca la più vicina e indicalo chiaramente nel nome del negozio (es. "Tannico (Annata 2022)").
        4. Ignora aste o venditori privati.
        
        IMPORTANTE: Restituisci la risposta ESCLUSIVAMENTE come un array JSON grezzo, senza markdown (no \`\`\`json).
        Il formato deve essere:
        [
          {
            "merchant": "Nome Negozio",
            "price": 25.50,
            "currency": "EUR",
            "link": "https://www.realsite.com/product/page"
          }
        ]
    `;

    try {
        const response = await ai.models.generateContent({
            model,
            contents: query,
            config: {
                systemInstruction,
                tools: [{ googleSearch: {} }], // Enable real-time web search
            }
        });
        
        const text = response.text;
        if (!text) throw new Error("Nessun risultato trovato");
        
        // Pulisce eventuale markdown residuo
        const jsonStr = cleanJson(text);
        const deals = JSON.parse(jsonStr);

        // Validazione extra post-generazione: Filtra deal senza link valido
        return deals.filter((d: WineDeal) => d.link && d.link.startsWith('http') && d.price > 0);

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
