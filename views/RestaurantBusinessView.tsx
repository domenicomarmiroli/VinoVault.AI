
import React, { useEffect } from 'react';
import { Logo } from '../components/Logo';
import { RestaurantIcon, ChefIcon, WineIcon, ShieldCheckIcon, StarIcon } from '../components/Icons';

interface RestaurantBusinessViewProps {
  onBack: () => void;
  onContact: () => void;
}

const RestaurantBusinessView: React.FC<RestaurantBusinessViewProps> = ({ onBack, onContact }) => {
  
  useEffect(() => {
    document.title = "AIKNOW.WINE per i Ristoranti - Sommelier IA B2B";
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="h-full w-full overflow-y-auto bg-white text-gray-900 font-sans selection:bg-emerald-100">
      {/* Navbar B2B */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex justify-between items-center">
          <div className="cursor-pointer transition-transform hover:scale-95" onClick={onBack}>
            <Logo className="w-8 h-8" showText={true} />
          </div>
          <button 
            onClick={() => window.location.href = 'mailto:business@aiknow.wine?subject=Richiesta Informazioni Ristorante'}
            className="bg-emerald-600 text-white px-6 py-2 rounded-xl text-sm font-bold shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all"
          >
            Contattaci Gratis
          </button>
        </div>
      </nav>

      <main>
        {/* Hero Section */}
        <section className="px-6 py-16 md:py-24 bg-gradient-to-b from-emerald-50/50 to-white">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <div className="inline-block bg-emerald-100 text-emerald-700 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest">
              Soluzione B2B Gratuita
            </div>
            <h1 className="text-4xl md:text-6xl font-serif font-black text-gray-900 leading-tight">
              Smetti di usare la <br/>
              <span className="text-emerald-600 underline decoration-wavy decoration-emerald-200">Carta dei Vini cartacea.</span>
            </h1>
            <p className="text-xl text-gray-600 leading-relaxed max-w-2xl mx-auto">
              Offri ai tuoi clienti un'esperienza tecnologica senza precedenti. Trasforma il tuo menu in un <strong>Sommelier Virtuale intelligente</strong> che consiglia l'abbinamento perfetto in base ai tuoi piatti.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
               <button 
                 onClick={() => window.location.href = 'mailto:business@aiknow.wine'}
                 className="px-10 py-5 bg-gray-900 text-white font-bold rounded-2xl shadow-xl hover:bg-black transition-all transform hover:scale-105"
               >
                 Richiedi Setup Gratuito
               </button>
            </div>
          </div>
        </section>

        {/* Benefits Grid */}
        <section className="max-w-6xl mx-auto px-6 py-20 grid md:grid-cols-3 gap-12">
            <div className="space-y-4">
                <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600">
                    <RestaurantIcon className="w-8 h-8" filled />
                </div>
                <h3 className="text-xl font-bold font-serif">Menu sempre aggiornato</h3>
                <p className="text-gray-500 text-sm leading-relaxed">
                    Basta ristampe costose ogni volta che finisce una referenza. Aggiorna la tua disponibilità in tempo reale dal tuo smartphone.
                </p>
            </div>
            <div className="space-y-4">
                <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600">
                    <ChefIcon className="w-8 h-8" filled />
                </div>
                <h3 className="text-xl font-bold font-serif">Abbinamenti Scientifici</h3>
                <p className="text-gray-500 text-sm leading-relaxed">
                    L'IA analizza i tuoi piatti e suggerisce il vino migliore della tua cantina, aumentando le vendite di bottiglie premium.
                </p>
            </div>
            <div className="space-y-4">
                <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600">
                    <StarIcon className="w-8 h-8" filled />
                </div>
                <h3 className="text-xl font-bold font-serif">Servizio 5 Stelle</h3>
                <p className="text-gray-500 text-sm leading-relaxed">
                    Dona autonomia ai tuoi clienti. Anche il personale meno esperto potrà rispondere con precisione alle domande sui vini.
                </p>
            </div>
        </section>

        {/* The Offer */}
        <section className="bg-gray-50 py-20 px-6 border-y border-gray-100">
            <div className="max-w-4xl mx-auto bg-white rounded-[3rem] p-10 md:p-20 shadow-2xl border border-gray-100 relative overflow-hidden text-center">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-emerald-500 rounded-full blur-[80px] opacity-20"></div>
                <h2 className="text-3xl md:text-5xl font-serif font-bold mb-6">Completamente GRATIS.</h2>
                <p className="text-lg text-gray-600 mb-10 leading-relaxed">
                    Siamo in fase di lancio e offriamo il setup completo della tua carta vini digitale a costo zero. Ti forniremo i QR Code personalizzati per i tavoli e l'accesso al pannello di controllo.
                </p>
                <div className="space-y-4 mb-10">
                    {['Zero canone mensile', 'Setup iniziale incluso', 'QR Code per i tavoli', 'Supporto tecnico IA'].map(check => (
                        <div key={check} className="flex items-center justify-center gap-2 text-emerald-600 font-bold">
                            <ShieldCheckIcon className="w-5 h-5" filled />
                            {check}
                        </div>
                    ))}
                </div>
                <button 
                  onClick={() => window.location.href = 'mailto:business@aiknow.wine'}
                  className="bg-emerald-600 text-white px-12 py-5 rounded-2xl font-bold text-xl hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-100"
                >
                    Contattaci per saperne di più
                </button>
            </div>
        </section>
      </main>

      <footer className="bg-white py-16 text-center">
          <p className="text-gray-400 text-sm">AIKNOW.WINE &bull; Digital Sommelier Solutions</p>
      </footer>
    </div>
  );
};

export default RestaurantBusinessView;
