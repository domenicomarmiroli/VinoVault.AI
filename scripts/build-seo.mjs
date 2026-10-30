// Dopo «vite build»: esporta le guide dell'Academy in dist/seo-guides.json,
// così il server può mettere titolo, descrizione e testo di ogni guida direttamente nell'HTML per Google.
import { build } from 'esbuild';
import { writeFileSync, mkdirSync, rmSync } from 'fs';
import { pathToFileURL } from 'url';
import path from 'path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const tmp = path.join(root, 'dist', '.seo-tmp.mjs');
mkdirSync(path.join(root, 'dist'), { recursive: true });
await build({ entryPoints: [path.join(root, 'constants/academy.ts')], bundle: true, format: 'esm', platform: 'node', outfile: tmp, logLevel: 'error' });
const { GUIDES, ACADEMY_UI, readingMinutes } = await import(pathToFileURL(tmp).href);
rmSync(tmp);
const guides = GUIDES.map(g => ({
  slug: g.slug,
  category: g.category,
  minutes: readingMinutes(g.content.it),
  it: g.content.it,
}));
writeFileSync(path.join(root, 'dist', 'seo-guides.json'), JSON.stringify({ guides, ui: ACADEMY_UI.it }));
console.log(`SEO: ${guides.length} guide esportate`);
