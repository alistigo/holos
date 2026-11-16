import { Command, Option } from "clipanion";
import type { FeaturePackageCheckResult } from "../../checks/features-workspace-scan.js";
import { scanFeaturesPackages } from "../../checks/features-workspace-scan.js";

export class FeaturesCommand extends Command {
  static override paths = [["features"]];

  static override usage = Command.Usage({
    description: "Validate features packages in the workspace",
    details: `
      Scans the workspace for all packages with "alistigo.type": "features" and
      validates that each one follows the naming convention and has consistent domain metadata.

      Rules:
        features/naming-convention — name (without scope) must end with "-features"
        features/domain-required  — "alistigo.domain" must be present and non-empty
        features/domain-consistent — "alistigo.domain" must match the name prefix before "-features"

      Exit code 0 if all features packages pass, 1 if any violations found.
    `,
    examples: [
      ["Scan the workspace for features packages", "artifact-arch-check features"],
      ["Scan a specific workspace root", "artifact-arch-check features --workspace=/path/to/root"],
      ["Output JSON", "artifact-arch-check features --json"],
    ],
  });

  workspace = Option.String("--workspace", process.cwd(), {
    description: "Path to the workspace root (defaults to current working directory)",
  });

  json = Option.Boolean("--json", false, {
    description: "Output results as JSON",
  });

  // fallow-ignore-next-line complexity
  async execute(): Promise<number> {
    const results = await scanFeaturesPackages(this.workspace);
    const errors = results.reduce((n, r) => n + r.issues.length, 0);

    if (this.json) {
      this.context.stdout.write(
        `${JSON.stringify(
          {
            summary: { scanned: results.length, errors, warnings: 0 },
            results,
          },
          null,
          2,
        )}\n`,
      );
      return errors > 0 ? 1 : 0;
    }

    this.context.stdout.write(`Scanning workspace for features packages...\n\n`);

    if (results.length === 0) {
      this.context.stdout.write(`No features packages found.\n`);
      return 0;
    }

    for (const result of results) {
      this.context.stdout.write(formatResult(result));
    }

    this.context.stdout.write(
      `\n${results.length} package${results.length === 1 ? "" : "s"} scanned, ${errors} error${errors === 1 ? "" : "s"}\n`,
    );

    return errors > 0 ? 1 : 0;
  }
}

function formatResult(result: FeaturePackageCheckResult): string {
  const { packageName, packagePath, issues } = result;
  if (issues.length === 0) {
    return `✓ ${packageName} (${packagePath})\n`;
  }
  const lines = [`✗ ${packageName} (${packagePath})`];
  for (const issue of issues) {
    lines.push(`  [${issue.rule}] ${issue.message}`);
  }
  return `${lines.join("\n")}\n`;
}
