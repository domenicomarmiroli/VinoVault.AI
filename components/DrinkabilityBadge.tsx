
import React from 'react';

interface DrinkabilityBadgeProps {
  drinkWindow?: string; // e.g., "2026-2030"
}

const DrinkabilityBadge: React.FC<DrinkabilityBadgeProps> = ({ drinkWindow }) => {
  if (!drinkWindow) return null;

  const currentYear = new Date().getFullYear();
  const range = drinkWindow.split('-').map(y => parseInt(y.trim()));
  
  if (range.length !== 2 || isNaN(range[0]) || isNaN(range[1])) return null;

  const [start, end] = range;
  let status: 'young' | 'ready' | 'decline' = 'ready';
  let color = 'bg-green-500';
  let label = 'Pronto';

  if (currentYear < start) {
      status = 'young';
      color = 'bg-yellow-400';
      label = 'Giovane';
  } else if (currentYear > end) {
      status = 'decline';
      color = 'bg-red-500';
      label = 'Declino';
  }

  return (
    <div className="flex items-center gap-1.5" title={`Finestra Consumo: ${drinkWindow}`}>
       <span className={`w-2 h-2 rounded-full ${color} animate-pulse shadow-[0_0_8px_rgba(0,0,0,0.2)]`}></span>
       <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wide">{label}</span>
    </div>
  );
};

export default DrinkabilityBadge;
