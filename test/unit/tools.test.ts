import { test, onTestFinished } from 'vitest';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = fileURLToPath(new URL('../../', import.meta.url));
const cli = path.join(root, 'toolings/birdify-dev/dist/birdify-dev.mjs');
const run = (cwd: string, ...args: string[]) => spawnSync(process.execPath, [cli, ...args], { encoding: 'utf8', cwd });
const makeRepo = (prefix: string) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  for (const directory of ['birdify', 'templates/viewer']) fs.mkdirSync(path.join(root, directory), { recursive: true });
  return root;
};

test('distributable skill package excludes development source', () => {
  const packageRoot = path.join(root, 'birdify');
  const forbidden = ['src', 'test', 'templates', 'toolings', 'tsconfig.json', 'tsconfig.types.json', 'tsconfig.viewer.json', 'tsconfig.test.json'];
  for (const relative of forbidden) assert.equal(fs.existsSync(path.join(packageRoot, relative)), false, relative);
  assert.equal(fs.existsSync(path.join(packageRoot, 'package.json')), false);
  assert.equal(fs.existsSync(path.join(packageRoot, 'package-lock.json')), false);
  assert.equal(fs.existsSync(path.join(packageRoot, 'pnpm-lock.yaml')), false);
});

test('check-docs CLI detects drift and invalid records without overwriting them', () => {
  const fixture = makeRepo('birdify-docs-test-');
  onTestFinished(() => fs.rmSync(fixture, { recursive: true, force: true }));
  for (const directory of ['docs', '.github', 'config']) fs.mkdirSync(path.join(fixture, directory), { recursive: true });
  fs.writeFileSync(path.join(fixture, 'README.md'), '# Example\n\n[中文](README.zh.md)\n');
  fs.writeFileSync(path.join(fixture, 'README.zh.md'), '# 示例\n\n[English](README.md)\n');
  assert.equal(run(fixture, 'check-docs', '--update').status, 0);
  assert.equal(run(fixture, 'check-docs').status, 0);
  const record = path.join(fixture, 'config/i18n.json');
  const saved = fs.readFileSync(record, 'utf8');
  fs.appendFileSync(path.join(fixture, 'README.md'), '\nChanged\n');
  const drift = run(fixture, 'check-docs');
  assert.equal(drift.status, 1);
  assert.match(drift.stderr, /README.md: synchronization confirmation required/);
  assert.equal(fs.readFileSync(record, 'utf8'), saved);
  for (const invalid of ['null', '[]', '"not a record"']) {
    fs.writeFileSync(record, invalid);
    const result = run(fixture, 'check-docs');
    assert.equal(result.status, 1);
    assert.match(result.stderr, /Documentation hash record must be an object/);
    assert.equal(fs.readFileSync(record, 'utf8'), invalid);
  }
});

test('check-build CLI compares fresh compiler output and catches artifact drift', () => {
  const fixture = makeRepo('birdify-build-test-');
  onTestFinished(() => fs.rmSync(fixture, { recursive: true, force: true }));
  for (const directory of ['packages/core/src', 'packages/core/dist/contracts', 'node_modules/typescript/bin', 'birdify/assets', 'birdify/schemas', 'birdify/scripts', 'config']) fs.mkdirSync(path.join(fixture, directory), { recursive: true });
  const staticArtifacts = ['assets/viewer.js', 'assets/constraint-canvas.js', 'assets/theme.js', 'schemas/activity.schema.json', 'schemas/architecture.schema.json'];
  for (const file of staticArtifacts) fs.writeFileSync(path.join(fixture, 'birdify', file), '');
  fs.writeFileSync(path.join(fixture, 'config/build-artifacts.json'), JSON.stringify(staticArtifacts));
  const definitions = ['mapConstraint', 'mapLanguage', 'mapTranslations', 'mapTranslation', 'mapId', 'mapText', 'mapPath', 'mapQuestions', 'mapEvidenceList', 'eventPaths'];
  fs.writeFileSync(path.join(fixture, 'packages/core/dist/contracts/models.js'), `export const architectureSchema = { type: 'object' };\nexport const activitySchema = { type: 'object' };\n${definitions.map((name) => `export const ${name} = {};`).join('\n')}\n`);
  assert.equal(run(fixture, 'export-schemas').status, 0);
  const compiler = pathToFileURL(path.join(root, 'node_modules/typescript/bin/tsc')).href;
  fs.writeFileSync(path.join(fixture, 'node_modules/typescript/bin/tsc'), `import(${JSON.stringify(compiler)});\n`);
  fs.writeFileSync(path.join(fixture, 'packages/core/tsconfig.json'), JSON.stringify({ compilerOptions: { module: 'NodeNext', target: 'ES2022', rootDir: 'src', outDir: 'dist', types: [], newLine: 'lf' }, include: ['src/**/*.ts'] }));
  fs.writeFileSync(path.join(fixture, 'packages/core/src/example.ts'), 'export const value: number = 1;\n');
  const initial = spawnSync(process.execPath, [path.join(root, 'node_modules/typescript/bin/tsc'), '--project', path.join(fixture, 'packages/core/tsconfig.json')], { encoding: 'utf8' });
  assert.equal(initial.status, 0, initial.stdout + initial.stderr);
  const checked = run(fixture, 'check-build');
  assert.equal(checked.status, 0, checked.stdout + checked.stderr);
  const artifact = path.join(fixture, 'packages/core/dist/example.js');
  const original = fs.readFileSync(artifact, 'utf8');
  fs.writeFileSync(artifact, 'export const value = 2;\n');
  assert.match(run(fixture, 'check-build').stderr, /Generated packages\/core\/dist\/example.js is stale/);
  fs.unlinkSync(artifact);
  assert.match(run(fixture, 'check-build').stderr, /Generated packages\/core\/dist\/example.js is stale/);
  fs.writeFileSync(artifact, original);
  fs.writeFileSync(path.join(fixture, 'birdify/scripts/retired.mjs'), '');
  assert.match(run(fixture, 'check-build').stderr, /Untracked executable artifact: scripts\/retired.mjs/);
  fs.unlinkSync(path.join(fixture, 'birdify/scripts/retired.mjs'));
  fs.writeFileSync(path.join(fixture, 'birdify/scripts/validate.mjs'), '');
  assert.match(run(fixture, 'check-build').stderr, /Skill payload still contains CLI implementation: scripts\/validate.mjs/);
  fs.unlinkSync(path.join(fixture, 'birdify/scripts/validate.mjs'));
  fs.writeFileSync(path.join(fixture, 'config/build-artifacts.json'), JSON.stringify(staticArtifacts.filter((file) => file !== 'assets/viewer.js')));
  assert.match(run(fixture, 'check-build').stderr, /missing from build-artifacts.json/);
});

test('validate-skill CLI accepts package and rejects forbidden payload and metadata', () => {
  const valid = run(root, 'validate-skill', 'birdify');
  assert.equal(valid.status, 0, valid.stdout + valid.stderr);
  assert.deepEqual(JSON.parse(valid.stdout).errors, []);
  const fixture = fs.mkdtempSync(path.join(os.tmpdir(), 'birdify-skill-val-'));
  onTestFinished(() => fs.rmSync(fixture, { recursive: true, force: true }));
  const pkg = path.join(fixture, 'birdify');
  fs.cpSync(path.join(root, 'birdify'), pkg, { recursive: true });
  const validate = () => run(root, 'validate-skill', pkg);
  const nodeModules = path.join(pkg, 'node_modules');
  fs.mkdirSync(nodeModules);
  assert.match(validate().stdout, /Forbidden directory: node_modules/);
  fs.rmdirSync(nodeModules);
  const inventory = path.join(pkg, 'build-artifacts.json');
  fs.writeFileSync(inventory, '[]');
  assert.match(validate().stdout, /Forbidden internal inventory/);
  fs.unlinkSync(inventory);
  const fixtureDir = path.join(pkg, 'fixtures');
  fs.mkdirSync(fixtureDir);
  assert.match(validate().stdout, /Forbidden directory: fixtures/);
  fs.rmdirSync(fixtureDir);
  const source = path.join(pkg, 'scripts/sample.mts');
  fs.mkdirSync(path.dirname(source), { recursive: true });
  fs.writeFileSync(source, 'export {};');
  assert.match(validate().stdout, /Forbidden TypeScript source/);
  fs.unlinkSync(source);
  const releaseFile = path.join(pkg, 'skill-release.json');
  const release = JSON.parse(fs.readFileSync(releaseFile, 'utf8')) as Record<string, unknown>;
  for (const invalid of [{ ...release, schemaVersion: 2 }, { ...release, channel: 'unknown' }, { ...release, version: '01.0.0-dev.0' }, { ...release, version: '1.0.0-01' }, { ...release, channel: 'development', version: '1.0.0' }]) {
    fs.writeFileSync(releaseFile, JSON.stringify(invalid));
    const rejected = validate();
    assert.equal(rejected.status, 1, JSON.stringify(invalid));
    assert.equal(rejected.stderr, '');
  }
});

test('export-schemas CLI works outside checkout and rejects missing or incomplete contracts', () => {
  const checked = spawnSync(process.execPath, [cli, 'export-schemas', '--check'], { encoding: 'utf8', cwd: os.tmpdir() });
  assert.equal(checked.status, 0, checked.stdout + checked.stderr);
  const fixture = makeRepo('birdify-export-');
  onTestFinished(() => fs.rmSync(fixture, { recursive: true, force: true }));
  const missing = run(fixture, 'export-schemas');
  assert.equal(missing.status, 1);
  assert.match(missing.stderr, /Missing packages\/core\/dist\/contracts\/models\.js/);
  const models = path.join(fixture, 'packages/core/dist/contracts/models.js');
  fs.mkdirSync(path.dirname(models), { recursive: true });
  fs.writeFileSync(models, 'export const architectureSchema = { type: "object" };\n');
  for (const name of ['architecture', 'activity']) {
    const file = path.join(fixture, 'birdify/schemas', `${name}.schema.json`);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, 'untouched\n');
  }
  const incomplete = run(fixture, 'export-schemas');
  assert.equal(incomplete.status, 1);
  assert.match(incomplete.stderr, /Runtime contracts missing mapConstraint/);
  assert.equal(fs.readFileSync(path.join(fixture, 'birdify/schemas/architecture.schema.json'), 'utf8'), 'untouched\n');
});
