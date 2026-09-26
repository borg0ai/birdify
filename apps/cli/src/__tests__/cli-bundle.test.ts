import assert from 'node:assert/strict';
import fs from 'node:fs';
import { test } from 'vitest';
import { fileURLToPath } from 'node:url';

const bundle = fs.readFileSync(fileURLToPath(new URL('../../dist/birdify.mjs', import.meta.url)), 'utf8');

test('vite cli bundle keeps core and typebox external', () => {
  assert.match(bundle, /^#!\/usr\/bin\/env node\n/);
  assert.match(bundle, /from ['"]@birdify\/core['"]/);
  assert.equal(bundle.includes('@sinclair/typebox'), false);
  assert.equal(bundle.includes('TypeRegistry'), false);
});
