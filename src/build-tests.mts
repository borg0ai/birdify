import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import { spawnSync } from 'node:child_process';

const outputRoot = fileURLToPath(new URL('../', import.meta.url));
const root = fs.existsSync(path.join(outputRoot, 'birdify')) ? outputRoot : path.resolve(outputRoot, '..');
const packageRoot = path.join(root, 'birdify');
const entries = fs.readdirSync(path.join(root, 'test')).filter(file => file.endsWith('.test.mts') || file.endsWith('.browser.mts'));
await build({
  absWorkingDir: root, entryPoints: entries.map(file => `test/${file}`),
  outdir: '.test-build', outExtension: { '.js': '.mjs' },
  bundle: true, packages: 'external', platform: 'node', target: 'node18', format: 'esm',
  // Test the distributed modules; bundling CLI entries would change import.meta.url
  // and accidentally execute their main guards in the test process.
  plugins: [{ name: 'distributed-source', setup(builder) {
    builder.onResolve({ filter: /^\.\.\/src\// }, args => ({ path: path.join(packageRoot, 'scripts', args.path.replace('../src/', '')), external: true }));
  } }],
});

const mode = process.argv[2];
if (mode !== undefined && mode !== '--unit' && mode !== '--browser') throw new Error(`Unknown test mode: ${mode}`);
if (mode) {
  const files = entries.filter(file => file.endsWith(mode === '--unit' ? '.test.mts' : '.browser.mts'))
    .map(file => path.join(root, '.test-build', file.replace(/\.mts$/, '.mjs')));
  const commands = mode === '--unit' ? [['--test', ...files]] : files.map(file => [file]);
  for (const args of commands) {
    const result = spawnSync(process.execPath, args, { cwd: root, stdio: 'inherit' });
    if (result.error) throw result.error;
    if (result.status !== 0) { process.exitCode = result.status ?? 1; break; }
  }
}
