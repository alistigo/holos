#!/usr/bin/env node
import { Cli } from "clipanion";
import { CheckCommand } from "./cli/commands/check.js";
import { DeprecateCommand } from "./cli/commands/deprecate.js";

const cli = new Cli({
  binaryLabel: "npm-housekeeping",
  binaryName: "npm-housekeeping",
  binaryVersion: "0.1.0",
});

cli.register(CheckCommand);
cli.register(DeprecateCommand);
cli.runExit(process.argv.slice(2));
