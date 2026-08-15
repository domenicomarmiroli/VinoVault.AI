
import React from 'react';
import { WineStyle } from '../types';

interface WineStyleChartProps {
  style?: WineStyle | null;
}

const DOT_COLORS = ['#f3d9e4', '#e8b4c8', '#d47fa3', '#b8447a', '#7a1237'];

const TraitRow: React.FC<{ label: string; value?: number }> = ({ label, value }) => {
  if (value === undefined || value === null) return null;
  const v = Math.max(0, Math.min(5, Math.round(value)));
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-sm text-gray-600">{label}</span>
      <div className="flex items-center gap-1.5">
        {[1, 2, 3, 4, 5].map(i => (
          <span
            key={i}
            className="w-2.5 h-2.5 rounded-full shrink-0"
            style={{ backgroundColor: i <= v ? DOT_COLORS[i - 1] : '#e5e7eb' }}
          />
        ))}
      </div>
    </div>
  );
};

const WineStyleChart: React.FC<WineStyleChartProps> = ({ style }) => {
  if (!style) return null;

  const hasTraits = [style.sweetness, style.body, style.acidity, style.tannin, style.wood, style.persistence]
    .some(v => v !== undefined && v !== null);
  const hasAromas = !!(style.aromas && style.aromas.length > 0);
  const hasFreshRich = style.freshRich !== undefined && style.freshRich !== null;

  if (!hasTraits && !hasFreshRich && !hasAromas) return null;

  const freshRichPos = Math.max(1, Math.min(6, Math.round(style.freshRich || 3)));

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-5">
      <h3 className="text-base font-serif font-bold text-gray-900">Stile Del Vino</h3>

      {hasFreshRich && (
        <div className="space-y-2">
          <div className="flex items-center justify-center gap-2.5">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Fresco</span>
            <span className="text-gray-300 text-xs">◄</span>
            {[1, 2, 3, 4, 5, 6].map(i => (
              <span
                key={i}
                className={`rounded-full shrink-0 transition-all ${i === freshRichPos ? 'w-3.5 h-3.5 bg-wine-800' : 'w-2 h-2 bg-gray-200'}`}
              />
            ))}
            <span className="text-gray-300 text-xs">►</span>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Ricco</span>
          </div>
        </div>
      )}

      {hasTraits && (
        <div className="divide-y divide-gray-50">
          <TraitRow label="Dolcezza" value={style.sweetness} />
          <TraitRow label="Corpo" value={style.body} />
          <TraitRow label="Acidità" value={style.acidity} />
          <TraitRow label="Tannino" value={style.tannin} />
          <TraitRow label="Legno" value={style.wood} />
          <TraitRow label="Persistenza" value={style.persistence} />
        </div>
      )}

      {hasAromas && (
        <div className="space-y-2 pt-1 border-t border-gray-50">
          <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest pt-3">Aromi Principali</h4>
          <p className="text-sm text-gray-600 leading-relaxed">{style.aromas!.join(' · ')}</p>
        </div>
      )}
    </div>
  );
};

export default WineStyleChart;
