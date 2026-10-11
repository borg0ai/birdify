import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { findRepoRootForCommand } from '../repo-root.js';
import { runValidateSkill } from './validate-skill.js';

type Env = NodeJS.ProcessEnv;

function run(command: string, args: string[], cwd: string, env: Env = process.env): void {
  const result = spawnSync(command, args, { cwd, env, stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${command} failed (${result.status}).`);
}

function verifyPayload(installDir: string, label: string): void {
  for (const file of ['LICENSE', 'THIRD_PARTY_NOTICES', 'SKILL.md', 'skill-release.json']) {
    if (!fs.statSync(path.join(installDir, file), { throwIfNoEntry: false })?.isFile()) throw new Error(`[${label}] Missing ${file}`);
  }
  const release = JSON.parse(fs.readFileSync(path.join(installDir, 'skill-release.json'), 'utf8')) as Record<string, unknown>;
  if (release.skillId !== 'birdify' || !release.version || !/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(String(release.version))) throw new Error(`[${label}] skill-release.json has invalid Birdify release identity.`);
  console.log(`[${label}] Verified shipped artifacts in temporary environment.`);
}

function verifyPackedCli(repository: string, temporary: string): void {
  const packDirectory = path.join(temporary, 'pack');
  fs.mkdirSync(packDirectory);
  const packed = spawnSync('npm', ['pack', '--pack-destination', packDirectory, '--json'], { cwd: path.join(repository, 'apps/cli'), encoding: 'utf8' });
  if (packed.error) throw packed.error;
  if (packed.status !== 0) throw new Error(packed.stdout + packed.stderr);
  const filename = JSON.parse(packed.stdout)[0]?.filename as string | undefined;
  if (!filename) throw new Error('npm pack did not report a tarball filename.');
  const consumer = path.join(temporary, 'consumer');
  fs.mkdirSync(consumer);
  run('npm', ['install', '--ignore-scripts', path.join(packDirectory, filename)], consumer);
  const cliPackage = JSON.parse(fs.readFileSync(path.join(repository, 'apps/cli/package.json'), 'utf8')) as { name: string };
  const installedPackage = path.join(consumer, 'node_modules', ...cliPackage.name.split('/'));
  const bin = path.join(installedPackage, 'dist/birdify.mjs');
  const map = path.join(repository, 'birdify/examples/architecture.json');
  const agentHome = path.join(temporary, 'agent-home');
  const skill = path.join(agentHome, '.agents/skills/birdify');
  fs.mkdirSync(path.dirname(skill), { recursive: true });
  fs.cpSync(path.join(repository, 'birdify'), skill, { recursive: true });
  const { BIRDIFY_SKILL_DIR: _override, ...baseEnv } = process.env;
  const cliEnv = { ...baseEnv, HOME: agentHome, USERPROFILE: agentHome };
  const project = path.join(temporary, 'packed-project');
  fs.mkdirSync(project);
  run(process.execPath, [bin, '--help'], project, cliEnv);
  run(process.execPath, [bin, 'doctor'], project, cliEnv);
  run(process.execPath, [bin, 'validate', map, path.join(repository, 'birdify/examples/activity.jsonl')], project, cliEnv);
  run(process.execPath, [bin, 'render', map, path.join(project, 'map.html')], project, cliEnv);
  run(process.execPath, [bin, 'setup', '--project', project], project, cliEnv);
  run(process.execPath, [bin, 'uninstall', '--project', project], project, cliEnv);
  const envProject = path.join(temporary, 'env-project');
  fs.mkdirSync(envProject);
  run(process.execPath, [bin, 'render', map, path.join(envProject, 'map.html')], envProject, { ...baseEnv, HOME: path.join(temporary, 'env-home'), USERPROFILE: path.join(temporary, 'env-home'), BIRDIFY_SKILL_DIR: path.join(repository, 'birdify') });
  const sample = path.join(temporary, 'sample-repo');
  fs.mkdirSync(sample);
  fs.writeFileSync(path.join(sample, 'README.md'), '# Sample\n');
  run('git', ['init'], sample);
  run('git', ['add', 'README.md'], sample);
  run('git', ['-c', 'user.email=birdify@example.com', '-c', 'user.name=Birdify', 'commit', '-m', 'sample'], sample);
  run(process.execPath, [bin, 'discover', sample, path.join(project, 'catalog.json'), 'Sample'], project, cliEnv);
  for (const relative of ['skill-runtime', 'assets/architecture.html', 'vendor/core']) if (fs.existsSync(path.join(installedPackage, relative))) throw new Error(`[packed-cli] Skill payload shipped in the CLI: ${relative}`);
  const bareHome = path.join(temporary, 'bare-home');
  const bareProject = path.join(temporary, 'bare-project');
  fs.mkdirSync(bareHome);
  fs.mkdirSync(bareProject);
  const bareEnv = { ...baseEnv, HOME: bareHome, USERPROFILE: bareHome };
  run(process.execPath, [bin, '--help'], bareProject, bareEnv);
  run(process.execPath, [bin, 'validate', map], bareProject, bareEnv);
  const install = spawnSync(process.execPath, [bin, 'install', '--nope'], { cwd: bareProject, env: bareEnv, encoding: 'utf8' });
  if (install.status === 0 || !/Usage: birdify install/.test(install.stderr) || /agent skill not found/.test(install.stderr)) throw new Error(`[packed-cli] install looked up skill assets:\n${install.stderr}`);
  const render = spawnSync(process.execPath, [bin, 'render', map, path.join(bareProject, 'missing.html')], { cwd: bareProject, env: bareEnv, encoding: 'utf8' });
  if (render.status === 0 || !/npx --yes @borg0ai\/birdify install/.test(render.stderr)) throw new Error(`[packed-cli] missing skill did not name install:\n${render.stderr}`);
  console.log('[packed-cli] Verified the packed CLI without a source checkout.');
}

export function runCheckInstall(_args: readonly string[], cwd = process.cwd()): void {
  const repository = findRepoRootForCommand(cwd);
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'birdify-install-'));
  try {
    const workingPackage = path.join(repository, 'birdify');
    if (fs.existsSync(workingPackage)) {
      runValidateSkill([workingPackage], repository);
      const isolatedPackage = path.join(temporary, 'working-tree', 'birdify');
      fs.cpSync(workingPackage, isolatedPackage, { recursive: true });
      verifyPayload(isolatedPackage, 'working-tree-copy');
      verifyPackedCli(repository, temporary);
    }
    const gitStatus = spawnSync('git', ['status', '--porcelain', 'birdify'], { cwd: repository, encoding: 'utf8' });
    if (gitStatus.status !== 0) throw new Error(gitStatus.stderr || 'git status failed.');
    if (gitStatus.stdout.trim()) console.log('Notice: birdify/ has uncommitted working-tree changes; auditing committed archive separately.');
    const archive = path.join(temporary, 'source.tar');
    const install = path.join(temporary, 'committed-source');
    fs.mkdirSync(install);
    run('git', ['archive', '--format=tar', 'HEAD:birdify', '-o', archive], repository);
    run('tar', ['-xf', archive, '-C', install], temporary);
    verifyPayload(install, 'committed-archive');
  } finally {
    fs.rmSync(temporary, { recursive: true, force: true });
  }
}
