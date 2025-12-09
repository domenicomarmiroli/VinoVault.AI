
import React from 'react';

interface LogoProps {
  className?: string;
  showText?: boolean;
  light?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ className = "w-12 h-12", showText = true, light = false }) => {
  return (
    <div className="flex items-center gap-3 select-none">
      {/* Icona Vettoriale */}
      <div className={`relative ${className} flex-shrink-0`}>
        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-sm">
           {/* Sfondo/Scudo opzionale o forma bottiglia */}
           <path 
             d="M50 5C38 5 35 15 35 25V35C35 40 25 45 25 60V85C25 93.28 31.72 100 40 100H60C68.28 100 75 93.28 75 85V60C75 45 65 40 65 35V25C65 15 62 5 50 5Z" 
             className={light ? "fill-white" : "fill-wine-700"}
           />
           {/* Serratura (Vault Concept) - Spazio Negativo */}
           <path 
             d="M50 55C53.31 55 56 57.69 56 61C56 63.2 54.8 65.1 53 66.2V78C53 79.66 51.66 81 50 81C48.34 81 47 79.66 47 78V66.2C45.2 65.1 44 63.2 44 61C44 57.69 46.69 55 50 55Z" 
             className={light ? "fill-wine-600" : "fill-white"}
           />
           {/* Etichetta/Dettaglio collo */}
           <rect x="35" y="28" width="30" height="4" rx="1" className={light ? "fill-wine-200" : "fill-wine-200"} fillOpacity="0.3" />
           
           {/* AI Sparkle */}
           <path 
             d="M85 20L82 22L85 24L87 22L85 20Z" 
             className={light ? "fill-yellow-300" : "fill-wine-400"} 
           />
           <path 
             d="M80 10L76 14L80 18L84 14L80 10Z" 
             className={light ? "fill-yellow-300" : "fill-wine-400"} 
           />
        </svg>
      </div>

      {/* Testo Brand */}
      {showText && (
        <div className="flex flex-col justify-center">
          <h1 className={`font-serif font-bold tracking-tight leading-none ${light ? "text-white" : "text-wine-900"}`} style={{ fontSize: '1.75rem' }}>
            VinoVault
            <span className={light ? "text-wine-200" : "text-wine-600"}>.ai</span>
          </h1>
          <span className={`text-[0.6rem] uppercase tracking-[0.2em] font-medium ${light ? "text-wine-100" : "text-gray-500"}`}>
            Smart Cellar Manager
          </span>
        </div>
      )}
    </div>
  );
};
