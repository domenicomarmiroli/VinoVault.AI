
import React, { useEffect } from 'react';
import { Logo } from '../components/Logo';
import { ShopIcon, CameraIcon, ChartBarIcon, ShoppingCartIcon, ShieldCheckIcon, WineIcon } from '../components/Icons';
import { useLanguage } from '../contexts/LanguageContext';

interface ShopGuideProps {
  onBack: () => void;
  onStart: () => void;
}

const ShopGuide: React.FC<ShopGuideProps> = ({ onBack, onStart }) => {
  const { t } = useLanguage();
  
  useEffect(() => {
    document.title = `${t('gs_title')} - AIKNOW.WINE`;
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="h-full w-full overflow-y-auto bg-slate-50 text-slate-900 font-sans selection:bg-indigo-100 animate-in fade-in duration-500">
      <nav className="sticky top-0 z-50 bg-slate-50/90 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-6 h-16 flex justify-between items-center">
          <div className="cursor-pointer transition-transform hover:scale-95" onClick={onBack}>
            <Logo className="w-8 h-8" showText={true} />
          </div>
          <button 
            onClick={onStart}
            className="bg-indigo-600 text-white px-5 py-2 rounded-full text-sm font-bold shadow-md hover:bg-indigo-700 transition-all"
          >
            {t('gs_cta_btn')}
          </button>
        </div>
      </nav>

      <article className="max-w-3xl mx-auto px-6 py-12 md:py-20">
        <header className="mb-16">
          <div className="bg-indigo-100 text-indigo-700 w-fit px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-6">
            {t('gs_tag')}
          </div>
          <h1 className="text-4xl md:text-6xl font-serif font-black text-slate-900 leading-tight mb-6">
            {t('gs_title')} <br/>
            <span className="text-indigo-600">{t('gs_subtitle')}</span>
          </h1>
          <p className="text-xl text-slate-500 leading-relaxed max-w-2xl">
            {t('gs_intro')}
          </p>
        </header>

        <section className="space-y-12 mb-20">
          <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm flex flex-col md:flex-row gap-8 items-center">
             <div className="flex gap-2">
                <div className="bg-slate-100 p-4 rounded-2xl"><CameraIcon className="w-8 h-8 text-slate-600" /></div>
                <div className="bg-indigo-100 p-4 rounded-2xl"><ShoppingCartIcon className="w-8 h-8 text-indigo-600" /></div>
             </div>
             <div>
                <h2 className="text-2xl font-serif font-bold mb-2">{t('gs_feature_1_t')}</h2>
                <p className="text-slate-600 text-sm leading-relaxed">
                   {t('gs_feature_1_d')}
                </p>
             </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
             <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center mb-6">
                    <WineIcon className="w-6 h-6 text-emerald-600" filled />
                </div>
                <h3 className="text-xl font-bold mb-3">{t('gs_feature_2_t')}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                   {t('gs_feature_2_d')}
                </p>
             </div>

             <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center mb-6">
                    <ChartBarIcon className="w-6 h-6 text-amber-600" />
                </div>
                <h3 className="text-xl font-bold mb-3">{t('gs_feature_3_t')}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                   {t('gs_feature_3_d')}
                </p>
             </div>
          </div>

          <div className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-[2.5rem] p-8 md:p-12 text-white shadow-xl relative overflow-hidden">
             <div className="absolute top-0 right-0 p-8 opacity-20">
                <ShieldCheckIcon className="w-32 h-32 text-indigo-400" />
             </div>
             <div className="relative z-10">
                <span className="text-indigo-400 font-bold uppercase tracking-widest text-[10px] mb-4 block">{t('gs_premium_tag')}</span>
                <h2 className="text-3xl font-serif font-bold mb-4">{t('gs_premium_title')}</h2>
                <p className="text-indigo-100/70 mb-8 max-w-lg">
                   {t('gs_premium_desc')}
                </p>
             </div>
          </div>
        </section>

        <section className="bg-white rounded-[2.5rem] p-10 md:p-16 text-center shadow-lg border border-slate-200">
          <h2 className="text-3xl md:text-5xl font-serif font-bold mb-6 text-slate-900">{t('gs_cta_title')}</h2>
          <p className="text-slate-500 mb-10 max-w-md mx-auto text-lg">
            {t('gs_cta_desc')}
          </p>
          <button 
            onClick={onStart}
            className="bg-indigo-600 text-white px-12 py-5 rounded-2xl font-bold text-xl hover:bg-indigo-700 transition-all transform hover:scale-105 shadow-xl"
          >
            {t('gs_cta_btn')}
          </button>
        </section>
      </article>

      <footer className="bg-slate-100 py-16 text-center text-sm text-slate-400">
          AIKNOW.WINE &bull; Smart Sommelier
      </footer>
    </div>
  );
};

export default ShopGuide;
