import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { findRepoRootForCommand } from '../repo-root.js';

function collect(root: string, directory: string, recursive: boolean, files: string[]): void {
  for (const entry of fs.readdirSync(path.join(root, directory), { withFileTypes: true })) {
    const file = path.posix.join(directory, entry.name);
    if (entry.isDirectory() && recursive) collect(root, file, true, files);
    else if (entry.isFile() && entry.name.endsWith('.md')) files.push(file);
  }
}

export function runCheckDocs(args: readonly string[], cwd = process.cwd()): void {
  const root = findRepoRootForCommand(cwd);
  const files: string[] = [];
  collect(root, '', false, files);
  if (fs.existsSync(path.join(root, 'birdify'))) collect(root, 'birdify', false, files);
  for (const directory of ['birdify/references', 'birdify/examples', 'docs', '.github']) {
    if (fs.existsSync(path.join(root, directory))) collect(root, directory, true, files);
  }
  const hashes: Record<string, string> = {};
  const errors: string[] = [];
  for (const file of files.sort()) {
    const text = fs.readFileSync(path.join(root, file), 'utf8').replace(/\r\n/g, '\n');
    const counterpart = file.endsWith('.zh.md') ? file.replace(/\.zh\.md$/, '.md') : file.replace(/\.md$/, '.zh.md');
    if (!files.includes(counterpart)) errors.push(`${file}: missing ${counterpart}`);
    if (!text.includes(`](${path.posix.basename(counterpart)})`)) errors.push(`${file}: missing language link`);
    for (const match of text.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
      const target = match[1]?.split('#')[0];
      if (!target || /^[a-z]+:/i.test(target) || target.includes('<')) continue;
      if (!fs.existsSync(path.resolve(root, path.dirname(file), decodeURIComponent(target)))) errors.push(`${file}: broken link ${target}`);
    }
    hashes[file] = crypto.createHash('sha256').update(text).digest('hex');
  }
  const record = path.join(root, 'config/i18n.json');
  const update = args.includes('--update');
  if (!update) {
    const parsed: unknown = fs.existsSync(record) ? JSON.parse(fs.readFileSync(record, 'utf8')) : {};
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('Documentation hash record must be an object.');
    const saved = new Map(Object.entries(parsed));
    for (const file of new Set([...saved.keys(), ...Object.keys(hashes)])) {
      if (saved.get(file) !== hashes[file]) errors.push(`${file}: synchronization confirmation required`);
    }
  }
  if (errors.length) throw new Error(errors.join('\n'));
  if (update) {
    fs.writeFileSync(record, `${JSON.stringify(hashes, null, 2)}\n`);
    console.log(`Recorded ${files.length / 2} documentation pairs.`);
  } else console.log(`Verified ${files.length / 2} documentation pairs and local links.`);
}
