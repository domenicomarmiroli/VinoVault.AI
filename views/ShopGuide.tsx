
import React, { useEffect } from 'react';
import { Logo } from '../components/Logo';
import { ShopIcon, CameraIcon, ChartBarIcon, ShoppingCartIcon, ShieldCheckIcon, WineIcon } from '../components/Icons';

interface ShopGuideProps {
  onBack: () => void;
  onStart: () => void;
}

const ShopGuide: React.FC<ShopGuideProps> = ({ onBack, onStart }) => {
  
  useEffect(() => {
    // Metadati SEO Dinamici
    document.title = "Acquisti Intelligenti: Valuta ogni Bottiglia - AIKNOW.WINE";
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute('content', 'Usa l\'IA per analizzare i tuoi acquisti di vino. Foto in enoteca o link online: scopri se il prezzo è giusto e se il vino manca nella tua cantina.');

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.innerHTML = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "HowTo",
      "name": "Come fare acquisti di vino intelligenti con AIKNOW.WINE",
      "description": "Guida all'uso dello Shop Advisor per confrontare prezzi e gestire la varietà della cantina.",
      "step": [
        {
          "@type": "HowToStep",
          "name": "Scansiona o Incolla",
          "text": "In enoteca scatta una foto alla bottiglia. Se navighi online, incolla il link dell'e-commerce."
        },
        {
          "@type": "HowToStep",
          "name": "Inserisci il Prezzo",
          "text": "Indica il prezzo a cui ti viene offerto il vino."
        },
        {
          "@type": "HowToStep",
          "name": "Verifica il Deal",
          "text": "L'IA confronta il prezzo con la media di mercato e ti dice se è un affare o se è troppo caro."
        },
        {
          "@type": "HowToStep",
          "name": "Controlla la Cantina",
          "text": "Il sistema ti avvisa se hai già troppe bottiglie simili o se quel vino colma un vuoto importante nella tua collezione."
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
    <div className="h-full w-full overflow-y-auto bg-slate-50 text-slate-900 font-sans selection:bg-indigo-100 animate-in fade-in duration-500">
      <nav className="sticky top-0 z-50 bg-slate-50/90 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-6 h-16 flex justify-between items-center">
          <div className="cursor-pointer transition-transform hover:scale-95" onClick={onBack}>
            <Logo className="w-8 h-8" showText={true} />
          </div>
          <button 
            onClick={onStart}
            className="bg-indigo-600 text-white px-5 py-2 rounded-full text-sm font-bold shadow-md hover:bg-indigo-700 transition-all"
          >
            Prova lo Shop Advisor
          </button>
        </div>
      </nav>

      <article className="max-w-3xl mx-auto px-6 py-12 md:py-20">
        <header className="mb-16">
          <div className="bg-indigo-100 text-indigo-700 w-fit px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-6">
            Smart Shopping
          </div>
          <h1 className="text-4xl md:text-6xl font-serif font-black text-slate-900 leading-tight mb-6">
            Mai più acquisti <br/>
            <span className="text-indigo-600">Sbagliati.</span>
          </h1>
          <p className="text-xl text-slate-500 leading-relaxed max-w-2xl">
            Sei davanti a uno scaffale o su un sito web e non sai se quel vino vale il prezzo richiesto? 
            <strong>AIKNOW.WINE</strong> analizza il mercato in tempo reale per darti una risposta oggettiva.
          </p>
        </header>

        <section className="space-y-12 mb-20">
          {/* Feature 1: Foto & Link */}
          <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm flex flex-col md:flex-row gap-8 items-center">
             <div className="flex gap-2">
                <div className="bg-slate-100 p-4 rounded-2xl"><CameraIcon className="w-8 h-8 text-slate-600" /></div>
                <div className="bg-indigo-100 p-4 rounded-2xl"><ShoppingCartIcon className="w-8 h-8 text-indigo-600" /></div>
             </div>
             <div>
                <h2 className="text-2xl font-serif font-bold mb-2">Omnicanale: Enoteca o Web</h2>
                <p className="text-slate-600 text-sm leading-relaxed">
                   Usa la fotocamera per scansionare le etichette fisiche o incolla semplicemente l'URL di un sito di vino. 
                   L'IA estrarrà i dati tecnici e identificherà la bottiglia esatta in pochi secondi.
                </p>
             </div>
          </div>

          {/* Feature 2: Cellar Fit */}
          <div className="grid md:grid-cols-2 gap-8">
             <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center mb-6">
                    <WineIcon className="w-6 h-6 text-emerald-600" filled />
                </div>
                <h3 className="text-xl font-bold mb-3">Cellar Fit</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                   Non comprare un altro Chardonnay se ne hai già 12 in cantina. L'IA ti avvisa se la bottiglia è un "doppione" o se aggiunge valore diversificando la tua collezione.
                </p>
             </div>

             <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center mb-6">
                    <ChartBarIcon className="w-6 h-6 text-amber-600" />
                </div>
                <h3 className="text-xl font-bold mb-3">Analisi del Deal</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                   Confrontiamo il prezzo dell'enoteca con la media online. Ti diremo se è un <strong>"Ottimo Affare"</strong>, un prezzo <strong>"Corretto"</strong> o se è <strong>"Fuori Mercato"</strong>.
                </p>
             </div>
          </div>

          {/* Feature Premium: Global Search */}
          <div className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-[2.5rem] p-8 md:p-12 text-white shadow-xl relative overflow-hidden">
             <div className="absolute top-0 right-0 p-8 opacity-20">
                <ShieldCheckIcon className="w-32 h-32 text-indigo-400" />
             </div>
             <div className="relative z-10">
                <span className="text-indigo-400 font-bold uppercase tracking-widest text-[10px] mb-4 block">Funzione Premium</span>
                <h2 className="text-3xl font-serif font-bold mb-4">Benchmark dei Prezzi Online</h2>
                <p className="text-indigo-100/70 mb-8 max-w-lg">
                   Gli utenti Premium possono sbloccare il confronto prezzi dettagliato. Il sistema interroga i principali motori di ricerca e e-commerce per mostrarti esattamente dove quel vino costa meno in questo istante.
                </p>
                <div className="flex items-center gap-2 text-indigo-300 font-bold text-sm">
                   <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></div>
                   Prezzi aggiornati in tempo reale
                </div>
             </div>
          </div>
        </section>

        {/* CTA Finale */}
        <section className="bg-white rounded-[2.5rem] p-10 md:p-16 text-center shadow-lg border border-slate-200">
          <h2 className="text-3xl md:text-5xl font-serif font-bold mb-6 text-slate-900">Ottimizza il tuo budget</h2>
          <p className="text-slate-500 mb-10 max-w-md mx-auto text-lg">
            Smetti di indovinare. Inizia a comprare con la sicurezza di un esperto.
          </p>
          <button 
            onClick={onStart}
            className="bg-indigo-600 text-white px-12 py-5 rounded-2xl font-bold text-xl hover:bg-indigo-700 transition-all transform hover:scale-105 active:scale-95 shadow-xl shadow-indigo-200"
          >
            Accedi allo Shop Advisor
          </button>
        </section>
      </article>

      <footer className="bg-slate-100 py-16 border-t border-slate-200">
        <div className="max-w-4xl mx-auto px-6 text-center text-sm text-slate-400 font-medium">
          AIKNOW.WINE &bull; Compra meglio, bevi meglio.
        </div>
      </footer>
    </div>
  );
};

export default ShopGuide;
