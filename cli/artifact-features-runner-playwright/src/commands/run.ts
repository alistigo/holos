import { loadConfiguration, runCucumber } from "@cucumber/cucumber/api";
import { Command, Option } from "clipanion";
import { loadFeaturesPackage } from "../lib/features-package.js";
import { validateHost } from "../lib/playground.js";

export class RunCommand extends Command {
  static override paths = [Command.Default];

  static override usage = Command.Usage({
    description: "Run Gherkin scenarios from a features package against a playground host",
    details: `
      Loads a features package by npm name, sets PLAYWRIGHT_BASE_URL to the
      given host, and runs all Gherkin scenarios via Cucumber.js.

      The target is resolved from the current working directory, so the package
      that invokes the runner must declare it as a dependency.
    `,
    examples: [
      [
        "Run list-features against the default local playground",
        "artifact-features-runner-playwright --target=@alistigo/list-features",
      ],
      [
        "Run against a specific host",
        "artifact-features-runner-playwright --target=@alistigo/list-features --host=http://localhost:4173",
      ],
    ],
  });

  target = Option.String("--target", {
    required: true,
    description: "npm package name of the features package to run (e.g. @alistigo/list-features)",
  });

  host = Option.String("--host", "http://localhost:4173", {
    description: "Base URL of the playground to run scenarios against",
  });

  // fallow-ignore-next-line complexity
  async execute(): Promise<number> {
    const hostError = validateHost(this.host);
    if (hostError !== undefined) {
      this.context.stderr.write(`Error: ${hostError}\n`);
      return 1;
    }

    const outcome = await loadFeaturesPackage(this.target, process.cwd());
    if (!outcome.ok) {
      this.context.stderr.write(`Error: ${outcome.detail}\n`);
      for (const line of outcome.fix) this.context.stderr.write(`  ${line}\n`);
      this.context.stderr.write(`  Run \`doctor --target=${this.target}\` for a full diagnosis.\n`);
      return 1;
    }
    const { pkg } = outcome;

    process.env["PLAYWRIGHT_BASE_URL"] = this.host;

    const { runConfiguration } = await loadConfiguration({
      file: false,
      provided: {
        paths: [`${pkg.featuresDir}/**/*.feature`],
        import: [
          `${pkg.stepDefinitionsDir}/**/*.js`,
          ...(pkg.supportDir === undefined ? [] : [`${pkg.supportDir}/**/*.js`]),
        ],
        format: ["@cucumber/pretty-formatter"],
        failFast: true,
        tags: "not @todo",
      },
    });
    const { success } = await runCucumber(runConfiguration);

    return success ? 0 : 1;
  }
}
