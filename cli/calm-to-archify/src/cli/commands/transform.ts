import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";
import { Command, Option } from "clipanion";
import { type CalmDocument, transformCalmToArchify } from "../lib/calm-to-archify.js";

export class TransformCommand extends Command {
  static override paths = [["transform"]];

  static override usage = Command.Usage({
    description: "Transform a CALM architecture JSON file into archify diagram JSON",
    details: `
      Reads a CALM .arch.json file and produces an archify JSON-IR file
      that can be rendered to interactive HTML using archify-render or
      'archify render architecture'.

      Pattern files (.pattern.json) are JSON Schema documents and are not
      supported — only CALM architecture instances (.arch.json) are accepted.
    `,
    examples: [
      [
        "Transform typical-alistigo-artifact.arch.json",
        "calm-to-archify systems/typical-alistigo-artifact.arch.json --output .archify-out/typical-alistigo-artifact.archify.json",
      ],
      [
        "Transform with explicit output path",
        "calm-to-archify path/to/my.arch.json --output path/to/output.archify.json",
      ],
    ],
  });

  inputFile = Option.String({ required: true, name: "input" });

  output = Option.String("--output,-o", {
    description: "Output path for the archify JSON file",
    required: true,
  });

  // fallow-ignore-next-line complexity
  async execute(): Promise<number> {
    const inputPath = resolve(process.cwd(), this.inputFile);
    const outputPath = resolve(process.cwd(), this.output);

    if (!existsSync(inputPath)) {
      this.context.stderr.write(`Error: input file not found: ${inputPath}\n`);
      return 1;
    }

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

    // archify requires meta.output to be a relative path from cwd
    const htmlOutputPath = relative(process.cwd(), outputPath.replace(/\.json$/, ".html"));

    const archify = transformCalmToArchify(calm, htmlOutputPath);

    const outputDir = dirname(outputPath);
    mkdirSync(outputDir, { recursive: true });
    writeFileSync(outputPath, JSON.stringify(archify, null, 2), "utf-8");

    this.context.stdout.write(`Transformed → ${outputPath}\n`);
    return 0;
  }
}
