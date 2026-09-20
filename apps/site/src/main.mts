function required<T>(value: T | null | undefined): T { if (value === null || value === undefined) throw new Error('Missing site element or text.'); return value; }
function query(selector: string, root: ParentNode = document): HTMLElement { const node = root.querySelector(selector); if (!(node instanceof HTMLElement)) throw new Error('Missing site element: ' + selector); return node; }

    const copy = { zh: { html: '<p class="eyebrow">架构优先 · 为 Agent 准备</p><h1>别再让 AI 闭着眼睛写代码。<em>推翻默认流程。</em></h1><p class="lede">古法编程最后的优势是感知架构——Birdify 彻底终结了这个理由。<br>编程的未来只剩两件事：约束与架构。</p>', nav: 'English', title: 'Birdify — 推翻默认编码流程' }, en: { html: '<p class="eyebrow">ARCHITECTURE FIRST · AGENT READY</p><h1>Stop letting AI code blind. <em>Change the flow.</em></h1><p class="lede">The last advantage of coding by hand was architectural awareness—Birdify has eliminated that reason entirely.<br>The future of programming comes down to just two things: constraints and architecture.</p>', nav: '中文', title: 'Birdify — Change the coding flow' } };
    const language = query('#language'); const hero = query('.hero-copy'); let zh = false;
    language.addEventListener('click', () => { zh = !zh; const next = zh ? copy.zh : copy.en; query('.eyebrow', hero).outerHTML = required(next.html.match(/<p[^>]*>[\s\S]*?<\/p>/))[0]; query('h1', hero).outerHTML = required(next.html.match(/<h1>[\s\S]*?<\/h1>/))[0]; query('.lede', hero).outerHTML = required(next.html.match(/<p class="lede">[\s\S]*?<\/p>/))[0]; language.textContent = next.nav; document.title = next.title; document.documentElement.lang = zh ? 'zh-CN' : 'en'; });

const installText = {
  en: {
    cta: 'Install Skill', title: 'Install Birdify', intro: 'Run these commands in PowerShell or a macOS/Linux shell.',
    agent: 'Any supported agent', requirements: 'Requires Node.js 18+; the installed skill includes its runtime dependencies. Installs for your user account.',
    step1: 'Install the skill', step2: 'Check the runtime', step3: 'Try it in a new agent task',
    limits: 'Doctor checks installation, not activation. Invoke Birdify through your agent skill selector or explicitly in chat. On-demand is the default; mode auto enables automatic activation.',
    guide: 'Full installation and mode guide →', copy: 'Copy', copied: 'Copied.', failed: 'Could not copy. Select the command and copy it manually.',
    prompt: "Use Birdify to show this project's architecture; do not edit code.",
    path: 'If the installer reports a different destination, use that path in step 2. Keep the full skill directory and avoid duplicate installations.',
    communityEyebrow: 'COMMUNITY · FEEDBACK', communityTitle: 'Meet other Birdify users.',
    communityBody: 'Get installation help, discuss inaccurate maps, and explore Architecture-first Coding together.',
    communityNumber: 'QQ group: 627760389', communityFeedback: 'Share feedback on GitHub →'
  },
  zh: {
    cta: '安装技能', title: '安装 Birdify', intro: '在 PowerShell 或 macOS/Linux 终端运行以下命令。',
    agent: '支持的 Agent', requirements: '需要 Node.js 18+；技能已包含运行时依赖。以下为用户级安装。',
    step1: '安装技能', step2: '检查运行时', step3: '在 Agent 的新任务中试用',
    limits: 'Doctor 检查安装，不验证触发。请通过 Agent 的技能选择器或聊天中的明确请求调用 Birdify。默认按需，mode auto 可开启自动触发。',
    guide: '完整安装与模式指南 →', copy: '复制', copied: '已复制。', failed: '复制失败，请选中命令手动复制。',
    prompt: '用 Birdify 展示这个项目的架构，不修改代码。',
    path: '如果安装器输出了不同目录，请在第 2 步使用实际路径。保留完整技能目录，避免重复安装。',
    communityEyebrow: '用户社区 · 使用反馈', communityTitle: '加入 Birdify 用户交流群',
    communityBody: '交流安装问题、反馈不准确的架构图，一起探索 Architecture-first Coding。',
    communityNumber: 'QQ 群：627760389', communityFeedback: '在 GitHub 分享使用反馈 →'
  }
};
const agentSelect = query('#install-agent');
if (!(agentSelect instanceof HTMLSelectElement)) throw new Error('Invalid agent selector.');
const installGuide = query('#install-guide');
if (!(installGuide instanceof HTMLAnchorElement)) throw new Error('Invalid installation guide link.');
const copyStatus = query('#copy-status');
function updateInstall() {
  const text = installText[document.documentElement.lang.startsWith('zh') ? 'zh' : 'en'];
  const root = '$HOME/.agents/skills/birdify';
  document.querySelectorAll<HTMLElement>('[data-install-label]').forEach(element => { element.textContent = Object.entries(text).find(([key]) => key === element.dataset.installLabel)?.[1] ?? ''; });
  document.querySelectorAll<HTMLButtonElement>('[data-copy]').forEach(button => {
    button.textContent = text.copy;
    button.setAttribute('aria-label', `${text.copy}: ${query('h3', required(button.parentElement)).textContent}`);
  });
  query('#install-command').textContent = 'npx skills add borg0ai/birdify --skill birdify --global --copy --yes';
  query('#check-command').textContent = `node "${root}/scripts/birdify.mjs" doctor`;
  query('#try-prompt').textContent = text.prompt;
  query('#install-path-note').textContent = text.path;
  installGuide.setAttribute('href', `https://github.com/borg0ai/birdify/blob/main/docs/installation${document.documentElement.lang.startsWith('zh') ? '.zh' : ''}.md`);
  copyStatus.textContent = '';
}
agentSelect.addEventListener('change', updateInstall);
query('#language').addEventListener('click', updateInstall);
document.querySelectorAll<HTMLButtonElement>('[data-copy]').forEach(button => button.addEventListener('click', async () => {
  const command = required(document.getElementById(required(button.dataset.copy))).textContent ?? '';
  try {
    await navigator.clipboard.writeText(command);
    copyStatus.textContent = installText[document.documentElement.lang.startsWith('zh') ? 'zh' : 'en'].copied;
  } catch {
    copyStatus.textContent = installText[document.documentElement.lang.startsWith('zh') ? 'zh' : 'en'].failed;
  }
}));
updateInstall();
