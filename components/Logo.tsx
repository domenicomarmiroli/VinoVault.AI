
import React from 'react';

interface LogoProps {
  className?: string;
  showText?: boolean;
  light?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ className = "w-12 h-12", showText = true, light = false }) => {
  return (
    <div className="flex items-center gap-3 select-none">
      <div className={`relative ${className} flex-shrink-0`}>
        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-sm">
            <defs>
                <linearGradient id="wineGrad" x1="0" y1="100" x2="100" y2="0" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#5d173a" />
                    <stop offset="1" stopColor="#933d76" />
                </linearGradient>
                <linearGradient id="techGrad" x1="100" y1="0" x2="0" y2="100" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#0891b2" />
                    <stop offset="1" stopColor="#22d3ee" />
                </linearGradient>
            </defs>
            
            {/* Wine Swirl (Left/Bottom) */}
            <path 
                d="M50 50C50 77.6142 27.6142 100 0 100V50C0 22.3858 22.3858 0 50 0C65 0 78 10 85 20C75 15 60 15 50 25C35 40 35 60 50 75C60 85 75 85 85 80C78 90 65 100 50 100C50 72.3858 50 50 50 50Z" 
                fill="url(#wineGrad)" 
            />
            
            {/* Tech Network (Right/Top Overlay) */}
            <path 
                d="M50 50C50 22.3858 72.3858 0 100 0V50C100 77.6142 77.6142 100 50 100C35 100 22 90 15 80C25 85 40 85 50 75C65 60 65 40 50 25C40 15 25 15 15 20C22 10 35 0 50 0C50 27.6142 50 50 50 50Z" 
                fill="url(#techGrad)" 
                opacity="0.9"
            />
            
            {/* Nodes */}
            <circle cx="80" cy="20" r="4" fill="white" />
            <circle cx="90" cy="50" r="3" fill="white" />
            <circle cx="70" cy="80" r="3" fill="white" />
            <circle cx="50" cy="50" r="2" fill="white" />
            
            {/* Connection Lines */}
            <path d="M80 20L50 50L70 80L90 50L80 20Z" stroke="white" strokeWidth="1" strokeOpacity="0.5" />
        </svg>
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
