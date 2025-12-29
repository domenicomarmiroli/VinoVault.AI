
import React, { useEffect } from 'react';
import { Logo } from '../components/Logo';
import { RestaurantIcon, ChefIcon, StarIcon, ShieldCheckIcon, CameraIcon, ChartBarIcon, PlusIcon } from '../components/Icons';
import { useLanguage } from '../contexts/LanguageContext';

interface RestaurantBusinessViewProps {
  onBack: () => void;
  onContact: () => void;
}

const RestaurantBusinessView: React.FC<RestaurantBusinessViewProps> = ({ onBack, onContact }) => {
  const { t, language } = useLanguage();
  
  useEffect(() => {
    document.title = `AIKNOW.WINE Business - Audit Strategico e Carta Vini IA`;
    window.scrollTo(0, 0);
  }, [language]);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="h-full w-full overflow-y-auto bg-white text-gray-900 font-sans selection:bg-emerald-100">
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex justify-between items-center">
          <div className="cursor-pointer transition-transform hover:scale-95" onClick={onBack}>
            <Logo className="w-8 h-8" showText={true} />
          </div>
          <button 
            onClick={() => window.location.href = `mailto:business@aiknow.wine?subject=Business Info Request [${language.toUpperCase()}]`}
            className="bg-emerald-600 text-white px-6 py-2 rounded-xl text-sm font-bold shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all"
          >
            {t('b2b_contact_free')}
          </button>
        </div>
      </nav>

      <main>
        {/* Hero Section */}
        <section className="px-6 py-16 md:py-28 bg-gradient-to-b from-emerald-50/50 to-white overflow-hidden relative">
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-emerald-100/50 rounded-full blur-3xl opacity-50"></div>
          <div className="max-w-4xl mx-auto text-center space-y-8 relative z-10">
            <div className="inline-block bg-emerald-100 text-emerald-700 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em]">
              Smart Restaurant Solutions
            </div>
            <h1 className="text-5xl md:text-7xl font-serif font-black text-gray-900 leading-[1.1]">
              L'Intelligenza Artificiale <br/>
              <span className="text-emerald-600 italic">al servizio del tuo locale.</span>
            </h1>
            <p className="text-xl text-gray-500 leading-relaxed max-w-2xl mx-auto font-medium">
              Sostituisci la carta vini cartacea con un Sommelier Virtuale che conosce ogni tuo piatto e analizza tecnicamente la tua cantina.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
               <button 
                 onClick={() => window.location.href = 'mailto:business@aiknow.wine'}
                 className="px-10 py-5 bg-gray-900 text-white font-bold rounded-2xl shadow-xl hover:bg-black transition-all transform hover:scale-105"
               >
                 {t('b2b_cta_setup')}
               </button>
               <button 
                 onClick={() => scrollToSection('audit')}
                 className="px-10 py-5 bg-white text-emerald-700 border border-emerald-100 font-bold rounded-2xl hover:bg-emerald-50 transition-all"
               >
                 Scopri l'Audit Strategico
               </button>
            </div>
          </div>
        </section>

        {/* Nuove Features Grid */}
        <section className="max-w-6xl mx-auto px-6 py-10 grid md:grid-cols-3 gap-12">
            <BenefitCard 
                icon={<CameraIcon className="w-8 h-8" />} 
                title="Scanner Professionale" 
                desc="Carica la tua carta vini in PDF o scattando una foto. L'IA estrae nomi, annate e produttori in pochi secondi." 
            />
            <BenefitCard 
                icon={<RestaurantIcon className="w-8 h-8" filled />} 
                title="Marketing Kit Ready" 
                desc="Generiamo QR Code personalizzati per i tuoi tavoli. I clienti accedono alla carta senza scaricare nessuna app." 
            />
            <BenefitCard 
                icon={<ChartBarIcon className="w-8 h-8" filled />} 
                title="Analytics Clienti" 
                desc="Monitora quali vini vengono cercati di più e quali abbinamenti riscuotono maggior successo nel tuo locale." 
            />
        </section>

        {/* FOCUS: Audit Strategico */}
        <section id="audit" className="bg-stone-50 py-24 px-6 border-y border-gray-100 overflow-hidden">
            <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
                <div className="space-y-8">
                    <div className="bg-emerald-600 w-16 h-16 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-200">
                        <ShieldCheckIcon className="w-10 h-10" filled />
                    </div>
                    <h2 className="text-4xl md:text-5xl font-serif font-black text-gray-900 leading-tight">
                        Un Master Sommelier <br/>
                        <span className="text-emerald-600">che valuta il tuo business.</span>
                    </h2>
                    <p className="text-lg text-gray-600 leading-relaxed">
                        La nostra tecnologia non si limita a mostrare le bottiglie. Esegue un <strong>Audit Tecnico Professionale</strong> incrociando il tuo Menù Piatti con la tua Carta Vini.
                    </p>
                    <ul className="space-y-4">
                        {[
                            "Voto tecnico da 0 a 10 sulla coerenza dell'offerta",
                            "Analisi dei punti di forza e aree di miglioramento",
                            "Gap Analysis: etichette mancanti per completare il menù",
                            "Suggerimenti di acquisto strategici basati sulla cucina"
                        ].map((item, i) => (
                            <li key={i} className="flex gap-3 items-start text-gray-700 font-medium">
                                <span className="bg-emerald-100 text-emerald-600 rounded-full p-1 shrink-0"><PlusIcon className="w-3 h-3" /></span>
                                {item}
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="relative">
                    <div className="absolute -inset-4 bg-emerald-500/10 rounded-[3rem] blur-3xl"></div>
                    <div className="relative bg-white rounded-[2.5rem] p-8 shadow-2xl border border-emerald-100">
                        <div className="flex justify-between items-end mb-8 border-b border-gray-100 pb-6">
                            <div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Esempio Audit Tecnico</p>
                                <h4 className="text-2xl font-serif font-bold text-gray-900">Ristorante L'Orizzonte</h4>
                            </div>
                            <div className="text-right">
                                <span className="text-4xl font-black text-emerald-600">8.5/10</span>
                                <p className="text-[9px] font-bold text-gray-400 uppercase">Qualità Coerenza</p>
                            </div>
                        </div>
                        <div className="space-y-6">
                            <div className="bg-stone-50 p-4 rounded-xl italic text-sm text-gray-600 border-l-4 border-emerald-500">
                                "Ottima selezione di bollicine per gli antipasti crudi, ma manca profondità nei rossi d'annata per accompagnare i secondi di cacciagione in menù."
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-green-50 p-3 rounded-xl border border-green-100">
                                    <p className="text-[9px] font-black text-green-700 uppercase mb-1">Forza</p>
                                    <p className="text-[10px] text-green-800">Sinergia territoriale perfetta tra bianchi e pescato.</p>
                                </div>
                                <div className="bg-red-50 p-3 rounded-xl border border-red-100">
                                    <p className="text-[9px] font-black text-red-700 uppercase mb-1">Gap</p>
                                    <p className="text-[10px] text-red-800">Mancano vitigni internazionali per target estero.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        {/* Pricing/Free CTA */}
        <section className="bg-gray-950 py-24 px-6 relative overflow-hidden">
            <div className="absolute inset-0 opacity-10 pointer-events-none">
                <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none"><path d="M0 100 C 20 0 50 0 100 100 Z" fill="currentColor" /></svg>
            </div>
            
            <div className="max-w-4xl mx-auto bg-white rounded-[3rem] p-10 md:p-20 shadow-2xl relative z-10 text-center">
                <h2 className="text-3xl md:text-5xl font-serif font-black mb-6">{t('b2b_free_title')}</h2>
                <p className="text-lg text-gray-600 mb-10 leading-relaxed">
                    Stiamo digitalizzando i migliori ristoranti d'Europa. Entra a far parte del network AIKNOW.WINE con un'offerta di lancio irripetibile.
                </p>
                <div className="grid sm:grid-cols-2 gap-4 mb-12 max-w-2xl mx-auto">
                    {[
                        t('b2b_check1'),
                        "Audit IA Illimitati",
                        "QR Code Marketing Kit",
                        t('b2b_check4')
                    ].map((check, i) => (
                        <div key={i} className="flex items-center justify-center gap-2 text-emerald-600 font-bold bg-emerald-50 py-3 rounded-xl border border-emerald-100">
                            <ShieldCheckIcon className="w-5 h-5" filled /> {check}
                        </div>
                    ))}
                </div>
                <button 
                  onClick={() => window.location.href = 'mailto:business@aiknow.wine'}
                  className="bg-emerald-600 text-white px-12 py-5 rounded-2xl font-bold text-xl hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-200 active:scale-95"
                >
                    Inizia la Digitalizzazione
                </button>
            </div>
        </section>
      </main>

      <footer className="bg-white py-16 text-center border-t border-gray-100">
          <Logo className="w-8 h-8 mx-auto mb-4 opacity-50" showText={false} />
          <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">AIKNOW.WINE &bull; Digital Sommelier Solutions for Business</p>
      </footer>
    </div>
  );
}; 

const BenefitCard = ({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) => (
    <div className="space-y-6 p-8 rounded-[2rem] bg-stone-50 border border-stone-100 hover:shadow-xl transition-all group">
        <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-emerald-600 shadow-sm group-hover:scale-110 transition-transform">{icon}</div>
        <h3 className="text-2xl font-bold font-serif text-gray-900">{title}</h3>
        <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
    </div>
);

export default RestaurantBusinessView;
