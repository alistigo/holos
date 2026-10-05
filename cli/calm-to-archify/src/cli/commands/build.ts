import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { Command, Option } from "clipanion";
import { type CalmDocument, transformCalmToArchify } from "../lib/calm-to-archify.js";

function resolveArchifyRenderBin(): string {
  const req = createRequire(import.meta.url);
  const pkgJson = req.resolve("@alistigo/archify-render/package.json");
  return path.join(path.dirname(pkgJson), "dist/cli.js");
}

export class BuildCommand extends Command {
  static override paths = [Command.Default, ["build"]];

  static override usage = Command.Usage({
    description: "Run the full CALM → archify HTML pipeline for one or more .arch.json files",
    details: `
      Reads each CALM .arch.json file, transforms it to archify JSON-IR, then
      renders a standalone interactive HTML file using the archify renderer.

      By default each output is written next to its source file.
      Use --output-dir to redirect all outputs to a specific directory.

      Pattern files (.pattern.json) are JSON Schema documents and are not
      supported — only CALM architecture instances (.arch.json) are accepted.
    `,
    examples: [
      ["Process all architecture files", "calm-to-archify build systems/*.arch.json"],
      ["Process a single file", "calm-to-archify build path/to/my.arch.json"],
      [
        "Output to a specific directory",
        "calm-to-archify build systems/*.arch.json --output-dir .archify-out",
      ],
    ],
  });

  inputFiles = Option.Rest({ required: 1, name: "files" });

  outputDir = Option.String("--output-dir,-o", {
    description: "Output directory (default: same directory as each input file)",
    required: false,
  });

  execute(): Promise<number> {
    return Promise.resolve(this.run());
  }

  // fallow-ignore-next-line complexity
  private run(): number {
    let archifyRenderBin: string;
    try {
      archifyRenderBin = resolveArchifyRenderBin();
    } catch (err) {
      this.context.stderr.write(
        `Error: could not resolve archify-render binary. Make sure @alistigo/archify-render is installed and built: ${String(err)}\n`,
      );
      return 1;
    }

    for (const file of this.inputFiles) {
      const inputPath = path.resolve(process.cwd(), file);
      if (!existsSync(inputPath)) {
        this.context.stderr.write(`Error: file not found: ${inputPath}\n`);
        return 1;
      }

      const outDir = this.outputDir
        ? path.resolve(process.cwd(), this.outputDir)
        : path.dirname(inputPath);

      let calm: CalmDocument;
      try {
        calm = JSON.parse(readFileSync(inputPath, "utf-8")) as CalmDocument;
      } catch (err) {
        this.context.stderr.write(`Error: failed to parse ${inputPath}: ${String(err)}\n`);
        return 1;
      }

      if (!calm.nodes || !calm.relationships) {
        this.context.stderr.write(
          `Error: ${inputPath} does not look like a CALM architecture instance — ` +
            "it's missing 'nodes' or 'relationships'. Pattern files (.pattern.json) are not supported.\n",
        );
        return 1;
      }

      const archifyJson = path.join(outDir, `${calm["unique-id"]}.archify.json`);
      const htmlOutputPath = path.relative(process.cwd(), archifyJson.replace(/\.json$/, ".html"));

      const archify = transformCalmToArchify(calm, htmlOutputPath);
      mkdirSync(outDir, { recursive: true });
      writeFileSync(archifyJson, JSON.stringify(archify, null, 2), "utf-8");
      this.context.stdout.write(`Transformed → ${archifyJson}\n`);

      const r = spawnSync("node", [archifyRenderBin, archifyJson], {
        stdio: "inherit",
        cwd: process.cwd(),
      });
      if (r.error) {
        this.context.stderr.write(`Error running archify-render: ${r.error.message}\n`);
        return 1;
      }
      if ((r.status ?? 1) !== 0) return r.status ?? 1;
    }
    return 0;
  }
}
