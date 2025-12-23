
import React, { useEffect } from 'react';
import { Logo } from '../components/Logo';
import { ChefIcon, ChartBarIcon, WineIcon, UserIcon, ShieldCheckIcon, ClockIcon } from '../components/Icons';
import { useLanguage } from '../contexts/LanguageContext';

interface SommelierAnalysisGuideProps {
  onBack: () => void;
  onStart: () => void;
}

const SommelierAnalysisGuide: React.FC<SommelierAnalysisGuideProps> = ({ onBack, onStart }) => {
  const { t } = useLanguage();
  
  useEffect(() => {
    document.title = `${t('gan_title')} - AIKNOW.WINE`;
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="h-full w-full overflow-y-auto bg-slate-950 text-white font-sans selection:bg-purple-500/30 animate-in fade-in duration-500">
      <nav className="sticky top-0 z-50 bg-slate-950/90 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-4xl mx-auto px-6 h-16 flex justify-between items-center">
          <div className="cursor-pointer transition-transform hover:scale-95" onClick={onBack}>
            <Logo className="w-8 h-8" showText={true} light />
          </div>
          <button 
            onClick={onStart}
            className="bg-purple-600 text-white px-5 py-2 rounded-full text-sm font-bold shadow-lg shadow-purple-500/20 hover:bg-purple-500 transition-all"
          >
            {t('gan_cta_btn')}
          </button>
        </div>
      </nav>

      <article className="max-w-3xl mx-auto px-6 py-12 md:py-20">
        <header className="mb-16">
          <div className="inline-block bg-purple-500/10 text-purple-400 border border-purple-500/20 px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest mb-6">
            {t('gan_tag')}
          </div>
          <h1 className="text-4xl md:text-6xl font-serif font-black leading-tight mb-6">
            {t('gan_title')} <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-400">{t('gan_subtitle')}</span>
          </h1>
          <p className="text-xl text-slate-400 leading-relaxed max-w-2xl">
            {t('gan_intro')}
          </p>
        </header>

        <section className="space-y-16 mb-20">
          <div className="flex flex-col md:flex-row gap-10 items-start">
             <div className="bg-slate-900 p-6 rounded-[2.5rem] border border-slate-800 shadow-xl shrink-0">
                <UserIcon className="w-16 h-16 text-purple-500" filled />
             </div>
             <div>
                <h2 className="text-2xl font-serif font-bold mb-3">{t('gan_feat1_t')}</h2>
                <p className="text-slate-400 leading-relaxed text-sm">
                   {t('gan_feat1_d')}
                </p>
             </div>
          </div>

          <div className="flex flex-col md:flex-row gap-10 items-start">
             <div className="bg-slate-900 p-6 rounded-[2.5rem] border border-slate-800 shadow-xl shrink-0 md:order-last">
                <ChartBarIcon className="w-16 h-16 text-indigo-500" />
             </div>
             <div>
                <h2 className="text-2xl font-serif font-bold mb-3">{t('gan_feat2_t')}</h2>
                <p className="text-slate-400 leading-relaxed text-sm">
                   {t('gan_feat2_d')}
                </p>
             </div>
          </div>

          <div className="flex flex-col md:flex-row gap-10 items-start">
             <div className="bg-slate-900 p-6 rounded-[2.5rem] border border-slate-800 shadow-xl shrink-0">
                <WineIcon className="w-16 h-16 text-emerald-500" filled />
             </div>
             <div>
                <h2 className="text-2xl font-serif font-bold mb-3">{t('gan_feat3_t')}</h2>
                <p className="text-slate-400 leading-relaxed text-sm">
                   {t('gan_feat3_d')}
                </p>
             </div>
          </div>
        </section>

        <section className="bg-gradient-to-br from-purple-900/40 to-slate-900 border border-purple-500/20 rounded-[2.5rem] p-8 md:p-12 mb-20">
           <div className="flex items-center gap-4 mb-6">
              <div className="bg-purple-600/30 p-3 rounded-2xl">
                <ClockIcon className="w-8 h-8 text-purple-400" />
              </div>
              <h3 className="text-2xl font-serif font-bold">{t('gan_time_t')}</h3>
           </div>
           <p className="text-slate-300 mb-8 leading-relaxed">
             {t('gan_time_d')}
           </p>
           <div className="flex gap-3">
              <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-xs font-bold border border-green-500/30">{t('gan_ready')}</span>
              <span className="bg-amber-500/20 text-amber-400 px-3 py-1 rounded-full text-xs font-bold border border-amber-500/30">{t('gan_wait')}</span>
              <span className="bg-red-500/20 text-red-400 px-3 py-1 rounded-full text-xs font-bold border border-red-500/30">{t('gan_decline')}</span>
           </div>
        </section>

        <section className="bg-white text-slate-950 rounded-[2.5rem] p-10 md:p-16 text-center shadow-2xl relative overflow-hidden">
          <div className="relative z-10">
              <h2 className="text-3xl md:text-5xl font-serif font-bold mb-6">{t('gan_cta_t')}</h2>
              <p className="text-slate-500 mb-10 max-w-md mx-auto text-lg">
                {t('gan_cta_d')}
              </p>
              <button 
                onClick={onStart}
                className="bg-purple-600 text-white px-12 py-5 rounded-2xl font-bold text-xl hover:bg-purple-700 transition-all transform hover:scale-105 shadow-xl shadow-purple-200"
              >
                {t('gan_cta_btn')}
              </button>
          </div>
        </section>
      </article>

      <footer className="bg-black/50 py-16 border-t border-slate-800">
        <div className="max-w-4xl mx-auto px-6 text-center text-sm text-slate-500 font-medium">
          AIKNOW.WINE &bull; Smart Sommelier
        </div>
      </footer>
    </div>
  );
};

export default SommelierAnalysisGuide;
