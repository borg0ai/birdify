import { runCompileRules, runDiscover, runFreshness, runRenderConstraints } from './commands/constraints.js';
import { runProjectCommand } from './commands/project.js';
import { runRender } from './commands/render.js';
import { runValidate } from './commands/validate.js';

const HELP = `Usage: birdify <command> [arguments]

Commands:
  doctor
  mode [auto|on-demand|off] [--project <root>]
  setup [--project <root>]
  uninstall [--project <root>]
  validate architecture.json [activity.jsonl] [--bilingual] [--authoring]
  render architecture.json architecture.html [activity.jsonl] [--simulation] [--repo <root>] [--constraints reviewed.json]
  discover repository catalog.json [project-name]
  render-constraints catalog.json constraints.html [--sources]
  compile-rules catalog.json reviewed-rules.json output.json [repository]
  freshness architecture.json repository-root

Requires Node.js 22 or newer. npx --yes @borg0ai/birdify <command> downloads this package when it is not installed.`;

try {
  const args = process.argv.slice(2);
  const command = args.shift();
  if (!command || command === 'help' || command === '--help') {
    console.log(HELP);
  } else if (command === 'validate') {
    runValidate(args);
  } else if (command === 'render') {
    runRender(args);
  } else if (command === 'discover') {
    runDiscover(args);
  } else if (command === 'render-constraints') {
    runRenderConstraints(args);
  } else if (command === 'compile-rules') {
    runCompileRules(args);
  } else if (command === 'freshness') {
    runFreshness(args);
  } else if (['doctor', 'mode', 'setup', 'uninstall'].includes(command)) {
    runProjectCommand(command, args);
  } else {
    throw new Error(HELP);
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
