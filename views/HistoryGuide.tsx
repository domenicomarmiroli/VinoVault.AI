
import React, { useEffect } from 'react';
import { Logo } from '../components/Logo';
import { HistoryIcon, StarIcon, PencilIcon, ClockIcon, WineIcon, ShieldCheckIcon } from '../components/Icons';

interface HistoryGuideProps {
  onBack: () => void;
  onStart: () => void;
}

const HistoryGuide: React.FC<HistoryGuideProps> = ({ onBack, onStart }) => {
  
  useEffect(() => {
    // Metadati SEO Dinamici
    document.title = "Il Tuo Diario del Vino: Storico e Memorie - AIKNOW.WINE";
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute('content', 'Non dimenticare mai un calice. Gestisci il tuo storico degustazioni, dai voti alle bottiglie e conserva note preziose per i tuoi acquisti futuri.');

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.innerHTML = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": "Come creare un diario di degustazione digitale con AIKNOW.WINE",
      "description": "Guida alla funzionalità Storico: memorizza, vota e recensisci ogni vino che stappi.",
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
    <div className="h-full w-full overflow-y-auto bg-stone-50 text-stone-900 font-sans selection:bg-wine-100 animate-in fade-in duration-500">
      <nav className="sticky top-0 z-50 bg-stone-50/90 backdrop-blur-md border-b border-stone-200">
        <div className="max-w-4xl mx-auto px-6 h-16 flex justify-between items-center">
          <div className="cursor-pointer transition-transform hover:scale-95" onClick={onBack}>
            <Logo className="w-8 h-8" showText={true} />
          </div>
          <button 
            onClick={onStart}
            className="bg-wine-700 text-white px-5 py-2 rounded-full text-sm font-bold shadow-md hover:bg-wine-800 transition-all"
          >
            Vai allo Storico
          </button>
        </div>
      </nav>

      <article className="max-w-3xl mx-auto px-6 py-12 md:py-20">
        <header className="mb-16">
          <div className="bg-stone-200 text-stone-700 w-fit px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-6">
            Memoria Enologica
          </div>
          <h1 className="text-4xl md:text-6xl font-serif font-black text-stone-900 leading-tight mb-6">
            Ogni bottiglia <br/>
            <span className="text-wine-700">Ha una storia.</span>
          </h1>
          <p className="text-xl text-stone-600 leading-relaxed max-w-2xl">
            Non lasciare che il ricordo di un grande vino svanisca. Con <strong>AIKNOW.WINE</strong>, crei un archivio immortale delle tue esperienze sensoriali.
          </p>
        </header>

        <section className="space-y-12 mb-20">
          {/* Feature 1: Il Diario */}
          <div className="bg-white rounded-3xl p-8 border border-stone-200 shadow-sm flex flex-col md:flex-row gap-8 items-center">
             <div className="bg-stone-100 p-5 rounded-2xl shrink-0">
                <ClockIcon className="w-12 h-12 text-stone-600" />
             </div>
             <div>
                <h2 className="text-2xl font-serif font-bold mb-2">Un Diario Cronologico</h2>
                <p className="text-stone-600 text-sm leading-relaxed">
                   Tieni traccia di quando e dove hai bevuto una specifica bottiglia. Che sia una cena importante o un calice veloce, il sistema organizza tutto per te, rendendo la ricerca semplice e immediata.
                </p>
             </div>
          </div>

          {/* Feature 2: Voti e Note */}
          <div className="grid md:grid-cols-2 gap-8">
             <div className="bg-white p-8 rounded-3xl border border-stone-200 shadow-sm">
                <div className="w-12 h-12 bg-yellow-50 rounded-2xl flex items-center justify-center mb-6">
                    <StarIcon className="w-6 h-6 text-yellow-500" filled />
                </div>
                <h3 className="text-xl font-bold mb-3">Rating Personale</h3>
                <p className="text-sm text-stone-600 leading-relaxed">
                   Usa il sistema a 5 stelle per dare un valore al tuo piacere. L'IA utilizzerà questi voti per capire i tuoi gusti e consigliarti nuovi acquisti con una precisione chirurgica.
                </p>
             </div>

             <div className="bg-white p-8 rounded-3xl border border-stone-200 shadow-sm">
                <div className="w-12 h-12 bg-stone-100 rounded-2xl flex items-center justify-center mb-6">
                    <PencilIcon className="w-6 h-6 text-stone-600" />
                </div>
                <h3 className="text-xl font-bold mb-3">Note di Degustazione</h3>
                <p className="text-sm text-stone-600 leading-relaxed">
                   "Troppo acido", "Perfetto con il tartufo", "Da riprovare tra due anni". Conserva i tuoi pensieri liberi per non fare mai più lo stesso errore o per ritrovare quella sensazione perfetta.
                </p>
             </div>
          </div>

          {/* Feature 3: Il Valore del Bevuto */}
          <div className="bg-gradient-to-br from-stone-800 to-stone-900 rounded-[2.5rem] p-8 md:p-12 text-white shadow-xl relative overflow-hidden">
             <div className="absolute top-0 right-0 p-8 opacity-10">
                <WineIcon className="w-32 h-32 text-stone-400" filled />
             </div>
             <div className="relative z-10">
                <h2 className="text-3xl font-serif font-bold mb-4">Investimento nel Piacere</h2>
                <p className="text-stone-300 mb-8 max-w-lg">
                   Analizziamo il valore economico di ciò che hai consumato. Scopri il prezzo medio delle tue bevute e monitora quanto stai investendo nel tuo percorso di appassionato.
                </p>
                <div className="flex items-center gap-4">
                   <div className="bg-white/10 px-4 py-2 rounded-xl border border-white/10">
                      <span className="block text-[10px] uppercase font-bold text-stone-400">Bottiglie Bevute</span>
                      <span className="text-xl font-bold">In tempo reale</span>
                   </div>
                   <div className="bg-white/10 px-4 py-2 rounded-xl border border-white/10">
                      <span className="block text-[10px] uppercase font-bold text-stone-400">Valore Totale</span>
                      <span className="text-xl font-bold">Calcolato per te</span>
                   </div>
                </div>
             </div>
          </div>
        </section>

        {/* Citazione */}
        <section className="mb-20 text-center italic text-stone-400 text-lg md:text-2xl font-serif">
           "La memoria è il sommelier del cuore."
        </section>

        {/* CTA Finale */}
        <section className="bg-white rounded-[2.5rem] p-10 md:p-16 text-center shadow-lg border border-stone-200">
          <h2 className="text-3xl md:text-5xl font-serif font-bold mb-6 text-stone-900">Non dimenticare un solo sorso.</h2>
          <p className="text-stone-500 mb-10 max-w-md mx-auto text-lg">
            Inizia a popolare il tuo storico oggi stesso. Scansiona, bevi, vota.
          </p>
          <button 
            onClick={onStart}
            className="bg-wine-700 text-white px-12 py-5 rounded-2xl font-bold text-xl hover:bg-wine-800 transition-all transform hover:scale-105 active:scale-95 shadow-xl shadow-wine-100"
          >
            Accedi allo Storico
          </button>
        </section>
      </article>

      <footer className="bg-stone-200 py-16">
        <div className="max-w-4xl mx-auto px-6 text-center text-sm text-stone-500">
          AIKNOW.WINE &bull; Custodiamo i tuoi ricordi migliori.
        </div>
      </footer>
    </div>
  );
};

export default HistoryGuide;
