
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
  type?: string; // Added for filtering
  consumedDate: string;
  price: number;
  imageUrl?: string;
  rating?: number;
  notes?: string;
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
  servingTemp?: string;   // NEW
  servingAdvice?: string; // NEW (Opening time)
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
    reasoning: string; // Perché sta bene col piatto
    matchScore: number; // 1-100
    priceCategory?: 'Fascia Economica' | 'Fascia Media' | 'Fascia Alta'; // NEW
}

export interface User {
  id: string;
  email: string;
  role: 'user' | 'admin';
  is_premium?: boolean; 
  language?: Language; // New Language Preference
  created_at?: string;
  last_login?: string;
  ref_restaurant_slug?: string; // NEW: Origin of registration
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

// --- NEW TYPES FOR CELLAR REPORT ---

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

// --- NEW TYPES FOR RESTAURANT B2B ---
export interface Restaurant {
    id: string;
    name: string;
    slug: string; // Used in URL ?ref=slug
    menu_context: string; // OCR text of the wine list
    created_at?: string;
    // Admin Stats
    user_count?: number;
    total_ai_usage?: number;
}
