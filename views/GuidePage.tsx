import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Guide, GUIDES, GuideBlock, getGuideContent, readingMinutes, academyUi } from '../constants/academy';
import { AcademyIcon, AcademyNav, RichText } from '../components/AcademyShared';

interface GuidePageProps {
  guide: Guide;
  onBack: () => void;
  onHome: () => void;
  onStart: () => void;
  onOpenGuide: (slug: string) => void;
}

const anchor = (i: number) => `sezione-${i}`;

const Block: React.FC<{ block: GuideBlock; index: number }> = ({ block, index }) => {
  switch (block.type) {
    case 'h2':
      return <h2 id={anchor(index)} className="scroll-mt-24 text-2xl md:text-3xl font-serif font-bold text-gray-900 mt-12 mb-4">{block.text}</h2>;
    case 'p':
      return <p className="text-[17px] leading-8 text-gray-600 mb-5"><RichText text={block.text} /></p>;
    case 'list':
      return (
        <ul className="space-y-3 mb-6">
          {block.items.map((item, i) => (
            <li key={i} className="flex gap-3 text-[17px] leading-7 text-gray-600">
              <span className="mt-2.5 w-1.5 h-1.5 rounded-full bg-wine-500 shrink-0" />
              <span><RichText text={item} /></span>
            </li>
          ))}
        </ul>
      );
    case 'steps':
      return (
        <ol className="relative mb-8 space-y-6 before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-px before:bg-wine-100">
          {block.items.map((step, i) => (
            <li key={i} className="relative flex gap-5">
              <span className="relative z-10 w-10 h-10 shrink-0 rounded-full bg-wine-700 text-white font-bold flex items-center justify-center shadow-md shadow-wine-900/20">{i + 1}</span>
              <div className="pt-1.5">
                <h3 className="font-bold text-gray-900 text-lg mb-1">{step.title}</h3>
                <p className="text-gray-600 leading-7"><RichText text={step.text} /></p>
              </div>
            </li>
          ))}
        </ol>
      );
    case 'tip':
      return (
        <aside className="my-8 rounded-2xl border border-amber-200/80 bg-gradient-to-br from-amber-50 to-orange-50/40 p-5 md:p-6 flex gap-4">
          <span className="w-9 h-9 shrink-0 rounded-xl bg-amber-400/90 text-white flex items-center justify-center font-serif font-bold text-lg">!</span>
          <div>
            <p className="font-bold text-amber-900 mb-1">{block.title}</p>
            <p className="text-amber-900/80 leading-7"><RichText text={block.text} /></p>
          </div>
        </aside>
      );
    case 'table':
      return (
        <div className="my-8 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <table className="w-full text-left text-[15px]">
            <thead className="hidden sm:table-header-group bg-stone-50 text-xs uppercase tracking-wider text-gray-500">
              <tr><th className="px-4 md:px-5 py-3 font-bold">{block.head[0]}</th><th className="px-4 md:px-5 py-3 font-bold">{block.head[1]}</th></tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {block.rows.map((row, i) => (
                <tr key={i} className="flex flex-col sm:table-row align-top hover:bg-wine-50/40 transition-colors">
                  <td className="block sm:table-cell px-4 md:px-5 pt-3 pb-1 sm:pb-3 font-semibold text-gray-900 sm:w-[42%]">{row[0]}</td>
                  <td className="block sm:table-cell px-4 md:px-5 pt-0 pb-3 sm:pt-3 text-gray-600 leading-6">{row[1]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
  }
};

const GuidePage: React.FC<GuidePageProps> = ({ guide, onBack, onHome, onStart, onOpenGuide }) => {
  const { language } = useLanguage();
  const ui = academyUi(language);
  const content = getGuideContent(guide, language);
  const minutes = readingMinutes(content);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const [activeSection, setActiveSection] = useState<number | null>(null);

  const toc = useMemo(() => content.blocks.map((b, i) => (b.type === 'h2' ? { i, text: b.text } : null)).filter(Boolean) as { i: number; text: string }[], [content]);
  const related = useMemo(() => {
    const same = GUIDES.filter(g => g.slug !== guide.slug && g.category === guide.category);
    const other = GUIDES.filter(g => g.category !== guide.category);
    return [...same.slice(0, 2), other[0]].filter(Boolean);
  }, [guide]);

  useEffect(() => {
    document.title = `${content.title} | Wine Academy AIKNOW.WINE`;
    document.querySelector('meta[name="description"]')?.setAttribute('content', content.excerpt);
    scrollRef.current?.scrollTo(0, 0);
    setProgress(0);
  }, [content]);

  const onScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const max = el.scrollHeight - el.clientHeight;
    setProgress(max > 0 ? Math.min(1, el.scrollTop / max) : 0);
    let current: number | null = null;
    for (const s of toc) {
      const h = document.getElementById(anchor(s.i));
      if (h && h.getBoundingClientRect().top < 140) current = s.i;
    }
    setActiveSection(current);
  };

  const goTo = (i: number) => document.getElementById(anchor(i))?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  return (
    <div ref={scrollRef} onScroll={onScroll} className="h-full w-full overflow-y-auto overflow-x-hidden bg-stone-50 text-gray-900 font-sans">
      <div className="fixed top-0 left-0 right-0 h-1 z-[60] pointer-events-none">
        <div className="h-full bg-gradient-to-r from-wine-600 to-cyan-400 origin-left transition-transform duration-150" style={{ transform: `scaleX(${progress})` }} />
      </div>

      <AcademyNav onHome={onHome} onStart={onStart} ctaLabel={ui.start}>
        <button onClick={onBack} className="hidden sm:inline text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-wine-700 transition-colors">← {ui.back}</button>
      </AcademyNav>

      {/* Hero */}
      <header className={`relative overflow-hidden bg-gradient-to-br ${guide.gradient} text-white`}>
        <div className="absolute -right-16 -top-16 w-96 h-96 rounded-full bg-white/10 blur-3xl lp-blob" />
        <div className="absolute right-6 md:right-16 bottom-0 translate-y-1/4 opacity-10 pointer-events-none">
          <AcademyIcon icon={guide.icon} className="w-64 h-64 md:w-80 md:h-80 text-white" />
        </div>
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-10 pb-14 md:pt-16 md:pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <button onClick={onBack} className="sm:hidden mb-6 text-xs font-bold uppercase tracking-widest text-white/70">← {ui.back}</button>
          <div className="flex items-center gap-3 mb-6 text-xs font-bold uppercase tracking-widest">
            <span className="bg-white/15 border border-white/20 backdrop-blur px-3 py-1.5 rounded-full">{guide.category === 'learn' ? ui.learn : ui.app}</span>
            <span className="text-white/70">{minutes} {ui.min}</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-serif font-bold leading-[1.08] max-w-3xl mb-5">{content.title}</h1>
          <p className="text-lg md:text-2xl text-white/80 font-light max-w-2xl">{content.subtitle}</p>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 md:py-14 lg:grid lg:grid-cols-[1fr_260px] lg:gap-14">
        <article className="min-w-0 max-w-[720px] bg-white rounded-3xl border border-gray-100 shadow-sm px-5 py-8 sm:px-10 sm:py-12 -mt-16 md:-mt-20 relative">
          <p className="text-xl leading-9 text-gray-700 font-serif mb-6 first-letter:text-5xl first-letter:font-bold first-letter:text-wine-700 first-letter:float-left first-letter:mr-2 first-letter:leading-[0.9]">
            {content.excerpt}
          </p>
          {content.blocks.map((b, i) => <Block key={i} block={b} index={i} />)}
        </article>

        <aside className="hidden lg:block">
          <div className="sticky top-24">
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">{ui.toc}</p>
            <ul className="space-y-1 border-l border-gray-200">
              {toc.map(s => (
                <li key={s.i}>
                  <button onClick={() => goTo(s.i)} className={`-ml-px border-l-2 pl-4 py-1.5 text-left text-sm transition-colors ${activeSection === s.i ? 'border-wine-600 text-wine-700 font-semibold' : 'border-transparent text-gray-500 hover:text-gray-900'}`}>
                    {s.text}
                  </button>
                </li>
              ))}
            </ul>
            <div className="mt-10 rounded-2xl bg-wine-900 text-white p-6 relative overflow-hidden">
              <div className="absolute -right-10 -bottom-10 w-32 h-32 rounded-full bg-cyan-400/20 blur-2xl" />
              <p className="font-serif font-bold text-lg leading-snug mb-2 relative">{ui.cta_title}</p>
              <p className="text-sm text-white/70 mb-5 relative">{ui.cta_text}</p>
              <button onClick={onStart} className="relative w-full bg-white text-wine-900 font-bold text-sm py-2.5 rounded-xl hover:bg-wine-50 transition-colors">{ui.cta_btn}</button>
            </div>
          </div>
        </aside>
      </div>

      {/* Guide correlate */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-16">
        <h2 className="text-2xl font-serif font-bold mb-6">{ui.related}</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {related.map(g => {
            const c = getGuideContent(g, language);
            return (
              <button key={g.slug} onClick={() => onOpenGuide(g.slug)} className="group text-left bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden">
                <div className={`h-24 bg-gradient-to-br ${g.gradient} relative overflow-hidden`}>
                  <AcademyIcon icon={g.icon} className="absolute right-4 -bottom-4 w-24 h-24 text-white/20 group-hover:scale-110 transition-transform duration-500" />
                  <span className="absolute left-4 top-4 text-[10px] font-bold uppercase tracking-widest text-white/80">{g.category === 'learn' ? ui.learn : ui.app}</span>
                </div>
                <div className="p-5">
                  <h3 className="font-serif font-bold text-lg leading-snug mb-2 group-hover:text-wine-700 transition-colors">{c.title}</h3>
                  <p className="text-sm text-gray-500 line-clamp-2">{c.excerpt}</p>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* CTA finale */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-16">
        <div className="rounded-3xl bg-gradient-to-br from-wine-800 to-wine-950 text-white px-6 py-12 md:p-14 text-center relative overflow-hidden">
          <div className="absolute -left-20 -top-20 w-72 h-72 rounded-full bg-cyan-400/15 blur-3xl lp-blob" />
          <h2 className="relative text-3xl md:text-4xl font-serif font-bold mb-3">{ui.cta_title}</h2>
          <p className="relative text-white/70 mb-8 max-w-xl mx-auto">{ui.cta_text}</p>
          <button onClick={onStart} className="relative bg-white text-wine-900 font-bold px-8 py-3.5 rounded-full shadow-xl hover:-translate-y-0.5 transition-transform">{ui.cta_btn}</button>
        </div>
      </section>
    </div>
  );
};

export default GuidePage;
