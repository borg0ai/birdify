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
  // Exercise shipped JS before any build, from an unrelated working directory
  const testProject = path.join(temporary, `project-${path.basename(installDir)}`);
  fs.mkdirSync(testProject, { recursive: true });
  const cli = path.join(installDir, 'scripts/birdify.mjs');
  run(process.execPath, [cli, 'doctor'], testProject);
  run(process.execPath, [cli, 'setup', '--project', testProject], testProject);
  run(process.execPath, [cli, 'uninstall', '--project', testProject], testProject);
  console.log(`[${label}] Verified shipped artifacts in temporary environment.`);
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
