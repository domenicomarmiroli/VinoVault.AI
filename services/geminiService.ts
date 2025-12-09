import { GoogleGenAI, Type } from "@google/genai";
import { Wine, WineType, PairingSuggestion, PurchaseAnalysis } from "../types";

// Helper to remove base64 prefix
const cleanBase64 = (base64: string) => {
  return base64.replace(/^data:image\/(png|jpg|jpeg|webp);base64,/, "");
};

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Analyzes a wine label image to extract details and provide professional advice.
 */
export const analyzeWineLabel = async (base64Image: string): Promise<Partial<Wine>> => {
  const model = "gemini-2.5-flash"; 
  
  const systemInstruction = `Sei un sommelier professionista e un gestore di cantina meticoloso. 
  Analizza l'immagine dell'etichetta di vino per estrarre TUTTI i dati tecnici visibili o deducibili.
  Rispondi SEMPRE in formato JSON valido secondo lo schema fornito.`;

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
          text: "Analizza questa etichetta. Estrai dati tecnici e consigli.",
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
          price: { type: Type.NUMBER }
        },
        required: ["name", "producer", "type", "storageTemp", "servingAdvice", "storageAdvice", "grape"]
      },
    },
  });

  const text = response.text;
  if (!text) throw new Error("Nessuna risposta da Gemini");
  
  return JSON.parse(text);
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

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      systemInstruction: "Sei un sommelier di alto livello.",
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

  return JSON.parse(text);
};


/**
 * Analyzes a potential purchase considering the price and the current user's cellar.
 */
export const analyzePurchase = async (
    base64Image: string, 
    inputPrice: number, 
    inventory: Wine[]
): Promise<PurchaseAnalysis> => {
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

    return JSON.parse(text);
}
