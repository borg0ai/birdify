import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ARCHITECTURE_TEMPLATE = 'assets/architecture.html';
const MISSING_SKILL = 'Birdify agent skill not found. Install it with npx --yes @borg0ai/birdify install, or set BIRDIFY_SKILL_DIR to the skill directory for development.';
const AGENT_SKILL_DIRS = Object.freeze([
  '.agents/skills/birdify',
  '.gemini/antigravity-cli/skills/birdify',
  '.claude/skills/birdify',
  '.cursor/skills/birdify',
  '.config/opencode/skills/birdify',
]);

function hasSkill(directory: string): boolean {
  return fs.existsSync(path.join(directory, ARCHITECTURE_TEMPLATE));
}

// Skill assets stay in the installed skill. Resolve them only when a command reads them.
export function runtimeRoot(): string {
  const override = process.env.BIRDIFY_SKILL_DIR;
  if (override) {
    if (hasSkill(override)) return override;
    throw new Error(MISSING_SKILL);
  }
  const cwdSkill = path.resolve(process.cwd(), 'birdify');
  if (hasSkill(cwdSkill)) return cwdSkill;
  const here = path.dirname(fileURLToPath(import.meta.url));
  const repoSkill = path.resolve(here, '../../../birdify');
  if (hasSkill(repoSkill)) return repoSkill;
  const home = os.homedir();
  for (const relative of AGENT_SKILL_DIRS) {
    const dir = path.join(home, relative);
    if (hasSkill(dir)) return dir;
  }
  throw new Error(MISSING_SKILL);
}
