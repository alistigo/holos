import { createRequire } from "node:module";
import { Builtins, Cli } from "clipanion";
import { DoctorCommand } from "./commands/doctor.js";
import { RunCommand } from "./commands/run.js";

const { version } = createRequire(import.meta.url)("../package.json") as { version: string };

/**
 * Builds and runs the CLI. Kept out of `cli.ts` on purpose: importing the commands
 * pulls in playwright, which reads PLAYWRIGHT_BROWSERS_PATH once at import time, so
 * the entrypoint has to settle the environment before this module is loaded.
 */
export async function main(argv: string[]): Promise<void> {
  const cli = new Cli({
    binaryLabel: "artifact-features-runner-playwright",
    binaryName: "artifact-features-runner-playwright",
    binaryVersion: version,
  });

  cli.register(RunCommand);
  cli.register(DoctorCommand);
  cli.register(Builtins.HelpCommand);
  cli.register(Builtins.VersionCommand);
  await cli.runExit(argv);
}
