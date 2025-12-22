
import React, { useEffect } from 'react';
import { Logo } from '../components/Logo';
import { ChartBarIcon, WineIcon, HistoryIcon, ShieldCheckIcon, MapPinIcon } from '../components/Icons';

interface AnalyticsGuideProps {
  onBack: () => void;
  onStart: () => void;
}

const AnalyticsGuide: React.FC<AnalyticsGuideProps> = ({ onBack, onStart }) => {
  
  useEffect(() => {
    // Metadati SEO Dinamici
    document.title = "Analisi Cantina e ROI: Il Valore del tuo Gusto - AIKNOW.WINE";
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute('content', 'Scopri il valore reale della tua cantina. Analisi ROI, statistiche di consumo e suddivisione per regione con il nostro Sommelier IA.');

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.innerHTML = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": "Come monitorare il valore e il ROI della tua cantina vinicola",
      "description": "Guida alle metriche avanzate di AIKNOW.WINE per appassionati e investitori di vino.",
      "author": {
        "@type": "Organization",
        "name": "AIKNOW.WINE"
      }
    });
    document.head.appendChild(script);

    return () => { 
      document.title = "AIKNOW.WINE - Il tuo Sommelier AI";
      const existingScript = document.head.querySelector('script[type="application/ld+json"]');
      if (existingScript) document.head.removeChild(existingScript);
    };
  }, []);

  return (
    <div className="h-full w-full overflow-y-auto bg-gray-900 text-white font-sans selection:bg-cyan-500/30 animate-in fade-in duration-500">
      <nav className="sticky top-0 z-50 bg-gray-900/90 backdrop-blur-md border-b border-gray-800">
        <div className="max-w-4xl mx-auto px-6 h-16 flex justify-between items-center">
          <div className="cursor-pointer transition-transform hover:scale-95" onClick={onBack}>
            <Logo className="w-8 h-8" showText={true} light />
          </div>
          <button 
            onClick={onStart}
            className="bg-cyan-500 text-gray-900 px-5 py-2 rounded-full text-sm font-bold shadow-lg shadow-cyan-500/20 hover:bg-cyan-400 transition-all"
          >
            Vedi i tuoi Dati
          </button>
        </div>
      </nav>

      <article className="max-w-3xl mx-auto px-6 py-12 md:py-20">
        <header className="mb-16 text-center">
          <div className="inline-block bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest mb-6">
            Wine Intelligence
          </div>
          <h1 className="text-4xl md:text-6xl font-serif font-black leading-tight mb-6 text-white">
            Analisi Avanzata <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">e ROI della Cantina.</span>
          </h1>
          <p className="text-xl text-gray-400 leading-relaxed max-w-2xl mx-auto">
            Il vino non è solo piacere, è un asset. Scopri come l'IA trasforma la tua passione in dati azionabili.
          </p>
        </header>

        <section className="grid gap-8 mb-20">
          {/* ROI Card */}
          <div className="bg-gray-800/50 border border-gray-700 p-8 rounded-[2.5rem] flex flex-col md:flex-row gap-8 items-center">
             <div className="bg-cyan-500/20 p-6 rounded-3xl">
                <ChartBarIcon className="w-12 h-12 text-cyan-400" filled />
             </div>
             <div>
                <h2 className="text-2xl font-serif font-bold mb-3 text-white">Il ROI del tuo Gusto</h2>
                <p className="text-gray-400 leading-relaxed">
                   AIKNOW.WINE confronta il prezzo di acquisto storico con il valore di mercato attuale. 
                   Visualizza istantaneamente il <strong>ritorno sull'investimento (ROI)</strong> della tua cantina, monitorando quali bottiglie stanno aumentando di valore.
                </p>
             </div>
          </div>

          {/* Breakdown Grid */}
          <div className="grid md:grid-cols-2 gap-8">
             <div className="bg-gray-800/30 border border-gray-700 p-6 rounded-3xl">
                <div className="flex items-center gap-3 mb-4">
                   <WineIcon className="w-6 h-6 text-wine-500" filled />
                   <h3 className="font-bold text-lg">Distribuzione per Tipologia</h3>
                </div>
                <p className="text-sm text-gray-500 leading-relaxed">
                   Sei più un tipo da "Bollicine" o da "Grandi Rossi"? I nostri grafici a barre ti mostrano la composizione percentuale della tua cantina per aiutarti a bilanciare la collezione.
                </p>
             </div>
             <div className="bg-gray-800/30 border border-gray-700 p-6 rounded-3xl">
                <div className="flex items-center gap-3 mb-4">
                   <MapPinIcon className="w-6 h-6 text-emerald-500" />
                   <h3 className="font-bold text-lg">Mappa delle Regioni</h3>
                </div>
                <p className="text-sm text-gray-500 leading-relaxed">
                   Esplora la tua cantina geograficamente. Identifica le regioni più rappresentate e scopri quali territori vinicoli mancano nel tuo portfolio.
                </p>
             </div>
          </div>

          {/* Consumi Card */}
          <div className="bg-gradient-to-br from-wine-900/40 to-gray-800 border border-wine-500/20 p-8 rounded-[2.5rem]">
             <div className="flex items-center gap-4 mb-6">
                <div className="bg-wine-600/30 p-3 rounded-2xl">
                   <HistoryIcon className="w-8 h-8 text-wine-500" filled />
                </div>
                <h2 className="text-2xl font-serif font-bold text-white">Valore del Bevuto</h2>
             </div>
             <p className="text-gray-400 mb-6 leading-relaxed">
                Tieni traccia non solo di quello che hai, ma di quello che hai goduto. Visualizza il <strong>valore totale delle bottiglie stappate</strong>, il prezzo medio per calice e il diario storico delle tue degustazioni.
             </p>
             <div className="grid grid-cols-2 gap-4">
                <div className="bg-black/20 p-4 rounded-2xl border border-white/5">
                   <span className="block text-cyan-400 font-bold text-xl">Statistiche</span>
                   <span className="text-[10px] text-gray-500 uppercase">Mensili e Annuali</span>
                </div>
                <div className="bg-black/20 p-4 rounded-2xl border border-white/5">
                   <span className="block text-cyan-400 font-bold text-xl">Feedback</span>
                   <span className="text-[10px] text-gray-500 uppercase">Rating medio</span>
                </div>
             </div>
          </div>
        </section>

        {/* Analisi IA Box */}
        <section className="bg-white text-gray-900 rounded-[2.5rem] p-8 md:p-12 mb-20 shadow-2xl relative overflow-hidden">
           <div className="absolute top-0 right-0 p-8 opacity-10">
              <ShieldCheckIcon className="w-32 h-32 text-wine-600" />
           </div>
           <div className="relative z-10">
              <span className="text-wine-600 font-bold uppercase tracking-widest text-[10px] mb-4 block">Report Professionale</span>
              <h2 className="text-3xl font-serif font-bold mb-4">L'IA diventa il tuo Analyst.</h2>
              <p className="text-gray-600 mb-8 leading-relaxed">
                 Gli utenti Premium possono generare un <strong>Cellar Report completo</strong>. L'IA analizza i tuoi gusti, identifica i "gap" (quello che manca) e ti suggerisce una strategia di acquisto e consumo basata sulle tue abitudini reali.
              </p>
              <div className="flex flex-wrap gap-2">
                 {['Gap Analysis', 'Profilo del Palato', 'Strategia di Bevuta'].map(t => (
                    <span key={t} className="bg-stone-100 text-stone-600 px-3 py-1 rounded-full text-[10px] font-bold border border-stone-200">{t}</span>
                 ))}
              </div>
           </div>
        </section>

        {/* CTA Finale */}
        <section className="text-center py-12">
          <h2 className="text-3xl font-serif font-bold mb-8">Pronto per un'analisi approfondita?</h2>
          <button 
            onClick={onStart}
            className="bg-cyan-500 text-gray-900 px-12 py-5 rounded-2xl font-bold text-xl hover:bg-cyan-400 transition-all transform hover:scale-105 active:scale-95 shadow-xl shadow-cyan-500/20"
          >
            Inizia l'Analisi
          </button>
        </section>
      </article>

      <footer className="bg-black/50 py-16 border-t border-gray-800">
        <div className="max-w-4xl mx-auto px-6 text-center text-sm text-gray-500">
          AIKNOW.WINE &bull; Data Science per Wine Lovers.
        </div>
      </footer>
    </div>
  );
};

export default AnalyticsGuide;
