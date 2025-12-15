
import { GoogleGenAI } from "@google/genai";
import { Wine, WineType, PairingSuggestion, PurchaseAnalysis, RestaurantSuggestion, HistoryEntry, CellarReport, Language } from "../types";

// Helper to remove base64 prefix
const cleanBase64 = (base64: string) => {
  return base64.replace(/^data:image\/(png|jpg|jpeg|webp);base64,/, "");
};

// Helper to clean Markdown JSON blocks (```json ... ```)
const cleanJson = (text: string) => {
    return text.replace(/```json/g, '').replace(/```/g, '').trim();
};

const apiKey = process.env.API_KEY;
const ai = new GoogleGenAI({ apiKey: apiKey || "dummy_key" });

const getLanguageName = (code: Language) => {
    switch(code) {
        case 'en': return 'English';
        case 'fr': return 'French';
        case 'es': return 'Spanish';
        case 'de': return 'German';
        default: return 'Italian';
    }
};

/**
 * Analyzes a wine label image to extract details and provide professional advice.
 */
export const analyzeWineLabel = async (base64Image: string, lang: Language = 'it'): Promise<Partial<Wine>> => {
  if (!apiKey) throw new Error("Chiave API mancante.");

  const model = "gemini-2.5-flash"; 
  const langName = getLanguageName(lang);
  
  const systemInstruction = `Sei un sommelier professionista. 
  Analizza l'immagine dell'etichetta di vino per estrarre TUTTI i dati tecnici.
  
  IMPORTANTE: Rispondi SEMPRE in ${langName} (tranne che per i nomi propri).
  
  Per "drinkWindow", stima l'intervallo di anni (es. "2026-2030").
  Per "marketPrice", stima il valore attuale medio in Euro.
  
  Rispondi SEMPRE SOLTANTO con un JSON valido (senza markdown) secondo lo schema fornito.`;

  try {
      const response = await ai.models.generateContent({
        model,
        contents: {
          parts: [
            { inlineData: { mimeType: "image/jpeg", data: cleanBase64(base64Image) } },
            { text: `Analizza questa etichetta. Estrai dati tecnici in ${langName}.` },
          ],
        },
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: "OBJECT",
            properties: {
              name: { type: "STRING" },
              producer: { type: "STRING" },
              year: { type: "STRING" },
              type: { type: "STRING", enum: Object.values(WineType) },
              region: { type: "STRING" },
              grape: { type: "STRING" },
              alcohol: { type: "STRING" },
              storageTemp: { type: "STRING" },
              storageAdvice: { type: "STRING" },
              servingTemp: { type: "STRING" },
              servingAdvice: { type: "STRING" },
              foodPairings: { type: "ARRAY", items: { type: "STRING" } },
              price: { type: "NUMBER" },
              drinkWindow: { type: "STRING" },
              marketPrice: { type: "NUMBER" }
            },
            required: ["name", "producer", "type", "storageTemp", "servingAdvice", "storageAdvice", "grape", "drinkWindow", "marketPrice"]
          },
        },
      });

      const text = response.text;
      if (!text) throw new Error("Nessuna risposta da Gemini");
      return JSON.parse(cleanJson(text));
  } catch (err: any) {
      console.error("Gemini API Error:", err);
      throw new Error(err.message || "Errore AI");
  }
};

/**
 * Suggests wine pairings based on a menu and current inventory.
 */
export const suggestPairing = async (
  menu: string, 
  guests: number, 
  inventory: Wine[], 
  style: 'single' | 'multiple',
  lang: Language = 'it'
): Promise<PairingSuggestion[]> => {
  if (!apiKey) throw new Error("Chiave API mancante.");

  const model = "gemini-2.5-flash";
  const langName = getLanguageName(lang);

  const inventoryList = inventory.map(w => 
    `ID: ${w.id}, Nome: ${w.name} (${w.year}), Tipo: ${w.type}, Vitigno: ${w.grape}`
  ).join("\n");

  const prompt = `
    Menu: "${menu}".
    Inventario Cantina Utente:
    ${inventoryList || "Cantina Vuota"}
    
    Regole:
    1. Rispondi in ${langName}.
    2. Proponi 2 opzioni per suggerimento.
    3. Privilegia l'inventario utente (type='owned').
    4. Se mancano vini, suggerisci acquisti (type='purchase').
    5. Fornisci 'servingTemp' e 'servingAdvice' in ${langName}.
  `;

  try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          systemInstruction: `Sei un sommelier. Rispondi in ${langName} con JSON puro.`,
          responseMimeType: "application/json",
          responseSchema: {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              properties: {
                courseName: { type: "STRING" },
                dishName: { type: "STRING" },
                options: {
                  type: "ARRAY",
                  items: {
                    type: "OBJECT",
                    properties: {
                      wineId: { type: "STRING", nullable: true },
                      wineName: { type: "STRING" },
                      reasoning: { type: "STRING" },
                      type: { type: "STRING", enum: ['owned', 'purchase'] },
                      servingTemp: { type: "STRING" },
                      servingAdvice: { type: "STRING" }
                    },
                    required: ["wineName", "reasoning", "type", "servingTemp", "servingAdvice"]
                  }
                }
              },
              required: ["courseName", "dishName", "options"]
            }
          }
        }
      });
      return JSON.parse(cleanJson(response.text || "[]"));
  } catch (err: any) {
      throw new Error(err.message || "Errore Sommelier");
  }
};


/**
 * Analyzes a potential purchase.
 */
export const analyzePurchase = async (
    input: { type: 'image' | 'url', data: string }, 
    inputPrice: number, 
    inventory: Wine[],
    lang: Language = 'it'
): Promise<PurchaseAnalysis> => {
    if (!apiKey) throw new Error("Chiave API mancante.");

    const model = "gemini-2.5-flash";
    const langName = getLanguageName(lang);
    
    let parts: any[] = [];
    let tools: any[] = [];
    
    if (input.type === 'image') {
        parts = [
            { inlineData: { mimeType: "image/jpeg", data: cleanBase64(input.data) } },
            { text: `Prezzo offerta: ${inputPrice}€. Analizza questo vino in ${langName}. Restituisci un JSON con wineDetails (name, producer, year, type, region), marketPriceEstimate, dealRating (Bad, Fair, Good, Excellent) e cellarFit.` }
        ];
    } else {
        tools = [{ googleSearch: {} }];
        parts = [{ text: `Analizza URL: ${input.data}. Prezzo: ${inputPrice}. Rispondi in ${langName}. Restituisci un JSON con wineDetails, marketPriceEstimate, dealRating.` }];
    }

    const systemInstruction = `Sei un Advisor di investimenti vinicoli. Rispondi ESCLUSIVAMENTE in ${langName}.
    Restituisci JSON puro senza markdown. Se mancano dati, fai una stima o usa valori generici.`;

    try {
        const response = await ai.models.generateContent({
            model,
            contents: { parts },
            config: {
                systemInstruction,
                tools: tools.length > 0 ? tools : undefined,
                // Note: responseSchema cannot be used with googleSearch tools
            }
        });
        
        const rawJson = cleanJson(response.text || "{}");
        let parsed: any = {};
        try {
            parsed = JSON.parse(rawJson);
        } catch (e) {
            console.error("JSON Parse Error", e);
            throw new Error("Errore formato risposta AI");
        }

        // Force a valid structure to prevent frontend crashes
        const safeDetails = parsed.wineDetails || {};

        return {
            wineDetails: {
                name: safeDetails.name || 'Sconosciuto',
                producer: safeDetails.producer || 'Sconosciuto',
                year: safeDetails.year || 'N/A',
                type: safeDetails.type || 'Rosso', 
                region: safeDetails.region || '',
                grape: safeDetails.grape || '',
                foodPairings: safeDetails.foodPairings || []
            },
            marketPriceEstimate: parsed.marketPriceEstimate || inputPrice,
            isGoodDeal: parsed.isGoodDeal || false,
            dealRating: parsed.dealRating || 'Fair',
            qualityScore: parsed.qualityScore || 80,
            sommelierNotes: parsed.sommelierNotes || "Analisi completata con dati parziali.",
            cellarFit: parsed.cellarFit || { isRecommended: false, reasoning: "Impossibile determinare con certezza." }
        };

    } catch (err: any) {
        console.error("Gemini Error:", err);
        throw new Error(err.message || "Errore Shop Advisor");
    }
}

/**
 * Analyzes restaurant wine list.
 */
export const suggestRestaurantPairing = async (
    menuSource: { type: 'images' | 'text', data: string[] | string }, 
    dish: string,
    lang: Language = 'it'
): Promise<RestaurantSuggestion[]> => {
    if (!apiKey) throw new Error("Chiave API mancante.");

    const model = "gemini-2.5-flash";
    const langName = getLanguageName(lang);
    let parts: any[] = [];

    if (menuSource.type === 'images') {
        const images = menuSource.data as string[];
        parts = images.map(img => ({ inlineData: { mimeType: "image/jpeg", data: cleanBase64(img) } }));
        parts.push({ text: `Piatto: "${dish}". Leggi menu e suggerisci 3 vini in ${langName}.` });
    } else {
        parts.push({ text: `Menu: """${menuSource.data}""". Piatto: "${dish}". Suggerisci 3 vini in ${langName}.` });
    }

    try {
        const response = await ai.models.generateContent({
            model,
            contents: { parts },
            config: {
                systemInstruction: `Sei un Sommelier. Rispondi in ${langName}. JSON puro.`,
                responseMimeType: "application/json",
                responseSchema: {
                    type: "ARRAY",
                    items: {
                        type: "OBJECT",
                        properties: {
                            name: { type: "STRING" },
                            producer: { type: "STRING" },
                            year: { type: "STRING" },
                            price: { type: "NUMBER" },
                            type: { type: "STRING" },
                            reasoning: { type: "STRING" },
                            matchScore: { type: "NUMBER" }
                        },
                        required: ["name", "producer", "reasoning", "matchScore"]
                    }
                }
            }
        });
        return JSON.parse(cleanJson(response.text || "[]"));
    } catch (err: any) {
        throw new Error(err.message || "Errore analisi carta vini");
    } 
};

export const extractTextFromImage = async (base64Image: string): Promise<string> => {
    if (!apiKey) throw new Error("Chiave API mancante.");
    const model = "gemini-2.5-flash";
    try {
        const response = await ai.models.generateContent({
            model,
            contents: {
                parts: [
                    { inlineData: { mimeType: "image/jpeg", data: cleanBase64(base64Image) } },
                    { text: "OCR: Extract all text." }
                ]
            }
        });
        return response.text || "";
    } catch (err) {
        throw new Error("Errore lettura immagine");
    }
};

export const generateCellarReport = async (
    inventory: Wine[],
    history: HistoryEntry[],
    lang: Language = 'it'
): Promise<CellarReport> => {
    if (!apiKey) throw new Error("Chiave API mancante.");
    const model = "gemini-2.5-flash";
    const langName = getLanguageName(lang);

    const inventorySummary = inventory.map(w => `[${w.quantity}] ${w.name} ${w.year}`).join("\n");
    const historySummary = history.map(h => `Bevuto: ${h.name}, Voto: ${h.rating}`).join("\n");

    const prompt = `
        Analisi Cantina.
        Inventario: ${inventorySummary}
        Storico: ${historySummary}
        
        Genera un report in ${langName}. JSON puro.
    `;

    try {
        const response = await ai.models.generateContent({
            model,
            contents: prompt,
            config: {
                systemInstruction: `Sei un Sommelier Senior. Rispondi in ${langName}.`,
                responseMimeType: "application/json",
                responseSchema: {
                    type: "OBJECT",
                    properties: {
                        overallAssessment: { type: "STRING" },
                        palateProfile: { type: "STRING" },
                        gapAnalysis: { type: "STRING" },
                        buyRecommendations: {
                            type: "ARRAY",
                            items: {
                                type: "OBJECT",
                                properties: {
                                    wineName: { type: "STRING" },
                                    reason: { type: "STRING" },
                                    type: { type: "STRING" }
                                },
                                required: ["wineName", "reason", "type"]
                            }
                        },
                        drinkNowStrategy: { type: "STRING" }
                    },
                    required: ["overallAssessment", "palateProfile", "gapAnalysis", "buyRecommendations", "drinkNowStrategy"]
                }
            }
        });
        return JSON.parse(cleanJson(response.text || "{}"));
    } catch (err: any) {
        throw new Error(err.message || "Errore report");
    }
};
