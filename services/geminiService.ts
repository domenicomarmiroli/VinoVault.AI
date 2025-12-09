
import { GoogleGenAI, Type } from "@google/genai";
import { Wine, WineType, PairingSuggestion, PurchaseAnalysis, WineDeal } from "../types";

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
    const query = `Prezzo ${producer} ${name} ${year} vendita online Italia`;

    const systemInstruction = `
        Sei un Personal Shopper di vini esperto.
        Usa Google Search per trovare i PREZZI REALI ATTUALI di questo vino.
        Cerca nei principali e-commerce italiani (es. Tannico, Callmewine, Bernabei, Vino.com, Vivino, Xtrawine).
        
        Estrai 3-5 opzioni migliori.
        Ignora aste o privati.
        Se non trovi l'annata esatta, cerca l'annata più vicina disponibile specificandolo nel nome.
        
        Restituisci ESCLUSIVAMENTE un array JSON.
    `;

    try {
        const response = await ai.models.generateContent({
            model,
            contents: query,
            config: {
                systemInstruction,
                tools: [{ googleSearch: {} }], // Enable real-time web search
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            merchant: { type: Type.STRING, description: "Nome del negozio (es. Tannico)" },
                            price: { type: Type.NUMBER, description: "Prezzo in Euro" },
                            currency: { type: Type.STRING, description: "EUR" },
                            link: { type: Type.STRING, description: "URL diretto all'offerta" }
                        },
                        required: ["merchant", "price", "link"]
                    }
                }
            }
        });
        
        const text = response.text;
        // Search Grounding responses might contain extra text, clean strictly
        if (!text) throw new Error("Nessun risultato trovato");
        
        // Sometimes with tools the response might not be strictly JSON only if grounding metadata is attached loosely,
        // but responseMimeType usually forces it.
        return JSON.parse(cleanJson(text));

    } catch (err: any) {
        console.error("Deal Search Error:", err);
        throw new Error("Impossibile trovare offerte al momento.");
    }
}
