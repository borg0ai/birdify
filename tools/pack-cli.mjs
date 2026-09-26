import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const destination = process.argv[2] ? path.resolve(process.argv[2]) : fs.mkdtempSync(path.join(os.tmpdir(), 'birdify-pack-'));
const core = JSON.parse(fs.readFileSync(path.join(root, 'packages/core/package.json'), 'utf8'));
const cli = JSON.parse(fs.readFileSync(path.join(root, 'apps/cli/package.json'), 'utf8'));
fs.rmSync(destination, { recursive: true, force: true });
fs.mkdirSync(destination, { recursive: true });
fs.cpSync(path.join(root, 'apps/cli/dist'), path.join(destination, 'dist'), { recursive: true });
fs.cpSync(path.join(root, 'packages/core/dist'), path.join(destination, 'vendor/core/dist'), { recursive: true });
fs.cpSync(path.join(root, 'packages/core/skill-runtime'), path.join(destination, 'vendor/core/skill-runtime'), { recursive: true });
fs.copyFileSync(path.join(root, 'apps/cli/README.md'), path.join(destination, 'README.md'));
fs.copyFileSync(path.join(root, 'birdify/LICENSE'), path.join(destination, 'LICENSE'));
for (const file of fs.readdirSync(path.join(destination, 'dist'), { recursive: true })) {
  const absolute = path.join(destination, 'dist', file);
  if (!absolute.endsWith('.mjs')) continue;
  const depth = file.split(/[\\/]/).length - 1;
  const relative = `${'../'.repeat(depth + 1)}vendor/core/dist/index.js`;
  const source = fs.readFileSync(absolute, 'utf8');
  const rewritten = source.replaceAll("from '@birdify/core'", `from '${relative}'`).replaceAll('from "@birdify/core"', `from '${relative}'`);
  fs.writeFileSync(absolute, rewritten);
}
fs.writeFileSync(path.join(destination, 'package.json'), JSON.stringify({
  name: 'birdify',
  version: cli.version,
  description: cli.description,
  license: 'MIT',
  type: 'module',
  bin: { birdify: './dist/birdify.mjs' },
  files: ['dist', 'vendor', 'README.md', 'LICENSE'],
  engines: cli.engines,
  dependencies: core.dependencies,
}, null, 2) + '\n');
const packed = spawnSync('npm', ['pack', '--pack-destination', destination], { cwd: destination, encoding: 'utf8' });
if (packed.status !== 0) {
  console.error(packed.stdout + packed.stderr);
  process.exit(1);
}
const tarball = packed.stdout.trim().split(/\r?\n/).at(-1);
console.log(path.join(destination, tarball));
