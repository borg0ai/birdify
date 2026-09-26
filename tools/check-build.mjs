import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const packageRoot = fs.existsSync(path.join(root, 'birdify')) ? path.join(root, 'birdify') : root;
const output = fs.mkdtempSync(path.join(os.tmpdir(), 'birdify-build-'));
const forbiddenScripts = [
  'scripts/birdify.mjs', 'scripts/validate.mjs', 'scripts/render.mjs', 'scripts/render-constraints.mjs',
  'scripts/discover-constraints.mjs', 'scripts/compile-constraint-rules.mjs', 'scripts/constraint-freshness.mjs',
  'scripts/constraint-rule-history.mjs', 'scripts/constraint-rule-view.mjs', 'scripts/constraint-types.mjs',
  'scripts/contracts/models.mjs', 'scripts/contracts/parse.mjs',
];
try {
  const result = spawnSync(process.execPath, [path.join(root, 'node_modules/typescript/bin/tsc'), '--project', path.join(root, 'packages/core/tsconfig.json'), '--outDir', output], { stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error('TypeScript build failed.');
  const dist = path.join(root, 'packages/core/dist');
  for (const file of fs.readdirSync(output, { recursive: true, encoding: 'utf8' })) {
    if (!fs.statSync(path.join(output, file)).isFile()) continue;
    const relative = `packages/core/dist/${file.replaceAll('\\', '/')}`;
    const target = path.join(dist, file);
    if (!fs.existsSync(target) || fs.readFileSync(target, 'utf8').replace(/\r\n/g, '\n') !== fs.readFileSync(path.join(output, file), 'utf8')) {
      throw new Error(`Generated ${relative} is stale. Run pnpm run build.`);
    }
  }
  for (const file of forbiddenScripts) {
    if (fs.existsSync(path.join(packageRoot, file))) throw new Error(`Skill payload still contains CLI implementation: ${file}`);
  }
  const inventory = JSON.parse(fs.readFileSync(path.join(root, 'config/build-artifacts.json'), 'utf8'));
  if (!Array.isArray(inventory) || !inventory.every((file) => typeof file === 'string') || new Set(inventory).size !== inventory.length) {
    throw new Error('Invalid generated artifact inventory.');
  }
  const browser = ['assets/viewer.js', 'assets/constraint-canvas.js', 'assets/theme.js', ...(fs.existsSync(path.join(packageRoot, 'assets/icons')) ? ['sun', 'moon', 'layers', 'database', 'zoom-in', 'zoom-out', 'maximize', 'scan', 'x', 'panel-right', 'panels-top-left', 'code', 'zap', 'list-ordered', 'shield-check', 'box', 'skip-forward', 'columns-2', 'chevron-left', 'chevron-right'].map((icon) => `assets/icons/${icon}.svg`) : [])];
  const expected = new Set([...browser, 'schemas/activity.schema.json', 'schemas/architecture.schema.json']);
  for (const file of inventory) {
    if (!expected.has(file) || !fs.existsSync(path.join(packageRoot, file))) throw new Error(`Obsolete or missing generated artifact: ${file}`);
  }
  for (const file of expected) {
    if (!inventory.includes(file)) throw new Error(`Generated ${file} is missing from build-artifacts.json.`);
  }
  for (const directory of ['scripts', 'assets']) {
    const directoryPath = path.join(packageRoot, directory);
    if (!fs.existsSync(directoryPath)) continue;
    for (const file of fs.readdirSync(directoryPath, { recursive: true, encoding: 'utf8' })) {
      const relative = `${directory}/${file.replaceAll('\\', '/')}`;
      if (/\.(?:mjs|cjs|js)$/.test(file) && !inventory.includes(relative)) throw new Error(`Untracked executable artifact: ${relative}`);
    }
  }
  const schemaExporter = path.join(root, 'tools/contracts/export.mjs');
  if (!fs.existsSync(schemaExporter)) throw new Error('Missing tools/contracts/export.mjs.');
  const schemas = spawnSync(process.execPath, [schemaExporter, '--check'], { stdio: 'inherit' });
  if (schemas.error) throw schemas.error;
  if (schemas.status !== 0) throw new Error('Generated schema check failed.');
  console.log('TypeScript output and exchange schemas match distributed artifacts.');
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
} finally {
  fs.rmSync(output, { recursive: true, force: true });
}
