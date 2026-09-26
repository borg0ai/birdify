import { test, onTestFinished } from 'vitest';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = fileURLToPath(new URL('../../', import.meta.url));

test('distributable skill package excludes development source', () => {
  const packageRoot = path.join(root, 'birdify');
  const forbidden = ['src', 'test', 'templates', 'toolings', 'tsconfig.json', 'tsconfig.types.json', 'tsconfig.viewer.json', 'tsconfig.test.json'];
  for (const relative of forbidden) assert.equal(fs.existsSync(path.join(packageRoot, relative)), false, relative);
  assert.equal(fs.existsSync(path.join(packageRoot, 'package.json')), false);
  assert.equal(fs.existsSync(path.join(packageRoot, 'package-lock.json')), false);
  assert.equal(fs.existsSync(path.join(packageRoot, 'pnpm-lock.yaml')), false);
});

test('documentation checker detects drift and invalid records without overwriting them', () => {
  const fixture = fs.mkdtempSync(path.join(os.tmpdir(), 'birdify-docs-test-'));
  onTestFinished(() => fs.rmSync(fixture, { recursive: true, force: true }));
  for (const directory of ['scripts', 'references', 'docs', 'examples', '.github', 'config']) {
    fs.mkdirSync(path.join(fixture, directory));
  }
  const checker = path.join(fixture, 'scripts/check-docs.mjs');
  fs.copyFileSync(path.join(root, 'tools/check-docs.mjs'), checker);
  fs.writeFileSync(path.join(fixture, 'README.md'), '# Example\n\n[中文](README.zh.md)\n');
  fs.writeFileSync(path.join(fixture, 'README.zh.md'), '# 示例\n\n[English](README.md)\n');
  const run = (...args: string[]) => spawnSync(process.execPath, [checker, ...args], { encoding: 'utf8', cwd: os.tmpdir() });
  assert.equal(run('--update').status, 0);
  assert.equal(run().status, 0);
  const record = path.join(fixture, 'config/i18n.json');
  const saved = fs.readFileSync(record, 'utf8');
  fs.appendFileSync(path.join(fixture, 'README.md'), '\nChanged\n');
  const drift = run();
  assert.equal(drift.status, 1);
  assert.match(drift.stderr, /README.md: synchronization confirmation required/);
  assert.equal(fs.readFileSync(record, 'utf8'), saved);
  for (const invalid of ['null', '[]', '"not a record"']) {
    fs.writeFileSync(record, invalid);
    const result = run();
    assert.equal(result.status, 1);
    assert.match(result.stderr, /Documentation hash record must be an object/);
    assert.equal(fs.readFileSync(record, 'utf8'), invalid);
  }
});

test('build checker compares fresh compiler output and detects missing or stale artifacts', () => {
  const fixture = fs.mkdtempSync(path.join(os.tmpdir(), 'birdify-build-test-'));
  onTestFinished(() => fs.rmSync(fixture, { recursive: true, force: true }));
  for (const directory of ['packages/core/src', 'node_modules/typescript/bin', 'assets', 'schemas', 'scripts', 'config', 'tools/contracts']) {
    fs.mkdirSync(path.join(fixture, directory), { recursive: true });
  }
  const checker = path.join(fixture, 'tools/check-build.mjs');
  fs.mkdirSync(path.dirname(checker), { recursive: true });
  fs.copyFileSync(path.join(root, 'tools/check-build.mjs'), checker);
  const staticArtifacts = ['assets/viewer.js', 'assets/constraint-canvas.js', 'assets/theme.js', 'schemas/activity.schema.json', 'schemas/architecture.schema.json'];
  for (const file of staticArtifacts) fs.writeFileSync(path.join(fixture, file), '');
  fs.writeFileSync(path.join(fixture, 'config/build-artifacts.json'), JSON.stringify(staticArtifacts));
  fs.writeFileSync(path.join(fixture, 'tools/contracts/export.mjs'), '');
  const compiler = pathToFileURL(path.join(root, 'node_modules/typescript/bin/tsc')).href;
  fs.writeFileSync(path.join(fixture, 'node_modules/typescript/bin/tsc'), `import(${JSON.stringify(compiler)});\n`);
  fs.writeFileSync(path.join(fixture, 'packages/core/tsconfig.json'), JSON.stringify({
    compilerOptions: { module: 'NodeNext', target: 'ES2022', rootDir: 'src', outDir: 'dist', types: [], newLine: 'lf' },
    include: ['src/**/*.ts'],
  }));
  fs.writeFileSync(path.join(fixture, 'packages/core/src/example.ts'), 'export const value: number = 1;\n');
  const initial = spawnSync(process.execPath, [path.join(root, 'node_modules/typescript/bin/tsc'), '--project', path.join(fixture, 'packages/core/tsconfig.json')], { encoding: 'utf8' });
  assert.equal(initial.status, 0, initial.stdout + initial.stderr);
  const run = () => spawnSync(process.execPath, [checker], { encoding: 'utf8', cwd: os.tmpdir() });
  assert.equal(run().status, 0, run().stdout + run().stderr);
  const artifact = path.join(fixture, 'packages/core/dist/example.js');
  const original = fs.readFileSync(artifact, 'utf8');
  fs.writeFileSync(artifact, 'export const value = 2;\n');
  const stale = run();
  assert.equal(stale.status, 1);
  assert.match(stale.stderr, /Generated packages\/core\/dist\/example.js is stale/);
  fs.unlinkSync(artifact);
  const missing = run();
  assert.equal(missing.status, 1);
  assert.match(missing.stderr, /Generated packages\/core\/dist\/example.js is stale/);
  fs.writeFileSync(artifact, original);
  const obsolete = path.join(fixture, 'scripts/retired.mjs');
  fs.writeFileSync(obsolete, '');
  assert.match(run().stderr, /Untracked executable artifact: scripts\/retired.mjs/);
  fs.unlinkSync(obsolete);
  fs.writeFileSync(path.join(fixture, 'scripts/validate.mjs'), '');
  assert.match(run().stderr, /Skill payload still contains CLI implementation: scripts\/validate.mjs/);
  fs.unlinkSync(path.join(fixture, 'scripts/validate.mjs'));
  fs.writeFileSync(path.join(fixture, 'config/build-artifacts.json'), JSON.stringify(staticArtifacts.filter(file => file !== 'assets/viewer.js')));
  assert.match(run().stderr, /missing from build-artifacts.json/);
});

test('skill release validator accepts release package and rejects forbidden content and metadata errors', () => {
  const validator = path.join(root, 'tools/validate-skill.mjs');
  const run = (dir: string) => spawnSync(process.execPath, [validator, dir], { encoding: 'utf8', cwd: root });

  // 1. Valid package passes
  const valid = run('birdify');
  assert.equal(valid.status, 0, valid.stdout + valid.stderr);
  const parsed = JSON.parse(valid.stdout);
  assert.equal(parsed.ok, true);
  assert.equal(parsed.skill, 'birdify');
  assert.deepEqual(parsed.errors, []);

  // 2. Negative cases on fixture copy
  const fixture = fs.mkdtempSync(path.join(os.tmpdir(), 'birdify-skill-val-'));
  onTestFinished(() => fs.rmSync(fixture, { recursive: true, force: true }));
  const pkg = path.join(fixture, 'birdify');
  fs.cpSync(path.join(root, 'birdify'), pkg, { recursive: true });

  // Forbidden node_modules
  const nodeModules = path.join(pkg, 'node_modules');
  fs.mkdirSync(nodeModules);
  const nmRes = run(pkg);
  assert.equal(nmRes.status, 1);
  assert.match(nmRes.stdout, /Forbidden directory: node_modules/);
  fs.rmdirSync(nodeModules);

  // Forbidden internal inventory
  const inventoryFile = path.join(pkg, 'build-artifacts.json');
  fs.writeFileSync(inventoryFile, '[]');
  const invRes = run(pkg);
  assert.equal(invRes.status, 1);
  assert.match(invRes.stdout, /Forbidden internal inventory/);
  fs.unlinkSync(inventoryFile);

  // Forbidden test fixtures
  const fixDir = path.join(pkg, 'fixtures');
  fs.mkdirSync(fixDir);
  const fixRes = run(pkg);
  assert.equal(fixRes.status, 1);
  assert.match(fixRes.stdout, /Forbidden directory: fixtures/);
  fs.rmdirSync(fixDir);

  // Forbidden TypeScript source
  const tsFile = path.join(pkg, 'scripts/sample.mts');
  fs.mkdirSync(path.dirname(tsFile), { recursive: true });
  fs.writeFileSync(tsFile, 'export {};');
  const tsRes = run(pkg);
  assert.equal(tsRes.status, 1);
  assert.match(tsRes.stdout, /Forbidden TypeScript source/);
  fs.unlinkSync(tsFile);

  // Missing required file
  const licenseFile = path.join(pkg, 'LICENSE');
  const licenseContent = fs.readFileSync(licenseFile, 'utf8');
  fs.unlinkSync(licenseFile);
  const licRes = run(pkg);
  assert.equal(licRes.status, 1);
  assert.match(licRes.stdout, /Missing required file: LICENSE/);
  fs.writeFileSync(licenseFile, licenseContent);

  // Metadata mismatch: invalid SemVer
  const releaseFile = path.join(pkg, 'skill-release.json');
  const releaseContent = fs.readFileSync(releaseFile, 'utf8');
  for (const invalid of [null, [], false, 0, {},
    { ...JSON.parse(releaseContent), schemaVersion: 2 },
    { ...JSON.parse(releaseContent), channel: 'unknown' },
    { ...JSON.parse(releaseContent), source: {} },
    { ...JSON.parse(releaseContent), updateManifestUrl: 'invalid' },
    { ...JSON.parse(releaseContent), version: '01.0.0-dev.0' },
    { ...JSON.parse(releaseContent), version: '1.0.0-01' },
    { ...JSON.parse(releaseContent), channel: 'development', version: '1.0.0' }]) {
    fs.writeFileSync(releaseFile, JSON.stringify(invalid));
    const rejected = run(pkg);
    assert.equal(rejected.status, 1, JSON.stringify(invalid));
    assert.equal(JSON.parse(rejected.stdout).ok, false);
  }
  fs.writeFileSync(releaseFile, JSON.stringify({ ...JSON.parse(releaseContent), version: 'bad-version' }));
  const verRes = run(pkg);
  assert.equal(verRes.status, 1);
  assert.match(verRes.stdout, /version is not SemVer/);

  // Metadata mismatch: stable channel with prerelease version
  fs.writeFileSync(releaseFile, JSON.stringify({ ...JSON.parse(releaseContent), channel: 'stable', version: '1.0.0-beta.1' }));
  const chRes = run(pkg);
  assert.equal(chRes.status, 1);
  assert.match(chRes.stdout, /stable channel cannot use a prerelease version/);
  fs.writeFileSync(releaseFile, releaseContent);

  // Broken link escaping package boundary
  const skillMd = path.join(pkg, 'SKILL.md');
  const skillMdContent = fs.readFileSync(skillMd, 'utf8');
  fs.appendFileSync(skillMd, '\n[External](../../secret.md)\n');
  const linkRes = run(pkg);
  assert.equal(linkRes.status, 1);
  assert.match(linkRes.stdout, /Link escapes package boundary/);
  fs.writeFileSync(skillMd, skillMdContent);
});

test('schema export checks from any directory and refuses to compile its own contracts', () => {
  const exporter = path.join(root, 'tools/contracts/export.mjs');
  const schema = path.join(root, 'birdify/schemas/architecture.schema.json');
  const original = fs.readFileSync(schema, 'utf8');
  onTestFinished(() => fs.writeFileSync(schema, original));

  const checked = spawnSync(process.execPath, [exporter, '--check'], { encoding: 'utf8', cwd: os.tmpdir() });
  assert.equal(checked.status, 0, checked.stdout + checked.stderr);

  fs.writeFileSync(schema, original.replace('\n', '\n '));
  const stale = spawnSync(process.execPath, [exporter, '--check'], { encoding: 'utf8', cwd: os.tmpdir() });
  assert.equal(stale.status, 1);
  assert.match(stale.stderr, /Stale architecture schema: run pnpm run build\./);
  assert.equal(fs.readFileSync(schema, 'utf8'), original.replace('\n', '\n '));

  const fixture = fs.mkdtempSync(path.join(os.tmpdir(), 'birdify-export-'));
  onTestFinished(() => fs.rmSync(fixture, { recursive: true, force: true }));
  const copy = path.join(fixture, 'tools/contracts/export.mjs');
  fs.mkdirSync(path.dirname(copy), { recursive: true });
  fs.copyFileSync(exporter, copy);
  const missing = spawnSync(process.execPath, [copy], { encoding: 'utf8', cwd: os.tmpdir() });
  assert.equal(missing.status, 1);
  assert.match(missing.stderr, /Missing packages\/core\/dist\/contracts\/models\.js\. Run pnpm run build before schema export\./);

  const models = path.join(fixture, 'packages/core/dist/contracts/models.js');
  fs.mkdirSync(path.dirname(models), { recursive: true });
  fs.writeFileSync(models, 'export const architectureSchema = { type: "object" };\n');
  for (const name of ['architecture', 'activity']) {
    const file = path.join(fixture, 'birdify/schemas', `${name}.schema.json`);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, 'untouched\n');
  }
  const incomplete = spawnSync(process.execPath, [copy], { encoding: 'utf8', cwd: os.tmpdir() });
  assert.equal(incomplete.status, 1);
  assert.match(incomplete.stderr, /Runtime contracts missing mapConstraint/);
  assert.equal(fs.readFileSync(path.join(fixture, 'birdify/schemas/architecture.schema.json'), 'utf8'), 'untouched\n');
});
