import { resolve } from "node:path";
import { Command, Option } from "clipanion";
import { render } from "ink";
import React from "react";
import { readCalmFile } from "../../calm/reader.js";
import { ALL_CHECKS, runChecks } from "../../checks/registry.js";
import type { CheckContext } from "../../checks/types.js";
import { CheckReport } from "../../ui/CheckReport.js";

export class CheckCommand extends Command {
  static override paths = [["check"]];

  static override usage = Command.Usage({
    description: "Validate artifact packages against a CALM architecture file",
    details: `
      Reads the CALM architecture file for the given artifact and runs a series
      of structural checks against the workspace packages:

        module-existence   — verify all CALM-declared packages exist
        boundaries         — verify package dependencies respect CALM relationships
        package-conformance — verify package.json has all required fields
        alistigo-metadata  — verify the "alistigo.type" metadata field is present

      Available check IDs: ${ALL_CHECKS.map((c) => c.id).join(", ")}

      Exit code 0 if all checks pass, 1 if any fail.
    `,
    examples: [
      ["Check all checks for the list artifact", "artifact-arch-check check list"],
      [
        "Run specific checks only",
        "artifact-arch-check check list --only module-existence,boundaries",
      ],
      [
        "Override CALM file path",
        "artifact-arch-check check list --arch packages/architecture/systems/list-artifact.arch.calm.json",
      ],
      ["Machine-readable JSON output (for CI scripts)", "artifact-arch-check check list --json"],
    ],
  });

  artifactName = Option.String({ required: true, name: "artifact-name" });

  arch = Option.String("--arch", {
    required: false,
    description:
      "Path to the CALM architecture file. Default: packages/architecture/systems/{name}-artifact.arch.calm.json",
  });

  only = Option.String("--only", {
    required: false,
    description: `Comma-separated list of check IDs to run. Available: ${ALL_CHECKS.map((c) => c.id).join(", ")}`,
  });

  json = Option.Boolean("--json", false, {
    description: "Output results as JSON (for CI scripts and agent consumption)",
  });

  // fallow-ignore-next-line complexity
  async execute(): Promise<number> {
    const archPath =
      this.arch ?? `packages/architecture/systems/${this.artifactName}-artifact.arch.calm.json`;
    const checkIds = this.only ? this.only.split(",").map((s) => s.trim()) : undefined;
    const workspaceRoot = process.cwd();

    let calmFile: Awaited<ReturnType<typeof readCalmFile>>;
    try {
      calmFile = await readCalmFile(resolve(workspaceRoot, archPath));
    } catch {
      this.context.stderr.write(
        `Error: Cannot read CALM file at ${archPath}\n` +
          `  Tip: Generate it first with: artifact-arch-check generate ${this.artifactName}\n` +
          `  Docs: cli/artifact-arch-check/docs/README.md\n`,
      );
      return 1;
    }

    const ctx: CheckContext = {
      artifactName: this.artifactName,
      calmFile,
      calmFilePath: archPath,
      workspaceRoot,
    };

    if (this.json) {
      const results = await runChecks(ctx, checkIds);
      const passed = results.every((r) => r.passed);
      this.context.stdout.write(
        JSON.stringify(
          {
            artifactName: this.artifactName,
            calmFile: archPath,
            passed,
            checks: results,
          },
          null,
          2,
        ) + "\n",
      );
      return passed ? 0 : 1;
    }

    const results = await runChecks(ctx, checkIds);

    let exitCode = 0;
    const { waitUntilExit } = render(
      React.createElement(CheckReport, {
        artifactName: this.artifactName,
        calmFilePath: archPath,
        results,
        onComplete: (code: number) => {
          exitCode = code;
        },
      }),
    );
    await waitUntilExit();
    return exitCode;
  }
}
