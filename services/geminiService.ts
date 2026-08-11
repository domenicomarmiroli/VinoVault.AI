import { Wine, PairingSuggestion, PurchaseAnalysis, RestaurantSuggestion, HistoryEntry, CellarReport, Language, RestaurantAnalysis } from "../types";

const apiCall = async (endpoint: string, body: object) => {
    const token = localStorage.getItem('token');
    const res = await fetch(`/api/ai/${endpoint}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(body)
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Errore server' }));
        throw new Error(err.error || 'Errore server');
    }
    return res.json();
};

export const analyzeWineLabel = async (base64Image: string, lang: Language = 'it'): Promise<Partial<Wine>> => {
    return apiCall('analyze-label', { base64Image, lang });
};

export const suggestPairing = async (menu: string, guests: number, inventory: Wine[], style: 'single' | 'multiple', lang: Language = 'it'): Promise<PairingSuggestion[]> => {
    return apiCall('suggest-pairing', { menu, guests, inventory, style, lang });
};

export const analyzePurchase = async (input: { type: 'image' | 'url', data: string }, inputPrice: number, inventory: Wine[], lang: Language = 'it'): Promise<PurchaseAnalysis> => {
    return apiCall('analyze-purchase', { input, inputPrice, inventory, lang });
};

export const suggestRestaurantPairing = async (menuSource: { type: 'images' | 'text', data: string[] | string }, dish: string, lang: Language = 'it'): Promise<RestaurantSuggestion[]> => {
    return apiCall('suggest-restaurant-pairing', { menuSource, dish, lang });
};

export const analyzeRestaurantcompleteness = async (wineList: string, foodMenu: string, lang: Language = 'it'): Promise<RestaurantAnalysis> => {
    return apiCall('analyze-restaurant', { wineList, foodMenu, lang });
};

export const extractTextFromMedia = async (base64Data: string, mimeType: string): Promise<string> => {
    const result = await apiCall('extract-text', { base64Data, mimeType });
    return result.text || '';
};

export const generateCellarReport = async (inventory: Wine[], history: HistoryEntry[], lang: Language = 'it'): Promise<CellarReport> => {
    return apiCall('cellar-report', { inventory, history, lang });
};
