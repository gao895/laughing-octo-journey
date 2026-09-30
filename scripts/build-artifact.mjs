/**
 * Builds a single self-contained HTML file of the app in demo mode (no server,
 * no Supabase) so it can be tried in any browser or published as an Artifact.
 *
 *   node scripts/build-artifact.mjs            -> dist-artifact/my-virtual-gallery.html
 *   SHARE_BASE=https://… node scripts/…        -> share links become SHARE_BASE#g-<slug>
 *
 * The page needs dist-artifact/backdrops/* published next to it (relative URLs).
 */
import { build } from 'esbuild';
import postcss from 'postcss';
import tailwind from '@tailwindcss/postcss';
import { cpSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const outDir = path.join(root, 'dist-artifact');
mkdirSync(outDir, { recursive: true });

const js = await build({
  entryPoints: [path.join(root, 'spa/main.tsx')],
  bundle: true,
  write: false,
  format: 'iife',
  platform: 'browser',
  target: 'es2020',
  minify: true,
  legalComments: 'none',
  tsconfig: path.join(root, 'tsconfig.json'),
  alias: {
    'next/link': path.join(root, 'spa/shims/next-link.tsx'),
    'next/navigation': path.join(root, 'spa/shims/next-navigation.ts'),
    'next/dynamic': path.join(root, 'spa/shims/next-dynamic.tsx'),
    '@supabase/ssr': path.join(root, 'spa/shims/supabase-ssr.ts'),
  },
  define: {
    'process.env.NODE_ENV': '"production"',
    'process.env.NEXT_PUBLIC_SUPABASE_URL': '""',
    'process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY': '""',
    'process.env.NEXT_PUBLIC_SITE_URL': '""',
    'process.env.NEXT_PUBLIC_SHARE_BASE': JSON.stringify(process.env.SHARE_BASE ?? ''),
    // Static files (backdrop photos) are published next to the page: relative URLs.
    'process.env.NEXT_PUBLIC_ASSET_BASE': '""',
  },
});

const cssSource = readFileSync(path.join(root, 'app/globals.css'), 'utf8');
const css = await postcss([tailwind({ base: root, optimize: { minify: true } })]).process(
  cssSource,
  {
    from: path.join(root, 'app/globals.css'),
  },
);

// The script must not contain a literal closing script tag when inlined.
const script = js.outputFiles[0].text.replace(/<\/script/gi, '<\\/script');
const html = `<title>My Virtual Gallery</title>
<meta name="description" content="画像を選ぶだけで、あなただけのメタバース個展を作れます。">
<style>${css.css}
:root{color-scheme:dark}html,body{height:100%;background:#0c0c0e;color:#f5f3ee}
#app{min-height:100%}</style>
<div id="app"></div>
<script>${script}</script>
`;
const file = path.join(outDir, 'my-virtual-gallery.html');
writeFileSync(file, html);
console.log(`${path.relative(root, file)}  ${(html.length / 1024 / 1024).toFixed(2)} MB`);

// Backdrop photos are published alongside the page (Artifact `files`).
cpSync(path.join(root, 'public/backdrops'), path.join(outDir, 'backdrops'), { recursive: true });
console.log('dist-artifact/backdrops/  (publish these files next to the page)');
