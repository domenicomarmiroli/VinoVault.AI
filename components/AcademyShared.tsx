import React from 'react';
import { Logo } from './Logo';
import { WineIcon, ChefIcon, RestaurantIcon, ShopIcon, ChartBarIcon, ReportIcon, HistoryIcon, BoxIcon, GlassIcon, ThermometerIcon, ClocheIcon, CalendarCheckIcon, CameraIcon } from './Icons';
import { GuideIcon } from '../constants/academy';

const ICONS: Record<GuideIcon, React.FC<{ className?: string; filled?: boolean }>> = {
  wine: WineIcon, chef: ChefIcon, restaurant: RestaurantIcon, shop: ShopIcon, chart: ChartBarIcon, report: ReportIcon,
  history: HistoryIcon, box: BoxIcon, glass: GlassIcon, thermometer: ThermometerIcon, cloche: ClocheIcon,
  calendar: CalendarCheckIcon, camera: CameraIcon,
};

export const AcademyIcon: React.FC<{ icon: GuideIcon; className?: string }> = ({ icon, className }) => {
  const Icon = ICONS[icon];
  return <Icon className={className} filled />;
};

// Testo con **grassetto** in stile markdown
export const RichText: React.FC<{ text: string }> = ({ text }) => (
  <>
    {text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
      part.startsWith('**') && part.endsWith('**')
        ? <strong key={i} className="font-semibold text-gray-900">{part.slice(2, -2)}</strong>
        : <React.Fragment key={i}>{part}</React.Fragment>
    )}
  </>
);

export const AcademyNav: React.FC<{ onHome: () => void; onStart: () => void; ctaLabel: string; children?: React.ReactNode }> = ({ onHome, onStart, ctaLabel, children }) => (
  <nav className="sticky top-0 z-50 bg-white/85 backdrop-blur-md border-b border-gray-200/70">
    <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex justify-between items-center gap-4">
      <button onClick={onHome} className="transition-transform hover:scale-95 shrink-0" aria-label="AIKNOW.WINE">
        <span className="sm:hidden"><Logo className="w-8 h-8" showText={false} /></span>
        <span className="hidden sm:block"><Logo className="w-8 h-8" /></span>
      </button>
      <div className="flex items-center gap-3 min-w-0">
        {children}
        <button onClick={onStart} className="bg-wine-700 hover:bg-wine-800 text-white px-4 sm:px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wider shadow-lg shadow-wine-900/20 transition-all hover:-translate-y-0.5 whitespace-nowrap">
          {ctaLabel}
        </button>
      </div>
    </div>
  </nav>
);
