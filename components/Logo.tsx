
import React from 'react';

interface LogoProps {
  className?: string;
  showText?: boolean;
  light?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ className = "w-12 h-12", showText = true, light = false }) => {
  const mainColor = light ? "text-white" : "text-wine-800";
  const liquidColor = light ? "fill-white" : "fill-wine-700";
  const circuitColor = light ? "stroke-wine-200" : "stroke-wine-500";
  const dotColor = light ? "fill-wine-200" : "fill-wine-500";

  return (
    <div className="flex items-center gap-3 select-none">
      <div className={`relative ${className} flex-shrink-0`}>
        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-sm">
           
           {/* Glass Stem & Base */}
           <path 
             d="M50 75 V92 M35 92 H65 M50 92 C50 96 40 96 40 96 H60 C60 96 50 96 50 92" 
             stroke="currentColor" 
             strokeWidth="4" 
             strokeLinecap="round" 
             strokeLinejoin="round" 
             className={mainColor}
           />

           {/* Glass Bowl Outline */}
           <path 
             d="M25 20 C25 55 35 75 50 75 C65 75 75 55 75 20" 
             stroke="currentColor" 
             strokeWidth="4" 
             strokeLinecap="round" 
             className={mainColor}
           />

           {/* Wine Liquid (Bottom Half) */}
           <path 
             d="M27 45 C27 45 35 52 50 52 C65 52 73 45 73 45 C73 58 68 71 50 71 C32 71 27 58 27 45 Z" 
             className={liquidColor}
             fillOpacity="0.9"
           />

           {/* Neural Network (Top Half) */}
           <g className={circuitColor} strokeWidth="2" strokeLinecap="round">
              <path d="M50 30 L35 25" />
              <path d="M50 30 L65 25" />
              <path d="M50 30 L40 40" />
              <path d="M50 30 L60 40" />
              <path d="M35 25 L40 40" />
              <path d="M65 25 L60 40" />
           </g>
           <g className={dotColor}>
              <circle cx="50" cy="30" r="3" />
              <circle cx="35" cy="25" r="2.5" />
              <circle cx="65" cy="25" r="2.5" />
              <circle cx="40" cy="40" r="2.5" />
              <circle cx="60" cy="40" r="2.5" />
           </g>

        </svg>
      </div>

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
