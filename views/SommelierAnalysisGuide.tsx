
import React, { useEffect } from 'react';
import { Logo } from '../components/Logo';
import { ChefIcon, ChartBarIcon, WineIcon, UserIcon, ShieldCheckIcon, ClockIcon } from '../components/Icons';

interface SommelierAnalysisGuideProps {
  onBack: () => void;
  onStart: () => void;
}

const SommelierAnalysisGuide: React.FC<SommelierAnalysisGuideProps> = ({ onBack, onStart }) => {
  
  useEffect(() => {
    // Metadati SEO Dinamici
    document.title = "Analisi Sommelier IA: Il Tuo Profilo Sensoriale - AIKNOW.WINE";
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute('content', 'Scopri come l\'IA analizza i tuoi gusti e la tua cantina. Crea un profilo del palato, identifica i gap della collezione e ricevi consigli d\'acquisto mirati.');

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.innerHTML = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": "L'Intelligenza Artificiale applicata alla Sommelierie Professionale",
      "description": "Come AIKNOW.WINE trasforma i tuoi dati di consumo in una strategia di gestione cantina.",
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
    <div className="h-full w-full overflow-y-auto bg-slate-950 text-white font-sans selection:bg-purple-500/30 animate-in fade-in duration-500">
      <nav className="sticky top-0 z-50 bg-slate-950/90 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-4xl mx-auto px-6 h-16 flex justify-between items-center">
          <div className="cursor-pointer transition-transform hover:scale-95" onClick={onBack}>
            <Logo className="w-8 h-8" showText={true} light />
          </div>
          <button 
            onClick={onStart}
            className="bg-purple-600 text-white px-5 py-2 rounded-full text-sm font-bold shadow-lg shadow-purple-500/20 hover:bg-purple-500 transition-all"
          >
            Analizza Cantina
          </button>
        </div>
      </nav>

      <article className="max-w-3xl mx-auto px-6 py-12 md:py-20">
        <header className="mb-16">
          <div className="inline-block bg-purple-500/10 text-purple-400 border border-purple-500/20 px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest mb-6">
            Intelligenza Sensoriale
          </div>
          <h1 className="text-4xl md:text-6xl font-serif font-black leading-tight mb-6">
            Più di un database. <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-400">Un Sommelier che ti capisce.</span>
          </h1>
          <p className="text-xl text-slate-400 leading-relaxed max-w-2xl">
            AIKNOW.WINE non si limita a elencare i tuoi vini. Studia le tue scelte, i tuoi voti e le tue abitudini per aiutarti a costruire la cantina dei tuoi sogni.
          </p>
        </header>

        <section className="space-y-16 mb-20">
          {/* Step 1: Profilo Palato */}
          <div className="flex flex-col md:flex-row gap-10 items-start">
             <div className="bg-slate-900 p-6 rounded-[2.5rem] border border-slate-800 shadow-xl shrink-0">
                <UserIcon className="w-16 h-16 text-purple-500" filled />
             </div>
             <div>
                <h2 className="text-2xl font-serif font-bold mb-3">Costruzione del Profilo Palato</h2>
                <p className="text-slate-400 leading-relaxed text-sm">
                   Ogni volta che dai un voto a una bottiglia, l'IA impara. Analizziamo le zone geografiche, i vitigni e le strutture che preferisci per definire il tuo "DNA del Gusto". 
                   Scoprirai se sei un amante della finezza francese o della potenza dei vini del nuovo mondo.
                </p>
             </div>
          </div>

          {/* Step 2: Gap Analysis */}
          <div className="flex flex-col md:flex-row gap-10 items-start">
             <div className="bg-slate-900 p-6 rounded-[2.5rem] border border-slate-800 shadow-xl shrink-0 md:order-last">
                <ChartBarIcon className="w-16 h-16 text-indigo-500" />
             </div>
             <div>
                <h2 className="text-2xl font-serif font-bold mb-3">Gap Analysis: Cosa manca?</h2>
                <p className="text-slate-400 leading-relaxed text-sm">
                   Una cantina equilibrata ha bisogno di varietà. Il Sommelier identifica i vuoti nella tua collezione. 
                   "Hai molti rossi da invecchiamento, ma mancano bianchi freschi per l'aperitivo" oppure "La tua selezione di bollicine è sbilanciata verso il Metodo Classico".
                </p>
             </div>
          </div>

          {/* Step 3: Strategia Acquisti */}
          <div className="flex flex-col md:flex-row gap-10 items-start">
             <div className="bg-slate-900 p-6 rounded-[2.5rem] border border-slate-800 shadow-xl shrink-0">
                <WineIcon className="w-16 h-16 text-emerald-500" filled />
             </div>
             <div>
                <h2 className="text-2xl font-serif font-bold mb-3">Consigli d'Acquisto Mirati</h2>
                <p className="text-slate-400 leading-relaxed text-sm">
                   Basta acquisti casuali. Ricevi suggerimenti specifici su quali bottiglie aggiungere per migliorare il ROI della cantina e la soddisfazione del tuo palato, basati sul mercato reale.
                </p>
             </div>
          </div>
        </section>

        {/* Highlight Feature: Drink Window */}
        <section className="bg-gradient-to-br from-purple-900/40 to-slate-900 border border-purple-500/20 rounded-[2.5rem] p-8 md:p-12 mb-20">
           <div className="flex items-center gap-4 mb-6">
              <div className="bg-purple-600/30 p-3 rounded-2xl">
                <ClockIcon className="w-8 h-8 text-purple-400" />
              </div>
              <h3 className="text-2xl font-serif font-bold">Time Optimization</h3>
           </div>
           <p className="text-slate-300 mb-8 leading-relaxed">
             "Il vino ha un ciclo vitale. L'IA calcola per ogni tua bottiglia la **finestra di bevibilità ottimale**, segnalandoti quando un vino sta entrando nel suo picco o quando rischia di declinare."
           </p>
           <div className="flex gap-3">
              <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-xs font-bold border border-green-500/30">Pronto</span>
              <span className="bg-amber-500/20 text-amber-400 px-3 py-1 rounded-full text-xs font-bold border border-amber-500/30">Attesa</span>
              <span className="bg-red-500/20 text-red-400 px-3 py-1 rounded-full text-xs font-bold border border-red-500/30">Declino</span>
           </div>
        </section>

        {/* CTA Finale */}
        <section className="bg-white text-slate-950 rounded-[2.5rem] p-10 md:p-16 text-center shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 opacity-5">
             <ShieldCheckIcon className="w-64 h-64 text-slate-950" filled />
          </div>
          
          <div className="relative z-10">
              <h2 className="text-3xl md:text-5xl font-serif font-bold mb-6">Trasforma i dati in degustazioni.</h2>
              <p className="text-slate-500 mb-10 max-w-md mx-auto text-lg">
                Attiva l'analisi professionale e scopri il valore reale della tua passione.
              </p>
              <button 
                onClick={onStart}
                className="bg-purple-600 text-white px-12 py-5 rounded-2xl font-bold text-xl hover:bg-purple-700 transition-all transform hover:scale-105 shadow-xl shadow-purple-200"
              >
                Inizia l'Analisi Sommelier
              </button>
          </div>
        </section>
      </article>

      <footer className="bg-black/50 py-16 border-t border-slate-800">
        <div className="max-w-4xl mx-auto px-6 text-center text-sm text-slate-500 font-medium">
          AIKNOW.WINE &bull; Wine Intelligence per Collezionisti Moderni.
        </div>
      </footer>
    </div>
  );
};

export default SommelierAnalysisGuide;
