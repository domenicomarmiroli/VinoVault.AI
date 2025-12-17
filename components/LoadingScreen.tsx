
import React from 'react';
import { Logo } from './Logo';

interface LoadingScreenProps {
  message?: string;
  subMessage?: string;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ message, subMessage }) => {
  return (
    <div className="fixed inset-0 z-[200] bg-white/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-500">
      <div className="relative mb-10">
        {/* Pulsing glow behind */}
        <div className="absolute inset-0 bg-gradient-to-tr from-wine-300 to-cyan-300 rounded-full blur-3xl opacity-30 animate-pulse"></div>
        
        {/* Animated Logo Container */}
        <div className="relative animate-[bounce_3s_infinite]">
            <Logo className="w-28 h-28" showText={false} />
        </div>
      </div>
      
      <h3 className="text-2xl font-serif font-bold text-gray-900 mb-3 animate-pulse tracking-tight">
        {message || "Analisi in corso..."}
      </h3>
      
      <p className="text-gray-500 text-sm max-w-xs mx-auto leading-relaxed">
        {subMessage || "L'Intelligenza Artificiale sta cercando l'abbinamento perfetto per te."}
      </p>
      
      {/* Abstract Progress indicators */}
      <div className="flex gap-3 mt-10 justify-center items-center">
        <div className="w-2 h-2 bg-wine-800 rounded-full animate-[ping_1.5s_cubic-bezier(0,0,0.2,1)_infinite]"></div>
        <div className="w-2 h-2 bg-wine-500 rounded-full animate-[ping_1.5s_cubic-bezier(0,0,0.2,1)_infinite] [animation-delay:0.2s]"></div>
        <div className="w-2 h-2 bg-cyan-500 rounded-full animate-[ping_1.5s_cubic-bezier(0,0,0.2,1)_infinite] [animation-delay:0.4s]"></div>
      </div>
    </div>
  );
};

export default LoadingScreen;
