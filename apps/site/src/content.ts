export const INSTALL_COMMAND = 'npx skills add borg0ai/birdify --skill birdify --global --copy --yes';
export const CHECK_COMMAND = 'npx --yes @borg0ai/birdify doctor';
export const GITHUB_URL = 'https://github.com/borg0ai/birdify';
export const DEMO_URL = 'https://github.com/borg0ai/birdify/blob/main/birdify/examples/harness-activity.html';
export const FEEDBACK_URL = 'https://github.com/borg0ai/birdify/issues/new?template=usage_feedback.yml';
export const LICENSE_URL = 'https://github.com/borg0ai/birdify/blob/main/LICENSE';
export const TITLE_EN = 'Birdify — Change the coding flow';
export const TITLE_ZH = 'Birdify — 推翻默认编码流程';

export const TOPICS = [
  'agent-tools',
  'architecture-as-code',
  'code-visualization',
  'coding-agents',
  'developer-tools',
  'software-architecture',
  'diagram-as-code',
  'ai-workflow',
] as const;

const INSTALL_GUIDE_EN = 'https://github.com/borg0ai/birdify/blob/main/docs/installation.md';
const INSTALL_GUIDE_ZH = 'https://github.com/borg0ai/birdify/blob/main/docs/installation.zh.md';

export type Locale = 'en' | 'zh';

export type SiteCopy = {
  navLanguage: string;
  title: string;
  eyebrow: string;
  headlineBefore: string;
  headlineEm: string;
  ledeBefore: string;
  ledeAfter: string;
  cta: string;
  demo: string;
  previewEyebrow: string;
  previewTitle: string;
  features: Array<{ title: string; body: string }>;
  installTitle: string;
  intro: string;
  agent: string;
  requirements: string;
  step1: string;
  step2: string;
  step3: string;
  prompt: string;
  path: string;
  limits: string;
  guide: string;
  guideHref: string;
  copy: string;
  copied: string;
  failed: string;
  communityEyebrow: string;
  communityTitle: string;
  communityBody: string;
  communityNumber: string;
  communityFeedback: string;
  closingEyebrow: string;
  closingTitle: string;
  closingBody: string;
  closingCta: string;
  artCaptionBefore: string;
  artCaptionStrong: string;
};

const EN: SiteCopy = {
  navLanguage: '中文',
  title: TITLE_EN,
  eyebrow: 'ARCHITECTURE FIRST · AGENT READY',
  headlineBefore: 'Stop letting AI code blind. ',
  headlineEm: 'Change the flow.',
  ledeBefore: 'The last advantage of coding by hand was architectural awareness—Birdify has eliminated that reason entirely.',
  ledeAfter: 'The future of programming comes down to just two things: constraints and architecture.',
  cta: 'Install Skill',
  demo: 'Open the demo →',
  previewEyebrow: 'A CALMER CODE REVIEW',
  previewTitle: 'One view for structure, scope, and evidence.',
  features: [
    { title: 'Architecture context', body: 'Stable module identities, ownership, relationships, and source evidence stay visible together.' },
    { title: 'Change scope', body: 'Planned modules light up while the surrounding system fades into context.' },
    { title: 'Verifiable output', body: 'Validate JSON and render a self-contained HTML snapshot with no server required.' },
  ],
  installTitle: 'Install Birdify',
  intro: 'Run these commands in PowerShell or a macOS/Linux shell.',
  agent: 'Any supported agent',
  requirements: 'Requires Node.js 22+; the skill and the birdify CLI install separately.',
  step1: 'Install the skill',
  step2: 'Check the runtime',
  step3: 'Try it in a new agent task',
  prompt: "Use Birdify to show this project's architecture; do not edit code.",
  path: 'If the installer reports a different destination, use that path in step 2. Keep the full skill directory and avoid duplicate installations.',
  limits: 'Doctor checks installation, not activation. Invoke Birdify through your agent skill selector or explicitly in chat. On-demand is the default; mode auto enables automatic activation.',
  guide: 'Full installation and mode guide →',
  guideHref: INSTALL_GUIDE_EN,
  copy: 'Copy',
  copied: 'Copied.',
  failed: 'Could not copy. Select the command and copy it manually.',
  communityEyebrow: 'COMMUNITY · FEEDBACK',
  communityTitle: 'Meet other Birdify users.',
  communityBody: 'Get installation help, discuss inaccurate maps, and explore Architecture-first Coding together.',
  communityNumber: 'QQ group: 627760389',
  communityFeedback: 'Share feedback on GitHub →',
  closingEyebrow: 'OPEN SOURCE · MIT LICENSE',
  closingTitle: 'Give every AI change a map.',
  closingBody: 'Built for teams that want faster reviews without losing the shape of the system.',
  closingCta: 'View on GitHub ↗',
  artCaptionBefore: 'Map first.',
  artCaptionStrong: 'Move with confidence.',
};

const ZH: SiteCopy = {
  navLanguage: 'English',
  title: TITLE_ZH,
  eyebrow: '架构优先 · 为 Agent 准备',
  headlineBefore: '别再让 AI 闭着眼睛写代码。',
  headlineEm: '推翻默认流程。',
  ledeBefore: '古法编程最后的优势是感知架构——Birdify 彻底终结了这个理由。',
  ledeAfter: '编程的未来只剩两件事：约束与架构。',
  cta: '安装技能',
  demo: '打开演示 →',
  previewEyebrow: 'A CALMER CODE REVIEW',
  previewTitle: 'One view for structure, scope, and evidence.',
  features: EN.features,
  installTitle: '安装 Birdify',
  intro: '在 PowerShell 或 macOS/Linux 终端运行以下命令。',
  agent: '支持的 Agent',
  requirements: '需要 Node.js 22+ 和网络。技能与 birdify CLI 分开安装。',
  step1: '安装技能',
  step2: '检查运行时',
  step3: '在 Agent 的新任务中试用',
  prompt: '用 Birdify 展示这个项目的架构，不修改代码。',
  path: '如果安装器输出了不同目录，请在第 2 步使用实际路径。保留完整技能目录，避免重复安装。',
  limits: 'Doctor 检查安装，不验证触发。请通过 Agent 的技能选择器或聊天中的明确请求调用 Birdify。默认按需，mode auto 可开启自动触发。',
  guide: '完整安装与模式指南 →',
  guideHref: INSTALL_GUIDE_ZH,
  copy: '复制',
  copied: '已复制。',
  failed: '复制失败，请选中命令手动复制。',
  communityEyebrow: '用户社区 · 使用反馈',
  communityTitle: '加入 Birdify 用户交流群',
  communityBody: '交流安装问题、反馈不准确的架构图，一起探索 Architecture-first Coding。',
  communityNumber: 'QQ 群：627760389',
  communityFeedback: '在 GitHub 分享使用反馈 →',
  closingEyebrow: 'OPEN SOURCE · MIT LICENSE',
  closingTitle: 'Give every AI change a map.',
  closingBody: 'Built for teams that want faster reviews without losing the shape of the system.',
  closingCta: 'View on GitHub ↗',
  artCaptionBefore: 'Map first.',
  artCaptionStrong: 'Move with confidence.',
};

export const COPY: Record<Locale, SiteCopy> = { en: EN, zh: ZH };
