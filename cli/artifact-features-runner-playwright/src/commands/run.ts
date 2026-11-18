import { loadConfiguration, runCucumber } from "@cucumber/cucumber/api";
import { Command, Option } from "clipanion";
import { ARTIFACT_ENV } from "../harness/world.js";
import {
  CHROMIUM_EXECUTABLE_ENV,
  resolveChromiumExecutable,
  validateChromiumExecutable,
} from "../lib/browsers.js";
import { countTodoScenarios, loadFeaturesPackage } from "../lib/features-package.js";
import { harnessRegistrationModule } from "../lib/harness-path.js";
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

      The shared browser harness — browser and scenario lifecycle, the World,
      the playground page object and CDN route interception — is supplied by
      this runner and registered ahead of the target package's own support
      files, so a features package carries only its features and its
      domain-specific step definitions.

      Pass --artifact to select a specific artifact in the playground before
      scenarios run; omit it to use whatever the playground defaults to.
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
      [
        "Select a specific artifact in the playground first",
        "artifact-features-runner-playwright --target=@alistigo/artifact-ai-draw-comments-features --artifact=@alistigo/artifact-ai-draw-comments",
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

  artifact = Option.String("--artifact", {
    description:
      "Artifact to select in the playground before scenarios run — omit to use the playground's own default",
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

    process.env.PLAYWRIGHT_BASE_URL = this.host;
    // The harness runs in this same process, so these choices travel to it
    // through the environment rather than a constructor argument.
    if (executable !== undefined) process.env[CHROMIUM_EXECUTABLE_ENV] = executable.path;
    // Unset means "leave the Artifact selector alone", which is the behaviour
    // every features package had before this flag existed.
    if (this.artifact !== undefined) process.env[ARTIFACT_ENV] = this.artifact;

    const { runConfiguration } = await loadConfiguration({
      file: false,
      provided: {
        paths: [`${pkg.featuresDir}/**/*.feature`],
        // Order matters and is part of the harness contract: the shared
        // registration module goes FIRST so its setWorldConstructor runs before
        // a features package's own, which must win (last call wins).
        import: [
          harnessRegistrationModule(),
          `${pkg.stepDefinitionsDir}/**/*.js`,
          ...(pkg.supportDir === undefined ? [] : [`${pkg.supportDir}/**/*.js`]),
        ],
        format: ["@cucumber/pretty-formatter"],
        failFast: true,
        // @todo scenarios are filtered out rather than skipped in-report.
        //
        // The harness also skips them in a Before hook, which would keep them
        // visible as "skipped" — but step resolution happens BEFORE hooks run,
        // so a @todo scenario whose steps were never written is reported
        // "undefined" regardless, and failFast then aborts the run. That is the
        // case in list-features' @todo posthog feature. Until those step
        // definitions exist, filtering is the only way a @todo scenario neither
        // fails nor aborts the suite.
        tags: "not @todo",
      },
    });
    const { success } = await runCucumber(runConfiguration);

    // Say what the `not @todo` filter removed, so unimplemented scenarios are
    // visible in the output instead of silently absent from the counts above.
    const todo = countTodoScenarios(pkg.featuresDir, pkg.featureFiles);
    if (todo > 0) {
      this.context.stdout.write(
        `\n${todo} scenario${todo === 1 ? "" : "s"} excluded by @todo ` +
          "(not yet implemented; see the feature files).\n",
      );
    }

    return success ? 0 : 1;
  }
}
