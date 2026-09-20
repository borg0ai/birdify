#!/usr/bin/env node
// Source: src/birdify.mts. Regenerate scripts/birdify.mjs with pnpm run build.
import fs from 'node:fs';
import path from 'node:path';
const start = '<!-- birdify:mode:start -->';
const end = '<!-- birdify:mode:end -->';
try {
    const args = process.argv.slice(2);
    const command = args.shift();
    if (command === 'doctor') {
        if (args.length)
            throw new Error('Usage: birdify doctor');
        const { renderArchitecture } = await import('./render.mjs');
        const map = JSON.parse(fs.readFileSync(new URL('../examples/architecture.json', import.meta.url), 'utf8'));
        const html = renderArchitecture(map);
        if (!html.includes('<html'))
            throw new Error('Renderer did not produce HTML.');
        console.log('OK: example validation, renderer dependencies and template assets. Agent activation must be checked in a new task.');
    }
    else {
        const usage = 'Usage: birdify mode [auto|on-demand|off] | setup | uninstall [--project <root>]';
        if (!command || !['mode', 'setup', 'uninstall'].includes(command))
            throw new Error(usage + '\n       birdify doctor');
        let mode;
        if (command === 'mode' && args[0] && !args[0].startsWith('--'))
            mode = args.shift();
        let root = process.cwd();
        const seen = new Set();
        while (args.length) {
            const flag = args.shift();
            const value = args.shift();
            if (!flag || flag !== '--project' || !value || value.startsWith('--') || seen.has(flag))
                throw new Error(usage);
            seen.add(flag);
            root = path.resolve(value);
        }
        if (mode && !['auto', 'on-demand', 'off'].includes(mode))
            throw new Error(usage);
        if (!fs.statSync(root).isDirectory())
            throw new Error('Project root must be a directory.');
        const filename = 'AGENTS.md';
        const file = path.join(root, filename);
        let info;
        try {
            info = fs.lstatSync(file);
        }
        catch (error) {
            if (!(error instanceof Error) || !('code' in error) || error.code !== 'ENOENT')
                throw error;
        }
        if (info && !info.isFile())
            throw new Error(`${filename} must be a regular file, not a link or directory.`);
        const original = info ? fs.readFileSync(file, 'utf8') : '';
        const starts = original.split(start).length - 1;
        const ends = original.split(end).length - 1;
        const from = original.indexOf(start);
        const to = original.indexOf(end);
        if (starts !== ends || starts > 1 || (starts && to < from))
            throw new Error(`Malformed or duplicate Birdify block; ${filename} was not changed.`);
        const existing = starts ? original.slice(from, to + end.length) : '';
        const current = existing.match(/^Birdify mode: (auto|on-demand|off)\r?$/m)?.[1];
        if (existing && !current)
            throw new Error(`Unrecognized Birdify mode block; ${filename} was not changed.`);
        if (command === 'setup')
            mode = current || 'on-demand';
        if (command === 'uninstall') {
            if (existing)
                fs.writeFileSync(file, original.slice(0, from) + original.slice(to + end.length), 'utf8');
            console.log(`Project rules: removed\n${file}\nInstalled skill files and project artifacts were not removed. Without a project block, an installed skill uses its default mode.`);
            process.exit(0);
        }
        if (!mode) {
            const foundation = existing.includes('Birdify foundation: on') ? 'on' : 'not installed';
            console.log(`${current || 'on-demand'}${current ? '' : ' (default; no project block)'}\n${file}\nFoundation: ${current === 'off' ? 'off' : foundation}\nStatus covers this file only; inherited instructions may differ.`);
        }
        else {
            const eol = original.includes('\r\n') ? '\r\n' : '\n';
            const trigger = mode === 'auto'
                ? 'Use the Birdify skill before every code-changing task, including small edits, and for planning that explicitly analyzes affected modules. Enter the workflow once per task; update activity before each edit group, not each line.'
                : 'Use the Birdify skill only when the user explicitly invokes it through the host skill selector, names Birdify, or asks to see an architecture/change map before editing (for example: 改前先看图). Ordinary coding or feature-planning requests do not activate Birdify.';
            const foundation = fs.readFileSync(new URL('../references/foundation.txt', import.meta.url), 'utf8').trim().split(/\r?\n/);
            const block = mode === 'off' ? [start, 'Birdify mode: off', 'Birdify foundation: off',
                'Do not activate Birdify or apply its foundation rules for this project unless the user explicitly requests it for the current task. Preserve other project instructions.', end].join(eol)
                : [start, `Birdify mode: ${mode}`, 'Birdify foundation: on', ...foundation, trigger,
                    'When active, first inspect existing project maps and report the reusable path or checked locations and why a new map is needed. Follow the skill to validate/reuse the map, preview it, and declare affected modules before editing.',
                    'After displaying the map and concrete change plan, wait for user confirmation before implementation. Preparing map and plan artifacts is allowed beforehand. Reuse confirmation of the same displayed plan; confirm material scope changes. Auto mode is not approval. Honor an explicit task-specific waiver.',
                    'Planning alone does not authorize code edits or fabricated activity. A one-task request overrides this mode for that task without changing this block. If the skill is unavailable, report it rather than claim its workflow ran.',
                    'This is agent guidance, not a filesystem write interceptor. Preserve all instructions outside this managed block.', end].join(eol);
            const updated = existing ? original.slice(0, from) + block + original.slice(to + end.length)
                : original + (original && !original.endsWith('\n') ? eol : '') + (original ? eol : '') + block + eol;
            if (updated !== original)
                fs.writeFileSync(file, updated, 'utf8');
            console.log(`${mode}\n${file}${updated === original ? '\nUnchanged.' : '\nUpdated managed block.'}`);
        }
    }
}
catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
}
