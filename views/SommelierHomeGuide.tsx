
import React, { useEffect } from 'react';
import { Logo } from '../components/Logo';
import { ChefIcon, WineIcon, ClockIcon, ThermometerIcon, HistoryIcon } from '../components/Icons';

interface SommelierHomeGuideProps {
  onBack: () => void;
  onStart: () => void;
}

const SommelierHomeGuide: React.FC<SommelierHomeGuideProps> = ({ onBack, onStart }) => {
  
  useEffect(() => {
    // Metadati SEO Dinamici
    document.title = "Il Sommelier a Casa: Abbinamenti Perfetti - AIKNOW.WINE";
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute('content', 'Non sai quale vino aprire? Inserisci il tuo menu e il nostro Sommelier IA sceglierà la bottiglia perfetta dalla tua cantina digitale.');

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.innerHTML = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "HowTo",
      "name": "Come scegliere il vino perfetto per la tua cena con AIKNOW.WINE",
      "description": "Guida all'uso del Sommelier Virtuale per abbinare i vini della propria cantina ai piatti del menu.",
      "step": [
        {
          "@type": "HowToStep",
          "name": "Inserisci il Menu",
          "text": "Scrivi i piatti che intendi cucinare, dall'antipasto al dolce."
        },
        {
          "@type": "HowToStep",
          "name": "Scegli lo stile di servizio",
          "text": "Decidi se vuoi un unico vino per tutto il pasto o un abbinamento dedicato per ogni portata."
        },
        {
          "@type": "HowToStep",
          "name": "Ricevi i consigli",
          "text": "L'IA analizza la tua cantina e ti suggerisce la bottiglia ideale, con temperatura e tempi di apertura."
        },
        {
          "@type": "HowToStep",
          "name": "Condividi con gli ospiti",
          "text": "Invia un link elegante ai tuoi amici per mostrare cosa berranno durante la serata."
        }
      ]
    });
    document.head.appendChild(script);

    return () => { 
      document.title = "AIKNOW.WINE - Il tuo Sommelier AI";
      const existingScript = document.head.querySelector('script[type="application/ld+json"]');
      if (existingScript) document.head.removeChild(existingScript);
    };
  }, []);

  return (
    <div className="h-full w-full overflow-y-auto bg-stone-50 text-gray-900 font-sans selection:bg-wine-100 animate-in fade-in duration-500">
      {/* Header statico per SEO guide */}
      <nav className="sticky top-0 z-50 bg-stone-50/90 backdrop-blur-md border-b border-stone-200">
        <div className="max-w-4xl mx-auto px-6 h-16 flex justify-between items-center">
          <div className="cursor-pointer transition-transform hover:scale-95" onClick={onBack}>
            <Logo className="w-8 h-8" showText={true} />
          </div>
          <button 
            onClick={onStart}
            className="bg-wine-700 text-white px-5 py-2 rounded-full text-sm font-bold shadow-md hover:bg-wine-800 transition-all"
          >
            Prova il Sommelier
          </button>
        </div>
      </nav>

      <article className="max-w-3xl mx-auto px-6 py-12 md:py-20">
        <header className="mb-16 text-center md:text-left">
          <span className="text-wine-600 font-bold uppercase tracking-widest text-xs mb-4 block">Esperienza Gourmet</span>
          <h1 className="text-4xl md:text-6xl font-serif font-black text-gray-900 leading-tight mb-6">
            "Che vino apro questa sera?" <br/>
            <span className="text-wine-700">Il Sommelier IA risponde.</span>
          </h1>
          <p className="text-xl text-gray-600 leading-relaxed italic max-w-2xl">
            Trasforma ogni cena in un evento professionale. Non scegliere un vino a caso: scegli quello che esalta i tuoi piatti, pescando direttamente dalla tua collezione.
          </p>
        </header>

        <section className="grid gap-12 mb-20">
          {/* Feature 1 */}
          <div className="bg-white rounded-[2rem] p-8 md:p-12 shadow-xl shadow-stone-200/50 border border-stone-100 flex flex-col md:flex-row gap-10 items-center">
            <div className="shrink-0 bg-amber-50 p-6 rounded-3xl">
              <ChefIcon className="w-16 h-16 text-amber-600" filled />
            </div>
            <div>
              <h2 className="text-2xl font-serif font-bold mb-4 text-gray-800">Tu cucini, l'IA abbina.</h2>
              <p className="text-gray-600 leading-relaxed">
                Inserisci il menu della serata in linguaggio naturale. "Tagliata ai porcini", "Risotto allo zafferano", "Tarte Tatin". 
                Il nostro algoritmo analizza <strong>struttura, grassezza e persistenza</strong> dei piatti per trovare il match perfetto tra le bottiglie che hai realmente in cantina.
              </p>
            </div>
          </div>

          {/* Grid di features secondarie */}
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-wine-50/50 p-8 rounded-3xl border border-wine-100">
              <div className="w-12 h-12 bg-wine-100 rounded-2xl flex items-center justify-center mb-6">
                <ClockIcon className="w-6 h-6 text-wine-700" />
              </div>
              <h3 className="text-xl font-bold mb-3">Servizio Impeccabile</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Il Sommelier non ti dice solo quale vino aprire. Ti consiglia la <strong>temperatura di servizio esatta</strong> e quanto tempo prima stappare la bottiglia per permetterle di esprimersi al meglio.
              </p>
            </div>

            <div className="bg-indigo-50/50 p-8 rounded-3xl border border-indigo-100">
              <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center mb-6">
                <HistoryIcon className="w-6 h-6 text-indigo-700" />
              </div>
              <h3 className="text-xl font-bold mb-3">Menu Digitale Condivisibile</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Stupisci i tuoi amici inviando loro il link del menu. Potranno visualizzare in anteprima i piatti e le schede tecniche dei vini scelti, proprio come in un ristorante stellato.
              </p>
            </div>
          </div>
        </section>

        {/* Citazione d'atmosfera */}
        <section className="mb-20 text-center py-12 border-y border-stone-200">
           <blockquote className="text-2xl font-serif italic text-gray-500">
             "Un buon abbinamento non somma i sapori, li moltiplica."
           </blockquote>
        </section>

        {/* Come Funziona - Step Grafici */}
        <section className="mb-20">
          <h2 className="text-3xl font-serif font-bold mb-12 text-center">Tre step per il brindisi perfetto</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { t: "1. Scrivi il Menu", d: "Digita i piatti che compongono la tua cena." },
              { t: "2. Lascia fare all'IA", d: "L'algoritmo incrocia il menu con la tua cantina digitale." },
              { t: "3. Goditi la serata", d: "Apri la bottiglia consigliata e condividi il menu." }
            ].map((step, i) => (
              <div key={i} className="text-center group">
                <div className="w-12 h-12 bg-stone-200 rounded-full flex items-center justify-center mx-auto mb-4 font-bold text-lg group-hover:bg-wine-600 group-hover:text-white transition-colors">
                  {i+1}
                </div>
                <h4 className="font-bold mb-2">{step.t}</h4>
                <p className="text-xs text-gray-500 leading-relaxed">{step.d}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA Finale */}
        <section className="bg-wine-900 rounded-[2.5rem] p-10 md:p-16 text-white text-center shadow-2xl relative overflow-hidden">
          <div className="absolute bottom-0 left-0 -ml-16 -mb-16 opacity-10">
             <ChefIcon className="w-64 h-64 text-white" filled />
          </div>
          
          <div className="relative z-10">
              <h2 className="text-3xl md:text-5xl font-serif font-bold mb-6">Diventa il Sommelier della serata</h2>
              <p className="text-wine-100/80 mb-10 max-w-md mx-auto text-lg">
                Organizza la tua prossima cena con AIKNOW.WINE. L'abbinamento perfetto è a un click di distanza.
              </p>
              <button 
                onClick={onStart}
                className="bg-white text-wine-900 px-12 py-5 rounded-2xl font-bold text-xl hover:bg-stone-100 transition-all transform hover:scale-105 active:scale-95 shadow-xl"
              >
                Inizia ora gratis
              </button>
          </div>
        </section>
      </article>

      <footer className="bg-stone-200 py-16">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <Logo className="w-10 h-10 grayscale opacity-30 mx-auto mb-6" />
          <p className="text-sm text-gray-500 mb-8 font-medium">
            AIKNOW.WINE &bull; Eccellenza digitale per la tua cantina privata.
          </p>
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-4 text-xs font-bold text-gray-400 uppercase tracking-widest">
            <button onClick={onBack} className="hover:text-wine-700 transition-colors">Home</button>
            <span className="text-stone-300">|</span>
            <button onClick={() => window.scrollTo({top:0, behavior:'smooth'})} className="hover:text-wine-700 transition-colors">Torna su</button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default SommelierHomeGuide;
