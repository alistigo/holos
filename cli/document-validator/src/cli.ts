#!/usr/bin/env bun
import { Cli } from "clipanion";
import { ValidateCommand } from "./cli/commands/validate.js";

const cli = new Cli({
  binaryLabel: "alistigo-document-validator",
  binaryName: "bun src/cli.ts",
  binaryVersion: "0.1.0",
});

cli.register(ValidateCommand);
cli.runExit(process.argv.slice(2));
