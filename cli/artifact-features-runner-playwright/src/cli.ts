#!/usr/bin/env node
import { createRequire } from "node:module";
import { Builtins, Cli } from "clipanion";
import { RunCommand } from "./commands/run.js";

const { version } = createRequire(import.meta.url)("../package.json") as { version: string };

const cli = new Cli({
  binaryLabel: "artifact-features-runner-playwright",
  binaryName: "artifact-features-runner-playwright",
  binaryVersion: version,
});

cli.register(RunCommand);
cli.register(Builtins.HelpCommand);
cli.register(Builtins.VersionCommand);
cli.runExit(process.argv.slice(2));
