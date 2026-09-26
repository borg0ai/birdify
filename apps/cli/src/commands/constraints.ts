import fs from 'node:fs';
import path from 'node:path';
import {
  collectRuleHistory,
  compileConstraintRules,
  discoverConstraints,
  inspectConstraintFreshness,
  renderConstraintCatalog,
  type ConstraintCatalog,
  type ReviewedSelection,
} from '@birdify/core';

const DISCOVER_USAGE = 'Usage: birdify discover repository catalog.json [project-name]';
const RENDER_USAGE = 'Usage: birdify render-constraints catalog.json constraints.html [--sources]';
const COMPILE_USAGE = 'Usage: birdify compile-rules catalog.json reviewed-rules.json output.json [repository]';
const FRESHNESS_USAGE = 'Usage: birdify freshness architecture.json repository-root';

export function runDiscover(args: string[]): void {
  const [repository, output, title] = args;
  if (!repository || !output || args.length > 3) throw new Error(DISCOVER_USAGE);
  const catalog = discoverConstraints(repository, title ? { title } : {});
  fs.mkdirSync(path.dirname(path.resolve(output)), { recursive: true });
  fs.writeFileSync(output, JSON.stringify(catalog, null, 2) + '\n');
  console.log(JSON.stringify({ sources: catalog.sources.length, sections: catalog.sources.reduce((count, source) => count + source.sections.length, 0),
    excluded: catalog.coverage.excluded.length, unresolved: catalog.coverage.unresolved.length, uninspected: catalog.coverage.uninspectedPaths.length }));
}

export function runRenderConstraints(args: string[]): void {
  const [input, output, option] = args;
  if (!input || !output) throw new Error(RENDER_USAGE);
  if (option && option !== '--sources') throw new Error('Only --sources is supported');
  if (args.length > 3) throw new Error(RENDER_USAGE);
  const catalog = JSON.parse(fs.readFileSync(input, 'utf8')) as ConstraintCatalog;
  const sourceOutput = output.replace(/\.html$/i, '') + '.sources.html';
  const html = renderConstraintCatalog(catalog, undefined, { view: option ? 'sources' : 'rules', sourceHref: path.basename(sourceOutput) });
  fs.mkdirSync(path.dirname(path.resolve(output)), { recursive: true });
  if (!option) fs.writeFileSync(sourceOutput, renderConstraintCatalog(catalog, undefined, { view: 'sources' }));
  fs.writeFileSync(output, html);
  console.log(path.resolve(output));
}

export function runCompileRules(args: string[]): void {
  const [input, selection, output, repository] = args;
  if (!input || !selection || !output || args.length > 4) throw new Error(COMPILE_USAGE);
  let result = compileConstraintRules(JSON.parse(fs.readFileSync(input, 'utf8')) as ConstraintCatalog, JSON.parse(fs.readFileSync(selection, 'utf8')) as ReviewedSelection);
  if (repository) result = collectRuleHistory(result, repository);
  fs.mkdirSync(path.dirname(path.resolve(output)), { recursive: true });
  fs.writeFileSync(output, JSON.stringify(result, null, 2) + '\n');
  console.log(`${result.rules.length} reviewed rules; implementation verification remains unverified.`);
}

export function runFreshness(args: string[]): void {
  const [input, repository, ...extra] = args;
  if (!input || !repository || extra.length) throw new Error(FRESHNESS_USAGE);
  console.log(JSON.stringify(inspectConstraintFreshness(JSON.parse(fs.readFileSync(input, 'utf8')), repository), null, 2));
}
