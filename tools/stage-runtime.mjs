import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const source = path.join(root, 'birdify');
const destination = path.join(root, 'packages/core/skill-runtime');
const files = [
  'LICENSE',
  'THIRD_PARTY_NOTICES',
  'references/foundation.txt',
  'examples/architecture.json',
];

fs.rmSync(destination, { recursive: true, force: true });
fs.mkdirSync(destination, { recursive: true });
fs.cpSync(path.join(source, 'assets'), path.join(destination, 'assets'), { recursive: true });
for (const file of files) {
  const target = path.join(destination, file);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(path.join(source, file), target);
}
console.log('Staged CLI runtime assets.');
