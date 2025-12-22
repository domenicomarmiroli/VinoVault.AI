
import { GoogleGenAI } from "@google/genai";
import { Wine, WineType, PairingSuggestion, PurchaseAnalysis, RestaurantSuggestion, HistoryEntry, CellarReport, Language } from "../types";

// Helper to remove base64 prefix
const cleanBase64 = (base64: string) => {
  return base64.replace(/^data:(image\/(png|jpg|jpeg|webp)|application\/pdf);base64,/, "");
};

// Helper to clean Markdown JSON blocks
const cleanJson = (text: string) => {
    return text.replace(/```json/g, '').replace(/```/g, '').trim();
};

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
 * Analyzes a wine label image using Gemini 3 Flash.
 */
export const analyzeWineLabel = async (base64Image: string, lang: Language = 'it'): Promise<Partial<Wine>> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const model = "gemini-3-flash-preview"; 
  const langName = getLanguageName(lang);
  
  const systemInstruction = `Sei un sommelier professionista. Analizza l'immagine dell'etichetta di vino per estrarre TUTTI i dati tecnici.
  IMPORTANTE: Rispondi SEMPRE in ${langName}. Per "drinkWindow", stima l'intervallo di anni (es. "2026-2030"). Per "marketPrice", stima il valore attuale medio in Euro.`;

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
          temperature: 0.5,
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

      return JSON.parse(cleanJson(response.text || "{}"));
  } catch (err: any) {
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
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const model = "gemini-3-flash-preview";
  const langName = getLanguageName(lang);

  const inventoryList = inventory.map(w => `ID: ${w.id}, Nome: ${w.name} (${w.year}), Tipo: ${w.type}`).join("\n");
  const prompt = `Analizza il menu: "${menu}". Inventario: ${inventoryList || "Vuoto"}. Stile: ${style}. Rispondi in ${langName}.`;

  try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          systemInstruction: `Sei un sommelier esperto. Analizza i menu e la cantina. Rispondi in ${langName} con JSON puro.`,
          temperature: 0.5,
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
 * Analyzes a potential purchase using Search Grounding.
 */
export const analyzePurchase = async (
    input: { type: 'image' | 'url', data: string }, 
    inputPrice: number, 
    inventory: Wine[],
    lang: Language = 'it'
): Promise<PurchaseAnalysis> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const model = "gemini-3-flash-preview";
    const langName = getLanguageName(lang);
    const inventoryContext = inventory.map(w => `${w.name} (${w.type})`).join(", ");

    const mainPrompt = `Sei un Broker di Vini. Analizza un potenziale acquisto. Prezzo offerta: €${inputPrice}. Cantina: [${inventoryContext.substring(0, 500)}]. Rispondi in ${langName}.`;
    
    let parts: any[] = [];
    if (input.type === 'image') {
        parts = [{ inlineData: { mimeType: "image/jpeg", data: cleanBase64(input.data) } }, { text: mainPrompt }];
    } else {
        parts = [{ text: `Link: ${input.data}. \n ${mainPrompt}` }];
    }

    try {
        const response = await ai.models.generateContent({
            model,
            contents: { parts },
            config: {
                tools: [{ googleSearch: {} }],
                temperature: 0.5
            }
        });
        
        const rawText = response.text || "{}";
        const parsed = JSON.parse(cleanJson(rawText));

        return {
            wineDetails: parsed.wineDetails || { name: 'Unknown', producer: '?', year: 'N/A', type: 'Rosso' as any },
            marketPriceEstimate: Number(parsed.marketPriceEstimate) || inputPrice,
            isGoodDeal: parsed.isGoodDeal || false,
            dealRating: parsed.dealRating || 'Fair',
            qualityScore: 85, 
            sommelierNotes: parsed.sommelierNotes || "",
            cellarFit: parsed.cellarFit || { isRecommended: true, reasoning: "" }
        };
    } catch (err: any) {
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
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const model = "gemini-3-flash-preview";
    const langName = getLanguageName(lang);
    let parts: any[] = [];
    const promptText = `Analizza la carta vini per il piatto: "${dish}". Fornisci i migliori abbinamenti in ${langName}.`;

    if (menuSource.type === 'images') {
        const images = menuSource.data as string[];
        parts = images.map(img => ({ inlineData: { mimeType: "image/jpeg", data: cleanBase64(img) } }));
        parts.push({ text: promptText });
    } else {
        parts.push({ text: `Menu: "${menuSource.data}". \n ${promptText}` });
    }

    try {
        const response = await ai.models.generateContent({
            model,
            contents: { parts },
            config: {
                temperature: 0.5,
                responseMimeType: "application/json",
            }
        });
        return JSON.parse(cleanJson(response.text || "[]"));
    } catch (err: any) {
        throw new Error(err.message || "Errore analisi carta vini");
    } 
};

export const extractTextFromMedia = async (base64Data: string, mimeType: string): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const model = "gemini-3-flash-preview";
    try {
        const response = await ai.models.generateContent({
            model,
            contents: {
                parts: [
                    { inlineData: { mimeType: mimeType, data: cleanBase64(base64Data) } },
                    { text: "OCR Menu Ristorante. Estrai i vini e prezzi." }
                ]
            },
            config: { temperature: 0.1 }
        });
        return response.text || "";
    } catch (err) {
        throw new Error("Errore lettura media");
    }
};

export const generateCellarReport = async (
    inventory: Wine[],
    history: HistoryEntry[],
    lang: Language = 'it'
): Promise<CellarReport> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const model = "gemini-3-flash-preview";
    const langName = getLanguageName(lang);
    const prompt = `Report Cantina. Inventario: ${inventory.length} vini. Storico: ${history.length} bevute. Rispondi in ${langName} (JSON).`;

    try {
        const response = await ai.models.generateContent({
            model,
            contents: prompt,
            config: {
                systemInstruction: `Sei un Sommelier Senior. Rispondi in ${langName}.`,
                temperature: 0.5,
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
