

import { GoogleGenAI, Type } from "@google/genai";
import { Wine, WineType, PairingSuggestion, PurchaseAnalysis, RestaurantSuggestion, HistoryEntry, CellarReport } from "../types";

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

  let strategyPrompt = "";
  if (style === 'single') {
      strategyPrompt = "Strategia: Proponi un VINO UNICO versatile che stia bene con tutto il pasto. Restituisci un solo oggetto nell'array con courseName='Tutto Pasto' e dishName='Menu Completo'. Fornisci 2 opzioni di vino diverse per questa singola proposta.";
  } else {
      strategyPrompt = "Strategia: Proponi un abbinamento specifico PER OGNI PORTATA del menu. Per ogni portata, fornisci 2 opzioni di vino diverse (Opzione A e Opzione B).";
  }

  const prompt = `
    Menu: "${menu}" (${guests} persone).
    
    Inventario Cantina Utente (DA PRIVILEGIARE):
    ${inventoryList || "Cantina Vuota"}
    
    ${strategyPrompt}
    
    Regole Fondamentali:
    1. Per ogni suggerimento, devi fornire SEMPRE 2 opzioni distinte.
    2. Cerca PRIMA nella "Cantina Utente". Se c'è un vino adatto, usa il suo ID e metti type='owned'.
    3. Se la cantina ha solo 1 vino adatto, usalo come prima opzione e suggerisci un acquisto per la seconda.
    4. Se non c'è nulla in cantina, suggerisci due vini da comprare (type='purchase') mettendo il nome in wineName e lasciando wineId vuoto.
    5. Spiega brevemente il 'reasoning'.
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
                options: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      wineId: { type: Type.STRING, nullable: true },
                      wineName: { type: Type.STRING },
                      reasoning: { type: Type.STRING },
                      type: { type: Type.STRING, enum: ['owned', 'purchase'] }
                    },
                    required: ["wineName", "reasoning", "type"]
                  }
                }
              },
              required: ["courseName", "dishName", "options"]
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
 * Supports both Image Analysis and URL (Product Page) Analysis.
 */
export const analyzePurchase = async (
    input: { type: 'image' | 'url', data: string }, 
    inputPrice: number, 
    inventory: Wine[]
): Promise<PurchaseAnalysis> => {
    if (!apiKey) throw new Error("Chiave API mancante.");

    const model = "gemini-2.5-flash";

    // Summarize inventory for context
    const inventorySummary = inventory.map(w => `${w.quantity}x ${w.name} (${w.type}, ${w.region})`).join(", ");
    
    let parts: any[] = [];
    let tools: any[] = [];
    
    if (input.type === 'image') {
        parts = [
            { inlineData: { mimeType: "image/jpeg", data: cleanBase64(input.data) } },
            { text: `Prezzo offerta: ${inputPrice}€. Analizza questo vino (foto etichetta). È un buon acquisto?` }
        ];
    } else {
        // URL Mode -> Use Google Search Grounding
        tools = [{ googleSearch: {} }];
        parts = [{ text: `
            Analizza il vino presente in questo URL: ${input.data}
            Prezzo Utente: ${inputPrice > 0 ? inputPrice : 'Cerca il prezzo attuale nella pagina'}.
            
            Identifica il vino, il prezzo, e valuta l'acquisto.
        `}];
    }

    const jsonStructure = `
    {
        "wineDetails": {
            "name": "Nome Vino",
            "producer": "Produttore",
            "year": "Annata",
            "type": "Rosso", // Rosso, Bianco, Spumante, etc
            "region": "Regione",
            "grape": "Vitigno",
            "alcohol": "Vol%",
            "foodPairings": ["Piatto 1", "Piatto 2"]
        },
        "marketPriceEstimate": 25.50,
        "isGoodDeal": true,
        "dealRating": "Good", // Bad, Fair, Good, Excellent
        "qualityScore": 92, // 1-100
        "sommelierNotes": "Breve descrizione...",
        "cellarFit": {
            "isRecommended": true,
            "reasoning": "Spiegazione..."
        }
    }
    `;

    const systemInstruction = `Sei un Advisor di investimenti vinicoli e Sommelier.
    1. Identifica il vino.
    2. Stima il prezzo medio di mercato.
    3. Valuta se l'acquisto è un affare.
    4. Analizza la cantina attuale dell'utente: [${inventorySummary}].
    Decidi se aggiungere questo vino migliora la collezione.
    
    Restituisci ESCLUSIVAMENTE un oggetto JSON valido (senza markdown) con questa struttura esatta:
    ${jsonStructure}
    
    IMPORTANTE: NON usare blocchi markdown. Rispondi solo con il JSON grezzo.
    `;

    try {
        const response = await ai.models.generateContent({
            model,
            contents: { parts },
            config: {
                systemInstruction,
                tools: tools.length > 0 ? tools : undefined,
                // Rimosso responseMimeType: "application/json" perché incompatibile con i Tools
            }
        });

        const text = response.text;
        if (!text) throw new Error("Nessuna risposta da Gemini");

        return JSON.parse(cleanJson(text));
    } catch (err: any) {
        // Log dettagliato per debug
        console.error("Shop Advisor Error Details:", JSON.stringify(err, null, 2));
        throw new Error(err.message || "Errore Shop Advisor");
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

/**
 * Generates a professional Sommelier report analyzing the user's cellar and history.
 */
export const generateCellarReport = async (
    inventory: Wine[],
    history: HistoryEntry[]
): Promise<CellarReport> => {
    if (!apiKey) throw new Error("Chiave API mancante.");

    const model = "gemini-2.5-flash";

    // 1. Prepare Data Summary
    const inventorySummary = inventory.map(w => 
        `[${w.quantity}pz] ${w.name} ${w.year} (${w.region}, ${w.type})`
    ).join("\n");

    const historySummary = history.map(h => 
        `Bevuto: ${h.name} (${h.type}), Voto: ${h.rating}/5`
    ).join("\n");

    const prompt = `
        ANALISI CANTINA & PROFILO SOMMELIER
        
        Inventario Attuale:
        ${inventorySummary || "Cantina vuota."}
        
        Storico Consumo & Voti:
        ${historySummary || "Nessuno storico."}
        
        Compito:
        Agisci come un Sommelier Senior. Redigi un report professionale che includa:
        1. Valutazione generale della cantina (equilibrio, valore, varietà).
        2. Profilo del Palato dell'utente basato sui voti nello storico.
        3. Gap Analysis: Cosa manca? (es. mancano bianchi da invecchiamento, mancano bollicine per aperitivo).
        4. Consigli per gli Acquisti: 3 bottiglie specifiche da comprare per migliorare la collezione.
        5. Strategia di Consumo: Cosa bere subito e cosa aspettare.
    `;

    try {
        const response = await ai.models.generateContent({
            model,
            contents: prompt,
            config: {
                systemInstruction: "Sei un Sommelier consulente. Rispondi con un JSON strutturato per un report.",
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

        const text = response.text;
        if (!text) throw new Error("Nessuna risposta da Gemini");

        return JSON.parse(cleanJson(text));
    } catch (err: any) {
        throw new Error(err.message || "Errore generazione report");
    }
};