
import { GoogleGenAI } from "@google/genai";
import { Wine, WineType, PairingSuggestion, PurchaseAnalysis, RestaurantSuggestion, HistoryEntry, CellarReport, Language } from "../types";

// Helper to remove base64 prefix
const cleanBase64 = (base64: string) => {
  return base64.replace(/^data:(image\/(png|jpg|jpeg|webp)|application\/pdf);base64,/, "");
};

// Helper to clean Markdown JSON blocks (```json ... ```)
const cleanJson = (text: string) => {
    // Rimuove markdown, backticks e spazi vuoti extra
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

    const model = "gemini-2.5-flash"; // Usiamo flash per velocità, ma con strumenti
    const langName = getLanguageName(lang);
    
    // Costruiamo il contesto della cantina per la "cellarFit"
    const inventoryContext = inventory.map(w => `${w.quantity}x ${w.name} (${w.type}, ${w.region})`).join(", ");

    let parts: any[] = [];
    const tools = [{ googleSearch: {} }]; // Abilitiamo sempre la ricerca per i prezzi

    // Prompt molto descrittivo per guidare il ragionamento
    const mainPrompt = `
    Sei un esperto Broker di Vini e Sommelier.
    Il tuo compito è analizzare un potenziale acquisto.

    1. **IDENTIFICAZIONE**:
       - Identifica con precisione il vino (Produttore, Nome, Denominazione).
       - Se l'annata non è chiara, cerca l'annata corrente in commercio o quella più probabile dalla foto. NON restituire "N/A" se puoi dedurlo.
    
    2. **RICERCA MERCATO (Google Search)**:
       - Usa lo strumento di ricerca per trovare il prezzo medio ONLINE attuale per questo specifico vino e annata.
       - Prezzo utente: €${inputPrice}.
    
    3. **VALUTAZIONE PREZZO (Deal Rating)**:
       - Confronta il prezzo utente con il prezzo di mercato trovato.
       - 'Excellent': Se prezzo utente è < 80% del prezzo mercato.
       - 'Good': Se prezzo utente è < 95% del prezzo mercato.
       - 'Fair': Se i prezzi sono simili.
       - 'Bad': Se il prezzo utente è più alto del mercato.
    
    4. **INTEGRAZIONE CANTINA**:
       - Cantina Utente: [${inventoryContext.substring(0, 500)}...]
       - Il vino serve? Aggiunge varietà (nuova regione/vitigno) o è un doppione?
    
    5. **OUTPUT**:
       - Restituisci SOLO un oggetto JSON valido (senza markdown) con la seguente struttura esatta:
       {
         "wineDetails": {
           "name": "Nome completo",
           "producer": "Produttore",
           "year": "Annata (es. 2020)",
           "type": "Rosso" | "Bianco" | "Rosato" | "Spumante/Champagne" | "Dolce/Passito",
           "region": "Regione",
           "grape": "Vitigno principale",
           "foodPairings": ["Piatto 1", "Piatto 2"]
         },
         "marketPriceEstimate": numero (prezzo medio trovato, es. 25.50),
         "isGoodDeal": booleano,
         "dealRating": "Excellent" | "Good" | "Fair" | "Bad",
         "sommelierNotes": "Breve commento su qualità e prezzo in ${langName}",
         "cellarFit": {
            "isRecommended": booleano,
            "reasoning": "Spiegazione breve in ${langName}"
         }
       }
    `;
    
    if (input.type === 'image') {
        parts = [
            { inlineData: { mimeType: "image/jpeg", data: cleanBase64(input.data) } },
            { text: mainPrompt }
        ];
    } else {
        parts = [{ text: `Analizza questo link/testo: ${input.data}. \n ${mainPrompt}` }];
    }

    try {
        const response = await ai.models.generateContent({
            model,
            contents: { parts },
            config: {
                tools: tools,
                // Rimuoviamo responseSchema rigido quando usiamo googleSearch 
                // per evitare conflitti e permettere all'AI di "pensare" (usare il tool) prima di formattare.
            }
        });
        
        // Pulizia aggressiva del JSON perché senza schema l'AI potrebbe mettere ```json
        const rawText = response.text || "{}";
        const jsonString = cleanJson(rawText);
        
        let parsed: any = {};
        try {
            parsed = JSON.parse(jsonString);
        } catch (e) {
            console.error("JSON Parse Error on:", jsonString);
            // Fallback parziale se il JSON è rotto
            return {
                wineDetails: { name: 'Errore Analisi', producer: '?', year: 'N/A', type: 'Rosso' as any, region: '', grape: '', foodPairings: [] },
                marketPriceEstimate: inputPrice,
                isGoodDeal: false,
                dealRating: 'Fair',
                qualityScore: 80,
                sommelierNotes: "Non sono riuscito a leggere i dati. Riprova con una foto più chiara.",
                cellarFit: { isRecommended: false, reasoning: "Dati insufficienti." }
            };
        }

        // Normalizzazione dati
        const safeNumber = (val: any, fallback: number) => {
            if (val === undefined || val === null) return fallback;
            const num = parseFloat(String(val).replace(',', '.'));
            return isNaN(num) ? fallback : num;
        };

        // Logica di fallback per il rating se l'AI sbaglia
        let calculatedRating = parsed.dealRating;
        const marketPrice = safeNumber(parsed.marketPriceEstimate, 0);
        if (marketPrice > 0) {
            const ratio = inputPrice / marketPrice;
            if (ratio < 0.8) calculatedRating = 'Excellent';
            else if (ratio < 0.95) calculatedRating = 'Good';
            else if (ratio <= 1.1) calculatedRating = 'Fair';
            else calculatedRating = 'Bad';
        }

        return {
            wineDetails: {
                name: parsed.wineDetails?.name || 'Sconosciuto',
                producer: parsed.wineDetails?.producer || 'Sconosciuto',
                year: parsed.wineDetails?.year || 'N/A',
                type: parsed.wineDetails?.type || 'Rosso', 
                region: parsed.wineDetails?.region || '',
                grape: parsed.wineDetails?.grape || '',
                foodPairings: parsed.wineDetails?.foodPairings || []
            },
            marketPriceEstimate: marketPrice > 0 ? marketPrice : inputPrice,
            isGoodDeal: calculatedRating === 'Excellent' || calculatedRating === 'Good',
            dealRating: calculatedRating || 'Fair',
            qualityScore: 85, // Default visuale
            sommelierNotes: parsed.sommelierNotes || `Vino identificato: ${parsed.wineDetails?.name}.`,
            cellarFit: parsed.cellarFit || { isRecommended: true, reasoning: "Aggiunta interessante." }
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

    const promptText = `
    Sei un Sommelier esperto al ristorante.
    Compito: Analizzare il menu (testo o immagini) e suggerire 3 abbinamenti per il piatto: "${dish}".
    
    Regole Rigorose:
    1. PREZZO: Estrai il prezzo ESATTO scritto sul menu per quel vino specifico. 
       - Se il prezzo NON è visibile o leggibile, restituisci 0. 
       - NON STIMARE, NON INVENTARE, NON CERCARE SU GOOGLE. Usa solo i dati OCR.
    
    2. PUNTEGGIO (matchScore): Restituisci un numero INTERO tra 70 e 100 che indica quanto bene si abbina. (Es. 95, non 9.5).
    
    3. Rispondi esclusivamente in ${langName}.
    `;

    if (menuSource.type === 'images') {
        const images = menuSource.data as string[];
        parts = images.map(img => ({ inlineData: { mimeType: "image/jpeg", data: cleanBase64(img) } }));
        parts.push({ text: promptText });
    } else {
        parts.push({ text: `Menu Context: """${menuSource.data}""". \n ${promptText}` });
    }

    try {
        const response = await ai.models.generateContent({
            model,
            contents: { parts },
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: "ARRAY",
                    items: {
                        type: "OBJECT",
                        properties: {
                            name: { type: "STRING" },
                            producer: { type: "STRING" },
                            year: { type: "STRING" },
                            price: { type: "NUMBER", nullable: true },
                            type: { type: "STRING" },
                            reasoning: { type: "STRING" },
                            matchScore: { type: "INTEGER" } 
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

export const extractTextFromMedia = async (base64Data: string, mimeType: string): Promise<string> => {
    if (!apiKey) throw new Error("Chiave API mancante.");
    const model = "gemini-2.5-flash";
    try {
        const response = await ai.models.generateContent({
            model,
            contents: {
                parts: [
                    { inlineData: { mimeType: mimeType, data: cleanBase64(base64Data) } },
                    { text: "OCR: Extract all text from this document." }
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
