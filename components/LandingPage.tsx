
import React from 'react';
import { Logo } from './Logo';
import { WineIcon, ChefIcon, ShopIcon, ChartBarIcon, RestaurantIcon } from './Icons';

interface LandingPageProps {
  onStart: () => void;
  onOpenGuide?: (slug: string) => void; // New Prop
}

const LandingPage: React.FC<LandingPageProps> = ({ onStart, onOpenGuide }) => {
  return (
    <div className="h-full overflow-y-auto bg-stone-50 flex flex-col font-sans scroll-smooth">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-stone-50/80 backdrop-blur-md border-b border-transparent transition-all duration-300">
        <div className="flex justify-between items-center p-6 max-w-7xl mx-auto w-full">
            <div className="transform scale-90 origin-left cursor-pointer" onClick={() => document.querySelector('.h-full')?.scrollTo({ top: 0, behavior: 'smooth' })}>
            <Logo />
            </div>
            <button 
            onClick={onStart}
            className="text-wine-700 font-bold hover:bg-wine-100 px-4 py-2 rounded-lg transition-colors text-sm border border-wine-100"
            >
            Accedi
            </button>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col">
        <div className="px-6 py-12 md:py-24 max-w-7xl mx-auto w-full grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6 animate-in slide-in-from-bottom duration-700">
            <div className="inline-block bg-wine-100 text-wine-800 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide mb-2">
              Sommelier IA Personale
            </div>
            <h1 className="text-5xl md:text-7xl font-serif font-bold text-gray-900 leading-tight">
              Gestisci la tua <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-wine-700 to-wine-500">
                Passione.
              </span>
            </h1>
            <p className="text-lg text-gray-600 leading-relaxed max-w-md">
              Digitalizza la tua cantina, scopri abbinamenti perfetti e valuta i tuoi investimenti vinicoli con l'intelligenza artificiale.
            </p>
            <div className="pt-4 flex flex-col sm:flex-row gap-4">
              <button 
                onClick={onStart}
                className="px-8 py-4 bg-wine-700 text-white font-bold rounded-xl shadow-lg shadow-wine-200 hover:bg-wine-800 transition-all transform hover:scale-105 text-center"
              >
                Inizia Gratuitamente
              </button>
              <button onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth'})} className="px-8 py-4 bg-white text-gray-700 border border-gray-200 font-bold rounded-xl hover:bg-gray-50 transition-colors text-center">
                Scopri di più
              </button>
            </div>
          </div>
          
          <div className="relative h-[400px] bg-gradient-to-br from-gray-900 to-wine-900 rounded-3xl overflow-hidden shadow-2xl animate-in fade-in duration-1000 hidden md:flex items-center justify-center">
             <div className="absolute inset-0 opacity-20">
                 <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <path d="M0 100 C 20 0 50 0 100 100 Z" fill="white" />
                 </svg>
             </div>
             <div className="text-center p-8 relative z-10">
                 <Logo className="w-32 h-32 mx-auto mb-6" light showText={false} />
                 <p className="text-white/80 font-serif text-2xl italic">"Il vino è poesia imbottigliata."</p>
             </div>
          </div>
        </div>

        {/* Features Section */}
        <div id="features" className="bg-white py-16 md:py-24 border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16 max-w-2xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-serif font-bold text-gray-900 mb-4">Tutto ciò che serve al Wine Lover</h2>
              <p className="text-gray-500">Un'unica app per gestire ogni aspetto della tua collezione, dall'acquisto alla degustazione.</p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              <FeatureCard 
                icon={<WineIcon className="w-8 h-8 text-white" />}
                title="Cantina Digitale"
                desc="Aggiungi vini scattando una foto. Tieni traccia di quantità, posizione e finestre di consumo."
                color="bg-wine-600"
              />
              <FeatureCard 
                icon={<ChefIcon className="w-8 h-8 text-white" />}
                title="Sommelier IA"
                desc="Non sai cosa bere? Inserisci il menu della cena e l'IA troverà l'abbinamento perfetto dalla tua cantina."
                color="bg-amber-500"
              />
              <FeatureCard 
                icon={<ShopIcon className="w-8 h-8 text-white" />}
                title="Shop Advisor"
                desc="Sei in enoteca o stai per acquistare online? Scansiona la bottiglia oppure inserisci il link per sapere se il vino si adatta alla tua cantina e il prezzo è conveniente."
                color="bg-emerald-600"
              />
              <FeatureCard 
                icon={<ChartBarIcon className="w-8 h-8 text-white" />}
                title="Analisi & ROI"
                desc="Monitora il valore della tua collezione e ottieni report professionali sulle tue abitudini."
                color="bg-indigo-600"
              />
            </div>
          </div>
        </div>

        {/* --- NEW: Guide SEO Section --- */}
        <div className="bg-stone-50 py-20 border-b border-gray-200">
           <div className="max-w-7xl mx-auto px-6">
              <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
                 <div>
                    <h2 className="text-3xl md:text-4xl font-serif font-bold text-gray-900 mb-2">Guide per il Wine Lover</h2>
                    <p className="text-gray-500">Approfondimenti e tutorial su come migliorare la gestione del tuo vino.</p>
                 </div>
                 <button 
                    onClick={() => onOpenGuide?.('cantina-digitale')}
                    className="text-wine-700 font-bold hover:underline flex items-center gap-2"
                  >
                    Vedi tutte le guide
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" /></svg>
                 </button>
              </div>

              <div className="grid md:grid-cols-3 gap-8">
                 {/* Card Guida 1 */}
                 <div 
                    onClick={() => onOpenGuide?.('cantina-digitale')}
                    className="bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all cursor-pointer group flex flex-col h-full"
                 >
                    <div className="h-48 bg-wine-800 flex items-center justify-center relative overflow-hidden shrink-0">
                        <WineIcon className="w-20 h-20 text-white/20 absolute -right-4 -bottom-4 transform rotate-12" filled />
                        <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/20">
                            <WineIcon className="w-12 h-12 text-white" filled />
                        </div>
                    </div>
                    <div className="p-8 flex-1 flex flex-col">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-wine-600 mb-3 block">Digitalizzazione</span>
                        <h3 className="text-2xl font-serif font-bold text-gray-900 mb-4 group-hover:text-wine-700 transition-colors">La Cantina Digitale: Organizza le tue bottiglie</h3>
                        <p className="text-gray-500 text-sm leading-relaxed mb-6">
                           Scopri come trasformare la tua collezione fisica in un inventario digitale accessibile ovunque, con valutazioni in tempo reale.
                        </p>
                        <div className="mt-auto pt-6 border-t border-gray-50 flex items-center text-wine-700 font-bold text-sm">
                            Leggi la guida <span className="ml-2 transition-transform group-hover:translate-x-1">→</span>
                        </div>
                    </div>
                 </div>

                 {/* Placeholders for future guides */}
                 <div className="bg-stone-100 rounded-3xl p-8 border border-dashed border-stone-200 flex flex-col justify-center items-center text-center opacity-60">
                    <ChefIcon className="w-10 h-10 text-stone-400 mb-4" />
                    <h3 className="font-bold text-stone-500 mb-2">Abbinamenti Perfetti</h3>
                    <p className="text-xs text-stone-400">In arrivo: La scienza dietro l'abbinamento cibo-vino con l'IA.</p>
                 </div>

                 <div className="bg-stone-100 rounded-3xl p-8 border border-dashed border-stone-200 flex flex-col justify-center items-center text-center opacity-60">
                    <ChartBarIcon className="w-10 h-10 text-stone-400 mb-4" />
                    <h3 className="font-bold text-stone-500 mb-2">Investire nel Vino</h3>
                    <p className="text-xs text-stone-400">In arrivo: Come monitorare le annate che aumentano di valore.</p>
                 </div>
              </div>
           </div>
        </div>

        {/* User Call To Action */}
        <div className="bg-wine-50 py-20 px-6">
            <div className="max-w-4xl mx-auto text-center space-y-6">
                <h2 className="text-3xl md:text-4xl font-serif font-bold text-wine-900">
                    Pronto a stappare la tua prima bottiglia digitale?
                </h2>
                <p className="text-wine-800/70 text-lg max-w-xl mx-auto">
                    Inizia subito a catalogare la tua collezione. È semplice, veloce e intelligente.
                </p>
                <button 
                    onClick={onStart}
                    className="px-10 py-4 bg-wine-700 text-white font-bold rounded-xl shadow-lg shadow-wine-200 hover:bg-wine-800 transition-all transform hover:scale-105 text-lg"
                >
                    Crea la tua Cantina
                </button>
            </div>
        </div>

        {/* B2B Section */}
        <div className="bg-gray-900 py-20 px-6 text-white relative overflow-hidden">
             <div className="absolute top-0 right-0 -mr-20 -mt-20 opacity-5">
                 <RestaurantIcon className="w-96 h-96" filled />
             </div>
             
             <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12 items-center relative z-10">
                <div className="space-y-6">
                    <div className="inline-block bg-white/10 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest text-white/80 border border-white/20">
                        Area Business
                    </div>
                    <h2 className="text-3xl md:text-5xl font-serif font-bold leading-tight">
                        Sei un Ristoratore?
                    </h2>
                    <p className="text-gray-400 text-lg leading-relaxed">
                        Offri ai tuoi clienti un'esperienza da Sommelier digitale direttamente al tavolo. 
                        Scrivici e scopri come dare <span className="text-white font-bold">gratuitamente</span> un servizio di qualità innovativo.
                    </p>
                    <a 
                        href="mailto:info@aiknow.wine?subject=Richiesta%20Info%20Ristoratori" 
                        className="inline-flex items-center gap-2 px-8 py-3 bg-white text-gray-900 font-bold rounded-xl hover:bg-gray-100 transition-colors"
                    >
                        Contattaci
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                        </svg>
                    </a>
                </div>
                <div className="bg-white/5 border border-white/10 p-8 rounded-2xl backdrop-blur-sm hidden md:block">
                     <div className="flex items-start gap-4 mb-6">
                         <div className="bg-green-500/20 p-2 rounded-lg text-green-400">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>
                         </div>
                         <div>
                             <h4 className="font-bold text-lg">Menu Digitale AI</h4>
                             <p className="text-sm text-gray-400 mt-1">Niente più PDF statici. Un sommelier interattivo per ogni piatto.</p>
                         </div>
                     </div>
                     <div className="flex items-start gap-4 mb-6">
                         <div className="bg-blue-500/20 p-2 rounded-lg text-blue-400">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>
                         </div>
                         <div>
                             <h4 className="font-bold text-lg">Aumenta le Vendite</h4>
                             <p className="text-sm text-gray-400 mt-1">Guida il cliente verso la bottiglia giusta, aumentando lo scontrino medio.</p>
                         </div>
                     </div>
                     <div className="flex items-start gap-4">
                         <div className="bg-purple-500/20 p-2 rounded-lg text-purple-400">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 0 1-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 0 0 6.16-12.12A14.98 14.98 0 0 0 9.631 8.41m5.96 5.96a14.926 14.926 0 0 1-5.841 2.58m-.119-8.54a6 6 0 0 0-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 0 0-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 0 1-2.448-2.448 14.9 14.9 0 0 1 .06-.312m-2.24 2.39a4.493 4.493 0 0 0-1.757 4.306 4.493 4.493 0 0 0 4.306-1.758M16.5 9a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z" /></svg>
                         </div>
                         <div>
                             <h4 className="font-bold text-lg">Gratuito per Te</h4>
                             <p className="text-sm text-gray-400 mt-1">Configurazione semplice. Nessun costo di gestione mensile.</p>
                         </div>
                     </div>
                </div>
             </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-stone-100 border-t border-gray-200 py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 opacity-50 grayscale hover:grayscale-0 transition-all cursor-pointer" onClick={() => document.querySelector('.h-full')?.scrollTo({ top: 0, behavior: 'smooth' })}>
            <Logo className="w-8 h-8" />
          </div>
          <p className="text-gray-400 text-sm">
            © {new Date().getFullYear()} AIKNOW.WINE. Tutti i diritti riservati.
          </p>
        </div>
      </footer>
    </div>
  );
};

const FeatureCard = ({ icon, title, desc, color }: { icon: React.ReactNode, title: string, desc: string, color: string }) => (
  <div className="bg-stone-50 p-8 rounded-2xl border border-stone-100 hover:shadow-lg transition-shadow group">
    <div className={`w-14 h-14 ${color} rounded-2xl flex items-center justify-center mb-6 shadow-md group-hover:scale-110 transition-transform`}>
      {icon}
    </div>
    <h3 className="font-bold text-xl text-gray-900 mb-3 font-serif">{title}</h3>
    <p className="text-gray-600 text-sm leading-relaxed">{desc}</p>
  </div>
);

export default LandingPage;
