import { readdirSync } from "node:fs";
import { createRequire } from "node:module";
import { loadConfiguration, runCucumber } from "@cucumber/cucumber/api";
import { Command, Option } from "clipanion";

interface FeaturesPackage {
  FEATURES_DIR: string;
  STEP_DEFINITIONS_DIR: string;
  SUPPORT_DIR?: string;
}

interface AlistigoMeta {
  type?: string;
  domain?: string;
}

interface PackageJson {
  name?: string;
  alistigo?: AlistigoMeta;
}

export class RunCommand extends Command {
  static override paths = [Command.Default];

  static override usage = Command.Usage({
    description: "Run Gherkin scenarios from a features package against a playground host",
    details: `
      Loads a features package by npm name, sets PLAYWRIGHT_BASE_URL to the
      given host, and runs all Gherkin scenarios via Cucumber.js.
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
    // 1. Validate --host
    let hostUrl: URL;
    try {
      hostUrl = new URL(this.host);
    } catch {
      this.context.stderr.write(`Error: --host "${this.host}" is not a valid URL\n`);
      return 1;
    }
    if (hostUrl.protocol !== "http:" && hostUrl.protocol !== "https:") {
      this.context.stderr.write(`Error: --host must be an http or https URL, got "${this.host}"\n`);
      return 1;
    }

    // 2. Resolve target package.json
    const req = createRequire(import.meta.url);
    let pkgJsonPath: string;
    try {
      pkgJsonPath = req.resolve(`${this.target}/package.json`);
    } catch {
      this.context.stderr.write(`Error: Cannot resolve package "${this.target}"\n`);
      return 1;
    }

    // 3. Validate alistigo.type === "features"
    const pkgJson = req(pkgJsonPath) as PackageJson;
    const aliType = pkgJson.alistigo?.type;
    if (aliType !== "features") {
      this.context.stderr.write(
        `Error: Package "${this.target}" is not a features package\n` +
          `  (alistigo.type is "${aliType ?? "undefined"}", expected "features")\n`,
      );
      return 1;
    }

    // 4. Dynamically import the features package to get DIR exports
    let pkg: Partial<FeaturesPackage>;
    try {
      pkg = (await import(this.target)) as Partial<FeaturesPackage>;
    } catch (err) {
      this.context.stderr.write(
        `Error: Failed to import package "${this.target}": ${String(err)}\n`,
      );
      return 1;
    }

    // 5. Validate exports
    if (typeof pkg.FEATURES_DIR !== "string" || typeof pkg.STEP_DEFINITIONS_DIR !== "string") {
      this.context.stderr.write(
        `Error: Package "${this.target}" does not export FEATURES_DIR or STEP_DEFINITIONS_DIR\n`,
      );
      return 1;
    }

    // 6. Check for zero feature files
    let featureFiles: string[] = [];
    try {
      featureFiles = readdirSync(pkg.FEATURES_DIR, { recursive: true })
        .map(String)
        .filter((f) => f.endsWith(".feature"));
    } catch {
      this.context.stderr.write(`Error: Cannot read FEATURES_DIR "${pkg.FEATURES_DIR}"\n`);
      return 1;
    }
    if (featureFiles.length === 0) {
      this.context.stderr.write(`Error: No .feature files found in "${pkg.FEATURES_DIR}"\n`);
      return 1;
    }

    // 7. Run cucumber
    process.env["PLAYWRIGHT_BASE_URL"] = this.host;

    const importGlobs = [
      `${pkg.STEP_DEFINITIONS_DIR}/**/*.js`,
      ...(typeof pkg.SUPPORT_DIR === "string" ? [`${pkg.SUPPORT_DIR}/**/*.js`] : []),
    ];

    const { runConfiguration } = await loadConfiguration({
      file: false,
      provided: {
        paths: [`${pkg.FEATURES_DIR}/**/*.feature`],
        import: importGlobs,
        format: ["@cucumber/pretty-formatter"],
        failFast: true,
        tags: "not @todo",
      },
    });
    const { success } = await runCucumber(runConfiguration);

    return success ? 0 : 1;
  }
}
