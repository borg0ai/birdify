import { test, type TestContext } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const cli = fileURLToPath(new URL('../birdify/scripts/birdify.mjs', import.meta.url));
function project(t: TestContext) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'birdify-mode-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  return root;
}
function run(root: string, ...args: string[]) {
  return spawnSync(process.execPath, [cli, 'mode', ...args, '--project', root], { encoding: 'utf8' });
}

test('generic mode management preserves user rules and uses AGENTS.md', (t) => {
  const root = project(t);
  const agents = path.join(root, 'AGENTS.md');
  fs.writeFileSync(agents, 'Existing agent rules\n');
  assert.equal(run(root, 'on-demand').status, 0);
  assert.match(fs.readFileSync(agents, 'utf8'), /Birdify mode: on-demand/);
  assert.equal(fs.existsSync(path.join(root, 'CUSTOM-HOST.md')), false);
});

test('doctor renders in memory from another working directory without writing', (t) => {
  const root = project(t);
  const result = spawnSync(process.execPath, [cli, 'doctor'], { cwd: root, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /OK: example validation/);
  assert.deepEqual(fs.readdirSync(root), []);
  assert.equal(spawnSync(process.execPath, [cli, 'doctor', '--unknown']).status, 1);
});

test('default mode is read-only; explicit selection creates a project rule', (t) => {
  const root = project(t);
  assert.match(run(root).stdout, /on-demand.*default/);
  assert.equal(fs.existsSync(path.join(root, 'AGENTS.md')), false);
  assert.equal(run(root, 'on-demand').status, 0);
  assert.match(run(root).stdout, /^on-demand\n/);
});

test('foundation survives mode switches; setup upgrades legacy on-demand without enabling maps', (t) => {
  const root = project(t);
  const file = path.join(root, 'AGENTS.md');
  fs.writeFileSync(file, '# User rules\n<!-- birdify:mode:start -->\nBirdify mode: on-demand\nlegacy\n<!-- birdify:mode:end -->\nKeep this.');
  assert.match(run(root).stdout, /Foundation: not installed/);
  const setup = () => spawnSync(process.execPath, [cli, 'setup', '--project', root], { encoding: 'utf8' });
  assert.equal(setup().status, 0);
  const installed = fs.readFileSync(file, 'utf8');
  assert.match(installed, /Birdify mode: on-demand/);
  assert.match(installed, /even when the Birdify skill is not activated/);
  assert.match(installed, /do not require reading the skill/);
  assert.match(run(root).stdout, /Foundation: on/);
  assert.equal(setup().status, 0);
  assert.equal(fs.readFileSync(file, 'utf8'), installed);
  assert.equal(run(root, 'on-demand').status, 0);
  assert.match(run(root).stdout, /Foundation: on/);
  assert.equal(run(root, 'off').status, 0);
  assert.match(run(root).stdout, /Foundation: off/);
  assert.doesNotMatch(fs.readFileSync(file, 'utf8'), /For every authorized coding task/);
  assert.equal(setup().status, 0);
  assert.match(run(root).stdout, /^off/);
  const before = fs.readFileSync(file, 'utf8');
  const uninstall = () => spawnSync(process.execPath, [cli, 'uninstall', '--project', root], { encoding: 'utf8' });
  assert.equal(uninstall().status, 0);
  assert.equal(fs.readFileSync(file, 'utf8'), before.replace(/<!-- birdify:mode:start -->[\s\S]*?<!-- birdify:mode:end -->/, ''));
  assert.equal(uninstall().status, 0);
  assert.match(run(root).stdout, /Foundation: not installed/);
});

test('setup and uninstall preserve user boundaries and reject damaged files', (t) => {
  const root = project(t);
  const agents = path.join(root, 'AGENTS.md');
  fs.writeFileSync(agents, 'User rules');
  const invoke = (command: string) => spawnSync(process.execPath, [cli, command, '--project', root], { encoding: 'utf8' });
  assert.equal(invoke('setup').status, 0);
  assert.match(fs.readFileSync(agents, 'utf8'), /^User rules\n/);
  assert.match(fs.readFileSync(agents, 'utf8'), /Birdify foundation: on/);
  assert.equal(invoke('uninstall').status, 0);
  assert.equal(invoke('setup').status, 0);
  assert.match(run(root).stdout, /Foundation: on/);
  fs.writeFileSync(agents, '<!-- birdify:mode:start -->');
  for (const command of ['setup', 'uninstall']) {
    assert.equal(invoke(command).status, 1);
    assert.equal(fs.readFileSync(agents, 'utf8'), '<!-- birdify:mode:start -->');
  }
});

test('switching preserves surrounding UTF-8 text, BOM and CRLF; repeat is idempotent', (t) => {
  const root = project(t);
  const file = path.join(root, 'AGENTS.md');
  const prefix = '\uFEFF# 用户规则\r\n不得覆盖。\r\n';
  fs.writeFileSync(file, prefix);
  assert.equal(run(root, 'on-demand').status, 0);
  const automatic = fs.readFileSync(file, 'utf8');
  assert.ok(automatic.startsWith(prefix));
  assert.equal(automatic.replaceAll('\r\n', '').includes('\n'), false);
  fs.appendFileSync(file, '\r\n其他规则保持原样。');
  assert.equal(run(root, 'on-demand').status, 0);
  const manual = fs.readFileSync(file, 'utf8');
  assert.ok(manual.startsWith(prefix));
  assert.ok(manual.endsWith('\r\n其他规则保持原样。'));
  assert.match(run(root).stdout, /^on-demand\n/);
  assert.equal(run(root, 'on-demand').status, 0);
  assert.equal(fs.readFileSync(file, 'utf8'), manual);
  assert.equal(manual.split('<!-- birdify:mode:start -->').length, 2);
  const local = spawnSync(process.execPath, [cli, 'mode'], { cwd: root, encoding: 'utf8' });
  assert.equal(local.status, 0);
  assert.match(local.stdout, /^on-demand\n/);
});

test('malformed, duplicate blocks and invalid arguments fail without writing', (t) => {
  const root = project(t);
  const file = path.join(root, 'AGENTS.md');
  for (const original of ['user\n<!-- birdify:mode:start -->', '<!-- birdify:mode:end -->\n<!-- birdify:mode:start -->', '<!-- birdify:mode:start -->\nunknown\n<!-- birdify:mode:end -->']) {
    fs.writeFileSync(file, original);
    assert.equal(run(root, 'on-demand').status, 1);
    assert.equal(fs.readFileSync(file, 'utf8'), original);
  }
  fs.writeFileSync(file, 'keep');
  assert.equal(run(root, 'invalid').status, 1);
  assert.equal(fs.readFileSync(file, 'utf8'), 'keep');
  assert.equal(run(root, 'on-demand').status, 0);
  const duplicate = fs.readFileSync(file, 'utf8').repeat(2);
  fs.writeFileSync(file, duplicate);
  assert.equal(run(root, 'on-demand').status, 1);
  assert.equal(fs.readFileSync(file, 'utf8'), duplicate);
  fs.unlinkSync(file);
  fs.mkdirSync(file);
  assert.equal(run(root, 'on-demand').status, 1);
  assert.ok(fs.statSync(file).isDirectory());
});

test('auto is opt-in; setup preserves it and switching back stops automatic instructions', (t) => {
  const root = project(t);
  const file = path.join(root, 'AGENTS.md');
  fs.writeFileSync(file, '# Keep\n');
  const setup = () => spawnSync(process.execPath, [cli, 'setup', '--project', root], { encoding: 'utf8' });
  assert.equal(setup().status, 0);
  assert.match(run(root).stdout, /^on-demand/);
  assert.equal(run(root, 'auto').status, 0);
  assert.match(fs.readFileSync(file, 'utf8'), /before every code-changing task/);
  assert.equal(setup().status, 0);
  assert.match(run(root).stdout, /^auto/);
  assert.equal(run(root, 'on-demand').status, 0);
  assert.doesNotMatch(fs.readFileSync(file, 'utf8'), /before every code-changing task/);
  assert.ok(fs.readFileSync(file, 'utf8').startsWith('# Keep\n'));
  assert.equal(setup().status, 0);
  assert.match(run(root).stdout, /^on-demand/);
});
