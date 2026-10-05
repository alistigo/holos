#!/usr/bin/env node
import { Cli } from "clipanion";
import { PipelineCommand } from "./cli/commands/pipeline.js";

const cli = new Cli({
  binaryLabel: "calm-archify",
  binaryName: "calm-archify",
  binaryVersion: "0.1.0",
});

cli.register(PipelineCommand);
cli.runExit(process.argv.slice(2));
