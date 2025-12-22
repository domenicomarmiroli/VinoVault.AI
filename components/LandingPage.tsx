
import React from 'react';
import { Logo } from './Logo';
import { WineIcon, ChefIcon, ShopIcon, ChartBarIcon, RestaurantIcon, UserIcon, HistoryIcon } from './Icons';

interface LandingPageProps {
  onStart: () => void;
  onOpenGuide?: (slug: string) => void;
  onViewAllGuides?: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onStart, onOpenGuide, onViewAllGuides }) => {
  
  const guideItems = [
    { slug: 'cantina-digitale', title: 'La Cantina Digitale', desc: 'Digitalizza le tue bottiglie.', icon: WineIcon, color: 'bg-wine-800', tag: 'Gestione' },
    { slug: 'sommelier-a-casa', title: 'Il Sommelier a Casa', desc: 'Abbinamenti perfetti per le cene.', icon: ChefIcon, color: 'bg-amber-600', tag: 'Cena' },
    { slug: 'al-ristorante', title: 'Al Ristorante', desc: 'Scegli il vino come un professionista.', icon: RestaurantIcon, color: 'bg-emerald-600', tag: 'Gourmet' },
    { slug: 'acquisti-intelligenti', title: 'Acquisti Intelligenti', desc: 'Analisi prezzi e coerenza acquisto.', icon: ShopIcon, color: 'bg-indigo-600', tag: 'Shopping' },
    { slug: 'analisi-e-roi', title: 'Analisi & ROI', desc: 'Il valore del tuo patrimonio.', icon: ChartBarIcon, color: 'bg-slate-800', tag: 'Finanza' },
    { slug: 'analisi-sommelier', title: 'Analisi Sommelier IA', desc: 'Il tuo profilo palato e gap analysis.', icon: UserIcon, color: 'bg-purple-700', tag: 'Strategia' },
    { slug: 'storico-degustazioni', title: 'Storico & Memorie', desc: 'Il diario delle tue bevute.', icon: HistoryIcon, color: 'bg-stone-700', tag: 'Memoria' },
  ];

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
                desc="Sei in enoteca o stai per acquistare online? Scansiona la bottiglia o incolla il link per analisi istantanee."
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

        {/* --- Guide SEO Section con CAROUSEL --- */}
        <div className="bg-stone-50 py-20 border-b border-gray-200 overflow-hidden">
           <div className="max-w-7xl mx-auto px-6">
              <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
                 <div>
                    <h2 className="text-3xl md:text-4xl font-serif font-bold text-gray-900 mb-2">Wine Academy</h2>
                    <p className="text-gray-500">Approfondimenti e tutorial su come migliorare la gestione del tuo vino.</p>
                 </div>
                 <button 
                    onClick={onViewAllGuides}
                    className="text-wine-700 font-bold text-sm uppercase tracking-widest hover:underline flex items-center gap-2"
                 >
                    Vedi tutto <span className="text-xl">→</span>
                 </button>
              </div>

              {/* Carousel Container */}
              <div className="relative -mx-6 px-6">
                  <div className="flex gap-6 overflow-x-auto pb-8 no-scrollbar snap-x snap-mandatory">
                     {guideItems.map((item) => (
                        <div 
                           key={item.slug}
                           onClick={() => onOpenGuide?.(item.slug)}
                           className="flex-shrink-0 w-[280px] md:w-[320px] snap-start bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all cursor-pointer group flex flex-col h-full border border-gray-100"
                        >
                           <div className={`h-40 ${item.color} flex items-center justify-center relative overflow-hidden shrink-0`}>
                               <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 relative z-10">
                                   <item.icon className="w-10 h-10 text-white" filled />
                               </div>
                               <div className="absolute -right-4 -bottom-4 opacity-10">
                                  <item.icon className="w-32 h-32 text-white" filled />
                               </div>
                           </div>
                           <div className="p-6 flex-1 flex flex-col">
                               <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2 block">{item.tag}</span>
                               <h3 className="text-lg font-serif font-bold text-gray-900 mb-2 group-hover:text-wine-700 transition-colors leading-tight">{item.title}</h3>
                               <p className="text-gray-500 text-xs leading-relaxed mb-4">
                                  {item.desc}
                               </p>
                               <div className="mt-auto pt-4 border-t border-gray-50 flex items-center text-wine-700 font-bold text-[10px] uppercase">
                                   Leggi la guida <span className="ml-2 transition-transform group-hover:translate-x-1">→</span>
                               </div>
                           </div>
                        </div>
                     ))}
                  </div>
                  {/* Indicatori di scorrimento mobile */}
                  <div className="flex justify-center gap-1.5 md:hidden mt-4">
                      {guideItems.map((_, i) => (
                          <div key={i} className={`h-1 rounded-full transition-all ${i === 0 ? 'w-4 bg-wine-600' : 'w-1 bg-gray-300'}`}></div>
                      ))}
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
