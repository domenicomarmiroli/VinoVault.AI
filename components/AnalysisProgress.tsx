import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLanguage } from '../contexts/LanguageContext';

// Barra di avanzamento delle analisi AI. L'AI non comunica a che punto è,
// quindi l'avanzamento segue la durata tipica di ogni analisi e rallenta
// avvicinandosi alla fine, senza mai arrivare al 100% prima della risposta.

export type AnalysisKind = 'label' | 'shop' | 'sommelier' | 'restaurant' | 'report';

const SECONDS: Record<AnalysisKind, number> = { label: 9, shop: 16, sommelier: 16, restaurant: 22, report: 45 };

type Copy = { title: string; steps: Record<AnalysisKind, string[]> };
const COPY: Record<string, Copy> = {
  it: { title: 'Analisi in corso', steps: {
    label: ["Leggo l'etichetta", 'Riconosco produttore e annata', 'Valuto qualità e stile', 'Preparo abbinamenti e valore'],
    shop: ["Leggo l'etichetta", 'Valuto qualità e stile', 'Stimo il prezzo di mercato', 'Confronto con la tua cantina'],
    sommelier: ['Leggo il menu', 'Studio la tua cantina', 'Cerco gli abbinamenti migliori', 'Preparo i consigli di servizio'],
    restaurant: ['Leggo la carta dei vini', 'Analizzo il piatto', 'Valuto gli abbinamenti', 'Divido per fascia di prezzo'],
    report: ['Studio la tua cantina', 'Rileggo voti e note dello Storico', 'Controllo le finestre di beva', "Preparo i consigli d'acquisto"],
  } },
  en: { title: 'Analysing', steps: {
    label: ['Reading the label', 'Identifying producer and vintage', 'Rating quality and style', 'Preparing pairings and value'],
    shop: ['Reading the label', 'Rating quality and style', 'Estimating the market price', 'Comparing with your cellar'],
    sommelier: ['Reading the menu', 'Studying your cellar', 'Finding the best pairings', 'Preparing serving tips'],
    restaurant: ['Reading the wine list', 'Analysing the dish', 'Rating the pairings', 'Sorting by price range'],
    report: ['Studying your cellar', 'Reviewing your ratings and notes', 'Checking drinking windows', 'Preparing buying tips'],
  } },
  fr: { title: 'Analyse en cours', steps: {
    label: ["Lecture de l'étiquette", 'Identification du producteur et du millésime', 'Évaluation de la qualité et du style', 'Accords et valeur'],
    shop: ["Lecture de l'étiquette", 'Évaluation de la qualité et du style', 'Estimation du prix du marché', 'Comparaison avec votre cave'],
    sommelier: ['Lecture du menu', 'Étude de votre cave', 'Recherche des meilleurs accords', 'Conseils de service'],
    restaurant: ['Lecture de la carte des vins', 'Analyse du plat', 'Évaluation des accords', 'Tri par gamme de prix'],
    report: ['Étude de votre cave', 'Relecture de vos notes', 'Vérification des fenêtres de dégustation', "Conseils d'achat"],
  } },
  es: { title: 'Analizando', steps: {
    label: ['Leyendo la etiqueta', 'Identificando productor y añada', 'Valorando calidad y estilo', 'Preparando maridajes y valor'],
    shop: ['Leyendo la etiqueta', 'Valorando calidad y estilo', 'Estimando el precio de mercado', 'Comparando con tu bodega'],
    sommelier: ['Leyendo el menú', 'Estudiando tu bodega', 'Buscando los mejores maridajes', 'Preparando consejos de servicio'],
    restaurant: ['Leyendo la carta de vinos', 'Analizando el plato', 'Valorando los maridajes', 'Ordenando por precio'],
    report: ['Estudiando tu bodega', 'Revisando tus notas', 'Comprobando las ventanas de consumo', 'Preparando consejos de compra'],
  } },
  de: { title: 'Analyse läuft', steps: {
    label: ['Etikett wird gelesen', 'Erzeuger und Jahrgang erkennen', 'Qualität und Stil bewerten', 'Speiseempfehlungen und Wert'],
    shop: ['Etikett wird gelesen', 'Qualität und Stil bewerten', 'Marktpreis schätzen', 'Mit deinem Keller vergleichen'],
    sommelier: ['Menü wird gelesen', 'Dein Keller wird analysiert', 'Beste Kombinationen finden', 'Serviertipps vorbereiten'],
    restaurant: ['Weinkarte wird gelesen', 'Gericht analysieren', 'Kombinationen bewerten', 'Nach Preisklasse sortieren'],
    report: ['Dein Keller wird analysiert', 'Bewertungen und Notizen prüfen', 'Trinkfenster prüfen', 'Kaufempfehlungen vorbereiten'],
  } },
};

const useProgress = (seconds: number) => {
  const [p, setP] = useState(0);
  useEffect(() => {
    const start = performance.now();
    const tau = seconds / 2.2; // alla durata tipica si è intorno all'85%
    const id = setInterval(() => {
      const t = (performance.now() - start) / 1000;
      setP(Math.min(96, 97 * (1 - Math.exp(-t / tau))));
    }, 120);
    return () => clearInterval(id);
  }, [seconds]);
  return p;
};

// Calice che si riempie di vino
const Glass: React.FC<{ level: number; size: number }> = ({ level, size }) => {
  const top = 18, bottom = 64; // altezza utile della coppa nel viewBox
  const y = bottom - (bottom - top) * (level / 100);
  return (
    <svg viewBox="0 0 80 112" width={size} height={size * 1.4} className="drop-shadow-sm">
      <defs>
        <clipPath id="apBowl"><path d="M16 14h48c0 0 3 22-3 36-5 12-14 16-21 16s-16-4-21-16c-6-14-3-36-3-36z" /></clipPath>
        <linearGradient id="apWine" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#933d76" /><stop offset="1" stopColor="#4e1633" /></linearGradient>
      </defs>
      <g clipPath="url(#apBowl)">
        <rect x="0" y="0" width="80" height="80" fill="#fbf5f8" />
        <g style={{ transform: `translateY(${y}px)`, transition: 'transform 300ms linear' }}>
          <path d="M-40 0 q10 -4 20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 V80 H-40 Z" fill="url(#apWine)" className="ap-wave" />
        </g>
      </g>
      <path d="M16 14h48c0 0 3 22-3 36-5 12-14 16-21 16s-16-4-21-16c-6-14-3-36-3-36z" fill="none" stroke="#c886b6" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M24 22c-1 8 0 17 3 24" stroke="white" strokeOpacity=".8" strokeWidth="3" strokeLinecap="round" fill="none" />
      <path d="M40 66v32M27 100h26" stroke="#c886b6" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
};

interface Props {
  kind: AnalysisKind;
  title?: string;
  inline?: boolean;
}

const AnalysisProgress: React.FC<Props> = ({ kind, title, inline }) => {
  const { language } = useLanguage();
  const copy = COPY[language] ?? COPY.en;
  const steps = copy.steps[kind];
  const p = useProgress(SECONDS[kind]);
  const current = Math.min(steps.length - 1, Math.floor((p / 100) * steps.length * 1.08));

  const body = (
    <div className="w-full max-w-sm flex flex-col items-center text-center">
      <div className="relative mb-6">
        <div className="absolute left-1/2 top-1/2 w-40 h-40 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-tr from-wine-200 to-cyan-200 rounded-full blur-3xl opacity-60 animate-pulse" />
        <div className="relative"><Glass level={p} size={inline ? 72 : 96} /></div>
      </div>
      <h3 className="text-2xl font-serif font-bold text-gray-900 tracking-tight">{title || copy.title}</h3>
      <p key={current} className="mt-1.5 text-sm text-wine-700 font-medium min-h-[1.25rem] animate-in fade-in slide-in-from-bottom-4 duration-300">{steps[current]}…</p>

      <div className="w-full mt-6">
        <div className="relative h-2.5 rounded-full bg-wine-100 overflow-hidden">
          <div className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-wine-800 via-wine-600 to-cyan-400 transition-[width] duration-300 ease-linear" style={{ width: `${p}%` }}>
            <div className="absolute inset-0 ap-shine" />
          </div>
        </div>
        <div className="mt-2 flex justify-between text-[11px] font-bold text-gray-400 tabular-nums">
          <span>AIKNOW.WINE</span><span className="text-wine-700">{Math.round(p)}%</span>
        </div>
      </div>

      <ul className="w-full mt-5 space-y-2 text-left">
        {steps.map((s, i) => {
          const done = i < current, active = i === current;
          return (
            <li key={s} className={`flex items-center gap-3 text-sm transition-colors duration-300 ${done ? 'text-gray-500' : active ? 'text-gray-900 font-semibold' : 'text-gray-300'}`}>
              <span className={`w-5 h-5 shrink-0 rounded-full flex items-center justify-center text-[11px] font-black transition-all duration-300 ${done ? 'bg-emerald-500 text-white' : active ? 'border-2 border-wine-600' : 'border-2 border-gray-200'}`}>
                {done ? '✓' : active ? <span className="w-1.5 h-1.5 rounded-full bg-wine-600 animate-ping" /> : null}
              </span>
              {s}
            </li>
          );
        })}
      </ul>
    </div>
  );

  if (inline) return <div className="flex justify-center py-12 px-6 animate-in fade-in duration-300">{body}</div>;
  return createPortal(
    <div className="fixed inset-0 z-[250] bg-white/95 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-300" role="status" aria-live="polite">
      {body}
    </div>,
    document.body
  );
};

export default AnalysisProgress;
