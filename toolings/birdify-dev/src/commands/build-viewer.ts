import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { build, type BuildOptions, type Plugin } from 'esbuild';
import { findRepoRoot } from '../repo-root.js';

const require = createRequire(import.meta.url);

const CHECK_FLAG = '--check';
const SKILL_DIR = 'birdify';
const TEMPLATE_DIR = 'templates/viewer';
const ICON_ASSET_DIR = 'assets/icons';
const LUCIDE_PACKAGE = 'lucide-static/package.json';
const LUCIDE_ICONS = 'icons';
const BANNER_PREFIX = '// Generated from templates/viewer/';
const BANNER_SUFFIX = '. Do not edit directly.';
const BROWSER_TARGET = 'es2022';
const GLOBAL_CONSTRAINT_CANVAS = 'BirdifyConstraintCanvas';
const BUILT_MESSAGE = 'Built skill viewer assets.';
const MATCH_MESSAGE = 'Skill viewer assets match templates/viewer.';

const ICONS = [
  'sun',
  'moon',
  'layers',
  'database',
  'zoom-in',
  'zoom-out',
  'maximize',
  'scan',
  'x',
  'panel-right',
  'panels-top-left',
  'code',
  'zap',
  'list-ordered',
  'shield-check',
  'box',
  'skip-forward',
  'columns-2',
  'chevron-left',
  'chevron-right',
] as const;

type ViewerPage = {
  entry: string;
  asset: string;
  globalName?: string;
};

const PAGES: readonly ViewerPage[] = [
  { entry: 'main.ts', asset: 'assets/viewer.js' },
  { entry: 'constraint-canvas.ts', asset: 'assets/constraint-canvas.js', globalName: GLOBAL_CONSTRAINT_CANVAS },
  { entry: 'theme.ts', asset: 'assets/theme.js' },
];

function resolveTsSpecifier(): Plugin {
  return {
    name: 'resolve-ts-specifier',
    setup(builder) {
      builder.onResolve({ filter: /^\./ }, (args) => {
        if (!args.path.endsWith('.js')) return null;
        const file = path.resolve(args.resolveDir, args.path.replace(/\.js$/, '.ts'));
        return fs.existsSync(file) ? { path: file } : null;
      });
    },
  };
}

function lucideIcon(name: string): string {
  // 从本包依赖解析图标，不依赖仓库根 node_modules 的提升布局。
  const packageJson = require.resolve(LUCIDE_PACKAGE);
  return path.join(path.dirname(packageJson), LUCIDE_ICONS, `${name}.svg`);
}

async function pageScript(repoRoot: string, page: ViewerPage): Promise<string> {
  const source = path.join(repoRoot, TEMPLATE_DIR, page.entry);
  const options: BuildOptions = {
    absWorkingDir: repoRoot,
    entryPoints: [source],
    bundle: true,
    format: 'iife',
    platform: 'browser',
    target: BROWSER_TARGET,
    write: false,
    plugins: [resolveTsSpecifier()],
    banner: { js: `${BANNER_PREFIX}${page.entry}${BANNER_SUFFIX}` },
  };
  if (page.globalName !== undefined) options.globalName = page.globalName;
  const result = await build(options);
  const output = result.outputFiles?.[0];
  if (!output) throw new Error(`No browser output for templates/viewer/${page.entry}.`);
  return output.text;
}

export async function runBuildViewer(args: readonly string[], cwd = process.cwd()): Promise<void> {
  const unexpected = args.filter((arg) => arg !== CHECK_FLAG);
  if (unexpected.length > 0) throw new Error(`Unknown build-viewer argument: ${unexpected.join(' ')}`);
  const check = args.includes(CHECK_FLAG);
  const repoRoot = findRepoRoot(cwd);
  const packageRoot = path.join(repoRoot, SKILL_DIR);
  for (const page of PAGES) {
    const text = await pageScript(repoRoot, page);
    const file = path.join(packageRoot, page.asset);
    if (check) {
      if (!fs.existsSync(file) || fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n') !== text) {
        throw new Error(`Generated ${page.asset} is stale. Run pnpm build:viewer.`);
      }
    } else {
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, text);
    }
  }
  for (const icon of ICONS) {
    const source = lucideIcon(icon);
    const target = path.join(packageRoot, ICON_ASSET_DIR, `${icon}.svg`);
    if (!fs.existsSync(source)) throw new Error(`Missing source icon: ${icon}.svg`);
    if (check) {
      if (!fs.existsSync(target) || fs.readFileSync(target, 'utf8') !== fs.readFileSync(source, 'utf8')) {
        throw new Error(`Skill icon assets/icons/${icon}.svg does not match lucide-static.`);
      }
    } else {
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.copyFileSync(source, target);
    }
  }
  console.log(check ? MATCH_MESSAGE : BUILT_MESSAGE);
}
