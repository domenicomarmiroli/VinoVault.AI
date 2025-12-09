import { GoogleGenAI, Type } from "@google/genai";
import { Wine, WineType, PairingSuggestion } from "../types";

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
  const model = "gemini-2.5-flash"; // Use generic model which handles images well
  
  const systemInstruction = `Sei un sommelier professionista e un gestore di cantina meticoloso. 
  Analizza l'immagine dell'etichetta di vino per estrarre i dati tecnici e fornire consigli operativi precisi.
  Fornisci suggerimenti dettagliati su conservazione (luce, posizione) e servizio (apertura, decanter).
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
          text: "Analizza questa etichetta. Estrai i dati e fornisci consigli. Se l'anno non è visibile, metti 'N/A'. Se il prezzo non è noto, stima un valore medio di mercato in Italia.",
        },
      ],
    },
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING, description: "Nome del vino" },
          producer: { type: Type.STRING, description: "Cantina o produttore" },
          year: { type: Type.STRING, description: "Annata" },
          type: { type: Type.STRING, enum: Object.values(WineType), description: "Tipologia" },
          region: { type: Type.STRING, description: "Regione geografica e denominazione (es. DOCG)" },
          grape: { type: Type.STRING, description: "Vitigno principale" },
          alcohol: { type: Type.STRING, description: "Gradazione alcolica" },
          storageTemp: { type: Type.STRING, description: "Temperatura ideale di conservazione (es. 12-14°C)" },
          storageAdvice: { type: Type.STRING, description: "Consigli specifici sulla conservazione (es. coricata, al buio, umidità)" },
          servingTemp: { type: Type.STRING, description: "Temperatura di servizio ideale" },
          servingAdvice: { type: Type.STRING, description: "Consigli precisi su quando aprire (es. 1 ora prima, scaraffare)" },
          foodPairings: { type: Type.ARRAY, items: { type: Type.STRING }, description: "3 abbinamenti cibi ideali" },
          // Changed from estimatedPrice to price to match Wine interface
          price: { type: Type.NUMBER, description: "Prezzo stimato di mercato in Euro" }
        },
        required: ["name", "producer", "type", "storageTemp", "servingAdvice", "storageAdvice"]
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

  // Create a simplified inventory string to save tokens and focus on relevance
  const inventoryList = inventory.map(w => 
    `ID: ${w.id}, Nome: ${w.name} (${w.year}), Tipo: ${w.type}, Qta: ${w.quantity}`
  ).join("\n");

  const prompt = `
    Ho un pranzo/cena per ${guests} persone.
    Ecco il menu:
    "${menu}"

    Vorrei servire ${style === 'single' ? "un solo tipo di vino per tutto il pasto" : "vini diversi per ogni portata principale"}.

    Ecco la mia cantina attuale (Inventory):
    ${inventoryList}

    Compito:
    Suggerisci gli abbinamenti come un sommelier esperto. 
    1. Se ho un vino adatto in cantina (Inventory), DEVI suggerire quello indicando il suo ID.
    2. Se non ho un vino adatto, suggerisci una tipologia generica (fallbackWineName) da comprare.
    3. Analizza il menu e dividilo in portate logiche (es. Aperitivo, Primo, Secondo).
  `;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      systemInstruction: "Sei un sommelier di alto livello. Suggerisci abbinamenti armonici. Privilegia i vini presenti nell'inventario dell'utente se compatibili.",
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            courseName: { type: Type.STRING, description: "Es. Aperitivo, Antipasto, Portata Principale" },
            dishName: { type: Type.STRING, description: "Il piatto del menu a cui si riferisce" },
            reasoning: { type: Type.STRING, description: "Perché questo abbinamento funziona" },
            suggestedWineId: { type: Type.STRING, description: "ID del vino dall'inventario (se presente), altrimenti null o stringa vuota", nullable: true },
            fallbackWineName: { type: Type.STRING, description: "Nome del vino o tipologia da comprare se non presente in inventario" }
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