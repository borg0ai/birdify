import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const outputRoot = fileURLToPath(new URL('../', import.meta.url));
const repository = outputRoot;
const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'birdify-install-'));

function run(command, args, cwd) {
  const result = spawnSync(command, args, { cwd, stdio: 'inherit' });
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
  const project = path.join(temporary, 'packed-project');
  fs.mkdirSync(project);
  run(process.execPath, [bin, '--help'], project);
  run(process.execPath, [bin, 'doctor'], project);
  const map = path.join(repository, 'birdify/examples/architecture.json');
  const html = path.join(project, 'map.html');
  run(process.execPath, [bin, 'validate', map, path.join(repository, 'birdify/examples/activity.jsonl')], project);
  run(process.execPath, [bin, 'render', map, html], project);
  run(process.execPath, [bin, 'setup', '--project', project], project);
  run(process.execPath, [bin, 'uninstall', '--project', project], project);
  const sample = path.join(temporary, 'sample-repo');
  fs.mkdirSync(sample);
  fs.writeFileSync(path.join(sample, 'README.md'), '# Sample\n');
  run('git', ['init'], sample);
  run('git', ['add', 'README.md'], sample);
  run('git', ['-c', 'user.email=birdify@example.com', '-c', 'user.name=Birdify', 'commit', '-m', 'sample'], sample);
  run(process.execPath, [bin, 'discover', sample, path.join(project, 'catalog.json'), 'Sample'], project);
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
