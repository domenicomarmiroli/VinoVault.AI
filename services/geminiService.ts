
import Anthropic from "@anthropic-ai/sdk";
import { Wine, WineType, PairingSuggestion, PurchaseAnalysis, RestaurantSuggestion, HistoryEntry, CellarReport, Language, RestaurantAnalysis } from "../types";

const cleanBase64 = (base64: string) => base64.replace(/^data:(image\/(png|jpg|jpeg|webp)|application\/pdf);base64,/, "");

const cleanJson = (text: string) => {
    if (!text) return "{}";
    let cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
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

    if (start !== -1 && end !== -1 && end > start) {
        return cleaned.substring(start, end + 1);
    }

    return text.includes('[') ? "[]" : "{}";
};

const client = new Anthropic({ apiKey: process.env.API_KEY });
const MODEL = "claude-opus-4-8";

const getLanguageName = (code: Language) => {
    switch(code) {
        case 'en': return 'English';
        case 'fr': return 'French';
        case 'es': return 'Spanish';
        case 'de': return 'German';
        default: return 'Italian';
    }
};

const extractText = (response: Anthropic.Message): string => {
    const block = response.content.find(b => b.type === "text");
    return block && block.type === "text" ? block.text : "";
};

export const analyzeWineLabel = async (base64Image: string, lang: Language = 'it'): Promise<Partial<Wine>> => {
  const langName = getLanguageName(lang);
  const wineTypes = Object.values(WineType).join(', ');
  try {
      const response = await client.messages.create({
        model: MODEL,
        max_tokens: 1024,
        system: `Sei un sommelier professionista. Estrai dati tecnici dall'etichetta del vino e rispondi ESCLUSIVAMENTE in JSON valido in ${langName}.\nNessun testo aggiuntivo, solo JSON. Il campo "type" deve essere uno di: ${wineTypes}.\nSchema JSON richiesto: {"name": string, "producer": string, "year": string, "type": string, "region": string, "grape": string, "alcohol": string, "storageTemp": string, "storageAdvice": string, "servingTemp": string, "servingAdvice": string, "foodPairings": string[], "price": number, "drinkWindow": string, "marketPrice": number}`,
        messages: [{
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: "image/jpeg", data: cleanBase64(base64Image) } },
            { type: "text", text: `Analizza questa etichetta di vino in ${langName}. Rispondi solo in JSON.` }
          ]
        }]
      });
      return JSON.parse(cleanJson(extractText(response)));
  } catch (err: any) { throw new Error(err.message || "Errore AI"); }
};

export const suggestPairing = async (menu: string, guests: number, inventory: Wine[], style: 'single' | 'multiple', lang: Language = 'it'): Promise<PairingSuggestion[]> => {
  const langName = getLanguageName(lang);
  const inventoryList = inventory.map(w => `ID: ${w.id}, Nome: ${w.name} (${w.year}), Tipo: ${w.type}`).join("\n");
  try {
      const response = await client.messages.create({
        model: MODEL,
        max_tokens: 2048,
        system: `Sei un sommelier esperto. Rispondi ESCLUSIVAMENTE in JSON valido in ${langName}. Nessun testo aggiuntivo, solo un array JSON.\nSchema richiesto: array di {"courseName": string, "dishName": string, "options": [{"wineId": string|null, "wineName": string, "reasoning": string, "type": "owned"|"purchase", "servingTemp": string, "servingAdvice": string}]}`,
        messages: [{
          role: "user",
          content: `Menu: ${menu}. Ospiti: ${guests}. Inventario cantina:\n${inventoryList}\nStile abbinamento: ${style}.\nRispondi SOLO con l'array JSON.`
        }]
      });
      return JSON.parse(cleanJson(extractText(response) || "[]"));
  } catch (err: any) { throw new Error(err.message || "Errore Sommelier"); }
};

export const analyzePurchase = async (input: { type: 'image' | 'url', data: string }, inputPrice: number, inventory: Wine[], lang: Language = 'it'): Promise<PurchaseAnalysis> => {
    const langName = getLanguageName(lang);
    const inventoryContext = inventory.map(w => `${w.quantity}x ${w.name} (${w.type})`).join(", ");
    try {
        const contentParts: Anthropic.MessageParam["content"] = [];
        if (input.type === 'image') {
            contentParts.push({ type: "image", source: { type: "base64", media_type: "image/jpeg", data: cleanBase64(input.data) } });
        } else {
            contentParts.push({ type: "text", text: input.data });
        }
        contentParts.push({ type: "text", text: `Prezzo offerto: €${inputPrice}. Mia cantina attuale: ${inventoryContext || 'vuota'}. Analizza se l'acquisto è sensato in ${langName}. Rispondi SOLO in JSON.` });

        const response = await client.messages.create({
            model: MODEL,
            max_tokens: 2048,
            system: `Agisci come un Broker di vini e Sommelier professionista. Analizza l'affare e la coerenza con la cantina esistente.\nIMPORTANTE: Il campo 'qualityScore' deve essere un numero da 0 a 100 che riflette ESCLUSIVAMENTE la qualità intrinseca del vino e del produttore, INDIPENDENTEMENTE DAL PREZZO o dall'offerta.\nRispondi ESCLUSIVAMENTE in formato JSON valido seguendo questo schema:\n{"wineDetails": {"name": string, "producer": string, "year": string, "type": string, "region": string, "grape": string, "alcohol": string, "foodPairings": string[]}, "marketPriceEstimate": number, "isGoodDeal": boolean, "dealRating": "Excellent"|"Good"|"Fair"|"Bad", "qualityScore": number, "sommelierNotes": string, "cellarFit": {"isRecommended": boolean, "reasoning": string}}`,
            messages: [{ role: "user", content: contentParts }]
        });
        return JSON.parse(cleanJson(extractText(response)));
    } catch (err: any) { throw new Error(err.message || "Errore Shop Advisor"); }
};

export const suggestRestaurantPairing = async (menuSource: { type: 'images' | 'text', data: string[] | string }, dish: string, lang: Language = 'it'): Promise<RestaurantSuggestion[]> => {
    const langName = getLanguageName(lang);
    try {
        const contentParts: Anthropic.MessageParam["content"] = [];
        if (menuSource.type === 'images') {
            for (const img of menuSource.data as string[]) {
                contentParts.push({ type: "image", source: { type: "base64", media_type: "image/jpeg", data: cleanBase64(img) } });
            }
        } else {
            contentParts.push({ type: "text", text: menuSource.data as string });
        }
        contentParts.push({ type: "text", text: `Scegli i migliori vini per accompagnare il piatto: ${dish}. Se la carta è ampia, seleziona 2 vini per ogni fascia di prezzo (Economica, Media, Alta). Se la carta è piccola, seleziona i 3 migliori in assoluto. Rispondi in ${langName} solo JSON.` });

        const response = await client.messages.create({
            model: MODEL,
            max_tokens: 2048,
            system: `Sommelier Digitale Professionista. Analizza la carta vini fornita per trovare l'abbinamento ideale con il piatto indicato.\nREGOLE DI SELEZIONE:\n1. Estrai fino a 2 vini per ogni fascia di prezzo ('Fascia Economica', 'Fascia Media', 'Fascia Alta') se disponibili, per un totale di massimo 6 vini.\n2. Se la lista è limitata, fornisci comunque almeno i 3 migliori abbinamenti totali.\n3. Per ogni vino calcola un matchScore da 0 a 100 basato sulla coerenza organolettica.\n4. Rispondi ESCLUSIVAMENTE in formato JSON valido (Array di oggetti).\nSchema: [{"name": string, "producer": string, "year": string, "type": string, "price": number, "matchScore": number, "reasoning": string, "priceCategory": "Fascia Economica"|"Fascia Media"|"Fascia Alta"}]`,
            messages: [{ role: "user", content: contentParts }]
        });
        return JSON.parse(cleanJson(extractText(response) || "[]"));
    } catch (err: any) { throw new Error(err.message || "Errore analisi carta vini"); }
};

export const analyzeRestaurantcompleteness = async (wineList: string, foodMenu: string, lang: Language = 'it'): Promise<RestaurantAnalysis> => {
    const langName = getLanguageName(lang);
    try {
        const response = await client.messages.create({
            model: MODEL,
            max_tokens: 3000,
            system: `Agisci come un Master Sommelier. Valuta la coerenza tra la carta vini e il menù piatti fornito.\nIMPORTANTE: Il campo 'score' DEVE essere un numero da 0.0 a 10.0 (NON usare mai valori sopra il 10).\nRispondi ESCLUSIVAMENTE in formato JSON valido seguendo questo schema:\n{"score": number, "summary": string, "strengths": string[], "weaknesses": string[], "courseDetails": [{"course": string, "feedback": string, "bestMatches": string[], "unsuitableWines": string[], "missingStyles": string[]}], "strategicAdvice": string}`,
            messages: [{
                role: "user",
                content: `Esegui un Audit Tecnico Professionale in ${langName}.\nCARTA VINI: ${wineList}\nMENU PIATTI: ${foodMenu}`
            }]
        });
        const result = JSON.parse(cleanJson(extractText(response)));
        return { ...result, generatedAt: new Date().toISOString() };
    } catch (err: any) { throw new Error("Errore analisi professionale"); }
};

export const extractTextFromMedia = async (base64Data: string, mimeType: string): Promise<string> => {
    try {
        const isImage = mimeType.startsWith("image/");
        const contentParts: Anthropic.MessageParam["content"] = isImage
            ? [
                { type: "image", source: { type: "base64", media_type: mimeType as "image/jpeg" | "image/png" | "image/gif" | "image/webp", data: cleanBase64(base64Data) } },
                { type: "text", text: "OCR PROFESSIONALE. Estrai il testo mantenendo struttura e prezzi." }
              ]
            : [{ type: "text", text: `Estrai il testo dal seguente contenuto (${mimeType}). Dati: ${base64Data}` }];

        const response = await client.messages.create({
            model: MODEL,
            max_tokens: 4096,
            messages: [{ role: "user", content: contentParts }]
        });
        return extractText(response);
    } catch (err) { throw new Error("Errore lettura media"); }
};

export const generateCellarReport = async (inventory: Wine[], history: HistoryEntry[], lang: Language = 'it'): Promise<CellarReport> => {
    const langName = getLanguageName(lang);
    const inventoryText = inventory.map(w => `- ${w.name} (${w.year}), ${w.producer}, ${w.type}`).join("\n");
    try {
        const response = await client.messages.create({
            model: MODEL,
            max_tokens: 2048,
            system: `Sei un Sommelier Senior. Analizza la cantina e rispondi ESCLUSIVAMENTE in JSON valido in ${langName}.\nSchema: {"overallAssessment": string, "palateProfile": string, "gapAnalysis": string, "buyRecommendations": [{"wineName": string, "reason": string, "type": string}], "drinkNowStrategy": string}`,
            messages: [{
                role: "user",
                content: `Analizza questa cantina e fornisci un report in ${langName} solo JSON:\n${inventoryText}`
            }]
        });
        return JSON.parse(cleanJson(extractText(response) || "{}"));
    } catch (err: any) { throw new Error(err.message || "Errore report"); }
};
