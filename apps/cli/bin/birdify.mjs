#!/usr/bin/env node
// 稳定入口。pnpm 在 install 时链接它；Vite 产物 dist 在之后的 build 才出现。
import '../dist/birdify.mjs';
