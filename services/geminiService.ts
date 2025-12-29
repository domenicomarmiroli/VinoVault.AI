
import { GoogleGenAI, Type } from "@google/genai";
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

// Always use process.env.API_KEY directly as per guidelines
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

/**
 * Analyzes a wine label image using Gemini 3 Flash.
 */
export const analyzeWineLabel = async (base64Image: string, lang: Language = 'it'): Promise<Partial<Wine>> => {
  const model = "gemini-3-flash-preview"; 
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
          temperature: 0.5,
          responseMimeType: "application/json",
          // Use Type enum for responseSchema as per guidelines
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
              drinkWindow: { type: Type.STRING },
              marketPrice: { type: Type.NUMBER }
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
  const model = "gemini-3-flash-preview";
  const langName = getLanguageName(lang);

  const inventoryList = inventory.map(w => 
    `ID: ${w.id}, Nome: ${w.name} (${w.year}), Tipo: ${w.type}, Vitigno: ${w.grape}`
  ).join("\n");

  const styleInstruction = style === 'single' 
    ? `L'utente desidera un abbinamento "TUTTO PASTO". 
       Analizza l'intero menu come un unico blocco: "${menu}".
       Trova ESATTAMENTE 2 vini versatili (opzioni) che possano accompagnare degnamente TUTTE le portate dall'inizio alla fine.
       Restituisci un ARRAY con UN SOLO oggetto PairingSuggestion opera courseName è "Menu Completo" e dishName è "Tutto Pasto".`
    : `L'utente desidera un abbinamento "PER PORTATA".
       Dividi il menu "${menu}" nelle sue portate logiche (Antipasti, Primi, Secondi, ecc.).
       Per ogni portata, suggerisci ESATTAMENTE 2 vini ideali.`;

  const prompt = `
    ${styleInstruction}

    Inventario Cantina Utente (usa questi ID se disponibili):
    ${inventoryList || "Cantina Vuota"}
    
    Regole Generali:
    1. Rispondi in ${langName}.
    2. Per ogni portata, proponi SEMPRE 2 opzioni di vino.
    3. Privilegia l'inventario utente (type='owned').
    4. Se mancano vini adatti in cantina per un piatto, DEVI suggerire un "Consiglio d'acquisto" specifico (type='purchase').
    5. Fornisci 'servingTemp' preciso e 'servingAdvice' dettagliato in ${langName}.
  `;

  try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          systemInstruction: `Sei un sommelier esperto. Analizzi i menu e la cantina dell'utente. Sii tecnico e preciso. Rispondi in ${langName} con JSON puro.`,
          temperature: 0.5,
          responseMimeType: "application/json",
          // Use Type enum for responseSchema
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
                      type: { type: Type.STRING, enum: ['owned', 'purchase'] },
                      servingTemp: { type: Type.STRING },
                      servingAdvice: { type: Type.STRING }
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
 * Analyzes a potential purchase using Gemini 3 Flash with Search Grounding.
 */
export const analyzePurchase = async (
    input: { type: 'image' | 'url', data: string }, 
    inputPrice: number, 
    inventory: Wine[],
    lang: Language = 'it'
): Promise<PurchaseAnalysis> => {
    const model = "gemini-3-flash-preview";
    const langName = getLanguageName(lang);
    
    // Costruiamo il contesto della cantina per la "cellarFit"
    const inventoryContext = inventory.map(w => `${w.quantity}x ${w.name} (${w.type}, ${w.region})`).join(", ");

    let parts: any[] = [];
    const tools = [{ googleSearch: {} }];

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
                temperature: 0.5
            }
        });
        
        const rawText = response.text || "{}";
        const jsonString = cleanJson(rawText);
        
        let parsed: any = {};
        try {
            parsed = JSON.parse(jsonString);
        } catch (e) {
            console.error("JSON Parse Error on:", jsonString);
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

        const safeNumber = (val: any, fallback: number) => {
            if (val === undefined || val === null) return fallback;
            const num = parseFloat(String(val).replace(',', '.'));
            return isNaN(num) ? fallback : num;
        };

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
            qualityScore: 85, 
            sommelierNotes: parsed.sommelierNotes || `Vino identificato: ${parsed.wineDetails?.name}.`,
            cellarFit: parsed.cellarFit || { isRecommended: true, reasoning: "Aggiunta interessante." }
        };

    } catch (err: any) {
        console.error("Gemini Error:", err);
        throw new Error(err.message || "Errore Shop Advisor");
    }
}

/**
 * Analyzes restaurant wine list using Gemini 3 Flash.
 */
export const suggestRestaurantPairing = async (
    menuSource: { type: 'images' | 'text', data: string[] | string }, 
    dish: string,
    lang: Language = 'it'
): Promise<RestaurantSuggestion[]> => {
    const model = "gemini-3-flash-preview";
    const langName = getLanguageName(lang);
    let parts: any[] = [];

    const promptText = `
    Sei un Algoritmo Sommelier Deterministico di nuova generazione (Gemini 3).
    Analizza il menu fornito e suggerisci i vini per: "${dish}".

    OBIETTIVO: COERENZA ASSOLUTA.
    Non essere creativo. Sii analitico.
    Calcola il punteggio di abbinamento basandoti rigorosamente su: Struttura, Persistenza, Concordanza/Contrapposizione.

    ISTRUZIONI CRITICHE - LOGICA DI SELEZIONE:
    1. Analizza il menu e stima il numero totale di etichette uniche di vino presenti.
    2. SE IL MENU HA <= 30 VINI:
       - Restituisci i 3 migliori abbinamenti in assoluto.
       - Lascia il campo "priceCategory" vuoto o null.
    3. SE IL MENU HA > 30 VINI:
       - Devi fornire 6 suggerimenti totali, divisi per fascia di prezzo relativa a QUESTO menu.
       - Calcola 3 fasce di prezzo (Bassa, Media, Alta) basandoti sulla distribuzione dei prezzi nel menu.
       - Seleziona i 2 migliori abbinamenti per la "Fascia Economica".
       - Seleziona i 2 migliori abbinamenti per la "Fascia Media".
       - Seleziona i 2 migliori abbinamenti per la "Fascia Alta".
       - Compila il campo "priceCategory" con il nome della fascia.

    ISTRUZIONI PREZZI (RIGOROSE):
    1. Estrai il prezzo ESATTAMENTE come scritto accanto al vino.
    2. Se trovi un formato strutturato "NOME | ... | PREZZO", usalo.
    3. Se il prezzo non è leggibile, metti 0. NON INVENTARE.
    
    Format Risposta (JSON puro):
    [
      {
        "name": "Nome esatto dal menu",
        "producer": "Produttore",
        "year": "Annata o NV",
        "price": numero (es. 25.00) o 0,
        "type": "Rosso/Bianco/etc",
        "reasoning": "Motivo tecnico in ${langName}",
        "matchScore": intero 70-100,
        "priceCategory": "Fascia Economica" | "Fascia Media" | "Fascia Alta" | null
      }
    ]
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
                temperature: 0.5,
                responseMimeType: "application/json",
            }
        });
        
        const rawText = response.text || "[]";
        const jsonString = cleanJson(rawText);
        return JSON.parse(jsonString);

    } catch (err: any) {
        throw new Error(err.message || "Errore analisi carta vini");
    } 
};

export const extractTextFromMedia = async (base64Data: string, mimeType: string): Promise<string> => {
    const model = "gemini-3-flash-preview";
    try {
        const response = await ai.models.generateContent({
            model,
            contents: {
                parts: [
                    { inlineData: { mimeType: mimeType, data: cleanBase64(base64Data) } },
                    { text: `
                    OCR AVANZATO PER MENU RISTORANTE (Modello v3).
                    Trascrivi il contenuto mantenendo rigorosamente la struttura.
                    
                    FORMATO RICHIESTO PER OGNI VINO (Linea per linea):
                    [NOME VINO] | [PRODUTTORE] | [ANNATA] | [PREZZO]
                    
                    Regole:
                    1. Scrivi ogni vino su una nuova riga univoca.
                    2. Se il produttore non è esplicito ma è nell'intestazione della sezione (es. "Vini di Garofoli"), includilo nella riga.
                    3. Il PREZZO deve essere quello esattamente allineato visivamente al vino.
                    4. Se ci sono più prezzi per formati diversi, scrivili entrambi nella colonna prezzo (es. "5€ (calice) / 20€ (bt)").
                    5. Se non è un vino (es. titolo sezione "Rossi"), riportalo semplicemente su una riga a sé.
                    6. NON inventare dati. Se manca l'annata, lascia lo spazio vuoto tra i separatori.
                    ` }
                ]
            },
            config: {
                temperature: 0.1
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
    const model = "gemini-3-flash-preview";
    const langName = getLanguageName(lang);

    const inventorySummary = inventory.map(w => `[${w.quantity}] ${w.name} ${w.year}`).join("\n");
    const historySummary = history.map(h => `Bevuto: ${h.name}, Voto: ${h.rating}`).join("\n");

    const prompt = `
        Analisi Cantina Strategica.
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
                temperature: 0.5,
                responseMimeType: "application/json",
                // Use Type enum for responseSchema
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
    } catch (err: any) {
        throw new Error(err.message || "Errore report");
    }
};
