
import React, { useState } from 'react';
import { OnlinePrice } from '../types';
import { ShoppingCartIcon, ExternalLinkIcon } from './Icons';

interface PriceComparisonProps {
  name: string;
  producer: string;
  year: string;
  isPremium?: boolean; // New Prop
}

const PriceComparison: React.FC<PriceComparisonProps> = ({ name, producer, year, isPremium = false }) => {
  const [loading, setLoading] = useState(false);
  const [prices, setPrices] = useState<OnlinePrice[]>([]);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
      setLoading(true);
      setSearched(false);
      setPrices([]);

      // 1. Clean Query
      const query = `${producer} ${name} ${year} price`.trim();
      const token = localStorage.getItem('vinovault_token');

      try {
          const res = await fetch(`/api/search-prices?query=${encodeURIComponent(query)}`, {
              headers: {
                  'Authorization': `Bearer ${token}`
              }
          });
          
          if (!res.ok) {
              const err = await res.json().catch(() => ({ error: "Servizio non disponibile" }));
              throw new Error(err.error || "Servizio non disponibile");
          }

          const data: OnlinePrice[] = await res.json();
          if (Array.isArray(data)) {
              setPrices(data);
          } else {
              setPrices([]);
          }
      } catch (err: any) {
          console.error("Search error:", err);
          alert(`Errore: ${err.message}`);
      } finally {
          setLoading(false);
          setSearched(true);
      }
  };

  const getGoogleShoppingUrl = () => {
      const query = `${producer} ${name} ${year}`.trim();
      return `https://www.google.com/search?tbm=shop&q=${encodeURIComponent(query)}`;
  };

  const getStoreSearchUrl = (storeName: string) => {
      const query = `${producer} ${name} ${year} ${storeName}`.trim();
      return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
  };

  if (!isPremium) {
      return (
          <div className="mt-4 p-4 bg-gray-100 border border-gray-200 rounded-xl text-center">
              <div className="flex justify-center mb-2 text-gray-400">
                  <ShoppingCartIcon className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-gray-600">Confronta Prezzi Online</h3>
              <p className="text-xs text-gray-500 mt-1 mb-3">Trova le migliori offerte su Google Shopping.</p>
              <div className="inline-block px-3 py-1.5 bg-amber-100 border border-amber-200 text-amber-800 rounded-lg text-xs font-bold">
                  🔒 Funzionalità Premium
              </div>
              <p className="text-[10px] text-gray-400 mt-2">Contatta l'Admin per sbloccare.</p>
          </div>
      );
  }

  return (
    <div className="mt-4">
        {!searched && !loading && (
            <button 
                onClick={handleSearch}
                className="w-full py-3 bg-indigo-50 text-indigo-700 font-bold rounded-xl border border-indigo-200 hover:bg-indigo-100 transition-colors flex items-center justify-center gap-2"
            >
                <ShoppingCartIcon className="w-5 h-5" />
                Confronta Prezzi Online
            </button>
        )}

        {loading && (
            <div className="flex flex-col items-center justify-center py-4 space-y-2">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
                <span className="text-xs text-indigo-500 font-medium">Cerco i prezzi di mercato...</span>
            </div>
        )}

        {searched && (
            <div className="space-y-4 animate-in slide-in-from-bottom duration-300">
                {/* Main Google Shopping Button */}
                <a 
                    href={getGoogleShoppingUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-3 bg-blue-600 text-white font-bold rounded-xl shadow-md hover:bg-blue-700 transition-colors"
                >
                    <ShoppingCartIcon className="w-5 h-5" />
                    Cerca su Google Shopping
                </a>

                {prices.length > 0 ? (
                    <div className="space-y-3">
                        <div className="flex justify-between items-center mb-1 px-1">
                            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide">Prezzi Rilevati</h3>
                            <span className="text-[9px] text-gray-400">Clicca per verificare</span>
                        </div>
                        <p className="text-[10px] text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-2.5 py-1.5">
                            ⚠️ Prezzi indicativi trovati online: potrebbero non essere aggiornati. Verifica sempre il prezzo definitivo sul sito del negozio.
                        </p>

                        {prices.map((price, idx) => (
                            <a
                                key={idx}
                                href={price.link || getStoreSearchUrl(price.source)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block bg-white border border-gray-200 rounded-xl p-3 hover:shadow-md transition-all active:scale-[0.99] group"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <div className="w-8 h-8 bg-gray-100 rounded-md flex items-center justify-center text-gray-400 shrink-0">
                                            <ExternalLinkIcon className="w-4 h-4" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-bold text-gray-900 truncate">{price.source}</p>
                                            <p className="text-[10px] text-indigo-600 font-medium group-hover:underline truncate">
                                                {price.link ? 'Vai all\'offerta' : `Cerca "${price.source}" su Google`}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="text-right shrink-0">
                                        <span className="block text-lg font-bold text-gray-900">€{price.price?.toFixed(2)}</span>
                                    </div>
                                </div>
                            </a>
                        ))}
                    </div>
                ) : (
                     <div className="bg-gray-50 p-4 rounded-xl text-center border border-gray-100">
                         <p className="text-sm text-gray-500">Nessun prezzo specifico trovato.</p>
                         <p className="text-xs text-gray-400 mt-1">Prova il pulsante Google Shopping sopra.</p>
                     </div>
                )}
                
                <button onClick={() => setSearched(false)} className="w-full text-center text-xs text-gray-400 hover:text-gray-600 mt-2 pb-2">
                    Chiudi ricerca
                </button>
            </div>
        )}
    </div>
  );
};

export default PriceComparison;
