import { loadConfiguration, runCucumber } from "@cucumber/cucumber/api";
import { Command, Option } from "clipanion";
import {
  CHROMIUM_EXECUTABLE_ENV,
  resolveChromiumExecutable,
  validateChromiumExecutable,
} from "../lib/browsers.js";
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
        "artifact-features-runner-playwright --target=@alistigo/list-features --host=http://localhost:5173",
      ],
    ],
  });

  target = Option.String("--target", {
    required: true,
    description: "npm package name of the features package to run (e.g. @alistigo/list-features)",
  });

  host = Option.String("--host", "http://localhost:5173", {
    description: "Base URL of the playground to run scenarios against",
  });

  chromiumExecutable = Option.String("--chromium-executable", {
    description:
      "Launch this chromium binary instead of playwright's bundled download (also: ARTIFACT_FEATURES_CHROMIUM_EXECUTABLE)",
  });

  // fallow-ignore-next-line complexity
  async execute(): Promise<number> {
    const hostError = validateHost(this.host);
    if (hostError !== undefined) {
      this.context.stderr.write(`Error: ${hostError}\n`);
      return 1;
    }

    const executable = resolveChromiumExecutable(this.chromiumExecutable);
    if (executable !== undefined) {
      const problem = validateChromiumExecutable(executable.path);
      if (problem !== undefined) {
        this.context.stderr.write(`Error: ${CHROMIUM_EXECUTABLE_ENV}: ${problem}\n`);
        return 1;
      }
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
    // The step definitions launch the browser in this same process, so the executable
    // choice travels to them through the environment.
    if (executable !== undefined) process.env[CHROMIUM_EXECUTABLE_ENV] = executable.path;

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
