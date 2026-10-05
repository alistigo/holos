import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { Command, Option } from "clipanion";

function resolveBin(pkgName: string, binRelPath: string): string {
  const req = createRequire(import.meta.url);
  const pkgJson = req.resolve(`${pkgName}/package.json`);
  return path.join(path.dirname(pkgJson), binRelPath);
}

export class PipelineCommand extends Command {
  static override paths = [Command.Default, ["run"]];

  static override usage = Command.Usage({
    description: "Run the CALM → archify HTML pipeline for one or more .arch.json files",
    details: `
      Reads each CALM .arch.json file, generates archify JSON-IR, then renders
      a standalone interactive HTML file using the archify renderer.

      By default each output is written next to its source file.
      Use --output-dir to redirect all outputs to a specific directory.

      Pattern files (.pattern.json) are JSON Schema documents and are not
      supported — only CALM architecture instances (.arch.json) are accepted.
    `,
    examples: [
      ["Process all architecture files", "calm-archify systems/*.arch.json"],
      ["Process a single file", "calm-archify path/to/my.arch.json"],
      [
        "Output to a specific directory",
        "calm-archify systems/*.arch.json --output-dir .archify-out",
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
    let calmToArchifyBin: string;
    let archifyRenderBin: string;
    try {
      calmToArchifyBin = resolveBin("@alistigo/calm-to-archify", "dist/cli.js");
      archifyRenderBin = resolveBin("@alistigo/archify-render", "dist/cli.js");
    } catch (err) {
      this.context.stderr.write(
        `Error: could not resolve CLI binaries. Make sure @alistigo/calm-to-archify and @alistigo/archify-render are installed and built: ${String(err)}\n`,
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

      let id: string;
      try {
        const calm = JSON.parse(readFileSync(inputPath, "utf-8")) as { "unique-id": string };
        id = calm["unique-id"];
      } catch (err) {
        this.context.stderr.write(`Error: failed to parse ${inputPath}: ${String(err)}\n`);
        return 1;
      }

      const archifyJson = path.join(outDir, `${id}.archify.json`);

      const r1 = spawnSync("node", [calmToArchifyBin, file, "--output", archifyJson], {
        stdio: "inherit",
        cwd: process.cwd(),
      });
      if (r1.error) {
        this.context.stderr.write(`Error running calm-to-archify: ${r1.error.message}\n`);
        return 1;
      }
      if ((r1.status ?? 1) !== 0) return r1.status ?? 1;

      const r2 = spawnSync("node", [archifyRenderBin, archifyJson], {
        stdio: "inherit",
        cwd: process.cwd(),
      });
      if (r2.error) {
        this.context.stderr.write(`Error running archify-render: ${r2.error.message}\n`);
        return 1;
      }
      if ((r2.status ?? 1) !== 0) return r2.status ?? 1;
    }
    return 0;
  }
}
