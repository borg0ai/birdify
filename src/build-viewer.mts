import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

// Source: src/build-viewer.mts. Regenerate scripts/build-viewer.mjs with pnpm run build.
const outputRoot = fileURLToPath(new URL('../', import.meta.url));
const root = fs.existsSync(path.join(outputRoot, 'birdify')) ? outputRoot : path.resolve(outputRoot, '..');
const packageRoot = path.join(root, 'birdify');
const check = process.argv.slice(2).includes('--check');
const icons = ['sun', 'moon', 'layers', 'database', 'zoom-in', 'zoom-out', 'maximize', 'scan', 'x', 'panel-right', 'panels-top-left', 'code', 'zap', 'list-ordered', 'shield-check', 'box', 'skip-forward', 'columns-2', 'chevron-left', 'chevron-right'];
try {
  for (const module of ['routing', 'i18n', 'main', 'constraint-canvas', 'theme', 'site'] as const) {
    const format = module === 'routing' || module === 'i18n' ? 'esm' : 'iife';
    const target = module === 'main' ? 'assets/viewer.js' : module === 'constraint-canvas' ? 'assets/constraint-canvas.js' : module === 'theme' ? 'assets/theme.js' : module === 'site' ? 'docs/site.js' : `scripts/viewer/${module}.mjs`;
    const source = module === 'site' ? 'src/site/main.mts' : `src/viewer/${module}.mts`;
    const result = await build({
      absWorkingDir: root,
      entryPoints: [source],
      bundle: true,
      format,
      ...(module === 'constraint-canvas' ? { globalName: 'BirdifyConstraintCanvas' } : {}),
      platform: 'browser',
      target: 'es2022',
      write: false,
      banner: { js: `// Generated from ${source}. Do not edit directly.` },
    });
    const output = result.outputFiles[0];
    if (!output) throw new Error(`No browser output for ${target}.`);
    const files = module === 'site' ? [path.join(packageRoot, target), path.join(root, target)] : [path.join(packageRoot, target)];
    for (const file of files) {
      if (check) {
        if (!fs.existsSync(file) || fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n') !== output.text) {
          throw new Error(`Generated ${path.relative(root, file)} is stale. Run pnpm run build.`);
        }
      } else {
        fs.mkdirSync(path.dirname(file), { recursive: true });
        fs.writeFileSync(file, output.text);
      }
    }
  }
  for (const icon of icons) {
    const source = path.join(root, 'node_modules/lucide-static/icons', `${icon}.svg`);
    const target = path.join(packageRoot, 'assets/icons', `${icon}.svg`);
    if (!fs.existsSync(source)) throw new Error(`Missing source icon: ${icon}.svg`);
    if (check) {
      if (!fs.existsSync(target) || fs.readFileSync(target, 'utf8') !== fs.readFileSync(source, 'utf8')) {
        throw new Error(`Generated assets/icons/${icon}.svg is stale. Run pnpm run build.`);
      }
    } else {
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.copyFileSync(source, target);
    }
  }
  console.log(check ? 'Browser artifacts match TypeScript sources.' : 'Built browser artifacts.');
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
