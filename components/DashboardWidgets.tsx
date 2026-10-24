import React, { useEffect, useState } from 'react';

export const useCountUp = (target: number, duration = 1200) => {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(target * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return value;
};

export const useMounted = (delay = 50) => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), delay);
    return () => clearTimeout(t);
  }, [delay]);
  return mounted;
};

export const AnimatedNumber: React.FC<{ value: number; prefix?: string; suffix?: string; decimals?: number; duration?: number }> = ({ value, prefix = '', suffix = '', decimals = 0, duration }) => {
  const v = useCountUp(value, duration);
  return <>{prefix}{v.toLocaleString('it-IT', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}{suffix}</>;
};

export const StatTile: React.FC<{ label: string; value: number; prefix?: string; suffix?: string; decimals?: number; accent: string; delay: number; hint?: string }> = ({ label, value, prefix, suffix, decimals, accent, delay, hint }) => (
  <div
    className="relative overflow-hidden bg-white rounded-2xl border border-gray-100 shadow-sm p-4 animate-in fade-in slide-in-from-bottom-4 duration-700 hover:shadow-md hover:-translate-y-0.5 transition-all"
    style={{ animationDelay: `${delay}ms` }}
  >
    <div className={`absolute -right-6 -top-6 w-20 h-20 rounded-full opacity-15 ${accent}`} />
    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{label}</p>
    <p className="text-2xl md:text-3xl font-black text-gray-900 mt-1 tabular-nums">
      <AnimatedNumber value={value} prefix={prefix} suffix={suffix} decimals={decimals} />
    </p>
    {hint && <p className="text-[11px] text-gray-400 mt-0.5">{hint}</p>}
  </div>
);

export const Card: React.FC<{ title: string; subtitle?: string; delay?: number; className?: string; children: React.ReactNode; right?: React.ReactNode }> = ({ title, subtitle, delay = 0, className = '', children, right }) => (
  <div className={`bg-white rounded-3xl border border-gray-100 shadow-sm p-5 animate-in fade-in slide-in-from-bottom-4 duration-700 ${className}`} style={{ animationDelay: `${delay}ms` }}>
    <div className="flex justify-between items-start mb-4 gap-3">
      <div>
        <h3 className="font-serif font-bold text-lg text-gray-900">{title}</h3>
        {subtitle && <p className="text-xs text-gray-400">{subtitle}</p>}
      </div>
      {right}
    </div>
    {children}
  </div>
);

export const WINE_CATEGORY_COLORS: Record<string, string> = { red: '#991b1b', white: '#E8DCB0', rose: '#f472b6', sparkling: '#f59e0b', dessert: '#fb923c', other: '#cbd5e1' };
export const WINE_CATEGORY_LABELS: Record<string, string> = { red: 'Rossi', white: 'Bianchi', rose: 'Rosati', sparkling: 'Bollicine', dessert: 'Dolci', other: 'Altro' };

export const Donut: React.FC<{ data: Record<string, number>; mounted: boolean; size?: string }> = ({ data, mounted, size = 'w-28 h-28' }) => {
  const total = Object.values(data).reduce((a, b) => a + b, 0) || 1;
  let offset = 0;
  return (
    <div className="flex items-center gap-5">
      <svg viewBox="0 0 42 42" className={`${size} -rotate-90 shrink-0`}>
        <circle cx="21" cy="21" r="15.9" fill="none" stroke="#f1f5f9" strokeWidth="6" />
        {Object.entries(data).filter(([, c]) => c > 0).map(([k, c]) => {
          const pct = (c / total) * 100;
          const el = (
            <circle key={k} cx="21" cy="21" r="15.9" fill="none" stroke={WINE_CATEGORY_COLORS[k]} strokeWidth="6"
              strokeDasharray={`${mounted ? pct : 0} ${100 - (mounted ? pct : 0)}`} strokeDashoffset={-offset}
              style={{ transition: 'stroke-dasharray 1.2s ease-out' }} />
          );
          offset += pct;
          return el;
        })}
      </svg>
      <div className="space-y-1.5 text-sm">
        {Object.entries(data).filter(([, c]) => c > 0).map(([k, c]) => (
          <div key={k} className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full border border-black/5" style={{ background: WINE_CATEGORY_COLORS[k] }} />
            <span className="text-gray-600">{WINE_CATEGORY_LABELS[k]}</span>
            <span className="font-bold text-gray-900">{Math.round((c / total) * 100)}%</span>
          </div>
        ))}
        {Object.values(data).every(v => v === 0) && <p className="text-xs text-gray-400">Nessun dato.</p>}
      </div>
    </div>
  );
};
