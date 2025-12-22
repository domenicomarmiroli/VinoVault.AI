
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
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("Chiave API mancante.");

  const ai = new GoogleGenAI({ apiKey });
  const model = "gemini-3-flash-preview"; 
  const langName = getLanguageName(lang);
  
  const systemInstruction = `Sei un sommelier professionista. 
  Analizza l'immagine dell'etichetta di vino per estrarre TUTTI i dati tecnici.
  IMPORTANTE: Rispondi SEMPRE in ${langName} (tranne che per i nomi propri).
  Per "drinkWindow", stima l'intervallo di anni (es. "2026-2030").
  Per "marketPrice", stima il valore attuale medio in Euro.
  Rispondi SEMPRE SOLTANTO con un JSON valido.`;

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
              type: { type: "STRING" },
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
 * Suggests wine pairings based on a menu and current inventory using Gemini 3 Flash.
 */
export const suggestPairing = async (
  menu: string, 
  guests: number, 
  inventory: Wine[], 
  style: 'single' | 'multiple',
  lang: Language = 'it'
): Promise<PairingSuggestion[]> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("Chiave API mancante.");

  const ai = new GoogleGenAI({ apiKey });
  const model = "gemini-3-flash-preview";
  const langName = getLanguageName(lang);

  const inventoryList = inventory.map(w => 
    `ID: ${w.id}, Nome: ${w.name} (${w.year}), Tipo: ${w.type}, Vitigno: ${w.grape}`
  ).join("\n");

  const prompt = `
    ${style === 'single' ? "Suggerisci 2 vini a tutto pasto" : "Suggerisci vini per ogni portata"} per questo menu: "${menu}".
    Inventario Cantina:
    ${inventoryList || "Cantina Vuota"}
    Rispondi in ${langName} con JSON.
  `;

  try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          systemInstruction: `Sei un sommelier esperto. Rispondi in ${langName} con JSON puro.`,
          temperature: 0.5,
          responseMimeType: "application/json",
        }
      });
      return JSON.parse(cleanJson(response.text || "[]"));
  } catch (err: any) {
      throw new Error(err.message || "Errore Sommelier");
  }
};

/**
 * Analyzes a potential purchase using Gemini 3 Flash with Search Grounding.
 */
export const analyzePurchase = async (
    input: { type: 'image' | 'url', data: string }, 
    inputPrice: number, 
    inventory: Wine[],
    lang: Language = 'it'
): Promise<PurchaseAnalysis> => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) throw new Error("Chiave API mancante.");

    const ai = new GoogleGenAI({ apiKey });
    const model = "gemini-3-flash-preview";
    const langName = getLanguageName(lang);
    const inventoryContext = inventory.map(w => `${w.quantity}x ${w.name}`).join(", ");

    const mainPrompt = `Analizza questo acquisto di vino. Prezzo utente: €${inputPrice}. Cantina attuale: ${inventoryContext}. Rispondi in ${langName} con JSON.`;
    
    let parts: any[] = [];
    if (input.type === 'image') {
        parts = [
            { inlineData: { mimeType: "image/jpeg", data: cleanBase64(input.data) } },
            { text: mainPrompt }
        ];
    } else {
        parts = [{ text: `Analizza questo link: ${input.data}. \n ${mainPrompt}` }];
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
        return JSON.parse(cleanJson(response.text || "{}"));
    } catch (err: any) {
        throw new Error(err.message || "Errore Shop Advisor");
    }
}

export const suggestRestaurantPairing = async (
    menuSource: { type: 'images' | 'text', data: string[] | string }, 
    dish: string,
    lang: Language = 'it'
): Promise<RestaurantSuggestion[]> => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) throw new Error("Chiave API mancante.");

    const ai = new GoogleGenAI({ apiKey });
    const model = "gemini-3-flash-preview";
    const langName = getLanguageName(lang);
    let parts: any[] = [];

    const promptText = `Suggerisci vini dal menu per il piatto: "${dish}". Rispondi in ${langName} con JSON.`;

    if (menuSource.type === 'images') {
        parts = (menuSource.data as string[]).map(img => ({ inlineData: { mimeType: "image/jpeg", data: cleanBase64(img) } }));
        parts.push({ text: promptText });
    } else {
        parts.push({ text: `Menu Context: """${menuSource.data}""". \n ${promptText}` });
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
    const apiKey = process.env.API_KEY;
    if (!apiKey) throw new Error("Chiave API mancante.");
    const ai = new GoogleGenAI({ apiKey });
    const model = "gemini-3-flash-preview";
    try {
        const response = await ai.models.generateContent({
            model,
            contents: {
                parts: [
                    { inlineData: { mimeType: mimeType, data: cleanBase64(base64Data) } },
                    { text: `Estrai il testo del menu vini in formato strutturato.` }
                ]
            }
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
    const apiKey = process.env.API_KEY;
    if (!apiKey) throw new Error("Chiave API mancante.");
    const ai = new GoogleGenAI({ apiKey });
    const model = "gemini-3-flash-preview";
    const langName = getLanguageName(lang);

    const prompt = `Genera un report strategico per la mia cantina in ${langName}. Rispondi con JSON.`;

    try {
        const response = await ai.models.generateContent({
            model,
            contents: prompt,
            config: {
                temperature: 0.5,
                responseMimeType: "application/json",
            }
        });
        return JSON.parse(cleanJson(response.text || "{}"));
    } catch (err: any) {
        throw new Error(err.message || "Errore report");
    }
};
