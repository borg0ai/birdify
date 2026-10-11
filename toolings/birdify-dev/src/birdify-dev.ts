import { runBuildViewer } from './commands/build-viewer.js';
import { runCheckBuild } from './commands/check-build.js';
import { runCheckDocs } from './commands/check-docs.js';
import { runCheckInstall } from './commands/check-install.js';
import { runExportSchemas } from './commands/export-schemas.js';
import { runValidateSkill } from './commands/validate-skill.js';

const COMMAND_BUILD_VIEWER = 'build-viewer';

const HELP = `Usage: birdify-dev <command> [arguments]

Commands:
  build-viewer [--check]
    Compile templates/viewer into birdify/assets. --check fails when those assets are stale.
  check-build
    Verify Core build output, generated skill artifacts and exported schemas.
  check-docs [--update]
    Verify paired Markdown, local links and config/i18n.json; --update refreshes hashes.
  check-install
    Verify the skill payload and packed CLI in isolated temporary directories.
  validate-skill [directory]
    Validate Birdify release package boundary and metadata.
  export-schemas [--check]
    Export Core runtime schemas to birdify/schemas; --check verifies generated files.

Requires Node.js 22 or newer. This development CLI stays in the repository and is not published.`;

try {
  const args = process.argv.slice(2);
  const command = args.shift();
  if (!command || command === 'help' || command === '--help' || command === '-h') {
    console.log(HELP);
  } else if (command === COMMAND_BUILD_VIEWER) {
    await runBuildViewer(args);
  } else if (command === 'check-build') {
    await runCheckBuild(args);
  } else if (command === 'check-docs') {
    runCheckDocs(args);
  } else if (command === 'check-install') {
    runCheckInstall(args);
  } else if (command === 'validate-skill') {
    runValidateSkill(args);
  } else if (command === 'export-schemas') {
    await runExportSchemas(args);
  } else {
    throw new Error(HELP);
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
