

export type Language = 'it' | 'en' | 'fr' | 'es' | 'de';

export enum WineType {
  RED = 'Rosso',
  WHITE = 'Bianco',
  ROSE = 'Rosato',
  SPARKLING = 'Spumante/Champagne',
  DESSERT = 'Dolce/Passito',
  OTHER = 'Altro'
}

export interface WineStyle {
  freshRich?: number;   // 1-6, 1=Fresco, 6=Ricco
  sweetness?: number;   // 1-5 Dolcezza
  body?: number;        // 1-5 Corpo
  acidity?: number;     // 1-5 Acidità
  tannin?: number;      // 1-5 Tannino
  wood?: number;        // 1-5 Legno
  persistence?: number; // 1-5 Persistenza
  aromas?: string[];    // Aromi principali
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

  // AI Generated Advice
  storageTemp: string;
  storageAdvice: string;
  servingTemp: string;
  servingAdvice: string;
  foodPairings: string[];

  // Analytics & Smart Features
  drinkWindow: string; // Format "2025-2028"
  marketPrice: number; // Estimated current value

  imageUrl?: string;
  qualityScore?: number;
  wineStyle?: WineStyle;
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
  location?: string; // NEW: Where it was drunk
}

export interface Location {
    id: string;
    name: string;
}

export interface RestaurantAnalysis {
  score: number;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  courseDetails: {
    course: string;
    feedback: string;
    bestMatches: string[];
    unsuitableWines: string[];
    missingStyles: string[];
  }[];
  strategicAdvice: string;
  generatedAt: string;
}

export interface Restaurant {
    id: string;
    name: string;
    slug: string; 
    menu_context: string; // Wine list
    food_menu?: string;   // Food menu
    menu_analysis?: RestaurantAnalysis; // Professional analysis
    manager_id?: string; 
    manager_email?: string; 
    created_at?: string;
    user_count?: number;
    total_ai_usage?: number;
}

export interface User {
  id: string;
  email: string;
  role: 'user' | 'admin';
  is_premium?: boolean; 
  language?: Language; 
  created_at?: string;
  last_login?: string;
  ref_restaurant_slug?: string; 
  ai_usage_count?: number; 
  wine_count?: number;
  managed_restaurant?: Restaurant; // Dati del ristorante se l'utente è un gestore
}

export interface OnlinePrice {
    source: string; 
    price: number;
    currency: string;
    link: string;
    thumbnail?: string;
}

export interface CellarRecommendation {
    wineName: string;
    reason: string;
    type: string;
}

export interface CellarReport {
    score: number; // 0-100 salute complessiva della cantina
    overallAssessment: string;
    palateTags: string[]; // 3-6 tag brevi sul profilo di gusto
    palateProfile: string;
    gapTags: string[]; // 2-5 tag brevi sulle lacune stilistiche
    gapAnalysis: string;
    buyRecommendations: CellarRecommendation[];
    drinkNowStrategy: string;
}

// Added missing interfaces for AI services
export interface PairingSuggestion {
  courseName: string;
  dishName: string;
  options: {
    wineId?: string | null;
    wineName: string;
    reasoning: string;
    type: 'owned' | 'purchase';
    servingTemp: string;
    servingAdvice: string;
  }[];
}

export interface PurchaseAnalysis {
    wineDetails: {
        name: string;
        producer: string;
        year: string;
        type: WineType;
        region?: string;
        grape?: string;
        alcohol?: string;
        foodPairings?: string[];
        drinkWindow?: string;
        servingTemp?: string;
    };
    marketPriceEstimate: number;
    isGoodDeal: boolean;
    dealRating: 'Excellent' | 'Good' | 'Fair' | 'Bad';
    qualityScore: number;
    sommelierNotes: string;
    strengths: string[];
    weaknesses: string[];
    bestOccasions: string[];
    cellarFit: {
        isRecommended: boolean;
        reasoning: string;
    };
    imageUrl?: string;
    wineStyle?: WineStyle;
}

export interface RestaurantSuggestion {
    name: string;
    producer: string;
    year: string;
    type: string;
    price?: number;
    matchScore: number;
    reasoning: string;
    priceCategory?: string;
}
