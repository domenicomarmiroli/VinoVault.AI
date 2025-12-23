
import React, { useEffect } from 'react';
import { Logo } from '../components/Logo';
import { CameraIcon, RestaurantIcon, StarIcon, WineIcon } from '../components/Icons';
import { useLanguage } from '../contexts/LanguageContext';

interface RestaurantGuideProps {
  onBack: () => void;
  onStart: () => void;
}

const RestaurantGuide: React.FC<RestaurantGuideProps> = ({ onBack, onStart }) => {
  const { t } = useLanguage();

  useEffect(() => {
    document.title = `${t('gr_title')} - AIKNOW.WINE`;
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="h-full w-full overflow-y-auto bg-white text-gray-900 font-sans animate-in fade-in duration-500">
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-6 h-16 flex justify-between items-center">
          <div className="cursor-pointer transition-transform hover:scale-95" onClick={onBack}>
            <Logo className="w-8 h-8" showText={true} />
          </div>
          <button onClick={onStart} className="bg-wine-700 text-white px-5 py-2 rounded-full text-sm font-bold shadow-md hover:bg-wine-800 transition-all">
            {t('guide_start_now')}
          </button>
        </div>
      </nav>

      <article className="max-w-3xl mx-auto px-6 py-12 md:py-20">
        <header className="mb-16">
          <h1 className="text-4xl md:text-6xl font-serif font-black text-gray-900 leading-tight mb-6">
            {t('gr_title')} <br/>
            <span className="text-wine-600">{t('gr_subtitle')}</span>
          </h1>
          <p className="text-xl text-gray-500 leading-relaxed max-w-2xl">{t('gr_intro')}</p>
        </header>

        <section className="space-y-16 mb-20">
          <div className="flex flex-col md:flex-row gap-10 items-start">
             <div className="bg-stone-50 p-6 rounded-[2.5rem] border border-stone-100 shadow-inner shrink-0">
                <CameraIcon className="w-16 h-16 text-wine-600" />
             </div>
             <div>
                <h2 className="text-2xl font-serif font-bold mb-3">{t('gr_step_1_t')}</h2>
                <p className="text-gray-600 leading-relaxed">{t('gr_step_1_d')}</p>
             </div>
          </div>
          <div className="flex flex-col md:flex-row gap-10 items-start">
             <div className="bg-stone-50 p-6 rounded-[2.5rem] border border-stone-100 shadow-inner shrink-0 md:order-last">
                <RestaurantIcon className="w-16 h-16 text-wine-600" filled />
             </div>
             <div>
                <h2 className="text-2xl font-serif font-bold mb-3">{t('gr_step_2_t')}</h2>
                <p className="text-gray-600 leading-relaxed">{t('gr_step_2_d')}</p>
             </div>
          </div>
          <div className="flex flex-col md:flex-row gap-10 items-start">
             <div className="bg-stone-50 p-6 rounded-[2.5rem] border border-stone-100 shadow-inner shrink-0">
                <StarIcon className="w-16 h-16 text-amber-500" filled />
             </div>
             <div>
                <h2 className="text-2xl font-serif font-bold mb-3">{t('gr_step_3_t')}</h2>
                <p className="text-gray-600 leading-relaxed">{t('gr_step_3_d')}</p>
             </div>
          </div>
        </section>

        <section className="bg-stone-900 rounded-[2.5rem] p-10 md:p-16 text-white text-center shadow-2xl relative overflow-hidden">
          <div className="relative z-10">
              <h2 className="text-3xl md:text-5xl font-serif font-bold mb-6">{t('gr_cta')}</h2>
              <button onClick={onStart} className="bg-wine-600 text-white px-12 py-5 rounded-2xl font-bold text-xl hover:bg-wine-700 transition-all transform hover:scale-105 shadow-xl">
                {t('guide_start_now')}
              </button>
          </div>
        </section>
      </article>
      <footer className="bg-stone-50 py-16 border-t border-gray-100 text-center text-sm text-gray-400 font-medium">
          AIKNOW.WINE &bull; Smart Sommelier
      </footer>
    </div>
  );
};

export default RestaurantGuide;
