import { spawnSync } from 'node:child_process';

const INSTALL_USAGE = 'Usage: birdify install';
const NPX_BIN = 'npx';
const SKILL_SOURCE = 'borg0ai/birdify';
const SKILL_NAME = 'birdify';
const ALL_AGENTS = '*';

// 传给 npx 的参数数组。星号是单独参数，不经过 shell 展开。
const INSTALL_ARGV = Object.freeze([
  '--yes',
  'skills',
  'add',
  SKILL_SOURCE,
  '--skill',
  SKILL_NAME,
  '--agent',
  ALL_AGENTS,
  '--global',
  '--copy',
  '--yes',
]);

export function runInstall(args: readonly string[]): void {
  if (args.length > 0) throw new Error(INSTALL_USAGE);
  const child = spawnSync(NPX_BIN, INSTALL_ARGV, { stdio: 'inherit' });
  if (child.error) {
    console.error(child.error.message);
    process.exitCode = 1;
    return;
  }
  // 被信号结束时 status 为 null，不能当成成功。
  process.exitCode = child.status === null ? 1 : child.status;
}
