#!/usr/bin/env node
import { createRequire } from "node:module";
import { Builtins, Cli } from "clipanion";
import { CheckCommand } from "./cli/commands/check.js";
import { DeprecateCommand } from "./cli/commands/deprecate.js";
import { DoctorCommand } from "./cli/commands/doctor.js";
import { HelpCommand } from "./cli/commands/help.js";
import { ListCommand } from "./cli/commands/list.js";

// Resolves to the package root from both src/ (bun) and dist/ (node).
const { version } = createRequire(import.meta.url)("../package.json") as { version: string };

const cli = new Cli({
  binaryLabel: "nx-npm-publications",
  binaryName: "nx-npm-publications",
  binaryVersion: version,
});

cli.register(CheckCommand);
cli.register(DeprecateCommand);
cli.register(DoctorCommand);
cli.register(ListCommand);
cli.register(HelpCommand);
cli.register(Builtins.VersionCommand);
cli.runExit(process.argv.slice(2));
