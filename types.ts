
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
  location: string; // e.g., "Scaffale A, Ripiano 2"
  
  // AI Generated Advice
  storageTemp: string;
  storageAdvice: string; // New: Specific storage tips
  servingTemp: string;
  servingAdvice: string; // Decanting, when to open
  foodPairings: string[];
  
  imageUrl?: string; // Base64
}

export interface HistoryEntry {
  id: string;
  wineId: string;
  name: string;
  producer: string;
  year: string;
  consumedDate: string;
  price: number;
  imageUrl?: string;
  rating?: number; // 1-5
  notes?: string; // Tasting notes
}

export interface Location {
    id: string;
    name: string;
}

export interface MenuRequest {
  menuText: string;
  guests: number;
  courseCount: 'single' | 'multiple'; // 1 wine for all vs pairing per course
}

export interface PairingSuggestion {
  courseName: string; // e.g., "Aperitivo", "Primo"
  dishName: string; // Extracted from menu
  reasoning: string;
  suggestedWineId?: string; // If found in inventory
  fallbackWineName: string; // If not in inventory
}

export interface PurchaseAnalysis {
  wineDetails: Partial<Wine>;
  marketPriceEstimate: number;
  isGoodDeal: boolean;
  dealRating: 'Bad' | 'Fair' | 'Good' | 'Excellent';
  qualityScore: number; // 1-100
  sommelierNotes: string; // Taste profile
  cellarFit: {
    isRecommended: boolean;
    reasoning: string; // "You have 0 whites, this is a good addition" or "You have too many Chianti"
  };
}
