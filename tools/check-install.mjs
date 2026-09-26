import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const outputRoot = fileURLToPath(new URL('../', import.meta.url));
const repository = outputRoot;
const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'birdify-install-'));

function run(command, args, cwd, env = process.env) {
  const result = spawnSync(command, args, { cwd, env, stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${command} failed (${result.status}).`);
}

function verifyPayload(installDir, label) {
  for (const file of ['LICENSE', 'THIRD_PARTY_NOTICES', 'SKILL.md', 'skill-release.json']) {
    if (!fs.statSync(path.join(installDir, file)).isFile()) throw new Error(`[${label}] Missing ${file}`);
  }
  const release = JSON.parse(fs.readFileSync(path.join(installDir, 'skill-release.json'), 'utf8'));
  if (release.skillId !== 'birdify' || !release.version || !/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(release.version)) {
    throw new Error(`[${label}] skill-release.json has invalid Birdify release identity.`);
  }
  const legacy = path.join(installDir, 'scripts/birdify.mjs');
  if (fs.existsSync(legacy)) {
    const testProject = path.join(temporary, `project-${path.basename(installDir)}`);
    fs.mkdirSync(testProject, { recursive: true });
    run(process.execPath, [legacy, 'doctor'], testProject);
    run(process.execPath, [legacy, 'setup', '--project', testProject], testProject);
    run(process.execPath, [legacy, 'uninstall', '--project', testProject], testProject);
  }
  console.log(`[${label}] Verified shipped artifacts in temporary environment.`);
}

function verifyPackedCli() {
  const packed = spawnSync(process.execPath, [path.join(repository, 'tools/pack-cli.mjs'), path.join(temporary, 'pack')], { cwd: repository, encoding: 'utf8' });
  if (packed.status !== 0) throw new Error(packed.stdout + packed.stderr);
  const tarball = packed.stdout.trim().split(/\r?\n/).at(-1);
  const consumer = path.join(temporary, 'consumer');
  fs.mkdirSync(consumer);
  run('npm', ['install', '--ignore-scripts', tarball], consumer);
  const bin = path.join(consumer, 'node_modules/birdify/dist/birdify.mjs');
  const agentHome = path.join(temporary, 'agent-home');
  const agentSkill = path.join(agentHome, '.agents/skills/birdify');
  fs.mkdirSync(path.dirname(agentSkill), { recursive: true });
  fs.cpSync(path.join(repository, 'birdify'), agentSkill, { recursive: true });
  const { BIRDIFY_SKILL_DIR: _skillOverride, ...baseEnv } = process.env;
  const cliEnv = { ...baseEnv, HOME: agentHome, USERPROFILE: agentHome };
  const project = path.join(temporary, 'packed-project');
  fs.mkdirSync(project);
  run(process.execPath, [bin, '--help'], project, cliEnv);
  run(process.execPath, [bin, 'doctor'], project, cliEnv);
  const map = path.join(repository, 'birdify/examples/architecture.json');
  const html = path.join(project, 'map.html');
  run(process.execPath, [bin, 'validate', map, path.join(repository, 'birdify/examples/activity.jsonl')], project, cliEnv);
  run(process.execPath, [bin, 'render', map, html], project, cliEnv);
  run(process.execPath, [bin, 'setup', '--project', project], project, cliEnv);
  run(process.execPath, [bin, 'uninstall', '--project', project], project, cliEnv);
  const envHome = path.join(temporary, 'env-home');
  const envProject = path.join(temporary, 'env-project');
  fs.mkdirSync(envProject);
  const envOverride = { ...baseEnv, HOME: envHome, USERPROFILE: envHome, BIRDIFY_SKILL_DIR: path.join(repository, 'birdify') };
  run(process.execPath, [bin, 'render', map, path.join(envProject, 'map.html')], envProject, envOverride);
  const sample = path.join(temporary, 'sample-repo');
  fs.mkdirSync(sample);
  fs.writeFileSync(path.join(sample, 'README.md'), '# Sample\n');
  run('git', ['init'], sample);
  run('git', ['add', 'README.md'], sample);
  run('git', ['-c', 'user.email=birdify@example.com', '-c', 'user.name=Birdify', 'commit', '-m', 'sample'], sample);
  run(process.execPath, [bin, 'discover', sample, path.join(project, 'catalog.json'), 'Sample'], project, cliEnv);
  const installed = path.join(consumer, 'node_modules/birdify');
  for (const relative of ['skill-runtime', 'assets/architecture.html', 'vendor/core']) {
    if (fs.existsSync(path.join(installed, relative))) throw new Error(`[packed-cli] Skill payload shipped in the CLI: ${relative}`);
  }
  const bareHome = path.join(temporary, 'bare-home');
  const bareProject = path.join(temporary, 'bare-project');
  fs.mkdirSync(bareHome);
  fs.mkdirSync(bareProject);
  const bareEnv = { ...baseEnv, HOME: bareHome, USERPROFILE: bareHome };
  run(process.execPath, [bin, '--help'], bareProject, bareEnv);
  run(process.execPath, [bin, 'validate', map], bareProject, bareEnv);
  const install = spawnSync(process.execPath, [bin, 'install', '--nope'], { cwd: bareProject, env: bareEnv, encoding: 'utf8' });
  if (install.status === 0 || !/Usage: birdify install/.test(install.stderr) || /agent skill not found/.test(install.stderr)) {
    throw new Error(`[packed-cli] install looked up skill assets:\n${install.stderr}`);
  }
  const render = spawnSync(process.execPath, [bin, 'render', map, path.join(bareProject, 'missing.html')], { cwd: bareProject, env: bareEnv, encoding: 'utf8' });
  if (render.status === 0 || !/npx --yes @borg0ai\/birdify install/.test(render.stderr)) {
    throw new Error(`[packed-cli] missing skill did not name install:\n${render.stderr}`);
  }
  console.log('[packed-cli] Verified the packed CLI without a source checkout.');
}

try {
  // 1. Audit current working-tree package directory
  const workingPackage = path.join(repository, 'birdify');
  if (fs.existsSync(workingPackage)) {
    // Validate release boundary on working tree
    const validator = path.join(repository, 'tools/validate-skill.mjs');
    if (fs.existsSync(validator)) {
      run(process.execPath, [validator, workingPackage], repository);
    }
    const isolatedPackage = path.join(temporary, 'working-tree', 'birdify');
    fs.cpSync(workingPackage, isolatedPackage, { recursive: true });
    verifyPayload(isolatedPackage, 'working-tree-copy');
    verifyPackedCli();
  }

  // 2. Audit committed git archive (distinguishing working-tree from committed state)
  const gitStatus = spawnSync('git', ['status', '--porcelain', 'birdify'], { cwd: repository, encoding: 'utf8' });
  const hasUncommitted = Boolean(gitStatus.stdout && gitStatus.stdout.trim());
  if (hasUncommitted) {
    console.log('Notice: birdify/ has uncommitted working-tree changes; auditing committed archive separately.');
  }

  const archive = path.join(temporary, 'source.tar');
  const install = path.join(temporary, 'committed-source');
  fs.mkdirSync(install);
  run('git', ['archive', '--format=tar', 'HEAD:birdify', '-o', archive], repository);
  run('tar', ['-xf', archive, '-C', install], temporary);
  verifyPayload(install, 'committed-archive');
} finally {
  fs.rmSync(temporary, { recursive: true, force: true });
}
