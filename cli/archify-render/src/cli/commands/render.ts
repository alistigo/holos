import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { Command, Option } from "clipanion";

function resolveArchifyBin(): string {
  const req = createRequire(import.meta.url);
  // The archify GitHub repo is a monorepo; the actual tool package lives in archify/archify/
  const subpkgJson = req.resolve("archify/archify/package.json");
  const subpkgDir = path.dirname(subpkgJson);
  return path.join(subpkgDir, "bin", "archify.mjs");
}

export class RenderCommand extends Command {
  static override paths = [Command.Default, ["render"]];

  static override usage = Command.Usage({
    description: "Render an archify JSON file to a standalone interactive HTML file",
    details: `
      Invokes the archify CLI to render the given JSON-IR file into a
      self-contained HTML file. The output path is read from the 'meta.output'
      field inside the JSON, or you can override it with --output.

      The diagram type defaults to 'architecture'. Override with --type if
      rendering a different diagram type (workflow, sequence, dataflow, lifecycle).
    `,
    examples: [
      [
        "Render an architecture diagram",
        "archify-render .archify-out/typical-alistigo-artifact.archify.json",
      ],
      ["Render with explicit output path", "archify-render diagram.json --output my-diagram.html"],
      ["Render a workflow diagram", "archify-render flow.json --type workflow"],
    ],
  });

  inputFile = Option.String({ required: true, name: "input" });

  output = Option.String("--output,-o", {
    description: "Override the output HTML path (default: reads meta.output from JSON)",
    required: false,
  });

  type = Option.String("--type,-t", "architecture", {
    description: "Diagram type: architecture, workflow, sequence, dataflow, lifecycle",
  });

  async execute(): Promise<number> {
    const inputPath = path.resolve(process.cwd(), this.inputFile);

    if (!existsSync(inputPath)) {
      this.context.stderr.write(`Error: input file not found: ${inputPath}\n`);
      return 1;
    }

    let archifyBin: string;
    try {
      archifyBin = resolveArchifyBin();
    } catch (err) {
      this.context.stderr.write(
        `Error: could not resolve archify binary. ` +
          `Make sure 'archify' (github:tt-a1i/archify) is installed in the workspace: ${String(err)}\n`,
      );
      return 1;
    }

    if (!existsSync(archifyBin)) {
      this.context.stderr.write(`Error: archify binary not found at ${archifyBin}\n`);
      return 1;
    }

    const args = ["render", this.type, inputPath];
    if (this.output) {
      args.push(path.resolve(process.cwd(), this.output));
    } else {
      // Read meta.output from JSON to inform the user where the output goes
      try {
        const json = JSON.parse(readFileSync(inputPath, "utf-8")) as {
          meta?: { output?: string };
        };
        const outputPath = json.meta?.output;
        if (outputPath) {
          this.context.stdout.write(`Rendering → ${outputPath}\n`);
        }
      } catch {
        // ignore parse errors, archify will handle them
      }
    }

    const result = spawnSync("node", [archifyBin, ...args], {
      stdio: "inherit",
      cwd: process.cwd(),
    });

    if (result.error) {
      this.context.stderr.write(`Error running archify: ${result.error.message}\n`);
      return 1;
    }

    return result.status ?? 0;
  }
}
