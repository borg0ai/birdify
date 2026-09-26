import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ARCHITECTURE_TEMPLATE = 'assets/architecture.html';

// The CLI is designed for AI coding agents using the Birdify skill.
// Skill assets live with the skill. The CLI locates them from the agent environment or project.
export function runtimeRoot(): string {
  // 1. Explicit environment variable
  if (process.env.BIRDIFY_SKILL_DIR && fs.existsSync(path.join(process.env.BIRDIFY_SKILL_DIR, ARCHITECTURE_TEMPLATE))) {
    return process.env.BIRDIFY_SKILL_DIR;
  }

  // 2. Working directory / project root skill directory
  const cwdSkill = path.resolve(process.cwd(), 'birdify');
  if (fs.existsSync(path.join(cwdSkill, ARCHITECTURE_TEMPLATE))) return cwdSkill;

  // 3. Monorepo development source checkout
  const here = path.dirname(fileURLToPath(import.meta.url));
  const repoSkill = path.resolve(here, '../../../birdify');
  if (fs.existsSync(path.join(repoSkill, ARCHITECTURE_TEMPLATE))) return repoSkill;

  // 4. Staged package assets (if present)
  const staged = path.resolve(here, '../skill-runtime');
  if (fs.existsSync(path.join(staged, ARCHITECTURE_TEMPLATE))) return staged;

  // 5. Common AI coding agent global skill directories
  const home = os.homedir();
  const agentSkillDirs = [
    path.join(home, '.gemini/antigravity-cli/skills/birdify'),
    path.join(home, '.claude/skills/birdify'),
    path.join(home, '.cursor/skills/birdify'),
    path.join(home, '.config/opencode/skills/birdify'),
    path.join(home, '.agents/skills/birdify'),
  ];
  for (const dir of agentSkillDirs) {
    if (fs.existsSync(path.join(dir, ARCHITECTURE_TEMPLATE))) return dir;
  }

  // 6. Direct manual human invocation without the skill
  throw new Error('This CLI is designed for AI coding agents using the Birdify skill, not for direct manual use. Birdify skill assets not found. Install the skill into your agent first (e.g. npx --yes @borg0ai/birdify install).');
}
