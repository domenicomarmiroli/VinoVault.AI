
import React, { Suspense, useEffect, useRef, useState } from 'react';
import { Logo } from './Logo';
import { WineIcon, ChefIcon, ShopIcon, ChartBarIcon, RestaurantIcon, HistoryIcon, CameraIcon } from './Icons';
import { useLanguage } from '../contexts/LanguageContext';
import { GUIDES, getGuideContent, readingMinutes, academyUi } from '../constants/academy';
import { AcademyIcon } from './AcademyShared';
import { Language, LocationLayout, Wine } from '../types';

const Cellar3D = React.lazy(() => import('./Cellar3D'));

interface LandingPageProps {
  onStart: () => void;
  onOpenGuide?: (slug: string) => void;
  onViewAllGuides?: () => void;
  onOpenBusiness?: () => void;
}

// Rivela il contenuto quando entra nello schermo (una sola volta).
const useInView = <T extends HTMLElement>(rootMargin = '0px 0px -10% 0px') => {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || inView) return;
    if (!('IntersectionObserver' in window)) { setInView(true); return; }
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setInView(true); io.disconnect(); }
    }, { rootMargin });
    io.observe(el);
    return () => io.disconnect();
  }, [inView, rootMargin]);
  return { ref, inView };
};

const Reveal: React.FC<{ delay?: number; className?: string; children: React.ReactNode }> = ({ delay = 0, className = '', children }) => {
  const { ref, inView } = useInView<HTMLDivElement>();
  return (
    <div ref={ref} className={`lp-reveal ${inView ? 'is-visible' : ''} ${className}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
};

// Dati dimostrativi per la demo 3D (non sono dati dell'utente).
const demoWine = (id: string, type: string, quantity: number, cellarSlots: Wine['cellarSlots']): Wine =>
  ({ id, name: id, producer: '', year: '', type, quantity, cellarSlots } as unknown as Wine);

const DEMO_RACK: LocationLayout = { columns: [{ shelves: 6, bottlesPerShelf: 5 }, { shelves: 4, bottlesPerShelf: 5 }, { shelves: 6, bottlesPerShelf: 5 }] };
const DEMO_FRIDGE: LocationLayout = { columns: [{ shelves: 6, bottlesPerShelf: 6 }] };
const fill = (column: number, shelves: number[], per: number, skip: number[] = []) =>
  shelves.flatMap(shelf => Array.from({ length: per }, (_, position) => ({ column, shelf, position }))).filter((_, i) => !skip.includes(i));
const DEMO_RACK_WINES: Wine[] = [
  demoWine('r1', 'Rosso', 30, [...fill(0, [0, 1, 2], 5, [7, 13]), ...fill(2, [0, 1], 5, [4])]),
  demoWine('r2', 'Bianco', 20, [...fill(0, [4, 5], 5, [3]), ...fill(1, [0, 1], 5, [2, 8])]),
  demoWine('r3', 'Spumante/Champagne', 12, [...fill(1, [3], 5), ...fill(2, [4, 5], 5, [1, 6, 9])]),
  demoWine('r4', 'Rosato', 6, fill(2, [3], 5, [2])),
];
const DEMO_FRIDGE_WINES: Wine[] = [
  demoWine('f1', 'Rosso', 20, fill(0, [0, 1, 2], 6, [4, 11])),
  demoWine('f2', 'Bianco', 12, fill(0, [3, 4], 6, [5])),
  demoWine('f3', 'Spumante/Champagne', 6, fill(0, [5], 6, [0, 3])),
];

const Cellar3DDemo: React.FC = () => {
  const { t } = useLanguage();
  const { ref, inView } = useInView<HTMLDivElement>('200px 0px');
  const [kind, setKind] = useState<'rack' | 'fridge'>('rack');
  return (
    <div ref={ref} className="relative aspect-[4/3] w-full rounded-[2rem] overflow-hidden shadow-2xl border border-white/10 bg-[radial-gradient(ellipse_at_top,_#57534e_0%,_#292524_45%,_#0c0a09_100%)]">
      {inView ? (
        <Suspense fallback={<DemoLoader label={t('lp_3d_loading')} />}>
          <Cellar3D
            key={kind}
            kind={kind}
            layout={kind === 'rack' ? DEMO_RACK : DEMO_FRIDGE}
            wines={kind === 'rack' ? DEMO_RACK_WINES : DEMO_FRIDGE_WINES}
            interaction="preview"
            autoRotate
            className="absolute inset-0"
          />
        </Suspense>
      ) : <DemoLoader label={t('lp_3d_loading')} />}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 flex p-1 rounded-full bg-black/40 backdrop-blur border border-white/10">
        {(['rack', 'fridge'] as const).map(k => (
          <button key={k} onClick={() => setKind(k)} className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-bold transition-all ${kind === k ? 'bg-white text-gray-900 shadow' : 'text-white/70 hover:text-white'}`}>
            {k === 'rack' ? `🪵 ${t('lp_3d_rack')}` : `🧊 ${t('lp_3d_fridge')}`}
          </button>
        ))}
      </div>
      <p className="absolute bottom-3 left-1/2 -translate-x-1/2 text-[10px] text-white/50 whitespace-nowrap pointer-events-none">{t('lp_3d_hint')}</p>
    </div>
  );
};

const DemoLoader: React.FC<{ label: string }> = ({ label }) => (
  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-white/60">
    <div className="w-10 h-10 rounded-full border-4 border-white/20 border-t-white animate-spin" />
    <p className="text-xs">{label}</p>
  </div>
);

// Illustrazione dell'hero: bottiglia con scansione e schede che fluttuano.
const HeroVisual: React.FC = () => {
  const { t } = useLanguage();
  const year = new Date().getFullYear() + 4;
  return (
    <div className="relative mx-auto w-full max-w-md aspect-[4/5]">
      <div className="absolute -inset-6 bg-gradient-to-tr from-wine-200 via-fuchsia-100 to-cyan-100 rounded-[3rem] blur-3xl opacity-70" />
      <div className="relative h-full rounded-[2.5rem] bg-gradient-to-br from-gray-900 via-wine-950 to-wine-800 shadow-2xl border border-white/10 overflow-hidden">
        <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-fuchsia-500/20 blur-3xl lp-blob" />
        <div className="absolute -left-20 bottom-0 w-72 h-72 rounded-full bg-cyan-400/15 blur-3xl lp-blob" style={{ animationDelay: '-6s' }} />
        {/* bottiglia */}
        <svg viewBox="0 0 120 300" className="absolute left-1/2 top-[8%] -translate-x-1/2 h-[78%] drop-shadow-2xl">
          <defs>
            <linearGradient id="lpGlass" x1="0" x2="1">
              <stop offset="0" stopColor="#1a0509" /><stop offset=".35" stopColor="#4a0f1d" /><stop offset=".55" stopColor="#6b1a2c" /><stop offset="1" stopColor="#1a0509" />
            </linearGradient>
            <linearGradient id="lpFoil" x1="0" x2="1"><stop offset="0" stopColor="#7f1d1d" /><stop offset=".5" stopColor="#b91c1c" /><stop offset="1" stopColor="#7f1d1d" /></linearGradient>
          </defs>
          <path d="M48 6h24v62c0 12 22 22 22 52v166a8 8 0 0 1-8 8H34a8 8 0 0 1-8-8V120c0-30 22-40 22-52z" fill="url(#lpGlass)" />
          <path d="M48 6h24v40H48z" fill="url(#lpFoil)" />
          <rect x="30" y="160" width="60" height="78" rx="3" fill="#f5f0e6" />
          <text x="60" y="186" textAnchor="middle" fontFamily="Playfair Display, serif" fontStyle="italic" fontWeight="700" fontSize="13" fill="#4e1633">Barolo</text>
          <line x1="40" x2="80" y1="196" y2="196" stroke="#933d76" strokeWidth="1" />
          <text x="60" y="212" textAnchor="middle" fontFamily="Inter, sans-serif" fontSize="8" letterSpacing="2" fill="#6b5560">DOCG</text>
          <text x="60" y="228" textAnchor="middle" fontFamily="Inter, sans-serif" fontWeight="700" fontSize="9" fill="#4e1633">2019</text>
          <path d="M76 70c6 6 12 16 12 40v150" stroke="white" strokeOpacity=".18" strokeWidth="4" fill="none" strokeLinecap="round" />
        </svg>
        {/* riquadro di scansione */}
        <div className="absolute left-[22%] right-[22%] top-[44%] h-[34%] rounded-2xl border-2 border-cyan-300/70 overflow-hidden">
          <div className="absolute inset-x-0 h-0.5 bg-cyan-300 shadow-[0_0_16px_4px_rgba(103,232,249,.7)] lp-scan" />
        </div>
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur text-white text-[11px] font-bold border border-white/10">
          <CameraIcon className="w-3.5 h-3.5" /> {t('lp_hero_scan')}
        </div>
      </div>
      {/* schede fluttuanti */}
      <div className="absolute -left-6 top-[14%] lp-float" style={{ ['--lp-rot' as any]: '-4deg' }}>
        <div className="bg-white rounded-2xl shadow-xl px-4 py-3 flex items-center gap-3 border border-gray-100">
          <div className="w-11 h-11 rounded-full border-4 border-emerald-500 flex items-center justify-center text-sm font-black text-emerald-700">92</div>
          <div><p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{t('lp_hero_card1')}</p><p className="text-sm font-bold text-gray-900">92/100</p></div>
        </div>
      </div>
      <div className="absolute -right-8 top-[42%] lp-float" style={{ animationDelay: '-2s', ['--lp-rot' as any]: '3deg' }}>
        <div className="bg-white rounded-2xl shadow-xl px-4 py-3 border border-gray-100 max-w-[190px]">
          <p className="text-[10px] font-black uppercase tracking-widest text-amber-600">🍽️ {t('lp_hero_card2')}</p>
          <p className="text-sm font-bold text-gray-900 leading-tight mt-0.5">{t('lp_hero_card2_v')}</p>
        </div>
      </div>
      <div className="absolute -left-4 bottom-[12%] lp-float" style={{ animationDelay: '-4s', ['--lp-rot' as any]: '-2deg' }}>
        <div className="bg-white rounded-2xl shadow-xl px-4 py-3 border border-gray-100">
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{t('lp_hero_card3')}</p>
          <p className="text-sm font-bold text-gray-900 flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500" /> {year}</p>
        </div>
      </div>
    </div>
  );
};

const FaqItem: React.FC<{ q: string; a: string; defaultOpen?: boolean }> = ({ q, a, defaultOpen }) => {
  const [open, setOpen] = useState(!!defaultOpen);
  return (
    <div className="border-b border-gray-100">
      <button onClick={() => setOpen(o => !o)} className="w-full flex justify-between items-center gap-4 py-6 text-left group" aria-expanded={open}>
        <span className="font-bold text-lg text-gray-900 group-hover:text-wine-700 transition-colors">{q}</span>
        <span className={`shrink-0 w-8 h-8 rounded-full bg-wine-50 text-wine-700 flex items-center justify-center text-xl transition-transform duration-300 ${open ? 'rotate-45' : ''}`}>+</span>
      </button>
      <div className={`grid transition-all duration-500 ease-out ${open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
        <div className="overflow-hidden"><p className="text-gray-500 leading-relaxed pb-6">{a}</p></div>
      </div>
    </div>
  );
};

const LandingPage: React.FC<LandingPageProps> = ({ onStart, onOpenGuide, onViewAllGuides, onOpenBusiness }) => {
  const { t, language, setLanguage } = useLanguage();
  const steps = useInView<HTMLDivElement>();

  const academy = academyUi(language);
  const guideItems = GUIDES.map(g => ({ guide: g, content: getGuideContent(g, language) }));


  const features = [
    { icon: <WineIcon className="w-8 h-8 text-white" />, title: t('lp_f1_t'), desc: t('lp_f1_d'), color: 'from-wine-600 to-wine-800' },
    { icon: <ChefIcon className="w-8 h-8 text-white" />, title: t('lp_f2_t'), desc: t('lp_f2_d'), color: 'from-amber-500 to-orange-600' },
    { icon: <ShopIcon className="w-8 h-8 text-white" />, title: t('lp_f3_t'), desc: t('lp_f3_d'), color: 'from-emerald-500 to-emerald-700' },
    { icon: <RestaurantIcon className="w-8 h-8 text-white" />, title: t('lp_f5_t'), desc: t('lp_f5_d'), color: 'from-teal-500 to-cyan-700' },
    { icon: <HistoryIcon className="w-8 h-8 text-white" />, title: t('lp_f6_t'), desc: t('lp_f6_d'), color: 'from-stone-600 to-stone-800' },
    { icon: <ChartBarIcon className="w-8 h-8 text-white" />, title: t('lp_f4_t'), desc: t('lp_f4_d'), color: 'from-indigo-500 to-purple-700' },
  ];

  return (
    <div className="h-full overflow-y-auto overflow-x-hidden bg-white flex flex-col font-sans scroll-smooth">
      {/* Banner Business */}
      <div
        onClick={onOpenBusiness}
        className="bg-emerald-600 text-white text-center py-2 px-4 text-xs md:text-sm font-bold cursor-pointer hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
      >
        <RestaurantIcon className="w-4 h-4" filled />
        {t('lp_b2b_banner')} <span className="underline ml-1">→</span>
      </div>

      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="flex justify-between items-center p-4 md:px-6 max-w-7xl mx-auto w-full">
            <div className="cursor-pointer shrink-0" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                <div className="sm:hidden"><Logo className="w-10 h-10" showText={false} /></div>
                <div className="hidden sm:block"><Logo className="w-10 h-10" /></div>
            </div>

            <div className="hidden lg:flex items-center gap-8 text-sm font-bold text-gray-500 uppercase tracking-widest">
                <button onClick={onOpenBusiness} className="hover:text-emerald-600 transition-colors flex items-center gap-1 font-black uppercase tracking-widest">Business</button>
                <a href="#how-it-works" className="hover:text-wine-700 transition-colors">{t('lp_how_it_works')}</a>
                <a href="#cellar-3d" className="hover:text-wine-700 transition-colors">3D</a>
                <a href="#features" className="hover:text-wine-700 transition-colors">{t('lp_features')}</a>
                <a href="#academy" className="hover:text-wine-700 transition-colors">{t('lp_academy')}</a>
            </div>

            <div className="flex items-center gap-3">
                <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value as Language)}
                    className="bg-gray-50 border border-gray-200 rounded-lg text-[10px] font-bold uppercase tracking-tight p-1.5 focus:ring-1 focus:ring-wine-500 outline-none"
                    aria-label="Language"
                >
                    <option value="it">IT</option>
                    <option value="en">EN</option>
                    <option value="fr">FR</option>
                    <option value="es">ES</option>
                    <option value="de">DE</option>
                </select>
                <button
                  onClick={onStart}
                  className="bg-wine-700 text-white font-bold px-5 py-2 rounded-xl hover:bg-wine-800 transition-all text-xs shadow-lg shadow-wine-100"
                >
                  {t('lp_access')}
                </button>
            </div>
        </div>
      </nav>

      <main className="flex-1 flex flex-col">
        {/* Hero */}
        <section className="relative">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-32 -left-32 w-[28rem] h-[28rem] rounded-full bg-wine-100/70 blur-3xl lp-blob" />
            <div className="absolute top-40 -right-40 w-[30rem] h-[30rem] rounded-full bg-cyan-100/60 blur-3xl lp-blob" style={{ animationDelay: '-9s' }} />
          </div>
          <div className="relative px-6 py-16 md:py-28 max-w-7xl mx-auto w-full grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 inline-flex items-center gap-2 bg-wine-50 text-wine-700 text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-widest border border-wine-100">
                <span className="w-2 h-2 rounded-full bg-wine-500 animate-pulse" /> {t('lp_hero_tag')}
              </div>
              <h1 className="animate-in fade-in slide-in-from-bottom-4 duration-700 text-5xl md:text-7xl font-serif font-black text-gray-900 leading-[1.05]" style={{ animationDelay: '100ms' }}>
                {t('lp_hero_title')} <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-wine-700 via-fuchsia-500 to-wine-700 lp-shine">
                  {t('lp_hero_title_span')}
                </span>
              </h1>
              <p className="animate-in fade-in slide-in-from-bottom-4 duration-700 text-xl text-gray-500 leading-relaxed max-w-xl" style={{ animationDelay: '200ms' }}>
                {t('lp_hero_desc')}
              </p>
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 flex flex-col sm:flex-row gap-4 pt-2" style={{ animationDelay: '300ms' }}>
                <button
                  onClick={onStart}
                  className="group relative overflow-hidden px-10 py-5 bg-wine-700 text-white font-bold rounded-2xl shadow-xl shadow-wine-200 hover:bg-wine-800 transition-all hover:scale-[1.03] active:scale-95 text-lg text-center"
                >
                  <span className="relative z-10">{t('lp_start_free')} →</span>
                  <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/25 to-transparent" />
                </button>
                <a href="#how-it-works" className="px-10 py-5 bg-white/80 text-gray-700 border border-gray-200 font-bold rounded-2xl hover:bg-gray-50 transition-colors text-lg text-center">
                  {t('lp_discover_more')}
                </a>
              </div>
            </div>
            <div className="animate-in fade-in zoom-in-95 duration-700 px-6 lg:px-0" style={{ animationDelay: '250ms' }}>
              <HeroVisual />
            </div>
          </div>
        </section>

        {/* Come funziona */}
        <section id="how-it-works" className="bg-stone-50 py-24 px-6 border-y border-gray-100">
          <div className="max-w-6xl mx-auto">
            <Reveal className="text-center max-w-3xl mx-auto">
              <h2 className="text-3xl md:text-5xl font-serif font-bold text-gray-900 mb-6">{t('lp_what_is_title')}</h2>
              <p className="text-lg text-gray-600 leading-relaxed">{t('lp_what_is_desc')}</p>
            </Reveal>

            <div ref={steps.ref} className={`relative grid md:grid-cols-3 gap-10 mt-16 ${steps.inView ? 'is-visible' : ''}`}>
              <div className="hidden md:block absolute top-8 left-[16%] right-[16%] h-0.5 bg-gradient-to-r from-wine-300 via-fuchsia-300 to-cyan-300 lp-line" />
              {[
                { n: 1, t: t('lp_step1_t'), d: t('lp_step1_d'), icon: '📸' },
                { n: 2, t: t('lp_step2_t'), d: t('lp_step2_d'), icon: '✨' },
                { n: 3, t: t('lp_step3_t'), d: t('lp_step3_d'), icon: '🍷' },
              ].map((s, i) => (
                <div key={s.n} className={`lp-reveal ${steps.inView ? 'is-visible' : ''} relative text-center`} style={{ transitionDelay: `${200 + i * 200}ms` }}>
                  <div className="relative z-10 mx-auto w-16 h-16 rounded-2xl bg-white shadow-lg border border-gray-100 flex items-center justify-center text-3xl">{s.icon}</div>
                  <p className="mt-5 text-[10px] font-black uppercase tracking-[0.25em] text-wine-600">{t('lp_steps_title')} · {s.n}</p>
                  <h3 className="text-2xl font-serif font-bold text-gray-900 mt-1">{s.t}</h3>
                  <p className="text-gray-500 mt-2 leading-relaxed max-w-xs mx-auto">{s.d}</p>
                </div>
              ))}
            </div>

            <div className="grid md:grid-cols-2 gap-8 pt-20">
              <Reveal className="p-8 rounded-3xl bg-white border border-gray-100 shadow-sm">
                <h3 className="text-2xl font-serif font-bold text-wine-800 mb-3">{t('lp_for_enthusiast')}</h3>
                <p className="text-gray-500 leading-relaxed">{t('lp_enthusiast_desc')}</p>
              </Reveal>
              <Reveal delay={150} className="p-8 rounded-3xl bg-white border border-gray-100 shadow-sm">
                <h3 className="text-2xl font-serif font-bold text-cyan-700 mb-3">{t('lp_for_investor')}</h3>
                <p className="text-gray-500 leading-relaxed">{t('lp_investor_desc')}</p>
              </Reveal>
            </div>
          </div>
        </section>

        {/* Cantina 3D */}
        <section id="cellar-3d" className="relative bg-stone-950 text-white py-24 px-6 overflow-hidden">
          <div className="absolute -top-40 left-1/3 w-[36rem] h-[36rem] rounded-full bg-wine-700/30 blur-3xl lp-blob pointer-events-none" />
          <div className="absolute -bottom-40 -right-20 w-[30rem] h-[30rem] rounded-full bg-cyan-500/10 blur-3xl lp-blob pointer-events-none" style={{ animationDelay: '-7s' }} />
          <div className="relative max-w-7xl mx-auto grid lg:grid-cols-5 gap-12 items-center">
            <Reveal className="lg:col-span-2 space-y-6">
              <span className="inline-block text-[10px] font-black uppercase tracking-[0.25em] px-3 py-1 rounded-full bg-cyan-400/15 text-cyan-300 border border-cyan-400/20">{t('lp_3d_tag')}</span>
              <h2 className="text-4xl md:text-5xl font-serif font-bold leading-tight">{t('lp_3d_title')}</h2>
              <p className="text-lg text-white/70 leading-relaxed">{t('lp_3d_desc')}</p>
              <ul className="space-y-3">
                {[t('lp_3d_b1'), t('lp_3d_b2'), t('lp_3d_b3'), t('lp_3d_b4')].map((b, i) => (
                  <li key={i} className="flex gap-3 text-white/85">
                    <span className="shrink-0 mt-0.5 w-5 h-5 rounded-full bg-emerald-400/20 text-emerald-300 flex items-center justify-center text-xs font-black">✓</span>
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
              <button onClick={onStart} className="px-8 py-4 rounded-2xl bg-white text-gray-900 font-bold hover:scale-[1.03] active:scale-95 transition-transform shadow-xl">{t('lp_start_free')} →</button>
            </Reveal>
            <Reveal delay={150} className="lg:col-span-3">
              <Cellar3DDemo />
            </Reveal>
          </div>
        </section>

        {/* Funzionalità */}
        <section id="features" className="bg-white py-24">
          <div className="max-w-7xl mx-auto px-6">
            <Reveal className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-serif font-bold text-gray-900 mb-4">{t('lp_features_title')}</h2>
              <p className="text-gray-500 max-w-2xl mx-auto text-lg">{t('lp_features_desc')}</p>
            </Reveal>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((f, i) => (
                <Reveal key={i} delay={(i % 3) * 120}>
                  <FeatureCard {...f} />
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* Academy */}
        <section id="academy" className="bg-stone-50 py-24 border-y border-gray-200 overflow-hidden">
           <div className="max-w-7xl mx-auto px-6">
              <Reveal className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
                 <div>
                    <h2 className="text-4xl font-serif font-bold text-gray-900 mb-2">{t('lp_academy_title')}</h2>
                    <p className="text-gray-500 text-lg">{t('lp_academy_desc')}</p>
                 </div>
                 <button onClick={onViewAllGuides} className="text-wine-700 font-bold text-sm uppercase tracking-widest hover:bg-wine-100 px-4 py-2 rounded-lg transition-all flex items-center gap-2 border border-wine-100">
                    {t('lp_academy_all')} <span className="text-xl">→</span>
                 </button>
              </Reveal>

              <div className="relative -mx-6 px-6">
                  <div className="flex gap-6 overflow-x-auto pb-12 no-scrollbar snap-x snap-mandatory">
                     {guideItems.map(({ guide, content }) => (
                        <div
                           key={guide.slug}
                           onClick={() => onOpenGuide?.(guide.slug)}
                           className="flex-shrink-0 w-[280px] md:w-[330px] snap-start bg-white rounded-[2rem] overflow-hidden shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 cursor-pointer group flex flex-col border border-gray-100"
                        >
                           <div className={`h-40 bg-gradient-to-br ${guide.gradient} flex items-center justify-center relative overflow-hidden shrink-0`}>
                               <div className="bg-white/10 backdrop-blur-md p-5 rounded-[1.5rem] border border-white/20 relative z-10 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500">
                                   <AcademyIcon icon={guide.icon} className="w-10 h-10 text-white" />
                               </div>
                               <div className="absolute -right-8 -bottom-8 opacity-10 group-hover:scale-125 transition-transform duration-700">
                                  <AcademyIcon icon={guide.icon} className="w-40 h-40 text-white" />
                               </div>
                           </div>
                           <div className="p-7 flex-1 flex flex-col">
                               <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3 block">{guide.category === 'learn' ? academy.learn : academy.app} · {readingMinutes(content)} {academy.min}</span>
                               <h3 className="text-xl font-serif font-bold text-gray-900 mb-3 group-hover:text-wine-700 transition-colors leading-tight">{content.title}</h3>
                               <p className="text-gray-500 text-sm leading-relaxed mb-6">{content.excerpt}</p>
                               <div className="mt-auto pt-5 border-t border-gray-50 flex items-center text-wine-700 font-bold text-xs uppercase tracking-wider">
                                   {t('lp_read_guide')} <span className="ml-3 transition-transform group-hover:translate-x-2">→</span>
                               </div>
                           </div>
                        </div>
                     ))}
                  </div>
              </div>
           </div>
        </section>

        {/* FAQ */}
        <section className="bg-white py-24 px-6">
           <div className="max-w-3xl mx-auto">
              <Reveal><h2 className="text-3xl md:text-4xl font-serif font-bold text-gray-900 mb-8 text-center">{t('lp_faq_title')}</h2></Reveal>
              <Reveal delay={100}>
                <FaqItem q={t('lp_faq_q1')} a={t('lp_faq_a1')} defaultOpen />
                <FaqItem q={t('lp_faq_q2')} a={t('lp_faq_a2')} />
                <FaqItem q={t('lp_faq_q3')} a={t('lp_faq_a3')} />
              </Reveal>
           </div>
        </section>

        {/* CTA finale */}
        <section className="relative bg-gradient-to-br from-wine-950 via-wine-900 to-wine-700 py-32 px-6 text-white text-center overflow-hidden">
            <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-fuchsia-500/20 blur-3xl lp-blob" />
            <div className="absolute -bottom-32 -right-24 w-[28rem] h-[28rem] rounded-full bg-cyan-400/15 blur-3xl lp-blob" style={{ animationDelay: '-8s' }} />
            <Reveal className="max-w-4xl mx-auto relative z-10 space-y-10">
                <Logo className="w-20 h-20 mx-auto lp-float" light showText={false} />
                <h2 className="text-4xl md:text-6xl font-serif font-bold leading-tight">{t('lp_final_cta')}</h2>
                <button onClick={onStart} className="px-12 py-6 bg-white text-wine-900 font-black rounded-[2rem] shadow-2xl hover:bg-stone-100 transition-all hover:scale-105 active:scale-95 text-xl">
                    {t('lp_enter_app')}
                </button>
            </Reveal>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-950 text-gray-400 py-20 px-6 border-t border-white/5">
        <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-12 mb-16">
          <div className="col-span-2 space-y-6">
            <Logo light className="w-12 h-12" />
            <p className="max-w-sm text-sm leading-relaxed">{t('lp_footer_desc')}</p>
          </div>
          <div className="space-y-4">
            <h5 className="text-white font-bold text-sm uppercase tracking-widest">Link</h5>
            <ul className="space-y-2 text-sm">
                <li><button onClick={() => window.scrollTo({top:0, behavior:'smooth'})} className="hover:text-wine-400">Home</button></li>
                <li><button onClick={onViewAllGuides} className="hover:text-wine-400">{t('lp_academy')}</button></li>
                <li><button onClick={onOpenBusiness} className="hover:text-emerald-400">Business</button></li>
            </ul>
          </div>
          <div className="space-y-4">
            <h5 className="text-white font-bold text-sm uppercase tracking-widest">Legal</h5>
            <ul className="space-y-2 text-sm">
                <li><a href="/privacy" className="hover:text-wine-400">Privacy</a></li>
                <li><a href="/termini" className="hover:text-wine-400">Termini</a></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto pt-8 border-t border-white/5 text-center text-xs tracking-widest uppercase">
          © {new Date().getFullYear()} AIKNOW.WINE &bull; Powered by AIKNOW.IO
        </div>
      </footer>
    </div>
  );
};

const FeatureCard = ({ icon, title, desc, color }: { icon: React.ReactNode, title: string, desc: string, color: string }) => (
  <div className="relative h-full bg-stone-50 p-8 rounded-[2rem] border border-stone-100 hover:shadow-2xl hover:-translate-y-1.5 hover:bg-white transition-all duration-500 group overflow-hidden">
    <div className={`absolute -right-10 -top-10 w-32 h-32 rounded-full bg-gradient-to-br ${color} opacity-0 group-hover:opacity-10 blur-2xl transition-opacity duration-500`} />
    <div className={`w-16 h-16 bg-gradient-to-br ${color} rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-500`}>{icon}</div>
    <h3 className="font-bold text-2xl text-gray-900 mb-3 font-serif">{title}</h3>
    <p className="text-gray-500 leading-relaxed">{desc}</p>
  </div>
);

export default LandingPage;
