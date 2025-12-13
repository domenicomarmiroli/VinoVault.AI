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
        <img 
          src="/logo.png?v=final" 
          alt="AIKNOW.WINE Logo" 
          className="w-full h-full object-contain drop-shadow-md"
        />
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