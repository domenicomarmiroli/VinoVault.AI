
import React from 'react';
import { Logo } from './Logo';
import { WineIcon, ChefIcon, ShopIcon, ChartBarIcon, RestaurantIcon, UserIcon, HistoryIcon, ShieldCheckIcon } from './Icons';

interface LandingPageProps {
  onStart: () => void;
  onOpenGuide?: (slug: string) => void;
  onViewAllGuides?: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onStart, onOpenGuide, onViewAllGuides }) => {
  
  const guideItems = [
    { slug: 'cantina-digitale', title: 'La Cantina Digitale', desc: 'Digitalizza le tue bottiglie con un click.', icon: WineIcon, color: 'bg-wine-800', tag: 'Gestione' },
    { slug: 'sommelier-a-casa', title: 'Il Sommelier a Casa', desc: 'Abbinamenti perfetti per le tue cene.', icon: ChefIcon, color: 'bg-amber-600', tag: 'Cena' },
    { slug: 'al-ristorante', title: 'Al Ristorante', desc: 'Scegli dalla carta dei vini come un pro.', icon: RestaurantIcon, color: 'bg-emerald-600', tag: 'Gourmet' },
    { slug: 'acquisti-intelligenti', title: 'Acquisti Intelligenti', desc: 'Analisi prezzi e coerenza di acquisto.', icon: ShopIcon, color: 'bg-indigo-600', tag: 'Shopping' },
    { slug: 'analisi-e-roi', title: 'Analisi & ROI', desc: 'Il valore del tuo patrimonio vinicolo.', icon: ChartBarIcon, color: 'bg-slate-800', tag: 'Finanza' },
    { slug: 'analisi-sommelier', title: 'Profilo Sensoriale IA', desc: 'Il tuo profilo palato e gap analysis.', icon: UserIcon, color: 'bg-purple-700', tag: 'Strategia' },
    { slug: 'storico-degustazioni', title: 'Storico & Memorie', desc: 'Il diario immortale delle tue bevute.', icon: HistoryIcon, color: 'bg-stone-700', tag: 'Memoria' },
  ];

  return (
    <div className="h-full overflow-y-auto bg-white flex flex-col font-sans scroll-smooth">
      {/* Navbar Estesa */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100">
        <div className="flex justify-between items-center p-4 md:p-6 max-w-7xl mx-auto w-full">
            <div className="cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                <Logo className="w-10 h-10" />
            </div>
            <div className="hidden md:flex items-center gap-8 text-sm font-bold text-gray-500 uppercase tracking-widest">
                <a href="#how-it-works" className="hover:text-wine-700 transition-colors">Come Funziona</a>
                <a href="#features" className="hover:text-wine-700 transition-colors">Funzionalità</a>
                <a href="#academy" className="hover:text-wine-700 transition-colors">Academy</a>
            </div>
            <button 
              onClick={onStart}
              className="bg-wine-700 text-white font-bold px-6 py-2.5 rounded-xl hover:bg-wine-800 transition-all text-sm shadow-lg shadow-wine-100"
            >
              Accedi
            </button>
        </div>
      </nav>

      {/* Hero Section SEO Optimized */}
      <main className="flex-1 flex flex-col">
        <section className="px-6 py-16 md:py-32 max-w-7xl mx-auto w-full grid lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8 animate-in slide-in-from-bottom duration-700">
            <div className="inline-block bg-wine-50 text-wine-700 text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-widest border border-wine-100">
              Il Futuro del Vino è qui
            </div>
            <h1 className="text-5xl md:text-7xl font-serif font-black text-gray-900 leading-[1.1]">
              Il tuo Sommelier <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-wine-700 to-wine-500">
                Personale guidato dall'IA.
              </span>
            </h1>
            <p className="text-xl text-gray-500 leading-relaxed max-w-xl">
              AIKNOW.WINE è l'applicazione definitiva per la <strong>gestione cantina digitale</strong> e l'analisi sensoriale. Digitalizza le tue etichette, scopri abbinamenti perfetti e monitora i tuoi investimenti vinicoli con l'intelligenza artificiale.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button 
                onClick={onStart}
                className="px-10 py-5 bg-wine-700 text-white font-bold rounded-2xl shadow-xl shadow-wine-200 hover:bg-wine-800 transition-all transform hover:scale-105 text-lg text-center"
              >
                Inizia Ora Gratis
              </button>
              <a href="#how-it-works" className="px-10 py-5 bg-white text-gray-700 border border-gray-200 font-bold rounded-2xl hover:bg-gray-50 transition-colors text-lg text-center">
                Scopri di più
              </a>
            </div>
          </div>
          
          <div className="relative group hidden lg:block">
             <div className="absolute -inset-4 bg-gradient-to-tr from-wine-100 to-cyan-100 rounded-[3rem] blur-2xl opacity-50 group-hover:opacity-80 transition-opacity"></div>
             <div className="relative aspect-square bg-gradient-to-br from-gray-900 to-wine-900 rounded-[2.5rem] overflow-hidden shadow-2xl flex items-center justify-center border border-white/10">
                 <div className="text-center p-12">
                     <Logo className="w-40 h-40 mx-auto mb-8 drop-shadow-2xl" light showText={false} />
                     <h3 className="text-white text-3xl font-serif italic mb-2">"Il calice perfetto,"</h3>
                     <p className="text-white/60 text-xl font-serif">scelto dalla tua intelligenza.</p>
                 </div>
             </div>
          </div>
        </section>

        {/* Content Section SEO */}
        <section id="how-it-works" className="bg-stone-50 py-24 px-6 border-y border-gray-100">
           <div className="max-w-4xl mx-auto space-y-12">
              <div className="text-center">
                 <h2 className="text-3xl md:text-5xl font-serif font-bold text-gray-900 mb-6">Un'Esperienza da Sommelier Digitale</h2>
                 <p className="text-lg text-gray-600 leading-relaxed">
                   AIKNOW.WINE non è un semplice database, ma un assistente evoluto che utilizza modelli linguistici di ultima generazione per interpretare le tue preferenze sensoriali. La nostra piattaforma risolve il problema della <strong>gestione cantina domestica</strong>, offrendo strumenti per catalogare bottiglie, monitorare il ROI degli investimenti e ricevere consigli di abbinamento cibo-vino basati sul profilo molecolare delle pietanze.
                 </p>
              </div>

              <div className="grid md:grid-cols-2 gap-12 pt-8">
                 <div className="space-y-4">
                    <h3 className="text-2xl font-serif font-bold text-wine-800">Ottimizzazione Cantina</h3>
                    <p className="text-gray-500 leading-relaxed">
                      Cataloghiamo automaticamente annate, vitigni e regioni partendo da una semplice foto dell'etichetta. Saprai sempre quando una bottiglia raggiunge il suo <strong>picco di bevibilità</strong>, evitando di stappare i tuoi vini troppo presto o troppo tardi.
                    </p>
                 </div>
                 <div className="space-y-4">
                    <h3 className="text-2xl font-serif font-bold text-cyan-700">Analisi e Valutazione ROI</h3>
                    <p className="text-gray-500 leading-relaxed">
                      Il vino è un patrimonio liquido. Aiknow monitora le fluttuazioni di mercato per fornirti una stima in tempo reale del valore della tua collezione. Identifica i migliori affari in enoteca grazie al nostro <strong>Shop Advisor intelligente</strong>.
                    </p>
                 </div>
              </div>
           </div>
        </section>

        {/* Features section */}
        <section id="features" className="bg-white py-24">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-20">
              <h2 className="text-4xl font-serif font-bold text-gray-900 mb-4">Potenzia la tua Passione</h2>
              <p className="text-gray-500 max-w-2xl mx-auto">Tutte le funzionalità di cui un Wine Lover moderno ha bisogno, racchiuse in un'unica web-app.</p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              <FeatureCard 
                icon={<WineIcon className="w-8 h-8 text-white" />}
                title="Cantina Digitale"
                desc="Aggiungi vini fotografando l'etichetta. IA riconosce istantaneamente tutti i dati tecnici."
                color="bg-wine-600"
              />
              <FeatureCard 
                icon={<ChefIcon className="w-8 h-8 text-white" />}
                title="Sommelier IA"
                desc="Inserisci il menu della serata e ricevi l'abbinamento perfetto pescando dalla tua cantina reale."
                color="bg-amber-500"
              />
              <FeatureCard 
                icon={<ShopIcon className="w-8 h-8 text-white" />}
                title="Shop Advisor"
                desc="Benchmark prezzi in tempo reale. Scopri se il vino in enoteca è un affare o se è troppo caro."
                color="bg-emerald-600"
              />
              <FeatureCard 
                icon={<ChartBarIcon className="w-8 h-8 text-white" />}
                title="Analisi Strategica"
                desc="Report sul profilo del palato, ROI della collezione e analisi dei gap della tua cantina."
                color="bg-indigo-600"
              />
            </div>
          </div>
        </section>

        {/* Carousel Academy Section */}
        <section id="academy" className="bg-stone-50 py-24 border-b border-gray-200 overflow-hidden">
           <div className="max-w-7xl mx-auto px-6">
              <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
                 <div>
                    <h2 className="text-4xl font-serif font-bold text-gray-900 mb-2">Wine Academy</h2>
                    <p className="text-gray-500 text-lg">Scopri come gestire la tua collezione come un professionista.</p>
                 </div>
                 <button 
                    onClick={onViewAllGuides}
                    className="text-wine-700 font-bold text-sm uppercase tracking-widest hover:bg-wine-100 px-4 py-2 rounded-lg transition-all flex items-center gap-2 border border-wine-100"
                 >
                    Vedi Tutto <span className="text-xl">→</span>
                 </button>
              </div>

              <div className="relative -mx-6 px-6">
                  <div className="flex gap-6 overflow-x-auto pb-12 no-scrollbar snap-x snap-mandatory">
                     {guideItems.map((item) => (
                        <div 
                           key={item.slug}
                           onClick={() => onOpenGuide?.(item.slug)}
                           className="flex-shrink-0 w-[300px] md:w-[350px] snap-start bg-white rounded-[2rem] overflow-hidden shadow-sm hover:shadow-2xl transition-all cursor-pointer group flex flex-col h-full border border-gray-100"
                        >
                           <div className={`h-48 ${item.color} flex items-center justify-center relative overflow-hidden shrink-0`}>
                               <div className="bg-white/10 backdrop-blur-md p-5 rounded-[1.5rem] border border-white/20 relative z-10 group-hover:scale-110 transition-transform duration-500">
                                   <item.icon className="w-12 h-12 text-white" filled />
                               </div>
                               <div className="absolute -right-8 -bottom-8 opacity-10">
                                  <item.icon className="w-40 h-40 text-white" filled />
                               </div>
                           </div>
                           <div className="p-8 flex-1 flex flex-col">
                               <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3 block">{item.tag}</span>
                               <h3 className="text-2xl font-serif font-bold text-gray-900 mb-3 group-hover:text-wine-700 transition-colors leading-tight">{item.title}</h3>
                               <p className="text-gray-500 text-sm leading-relaxed mb-6">{item.desc}</p>
                               <div className="mt-auto pt-6 border-t border-gray-50 flex items-center text-wine-700 font-bold text-xs uppercase tracking-wider">
                                   Leggi <span className="ml-3 transition-transform group-hover:translate-x-2">→</span>
                               </div>
                           </div>
                        </div>
                     ))}
                  </div>
              </div>
           </div>
        </section>

        {/* FAQ SEO */}
        <section className="bg-white py-24 px-6">
           <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-serif font-bold text-gray-900 mb-12 text-center">Domande Frequenti</h2>
              <div className="grid gap-8">
                 <div>
                    <h4 className="font-bold text-lg text-gray-900 mb-2">Come funziona l'analisi del vino con IA?</h4>
                    <p className="text-gray-500 leading-relaxed">Utilizziamo la tecnologia Google Gemini per analizzare le immagini delle etichette e interpretare i dati storici del mercato, offrendo una valutazione oggettiva della qualità e del prezzo.</p>
                 </div>
                 <div>
                    <h4 className="font-bold text-lg text-gray-900 mb-2">Posso usare Aiknow.wine su iPhone o Android?</h4>
                    <p className="text-gray-500 leading-relaxed">Aiknow è una Progressive Web App ottimizzata per tutti i dispositivi mobile. Non serve scaricare nulla dallo store, basta accedere via browser.</p>
                 </div>
              </div>
           </div>
        </section>

        {/* CTA finale */}
        <section className="bg-wine-900 py-32 px-6 text-white text-center relative overflow-hidden">
            <div className="max-w-4xl mx-auto relative z-10 space-y-10">
                <h2 className="text-4xl md:text-6xl font-serif font-bold leading-tight">Pronto a trasformare <br/>la tua cantina?</h2>
                <button 
                    onClick={onStart}
                    className="px-12 py-6 bg-white text-wine-900 font-black rounded-[2rem] shadow-2xl hover:bg-stone-100 transition-all transform hover:scale-105 text-xl"
                >
                    Entra in AIKNOW.WINE
                </button>
            </div>
        </section>
      </main>

      {/* Footer SEO */}
      <footer className="bg-gray-950 text-gray-400 py-20 px-6">
        <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-12">
          <div className="col-span-2 space-y-6">
            <Logo light className="w-12 h-12" />
            <p className="max-w-sm text-sm">Aiknow.wine: La piattaforma intelligente per il Wine Lover moderno. Powered by AIKNOW.IO.</p>
          </div>
          <div className="space-y-4">
            <h5 className="text-white font-bold text-sm uppercase">Link</h5>
            <ul className="space-y-2 text-sm">
                <li><a href="#how-it-works" className="hover:text-wine-400">Come funziona</a></li>
                <li><button onClick={onViewAllGuides} className="hover:text-wine-400">Academy</button></li>
            </ul>
          </div>
          <div className="space-y-4">
            <h5 className="text-white font-bold text-sm uppercase">Legal</h5>
            <ul className="space-y-2 text-sm text-xs opacity-60">
                <li>Privacy Policy</li>
                <li>Termini di Servizio</li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  );
};

const FeatureCard = ({ icon, title, desc, color }: { icon: React.ReactNode, title: string, desc: string, color: string }) => (
  <div className="bg-stone-50 p-10 rounded-[2.5rem] border border-stone-100 hover:shadow-xl transition-all group duration-500">
    <div className={`w-16 h-16 ${color} rounded-[1.5rem] flex items-center justify-center mb-8 shadow-lg group-hover:scale-110 transition-transform duration-500`}>
      {icon}
    </div>
    <h3 className="font-bold text-2xl text-gray-900 mb-4 font-serif">{title}</h3>
    <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
  </div>
);

export default LandingPage;
