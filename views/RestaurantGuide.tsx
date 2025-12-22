
import React, { useEffect } from 'react';
import { Logo } from '../components/Logo';
import { RestaurantIcon, CameraIcon, StarIcon, WineIcon, HelpIcon } from '../components/Icons';

interface RestaurantGuideProps {
  onBack: () => void;
  onStart: () => void;
}

const RestaurantGuide: React.FC<RestaurantGuideProps> = ({ onBack, onStart }) => {
  
  useEffect(() => {
    // Metadati SEO Dinamici
    document.title = "Sommelier al Ristorante: Scegli il vino perfetto - AIKNOW.WINE";
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute('content', 'Basta dubbi davanti alla carta dei vini. Scansiona il menu, scrivi cosa mangi e ricevi i 3 migliori abbinamenti dal nostro Sommelier IA.');

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.innerHTML = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "HowTo",
      "name": "Come scegliere il vino giusto al ristorante con AIKNOW.WINE",
      "description": "Guida rapida all'utilizzo dello scanner per carte dei vini e abbinamenti istantanei.",
      "step": [
        {
          "@type": "HowToStep",
          "name": "Fotografa la Carta dei Vini",
          "text": "Scatta fino a 3 foto alle pagine della lista vini del ristorante."
        },
        {
          "@type": "HowToStep",
          "name": "Indica il tuo Piatto",
          "text": "Scrivi brevemente cosa hai ordinato o cosa vorresti mangiare."
        },
        {
          "@type": "HowToStep",
          "name": "Ricevi i suggerimenti",
          "text": "L'IA analizza i prezzi e le caratteristiche dei vini in lista e ti propone le 3 opzioni migliori per il tuo pasto."
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
    <div className="h-full w-full overflow-y-auto bg-white text-gray-900 font-sans selection:bg-wine-100 animate-in fade-in duration-500">
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-6 h-16 flex justify-between items-center">
          <div className="cursor-pointer transition-transform hover:scale-95" onClick={onBack}>
            <Logo className="w-8 h-8" showText={true} />
          </div>
          <button 
            onClick={onStart}
            className="bg-wine-700 text-white px-5 py-2 rounded-full text-sm font-bold shadow-md hover:bg-wine-800 transition-all"
          >
            Prova al Ristorante
          </button>
        </div>
      </nav>

      <article className="max-w-3xl mx-auto px-6 py-12 md:py-20">
        <header className="mb-16">
          <div className="bg-wine-50 text-wine-700 w-fit px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-6">
            In giro per ristoranti
          </div>
          <h1 className="text-4xl md:text-6xl font-serif font-black text-gray-900 leading-tight mb-6">
            Addio stress da <br/>
            <span className="text-wine-600">Carta dei Vini.</span>
          </h1>
          <p className="text-xl text-gray-500 leading-relaxed max-w-2xl">
            Siete al ristorante, vi consegnano una lista con 100 etichette e non sapete cosa scegliere? 
            Con <strong>AIKNOW.WINE</strong>, avrete un sommelier professionista seduto al vostro tavolo, pronto ad analizzare la carta per voi.
          </p>
        </header>

        <section className="space-y-16 mb-20">
          {/* Step 1: Foto */}
          <div className="flex flex-col md:flex-row gap-10 items-start">
             <div className="bg-stone-50 p-6 rounded-[2.5rem] border border-stone-100 shadow-inner shrink-0">
                <CameraIcon className="w-16 h-16 text-wine-600" />
             </div>
             <div>
                <h2 className="text-2xl font-serif font-bold mb-3">1. Scansiona la Lista</h2>
                <p className="text-gray-600 leading-relaxed">
                   Non serve digitare nulla. Scattate una foto alle pagine della carta dei vini (fino a 3 foto). 
                   La nostra IA leggerà istantaneamente nomi, produttori, annate e prezzi, anche in condizioni di luce soffusa tipiche dei ristoranti.
                </p>
             </div>
          </div>

          {/* Step 2: Cibo */}
          <div className="flex flex-col md:flex-row gap-10 items-start">
             <div className="bg-stone-50 p-6 rounded-[2.5rem] border border-stone-100 shadow-inner shrink-0 md:order-last">
                <RestaurantIcon className="w-16 h-16 text-wine-600" filled />
             </div>
             <div>
                <h2 className="text-2xl font-serif font-bold mb-3">2. Dimmi cosa mangi</h2>
                <p className="text-gray-600 leading-relaxed">
                   Scrivete il piatto che avete ordinato. "Spaghetti alle vongole", "Fiorentina al sangue", "Anatra all'arancia". 
                   L'IA utilizzerà le sue competenze di abbinamento molecolare per incrociare i sapori del piatto con le bottiglie disponibili nel ristorante.
                </p>
             </div>
          </div>

          {/* Step 3: Scelta */}
          <div className="flex flex-col md:flex-row gap-10 items-start">
             <div className="bg-stone-50 p-6 rounded-[2.5rem] border border-stone-100 shadow-inner shrink-0">
                <StarIcon className="w-16 h-16 text-amber-500" filled />
             </div>
             <div>
                <h2 className="text-2xl font-serif font-bold mb-3">3. Scegli tra i Top 3</h2>
                <p className="text-gray-600 leading-relaxed">
                   Riceverete i 3 migliori abbinamenti divisi per fascia di prezzo. Per ogni vino saprete <strong>perché</strong> è la scelta giusta e quanto il suo profilo si sposa con il vostro pasto (Match Score).
                </p>
             </div>
          </div>
        </section>

        {/* Pro Tip Box */}
        <section className="bg-indigo-900 rounded-3xl p-8 text-indigo-50 mb-20 shadow-xl">
           <div className="flex items-center gap-4 mb-4">
              <div className="bg-indigo-800 p-2 rounded-lg">
                <HelpIcon className="w-6 h-6 text-indigo-300" />
              </div>
              <h3 className="font-bold text-xl uppercase tracking-wide">Il Consiglio dell'Esperto</h3>
           </div>
           <p className="leading-relaxed opacity-90">
             "L'app tiene conto anche del prezzo del ristorante. Se identifica un vino con un ricarico eccessivo o, al contrario, una 'perla' rara offerta a un prezzo onesto, te lo segnalerà immediatamente."
           </p>
        </section>

        {/* CTA Finale */}
        <section className="bg-stone-900 rounded-[2.5rem] p-10 md:p-16 text-white text-center shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 opacity-5">
             <WineIcon className="w-64 h-64 text-white" filled />
          </div>
          
          <div className="relative z-10">
              <h2 className="text-3xl md:text-5xl font-serif font-bold mb-6">Non ordinare mai più il vino sbagliato</h2>
              <p className="text-stone-400 mb-10 max-w-md mx-auto text-lg">
                Porta AIKNOW.WINE con te alla prossima cena. È gratis e non richiede installazione.
              </p>
              <button 
                onClick={onStart}
                className="bg-wine-600 text-white px-12 py-5 rounded-2xl font-bold text-xl hover:bg-wine-700 transition-all transform hover:scale-105 active:scale-95 shadow-xl"
              >
                Inizia ora
              </button>
          </div>
        </section>
      </article>

      <footer className="bg-stone-50 py-16 border-t border-gray-100">
        <div className="max-w-4xl mx-auto px-6 text-center text-sm text-gray-400 font-medium">
          AIKNOW.WINE &bull; Tecnologia AI per amanti del vino.
        </div>
      </footer>
    </div>
  );
};

export default RestaurantGuide;
