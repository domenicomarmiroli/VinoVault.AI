
import { GoogleGenAI, Type } from "@google/genai";
import { Wine, WineType, PairingSuggestion, PurchaseAnalysis, RestaurantSuggestion, HistoryEntry, CellarReport, Language, RestaurantAnalysis } from "../types";

const cleanBase64 = (base64: string) => base64.replace(/^data:(image\/(png|jpg|jpeg|webp)|application\/pdf);base64,/, "");
const cleanJson = (text: string) => text.replace(/```json/g, '').replace(/```/g, '').trim();
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const getLanguageName = (code: Language) => {
    switch(code) {
        case 'en': return 'English';
        case 'fr': return 'French';
        case 'es': return 'Spanish';
        case 'de': return 'German';
        default: return 'Italian';
    }
};

export const analyzeWineLabel = async (base64Image: string, lang: Language = 'it'): Promise<Partial<Wine>> => {
  const model = "gemini-3-flash-preview"; 
  const langName = getLanguageName(lang);
  try {
      const response = await ai.models.generateContent({
        model,
        contents: { parts: [ { inlineData: { mimeType: "image/jpeg", data: cleanBase64(base64Image) } }, { text: `Analizza questa etichetta in ${langName}.` } ] },
        config: {
          systemInstruction: `Sei un sommelier professionista. Estrai dati tecnici in ${langName}.`,
          temperature: 0.5,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING }, producer: { type: Type.STRING }, year: { type: Type.STRING },
              type: { type: Type.STRING, enum: Object.values(WineType) }, region: { type: Type.STRING },
              grape: { type: Type.STRING }, alcohol: { type: Type.STRING }, storageTemp: { type: Type.STRING },
              storageAdvice: { type: Type.STRING }, servingTemp: { type: Type.STRING }, servingAdvice: { type: Type.STRING },
              foodPairings: { type: Type.ARRAY, items: { type: Type.STRING } }, price: { type: Type.NUMBER },
              drinkWindow: { type: Type.STRING }, marketPrice: { type: Type.NUMBER }
            },
            required: ["name", "producer", "type", "storageTemp", "servingAdvice", "storageAdvice", "grape", "drinkWindow", "marketPrice"]
          },
        },
      });
      return JSON.parse(cleanJson(response.text));
  } catch (err: any) { throw new Error(err.message || "Errore AI"); }
};

export const suggestPairing = async (menu: string, guests: number, inventory: Wine[], style: 'single' | 'multiple', lang: Language = 'it'): Promise<PairingSuggestion[]> => {
  const model = "gemini-3-flash-preview";
  const langName = getLanguageName(lang);
  const inventoryList = inventory.map(w => `ID: ${w.id}, Nome: ${w.name} (${w.year}), Tipo: ${w.type}`).join("\n");
  try {
      const response = await ai.models.generateContent({
        model,
        contents: `Menu: ${menu}. Inventario: ${inventoryList}. Stile: ${style}.`,
        config: {
          systemInstruction: `Sei un sommelier esperto. Rispondi in ${langName} con JSON puro.`,
          temperature: 0.5,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                courseName: { type: Type.STRING }, dishName: { type: Type.STRING },
                options: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      wineId: { type: Type.STRING, nullable: true }, wineName: { type: Type.STRING },
                      reasoning: { type: Type.STRING }, type: { type: Type.STRING, enum: ['owned', 'purchase'] },
                      servingTemp: { type: Type.STRING }, servingAdvice: { type: Type.STRING }
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
  } catch (err: any) { throw new Error(err.message || "Errore Sommelier"); }
};

export const analyzePurchase = async (input: { type: 'image' | 'url', data: string }, inputPrice: number, inventory: Wine[], lang: Language = 'it'): Promise<PurchaseAnalysis> => {
    const model = "gemini-3-flash-preview";
    const langName = getLanguageName(lang);
    const inventoryContext = inventory.map(w => `${w.quantity}x ${w.name} (${w.type})`).join(", ");
    try {
        const response = await ai.models.generateContent({
            model,
            contents: { parts: [
                input.type === 'image' ? { inlineData: { mimeType: "image/jpeg", data: cleanBase64(input.data) } } : { text: input.data },
                { text: `Prezzo: €${inputPrice}. Cantina: ${inventoryContext}.` }
            ]},
            config: {
                systemInstruction: `Broker di vini e Sommelier. Analizza l'affare in ${langName}.`,
                tools: [{ googleSearch: {} }],
                temperature: 0.5
            }
        });
        const parsed = JSON.parse(cleanJson(response.text));
        return {
            wineDetails: parsed.wineDetails,
            marketPriceEstimate: parsed.marketPriceEstimate || inputPrice,
            isGoodDeal: parsed.isGoodDeal || false,
            dealRating: parsed.dealRating || 'Fair',
            qualityScore: 85,
            sommelierNotes: parsed.sommelierNotes || "Identificato.",
            cellarFit: parsed.cellarFit || { isRecommended: true, reasoning: "Ok." }
        };
    } catch (err: any) { throw new Error(err.message || "Errore Shop Advisor"); }
};

export const suggestRestaurantPairing = async (menuSource: { type: 'images' | 'text', data: string[] | string }, dish: string, lang: Language = 'it'): Promise<RestaurantSuggestion[]> => {
    const model = "gemini-3-flash-preview";
    const langName = getLanguageName(lang);
    try {
        const response = await ai.models.generateContent({
            model,
            contents: { parts: [
                ...(menuSource.type === 'images' ? (menuSource.data as string[]).map(img => ({ inlineData: { mimeType: "image/jpeg", data: cleanBase64(img) } })) : [{ text: menuSource.data as string }]),
                { text: `Scegli vini per: ${dish}.` }
            ]},
            config: {
                systemInstruction: `Sommelier Digitale. Suggerisci 3-6 vini dal menu in ${langName}.`,
                temperature: 0.5,
                responseMimeType: "application/json",
            }
        });
        return JSON.parse(cleanJson(response.text || "[]"));
    } catch (err: any) { throw new Error(err.message || "Errore analisi carta vini"); } 
};

export const analyzeRestaurantcompleteness = async (wineList: string, foodMenu: string, lang: Language = 'it'): Promise<RestaurantAnalysis> => {
    const model = "gemini-3-flash-preview";
    const langName = getLanguageName(lang);
    const prompt = `
        ANALISI STRATEGICA RISTORANTE (Modello v3).
        CARTA VINI: """${wineList}"""
        MENÙ PIATTI: """${foodMenu}"""
        
        Agisci come un Master Sommelier Consultant. 
        Analizza la coerenza tra i piatti proposti e le etichette in cantina.
        
        REGOLE:
        1. Calcola uno SCORE (0-100) basato sulla copertura gastronomica.
        2.courseDetails deve analizzare ogni categoria di piatti (Antipasti, Primi, etc).
        3. Identifica vini 'poco adatti' (es. troppi rossi pesanti per un menù di pesce crudo).
        4. Suggerisci STILI di vino mancanti (es. "Manca un Riesling strutturato per i piatti piccanti").
        
        Rispondi in ${langName}. JSON puro.
    `;
    try {
        const response = await ai.models.generateContent({
            model,
            contents: prompt,
            config: {
                temperature: 0.2,
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        score: { type: Type.NUMBER },
                        summary: { type: Type.STRING },
                        strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
                        weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
                        courseDetails: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    course: { type: Type.STRING },
                                    feedback: { type: Type.STRING },
                                    bestMatches: { type: Type.ARRAY, items: { type: Type.STRING } },
                                    unsuitableWines: { type: Type.ARRAY, items: { type: Type.STRING } },
                                    missingStyles: { type: Type.ARRAY, items: { type: Type.STRING } }
                                },
                                required: ["course", "feedback", "bestMatches", "unsuitableWines", "missingStyles"]
                            }
                        },
                        strategicAdvice: { type: Type.STRING }
                    },
                    required: ["score", "summary", "strengths", "weaknesses", "courseDetails", "strategicAdvice"]
                }
            }
        });
        const result = JSON.parse(cleanJson(response.text));
        return { ...result, generatedAt: new Date().toISOString() };
    } catch (err: any) { throw new Error("Errore analisi professionale"); }
};

export const extractTextFromMedia = async (base64Data: string, mimeType: string): Promise<string> => {
    const model = "gemini-3-flash-preview";
    try {
        const response = await ai.models.generateContent({
            model,
            contents: { parts: [ { inlineData: { mimeType, data: cleanBase64(base64Data) } }, { text: "OCR PROFESSIONALE. Estrai il testo mantenendo struttura e prezzi." } ] },
            config: { temperature: 0.1 }
        });
        return response.text || "";
    } catch (err) { throw new Error("Errore lettura media"); }
};

export const generateCellarReport = async (inventory: Wine[], history: HistoryEntry[], lang: Language = 'it'): Promise<CellarReport> => {
    const model = "gemini-3-flash-preview";
    const langName = getLanguageName(lang);
    try {
        const response = await ai.models.generateContent({
            model,
            contents: `Analisi Cantina. In ${langName}.`,
            config: {
                systemInstruction: `Sei un Sommelier Senior. Rispondi in ${langName}.`,
                temperature: 0.5,
                responseMimeType: "application/json"
            }
        });
        return JSON.parse(cleanJson(response.text || "{}"));
    } catch (err: any) { throw new Error(err.message || "Errore report"); }
};
