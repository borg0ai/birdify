import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

// Audit the committed source archive, not the current node_modules or dirty files.
const outputRoot = fileURLToPath(new URL('../', import.meta.url));
const repository = outputRoot;
const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'birdify-install-'));
function run(command: string, args: string[], cwd: string) {
  const result = spawnSync(command, args, { cwd, stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${command} failed (${result.status}).`);
}
try {
  const archive = path.join(temporary, 'source.tar');
  const install = path.join(temporary, 'source');
  const project = path.join(temporary, 'project');
  fs.mkdirSync(install);
  fs.mkdirSync(project);
  run('git', ['archive', '--format=tar', 'HEAD:birdify', '-o', archive], repository);
  run('tar', ['-xf', archive, '-C', install], temporary);
  for (const file of ['LICENSE', 'THIRD_PARTY_NOTICES', 'SKILL.md', 'skill-release.json']) {
    if (!fs.statSync(path.join(install, file)).isFile()) throw new Error(`Missing ${file}`);
  }
  const release = JSON.parse(fs.readFileSync(path.join(install, 'skill-release.json'), 'utf8')) as { skillId?: string; version?: string };
  if (release.skillId !== 'birdify' || !release.version || !/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(release.version)) throw new Error('skill-release.json has invalid Birdify release identity.');
  // Exercise shipped JS before any build, from an unrelated working directory.
  const cli = path.join(install, 'scripts/birdify.mjs');
  run(process.execPath, [cli, 'doctor'], project);
  run(process.execPath, [cli, 'setup', '--project', project], project);
  run(process.execPath, [cli, 'uninstall', '--project', project], project);
  console.log('Committed source archive installs and runs shipped artifacts.');
} finally {
  fs.rmSync(temporary, { recursive: true, force: true });
}
