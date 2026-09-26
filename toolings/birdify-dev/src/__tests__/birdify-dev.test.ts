import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { test, onTestFinished } from 'vitest';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../../../../', import.meta.url));
const CLI = fileURLToPath(new URL('../../dist/birdify-dev.mjs', import.meta.url));
const require = createRequire(CLI);
const SUN_ICON = path.join(path.dirname(require.resolve('lucide-static/package.json')), 'icons/sun.svg');
const CHECK_FLAG = '--check';
const COMMAND = 'build-viewer';
const SKILL_ASSETS = path.join(ROOT, 'birdify/assets');
const BANNER_PREFIX = '// Generated from templates/viewer/';
const BANNER_SUFFIX = '. Do not edit directly.';
const BANNER = `${BANNER_PREFIX}theme.ts${BANNER_SUFFIX}`;
const STALE_VIEWER = 'Generated assets/viewer.js is stale. Run pnpm build:viewer.';
const STALE_THEME = 'Generated assets/theme.js is stale. Run pnpm build:viewer.';
const ICON_MISMATCH = 'Skill icon assets/icons/sun.svg does not match lucide-static.';
const UNKNOWN_ARGUMENT = 'Unknown build-viewer argument: --force';
const MISSING_REPOSITORY = 'Cannot find the Birdify repository';
const GENERATED_PAGES = [
  ['theme.js', 'theme.ts'],
  ['viewer.js', 'main.ts'],
  ['constraint-canvas.js', 'constraint-canvas.ts'],
] as const;

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function run(cwd: string, args: readonly string[]) {
  return spawnSync(process.execPath, [CLI, ...args], { encoding: 'utf8', cwd });
}

function writeViewerTemplate(repo: string): void {
  const template = path.join(repo, 'templates/viewer');
  fs.mkdirSync(template, { recursive: true });
  fs.mkdirSync(path.join(repo, 'birdify'), { recursive: true });
  fs.writeFileSync(path.join(template, 'routing.ts'), 'export const label = "route";\n');
  fs.writeFileSync(path.join(template, 'main.ts'), 'import { label } from "./routing.js";\nconsole.log(label);\n');
  fs.writeFileSync(path.join(template, 'constraint-canvas.ts'), 'export function mount(): number { return 1; }\n');
  fs.writeFileSync(path.join(template, 'theme.ts'), 'const theme = "light";\nvoid theme;\n');
}

test('built birdify-dev keeps esbuild external', () => {
  const bundle = fs.readFileSync(CLI, 'utf8');
  assert.match(bundle, /^#!\/usr\/bin\/env node\n/);
  assert.match(bundle, /from ['"]esbuild['"]/);
});

test('birdify-dev build-viewer writes assets and rejects stale output', () => {
  const repo = fs.mkdtempSync(path.join(os.tmpdir(), 'birdify-dev-'));
  onTestFinished(() => fs.rmSync(repo, { recursive: true, force: true }));
  writeViewerTemplate(repo);

  const built = run(repo, [COMMAND]);
  assert.equal(built.status, 0, built.stdout + built.stderr);
  assert.match(built.stdout, /Built skill viewer assets\./);
  const theme = fs.readFileSync(path.join(repo, 'birdify/assets/theme.js'), 'utf8');
  const viewer = fs.readFileSync(path.join(repo, 'birdify/assets/viewer.js'), 'utf8');
  const canvas = fs.readFileSync(path.join(repo, 'birdify/assets/constraint-canvas.js'), 'utf8');
  assert.match(theme, new RegExp(escapeRegExp(BANNER)));
  assert.match(viewer, /route/);
  assert.match(viewer, new RegExp(escapeRegExp(`${BANNER_PREFIX}main.ts${BANNER_SUFFIX}`)));
  assert.match(canvas, /BirdifyConstraintCanvas/);
  assert.match(canvas, new RegExp(escapeRegExp(`${BANNER_PREFIX}constraint-canvas.ts${BANNER_SUFFIX}`)));
  const writtenIcons = fs.readdirSync(path.join(repo, 'birdify/assets/icons')).filter((name) => name.endsWith('.svg')).sort();
  const shippedIcons = fs.readdirSync(path.join(SKILL_ASSETS, 'icons')).filter((name) => name.endsWith('.svg')).sort();
  assert.deepEqual(writtenIcons, shippedIcons);
  assert.equal(fs.readFileSync(path.join(repo, 'birdify/assets/icons/sun.svg'), 'utf8'), fs.readFileSync(SUN_ICON, 'utf8'));

  const checked = run(path.join(repo, 'birdify'), [COMMAND, CHECK_FLAG]);
  assert.equal(checked.status, 0, checked.stdout + checked.stderr);
  assert.match(checked.stdout, /Skill viewer assets match templates\/viewer\./);

  const viewerFile = path.join(repo, 'birdify/assets/viewer.js');
  const exactViewer = fs.readFileSync(viewerFile, 'utf8');
  fs.writeFileSync(viewerFile, exactViewer.replace(/\n/g, '\r\n'));
  const crlf = run(repo, [COMMAND, CHECK_FLAG]);
  assert.equal(crlf.status, 0, crlf.stdout + crlf.stderr);

  fs.writeFileSync(path.join(repo, 'birdify/assets/icons/sun.svg'), '<svg></svg>\n');
  const icon = run(repo, [COMMAND, CHECK_FLAG]);
  assert.equal(icon.status, 1);
  assert.match(icon.stderr, new RegExp(escapeRegExp(ICON_MISMATCH)));
  fs.copyFileSync(SUN_ICON, path.join(repo, 'birdify/assets/icons/sun.svg'));

  fs.rmSync(path.join(repo, 'birdify/assets/theme.js'));
  const missingTheme = run(repo, [COMMAND, CHECK_FLAG]);
  assert.equal(missingTheme.status, 1);
  assert.match(missingTheme.stderr, new RegExp(escapeRegExp(STALE_THEME)));

  const restored = run(repo, [COMMAND]);
  assert.equal(restored.status, 0, restored.stdout + restored.stderr);
  fs.writeFileSync(viewerFile, 'stale\n');
  const stale = run(repo, [COMMAND, CHECK_FLAG]);
  assert.equal(stale.status, 1);
  assert.match(stale.stderr, new RegExp(escapeRegExp(STALE_VIEWER)));
});

test('build-viewer rejects unknown arguments and a directory outside the repository', () => {
  const unknown = run(os.tmpdir(), [COMMAND, '--force']);
  assert.equal(unknown.status, 1);
  assert.match(unknown.stderr, new RegExp(escapeRegExp(UNKNOWN_ARGUMENT)));
  const missing = run(os.tmpdir(), [COMMAND]);
  assert.equal(missing.status, 1);
  assert.match(missing.stderr, new RegExp(escapeRegExp(MISSING_REPOSITORY)));
  const scripts = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8')) as { scripts: Record<string, string> };
  assert.equal(scripts.scripts['build:viewer'], 'birdify-dev build-viewer');
});

test('birdify-dev reports help and unknown commands', () => {
  const help = run(ROOT, []);
  assert.equal(help.status, 0, help.stderr);
  assert.match(help.stdout, /build-viewer \[--check\]/);
  const unknown = run(os.tmpdir(), ['nope']);
  assert.equal(unknown.status, 1);
  assert.match(unknown.stderr, /Usage: birdify-dev/);
});

test('birdify/assets match templates/viewer', () => {
  const checked = run(ROOT, [COMMAND, CHECK_FLAG]);
  assert.equal(checked.status, 0, checked.stdout + checked.stderr);
  assert.match(checked.stdout, /Skill viewer assets match templates\/viewer\./);

  for (const [file, entry] of GENERATED_PAGES) {
    const text = fs.readFileSync(path.join(SKILL_ASSETS, file), 'utf8');
    assert.match(text, new RegExp(`^${escapeRegExp(`${BANNER_PREFIX}${entry}${BANNER_SUFFIX}`)}`), file);
    assert.match(text, /"use strict"/, file);
  }
  const viewer = fs.readFileSync(path.join(SKILL_ASSETS, 'viewer.js'), 'utf8');
  assert.match(viewer, /function requiredAt/);
  assert.match(viewer, /templates\/viewer\/routing\.ts/);
  assert.match(fs.readFileSync(path.join(SKILL_ASSETS, 'constraint-canvas.js'), 'utf8'), /BirdifyConstraintCanvas/);

  const iconDir = path.join(SKILL_ASSETS, 'icons');
  const icons = fs.readdirSync(iconDir).filter((name) => name.endsWith('.svg')).sort();
  const inventory = JSON.parse(fs.readFileSync(path.join(ROOT, 'config/build-artifacts.json'), 'utf8')) as readonly string[];
  const listed = inventory.filter((item) => item.startsWith('assets/icons/')).map((item) => path.basename(item)).sort();
  assert.deepEqual(icons, listed);
  const lucideIcons = path.join(path.dirname(require.resolve('lucide-static/package.json')), 'icons');
  for (const icon of icons) {
    assert.equal(fs.readFileSync(path.join(iconDir, icon), 'utf8'), fs.readFileSync(path.join(lucideIcons, icon), 'utf8'), icon);
  }
});
