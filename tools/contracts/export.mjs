import fs from 'node:fs';

// Read the bundled runtime contracts. This tool does not compile a second module tree.
const MODELS_URL = new URL('../../packages/core/dist/contracts/models.js', import.meta.url);
const SCHEMA_DIRECTORY = new URL('../../birdify/schemas/', import.meta.url);
const JSON_SCHEMA_DRAFT = 'https://json-schema.org/draft/2020-12/schema';
const CHECK_FLAG = '--check';
const MISSING_CONTRACTS = 'Missing packages/core/dist/contracts/models.js. Run pnpm run build before schema export.';

// Public $defs anchors for consumers of the v1 exchange schemas. Values are runtime export names.
const ARCHITECTURE_DEFINITIONS = {
  constraint: 'mapConstraint',
  language: 'mapLanguage',
  translations: 'mapTranslations',
  translation: 'mapTranslation',
  id: 'mapId',
  text: 'mapText',
  path: 'mapPath',
  questions: 'mapQuestions',
  evidenceList: 'mapEvidenceList',
};
const ACTIVITY_DEFINITIONS = { paths: 'eventPaths' };
const EXPORTS = [
  { name: 'architecture', schemaKey: 'architectureSchema', id: 'urn:birdify:architecture:1', definitions: ARCHITECTURE_DEFINITIONS },
  { name: 'activity', schemaKey: 'activitySchema', id: 'urn:birdify:activity:1', definitions: ACTIVITY_DEFINITIONS },
];

if (!fs.existsSync(MODELS_URL)) {
  console.error(MISSING_CONTRACTS);
  process.exit(1);
}

const models = await import(MODELS_URL.href);
const checking = process.argv.includes(CHECK_FLAG);

for (const entry of EXPORTS) {
  const schema = models[entry.schemaKey];
  if (schema == null) throw new Error(`Runtime contracts missing ${entry.schemaKey}. Rebuild packages/core.`);
  const definitions = {};
  for (const [anchor, symbol] of Object.entries(entry.definitions)) {
    const value = models[symbol];
    if (value == null) throw new Error(`Runtime contracts missing ${symbol}. Rebuild packages/core.`);
    definitions[anchor] = value;
  }
  const file = new URL(`${entry.name}.schema.json`, SCHEMA_DIRECTORY);
  // Export data-only exchange schemas; TypeBox metadata is not serialized.
  const text = `${JSON.stringify({ $schema: JSON_SCHEMA_DRAFT, $id: entry.id, ...schema, $defs: definitions }, null, 2)}\n`;
  if (checking) {
    if (fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n') !== text) throw new Error(`Stale ${entry.name} schema: run pnpm run build.`);
  } else {
    fs.writeFileSync(file, text);
  }
}
