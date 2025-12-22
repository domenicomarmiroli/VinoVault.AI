
import React, { useEffect } from 'react';
import { Logo } from '../components/Logo';
import { WineIcon, CameraIcon, MapPinIcon, ChartBarIcon, ThermometerIcon, ChefIcon } from '../components/Icons';

interface DigitalCellarGuideProps {
  onBack: () => void;
  onStart: () => void;
}

const DigitalCellarGuide: React.FC<DigitalCellarGuideProps> = ({ onBack, onStart }) => {
  
  useEffect(() => {
    // Aggiornamento Dinamico Metadati SEO
    document.title = "La Cantina Digitale - Gestisci il tuo vino con AIKNOW.WINE";
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute('content', 'Scopri come digitalizzare la tua cantina vinicola domestica. Scansiona le etichette, gestisci le posizioni e monitora il valore dei tuoi vini.');

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.innerHTML = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "HowTo",
      "name": "Come creare una Cantina Digitale con AIKNOW.WINE",
      "description": "Guida completa alla gestione della cantina vinicola domestica utilizzando l'intelligenza artificiale.",
      "step": [
        {
          "@type": "HowToStep",
          "name": "Scansiona l'etichetta",
          "text": "Usa la fotocamera del tuo smartphone per scattare una foto all'etichetta del vino. L'IA riconosce produttore, annata e vitigno."
        },
        {
          "@type": "HowToStep",
          "name": "Assegna una posizione",
          "text": "Organizza le bottiglie in frigorifero, cantinetta o scaffali per trovarle subito."
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
    <div className="h-full w-full overflow-y-auto bg-white text-gray-900 font-sans selection:bg-wine-100 selection:text-wine-900 animate-in fade-in duration-500">
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-6 h-16 flex justify-between items-center">
          <div className="cursor-pointer transition-transform hover:scale-95" onClick={onBack}>
            <Logo className="w-8 h-8" showText={true} />
          </div>
          <button 
            onClick={onStart}
            className="bg-wine-700 text-white px-5 py-2 rounded-full text-sm font-bold shadow-md hover:bg-wine-800 transition-all"
          >
            Inizia Ora
          </button>
        </div>
      </nav>

      <article className="max-w-3xl mx-auto px-6 py-12 md:py-20">
        <header className="mb-16">
          <h1 className="text-4xl md:text-6xl font-serif font-black text-gray-900 leading-tight mb-6">
            La Tua Cantina Digitale: <br/>
            <span className="text-wine-600">Da Scaffale a Smartphone.</span>
          </h1>
          <p className="text-xl text-gray-600 leading-relaxed italic">
            "Hai mai dimenticato una bottiglia preziosa in fondo al frigo o faticato a ricordare il prezzo di quel Barolo acquistato anni fa?"
          </p>
        </header>

        <section className="space-y-12 mb-20">
          <div className="bg-stone-50 rounded-3xl p-8 border border-stone-100 shadow-sm">
            <h2 className="text-2xl font-serif font-bold mb-6 flex items-center gap-3 text-gray-800">
              <CameraIcon className="w-6 h-6 text-wine-600" />
              Scanner Etichette Intelligente
            </h2>
            <p className="text-gray-700 leading-relaxed mb-6">
              Dimentica i moduli infiniti da compilare. Con <strong>AIKNOW.WINE</strong>, ti basta una foto. La nostra intelligenza artificiale analizza l'immagine ed estrae istantaneamente i dati tecnici.
            </p>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {['Produttore e Nome', 'Annata e Vitigno', 'Regione e Alcol', 'Prezzo stimato'].map((item, i) => (
                <li key={i} className="flex items-center gap-2 text-sm font-medium text-gray-600 bg-white p-3 rounded-xl border border-stone-200/50">
                  <div className="w-2 h-2 rounded-full bg-wine-400"></div>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4 bg-cyan-50/30 p-6 rounded-3xl border border-cyan-100">
              <div className="bg-cyan-100 p-4 rounded-2xl w-fit">
                <MapPinIcon className="w-6 h-6 text-cyan-600" />
              </div>
              <h3 className="text-xl font-bold text-cyan-900">Gestione Location</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Che tu abbia una cantinetta frigo o un semplice scaffale, puoi mappare tutto. 
                Trova la bottiglia giusta in 2 secondi.
              </p>
            </div>
            <div className="space-y-4 bg-amber-50/30 p-6 rounded-3xl border border-amber-100">
              <div className="bg-amber-100 p-4 rounded-2xl w-fit">
                <ChartBarIcon className="w-6 h-6 text-amber-600" />
              </div>
              <h3 className="text-xl font-bold text-amber-900">Valore di Mercato</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Monitoriamo il valore delle tue bottiglie e ti diciamo quando è il <strong>picco di bevibilità</strong>.
              </p>
            </div>
          </div>
        </section>

        <section className="bg-wine-900 rounded-[2.5rem] p-10 md:p-16 text-white text-center shadow-2xl relative overflow-hidden">
          <h2 className="text-3xl md:text-5xl font-serif font-bold mb-6">Inizia a digitalizzare oggi</h2>
          <button 
            onClick={onStart}
            className="bg-white text-wine-900 px-12 py-5 rounded-2xl font-bold text-xl hover:bg-stone-100 transition-all transform hover:scale-105 shadow-xl"
          >
            Crea la tua Cantina Gratis
          </button>
        </section>
      </article>

      <footer className="bg-stone-100 py-16 border-t border-gray-200">
        <div className="max-w-4xl mx-auto px-6 text-center text-sm text-gray-400 font-medium">
          AIKNOW.WINE &bull; Il Sommelier Digitale per gli amanti del vino.
        </div>
      </footer>
    </div>
  );
};

export default DigitalCellarGuide;
