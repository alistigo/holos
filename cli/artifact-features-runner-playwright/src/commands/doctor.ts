import { Command, Option } from "clipanion";
import { browserChecks } from "../lib/browser-checks.js";
import { browsersInit, resolveChromiumExecutable } from "../lib/browsers.js";
import { CHECK_ICONS, type CheckResult, check } from "../lib/check.js";
import { loadFeaturesPackage } from "../lib/features-package.js";
import {
  checkPlaygroundMarkup,
  fetchHost,
  probePlayground,
  validateHost,
} from "../lib/playground.js";

export class DoctorCommand extends Command {
  static override paths = [["doctor"]];

  static override usage = Command.Usage({
    description: "Check that the runner, the features package and the playground host all work",
    details: `
      Verifies the whole chain the \`run\` command depends on: the features package
      resolves from the current working directory and exposes its Gherkin
      directories, the --host answers, and the host really is the dev playground —
      proven by selecting an artifact and watching that selection reach the preview
      iframe and mount.

      Exits 1 if any check fails.
    `,
    examples: [
      ["Check the default local playground", "artifact-features-runner-playwright doctor"],
      [
        "Check a features package too",
        "artifact-features-runner-playwright doctor --target=@alistigo/list-features",
      ],
      [
        "Check that a specific artifact can be selected",
        "artifact-features-runner-playwright doctor --artifact=@alistigo/artifact-list",
      ],
    ],
  });

  host = Option.String("--host", "http://localhost:5173", {
    description: "Base URL of the playground to check",
  });

  target = Option.String("--target", {
    description:
      "npm package name of a features package to validate (e.g. @alistigo/list-features)",
  });

  artifact = Option.String("--artifact", {
    description: "Artifact to select in the playground (default: the first one offered)",
  });

  chromiumExecutable = Option.String("--chromium-executable", {
    description:
      "Launch this chromium binary instead of playwright's bundled download (also: ARTIFACT_FEATURES_CHROMIUM_EXECUTABLE)",
  });

  verbose = Option.Boolean("--verbose", false, {
    description: "Stream browser console output while probing the playground",
  });

  private print(result: CheckResult): void {
    const { stdout } = this.context;
    stdout.write(`  ${CHECK_ICONS[result.status]} ${result.title}: ${result.detail}\n`);
    if (result.status === "warn" || result.status === "fail") {
      for (const line of result.fix) stdout.write(`      ${line}\n`);
    }
  }

  private async checkFeaturesPackage(): Promise<CheckResult[]> {
    if (this.target === undefined) {
      return [
        check("Features package", "skip", "no --target given, skipping features-package checks"),
      ];
    }

    const outcome = await loadFeaturesPackage(this.target, process.cwd());
    if (!outcome.ok) {
      return [check("Features package", "fail", outcome.detail, outcome.fix)];
    }

    const { pkg } = outcome;
    return [
      check(
        "Features package",
        "ok",
        `${pkg.name} (domain "${pkg.domain ?? "unset"}") → ${pkg.root}`,
      ),
      check(
        "Feature files",
        "ok",
        `${pkg.featureFiles.length} .feature file(s) under ${pkg.featuresDir}`,
      ),
    ];
  }

  // fallow-ignore-next-line complexity
  async execute(): Promise<number> {
    const { stdout } = this.context;
    stdout.write("artifact-features-runner-playwright doctor\n\n");

    const hostError = validateHost(this.host);
    if (hostError !== undefined) {
      this.print(check("Host URL", "fail", hostError, ["Pass an http or https URL to --host."]));
      return 1;
    }

    const results: CheckResult[] = [];
    const run = (result: CheckResult): void => {
      results.push(result);
      this.print(result);
    };

    for (const result of await this.checkFeaturesPackage()) run(result);

    const executable = resolveChromiumExecutable(this.chromiumExecutable);
    for (const result of browserChecks(browsersInit(), executable)) run(result);

    const { result: reachable, html } = await fetchHost(this.host);
    run(reachable);
    if (html === undefined) {
      run(check("Playground", "skip", "host unreachable, skipping playground checks"));
    } else {
      run(checkPlaygroundMarkup(html));
      const onConsole = this.verbose
        ? (message: string) => stdout.write(`      ${message}\n`)
        : undefined;
      for (const result of await probePlayground(
        this.host,
        this.artifact,
        onConsole,
        executable?.path,
      )) {
        run(result);
      }
    }

    const failed = results.filter((result) => result.status === "fail").length;
    const warned = results.filter((result) => result.status === "warn").length;
    if (failed > 0) {
      stdout.write(`\n${failed} check(s) failed — the runner cannot run features yet.\n`);
      return 1;
    }
    stdout.write(
      warned > 0
        ? `\nReady to run features (${warned} warning(s)).\n`
        : "\nReady to run features.\n",
    );
    return 0;
  }
}
