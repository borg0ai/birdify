import { architecture, present } from '../fixtures.js';
import { test } from 'vitest';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const VIEWER_ASSET = '../../birdify/assets/viewer.js';
const ROUTING_FIXTURE = '../../test/fixtures/routing-v1.js';
const I18N_FIXTURE = '../../test/fixtures/i18n-v1.js';
const EXAMPLE_MAPS = ['architecture.json', 'system.architecture.json', 'bilingual.architecture.json'] as const;
const ROUTING_START = 'function requiredAt';
const ROUTING_END = 'var i18n_exports';
const I18N_START = 'var uiTranslations = ';
const I18N_END = 'function mountConstraintCanvas';
const LOCALIZED_FIELDS = ['name', 'responsibility', 'label', 'note', 'verification', 'openQuestions'] as const;
const CARD_WIDTH = 164;
const CARD_HEIGHT = 72;

type Point = [number, number];
type Route = { points: Point[]; d: string };
type Position = { x: number; y: number };
type Relation = { from: string; to: string };
type RouteFn = (relationships: Relation[], positions: Map<string, Position>) => Route[];
type LocalizedField = (typeof LOCALIZED_FIELDS)[number];
type LocalizedText = Partial<Record<LocalizedField, string | string[]>> & {
  translations?: Record<string, LocalizedText>;
  evidence?: Array<{ translations?: Record<string, LocalizedText> }>;
};
type LanguageMap = {
  language?: string;
  project: LocalizedText;
  modules: LocalizedText[];
  relationships: LocalizedText[];
  groups?: LocalizedText[];
  constraints?: LocalizedText[];
};
type ViewerI18n = {
  availableLanguages: (map: LanguageMap) => Set<string>;
  selectLanguage: (base: string | undefined, available: Set<string>, stored: string | null, requested: string | null) => string;
  isChinese: (language: string) => boolean;
  translate: (text: string, language: string) => string;
  localized: (item: LocalizedText, field: LocalizedField, language: string) => string | string[];
  uiTranslations: Record<string, string>;
};

const readRepo = (relativePath: string) => fs.readFileSync(new URL(relativePath, import.meta.url), 'utf8');
const viewerSource = readRepo(VIEWER_ASSET);

function sliceSkill(source: string, startMarker: string, endMarker: string): string {
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker, start + startMarker.length);
  assert.ok(start >= 0 && end > start, `技能文件缺少片段 ${startMarker}`);
  return source.slice(start, end);
}

function loadSkill<T>(source: string, expression: string, sandbox: vm.Context = {}): T {
  return vm.runInNewContext(`${source}\n${expression}`, sandbox) as T;
}

function cloned<T>(value: T): T {
  return structuredClone(value);
}

const routeArchitecture = loadSkill<RouteFn>(
  sliceSkill(viewerSource, ROUTING_START, ROUTING_END),
  'routeArchitecture',
);
const viewerI18n = loadSkill<ViewerI18n>(
  sliceSkill(viewerSource, I18N_START, I18N_END),
  '({ availableLanguages, selectLanguage, isChinese, translate, localized, uiTranslations })',
);
const legacyRouting = loadSkill<RouteFn>(readRepo(ROUTING_FIXTURE), 'routeArchitecture');
const legacyI18n = readRepo(I18N_FIXTURE);

function positionsOf(map: ReturnType<typeof architecture>): Map<string, Position> {
  return new Map(map.modules.map(node => [node.id, {
    x: 28 + node.layout.column * 204,
    y: 30 + node.layout.row * 128,
  }]));
}

test('技能 viewer.js 的走线与页面基线坐标一致', () => {
  const layouts = [
    new Map<string, Position>(),
    new Map([['a', { x: 28, y: 30 }]]),
    new Map([['a', { x: 28, y: 30 }], ['blocker', { x: 232, y: 30 }], ['b', { x: 436, y: 30 }], ['c', { x: 232, y: 158 }]]),
    new Map([['a', { x: 28, y: 30 }], ['b', { x: 232, y: 158 }]]),
  ];
  for (const positions of layouts) {
    const ids = [...positions.keys()];
    const relations = ids.flatMap(from => ids.map(to => ({ from, to })));
    assert.deepEqual(cloned(routeArchitecture(relations, positions)), cloned(legacyRouting(relations, positions)));
    assert.deepEqual(cloned(routeArchitecture([...relations].reverse(), positions)), cloned(legacyRouting([...relations].reverse(), positions)));
  }
  for (const file of EXAMPLE_MAPS) {
    const map = architecture(readRepo(`../../birdify/examples/${file}`));
    const positions = positionsOf(map);
    assert.deepEqual(cloned(routeArchitecture(map.relationships, positions)), cloned(legacyRouting(map.relationships, positions)));
  }
});

test('技能 viewer.js 的走线不穿过卡片，并错开共用端口', () => {
  const positions = new Map<string, Position>([
    ['a', { x: 28, y: 30 }],
    ['blocker', { x: 232, y: 30 }],
    ['b', { x: 436, y: 30 }],
    ['c', { x: 232, y: 158 }],
  ]);
  const relations = [
    { from: 'a', to: 'b' },
    { from: 'a', to: 'c' },
    { from: 'b', to: 'a' },
    { from: 'c', to: 'c' },
  ];
  const routes = cloned(routeArchitecture(relations, positions));
  assert.notDeepEqual(present(routes[0]).points[0], present(routes[1]).points[0]);
  routes.forEach((route, index) => {
    assert.ok(!/NaN|Infinity/.test(route.d));
    assert.ok(route.points.length >= 2);
    for (let pointIndex = 1; pointIndex < route.points.length; pointIndex += 1) {
      const start = present(route.points[pointIndex - 1]);
      const end = present(route.points[pointIndex]);
      assert.ok(start[0] === end[0] || start[1] === end[1]);
      for (const [id, card] of positions) {
        const crosses = start[0] === end[0]
          ? start[0] > card.x && start[0] < card.x + CARD_WIDTH && Math.max(start[1], end[1]) > card.y && Math.min(start[1], end[1]) < card.y + CARD_HEIGHT
          : start[1] > card.y && start[1] < card.y + CARD_HEIGHT && Math.max(start[0], end[0]) > card.x && Math.min(start[0], end[0]) < card.x + CARD_WIDTH;
        assert.equal(crosses, false, `route ${index} crosses ${id}`);
      }
    }
  });
  assert.ok(present(routes[0]).points.some(point => point[1] < 30 || point[1] > 102));
});

test('技能 viewer.js 在空走廊上对斜向邻居只拐一次', () => {
  const positions = new Map<string, Position>([
    ['a', { x: 28, y: 30 }],
    ['b', { x: 232, y: 158 }],
  ]);
  const route = present(cloned(routeArchitecture([{ from: 'a', to: 'b' }], positions))[0]);
  assert.equal(route.points.length, 3);
  assert.equal(present(route.points[0])[1], 102);
  assert.equal(present(route.points.at(-1))[0], 232);
});

test('技能 viewer.js 按发现顺序选择语言', () => {
  const map: LanguageMap = {
    language: 'fr',
    project: { translations: { fr: { name: 'Projet' } } },
    modules: [{ translations: { de: {} }, evidence: [{ translations: { ja: {} } }] }],
    relationships: [],
    groups: [{ translations: { es: {} } }],
    constraints: [{ translations: { ko: {} } }],
  };
  const available = viewerI18n.availableLanguages(map);
  assert.deepEqual(cloned([...available]), ['fr', 'zh', 'en', 'de', 'ja', 'es', 'ko']);
  assert.equal(viewerI18n.selectLanguage('fr', available, 'de', 'ja'), 'ja');
  assert.equal(viewerI18n.selectLanguage('fr', available, 'de', 'invalid'), 'de');
  assert.equal(viewerI18n.selectLanguage('fr', available, 'invalid', null), 'fr');
  assert.equal(viewerI18n.selectLanguage(undefined, new Set(['zh', 'en']), null, null), 'zh');
  assert.equal(viewerI18n.isChinese('zh-Hant'), true);
  assert.equal(viewerI18n.isChinese('en'), false);
});

test('技能 viewer.js 保留文案回退，并与页面基线目录一致', () => {
  for (const [source, english] of Object.entries(viewerI18n.uiTranslations)) {
    assert.equal(viewerI18n.translate(source, 'zh'), source);
    assert.equal(viewerI18n.translate(source, 'zh-Hant'), source);
    assert.equal(viewerI18n.translate(source, 'en'), english);
    assert.equal(viewerI18n.translate(source, 'fr'), english);
  }
  assert.equal(viewerI18n.translate('unknown label', 'en'), 'unknown label');
  const item: LocalizedText = {
    name: 'Base',
    openQuestions: ['base question'],
    translations: { en: { name: 'English', openQuestions: ['question'] }, fr: { name: '' } },
  };
  assert.equal(viewerI18n.localized(item, 'name', 'en'), 'English');
  assert.equal(viewerI18n.localized(item, 'name', 'de'), 'Base');
  assert.equal(viewerI18n.localized(item, 'name', 'fr'), '');
  assert.deepEqual(cloned(viewerI18n.localized(item, 'openQuestions', 'en')), ['question']);
  assert.equal(viewerI18n.localized({}, 'name', 'en'), '');
  assert.deepEqual(cloned(viewerI18n.localized(item, 'openQuestions', 'de')), ['base question']);

  const legacyCatalog = loadSkill<Record<string, string>>(
    legacyI18n.slice(0, legacyI18n.indexOf('const availableLanguages')),
    'uiTranslations',
  );
  assert.deepEqual(cloned(viewerI18n.uiTranslations), cloned(legacyCatalog));
  for (const file of EXAMPLE_MAPS) {
    const map = architecture(readRepo(`../../birdify/examples/${file}`));
    const legacyLanguages = loadSkill<string[]>(
      legacyI18n.slice(legacyI18n.indexOf('const availableLanguages'), legacyI18n.indexOf('let language')),
      '[...availableLanguages]',
      { map },
    );
    assert.deepEqual(cloned([...viewerI18n.availableLanguages(map)]), cloned(legacyLanguages));
    const items: LocalizedText[] = [map.project, ...map.modules, ...map.relationships, ...(map.groups ?? []), ...(map.constraints ?? [])];
    for (const entry of items) {
      for (const language of viewerI18n.availableLanguages(map)) {
        for (const field of LOCALIZED_FIELDS) {
          const translated = entry.translations?.[language]?.[field] ?? entry[field] ?? '';
          assert.deepEqual(cloned(viewerI18n.localized(entry, field, language)), cloned(translated));
        }
      }
    }
  }
});
