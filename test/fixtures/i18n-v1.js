const uiTranslations = {
  '架构标识': 'Architecture identity',
  '前端': 'Frontend', '后端': 'Backend', '缓存': 'Cache', '数据存储': 'Data store',
  '任务与队列': 'Tasks / Queue', '安全': 'Security', '通用模块': 'Generic',
  '关闭详情': 'Close details', '查看详情': 'Inspect module',
  '看见 AI 如何改变你的系统': 'See how AI changes your system',
  '架构快照': 'Architecture snapshot',
  '系统架构': 'System architecture', '项目架构': 'Project architecture',
  '缩小': 'Zoom out', '放大': 'Zoom in', '缩放比例': 'Zoom level',
  '适配全图': 'Fit diagram', '原始大小': 'Actual size', '模块关系': 'Module relationships',
  '架构快照 · 尚无修改活动': 'Architecture snapshot · No change activity',
  '模块详情': 'Module details', '文件归属': 'File ownership', '源码证据': 'Source evidence',
  '待确认': 'Uncertain', '相关连接': 'Related connections',
  '切换到深色': 'Switch to dark theme', '切换到浅色': 'Switch to light theme',
  '关系方向动画，不代表实时数据传输': 'Relationship direction, not live data transfer',
  '流向': 'Flow', '外部服务': 'External service', '本地模块': 'Local module',
  '有来源证据': 'Source-backed', '无本地文件归属': 'No local file ownership',
  '无来源证据': 'No source evidence', '无已记录的待确认项': 'No recorded open questions',
  '无已记录的关系': 'No recorded relationships'
};
const availableLanguages = new Set([map.language || 'zh', 'zh', 'en']);
for (const item of [map.project, ...map.modules, ...map.relationships, ...(map.groups || []), ...(map.constraints || [])]) {
  for (const locale of Object.keys(item.translations || {})) availableLanguages.add(locale);
  for (const source of item.evidence || []) for (const locale of Object.keys(source.translations || {})) availableLanguages.add(locale);
}
let language = map.language || 'zh';
try {
  const stored = localStorage.getItem('birdify-language');
  if (availableLanguages.has(stored)) language = stored;
} catch {}
const requestedLanguage = new URLSearchParams(location.hash.slice(1)).get('lang');
if (availableLanguages.has(requestedLanguage)) language = requestedLanguage;
const isChinese = () => language.split('-')[0] === 'zh';
const t = (text) => isChinese() ? text : (uiTranslations[text] || text);
const localized = (item, field) => item.translations?.[language]?.[field] ?? item[field] ?? '';
const staticLabels = [];
const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
while (walker.nextNode()) {
  const node = walker.currentNode;
  if (Object.hasOwn(uiTranslations, node.textContent)) staticLabels.push({ node, source: node.textContent });
}
const staticAttributes = [];
document.querySelectorAll('[title], [aria-label]').forEach((node) => {
  for (const attr of ['title', 'aria-label']) {
    const source = node.getAttribute(attr);
    if (Object.hasOwn(uiTranslations, source)) staticAttributes.push({ node, attr, source });
  }
});
const languageSelect = document.createElement('select');
languageSelect.id = 'language';
languageSelect.setAttribute('aria-label', '语言 / Language');
for (const value of availableLanguages) {
  const option = document.createElement('option');
  option.value = value;
  let label = value;
  try { label = new Intl.DisplayNames([value], { type: 'language' }).of(value); } catch {}
  option.textContent = value === 'zh' ? '中文' : value === 'en' ? 'English' : label;
  languageSelect.append(option);
}
document.querySelector('.header-actions').prepend(languageSelect);
function applyLanguage() {
  document.documentElement.lang = language;
  languageSelect.value = language;
  for (const { node, source } of staticLabels) node.textContent = t(source);
  for (const { node, attr, source } of staticAttributes) node.setAttribute(attr, t(source));
  $('project').textContent = localized(map.project, 'name');
  document.title = `${localized(map.project, 'name')} | Birdify`;
  const count = map.modules.filter((module) => module.status === 'uncertain').length;
  $('uncertainty').textContent = isChinese() ? `${count} 个模块待确认` : `${count} uncertain modules`;
  $('uncertainty').hidden = count === 0;
  flowLabel.title = t('关系方向动画，不代表实时数据传输');
  flowLabel.lastChild.textContent = t('流向');
  relationView.options[0].textContent = isChinese() ? '概览' : 'Overview';
  relationView.options[1].textContent = isChinese() ? '全部关系' : 'All relations';
  relationView.setAttribute('aria-label', isChinese() ? '关系显示范围' : 'Relationship visibility');
  themeButton();
  updateActivity();
  roleLegend.replaceChildren();
  for (const key of new Set(map.modules.map((module) => module.role || 'generic'))) {
    const role = roles[key];
    const entry = document.createElement('span');
    entry.dataset.tone = role.tone;
    const icon = document.createElement('span');
    icon.innerHTML = icons[role.icon];
    entry.append(icon, document.createTextNode(`${t(role.label)} · ${map.modules.filter((module) => (module.role || 'generic') === key).length}`));
    roleLegend.append(entry);
  }
  closeDetails.title = closeDetails.ariaLabel = t('关闭详情');
  showDetails.title = showDetails.ariaLabel = t('查看详情');
  for (const { label, group } of groupFrames) {
    const groupRoles = { interaction: ['交互层', 'Interaction'], runtime: ['运行层', 'Runtime'], 'external-services': ['外部服务', 'External services'], generic: ['通用分组', 'General'] };
    const role = groupRoles[group.role || 'generic'][isChinese() ? 0 : 1];
    label.textContent = `${localized(group, 'name')} · ${role}`;
    label.title = `${label.textContent}\n${group.evidence.map((source) => `${source.path}: ${localized(source, 'note')}`).join('\n')}`;
  }
  for (const module of map.modules) {
    const button = buttons.get(module.id);
    const name = button.querySelector('strong');
    name.textContent = localized(module, 'name');
    name.dir = 'auto';
    name.style.fontSize = '13px';
    button.querySelector('small').textContent = localized(module, 'responsibility');
    button.querySelector('small').dir = 'auto';
    button.title = `${localized(module, 'name')}\n${localized(module, 'responsibility')}`;
    button.setAttribute('aria-label', `${localized(module, 'name')}${module.status === 'uncertain' ? `, ${t('待确认')}` : ''}`);
    const mark = button.querySelector('.uncertain-mark');
    if (mark) { mark.title = t('待确认'); mark.setAttribute('aria-label', t('待确认')); }
    for (let size = 13; size > 10 && name.scrollHeight > name.clientHeight; size--) name.style.fontSize = `${size - 1}px`;
  }
  for (const { path, relation } of edges) path.querySelector('title').textContent = localized(relation, 'label');
  select(map.modules.find((module) => module.id === selectedModuleId) || map.modules[0]);
  if (fitting) updateZoom();
}
languageSelect.onchange = () => {
  language = languageSelect.value;
  try { localStorage.setItem('birdify-language', language); } catch {}
  const hash = new URLSearchParams(location.hash.slice(1));
  hash.set('lang', language);
  try { history.replaceState(null, '', `#${hash}`); } catch {}
  applyLanguage();
};
