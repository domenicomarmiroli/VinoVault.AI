
import { GoogleGenAI, Type } from "@google/genai";
import { Wine, WineType, PairingSuggestion, PurchaseAnalysis, RestaurantSuggestion, HistoryEntry, CellarReport, Language, RestaurantAnalysis } from "../types";

const cleanBase64 = (base64: string) => base64.replace(/^data:(image\/(png|jpg|jpeg|webp)|application\/pdf);base64,/, "");
const cleanJson = (text: string) => {
    // Rimuove blocchi di codice markdown se presenti
    let cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
    // Se per qualche motivo l'AI aggiunge testo prima o dopo il JSON, cerchiamo di estrarre solo l'oggetto/array
    const firstBrace = cleaned.indexOf('{');
    const firstBracket = cleaned.indexOf('[');
    const lastBrace = cleaned.lastIndexOf('}');
    const lastBracket = cleaned.lastIndexOf(']');
    
    let start = -1;
    let end = -1;
    
    if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
        start = firstBrace;
        end = lastBrace;
    } else if (firstBracket !== -1) {
        start = firstBracket;
        end = lastBracket;
    }
    
    if (start !== -1 && end !== -1) {
        return cleaned.substring(start, end + 1);
    }
    
    return cleaned;
};

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
          systemInstruction: `Sei un sommelier professionista. Estrai dati tecnici in ${langName}. Rispondi esclusivamente in JSON.`,
          temperature: 0.1,
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
          systemInstruction: `Sei un sommelier esperto. Rispondi in ${langName} con JSON puro. Non aggiungere chiacchiere.`,
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
                { text: `Prezzo offerto: €${inputPrice}. Mia cantina attuale: ${inventoryContext || 'vuota'}. Analizza se l'acquisto è sensato in ${langName}.` }
            ]},
            config: {
                systemInstruction: `Agisci come un Broker di vini e Sommelier professionista. Analizza l'affare e la coerenza con la cantina esistente. Rispondi esclusivamente in formato JSON seguendo lo schema indicato. Non aggiungere testo conversazionale (saluti, Buongiorno, etc).`,
                temperature: 0.2,
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
                                type: { type: Type.STRING },
                                region: { type: Type.STRING },
                                grape: { type: Type.STRING },
                                alcohol: { type: Type.STRING },
                                foodPairings: { type: Type.ARRAY, items: { type: Type.STRING } }
                            },
                            required: ["name", "producer", "year", "type"]
                        },
                        marketPriceEstimate: { type: Type.NUMBER },
                        isGoodDeal: { type: Type.BOOLEAN },
                        dealRating: { type: Type.STRING, enum: ['Excellent', 'Good', 'Fair', 'Bad'] },
                        qualityScore: { type: Type.NUMBER },
                        sommelierNotes: { type: Type.STRING },
                        cellarFit: {
                            type: Type.OBJECT,
                            properties: {
                                isRecommended: { type: Type.BOOLEAN },
                                reasoning: { type: Type.STRING }
                            },
                            required: ["isRecommended", "reasoning"]
                        }
                    },
                    required: ["wineDetails", "marketPriceEstimate", "dealRating", "sommelierNotes", "cellarFit"]
                }
            }
        });
        const text = response.text;
        return JSON.parse(cleanJson(text));
    } catch (err: any) { 
        console.error("Analysis Error:", err);
        throw new Error(err.message || "Errore Shop Advisor"); 
    }
};

export const suggestRestaurantPairing = async (menuSource: { type: 'images' | 'text', data: string[] | string }, dish: string, lang: Language = 'it'): Promise<RestaurantSuggestion[]> => {
    const model = "gemini-3-flash-preview";
    const langName = getLanguageName(lang);
    try {
        const response = await ai.models.generateContent({
            model,
            contents: { parts: [
                ...(menuSource.type === 'images' ? (menuSource.data as string[]).map(img => ({ inlineData: { mimeType: "image/jpeg", data: cleanBase64(img) } })) : [{ text: menuSource.data as string }]),
                { text: `Scegli vini per: ${dish}. Rispondi in ${langName}.` }
            ]},
            config: {
                systemInstruction: `Sommelier Digitale. Suggerisci i migliori abbinamenti dalla carta vini fornita. Rispondi esclusivamente in formato JSON (Array di oggetti).`,
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
            contents: { parts: [ { inlineData: { mimeType, data: cleanBase64(base64Data) } }, { text: "OCR PROFESSIONALE. Estrai il testo mantenendo struttura e prezzi. Non aggiungere commenti." } ] },
            config: { temperature: 0.1 }
        });
        return response.text || "";
    } catch (err) { throw new Error("Errore lettura media"); }
};

export const generateCellarReport = async (inventory: Wine[], history: HistoryEntry[], lang: Language = 'it'): Promise<CellarReport> => {
    const model = "gemini-3-flash-preview";
    const langName = getLanguageName(lang);
    
    const inventoryText = inventory.map(w => `- ${w.name} (${w.year}), ${w.producer}, ${w.type}, ${w.region}`).join("\n");
    const historyText = history.map(h => `- ${h.name}, Voto: ${h.rating}/5, Note: ${h.notes}`).join("\n");

    const prompt = `
      Agisci come un Sommelier di alto livello. Analizza la mia cantina e le mie bevute recenti.
      
      INVENTARIO:
      ${inventoryText || "Nessun vino presente."}
      
      STORICO BEVUTE:
      ${historyText || "Nessuna bevuta registrata."}
      
      Genera un report dettagliato in ${langName}. Rispondi solo in JSON.
    `;

    try {
        const response = await ai.models.generateContent({
            model,
            contents: prompt,
            config: {
                systemInstruction: `Sei un Sommelier Senior specializzato in analisi di collezioni private. Rispondi SEMPRE in JSON puro seguendo lo schema richiesto in lingua ${langName}. Non aggiungere testo introduttivo.`,
                temperature: 0.5,
                responseMimeType: "application/json",
                responseSchema: {
                  type: Type.OBJECT,
                  properties: {
                    overallAssessment: { type: Type.STRING },
                    palateProfile: { type: Type.STRING },
                    gapAnalysis: { type: Type.STRING },
                    buyRecommendations: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          wineName: { type: Type.STRING },
                          reason: { type: Type.STRING },
                          type: { type: Type.STRING }
                        },
                        required: ["wineName", "reason", "type"]
                      }
                    },
                    drinkNowStrategy: { type: Type.STRING }
                  },
                  required: ["overallAssessment", "palateProfile", "gapAnalysis", "buyRecommendations", "drinkNowStrategy"]
                }
            }
        });
        return JSON.parse(cleanJson(response.text || "{}"));
    } catch (err: any) { throw new Error(err.message || "Errore report"); }
};
