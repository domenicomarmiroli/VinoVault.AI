

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

export interface PairingSuggestion {
  courseName: string;
  dishName: string;
  reasoning: string;
  suggestedWineId?: string;
  fallbackWineName: string;
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
}

export interface User {
  id: string;
  email: string;
  role: 'user' | 'admin';
  created_at?: string;
  last_login?: string;
  // Stats
  wine_count?: number;     // From DB Join
  ai_usage_count?: number; // From DB column
}