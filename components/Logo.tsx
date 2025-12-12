
import React, { useState } from 'react';

interface LogoProps {
  className?: string;
  showText?: boolean;
  light?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ className = "w-12 h-12", showText = true, light = false }) => {
  const [imageError, setImageError] = useState(false);

  return (
    <div className="flex items-center gap-3 select-none">
      <div className={`relative ${className} flex-shrink-0`}>
        {!imageError ? (
            <img 
              src="/logo.png" 
              alt="AIKNOW.WINE Logo" 
              className="w-full h-full object-contain drop-shadow-md"
              onError={() => setImageError(true)}
            />
        ) : (
            // Fallback SVG Logo (Fusion Swirl) se l'immagine fallisce
            <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <linearGradient id="wineGrad" x1="0%" y1="100%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#5d173a"/>
                        <stop offset="100%" stopColor="#933d76"/>
                    </linearGradient>
                    <linearGradient id="techGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#0ea5e9"/>
                        <stop offset="100%" stopColor="#2563eb"/>
                    </linearGradient>
                </defs>
                <circle cx="50" cy="50" r="48" fill="white" stroke="#f3f4f6" strokeWidth="2" />
                <path d="M50 90 A 40 40 0 0 1 50 10 C 50 10 30 30 50 50 C 70 70 50 90 50 90 Z" fill="url(#techGrad)" opacity="0.9" />
                <path d="M50 10 A 40 40 0 0 0 50 90 C 50 90 70 70 50 50 C 30 30 50 10 50 10 Z" fill="url(#wineGrad)" opacity="0.9" />
                <circle cx="50" cy="30" r="3" fill="white" />
                <circle cx="65" cy="40" r="2" fill="white" opacity="0.8" />
                <circle cx="35" cy="60" r="2" fill="white" opacity="0.6" />
                <path d="M50 30 L65 40 M65 40 L50 50" stroke="white" strokeWidth="1" strokeOpacity="0.5" />
            </svg>
        )}
      </div>

      {showText && (
        <div className="flex flex-col justify-center">
          <h1 className={`font-['Montserrat'] font-extrabold tracking-tight leading-none ${light ? "text-white" : "text-gray-900"}`} style={{ fontSize: '1.5rem' }}>
            AIKNOW
            <span className={light ? "text-cyan-400" : "text-wine-600"}>.WINE</span>
          </h1>
          <span className={`text-[0.6rem] uppercase tracking-[0.25em] font-medium ${light ? "text-blue-100" : "text-gray-400"}`} style={{ marginLeft: '2px' }}>
            Smart Sommelier
          </span>
        </div>
      )}
    </div>
  );
};