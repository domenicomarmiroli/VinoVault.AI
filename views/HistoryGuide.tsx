
import React, { useEffect } from 'react';
import { Logo } from '../components/Logo';
import { HistoryIcon, StarIcon, PencilIcon, ClockIcon, WineIcon, ShieldCheckIcon } from '../components/Icons';
import { useLanguage } from '../contexts/LanguageContext';

interface HistoryGuideProps {
  onBack: () => void;
  onStart: () => void;
}

const HistoryGuide: React.FC<HistoryGuideProps> = ({ onBack, onStart }) => {
  const { t } = useLanguage();
  
  useEffect(() => {
    document.title = `${t('gy_title')} - AIKNOW.WINE`;
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="h-full w-full overflow-y-auto bg-stone-50 text-stone-900 font-sans selection:bg-wine-100 animate-in fade-in duration-500">
      <nav className="sticky top-0 z-50 bg-stone-50/90 backdrop-blur-md border-b border-stone-200">
        <div className="max-w-4xl mx-auto px-6 h-16 flex justify-between items-center">
          <div className="cursor-pointer transition-transform hover:scale-95" onClick={onBack}>
            <Logo className="w-8 h-8" showText={true} />
          </div>
          <button 
            onClick={onStart}
            className="bg-wine-700 text-white px-5 py-2 rounded-full text-sm font-bold shadow-md hover:bg-wine-800 transition-all"
          >
            {t('gy_cta_btn')}
          </button>
        </div>
      </nav>

      <article className="max-w-3xl mx-auto px-6 py-12 md:py-20">
        <header className="mb-16">
          <div className="bg-stone-200 text-stone-700 w-fit px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-6">
            {t('gy_tag')}
          </div>
          <h1 className="text-4xl md:text-6xl font-serif font-black text-stone-900 leading-tight mb-6">
            {t('gy_title')} <br/>
            <span className="text-wine-700">{t('gy_subtitle')}</span>
          </h1>
          <p className="text-xl text-stone-600 leading-relaxed max-w-2xl">
            {t('gy_intro')}
          </p>
        </header>

        <section className="space-y-12 mb-20">
          <div className="bg-white rounded-3xl p-8 border border-stone-200 shadow-sm flex flex-col md:flex-row gap-8 items-center">
             <div className="bg-stone-100 p-5 rounded-2xl shrink-0">
                <ClockIcon className="w-12 h-12 text-stone-600" />
             </div>
             <div>
                <h2 className="text-2xl font-serif font-bold mb-2">{t('gy_feat1_t')}</h2>
                <p className="text-stone-600 text-sm leading-relaxed">
                   {t('gy_feat1_d')}
                </p>
             </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
             <div className="bg-white p-8 rounded-3xl border border-stone-200 shadow-sm">
                <div className="w-12 h-12 bg-yellow-50 rounded-2xl flex items-center justify-center mb-6">
                    <StarIcon className="w-6 h-6 text-yellow-500" filled />
                </div>
                <h3 className="text-xl font-bold mb-3">{t('gy_feat2_t')}</h3>
                <p className="text-sm text-stone-600 leading-relaxed">
                   {t('gy_feat2_d')}
                </p>
             </div>

             <div className="bg-white p-8 rounded-3xl border border-stone-200 shadow-sm">
                <div className="w-12 h-12 bg-stone-100 rounded-2xl flex items-center justify-center mb-6">
                    <PencilIcon className="w-6 h-6 text-stone-600" />
                </div>
                <h3 className="text-xl font-bold mb-3">{t('gy_feat3_t')}</h3>
                <p className="text-sm text-stone-600 leading-relaxed">
                   {t('gy_feat3_d')}
                </p>
             </div>
          </div>

          <div className="bg-gradient-to-br from-stone-800 to-stone-900 rounded-[2.5rem] p-8 md:p-12 text-white shadow-xl relative overflow-hidden">
             <div className="absolute top-0 right-0 p-8 opacity-10">
                <WineIcon className="w-32 h-32 text-stone-400" filled />
             </div>
             <div className="relative z-10">
                <h2 className="text-3xl font-serif font-bold mb-4">{t('gy_feat4_t')}</h2>
                <p className="text-stone-300 mb-8 max-w-lg">
                   {t('gy_feat4_d')}
                </p>
                <div className="flex items-center gap-4">
                   <div className="bg-white/10 px-4 py-2 rounded-xl border border-white/10">
                      <span className="block text-[10px] uppercase font-bold text-stone-400">{t('gy_stat1')}</span>
                      <span className="text-xl font-bold">{t('gy_stat1_d')}</span>
                   </div>
                   <div className="bg-white/10 px-4 py-2 rounded-xl border border-white/10">
                      <span className="block text-[10px] uppercase font-bold text-stone-400">{t('gy_stat2')}</span>
                      <span className="text-xl font-bold">{t('gy_stat2_d')}</span>
                   </div>
                </div>
             </div>
          </div>
        </section>

        <section className="mb-20 text-center italic text-stone-400 text-lg md:text-2xl font-serif">
           "{t('gy_quote')}"
        </section>

        <section className="bg-white rounded-[2.5rem] p-10 md:p-16 text-center shadow-lg border border-stone-200">
          <h2 className="text-3xl md:text-5xl font-serif font-bold mb-6 text-stone-900">{t('gy_cta_t')}</h2>
          <p className="text-stone-500 mb-10 max-w-md mx-auto text-lg">
            {t('gy_cta_d')}
          </p>
          <button 
            onClick={onStart}
            className="bg-wine-700 text-white px-12 py-5 rounded-2xl font-bold text-xl hover:bg-wine-800 transition-all transform hover:scale-105 active:scale-95 shadow-xl shadow-wine-100"
          >
            {t('gy_cta_btn')}
          </button>
        </section>
      </article>

      <footer className="bg-stone-200 py-16">
        <div className="max-w-4xl mx-auto px-6 text-center text-sm text-stone-500">
          AIKNOW.WINE &bull; Smart Sommelier
        </div>
      </footer>
    </div>
  );
};

export default HistoryGuide;
