
import React from 'react';
import { Logo } from './Logo';
import { WineIcon, ChefIcon, ShopIcon, ChartBarIcon } from './Icons';

interface LandingPageProps {
  onStart: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onStart }) => {
  return (
    <div className="min-h-screen bg-stone-50 flex flex-col font-sans">
      {/* Navbar */}
      <nav className="flex justify-between items-center p-6 max-w-7xl mx-auto w-full">
        <div className="transform scale-90 origin-left">
          <Logo />
        </div>
        <button 
          onClick={onStart}
          className="text-wine-700 font-bold hover:bg-wine-50 px-4 py-2 rounded-lg transition-colors text-sm"
        >
          Accedi
        </button>
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
          
          {/* Hero Visual Abstract */}
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
        <div id="features" className="bg-white py-16 md:py-24">
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
                desc="Sei in enoteca? Scansiona una bottiglia per sapere se il prezzo è onesto e se vale l'acquisto."
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
      </main>

      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-200 py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 opacity-50 grayscale hover:grayscale-0 transition-all">
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
