import fs from 'node:fs';
import path from 'node:path';
import { findRepoRootForCommand } from '../repo-root.js';

const requiredFiles = ['SKILL.md', 'skill-release.json', 'LICENSE', 'THIRD_PARTY_NOTICES'];
const runtimeFiles = ['schemas/architecture.schema.json', 'schemas/activity.schema.json', 'assets/viewer.js', 'assets/demo.css', 'assets/theme.js', 'assets/constraint-canvas.js', 'assets/constraint-canvas.css'];
const forbiddenRuntime = ['scripts/birdify.mjs', 'scripts/validate.mjs', 'scripts/render.mjs', 'scripts/discover-constraints.mjs', 'scripts/compile-constraint-rules.mjs', 'scripts/render-constraints.mjs', 'scripts/constraint-freshness.mjs'];

function walk(root: string, directory: string, files: string[], errors: string[]): void {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    const relative = path.relative(root, file).replaceAll('\\', '/');
    if (entry.name === 'node_modules' || ['test', 'tests', 'fixtures', '.git'].includes(entry.name)) {
      errors.push(`Forbidden directory: ${relative}`);
      continue;
    }
    if (entry.isDirectory()) walk(root, file, files, errors);
    else files.push(file);
  }
}

function validate(skillRoot: string): { ok: boolean; skill: string | null; files: number; errors: string[] } {
  const errors: string[] = [];
  const exists = (relative: string) => fs.existsSync(path.join(skillRoot, relative));
  if (!fs.statSync(skillRoot, { throwIfNoEntry: false })?.isDirectory()) return { ok: false, skill: null, files: 0, errors: [`Skill directory not found: ${skillRoot}`] };
  for (const file of requiredFiles) if (!exists(file)) errors.push(`Missing required file: ${file}`);
  const files: string[] = [];
  walk(skillRoot, skillRoot, files, errors);
  const relativeFiles = files.map((file) => path.relative(skillRoot, file).replaceAll('\\', '/'));
  for (const file of relativeFiles) {
    const base = path.basename(file);
    if (/(^|\/)(test|tests|fixtures)(\/|$)/.test(file)) errors.push(`Forbidden test content: ${file}`);
    if (/(^|\/)(\.env(?:\..*)?|package-lock\.json|pnpm-lock\.yaml|package\.json)(\/|$)/.test(file)) errors.push(`Forbidden release file: ${file}`);
    if (base === 'build-artifacts.json') errors.push(`Forbidden internal inventory: ${file}`);
    if (base === 'validate-skill.mjs') errors.push(`Forbidden packaging validator in release payload: ${file}`);
    if (/\.(?:mts|ts|tsx)$/.test(file)) errors.push(`Forbidden TypeScript source in release payload: ${file}`);
  }
  const skillFiles = relativeFiles.filter((file) => path.basename(file) === 'SKILL.md');
  if (skillFiles.length !== 1 || skillFiles[0] !== 'SKILL.md') errors.push('Exactly one root SKILL.md is required.');
  const skillText = exists('SKILL.md') ? fs.readFileSync(path.join(skillRoot, 'SKILL.md'), 'utf8') : '';
  const frontmatter = skillText.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  const body = frontmatter?.[1] ?? '';
  const name = body.match(/^name:\s*([a-z0-9]+(?:-[a-z0-9]+)*)\s*$/m)?.[1];
  const description = body.match(/^description:\s*(\S[\s\S]*)$/m)?.[1];
  if (!frontmatter || !name || !description) errors.push('SKILL.md frontmatter needs valid name and description.');
  if (name && name !== path.basename(skillRoot)) errors.push(`Frontmatter name does not match directory: ${name}`);
  let release: Record<string, unknown> | null = null;
  if (exists('skill-release.json')) {
    try {
      const parsed: unknown = JSON.parse(fs.readFileSync(path.join(skillRoot, 'skill-release.json'), 'utf8'));
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) release = parsed as Record<string, unknown>;
    } catch { errors.push('skill-release.json is not valid JSON.'); }
  }
  if (!release) errors.push('skill-release.json must be an object.');
  else {
    const version = typeof release.version === 'string' ? release.version : '';
    const prerelease = version.includes('-');
    if (release.skillId !== name) errors.push('skill-release.json skillId does not match SKILL.md name.');
    if (!/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[A-Za-z-][0-9A-Za-z-]*)(?:\.(?:0|[1-9]\d*|\d*[A-Za-z-][0-9A-Za-z-]*))*))?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/.test(version)) errors.push('skill-release.json version is not SemVer.');
    if (release.schemaVersion !== 1) errors.push('Unsupported release schemaVersion.');
    if (!['development', 'stable'].includes(String(release.channel))) errors.push('Unsupported release channel.');
    const source = release.source as Record<string, unknown> | undefined;
    for (const url of [source?.repository, release.updateManifestUrl]) if (typeof url !== 'string' || !URL.canParse(url) || !/^https?:\/\//.test(url)) errors.push('Release source and update manifest require HTTP URLs.');
    if (release.channel === 'development' && !prerelease) errors.push('development channel requires a prerelease version.');
    if (release.channel === 'stable' && prerelease) errors.push('stable channel cannot use a prerelease version.');
  }
  for (const file of runtimeFiles) if (!exists(file)) errors.push(`Missing required runtime artifact: ${file}`);
  for (const file of forbiddenRuntime) if (exists(file)) errors.push(`CLI implementation must not ship in the skill: ${file}`);
  const localPath = /(?:^|[\s`(])(?:\/Users\/|\/Volumes\/|\/home\/|[A-Za-z]:\\)/;
  for (const file of files.filter((entry) => /\.(md|json|txt|mjs|js|css)$/.test(entry))) if (localPath.test(fs.readFileSync(file, 'utf8'))) errors.push(`Machine-specific absolute path: ${path.relative(skillRoot, file).replaceAll('\\', '/')}`);
  for (const mdFile of files.filter((file) => file.endsWith('.md'))) {
    for (const match of fs.readFileSync(mdFile, 'utf8').matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
      const target = match[1]?.split(/[?#]/, 1)[0];
      if (!target || /^(?:https?:|mailto:|#)/.test(target)) continue;
      const resolved = path.resolve(path.dirname(mdFile), decodeURIComponent(target));
      if (!resolved.startsWith(`${skillRoot}${path.sep}`) && resolved !== skillRoot) errors.push(`Link escapes package boundary in ${path.relative(skillRoot, mdFile)}: ${target}`);
      else if (!fs.existsSync(resolved)) errors.push(`Broken package link in ${path.relative(skillRoot, mdFile)}: ${target}`);
    }
  }
  return { ok: errors.length === 0, skill: name ?? null, files: relativeFiles.length, errors };
}

export function runValidateSkill(args: readonly string[], cwd = process.cwd()): void {
  const root = findRepoRootForCommand(cwd);
  const result = validate(path.resolve(root, args[0] ?? 'birdify'));
  console.log(JSON.stringify(result, null, 2));
  if (!result.ok) process.exitCode = 1;
}
