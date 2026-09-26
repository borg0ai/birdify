import fs from 'node:fs';
import path from 'node:path';
import { defineConfig, type Plugin } from 'vite';

const SHEBANG = '#!/usr/bin/env node';
const ENTRY = 'src/birdify.ts';
const OUT_FILE = 'birdify.mjs';
// 工作区包和第三方运行时都不打进 CLI。TypeBox / Ajv 由 npm 安装。
const EXTERNAL = ['@birdify/core', '@sinclair/typebox', 'ajv'];
const NODE_TARGET = 'node22';

function resolveTsSpecifier(): Plugin {
  return {
    name: 'resolve-ts-specifier',
    resolveId(source, importer) {
      if (!importer || !source.startsWith('.') || !source.endsWith('.js')) return null;
      const file = path.resolve(path.dirname(importer), source.replace(/\.js$/, '.ts'));
      return fs.existsSync(file) ? file : null;
    },
  };
}

function shebang(): Plugin {
  return {
    name: 'cli-shebang',
    generateBundle(_options, bundle) {
      for (const item of Object.values(bundle)) {
        if (item.type === 'chunk' && item.isEntry && !item.code.startsWith('#!')) item.code = `${SHEBANG}\n${item.code}`;
      }
    },
    closeBundle() {
      fs.chmodSync(path.resolve('dist', OUT_FILE), 0o755);
    },
  };
}

export default defineConfig({
  plugins: [resolveTsSpecifier(), shebang()],
  ssr: { external: EXTERNAL },
  build: {
    ssr: ENTRY,
    outDir: 'dist',
    emptyOutDir: true,
    target: NODE_TARGET,
    minify: false,
    sourcemap: false,
    rollupOptions: {
      external: EXTERNAL,
      output: { format: 'es', entryFileNames: OUT_FILE },
    },
  },
});
