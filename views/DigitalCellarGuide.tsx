
import React, { useEffect } from 'react';
import { Logo } from '../components/Logo';
import { WineIcon, CameraIcon, MapPinIcon, ChartBarIcon, ThermometerIcon, ChefIcon } from '../components/Icons';

interface DigitalCellarGuideProps {
  onBack: () => void;
  onStart: () => void;
}

const DigitalCellarGuide: React.FC<DigitalCellarGuideProps> = ({ onBack, onStart }) => {
  
  // Script JSON-LD per SEO (Dati strutturati)
  useEffect(() => {
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.innerHTML = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "HowTo",
      "name": "Come creare una Cantina Digitale con AIKNOW.WINE",
      "description": "Guida completa alla gestione della cantina vinicola domestica utilizzando l'intelligenza artificiale e lo scanner di etichette.",
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
        },
        {
          "@type": "HowToStep",
          "name": "Monitora il valore",
          "text": "Visualizza la stima di mercato e il periodo ideale di consumo per ogni bottiglia."
        }
      ]
    });
    document.head.appendChild(script);
    return () => { document.head.removeChild(script); };
  }, []);

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans selection:bg-wine-100 selection:text-wine-900">
      {/* Nav Minimalista */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
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
        {/* Intestazione SEO */}
        <header className="mb-16">
          <h1 className="text-4xl md:text-6xl font-serif font-black text-gray-900 leading-tight mb-6">
            La Tua Cantina Digitale: <br/>
            <span className="text-wine-600">Da Scaffale a Smartphone.</span>
          </h1>
          <p className="text-xl text-gray-600 leading-relaxed italic">
            "Hai mai dimenticato una bottiglia preziosa in fondo al frigo o faticato a ricordare il prezzo di quel Barolo acquistato anni fa?"
          </p>
        </header>

        {/* Problema vs Soluzione */}
        <section className="space-y-12 mb-20">
          <div className="bg-stone-50 rounded-3xl p-8 border border-stone-100">
            <h2 className="text-2xl font-serif font-bold mb-6 flex items-center gap-3">
              <CameraIcon className="w-6 h-6 text-wine-600" />
              Scanner Etichette Intelligente
            </h2>
            <p className="text-gray-700 leading-relaxed mb-6">
              Dimentica i moduli infiniti da compilare. Con <strong>AIKNOW.WINE</strong>, ti basta una foto. La nostra intelligenza artificiale analizza l'immagine ed estrae istantaneamente:
            </p>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {['Produttore e Nome', 'Annata e Vitigno', 'Regione e Alcol', 'Prezzo stimato'].map((item, i) => (
                <li key={i} className="flex items-center gap-2 text-sm font-medium text-gray-600">
                  <div className="w-1.5 h-1.5 rounded-full bg-wine-400"></div>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="bg-cyan-50 p-4 rounded-2xl w-fit">
                <MapPinIcon className="w-6 h-6 text-cyan-600" />
              </div>
              <h3 className="text-xl font-bold">Gestione Location</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Che tu abbia una cantinetta frigo di design, un semplice scaffale in garage o uno spazio dedicato in frigorifero, puoi mappare tutto. 
                <span className="block mt-2 font-semibold text-gray-900">Trova la bottiglia giusta in 2 secondi, senza frugare al buio.</span>
              </p>
            </div>
            <div className="space-y-4">
              <div className="bg-amber-50 p-4 rounded-2xl w-fit">
                <ChartBarIcon className="w-6 h-6 text-amber-600" />
              </div>
              <h3 className="text-xl font-bold">Valore e Investimento</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Il vino è un patrimonio liquido. Monitoriamo il valore di mercato delle tue bottiglie e ti diciamo quando è il <strong>picco di bevibilità</strong>: il momento perfetto per stappare prima che il vino inizi il suo declino.
              </p>
            </div>
          </div>
        </section>

        {/* Dettagli Tecnici / Features */}
        <section className="border-t border-gray-100 pt-16 mb-20">
          <h2 className="text-3xl font-serif font-bold mb-10 text-center text-gray-900">Molto più di un semplice inventario</h2>
          
          <div className="space-y-8">
            <div className="flex gap-6 items-start">
              <div className="shrink-0 bg-wine-50 p-4 rounded-2xl">
                <ThermometerIcon className="w-8 h-8 text-wine-700" />
              </div>
              <div>
                <h4 className="text-lg font-bold mb-1">Consigli di Servizio Personalizzati</h4>
                <p className="text-gray-600 text-sm">Ogni vino nella tua cantina digitale include la temperatura di servizio ideale e consigli sull'ossigenazione (es. "Aprire 30 minuti prima").</p>
              </div>
            </div>

            <div className="flex gap-6 items-start">
              <div className="shrink-0 bg-wine-50 p-4 rounded-2xl">
                <ChefIcon className="w-8 h-8 text-wine-700" />
              </div>
              <div>
                <h4 className="text-lg font-bold mb-1">Abbinamenti Gastronomici</h4>
                <p className="text-gray-600 text-sm">L'IA suggerisce i migliori piatti per ogni etichetta che possiedi, trasformando ogni cena in un'esperienza gourmet professionale.</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Finale */}
        <section className="bg-wine-900 rounded-[2rem] p-10 text-white text-center shadow-2xl shadow-wine-200">
          <h2 className="text-3xl font-serif font-bold mb-4">Inizia a digitalizzare oggi</h2>
          <p className="text-wine-100/80 mb-8 max-w-md mx-auto">
            Scarica l'app e scatta la tua prima foto. È il momento di dare ordine alla tua passione.
          </p>
          <button 
            onClick={onStart}
            className="bg-white text-wine-900 px-10 py-4 rounded-xl font-bold text-lg hover:bg-stone-100 transition-all transform hover:scale-105 active:scale-95"
          >
            Crea la tua Cantina Gratis
          </button>
          <p className="text-[10px] text-wine-300 mt-6 uppercase tracking-widest font-medium">Disponibile su tutti i dispositivi mobile</p>
        </section>
      </article>

      {/* Footer SEO */}
      <footer className="bg-stone-100 py-16 border-t border-gray-200">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="flex justify-center mb-6 opacity-30">
            <Logo className="w-10 h-10 grayscale" />
          </div>
          <p className="text-sm text-gray-400 mb-8">
            AIKNOW.WINE &bull; Il Sommelier Digitale per gli amanti del vino.
          </p>
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-4 text-xs font-bold text-gray-500 uppercase tracking-widest">
            <button onClick={onBack} className="hover:text-wine-700 transition-colors">Torna alla Home</button>
            <span className="text-stone-300">|</span>
            <button onClick={onStart} className="hover:text-wine-700 transition-colors">Accedi</button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default DigitalCellarGuide;
