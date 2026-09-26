import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ARCHITECTURE_TEMPLATE = 'assets/architecture.html';

// Compiled modules live in dist/. The skill directory in this repository is the
// asset source. A packed install uses skill-runtime staged beside the package.
export function runtimeRoot(): string {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const repoSkill = path.resolve(here, '../../../birdify');
  const staged = path.resolve(here, '../skill-runtime');
  if (fs.existsSync(path.join(repoSkill, ARCHITECTURE_TEMPLATE))) return repoSkill;
  if (fs.existsSync(path.join(staged, ARCHITECTURE_TEMPLATE))) return staged;
  throw new Error('Missing Birdify runtime assets. Rebuild @birdify/core.');
}
