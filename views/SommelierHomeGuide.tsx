
import React, { useEffect } from 'react';
import { Logo } from '../components/Logo';
import { ChefIcon, ClockIcon, HistoryIcon } from '../components/Icons';
import { useLanguage } from '../contexts/LanguageContext';

interface SommelierHomeGuideProps {
  onBack: () => void;
  onStart: () => void;
}

const SommelierHomeGuide: React.FC<SommelierHomeGuideProps> = ({ onBack, onStart }) => {
  const { t } = useLanguage();
  
  useEffect(() => {
    document.title = `${t('gh_title')} - AIKNOW.WINE`;
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="h-full w-full overflow-y-auto bg-stone-50 text-gray-900 font-sans selection:bg-wine-100 animate-in fade-in duration-500">
      <nav className="sticky top-0 z-50 bg-stone-50/90 backdrop-blur-md border-b border-stone-200">
        <div className="max-w-4xl mx-auto px-6 h-16 flex justify-between items-center">
          <div className="cursor-pointer transition-transform hover:scale-95" onClick={onBack}>
            <Logo className="w-8 h-8" showText={true} />
          </div>
          <button 
            onClick={onStart}
            className="bg-wine-700 text-white px-5 py-2 rounded-full text-sm font-bold shadow-md hover:bg-wine-800 transition-all"
          >
            {t('guide_start_now')}
          </button>
        </div>
      </nav>

      <article className="max-w-3xl mx-auto px-6 py-12 md:py-20">
        <header className="mb-16 text-center md:text-left">
          <span className="text-wine-600 font-bold uppercase tracking-widest text-xs mb-4 block">{t('gh_tag')}</span>
          <h1 className="text-4xl md:text-6xl font-serif font-black text-gray-900 leading-tight mb-6">
            {t('gh_title')} <br/>
            <span className="text-wine-700">{t('gh_subtitle')}</span>
          </h1>
          <p className="text-xl text-gray-600 leading-relaxed italic max-w-2xl">
            {t('gh_intro')}
          </p>
        </header>

        <section className="grid gap-12 mb-20">
          <div className="bg-white rounded-[2rem] p-8 md:p-12 shadow-xl shadow-stone-200/50 border border-stone-100 flex flex-col md:flex-row gap-10 items-center">
            <div className="shrink-0 bg-amber-50 p-6 rounded-3xl">
              <ChefIcon className="w-16 h-16 text-amber-600" filled />
            </div>
            <div>
              <h2 className="text-2xl font-serif font-bold mb-4 text-gray-800">{t('gh_feature_1_t')}</h2>
              <p className="text-gray-600 leading-relaxed">
                {t('gh_feature_1_d')}
              </p>
            </div>
          </div>
        </section>

        <section className="mb-20 text-center py-12 border-y border-stone-200">
           <blockquote className="text-2xl font-serif italic text-gray-500">
             "{t('gh_quote')}"
           </blockquote>
        </section>

        <section className="mb-20">
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { t: t('gh_step_1_t'), d: t('gh_step_1_d') },
              { t: t('gh_step_2_t'), d: t('gh_step_2_d') },
              { t: t('gh_step_3_t'), d: t('gh_step_3_d') }
            ].map((step, i) => (
              <div key={i} className="text-center group">
                <div className="w-12 h-12 bg-stone-200 rounded-full flex items-center justify-center mx-auto mb-4 font-bold text-lg group-hover:bg-wine-600 group-hover:text-white transition-colors">
                  {i+1}
                </div>
                <h4 className="font-bold mb-2">{step.t}</h4>
                <p className="text-xs text-gray-500 leading-relaxed">{step.d}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-wine-900 rounded-[2.5rem] p-10 md:p-16 text-white text-center shadow-2xl relative overflow-hidden">
          <div className="relative z-10">
              <h2 className="text-3xl md:text-5xl font-serif font-bold mb-6">{t('gh_cta')}</h2>
              <button 
                onClick={onStart}
                className="bg-white text-wine-900 px-12 py-5 rounded-2xl font-bold text-xl hover:bg-stone-100 transition-all transform hover:scale-105 shadow-xl"
              >
                {t('guide_start_now')}
              </button>
          </div>
        </section>
      </article>

      <footer className="bg-stone-200 py-16 text-center text-sm text-gray-500">
          AIKNOW.WINE &bull; Smart Sommelier
      </footer>
    </div>
  );
};

export default SommelierHomeGuide;
