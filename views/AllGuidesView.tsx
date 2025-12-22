
import React, { useEffect } from 'react';
import { Logo } from '../components/Logo';
import { WineIcon, ChefIcon, RestaurantIcon, ShopIcon, ChartBarIcon, UserIcon, HistoryIcon } from '../components/Icons';

interface AllGuidesViewProps {
  onBack: () => void;
  onOpenGuide: (slug: string) => void;
}

const AllGuidesView: React.FC<AllGuidesViewProps> = ({ onBack, onOpenGuide }) => {
  
  useEffect(() => {
    document.title = "Archivio Guide e Academy - AIKNOW.WINE";
    window.scrollTo(0, 0);
  }, []);

  const guides = [
    { slug: 'cantina-digitale', title: 'La Cantina Digitale', desc: 'Come catalogare le tue bottiglie con l\'IA.', icon: WineIcon, color: 'bg-wine-800' },
    { slug: 'sommelier-a-casa', title: 'Il Sommelier a Casa', desc: 'Abbinamenti perfetti per le tue cene.', icon: ChefIcon, color: 'bg-amber-600' },
    { slug: 'al-ristorante', title: 'Al Ristorante', desc: 'Scegli dalla carta dei vini come un pro.', icon: RestaurantIcon, color: 'bg-emerald-600' },
    { slug: 'acquisti-intelligenti', title: 'Acquisti Intelligenti', desc: 'Analisi prezzi e coerenza di acquisto.', icon: ShopIcon, color: 'bg-indigo-600' },
    { slug: 'analisi-e-roi', title: 'Analisi & ROI', desc: 'Monitora il valore della tua collezione.', icon: ChartBarIcon, color: 'bg-slate-800' },
    { slug: 'analisi-sommelier', title: 'Analisi Sommelier IA', desc: 'Il tuo profilo palato e gap analysis.', icon: UserIcon, color: 'bg-purple-700' },
    { slug: 'storico-degustazioni', title: 'Storico & Memorie', desc: 'Il diario immortale delle tue bevute.', icon: HistoryIcon, color: 'bg-stone-700' },
  ];

  return (
    <div className="h-full w-full overflow-y-auto bg-stone-50 text-gray-900 font-sans">
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-6 h-16 flex justify-between items-center">
          <div className="cursor-pointer transition-transform hover:scale-95" onClick={onBack}>
            <Logo className="w-8 h-8" showText={true} />
          </div>
          <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Academy</span>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-12">
        <header className="mb-12">
          <h1 className="text-4xl font-serif font-black text-gray-900 mb-4">Wine Academy</h1>
          <p className="text-gray-500 max-w-2xl">
            Tutto quello che devi sapere per gestire la tua passione con l'intelligenza artificiale. Dai primi passi alla strategia avanzata.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {guides.map((guide) => (
            <div 
              key={guide.slug}
              onClick={() => onOpenGuide(guide.slug)}
              className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer group flex items-start gap-4"
            >
              <div className={`${guide.color} p-3 rounded-2xl shrink-0 group-hover:scale-110 transition-transform`}>
                <guide.icon className="w-6 h-6 text-white" filled />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 group-hover:text-wine-700 transition-colors">{guide.title}</h3>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">{guide.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </main>

      <footer className="bg-white border-t border-gray-200 py-12 mt-12">
        <div className="max-w-5xl mx-auto px-6 text-center text-xs text-gray-400 font-bold uppercase tracking-widest">
            AIKNOW.WINE &bull; Smart Sommelier
        </div>
      </footer>
    </div>
  );
};

export default AllGuidesView;
