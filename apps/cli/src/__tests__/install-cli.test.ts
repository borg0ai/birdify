import { test, onTestFinished } from 'vitest';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const cli = fileURLToPath(new URL('../../dist/birdify.mjs', import.meta.url));
const EXPECTED_ARGV = [
  '--yes', 'skills', 'add', 'borg0ai/birdify',
  '--skill', 'birdify', '--agent', '*', '--global', '--copy', '--yes',
];
const DOCUMENTED_LINE = "npx --yes skills add borg0ai/birdify --skill birdify --agent '*' --global --copy --yes";

function sandbox() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'birdify-install-'));
  const bin = path.join(root, 'bin');
  const log = path.join(root, 'argv.json');
  fs.mkdirSync(bin);
  const npx = path.join(bin, 'npx');
  fs.writeFileSync(npx, `#!/usr/bin/env node
import fs from 'node:fs';
fs.writeFileSync(process.env.FAKE_NPX_LOG, JSON.stringify(process.argv.slice(2)));
if (process.env.FAKE_NPX_SIGNAL) process.kill(process.pid, process.env.FAKE_NPX_SIGNAL);
process.exit(Number(process.env.FAKE_NPX_STATUS ?? 0));
`);
  fs.chmodSync(npx, 0o755);
  onTestFinished(() => fs.rmSync(root, { recursive: true, force: true }));
  return { bin, log };
}

function runInstall(bin: string, log: string, args: string[] = [], extra: Record<string, string> = {}) {
  return spawnSync(process.execPath, [cli, 'install', ...args], {
    encoding: 'utf8',
    env: { ...process.env, PATH: `${bin}${path.delimiter}${process.env.PATH ?? ''}`, FAKE_NPX_LOG: log, ...extra },
  });
}

test('install spawns the global skills add argv and returns the child status', () => {
  const ok = sandbox();
  const success = runInstall(ok.bin, ok.log);
  assert.equal(success.status, 0, success.stderr);
  assert.deepEqual(JSON.parse(fs.readFileSync(ok.log, 'utf8')), EXPECTED_ARGV);

  const failed = sandbox();
  const child = runInstall(failed.bin, failed.log, [], { FAKE_NPX_STATUS: '4' });
  assert.equal(child.status, 4);
  assert.deepEqual(JSON.parse(fs.readFileSync(failed.log, 'utf8')), EXPECTED_ARGV);
});

test('a signalled npx exits 1 and an unknown argument does not spawn', () => {
  const signalled = sandbox();
  const killed = runInstall(signalled.bin, signalled.log, [], { FAKE_NPX_SIGNAL: 'SIGTERM' });
  assert.equal(killed.status, 1);
  assert.deepEqual(JSON.parse(fs.readFileSync(signalled.log, 'utf8')), EXPECTED_ARGV);

  const skipped = sandbox();
  const unknown = runInstall(skipped.bin, skipped.log, ['--agent']);
  assert.equal(unknown.status, 1);
  assert.equal(fs.existsSync(skipped.log), false);
  assert.match(unknown.stderr, /Usage: birdify install/);
});

test('missing npx exits 1 and help names install without hiding existing commands', () => {
  const empty = fs.mkdtempSync(path.join(os.tmpdir(), 'birdify-install-empty-'));
  onTestFinished(() => fs.rmSync(empty, { recursive: true, force: true }));
  const missing = spawnSync(process.execPath, [cli, 'install'], {
    encoding: 'utf8',
    env: { ...process.env, PATH: empty },
  });
  assert.equal(missing.status, 1);
  assert.match(missing.stderr, /npx/);

  const help = spawnSync(process.execPath, [cli, '--help'], { encoding: 'utf8' });
  assert.equal(help.status, 0);
  assert.match(help.stdout, /\n {2}install\n/);
  assert.match(help.stdout, /global skills directory/);
  assert.match(help.stdout, /does not write AGENTS\.md/);
  for (const command of ['doctor', 'mode', 'setup', 'uninstall', 'validate', 'render']) {
    assert.match(help.stdout, new RegExp(command));
  }
});

test('published install text uses the same skills arguments', () => {
  const root = fileURLToPath(new URL('../../../../', import.meta.url));
  const read = (relative: string) => fs.readFileSync(path.join(root, relative), 'utf8');
  const skillsLine = new RegExp(DOCUMENTED_LINE.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  for (const relative of [
    'README.md',
    'README.zh.md',
    'birdify/SKILL.md',
    'birdify/SKILL.zh.md',
    'birdify/references/modes.md',
    'birdify/references/modes.zh.md',
  ]) {
    const text = read(relative);
    assert.match(text, /npx --yes @borg0ai\/birdify install/);
    assert.match(text, skillsLine);
  }
  assert.match(read('apps/site/src/content.ts'), skillsLine);
});
