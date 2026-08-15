
import React from 'react';
import { GrapeIcon, GlassIcon, PercentBottleIcon, BarrelIcon, BottlesIcon, CalendarCheckIcon, ClocheIcon, IceBucketIcon, MapPinIcon } from './Icons';

interface WineFactsGridProps {
  grape?: string;
  type?: string;
  alcohol?: string;
  year?: string;
  region?: string;
  format?: string;
  drinkWindow?: string;
  foodPairings?: string[];
  serving?: string;
}

const Fact: React.FC<{ icon: React.ReactNode; label: string; value: string }> = ({ icon, label, value }) => (
  <div className="flex items-start gap-3">
    <div className="w-9 h-9 rounded-full bg-wine-50 flex items-center justify-center shrink-0 text-wine-700">
      {icon}
    </div>
    <div className="min-w-0">
      <p className="text-sm font-bold text-gray-900 leading-tight">{label}</p>
      <p className="text-sm text-gray-500 leading-snug">{value}</p>
    </div>
  </div>
);

const WineFactsGrid: React.FC<WineFactsGridProps> = ({ grape, type, alcohol, year, region, format, drinkWindow, foodPairings, serving }) => {
  const facts: { icon: React.ReactNode; label: string; value: string }[] = [];

  if (grape) facts.push({ icon: <GrapeIcon className="w-4.5 h-4.5" />, label: 'Vitigno', value: grape });
  if (type) facts.push({ icon: <GlassIcon className="w-4.5 h-4.5" />, label: 'Colore', value: type });
  if (alcohol) facts.push({ icon: <PercentBottleIcon className="w-4.5 h-4.5" />, label: 'Gradazione', value: alcohol });
  if (year) facts.push({ icon: <BarrelIcon className="w-4.5 h-4.5" />, label: 'Annata', value: year });
  if (region) facts.push({ icon: <MapPinIcon className="w-4.5 h-4.5" />, label: 'Regione', value: region });
  facts.push({ icon: <BottlesIcon className="w-4.5 h-4.5" />, label: 'Formato', value: format || 'Bottiglia 750 ml' });
  if (drinkWindow) facts.push({ icon: <CalendarCheckIcon className="w-4.5 h-4.5" />, label: 'Consumo ideale', value: drinkWindow });
  if (foodPairings && foodPairings.length > 0) facts.push({ icon: <ClocheIcon className="w-4.5 h-4.5" />, label: 'Abbinamento', value: foodPairings.slice(0, 3).join(', ') });
  if (serving) facts.push({ icon: <IceBucketIcon className="w-4.5 h-4.5" />, label: 'Servizio', value: serving });

  if (facts.length === 0) return null;

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
        {facts.map((f, i) => (
          <Fact key={i} icon={f.icon} label={f.label} value={f.value} />
        ))}
      </div>
    </div>
  );
};

export default WineFactsGrid;
