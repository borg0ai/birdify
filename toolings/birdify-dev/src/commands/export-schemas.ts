import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { findRepoRootForCommand } from '../repo-root.js';

const CHECK_FLAG = '--check';
const JSON_SCHEMA_DRAFT = 'https://json-schema.org/draft/2020-12/schema';
const MISSING_CONTRACTS = 'Missing packages/core/dist/contracts/models.js. Run pnpm run build before schema export.';
const ARCHITECTURE_DEFINITIONS = {
  constraint: 'mapConstraint', language: 'mapLanguage', translations: 'mapTranslations', translation: 'mapTranslation',
  id: 'mapId', text: 'mapText', path: 'mapPath', questions: 'mapQuestions', evidenceList: 'mapEvidenceList',
};
const EXPORTS = [
  { name: 'architecture', schemaKey: 'architectureSchema', id: 'urn:birdify:architecture:1', definitions: ARCHITECTURE_DEFINITIONS },
  { name: 'activity', schemaKey: 'activitySchema', id: 'urn:birdify:activity:1', definitions: { paths: 'eventPaths' } },
];

type RuntimeModels = Record<string, unknown>;

function schemaText(models: RuntimeModels, entry: (typeof EXPORTS)[number]): string {
  const schema = models[entry.schemaKey];
  if (schema == null || typeof schema !== 'object') throw new Error(`Runtime contracts missing ${entry.schemaKey}. Rebuild packages/core.`);
  const definitions: Record<string, unknown> = {};
  for (const [anchor, symbol] of Object.entries(entry.definitions)) {
    const value = models[symbol];
    if (value == null) throw new Error(`Runtime contracts missing ${symbol}. Rebuild packages/core.`);
    definitions[anchor] = value;
  }
  return `${JSON.stringify({ $schema: JSON_SCHEMA_DRAFT, $id: entry.id, ...schema, $defs: definitions }, null, 2)}\n`;
}

export async function runExportSchemas(args: readonly string[], cwd = process.cwd()): Promise<void> {
  const root = findRepoRootForCommand(cwd);
  const modelsPath = path.join(root, 'packages/core/dist/contracts/models.js');
  if (!fs.existsSync(modelsPath)) throw new Error(MISSING_CONTRACTS);
  const models = await import(pathToFileURL(modelsPath).href) as RuntimeModels;
  const check = args.includes(CHECK_FLAG);
  for (const entry of EXPORTS) {
    const file = path.join(root, 'birdify/schemas', `${entry.name}.schema.json`);
    const text = schemaText(models, entry);
    if (check) {
      if (fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n') !== text) throw new Error(`Stale ${entry.name} schema: run pnpm run build.`);
    } else {
      fs.writeFileSync(file, text);
    }
  }
}
