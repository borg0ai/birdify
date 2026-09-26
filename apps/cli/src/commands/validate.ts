import fs from 'node:fs';
import { validate } from '@birdify/core';

const USAGE = 'Usage: birdify validate architecture.json [activity.jsonl] [--bilingual] [--authoring]';

export function runValidate(args: string[]): void {
  try {
    const requireBilingual = args.includes('--bilingual');
    const requireRoles = args.includes('--authoring');
    const [mapPath, eventPath, ...extra] = args.filter((arg) => !['--bilingual', '--authoring'].includes(arg));
    if (!mapPath || extra.length) throw new Error(USAGE);
    const events: unknown[] = eventPath ? fs.readFileSync(eventPath, 'utf8').split(/\r?\n/).filter((line) => line.trim()).map((line, index): unknown => {
      try { return JSON.parse(line); } catch { throw new Error(`Invalid JSON in event record ${index + 1}.`); }
    }) : [];
    const receipt = validate(JSON.parse(fs.readFileSync(mapPath, 'utf8')), events, { requireBilingual, requireRoles });
    console.log(JSON.stringify(receipt, null, 2));
    process.exitCode = receipt.ok ? 0 : 1;
  } catch (error) {
    console.log(JSON.stringify({ ok: false, errors: [{ code: 'input/read', message: error instanceof Error ? error.message : String(error) }] }, null, 2));
    process.exitCode = 1;
  }
}
