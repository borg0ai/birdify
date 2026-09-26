import fs from 'node:fs';
import path from 'node:path';

const SKILL_DIR = 'birdify';
const TEMPLATE_DIR = 'templates/viewer';

// 从当前工作目录向上找仓库根。技能目录和查看器源码必须同时存在，避免停在只有其一的子目录。
export function findRepoRoot(start: string): string {
  let current = path.resolve(start);
  for (;;) {
    const skill = path.join(current, SKILL_DIR);
    const template = path.join(current, TEMPLATE_DIR);
    if (fs.existsSync(skill) && fs.existsSync(template)) return current;
    const parent = path.dirname(current);
    if (parent === current) {
      throw new Error(`Cannot find the Birdify repository from ${start}. Expected ${SKILL_DIR}/ and ${TEMPLATE_DIR}/.`);
    }
    current = parent;
  }
}
