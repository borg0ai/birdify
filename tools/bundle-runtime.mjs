import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';
const args = new Map();
for (let index = 0; index < process.argv.length; index += 1) {
    const value = process.argv[index];
    if (value?.startsWith('--'))
        args.set(value, process.argv[index + 1] ?? '');
}
const from = path.resolve(args.get('--from') ?? 'birdify/scripts');
const to = path.resolve(args.get('--to') ?? from);
const repositoryRoot = path.resolve(fileURLToPath(new URL('../', import.meta.url)));
const entries = ['contracts/models.mjs', 'contracts/parse.mjs'];
const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'birdify-bundle-'));
try {
    for (const relative of entries) {
        const source = path.join(from, relative);
        if (!fs.existsSync(source))
            continue;
        const output = path.join(temporary, relative);
        fs.mkdirSync(path.dirname(output), { recursive: true });
        await build({
            bundle: true,
            entryPoints: [source],
            format: 'esm',
            outfile: output,
            platform: 'node',
            nodePaths: [path.join(repositoryRoot, 'node_modules')],
            sourcemap: false,
            legalComments: 'none',
        });
        const destination = path.join(to, relative);
        fs.mkdirSync(path.dirname(destination), { recursive: true });
        const content = fs.readFileSync(output, 'utf8')
            .replace(/^\/\/.*\r?\n/gm, '')
            .replace(/(["'])[^"'\n]*node_modules\//g, '$1node_modules/');
        fs.writeFileSync(destination, content);
    }
}
finally {
    fs.rmSync(temporary, { recursive: true, force: true });
}
