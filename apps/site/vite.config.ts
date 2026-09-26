import { copyFileSync } from 'node:fs';
import { defineConfig, type Plugin } from 'vite';
import vue from '@vitejs/plugin-vue';

const REPO_SLUG = 'birdify';
const GITHUB_PAGES = 'true';

// 本地开发用根路径。GitHub Pages 项目站挂在 /birdify/ 下。
function resolveSiteBase(): string {
  if (process.env.VITE_BASE) return process.env.VITE_BASE;
  if (process.env.GITHUB_PAGES === GITHUB_PAGES && process.env.CUSTOM_DOMAIN !== GITHUB_PAGES) return `/${REPO_SLUG}/`;
  return '/';
}

// Pages 用 404.html 接住 History API，不能靠跳转脚本改路径。
function copy404(): Plugin {
  return {
    name: 'copy-404',
    apply: 'build',
    closeBundle() {
      if (process.env.GITHUB_PAGES !== GITHUB_PAGES) return;
      copyFileSync('dist/index.html', 'dist/404.html');
    },
  };
}

export default defineConfig({
  base: resolveSiteBase(),
  plugins: [vue(), copy404()],
});
