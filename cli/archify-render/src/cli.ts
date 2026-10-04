#!/usr/bin/env node
import { Cli } from "clipanion";
import { RenderCommand } from "./cli/commands/render.js";

const cli = new Cli({
  binaryLabel: "archify-render",
  binaryName: "archify-render",
  binaryVersion: "0.1.0",
});

cli.register(RenderCommand);
cli.runExit(process.argv.slice(2));
