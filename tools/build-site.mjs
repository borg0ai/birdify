import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import esbuild from 'esbuild';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const siteDir = path.join(root, 'apps/site');
const distDir = path.join(siteDir, 'dist');

export async function buildSite() {
  fs.mkdirSync(distDir, { recursive: true });
  fs.mkdirSync(path.join(distDir, 'brand'), { recursive: true });

  // Bundle TS/JS
  await esbuild.build({
    entryPoints: [path.join(siteDir, 'src/main.mts')],
    outfile: path.join(distDir, 'site.js'),
    bundle: true,
    format: 'iife',
    target: 'es2022',
    minify: true,
  });

  // Copy static files
  for (const file of ['index.html', 'site.css', 'i18n.json', 'favicon-32.png']) {
    const src = path.join(siteDir, file);
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, path.join(distDir, file));
    }
  }

  // Copy brand assets
  const brandSrc = path.join(siteDir, 'brand');
  if (fs.existsSync(brandSrc)) {
    for (const file of fs.readdirSync(brandSrc)) {
      fs.copyFileSync(path.join(brandSrc, file), path.join(distDir, 'brand', file));
    }
  }

  console.log('Site successfully built to apps/site/dist');
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  await buildSite();
}
