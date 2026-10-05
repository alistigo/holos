#!/usr/bin/env node
import { Cli } from "clipanion";
import { BuildCommand } from "./cli/commands/build.js";
import { TransformCommand } from "./cli/commands/transform.js";

const cli = new Cli({
  binaryLabel: "calm-to-archify",
  binaryName: "calm-to-archify",
  binaryVersion: "0.1.0",
});

cli.register(BuildCommand);
cli.register(TransformCommand);
cli.runExit(process.argv.slice(2));
