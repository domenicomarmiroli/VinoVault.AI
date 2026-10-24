// L'AI a volte restituisce un tipo di vino descrittivo (es. "Rosso Fermo",
// "Spumante Rosé", "Vino Frizzante Metodo Ancestrale") invece del valore
// esatto dell'enum WineType ("Rosso", "Bianco", ...). Questo classificatore
// riconosce la categoria cromatica/di filtro a partire da parole chiave,
// così colori e filtri funzionano con qualunque dicitura restituita.

export type WineColorCategory = 'red' | 'white' | 'rose' | 'sparkling' | 'dessert' | 'other';

const RULES: { category: WineColorCategory; keywords: string[] }[] = [
  { category: 'sparkling', keywords: ['spumant', 'champagne', 'frizzant', 'metodo classico', 'metodo ancestrale', 'prosecco', 'franciacorta', 'crémant', 'cremant', 'cava', 'sparkling'] },
  { category: 'dessert', keywords: ['dolce', 'passito', 'moscato', 'icewine', 'vin santo', 'liquoroso', 'dessert'] },
  { category: 'rose', keywords: ['rosat', 'rosé', 'rose'] },
  { category: 'red', keywords: ['ross', 'red'] },
  { category: 'white', keywords: ['bianc', 'white'] },
];

export const classifyWineType = (type?: string | null): WineColorCategory => {
  if (!type) return 'other';
  const normalized = type.toLowerCase();
  for (const rule of RULES) {
    if (rule.keywords.some(k => normalized.includes(k))) return rule.category;
  }
  return 'other';
};

/** true se `type` appartiene alla categoria cromatica rappresentata da `filterType` (valore di WineType). */
export const wineTypeMatchesFilter = (type: string | undefined, filterType: string): boolean => {
  return classifyWineType(type) === classifyWineType(filterType);
};
