import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const destination = process.argv[2] ? path.resolve(process.argv[2]) : fs.mkdtempSync(path.join(os.tmpdir(), 'birdify-pack-'));
const cli = JSON.parse(fs.readFileSync(path.join(root, 'apps/cli/package.json'), 'utf8'));
fs.rmSync(destination, { recursive: true, force: true });
fs.mkdirSync(destination, { recursive: true });
fs.cpSync(path.join(root, 'apps/cli/dist'), path.join(destination, 'dist'), { recursive: true });
fs.cpSync(path.join(root, 'apps/cli/bin'), path.join(destination, 'bin'), { recursive: true });
fs.copyFileSync(path.join(root, 'apps/cli/README.md'), path.join(destination, 'README.md'));
fs.writeFileSync(path.join(destination, 'package.json'), JSON.stringify({
  name: 'birdify',
  version: cli.version,
  description: cli.description,
  license: 'MIT',
  type: 'module',
  bin: { birdify: './bin/birdify.mjs' },
  files: ['bin', 'dist', 'README.md'],
  engines: cli.engines,
  dependencies: cli.dependencies,
}, null, 2) + '\n');
const packed = spawnSync('npm', ['pack', '--pack-destination', destination], { cwd: destination, encoding: 'utf8' });
if (packed.status !== 0) {
  console.error(packed.stdout + packed.stderr);
  process.exit(1);
}
const tarball = packed.stdout.trim().split(/\r?\n/).at(-1);
console.log(path.join(destination, tarball));
