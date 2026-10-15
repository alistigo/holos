import { existsSync, watch } from "node:fs";
import path from "node:path";
import { Command, Option } from "clipanion";

export class WatchCommand extends Command {
  static override paths = [["watch"]];

  static override usage = Command.Usage({
    description: "Watch .arch.calm.json files and rebuild on change.",
    details: `
      Runs an initial build of all specified files, then watches their parent
      directories for changes. Any .arch.calm.json file that is modified triggers
      a single-file rebuild via the build command.

      Intended for development — keeps running until interrupted (Ctrl+C).
    `,
    examples: [["Watch all architecture files", "calm-to-archify watch systems/*.arch.calm.json"]],
  });

  inputFiles = Option.Rest({ required: 1, name: "files" });

  outputDir = Option.String("--output-dir,-o", {
    description: "Output directory (default: same directory as each input file)",
    required: false,
  });

  async execute(): Promise<number> {
    // Initial build
    const buildArgs = ["build", ...this.inputFiles];
    if (this.outputDir) buildArgs.push("--output-dir", this.outputDir);
    const initialResult = await this.cli.run(buildArgs);
    if (initialResult !== 0) {
      this.context.stderr.write("Initial build failed — watching anyway.\n");
    }

    this.context.stdout.write("Watching for changes… (Ctrl+C to stop)\n");

    // Unique parent directories of all input files
    const dirs = new Set(this.inputFiles.map((f) => path.dirname(path.resolve(f))));

    for (const dir of dirs) {
      watch(dir, (_, filename) => {
        if (!filename?.endsWith(".arch.calm.json")) return;
        const filePath = path.join(dir, filename);
        if (!existsSync(filePath)) return;
        this.context.stdout.write(`[watch] ${filename} changed, rebuilding…\n`);
        const args: string[] = ["build", filePath];
        if (this.outputDir) args.push("--output-dir", this.outputDir);
        void this.cli.run(args);
      });
    }

    await new Promise<void>(() => {}); // keep alive until Ctrl+C
    return 0;
  }
}
