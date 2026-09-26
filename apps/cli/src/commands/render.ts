import fs from 'node:fs';
import path from 'node:path';
import { renderArchitecture, renderConstraintCatalog, type ReviewedConstraintCatalog } from '@birdify/core';

const USAGE = 'Usage: birdify render architecture.json architecture.html [activity.jsonl] [--simulation] [--repo repository-root] [--constraints reviewed.json]';

export function runRender(args: string[]): void {
  let repository: string | undefined;
  let constraintCatalog: ReviewedConstraintCatalog | undefined;
  const constraintsIndex = args.indexOf('--constraints');
  if (constraintsIndex !== -1) {
    const file = args[constraintsIndex + 1];
    if (!file || file.startsWith('--')) throw new Error('--constraints requires a reviewed catalog JSON file.');
    constraintCatalog = JSON.parse(fs.readFileSync(file, 'utf8')) as ReviewedConstraintCatalog;
    args.splice(constraintsIndex, 2);
  }
  const repositoryIndex = args.indexOf('--repo');
  if (repositoryIndex !== -1) {
    repository = args[repositoryIndex + 1];
    if (!repository || repository.startsWith('--')) throw new Error('--repo requires a Git repository root.');
    args.splice(repositoryIndex, 2);
  }
  const simulation = args.includes('--simulation');
  const [input, output, activity, ...extra] = args.filter(arg => arg !== '--simulation');
  if (!input || !output || extra.length) throw new Error(USAGE);
  if (path.extname(output).toLowerCase() !== '.html') throw new Error('Output must be an .html file.');
  if (path.resolve(input).toLowerCase() === path.resolve(output).toLowerCase()) throw new Error('Input and output must differ.');
  if (activity && path.resolve(activity).toLowerCase() === path.resolve(output).toLowerCase()) throw new Error('Activity input and output must differ.');
  const events: unknown[] = activity ? fs.readFileSync(activity, 'utf8').split(/\r?\n/).filter(line => line.trim()).map((line, index): unknown => {
    try { return JSON.parse(line); } catch { throw new Error(`Invalid JSON in activity record ${index + 1}.`); }
  }) : [];
  const map: unknown = JSON.parse(fs.readFileSync(input, 'utf8'));
  const sourceOutput = output.replace(/\.html$/i, '.sources.html');
  const html = renderArchitecture(map, events, {
    simulation,
    ...(repository ? { repository } : {}),
    ...(constraintCatalog ? { constraintCatalog, constraintSourceHref: encodeURIComponent(path.basename(sourceOutput)) } : {}),
  });
  fs.mkdirSync(path.dirname(path.resolve(output)), { recursive: true });
  fs.writeFileSync(output, html);
  if (constraintCatalog) fs.writeFileSync(sourceOutput, renderConstraintCatalog(constraintCatalog, undefined, { view: 'sources' }));
  console.log(path.resolve(output));
}
