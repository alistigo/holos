#!/usr/bin/env bun
import { Cli } from "clipanion";
import { ValidateTriggersCommand } from "./cli/commands/validate-triggers.js";

const cli = new Cli({
  binaryLabel: "agent-skill-tester",
  binaryName: "bun src/cli.ts",
  binaryVersion: "0.1.0",
});

cli.register(ValidateTriggersCommand);
cli.runExit(process.argv.slice(2));
