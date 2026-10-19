#!/usr/bin/env node
import { createRequire } from "node:module";
import { Builtins, Cli } from "clipanion";
import { CheckCommand } from "./cli/commands/check.js";
import { GenerateCommand } from "./cli/commands/generate.js";

// Resolves to the package root from both src/ (bun) and dist/ (node).
const { version } = createRequire(import.meta.url)("../package.json") as {
  version: string;
};

const cli = new Cli({
  binaryLabel: "artifact-arch-check",
  binaryName: "artifact-arch-check",
  binaryVersion: version,
});

cli.register(CheckCommand);
cli.register(GenerateCommand);
cli.register(Builtins.HelpCommand);
cli.register(Builtins.VersionCommand);
cli.runExit(process.argv.slice(2));
