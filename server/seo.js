// SEO: ogni pagina pubblica parte già con titolo, descrizione, indirizzo canonico, anteprima social,
// dati strutturati e (per home e guide) il testo leggibile, senza aspettare che l'app si carichi.
// L'app React poi sostituisce il contenuto di #root come sempre.
import fs from 'fs';
import path from 'path';

const BUSINESS = {
    '/ristoranti': { lang: 'it', title: 'AIKNOW.WINE per ristoranti: carta vini digitale e sommelier AI', desc: "Sostituisci la carta vini cartacea con un sommelier virtuale che conosce ogni piatto del menu, consiglia il vino giusto al tavolo e analizza la tua cantina." },
    '/restaurants': { lang: 'en', title: 'AIKNOW.WINE for restaurants: digital wine list and AI sommelier', desc: 'Replace your paper wine list with a virtual sommelier that knows every dish on your menu, recommends the right wine at the table and analyses your cellar.' },
    '/restaurants-fr': { lang: 'fr', title: 'AIKNOW.WINE pour les restaurants : carte des vins digitale et sommelier IA', desc: 'Remplacez votre carte des vins papier par un sommelier virtuel qui connaît chaque plat et conseille le bon vin à table.' },
    '/restaurantes': { lang: 'es', title: 'AIKNOW.WINE para restaurantes: carta de vinos digital y sumiller IA', desc: 'Sustituye tu carta de vinos de papel por un sumiller virtual que conoce cada plato y recomienda el vino adecuado en la mesa.' },
    '/restaurants-de': { lang: 'de', title: 'AIKNOW.WINE für Restaurants: digitale Weinkarte und KI-Sommelier', desc: 'Ersetzen Sie die Papier-Weinkarte durch einen virtuellen Sommelier, der jedes Gericht kennt und am Tisch den passenden Wein empfiehlt.' },
};

const HOME = {
    title: 'AIKNOW.WINE – Sommelier AI e cantina digitale gratis',
    desc: "Fotografa l'etichetta e l'AI riconosce il vino: cantina digitale, abbinamenti con quello che cucini, consigli prima di comprare e la carta dei vini al ristorante. Gratis.",
};

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
// Testo delle guide: **grassetto** diventa <strong>, il resto è testo semplice.
const rich = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
const ld = (obj) => `<script type="application/ld+json">${JSON.stringify(obj).replace(/</g, '\\u003c')}</script>`;

const renderBlocks = (blocks) => blocks.map(b => {
    switch (b.type) {
        case 'h2': return `<h2>${esc(b.text)}</h2>`;
        case 'p': return `<p>${rich(b.text)}</p>`;
        case 'list': return `<ul>${b.items.map(i => `<li>${rich(i)}</li>`).join('')}</ul>`;
        case 'steps': return `<ol>${b.items.map(i => `<li><strong>${esc(i.title)}</strong>: ${rich(i.text)}</li>`).join('')}</ol>`;
        case 'tip': return `<aside><strong>${esc(b.title)}</strong>: ${rich(b.text)}</aside>`;
        case 'table': return `<table><thead><tr>${b.head.map(h => `<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${b.rows.map(r => `<tr>${r.map(c => `<td>${rich(c)}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
        default: return '';
    }
}).join('\n');

export const createSeo = ({ distPath, siteUrl }) => {
    let template = null;
    let data = { guides: [], ui: {} };
    const load = () => {
        if (template) return;
        template = fs.readFileSync(path.join(distPath, 'index.html'), 'utf8');
        try { data = JSON.parse(fs.readFileSync(path.join(distPath, 'seo-guides.json'), 'utf8')); }
        catch (e) { console.error('SEO: seo-guides.json mancante, eseguire npm run build', e.message); }
    };

    const organization = { '@type': 'Organization', name: 'AIKNOW.WINE', url: siteUrl, logo: `${siteUrl}/logo.png` };
    const guideLinks = () => `<ul>${data.guides.map(g => `<li><a href="/guide/${g.slug}">${esc(g.it.title)}</a> – ${esc(g.it.excerpt)}</li>`).join('')}</ul>`;

    const pageFor = (pathname) => {
        const p = pathname.replace(/\/+$/, '') || '/';
        if (p === '/') {
            return {
                title: HOME.title, desc: HOME.desc, canonical: '/',
                jsonld: [
                    { '@context': 'https://schema.org', '@type': 'WebSite', name: 'AIKNOW.WINE', url: siteUrl, inLanguage: 'it' },
                    { '@context': 'https://schema.org', '@type': 'SoftwareApplication', name: 'AIKNOW.WINE', applicationCategory: 'LifestyleApplication', operatingSystem: 'Web, iOS, Android', url: siteUrl, description: HOME.desc, offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' } },
                ],
                body: `<h1>AIKNOW.WINE: il tuo sommelier personale con l'intelligenza artificiale</h1><p>${esc(HOME.desc)}</p><h2>Wine Academy: guide al vino</h2>${guideLinks()}<p><a href="/guide">Tutte le guide</a> · <a href="/ristoranti">Per ristoranti ed enoteche</a></p>`,
            };
        }
        if (p === '/guide') {
            const title = 'Wine Academy: guide pratiche sul vino | AIKNOW.WINE';
            const desc = data.ui.intro || 'Guide pratiche per leggere le etichette, conservare e servire il vino, scegliere gli abbinamenti e usare al meglio AIKNOW.WINE.';
            return {
                title, desc, canonical: '/guide',
                jsonld: [{ '@context': 'https://schema.org', '@type': 'CollectionPage', name: 'Wine Academy', url: `${siteUrl}/guide`, description: desc,
                    mainEntity: { '@type': 'ItemList', itemListElement: data.guides.map((g, i) => ({ '@type': 'ListItem', position: i + 1, url: `${siteUrl}/guide/${g.slug}`, name: g.it.title })) } }],
                body: `<h1>Wine Academy</h1><p>${esc(desc)}</p>${guideLinks()}`,
            };
        }
        const guideMatch = p.match(/^\/guide\/([a-z0-9-]+)$/);
        if (guideMatch) {
            const g = data.guides.find(x => x.slug === guideMatch[1]);
            if (!g) return { status: 404, noindex: true, title: 'Guida non trovata | AIKNOW.WINE', desc: HOME.desc, canonical: '/guide' };
            const c = g.it;
            const url = `${siteUrl}/guide/${g.slug}`;
            const related = data.guides.filter(x => x.slug !== g.slug && x.category === g.category).slice(0, 3);
            return {
                title: `${c.title} | Wine Academy AIKNOW.WINE`, desc: c.excerpt, canonical: `/guide/${g.slug}`, ogType: 'article',
                jsonld: [
                    { '@context': 'https://schema.org', '@type': 'Article', headline: c.title, description: c.excerpt, inLanguage: 'it', url,
                      mainEntityOfPage: url, image: `${siteUrl}/logo.png`, author: organization, publisher: organization, timeRequired: `PT${g.minutes}M` },
                    { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
                        { '@type': 'ListItem', position: 1, name: 'AIKNOW.WINE', item: siteUrl },
                        { '@type': 'ListItem', position: 2, name: 'Wine Academy', item: `${siteUrl}/guide` },
                        { '@type': 'ListItem', position: 3, name: c.title, item: url } ] },
                ],
                body: `<article><p><a href="/">AIKNOW.WINE</a> › <a href="/guide">Wine Academy</a></p><h1>${esc(c.title)}</h1><p><em>${esc(c.subtitle)}</em></p>${renderBlocks(c.blocks)}</article>`
                    + (related.length ? `<h2>Leggi anche</h2><ul>${related.map(r => `<li><a href="/guide/${r.slug}">${esc(r.it.title)}</a></li>`).join('')}</ul>` : ''),
            };
        }
        if (BUSINESS[p]) {
            const b = BUSINESS[p];
            return {
                title: b.title, desc: b.desc, canonical: p, lang: b.lang,
                alternates: Object.entries(BUSINESS).map(([href, x]) => ({ hreflang: x.lang, href })),
                jsonld: [{ '@context': 'https://schema.org', '@type': 'Service', name: b.title, description: b.desc, provider: organization, areaServed: 'EU' }],
                body: `<h1>${esc(b.title)}</h1><p>${esc(b.desc)}</p>`,
            };
        }
        if (p === '/privacy') return { title: 'Informativa privacy | AIKNOW.WINE', desc: 'Come AIKNOW.WINE tratta i dati personali degli utenti.', canonical: '/privacy' };
        if (p === '/termini' || p === '/terms') return { title: 'Termini di servizio | AIKNOW.WINE', desc: 'Condizioni di utilizzo di AIKNOW.WINE.', canonical: '/termini' };
        // Tutto il resto (stati interni dell'app) non va nei risultati di ricerca.
        return { noindex: true, title: HOME.title, desc: HOME.desc, canonical: '/' };
    };

    const render = (pathname) => {
        load();
        const page = pageFor(pathname);
        const url = `${siteUrl}${page.canonical === '/' ? '/' : page.canonical}`;
        const head = [
            `<link rel="canonical" href="${esc(url)}" />`,
            page.noindex ? '<meta name="robots" content="noindex, follow" />' : '<meta name="robots" content="index, follow, max-image-preview:large" />',
            `<meta property="og:site_name" content="AIKNOW.WINE" />`,
            `<meta property="og:type" content="${page.ogType || 'website'}" />`,
            `<meta property="og:title" content="${esc(page.title)}" />`,
            `<meta property="og:description" content="${esc(page.desc)}" />`,
            `<meta property="og:url" content="${esc(url)}" />`,
            `<meta property="og:image" content="${siteUrl}/logo.png" />`,
            `<meta property="og:locale" content="${page.lang === 'en' ? 'en_GB' : page.lang === 'fr' ? 'fr_FR' : page.lang === 'es' ? 'es_ES' : page.lang === 'de' ? 'de_DE' : 'it_IT'}" />`,
            `<meta name="twitter:card" content="summary" />`,
            ...(page.alternates || []).map(a => `<link rel="alternate" hreflang="${a.hreflang}" href="${siteUrl}${a.href}" />`),
            ...(page.jsonld || []).map(ld),
        ].join('\n    ');
        let html = template
            .replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(page.title)}</title>`)
            .replace(/<meta name="description" content="[^"]*"\s*\/?>/, `<meta name="description" content="${esc(page.desc)}" />`)
            .replace('</head>', `    ${head}\n  </head>`);
        if (page.lang) html = html.replace(/<html lang="[^"]*">/, `<html lang="${page.lang}">`);
        if (page.body) html = html.replace(/(<div id="root"[^>]*>)(<\/div>)/, `$1<div class="seo-content" style="max-width:720px;margin:0 auto;padding:24px;font-family:sans-serif;line-height:1.6">${page.body}</div>$2`);
        return { status: page.status || 200, html };
    };

    return { render };
};
