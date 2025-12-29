
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

export interface MenuRequest {
  menuText: string;
  guests: number;
  courseCount: 'single' | 'multiple';
}

export interface PairingOption {
  wineId?: string; // If owned
  wineName: string; // Fallback or display name
  reasoning: string;
  type: 'owned' | 'purchase';
  servingTemp?: string;   
  servingAdvice?: string; 
}

export interface PairingSuggestion {
  courseName: string;
  dishName: string;
  options: PairingOption[];
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

export interface User {
  id: string;
  email: string;
  role: 'user' | 'admin';
  is_premium?: boolean; 
  language?: Language; 
  created_at?: string;
  last_login?: string;
  ref_restaurant_slug?: string; 
  // Stats
  wine_count?: number;     
  ai_usage_count?: number; 
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
    overallAssessment: string;
    palateProfile: string;
    gapAnalysis: string;
    buyRecommendations: CellarRecommendation[];
    drinkNowStrategy: string;
}

export interface Restaurant {
    id: string;
    name: string;
    slug: string; 
    menu_context: string; 
    manager_id?: string; // ID dell'utente gestore
    manager_email?: string; // Email per visualizzazione in admin
    created_at?: string;
    user_count?: number;
    total_ai_usage?: number;
}
