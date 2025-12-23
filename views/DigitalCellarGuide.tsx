
import React, { useEffect } from 'react';
import { Logo } from '../components/Logo';
import { WineIcon, CameraIcon, MapPinIcon, ChartBarIcon } from '../components/Icons';
import { useLanguage } from '../contexts/LanguageContext';

interface DigitalCellarGuideProps {
  onBack: () => void;
  onStart: () => void;
}

const DigitalCellarGuide: React.FC<DigitalCellarGuideProps> = ({ onBack, onStart }) => {
  const { t } = useLanguage();
  
  useEffect(() => {
    document.title = `${t('gc_title')} - AIKNOW.WINE`;
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
            {t('gc_title')}: <br/>
            <span className="text-wine-600">{t('gc_subtitle')}</span>
          </h1>
          <p className="text-xl text-gray-600 leading-relaxed italic">
            "{t('gc_intro')}"
          </p>
        </header>

        <section className="space-y-12 mb-20">
          <div className="bg-stone-50 rounded-3xl p-8 border border-stone-100 shadow-sm">
            <h2 className="text-2xl font-serif font-bold mb-6 flex items-center gap-3 text-gray-800">
              <CameraIcon className="w-6 h-6 text-wine-600" />
              {t('gc_feature_1_t')}
            </h2>
            <p className="text-gray-700 leading-relaxed mb-6">{t('gc_feature_1_d')}</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4 bg-cyan-50/30 p-6 rounded-3xl border border-cyan-100">
              <div className="bg-cyan-100 p-4 rounded-2xl w-fit">
                <MapPinIcon className="w-6 h-6 text-cyan-600" />
              </div>
              <h3 className="text-xl font-bold text-cyan-900">{t('gc_feature_2_t')}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{t('gc_feature_2_d')}</p>
            </div>
            <div className="space-y-4 bg-amber-50/30 p-6 rounded-3xl border border-amber-100">
              <div className="bg-amber-100 p-4 rounded-2xl w-fit">
                <ChartBarIcon className="w-6 h-6 text-amber-600" />
              </div>
              <h3 className="text-xl font-bold text-amber-900">{t('gc_feature_3_t')}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{t('gc_feature_3_d')}</p>
            </div>
          </div>
        </section>

        <section className="bg-wine-900 rounded-[2.5rem] p-10 md:p-16 text-white text-center shadow-2xl relative overflow-hidden">
          <h2 className="text-3xl md:text-5xl font-serif font-bold mb-6">{t('gc_cta')}</h2>
          <button onClick={onStart} className="bg-white text-wine-900 px-12 py-5 rounded-2xl font-bold text-xl hover:bg-stone-100 transition-all transform hover:scale-105 shadow-xl">
            {t('gc_cta_sub')}
          </button>
        </section>
      </article>

      <footer className="bg-stone-100 py-16 border-t border-gray-200 text-center text-sm text-gray-400 font-medium">
          AIKNOW.WINE &bull; Smart Sommelier
      </footer>
    </div>
  );
};

export default DigitalCellarGuide;
