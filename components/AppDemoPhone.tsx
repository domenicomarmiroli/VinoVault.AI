import React, { useEffect, useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { WineIcon, ChefIcon, ShopIcon, RestaurantIcon, HistoryIcon, MapPinIcon, CameraIcon } from './Icons';

// Dimostrazione animata dell'app per l'hero della pagina pubblica:
// scatto etichetta → analisi → posizionamento in cantina → abbinamento del Sommelier.

type Txt = Record<string, string>;
const TXT: Record<string, Txt> = {
  it: {
    s0: 'Scatta', s1: 'Analizza', s2: 'Posiziona', s3: 'Abbina',
    c0: "Fotografi l'etichetta", c1: "L'AI ti dice tutto del vino", c2: 'Sai sempre dove si trova', c3: 'Il Sommelier sceglie dalla tua cantina',
    frame: "Inquadra l'etichetta", analyzing: 'Analisi in corso…', sheet: 'Scheda vino', type: 'Rosso Fermo',
    body: 'Corpo', acidity: 'Acidità', tannin: 'Tannino', pairings: 'Abbinamenti', p1: 'Brasato', p2: 'Tartufo', p3: 'Formaggi stagionati',
    window: 'Da bere', value: 'Valore', add: 'Aggiungi in cantina',
    bottles: 'Bottiglie', wines: 'Vini', worth: 'Valore', rack: 'Scaffale soggiorno', fridge: 'Cantinetta', slot: 'Col. 2 · Rip. 3 · Posto 4', placed: 'Bottiglia posizionata',
    menu: 'Cosa cucini stasera?', dish: 'Risotto ai funghi porcini e arrosto di vitello', ask: 'Chiedi al Sommelier', fromCellar: 'Dalla tua cantina',
    tip: 'Servi a 17 °C · apri 1 ora prima',
  },
  en: {
    s0: 'Snap', s1: 'Analyse', s2: 'Place', s3: 'Pair',
    c0: 'Snap the label', c1: 'AI tells you everything about the wine', c2: 'Always know where it is', c3: 'The Sommelier picks from your cellar',
    frame: 'Frame the label', analyzing: 'Analysing…', sheet: 'Wine card', type: 'Still Red',
    body: 'Body', acidity: 'Acidity', tannin: 'Tannin', pairings: 'Pairings', p1: 'Braised beef', p2: 'Truffle', p3: 'Aged cheese',
    window: 'Drink', value: 'Value', add: 'Add to cellar',
    bottles: 'Bottles', wines: 'Wines', worth: 'Value', rack: 'Living room rack', fridge: 'Wine fridge', slot: 'Col. 2 · Shelf 3 · Slot 4', placed: 'Bottle placed',
    menu: "What are you cooking tonight?", dish: 'Porcini mushroom risotto and roast veal', ask: 'Ask the Sommelier', fromCellar: 'From your cellar',
    tip: 'Serve at 17 °C · open 1 hour ahead',
  },
  fr: {
    s0: 'Photographiez', s1: 'Analysez', s2: 'Rangez', s3: 'Accordez',
    c0: "Photographiez l'étiquette", c1: "L'IA vous dit tout sur le vin", c2: 'Vous savez toujours où il est', c3: 'Le Sommelier choisit dans votre cave',
    frame: "Cadrez l'étiquette", analyzing: 'Analyse en cours…', sheet: 'Fiche vin', type: 'Rouge tranquille',
    body: 'Corps', acidity: 'Acidité', tannin: 'Tanin', pairings: 'Accords', p1: 'Bœuf braisé', p2: 'Truffe', p3: 'Fromages affinés',
    window: 'À boire', value: 'Valeur', add: 'Ajouter à la cave',
    bottles: 'Bouteilles', wines: 'Vins', worth: 'Valeur', rack: 'Casier du salon', fridge: 'Cave à vin', slot: 'Col. 2 · Ét. 3 · Place 4', placed: 'Bouteille rangée',
    menu: 'Que cuisinez-vous ce soir ?', dish: 'Risotto aux cèpes et rôti de veau', ask: 'Demander au Sommelier', fromCellar: 'Dans votre cave',
    tip: 'Servir à 17 °C · ouvrir 1 h avant',
  },
  es: {
    s0: 'Fotografía', s1: 'Analiza', s2: 'Coloca', s3: 'Marida',
    c0: 'Fotografías la etiqueta', c1: 'La IA te cuenta todo del vino', c2: 'Siempre sabes dónde está', c3: 'El Sommelier elige de tu bodega',
    frame: 'Encuadra la etiqueta', analyzing: 'Analizando…', sheet: 'Ficha del vino', type: 'Tinto tranquilo',
    body: 'Cuerpo', acidity: 'Acidez', tannin: 'Tanino', pairings: 'Maridajes', p1: 'Estofado', p2: 'Trufa', p3: 'Quesos curados',
    window: 'Beber', value: 'Valor', add: 'Añadir a la bodega',
    bottles: 'Botellas', wines: 'Vinos', worth: 'Valor', rack: 'Botellero del salón', fridge: 'Vinoteca', slot: 'Col. 2 · Balda 3 · Hueco 4', placed: 'Botella colocada',
    menu: '¿Qué cocinas esta noche?', dish: 'Risotto de boletus y asado de ternera', ask: 'Preguntar al Sommelier', fromCellar: 'De tu bodega',
    tip: 'Servir a 17 °C · abrir 1 hora antes',
  },
  de: {
    s0: 'Fotografieren', s1: 'Analysieren', s2: 'Einlagern', s3: 'Kombinieren',
    c0: 'Etikett fotografieren', c1: 'Die KI verrät dir alles über den Wein', c2: 'Du weißt immer, wo er liegt', c3: 'Der Sommelier wählt aus deinem Keller',
    frame: 'Etikett erfassen', analyzing: 'Analyse läuft…', sheet: 'Weinkarte', type: 'Stiller Rotwein',
    body: 'Körper', acidity: 'Säure', tannin: 'Tannin', pairings: 'Passt zu', p1: 'Schmorbraten', p2: 'Trüffel', p3: 'Gereifter Käse',
    window: 'Trinken', value: 'Wert', add: 'In den Keller',
    bottles: 'Flaschen', wines: 'Weine', worth: 'Wert', rack: 'Regal Wohnzimmer', fridge: 'Weinkühlschrank', slot: 'Sp. 2 · Boden 3 · Platz 4', placed: 'Flasche eingelagert',
    menu: 'Was kochst du heute Abend?', dish: 'Steinpilzrisotto und Kalbsbraten', ask: 'Sommelier fragen', fromCellar: 'Aus deinem Keller',
    tip: 'Bei 17 °C servieren · 1 Std. vorher öffnen',
  },
};

const DURATIONS = [4200, 5600, 4800, 6400];
const d = (ms: number): React.CSSProperties => ({ animationDelay: `${ms}ms` });

const Bottle: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 120 300" className={className}>
    <defs>
      <linearGradient id="dmGlass" x1="0" x2="1">
        <stop offset="0" stopColor="#1a0509" /><stop offset=".35" stopColor="#4a0f1d" /><stop offset=".55" stopColor="#6b1a2c" /><stop offset="1" stopColor="#1a0509" />
      </linearGradient>
      <linearGradient id="dmFoil" x1="0" x2="1"><stop offset="0" stopColor="#7f1d1d" /><stop offset=".5" stopColor="#b91c1c" /><stop offset="1" stopColor="#7f1d1d" /></linearGradient>
    </defs>
    <path d="M48 6h24v62c0 12 22 22 22 52v166a8 8 0 0 1-8 8H34a8 8 0 0 1-8-8V120c0-30 22-40 22-52z" fill="url(#dmGlass)" />
    <path d="M48 6h24v40H48z" fill="url(#dmFoil)" />
    <rect x="30" y="160" width="60" height="78" rx="3" fill="#f5f0e6" />
    <text x="60" y="186" textAnchor="middle" fontFamily="Playfair Display, serif" fontStyle="italic" fontWeight="700" fontSize="13" fill="#4e1633">Barolo</text>
    <line x1="40" x2="80" y1="196" y2="196" stroke="#933d76" strokeWidth="1" />
    <text x="60" y="212" textAnchor="middle" fontFamily="Inter, sans-serif" fontSize="8" letterSpacing="2" fill="#6b5560">DOCG</text>
    <text x="60" y="228" textAnchor="middle" fontFamily="Inter, sans-serif" fontWeight="700" fontSize="9" fill="#4e1633">2019</text>
    <path d="M76 70c6 6 12 16 12 40v150" stroke="white" strokeOpacity=".18" strokeWidth="4" fill="none" strokeLinecap="round" />
  </svg>
);

// Cerchio che indica il tocco del dito
const Tap: React.FC<{ delay: number; className: string }> = ({ delay, className }) => (
  <span className={`absolute pointer-events-none w-10 h-10 -ml-5 -mt-5 rounded-full bg-white/70 ring-2 ring-wine-400/60 demo-tap ${className}`} style={d(delay)} />
);

const Header: React.FC<{ title: string }> = ({ title }) => (
  <div className="px-4 pt-1 pb-2.5 bg-white border-b border-gray-100 flex items-center justify-between">
    <span className="font-serif font-bold text-[17px] text-gray-900">{title}</span>
    <span className="w-7 h-7 rounded-full bg-wine-50 text-wine-700 text-[11px] font-black flex items-center justify-center">A</span>
  </div>
);

const ScanScene: React.FC<{ tx: Txt }> = ({ tx }) => (
  <div className="absolute inset-0 bg-gradient-to-b from-gray-900 via-wine-950 to-gray-950 overflow-hidden">
    <div className="absolute top-3 inset-x-0 flex justify-center">
      <span className="px-3 py-1 rounded-full bg-black/40 text-white/90 text-[10px] font-bold backdrop-blur border border-white/10">{tx.frame}</span>
    </div>
    <Bottle className="absolute left-1/2 top-[8%] -translate-x-1/2 h-[74%] drop-shadow-2xl" />
    <div className="absolute left-[20%] right-[20%] top-[44%] h-[30%] rounded-2xl">
      {['top-0 left-0 border-t-2 border-l-2 rounded-tl-xl', 'top-0 right-0 border-t-2 border-r-2 rounded-tr-xl', 'bottom-0 left-0 border-b-2 border-l-2 rounded-bl-xl', 'bottom-0 right-0 border-b-2 border-r-2 rounded-br-xl'].map(c => (
        <span key={c} className={`absolute w-6 h-6 border-cyan-300 ${c}`} />
      ))}
      <div className="absolute inset-x-1 h-0.5 bg-cyan-300 shadow-[0_0_14px_3px_rgba(103,232,249,.7)] lp-scan" />
    </div>
    <div className="absolute bottom-5 inset-x-0 flex justify-center">
      <span className="relative w-14 h-14 rounded-full border-4 border-white/80 flex items-center justify-center">
        <span className="w-10 h-10 rounded-full bg-white demo-press" style={d(1600)} />
      </span>
    </div>
    <Tap delay={1500} className="left-1/2 bottom-[3.25rem]" />
    <div className="absolute inset-0 bg-white demo-flash" style={d(1750)} />
    <div className="absolute inset-x-0 bottom-24 flex justify-center animate-in fade-in slide-in-from-bottom-4 duration-500" style={d(2300)}>
      <span className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-white text-wine-800 text-[11px] font-bold shadow-xl">
        <span className="w-3.5 h-3.5 rounded-full border-2 border-wine-200 border-t-wine-700 animate-spin" /> {tx.analyzing}
      </span>
    </div>
  </div>
);

const Bar: React.FC<{ label: string; value: number; delay: number }> = ({ label, value, delay }) => (
  <div className="flex items-center gap-2 text-[10px]">
    <span className="w-14 text-gray-500 font-medium">{label}</span>
    <span className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
      <span className="block h-full rounded-full bg-gradient-to-r from-wine-400 to-wine-700 origin-left demo-grow" style={{ width: `${value}%`, ...d(delay) }} />
    </span>
  </div>
);

const AnalysisScene: React.FC<{ tx: Txt }> = ({ tx }) => {
  const year = new Date().getFullYear();
  return (
    <div className="absolute inset-0 bg-gray-50 flex flex-col">
      <Header title={tx.sheet} />
      <div className="flex-1 px-3 pt-3 space-y-2.5 overflow-hidden">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3 flex gap-3 items-center animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="w-12 h-16 rounded-lg bg-gradient-to-b from-stone-100 to-stone-200 flex items-center justify-center shrink-0"><Bottle className="h-14" /></div>
          <div className="flex-1 min-w-0">
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded border bg-red-50 text-red-800 border-red-100">{tx.type}</span>
            <p className="font-bold text-[14px] text-gray-900 leading-tight mt-1">Barolo DOCG</p>
            <p className="text-[10px] text-gray-500">Tenuta del Colle · 2019</p>
          </div>
          <div className="relative w-12 h-12 shrink-0">
            <svg viewBox="0 0 36 36" className="w-12 h-12 -rotate-90">
              <circle cx="18" cy="18" r="15.5" fill="none" stroke="#f3f4f6" strokeWidth="3.5" />
              <circle cx="18" cy="18" r="15.5" fill="none" stroke="#10b981" strokeWidth="3.5" strokeLinecap="round" strokeDasharray="97.4" strokeDashoffset="7.8" className="demo-ring" style={d(300)} />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-[13px] font-black text-emerald-700">92</span>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3 space-y-1.5 animate-in fade-in slide-in-from-bottom-4 duration-500" style={d(500)}>
          <Bar label={tx.body} value={88} delay={700} />
          <Bar label={tx.acidity} value={72} delay={850} />
          <Bar label={tx.tannin} value={84} delay={1000} />
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3 animate-in fade-in slide-in-from-bottom-4 duration-500" style={d(1100)}>
          <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1.5">{tx.pairings}</p>
          <div className="flex flex-wrap gap-1">
            {[tx.p1, tx.p2, tx.p3].map((p, i) => (
              <span key={p} className="text-[10px] font-medium text-wine-700 bg-wine-50 border border-wine-100 px-2 py-0.5 rounded-full animate-in fade-in zoom-in-95 duration-300" style={d(1300 + i * 150)}>{p}</span>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 animate-in fade-in slide-in-from-bottom-4 duration-500" style={d(1700)}>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-2.5">
            <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">{tx.window}</p>
            <p className="text-[12px] font-bold text-gray-900 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />{year}–{year + 9}</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-2.5">
            <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">{tx.value}</p>
            <p className="text-[12px] font-bold text-gray-900">€ 48</p>
          </div>
        </div>
      </div>
      <div className="relative px-3 pb-3 pt-1 animate-in fade-in slide-in-from-bottom-4 duration-500" style={d(2200)}>
        <span className="block w-full text-center bg-wine-700 text-white font-bold text-[12px] py-2.5 rounded-xl shadow-lg shadow-wine-900/20 demo-press" style={d(4300)}>{tx.add}</span>
        <Tap delay={4200} className="left-1/2 top-1/2" />
      </div>
    </div>
  );
};

const RACK = [
  // 3 colonne × 5 ripiani × 3 posti: r = rosso, w = bianco, s = bollicine, '' = libero
  ['rrw', 'r r', 'wws', 'rr ', 'srr'],
  ['rwr', 'r w', 'rr ', 'w r', 'rrw'],
  ['srr', 'ww ', 'r r', 'rws', ' rr'],
];
const DOT: Record<string, string> = { r: 'bg-gradient-to-br from-wine-600 to-wine-900', w: 'bg-gradient-to-br from-amber-100 to-amber-300', s: 'bg-gradient-to-br from-yellow-100 to-amber-200' };

const CellarScene: React.FC<{ tx: Txt }> = ({ tx }) => (
  <div className="absolute inset-0 bg-gray-50 flex flex-col">
    <Header title="AIKNOW.WINE" />
    <div className="px-3 pt-3 space-y-2.5 flex-1 overflow-hidden">
      <div className="flex text-[10px] text-gray-500 bg-white border border-gray-100 rounded-xl py-2 justify-around">
        {[['37', tx.bottles], ['18', tx.wines], ['€1.380', tx.worth]].map(([v, l]) => (
          <div key={l} className="text-center"><span className="block font-bold text-gray-900 text-[13px]">{v}</span>{l}</div>
        ))}
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <p className="text-[11px] font-bold text-gray-900 flex items-center gap-1 mb-2"><MapPinIcon className="w-3.5 h-3.5 text-wine-600" /> {tx.rack}</p>
        <div className="rounded-xl p-1.5 bg-gradient-to-b from-amber-800 to-amber-950 grid grid-cols-3 gap-1.5 shadow-inner">
          {RACK.map((col, ci) => (
            <div key={ci} className="rounded-md bg-amber-950/60 p-1 space-y-1">
              {col.map((shelf, si) => (
                <div key={si} className="flex justify-around border-b border-amber-700/50 pb-1">
                  {shelf.split('').map((c, pi) => {
                    const target = ci === 1 && si === 2 && pi === 2;
                    if (target) return (
                      <span key={pi} className="relative w-4 h-4">
                        <span className="absolute inset-0 rounded-full border-2 border-dashed border-emerald-400 bg-emerald-400/20 animate-pulse" />
                        <span className={`absolute inset-0 rounded-full ${DOT.r} ring-2 ring-cyan-300 shadow-[0_0_10px_2px_rgba(103,232,249,.8)] demo-drop`} style={d(1500)} />
                      </span>
                    );
                    return c.trim()
                      ? <span key={pi} className={`w-4 h-4 rounded-full ${DOT[c]} shadow-inner`} />
                      : <span key={pi} className="w-4 h-4 rounded-full border border-emerald-500/50" />;
                  })}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-2.5 flex gap-2.5 items-center animate-in fade-in slide-in-from-bottom-4 duration-500" style={d(2300)}>
        <div className="w-9 h-12 rounded-md bg-stone-100 flex items-center justify-center"><Bottle className="h-10" /></div>
        <div className="min-w-0 flex-1">
          <p className="text-[12px] font-bold text-gray-900 leading-tight">Barolo DOCG 2019</p>
          <span className="mt-1 inline-flex items-center gap-1 text-[9px] text-wine-600 font-medium bg-wine-50 px-1.5 py-0.5 rounded"><MapPinIcon className="w-2.5 h-2.5" />{tx.slot}</span>
        </div>
      </div>
    </div>
    <div className="absolute bottom-3 inset-x-0 flex justify-center animate-in fade-in slide-in-from-bottom-4 duration-300" style={d(1900)}>
      <span className="px-3 py-1.5 rounded-full bg-gray-900 text-white text-[10px] font-bold shadow-xl flex items-center gap-1.5"><span className="text-emerald-400">✓</span>{tx.placed}</span>
    </div>
  </div>
);

const SommelierScene: React.FC<{ tx: Txt; perCourse: string; whole: string }> = ({ tx, perCourse, whole }) => {
  const [chars, setChars] = useState(0);
  useEffect(() => {
    let n = 0;
    const start = setTimeout(() => {
      const id = setInterval(() => { n += 1; setChars(n); if (n >= tx.dish.length) clearInterval(id); }, 32);
    }, 300);
    return () => clearTimeout(start);
  }, [tx.dish]);
  const results = [
    { name: 'Barolo DOCG 2019', match: 94, loc: tx.rack },
    { name: 'Langhe Nebbiolo 2021', match: 88, loc: tx.fridge },
  ];
  return (
    <div className="absolute inset-0 bg-gray-50 flex flex-col">
      <Header title="Sommelier" />
      <div className="px-3 pt-3 space-y-2.5 flex-1 overflow-hidden">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3">
          <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1.5">{tx.menu}</p>
          <p className="text-[12px] text-gray-900 min-h-[2.6em] leading-snug">{tx.dish.slice(0, chars)}<span className="inline-block w-px h-3 bg-wine-600 align-middle ml-px animate-pulse" /></p>
          <div className="mt-2 grid grid-cols-2 gap-1 bg-gray-100 rounded-lg p-0.5 text-[10px] font-bold text-center">
            <span className="bg-white rounded-md py-1 text-wine-700 shadow-sm">{perCourse}</span><span className="py-1 text-gray-400">{whole}</span>
          </div>
          <div className="relative mt-2">
            <span className="block text-center bg-amber-500 text-white font-bold text-[11px] py-2 rounded-xl demo-press" style={d(2300)}>✨ {tx.ask}</span>
            <Tap delay={2200} className="left-1/2 top-1/2" />
          </div>
        </div>
        <p className="text-[9px] font-black uppercase tracking-widest text-emerald-700 animate-in fade-in duration-300" style={d(2800)}>● {tx.fromCellar}</p>
        {results.map((r, i) => (
          <div key={r.name} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3 animate-in fade-in slide-in-from-bottom-4 duration-500" style={d(2900 + i * 450)}>
            <div className="flex justify-between items-start gap-2">
              <div className="min-w-0">
                <p className="text-[12px] font-bold text-gray-900 leading-tight">{r.name}</p>
                <span className="mt-1 inline-flex items-center gap-1 text-[9px] text-wine-600 font-medium bg-wine-50 px-1.5 py-0.5 rounded"><MapPinIcon className="w-2.5 h-2.5" />{r.loc}</span>
              </div>
              <span className="text-[13px] font-black text-emerald-600">{r.match}%</span>
            </div>
            <span className="block mt-2 h-1 rounded-full bg-gray-100 overflow-hidden">
              <span className="block h-full bg-emerald-500 rounded-full origin-left demo-grow" style={{ width: `${r.match}%`, ...d(3100 + i * 450) }} />
            </span>
            {i === 0 && <p className="mt-1.5 text-[10px] text-amber-700">🌡 {tx.tip}</p>}
          </div>
        ))}
      </div>
    </div>
  );
};

const AppDemoPhone: React.FC = () => {
  const { t, language } = useLanguage();
  const tx = TXT[language] ?? TXT.en;
  const [scene, setScene] = useState(0);
  const [cycle, setCycle] = useState(0);

  useEffect(() => {
    const id = setTimeout(() => {
      setScene(s => (s + 1) % 4);
      setCycle(c => c + 1);
    }, DURATIONS[scene]);
    return () => clearTimeout(id);
  }, [scene, cycle]);

  const go = (i: number) => { setScene(i); setCycle(c => c + 1); };
  const tabs = [
    { icon: WineIcon, label: t('nav_cellar'), on: scene !== 3 },
    { icon: ChefIcon, label: t('nav_sommelier'), on: scene === 3 },
    { icon: ShopIcon, label: t('nav_shop'), on: false },
    { icon: RestaurantIcon, label: t('nav_restaurant'), on: false },
    { icon: HistoryIcon, label: t('nav_history'), on: false },
  ];

  return (
    <div className="relative mx-auto w-full max-w-[22rem] flex flex-col items-center">
      <div className="absolute -inset-10 top-0 bottom-24 bg-gradient-to-tr from-wine-200 via-fuchsia-100 to-cyan-100 rounded-full blur-3xl opacity-70" />
      {/* Telefono */}
      <div className="relative w-[264px] sm:w-[280px] aspect-[9/19] rounded-[3rem] bg-gray-950 p-[11px] shadow-[0_40px_80px_-20px_rgba(46,8,27,.55)] ring-1 ring-white/10">
        <span className="absolute -left-[3px] top-28 w-[3px] h-10 rounded-l bg-gray-800" />
        <span className="absolute -right-[3px] top-36 w-[3px] h-16 rounded-r bg-gray-800" />
        <div className="relative h-full rounded-[2.4rem] overflow-hidden bg-white flex flex-col">
          {/* barra di stato */}
          <div className={`relative z-20 h-9 shrink-0 flex items-center justify-between px-6 text-[11px] font-bold ${scene === 0 ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'} transition-colors`}>
            <span>9:41</span>
            <span className="absolute left-1/2 -translate-x-1/2 top-2 w-20 h-5 rounded-full bg-black" />
            <span className="flex items-center gap-1">
              <svg viewBox="0 0 18 12" className="w-4 h-3 fill-current"><rect x="0" y="8" width="3" height="4" rx="1" /><rect x="5" y="5" width="3" height="7" rx="1" /><rect x="10" y="2" width="3" height="10" rx="1" /><rect x="15" y="0" width="3" height="12" rx="1" opacity=".35" /></svg>
              <span className="w-5 h-2.5 rounded-[3px] border border-current p-[1px]"><span className="block h-full w-3/4 bg-current rounded-[1px]" /></span>
            </span>
          </div>
          {/* schermata */}
          <div className="relative flex-1 overflow-hidden">
            <div key={`${scene}-${cycle}`} className="absolute inset-0 animate-in fade-in duration-300">
              {scene === 0 && <ScanScene tx={tx} />}
              {scene === 1 && <AnalysisScene tx={tx} />}
              {scene === 2 && <CellarScene tx={tx} />}
              {scene === 3 && <SommelierScene tx={tx} perCourse={t('per_course')} whole={t('single_wine')} />}
            </div>
          </div>
          {/* barra di navigazione dell'app */}
          <div className="shrink-0 bg-white border-t border-gray-200 flex justify-between px-2 pt-1.5 pb-4">
            {tabs.map(tab => (
              <span key={tab.label} className={`flex flex-col items-center flex-1 transition-colors duration-300 ${tab.on ? 'text-wine-700' : 'text-gray-400'}`}>
                <tab.icon className="w-[18px] h-[18px] mb-0.5" filled={tab.on} />
                <span className="text-[6.5px] font-bold uppercase tracking-wider">{tab.label}</span>
              </span>
            ))}
          </div>
          <span className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-24 h-1 rounded-full bg-gray-900/80" />
        </div>
      </div>

      {/* Passaggi */}
      <div className="relative mt-6 w-full">
        <div className="grid grid-cols-4 gap-1.5">
          {[0, 1, 2, 3].map(i => (
            <button key={i} onClick={() => go(i)} className="text-left group" aria-label={tx[`s${i}`]}>
              <span className="block h-1 rounded-full bg-gray-200 overflow-hidden">
                <span key={`${scene}-${cycle}`} className={`block h-full bg-wine-700 origin-left ${i < scene ? '' : i === scene ? 'demo-progress' : 'scale-x-0'}`}
                  style={i === scene ? { animationDuration: `${DURATIONS[i]}ms` } : undefined} />
              </span>
              <span className={`mt-2 block text-[11px] sm:text-xs font-bold transition-colors ${i === scene ? 'text-wine-800' : 'text-gray-400 group-hover:text-gray-600'}`}>
                {i + 1}. {tx[`s${i}`]}
              </span>
            </button>
          ))}
        </div>
        <p key={scene} className="mt-2 text-center text-sm text-gray-500 flex items-center justify-center gap-1.5 animate-in fade-in duration-500">
          {scene === 0 && <CameraIcon className="w-4 h-4 text-wine-600" />}{tx[`c${scene}`]}
        </p>
      </div>
    </div>
  );
};

export default AppDemoPhone;
