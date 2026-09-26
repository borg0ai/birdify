import { architecture, activity, present } from '../fixtures.js';
import { test, vi } from 'vitest';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { renderArchitecture, validate } from '@birdify/core';

const example = architecture(fs.readFileSync(new URL('../../birdify/examples/architecture.json', import.meta.url), 'utf8'));
const bilingual = architecture(fs.readFileSync(new URL('../../birdify/examples/bilingual.architecture.json', import.meta.url), 'utf8'));

test('rendered HTML is identical across LF and CRLF text assets', () => {
  const read = fs.readFileSync;
  let eol = '\n';
  vi.spyOn(fs, 'readFileSync').mockImplementation((file: fs.PathOrFileDescriptor, options?: Parameters<typeof fs.readFileSync>[1]) => {
    const value = read(file, options);
    return typeof value === 'string' ? value.replace(/\r\n?/g, '\n').replace(/\n/g, eol) : value;
  });
  const unix = renderArchitecture(example);
  eol = '\r\n';
  assert.equal(renderArchitecture(example), unix);
  assert.ok(!unix.includes('\r'));
});
test('activity rendering validates binding and transitions before delivery', () => {
  const map = architecture(fs.readFileSync(new URL('../../birdify/examples/system.architecture.json', import.meta.url), 'utf8'));
  const events = activity(fs.readFileSync(new URL('../../birdify/examples/harness.activity.jsonl', import.meta.url), 'utf8'));
  const html = renderArchitecture(map, events, { simulation: true });
  assert.ok(html.includes('tool-timeout'));
  assert.ok(html.includes('"simulation":true'));
  assert.ok(!html.includes('/* BIRDIFY_'));
  assert.match(html, /<link rel="icon" type="image\/png" href="data:image\/png;base64,/);
  assert.match(html, /"brandLogo":"data:image\/png;base64,/);
  assert.ok(html.includes(fs.readFileSync(new URL('../../LICENSE', import.meta.url), 'utf8').replace(/\r\n?/g, '\n')));
  assert.ok(html.includes(fs.readFileSync(new URL('../../THIRD_PARTY_NOTICES', import.meta.url), 'utf8').replace(/\r\n?/g, '\n')));
  const wrong = structuredClone(events);
  present(wrong[0]).mapRevision++;
  assert.throws(() => renderArchitecture(map, wrong), /map-mismatch/);
  const unordered = structuredClone(events);
  present(unordered[1]).sequence = 9;
  assert.throws(() => renderArchitecture(map, unordered), /sequence/);
});
test('relationships require explicit semantics and visibility; reject retired fields', () => {
  const map = structuredClone(example);
  for (const kind of ['request', 'result', 'dependency', 'event', 'control']) {
    for (const visibility of ['overview', 'detail']) {
      Object.assign(present(map.relationships[0]), { kind, visibility });
      assert.equal(validate(map).ok, true);
    }
  }
  Object.assign(present(map.relationships[0]), { primary: true });
  assert.equal(validate(map).ok, false);
  Reflect.deleteProperty(present(map.relationships[0]), 'primary');
  Reflect.deleteProperty(present(map.relationships[0]), 'visibility');
  assert.equal(validate(map).ok, false);
  present(map.relationships[0]).visibility = 'overview';
  Reflect.deleteProperty(present(map.relationships[0]), 'kind');
  assert.equal(validate(map).ok, false);
});
test('rendered HTML inlines the skill viewer assets', () => {
  const html = renderArchitecture(example);
  const asset = (name: string) => fs.readFileSync(new URL(`../../birdify/assets/${name}`, import.meta.url), 'utf8').replace(/\r\n?/g, '\n');
  assert.ok(html.includes(asset('theme.js')));
  assert.ok(html.includes(asset('viewer.js')));
  assert.ok(!html.includes('/* BIRDIFY_THEME */'));
  assert.ok(!html.includes('/* BIRDIFY_JS */'));
});

test('module roles accept supported values and reject invented categories', () => {
  const map = structuredClone(example);
  assert.equal(validate(map).ok, true);
  for (const role of ['frontend', 'backend', 'cache', 'database', 'queue', 'security', 'generic'] as const) {
    present(map.modules[0]).role = role;
    assert.equal(validate(map).ok, true);
  }
  Object.assign(present(map.modules[0]), { role: 'random-purple' });
  assert.equal(validate(map).ok, false);
});
test('bilingual example passes strict coverage; legacy remains compatible', () => {
  assert.equal(validate(bilingual, [], { requireBilingual: true }).ok, true);
  assert.equal(validate(example).ok, true);
  assert.equal(validate(example, [], { requireBilingual: true }).ok, false);
});
test('strict coverage detects missing evidence translation', () => {
  const map = structuredClone(bilingual);
  delete present(present(map.modules[0]).evidence[0]).translations;
  assert.ok(validate(map, [], { requireBilingual: true }).errors.some((error) => error.code === 'translation/missing'));
});
test('translations cannot alter structure or omit open questions', () => {
  const map = structuredClone(bilingual);
  Object.assign(present(present(present(map.modules[0]).translations).zh), { id: 'translated-id' });
  assert.equal(validate(map).ok, false);
  Reflect.deleteProperty(present(present(present(map.modules[0]).translations).zh), 'id');
  present(present(present(map.modules[1]).translations).zh).openQuestions = [];
  assert.ok(validate(map).errors.some((error) => error.code === 'translation/questions'));
});
test('renderer rejects invalid maps before generating HTML', () => {
  const map = structuredClone(example);
  present(map.relationships[0]).to = 'missing';
  assert.throws(() => renderArchitecture(map), /unknown-endpoint/);
});
test('group roles allow explicit semantics and preserve unclassified maps', () => {
  const map = architecture(fs.readFileSync(new URL('../../birdify/examples/system.architecture.json', import.meta.url), 'utf8'));
  for (const role of ['interaction', 'runtime', 'external-services', 'generic'] as const) {
    present(present(map.groups)[0]).role = role;
    assert.equal(validate(map).ok, true);
  }
  delete present(present(map.groups)[0]).role;
  assert.equal(validate(map).ok, true);
  Object.assign(present(present(map.groups)[0]), { role: 'invented' });
  assert.equal(validate(map).ok, false);
});

test('groups reject unknown, overlapping and duplicate membership identities', () => {
  const map = structuredClone(example);
  map.groups = [{ id: 'app', name: 'Application', members: ['web'], evidence: [{ path: 'docs/system.md', note: 'Example membership.' }] }];
  assert.equal(validate(map).ok, true);
  map.groups.push(structuredClone(present(present(map.groups)[0])));
  assert.ok(validate(map).errors.some((error) => error.code === 'group/overlap'));
  assert.ok(validate(map).errors.some((error) => error.code === 'group/duplicate-id'));
  present(present(map.groups)[1]).members = ['unknown'];
  assert.ok(validate(map).errors.some((error) => error.code === 'group/unknown-member'));
});
test('language tags support non-English base text and additional translations', () => {
  const map = structuredClone(example);
  map.language = 'ja';
  map.project.name = '商品システム';
  map.project.translations = { 'pt-BR': { name: 'Sistema de produtos' } };
  assert.equal(validate(map).ok, true);
  assert.ok(renderArchitecture(map).includes('商品システム'));
  map.language = '../../invalid';
  assert.equal(validate(map).ok, false);
});
test('renderer embeds project data without allowing script termination', () => {
  const map = structuredClone(example);
  map.project.name = '</script><script>globalThis.injected=true</script>';
  const html = renderArchitecture(map);
  assert.ok(!html.includes(map.project.name));
  assert.ok(html.includes('\\u003c/script>'));
  assert.ok(html.includes('const DATA = '));
  assert.ok(!html.includes('/* BIRDIFY_'));
});
