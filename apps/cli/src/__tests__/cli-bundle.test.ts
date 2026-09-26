import assert from 'node:assert/strict';
import fs from 'node:fs';
import { test } from 'vitest';
import { fileURLToPath } from 'node:url';

const bundle = fs.readFileSync(fileURLToPath(new URL('../../dist/birdify.mjs', import.meta.url)), 'utf8');

test('vite cli bundle inlines core and keeps npm dependencies external', () => {
  assert.match(bundle, /^#!\/usr\/bin\/env node\n/);
  assert.equal(/from ['"]@birdify\/core['"]/.test(bundle), false);
  assert.match(bundle, /from ['"]@sinclair\/typebox['"]/);
  assert.equal(bundle.includes('TypeRegistry'), false);
  assert.equal(bundle.includes('skill-runtime'), false);
  assert.match(bundle, /Birdify agent skill not found\. Install it with npx --yes @borg0ai\/birdify install/);
  assert.match(bundle, /\.agents\/skills\/birdify/);
});
