import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, type Plugin } from 'vitest/config';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const CORE_SOURCE = 'packages/core/src/';
const UNIT_PROJECT = 'unit';
const BROWSER_PROJECT = 'browser';
const UNIT_TIMEOUT_MS = 60_000;
const BROWSER_TIMEOUT_MS = 120_000;

// 测试 import 写的是 core 源码路径，运行时改为已编译的 dist，这样 import.meta.url 仍指向真实产物。
function distributedCore(): Plugin {
  return {
    name: 'distributed-core',
    enforce: 'pre',
    resolveId(source) {
      const normalized = source.replaceAll('\\', '/');
      const index = normalized.lastIndexOf(CORE_SOURCE);
      if (index < 0 || !normalized.endsWith('.js')) return null;
      const compiled = path.join(ROOT, 'packages/core/dist', normalized.slice(index + CORE_SOURCE.length));
      return { id: compiled, external: true };
    },
  };
}

export default defineConfig({
  root: ROOT,
  plugins: [distributedCore()],
  test: {
    restoreMocks: true,
    projects: [
      {
        plugins: [distributedCore()],
        test: {
          name: UNIT_PROJECT,
          environment: 'node',
          include: ['test/unit/**/*.test.ts'],
          restoreMocks: true,
          testTimeout: UNIT_TIMEOUT_MS,
          hookTimeout: UNIT_TIMEOUT_MS,
        },
      },
      {
        plugins: [distributedCore()],
        test: {
          name: BROWSER_PROJECT,
          environment: 'node',
          include: ['test/e2e/**/*.browser.ts', 'test/e2e/**/*.test.ts'],
          restoreMocks: true,
          testTimeout: BROWSER_TIMEOUT_MS,
          hookTimeout: BROWSER_TIMEOUT_MS,
        },
      },
    ],
  },
});
