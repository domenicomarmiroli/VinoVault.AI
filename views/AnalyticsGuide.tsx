
import React, { useEffect } from 'react';
import { Logo } from '../components/Logo';
import { ChartBarIcon, WineIcon, HistoryIcon, ShieldCheckIcon, MapPinIcon } from '../components/Icons';
import { useLanguage } from '../contexts/LanguageContext';

interface AnalyticsGuideProps {
  onBack: () => void;
  onStart: () => void;
}

const AnalyticsGuide: React.FC<AnalyticsGuideProps> = ({ onBack, onStart }) => {
  const { t } = useLanguage();
  
  useEffect(() => {
    document.title = `${t('ga_title')} - AIKNOW.WINE`;
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="h-full w-full overflow-y-auto bg-gray-900 text-white font-sans selection:bg-cyan-500/30 animate-in fade-in duration-500">
      <nav className="sticky top-0 z-50 bg-gray-900/90 backdrop-blur-md border-b border-gray-800">
        <div className="max-w-4xl mx-auto px-6 h-16 flex justify-between items-center">
          <div className="cursor-pointer transition-transform hover:scale-95" onClick={onBack}>
            <Logo className="w-8 h-8" showText={true} light />
          </div>
          <button 
            onClick={onStart}
            className="bg-cyan-500 text-gray-900 px-5 py-2 rounded-full text-sm font-bold shadow-lg shadow-cyan-500/20 hover:bg-cyan-400 transition-all"
          >
            {t('ga_cta_btn')}
          </button>
        </div>
      </nav>

      <article className="max-w-3xl mx-auto px-6 py-12 md:py-20">
        <header className="mb-16 text-center">
          <div className="inline-block bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest mb-6">
            {t('ga_tag')}
          </div>
          <h1 className="text-4xl md:text-6xl font-serif font-black leading-tight mb-6 text-white">
            {t('ga_title')} <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">{t('ga_subtitle')}</span>
          </h1>
          <p className="text-xl text-gray-400 leading-relaxed max-w-2xl mx-auto">
            {t('ga_intro')}
          </p>
        </header>

        <section className="grid gap-8 mb-20">
          <div className="bg-gray-800/50 border border-gray-700 p-8 rounded-[2.5rem] flex flex-col md:flex-row gap-8 items-center">
             <div className="bg-cyan-500/20 p-6 rounded-3xl">
                <ChartBarIcon className="w-12 h-12 text-cyan-400" filled />
             </div>
             <div>
                <h2 className="text-2xl font-serif font-bold mb-3 text-white">{t('ga_feat1_t')}</h2>
                <p className="text-gray-400 leading-relaxed">
                   {t('ga_feat1_d')}
                </p>
             </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
             <div className="bg-gray-800/30 border border-gray-700 p-6 rounded-3xl">
                <div className="flex items-center gap-3 mb-4">
                   <WineIcon className="w-6 h-6 text-wine-500" filled />
                   <h3 className="font-bold text-lg">{t('ga_feat2_t')}</h3>
                </div>
                <p className="text-sm text-gray-500 leading-relaxed">
                   {t('ga_feat2_d')}
                </p>
             </div>
             <div className="bg-gray-800/30 border border-gray-700 p-6 rounded-3xl">
                <div className="flex items-center gap-3 mb-4">
                   <MapPinIcon className="w-6 h-6 text-emerald-500" />
                   <h3 className="font-bold text-lg">{t('ga_feat3_t')}</h3>
                </div>
                <p className="text-sm text-gray-500 leading-relaxed">
                   {t('ga_feat3_d')}
                </p>
             </div>
          </div>

          <div className="bg-gradient-to-br from-wine-900/40 to-gray-800 border border-wine-500/20 p-8 rounded-[2.5rem]">
             <div className="flex items-center gap-4 mb-6">
                <div className="bg-wine-600/30 p-3 rounded-2xl">
                   <HistoryIcon className="w-8 h-8 text-wine-500" filled />
                </div>
                <h2 className="text-2xl font-serif font-bold text-white">{t('ga_feat4_t')}</h2>
             </div>
             <p className="text-gray-400 mb-6 leading-relaxed">
                {t('ga_feat4_d')}
             </p>
             <div className="grid grid-cols-2 gap-4">
                <div className="bg-black/20 p-4 rounded-2xl border border-white/5">
                   <span className="block text-cyan-400 font-bold text-xl">{t('ga_stat1')}</span>
                   <span className="text-[10px] text-gray-500 uppercase">{t('ga_stat1_d')}</span>
                </div>
                <div className="bg-black/20 p-4 rounded-2xl border border-white/5">
                   <span className="block text-cyan-400 font-bold text-xl">{t('ga_stat2')}</span>
                   <span className="text-[10px] text-gray-500 uppercase">{t('ga_stat2_d')}</span>
                </div>
             </div>
          </div>
        </section>

        <section className="bg-white text-gray-900 rounded-[2.5rem] p-8 md:p-12 mb-20 shadow-2xl relative overflow-hidden">
           <div className="absolute top-0 right-0 p-8 opacity-10">
              <ShieldCheckIcon className="w-32 h-32 text-wine-600" />
           </div>
           <div className="relative z-10">
              <span className="text-wine-600 font-bold uppercase tracking-widest text-[10px] mb-4 block">{t('ga_premium_tag')}</span>
              <h2 className="text-3xl font-serif font-bold mb-4">{t('ga_premium_t')}</h2>
              <p className="text-gray-600 mb-8 leading-relaxed">
                 {t('ga_premium_d')}
              </p>
           </div>
        </section>

        <section className="text-center py-12">
          <h2 className="text-3xl font-serif font-bold mb-8">{t('ga_cta_t')}</h2>
          <button 
            onClick={onStart}
            className="bg-cyan-500 text-gray-900 px-12 py-5 rounded-2xl font-bold text-xl hover:bg-cyan-400 transition-all transform hover:scale-105 shadow-xl shadow-cyan-500/20"
          >
            {t('ga_cta_btn')}
          </button>
        </section>
      </article>

      <footer className="bg-black/50 py-16 border-t border-gray-800">
        <div className="max-w-4xl mx-auto px-6 text-center text-sm text-gray-500">
          AIKNOW.WINE &bull; Smart Sommelier
        </div>
      </footer>
    </div>
  );
};

export default AnalyticsGuide;
