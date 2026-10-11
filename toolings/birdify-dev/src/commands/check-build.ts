import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { findRepoRootForCommand } from '../repo-root.js';
import { runExportSchemas } from './export-schemas.js';

const FORBIDDEN_SCRIPTS = [
  'scripts/birdify.mjs', 'scripts/validate.mjs', 'scripts/render.mjs', 'scripts/render-constraints.mjs',
  'scripts/discover-constraints.mjs', 'scripts/compile-constraint-rules.mjs', 'scripts/constraint-freshness.mjs',
  'scripts/constraint-rule-history.mjs', 'scripts/constraint-rule-view.mjs', 'scripts/constraint-types.mjs',
  'scripts/contracts/models.mjs', 'scripts/contracts/parse.mjs',
];
const BROWSER_ARTIFACTS = ['assets/viewer.js', 'assets/constraint-canvas.js', 'assets/theme.js'];
const ICONS = ['sun', 'moon', 'layers', 'database', 'zoom-in', 'zoom-out', 'maximize', 'scan', 'x', 'panel-right', 'panels-top-left', 'code', 'zap', 'list-ordered', 'shield-check', 'box', 'skip-forward', 'columns-2', 'chevron-left', 'chevron-right'];

function expectedArtifacts(packageRoot: string): Set<string> {
  const icons = fs.existsSync(path.join(packageRoot, 'assets/icons')) ? ICONS.map((icon) => `assets/icons/${icon}.svg`) : [];
  return new Set([...BROWSER_ARTIFACTS, ...icons, 'schemas/activity.schema.json', 'schemas/architecture.schema.json']);
}

function verifyInventory(root: string, packageRoot: string, expected: Set<string>): void {
  const inventory = JSON.parse(fs.readFileSync(path.join(root, 'config/build-artifacts.json'), 'utf8')) as unknown;
  if (!Array.isArray(inventory) || !inventory.every((file) => typeof file === 'string') || new Set(inventory).size !== inventory.length) {
    throw new Error('Invalid generated artifact inventory.');
  }
  for (const file of inventory as string[]) {
    if (!expected.has(file) || !fs.existsSync(path.join(packageRoot, file))) throw new Error(`Obsolete or missing generated artifact: ${file}`);
  }
  for (const file of expected) {
    if (!(inventory as string[]).includes(file)) throw new Error(`Generated ${file} is missing from build-artifacts.json.`);
  }
  for (const directory of ['scripts', 'assets']) {
    const base = path.join(packageRoot, directory);
    if (!fs.existsSync(base)) continue;
    for (const file of fs.readdirSync(base, { recursive: true, encoding: 'utf8' })) {
      const relative = `${directory}/${file.replaceAll('\\', '/')}`;
      if (/\.(?:mjs|cjs|js)$/.test(file) && !(inventory as string[]).includes(relative)) throw new Error(`Untracked executable artifact: ${relative}`);
    }
  }
}

export async function runCheckBuild(_args: readonly string[], cwd = process.cwd()): Promise<void> {
  const root = findRepoRootForCommand(cwd);
  const output = fs.mkdtempSync(path.join(os.tmpdir(), 'birdify-build-'));
  try {
    const compiler = path.join(root, 'node_modules/typescript/bin/tsc');
    const result = spawnSync(process.execPath, [compiler, '--project', path.join(root, 'packages/core/tsconfig.json'), '--outDir', output], { cwd: root, stdio: 'inherit' });
    if (result.error) throw result.error;
    if (result.status !== 0) throw new Error('TypeScript build failed.');
    for (const file of fs.readdirSync(output, { recursive: true, encoding: 'utf8' })) {
      if (!fs.statSync(path.join(output, file)).isFile()) continue;
      const target = path.join(root, 'packages/core/dist', file);
      const actual = fs.readFileSync(path.join(output, file), 'utf8').replace(/\r\n/g, '\n');
      if (!fs.existsSync(target) || fs.readFileSync(target, 'utf8').replace(/\r\n/g, '\n') !== actual) throw new Error(`Generated packages/core/dist/${file.replaceAll('\\', '/')} is stale. Run pnpm run build.`);
    }
    const packageRoot = path.join(root, 'birdify');
    for (const file of FORBIDDEN_SCRIPTS) if (fs.existsSync(path.join(packageRoot, file))) throw new Error(`Skill payload still contains CLI implementation: ${file}`);
    verifyInventory(root, packageRoot, expectedArtifacts(packageRoot));
    await runExportSchemas(['--check'], root);
    console.log('TypeScript output and exchange schemas match distributed artifacts.');
  } finally {
    fs.rmSync(output, { recursive: true, force: true });
  }
}
