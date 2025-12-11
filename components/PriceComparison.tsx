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
              const err = await res.json();
              throw new Error(err.error || "Servizio non disponibile");
          }

          const data: OnlinePrice[] = await res.json();
          setPrices(data);
      } catch (err: any) {
          alert(`Errore: ${err.message}`);
      } finally {
          setLoading(false);
          setSearched(true);
      }
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
                <span className="text-xs text-indigo-500 font-medium">Cerco le migliori offerte su Google Shopping...</span>
            </div>
        )}

        {searched && prices.length === 0 && (
             <div className="bg-gray-50 p-4 rounded-xl text-center border border-gray-100">
                 <p className="text-sm text-gray-500">Nessuna offerta specifica trovata per questa annata.</p>
                 <button onClick={handleSearch} className="text-xs text-indigo-600 font-bold mt-2 hover:underline">Riprova</button>
             </div>
        )}

        {prices.length > 0 && (
            <div className="space-y-3 animate-in slide-in-from-bottom duration-300">
                <div className="flex justify-between items-center mb-1">
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Migliori Offerte</h3>
                    <span className="text-[10px] text-gray-400">Powered by Google Shopping</span>
                </div>
                
                {prices.map((price, idx) => (
                    <a 
                        key={idx} 
                        href={price.link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="block bg-white border border-gray-200 rounded-xl p-3 hover:shadow-md transition-all active:scale-[0.99] group relative overflow-hidden"
                    >
                        {idx === 0 && (
                            <div className="absolute top-0 right-0 bg-green-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-bl-lg z-10">
                                BEST PRICE
                            </div>
                        )}
                        <div className="flex items-center gap-3">
                            {price.thumbnail ? (
                                <img src={price.thumbnail} alt={price.source} className="w-10 h-10 object-contain rounded-md bg-white border border-gray-100" />
                            ) : (
                                <div className="w-10 h-10 bg-gray-100 rounded-md flex items-center justify-center text-gray-400">
                                    <ShoppingCartIcon className="w-5 h-5" />
                                </div>
                            )}
                            
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-gray-900 truncate">{price.source}</p>
                                <div className="flex items-center gap-1 text-xs text-indigo-600 font-medium group-hover:underline">
                                    Vai all'offerta <ExternalLinkIcon className="w-3 h-3" />
                                </div>
                            </div>

                            <div className="text-right">
                                <span className="block text-lg font-bold text-gray-900">€{price.price?.toFixed(2)}</span>
                            </div>
                        </div>
                    </a>
                ))}
                
                <button onClick={() => setSearched(false)} className="w-full text-center text-xs text-gray-400 hover:text-gray-600 mt-2">
                    Chiudi ricerca
                </button>
            </div>
        )}
    </div>
  );
};

export default PriceComparison;