
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
    // Dynamic SEO Titles
    const titles = {
        it: "AIKNOW.WINE Business - Audit Strategico e Carta Vini IA",
        en: "AIKNOW.WINE Business - Strategic Audit and AI Wine List",
        fr: "AIKNOW.WINE Business - Audit Stratégique et Carte des Vins IA",
        es: "AIKNOW.WINE Business - Auditoría Estratégica y Carta de Vinos IA",
        de: "AIKNOW.WINE Business - Strategisches Audit und KI-Weinkarte"
    };
    document.title = titles[language as keyof typeof titles] || titles.en;
    window.scrollTo(0, 0);
  }, [language]);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const getContactMail = () => {
      return `mailto:business@aiknow.wine?subject=Business Info Request [${language.toUpperCase()}]`;
  };

  return (
    <div className="h-full w-full overflow-y-auto bg-white text-gray-900 font-sans selection:bg-emerald-100">
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex justify-between items-center">
          <div className="cursor-pointer transition-transform hover:scale-95" onClick={onBack}>
            <Logo className="w-8 h-8" showText={true} />
          </div>
          <button 
            onClick={() => window.location.href = getContactMail()}
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
              {t('b2b_hero_tag')}
            </div>
            <h1 className="text-5xl md:text-7xl font-serif font-black text-gray-900 leading-[1.1]">
              {t('b2b_title')} <br/>
              <span className="text-emerald-600 italic">{t('b2b_hero_subtitle')}</span>
            </h1>
            <p className="text-xl text-gray-500 leading-relaxed max-w-2xl mx-auto font-medium">
              {t('b2b_desc')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
               <button 
                 onClick={() => window.location.href = getContactMail()}
                 className="px-10 py-5 bg-gray-900 text-white font-bold rounded-2xl shadow-xl hover:bg-black transition-all transform hover:scale-105"
               >
                 {t('b2b_cta_setup')}
               </button>
               <button 
                 onClick={() => scrollToSection('audit')}
                 className="px-10 py-5 bg-white text-emerald-700 border border-emerald-100 font-bold rounded-2xl hover:bg-emerald-50 transition-all"
               >
                 {t('b2b_audit_cta')}
               </button>
            </div>
          </div>
        </section>

        {/* Nuove Features Grid */}
        <section className="max-w-6xl mx-auto px-6 py-10 grid md:grid-cols-3 gap-12">
            <BenefitCard 
                icon={<CameraIcon className="w-8 h-8" />} 
                title={t('b2b_scanner_t')} 
                desc={t('b2b_scanner_d')} 
            />
            <BenefitCard 
                icon={<RestaurantIcon className="w-8 h-8" filled />} 
                title={t('b2b_marketing_t')} 
                desc={t('b2b_marketing_d')} 
            />
            <BenefitCard 
                icon={<ChartBarIcon className="w-8 h-8" filled />} 
                title={t('b2b_analytics_t')} 
                desc={t('b2b_analytics_d')} 
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
                        {t('b2b_audit_title')}
                    </h2>
                    <p className="text-lg text-gray-600 leading-relaxed">
                        {t('b2b_audit_desc')}
                    </p>
                    <ul className="space-y-4">
                        {[
                            t('b2b_audit_check1'),
                            t('b2b_audit_check2'),
                            t('b2b_audit_check3'),
                            t('b2b_audit_check4')
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
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{t('b2b_audit_example_title')}</p>
                                <h4 className="text-2xl font-serif font-bold text-gray-900">{t('b2b_audit_example_res')}</h4>
                            </div>
                            <div className="text-right">
                                <span className="text-4xl font-black text-emerald-600">8.5/10</span>
                                <p className="text-[9px] font-bold text-gray-400 uppercase">{t('b2b_audit_example_quality')}</p>
                            </div>
                        </div>
                        <div className="space-y-6">
                            <div className="bg-stone-50 p-4 rounded-xl italic text-sm text-gray-600 border-l-4 border-emerald-500">
                                "{t('b2b_audit_example_quote')}"
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-green-50 p-3 rounded-xl border border-green-100">
                                    <p className="text-[9px] font-black text-green-700 uppercase mb-1">{t('b2b_audit_example_strength')}</p>
                                    <p className="text-[10px] text-green-800">{t('b2b_audit_example_strength_d')}</p>
                                </div>
                                <div className="bg-red-50 p-3 rounded-xl border border-red-100">
                                    <p className="text-[9px] font-black text-red-700 uppercase mb-1">{t('b2b_audit_example_gap')}</p>
                                    <p className="text-[10px] text-red-800">{t('b2b_audit_example_gap_d')}</p>
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
                    {t('b2b_free_desc')}
                </p>
                <div className="grid sm:grid-cols-2 gap-4 mb-12 max-w-2xl mx-auto">
                    {[
                        t('b2b_check1'),
                        t('b2b_check2'),
                        t('b2b_check3'),
                        t('b2b_check4')
                    ].map((check, i) => (
                        <div key={i} className="flex items-center justify-center gap-2 text-emerald-600 font-bold bg-emerald-50 py-3 rounded-xl border border-emerald-100">
                            <ShieldCheckIcon className="w-5 h-5" filled /> {check}
                        </div>
                    ))}
                </div>
                <button 
                  onClick={() => window.location.href = getContactMail()}
                  className="bg-emerald-600 text-white px-12 py-5 rounded-2xl font-bold text-xl hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-200 active:scale-95"
                >
                    {t('b2b_cta_setup')}
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
