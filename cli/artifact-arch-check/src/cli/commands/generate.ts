import { resolve } from "node:path";
import { Command, Option } from "clipanion";
import { render } from "ink";
import React from "react";
import { generateArtifactCalmFile } from "../../calm/artifact-slots.js";
import { GenerateError, GenerateReport } from "../../ui/GenerateReport.js";

const DEFAULT_TEMPLATE =
  "packages/architecture/systems/alistigo-artifact-module-composition.arch.calm.json";

export class GenerateCommand extends Command {
  static override paths = [["generate"]];

  static override usage = Command.Usage({
    description: "Generate a CALM architecture file for a new artifact from the canonical template",
    details: `
      Creates a new artifact-specific CALM file by substituting the four
      artifact slot nodes (domain, document, ui, skill) in the canonical
      module-composition template with the artifact's package names.

      Artifact slots substituted:
        domain   → @alistigo/{name}-domain
        document → @alistigo/{name}-document
        ui       → @alistigo/{name}-components-react
        skill    → @alistigo/{name}-skill

      Shared platform nodes (application, plugin-bus, storage, logger) are
      kept unchanged — they represent cross-artifact infrastructure.
    `,
    examples: [
      ["Generate CALM file for a new 'todo' artifact", "artifact-arch-check generate todo"],
      [
        "Override template or output path",
        "artifact-arch-check generate todo --template packages/architecture/systems/alistigo-artifact-module-composition.arch.calm.json --out packages/architecture/systems/todo-artifact.arch.calm.json",
      ],
    ],
  });

  artifactName = Option.String({ required: true, name: "artifact-name" });

  template = Option.String("--template", DEFAULT_TEMPLATE, {
    description: `Path to the template CALM file. Default: ${DEFAULT_TEMPLATE}`,
  });

  out = Option.String("--out", {
    required: false,
    description:
      "Output path. Default: packages/architecture/systems/{name}-artifact.arch.calm.json",
  });

  async execute(): Promise<number> {
    const workspaceRoot = process.cwd();
    const outputPath =
      this.out ?? `packages/architecture/systems/${this.artifactName}-artifact.arch.calm.json`;

    let error: string | null = null;
    try {
      await generateArtifactCalmFile({
        artifactName: this.artifactName,
        templatePath: resolve(workspaceRoot, this.template),
        outputPath: resolve(workspaceRoot, outputPath),
      });
    } catch (err) {
      error = err instanceof Error ? err.message : String(err);
    }

    let exitCode = 0;
    const component = error
      ? React.createElement(GenerateError, {
          artifactName: this.artifactName,
          error,
          onComplete: (code: number) => {
            exitCode = code;
          },
        })
      : React.createElement(GenerateReport, {
          artifactName: this.artifactName,
          outputPath,
          onComplete: (code: number) => {
            exitCode = code;
          },
        });

    const { waitUntilExit } = render(component);
    await waitUntilExit();
    return exitCode;
  }
}
