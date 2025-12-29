
export type Language = 'it' | 'en' | 'fr' | 'es' | 'de';

export enum WineType {
  RED = 'Rosso',
  WHITE = 'Bianco',
  ROSE = 'Rosato',
  SPARKLING = 'Spumante/Champagne',
  DESSERT = 'Dolce/Passito',
  OTHER = 'Altro'
}

export interface Wine {
  id: string;
  name: string;
  producer: string;
  year: string;
  type: WineType;
  region: string;
  grape: string;
  alcohol: string;
  purchaseDate: string;
  price: number;
  quantity: number;
  location: string;
  storageTemp: string;
  storageAdvice: string;
  servingTemp: string;
  servingAdvice: string;
  foodPairings: string[];
  drinkWindow: string; 
  marketPrice: number; 
  imageUrl?: string;
}

export interface HistoryEntry {
  id: string;
  wineId: string;
  name: string;
  producer: string;
  year: string;
  type?: string; 
  consumedDate: string;
  price: number;
  imageUrl?: string;
  rating?: number;
  notes?: string;
  location?: string;
}

export interface Location {
    id: string;
    name: string;
}

export interface User {
  id: string;
  email: string;
  role: 'user' | 'admin' | 'restaurant'; 
  is_premium?: boolean; 
  language?: Language; 
  ref_restaurant_slug?: string; 
  wine_count?: number;
  ai_usage_count?: number;
}

export interface Restaurant {
    id: string;
    name: string;
    slug: string; 
    menu_context: string; 
    owner_id?: string; // ID dell'utente che gestisce il ristorante
    owner_email?: string; // Solo per visualizzazione in admin
    created_at?: string;
    user_count?: number;
    total_ai_usage?: number;
}

export interface PurchaseAnalysis {
    wineDetails: Partial<Wine>;
    marketPriceEstimate: number;
    isGoodDeal: boolean;
    dealRating: 'Bad' | 'Fair' | 'Good' | 'Excellent';
    qualityScore: number;
    sommelierNotes: string;
    cellarFit: {
        isRecommended: boolean;
        reasoning: string;
    };
}

// Added missing PairingSuggestion interface for Sommelier services and views
export interface PairingSuggestion {
  courseName: string;
  dishName: string;
  options: Array<{
    wineId?: string | null;
    wineName: string;
    reasoning: string;
    type: 'owned' | 'purchase';
    servingTemp: string;
    servingAdvice: string;
  }>;
}

// Added missing OnlinePrice interface for price comparison components
export interface OnlinePrice {
  source: string;
  price: number;
  url?: string;
}

export interface RestaurantSuggestion {
    name: string;
    producer: string;
    year: string;
    price: number;
    type: string;
    reasoning: string; 
    matchScore: number; 
    priceCategory?: 'Fascia Economica' | 'Fascia Media' | 'Fascia Alta'; 
}

export interface CellarReport {
    overallAssessment: string;
    palateProfile: string;
    gapAnalysis: string;
    buyRecommendations: Array<{wineName: string, reason: string, type: string}>;
    drinkNowStrategy: string;
}
