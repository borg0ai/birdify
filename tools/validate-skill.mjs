#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const targetArg = process.argv[2] ?? 'birdify';
const skillRoot = path.resolve(targetArg);
const errors = [];
const exists = (relative) => fs.existsSync(path.join(skillRoot, relative));

if (!fs.statSync(skillRoot, { throwIfNoEntry: false })?.isDirectory()) {
  console.error(JSON.stringify({ ok: false, errors: [`Skill directory not found: ${skillRoot}`] }, null, 2));
  process.exit(1);
}

// 1. Required metadata and license files
const requiredFiles = ['SKILL.md', 'skill-release.json', 'LICENSE', 'THIRD_PARTY_NOTICES'];
for (const required of requiredFiles) {
  if (!exists(required)) errors.push(`Missing required file: ${required}`);
}

// 2. Discover package contents
const files = [];
function walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    const rel = path.relative(skillRoot, file).replaceAll('\\', '/');
    if (entry.name === 'node_modules') {
      errors.push(`Forbidden directory: ${rel}`);
      continue;
    }
    if (entry.isDirectory()) {
      if (['test', 'tests', 'fixtures', '.git'].includes(entry.name)) {
        errors.push(`Forbidden directory: ${rel}`);
        continue;
      }
      walk(file);
    } else {
      files.push(file);
    }
  }
}
walk(skillRoot);

const relativeFiles = files.map((file) => path.relative(skillRoot, file).replaceAll('\\', '/'));

// 3. Forbidden content checks
for (const file of relativeFiles) {
  const base = path.basename(file);
  if (/(^|\/)(test|tests|fixtures)(\/|$)/.test(file)) errors.push(`Forbidden test content: ${file}`);
  if (/(^|\/)(\.env(?:\..*)?|package-lock\.json|pnpm-lock\.yaml|package\.json)(\/|$)/.test(file)) {
    errors.push(`Forbidden release file: ${file}`);
  }
  if (base === 'build-artifacts.json') errors.push(`Forbidden internal inventory: ${file}`);
  if (base === 'validate-skill.mjs') errors.push(`Forbidden packaging validator in release payload: ${file}`);
  if (/\.(?:mts|ts|tsx)$/.test(file)) errors.push(`Forbidden TypeScript source in release payload: ${file}`);
}

// 4. Exactly one canonical SKILL.md
const skillFiles = relativeFiles.filter((file) => path.basename(file) === 'SKILL.md');
if (skillFiles.length !== 1 || skillFiles[0] !== 'SKILL.md') {
  errors.push('Exactly one root SKILL.md is required.');
}

// 5. SKILL.md frontmatter validation
const skillText = exists('SKILL.md') ? fs.readFileSync(path.join(skillRoot, 'SKILL.md'), 'utf8') : '';
const frontmatter = skillText.match(/^---\r?\n([\s\S]*?)\r?\n---/);
const frontmatterBody = frontmatter?.[1] ?? '';
const name = frontmatterBody.match(/^name:\s*([a-z0-9]+(?:-[a-z0-9]+)*)\s*$/m)?.[1];
const description = frontmatterBody.match(/^description:\s*(\S[\s\S]*)$/m)?.[1];

if (!frontmatter || !name || !description) {
  errors.push('SKILL.md frontmatter needs valid name and description.');
}
if (name && name !== path.basename(skillRoot)) {
  errors.push(`Frontmatter name does not match directory: ${name}`);
}

// 6. Release metadata validation
let release;
if (exists('skill-release.json')) {
  try {
    release = JSON.parse(fs.readFileSync(path.join(skillRoot, 'skill-release.json'), 'utf8'));
  } catch {
    errors.push('skill-release.json is not valid JSON.');
  }
}
if (!release || typeof release !== 'object' || Array.isArray(release)) {
  errors.push('skill-release.json must be an object.');
} else {
  const version = typeof release.version === 'string' ? release.version : '';
  const prerelease = version.includes('-');
  if (release.skillId !== name) errors.push('skill-release.json skillId does not match SKILL.md name.');
  if (!/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[A-Za-z-][0-9A-Za-z-]*)(?:\.(?:0|[1-9]\d*|\d*[A-Za-z-][0-9A-Za-z-]*))*))?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/.test(version)) errors.push('skill-release.json version is not SemVer.');
  if (release.schemaVersion !== 1) errors.push('Unsupported release schemaVersion.');
  if (!['development', 'stable'].includes(release.channel)) errors.push('Unsupported release channel.');
  for (const url of [release.source?.repository, release.updateManifestUrl]) {
    if (typeof url !== 'string' || !URL.canParse(url) || !/^https?:\/\//.test(url)) errors.push('Release source and update manifest require HTTP URLs.');
  }
  if (release.channel === 'development' && !prerelease) errors.push('development channel requires a prerelease version.');
  if (release.channel === 'stable' && prerelease) errors.push('stable channel cannot use a prerelease version.');
}

// 7. Shipped runtime scripts & resources
const requiredRuntime = [
  'schemas/architecture.schema.json',
  'schemas/activity.schema.json',
  'assets/viewer.js',
  'assets/demo.css',
  'assets/theme.js',
  'assets/constraint-canvas.js',
  'assets/constraint-canvas.css',
];
for (const rel of requiredRuntime) {
  if (!exists(rel)) errors.push(`Missing required runtime artifact: ${rel}`);
}
for (const rel of ['scripts/birdify.mjs', 'scripts/validate.mjs', 'scripts/render.mjs', 'scripts/discover-constraints.mjs', 'scripts/compile-constraint-rules.mjs', 'scripts/render-constraints.mjs', 'scripts/constraint-freshness.mjs']) {
  if (exists(rel)) errors.push(`CLI implementation must not ship in the skill: ${rel}`);
}

// 8. Machine-specific absolute paths
const localPath = /(?:^|[\s`(])(?:\/Users\/|\/Volumes\/|\/home\/|[A-Za-z]:\\)/;
for (const file of files.filter((f) => /\.(md|json|txt|mjs|js|css)$/.test(f))) {
  if (localPath.test(fs.readFileSync(file, 'utf8'))) {
    errors.push(`Machine-specific absolute path: ${path.relative(skillRoot, file).replaceAll('\\', '/')}`);
  }
}

// 9. Markdown relative link integrity
for (const mdFile of files.filter((f) => f.endsWith('.md'))) {
  const content = fs.readFileSync(mdFile, 'utf8');
  for (const match of content.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
    const matchTarget = match[1];
    const target = matchTarget ? matchTarget.split(/[?#]/, 1)[0] : undefined;
    if (!target || /^(?:https?:|mailto:|#)/.test(target)) continue;
    const resolved = path.resolve(path.dirname(mdFile), decodeURIComponent(target));
    if (!resolved.startsWith(`${skillRoot}${path.sep}`) && resolved !== skillRoot) {
      errors.push(`Link escapes package boundary in ${path.relative(skillRoot, mdFile)}: ${target}`);
    } else if (!fs.existsSync(resolved)) {
      errors.push(`Broken package link in ${path.relative(skillRoot, mdFile)}: ${target}`);
    }
  }
}

const result = { ok: errors.length === 0, skill: name ?? null, files: relativeFiles.length, errors };
console.log(JSON.stringify(result, null, 2));
if (errors.length) process.exit(1);
