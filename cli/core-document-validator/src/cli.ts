#!/usr/bin/env bun
import { Cli } from "clipanion";
import { ValidateCommand } from "./cli/commands/validate.js";
import { ValidateSchemaCommand } from "./cli/commands/validate-schema.js";

const cli = new Cli({
  binaryLabel: "alistigo-document-validator",
  binaryName: "bun src/cli.ts",
  binaryVersion: "0.1.0",
});

cli.register(ValidateCommand);
cli.register(ValidateSchemaCommand);
cli.runExit(process.argv.slice(2));
