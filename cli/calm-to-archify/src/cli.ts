#!/usr/bin/env node
import { Cli } from "clipanion";
import { BuildCommand } from "./cli/commands/build.js";
import { TransformCommand } from "./cli/commands/transform.js";
import { WatchCommand } from "./cli/commands/watch.js";

const cli = new Cli({
  binaryLabel: "calm-to-archify",
  binaryName: "calm-to-archify",
  binaryVersion: "0.1.0",
});

cli.register(BuildCommand);
cli.register(TransformCommand);
cli.register(WatchCommand);
cli.runExit(process.argv.slice(2));
