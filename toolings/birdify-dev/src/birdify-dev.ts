import { runBuildViewer } from './commands/build-viewer.js';

const COMMAND_BUILD_VIEWER = 'build-viewer';

const HELP = `Usage: birdify-dev <command> [arguments]

Commands:
  build-viewer [--check]
    Compile templates/viewer into birdify/assets. --check fails when those assets are stale.

Requires Node.js 22 or newer. This development CLI stays in the repository and is not published.`;

try {
  const args = process.argv.slice(2);
  const command = args.shift();
  if (!command || command === 'help' || command === '--help' || command === '-h') {
    console.log(HELP);
  } else if (command === COMMAND_BUILD_VIEWER) {
    await runBuildViewer(args);
  } else {
    throw new Error(HELP);
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
