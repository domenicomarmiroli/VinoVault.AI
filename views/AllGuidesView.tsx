import React, { useEffect, useMemo, useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { GUIDES, GuideCategory, getGuideContent, readingMinutes, academyUi } from '../constants/academy';
import { AcademyIcon, AcademyNav } from '../components/AcademyShared';

interface AllGuidesViewProps {
  onHome: () => void;
  onStart: () => void;
  onOpenGuide: (slug: string) => void;
}

const AllGuidesView: React.FC<AllGuidesViewProps> = ({ onHome, onStart, onOpenGuide }) => {
  const { language } = useLanguage();
  const ui = academyUi(language);
  const [filter, setFilter] = useState<'all' | GuideCategory>('all');
  const [query, setQuery] = useState('');

  useEffect(() => {
    document.title = `Wine Academy | AIKNOW.WINE`;
    document.querySelector('meta[name="description"]')?.setAttribute('content', ui.intro);
  }, [ui.intro]);

  const items = useMemo(() => GUIDES.map(g => {
    const c = getGuideContent(g, language);
    return { guide: g, content: c, minutes: readingMinutes(c) };
  }), [language]);

  const q = query.trim().toLowerCase();
  const visible = items.filter(i =>
    (filter === 'all' || i.guide.category === filter) &&
    (!q || `${i.content.title} ${i.content.subtitle} ${i.content.excerpt}`.toLowerCase().includes(q))
  );
  const showFeatured = filter === 'all' && !q;
  const featured = items[0];
  const sections: { cat: GuideCategory; label: string }[] = [{ cat: 'learn', label: ui.learn }, { cat: 'app', label: ui.app }];

  const Card = ({ item, i }: { item: typeof items[number]; i: number }) => (
    <a href={`/guide/${item.guide.slug}`}
      onClick={(e) => { e.preventDefault(); onOpenGuide(item.guide.slug); }}
      style={{ animationDelay: `${Math.min(i, 8) * 60}ms` }}
      className="group text-left bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500"
    >
      <div className={`h-32 bg-gradient-to-br ${item.guide.gradient} relative overflow-hidden shrink-0`}>
        <div className="absolute left-5 top-5 bg-white/15 backdrop-blur border border-white/20 rounded-2xl p-3 group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-500">
          <AcademyIcon icon={item.guide.icon} className="w-7 h-7 text-white" />
        </div>
        <AcademyIcon icon={item.guide.icon} className="absolute -right-6 -bottom-8 w-36 h-36 text-white/10 group-hover:scale-125 transition-transform duration-700" />
      </div>
      <div className="p-6 flex-1 flex flex-col">
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">
          <span>{item.guide.category === 'learn' ? ui.learn : ui.app}</span><span>·</span><span>{item.minutes} {ui.min}</span>
        </div>
        <h3 className="text-xl font-serif font-bold text-gray-900 leading-snug mb-2 group-hover:text-wine-700 transition-colors">{item.content.title}</h3>
        <p className="text-sm text-gray-500 leading-relaxed mb-5">{item.content.excerpt}</p>
        <span className="mt-auto text-wine-700 font-bold text-xs uppercase tracking-wider flex items-center">
          {ui.read} <span className="ml-2 transition-transform group-hover:translate-x-1.5">→</span>
        </span>
      </div>
    </a>
  );

  return (
    <div className="h-full w-full overflow-y-auto overflow-x-hidden bg-stone-50 text-gray-900 font-sans">
      <AcademyNav onHome={onHome} onStart={onStart} ctaLabel={ui.start} />

      {/* Hero */}
      <header className="relative overflow-hidden bg-wine-950 text-white">
        <div className="absolute -left-24 -top-24 w-[28rem] h-[28rem] rounded-full bg-wine-600/40 blur-3xl lp-blob" />
        <div className="absolute right-0 bottom-0 w-[24rem] h-[24rem] rounded-full bg-cyan-500/20 blur-3xl lp-blob" style={{ animationDelay: '-6s' }} />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-14 pb-24 md:pt-20 md:pb-32 text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
          <span className="inline-block text-xs font-bold uppercase tracking-[0.3em] text-cyan-300 mb-5">AIKNOW.WINE</span>
          <h1 className="text-5xl md:text-7xl font-serif font-bold mb-5 bg-gradient-to-r from-white via-wine-200 to-white bg-clip-text text-transparent lp-shine">{ui.title}</h1>
          <p className="text-lg md:text-xl text-white/70 max-w-2xl mx-auto">{ui.intro}</p>
        </div>
      </header>

      {/* Filtri */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 -mt-10 relative z-10">
        <div className="bg-white rounded-2xl shadow-xl shadow-wine-950/5 border border-gray-100 p-3 flex flex-col md:flex-row gap-3">
          <div className="grid grid-cols-3 md:flex gap-1 bg-stone-100 rounded-xl p-1">
            {([['all', ui.all], ['learn', ui.learn], ['app', ui.app]] as const).map(([key, label]) => (
              <button key={key} onClick={() => setFilter(key)}
                className={`px-2 md:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold leading-tight md:whitespace-nowrap transition-all ${filter === key ? 'bg-white text-wine-800 shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}>
                {label}
              </button>
            ))}
          </div>
          <div className="relative flex-1">
            <svg className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" strokeLinecap="round" /></svg>
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder={ui.search}
              className="w-full h-full min-h-[44px] bg-stone-50 rounded-xl pl-11 pr-4 text-sm outline-none focus:ring-2 focus:ring-wine-200 border border-transparent focus:border-wine-300 transition" />
          </div>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        {showFeatured && featured && (
          <a href={`/guide/${featured.guide.slug}`} onClick={(e) => { e.preventDefault(); onOpenGuide(featured.guide.slug); }}
            className={`group block w-full text-left mb-14 rounded-3xl overflow-hidden bg-gradient-to-br ${featured.guide.gradient} text-white relative shadow-xl hover:shadow-2xl transition-shadow animate-in fade-in zoom-in-95 duration-700`}>
            <AcademyIcon icon={featured.guide.icon} className="absolute -right-10 -bottom-16 w-80 h-80 text-white/10 group-hover:scale-110 transition-transform duration-700" />
            <div className="relative p-8 md:p-12 max-w-2xl">
              <span className="inline-block bg-white/15 border border-white/20 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest mb-5">{ui.featured} · {featured.minutes} {ui.min}</span>
              <h2 className="text-3xl md:text-4xl font-serif font-bold leading-tight mb-3">{featured.content.title}</h2>
              <p className="text-white/75 text-lg mb-6">{featured.content.excerpt}</p>
              <span className="inline-flex items-center bg-white text-wine-900 font-bold text-sm px-5 py-2.5 rounded-full">
                {ui.read} <span className="ml-2 transition-transform group-hover:translate-x-1">→</span>
              </span>
            </div>
          </a>
        )}

        {visible.length === 0 && <p className="text-center text-gray-500 py-16">{ui.empty}</p>}

        {sections.map(({ cat, label }) => {
          const list = visible.filter(i => i.guide.category === cat && !(showFeatured && i === featured));
          if (!list.length) return null;
          return (
            <section key={cat} className="mb-14">
              <div className="flex items-baseline justify-between mb-6">
                <h2 className="text-2xl md:text-3xl font-serif font-bold">{label}</h2>
                <span className="text-sm text-gray-400">{visible.filter(i => i.guide.category === cat).length}</span>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {list.map((item, i) => <Card key={item.guide.slug} item={item} i={i} />)}
              </div>
            </section>
          );
        })}
      </main>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-16">
        <div className="rounded-3xl bg-gradient-to-br from-wine-800 to-wine-950 text-white px-6 py-12 md:p-14 text-center relative overflow-hidden">
          <div className="absolute -right-20 -top-20 w-72 h-72 rounded-full bg-cyan-400/15 blur-3xl lp-blob" />
          <h2 className="relative text-3xl md:text-4xl font-serif font-bold mb-3">{ui.cta_title}</h2>
          <p className="relative text-white/70 mb-8 max-w-xl mx-auto">{ui.cta_text}</p>
          <button onClick={onStart} className="relative bg-white text-wine-900 font-bold px-8 py-3.5 rounded-full shadow-xl hover:-translate-y-0.5 transition-transform">{ui.cta_btn}</button>
        </div>
      </section>
    </div>
  );
};

export default AllGuidesView;
