import { Command, Option } from "clipanion";
import { listLocalPackages } from "../lib/list-local-packages.js";
import { listNpmPackages } from "../lib/list-npm-packages.js";

export class CheckCommand extends Command {
  static override paths = [["check"], Command.Default];

  static override usage = Command.Usage({
    description: "List packages published to npm that are no longer in the monorepo",
    details: `
      Fetches all packages for the given scope from the npm registry and compares
      them against the packages currently present in the monorepo. Packages found
      on npm but missing locally are considered stale candidates for deprecation.

      Local packages are the Nx projects in the workspace (root found via nx.json)
      whose package.json is in scope and not "private": true.

      Exits 0 by default. Pass \`--fail-on-stale\` to exit 1 when stale packages
      exist (useful in CI checks).
    `,
    examples: [
      ["Check the @alistigo scope", "nx-npm-publications check --scope @alistigo"],
      [
        "Fail when stale packages exist (CI)",
        "nx-npm-publications check --scope @alistigo --fail-on-stale",
      ],
    ],
  });

  scope = Option.String("--scope", {
    required: true,
    description: "npm organisation scope to audit, e.g. @alistigo",
  });

  failOnStale = Option.Boolean("--fail-on-stale", false, {
    description: "Exit 1 when stale packages are found (for CI)",
  });

  async execute(): Promise<number> {
    this.context.stdout.write(`Fetching packages for ${this.scope} from npm...\n`);

    const [npmPackages, localPackages] = await Promise.all([
      listNpmPackages(this.scope),
      listLocalPackages(this.scope),
    ]);

    const stale = npmPackages.filter((n) => !localPackages.has(n));

    if (stale.length === 0) {
      this.context.stdout.write(
        `All ${npmPackages.length} npm package(s) are present in the monorepo. Nothing to deprecate.\n`,
      );
      return 0;
    }

    this.context.stdout.write(
      `\nFound ${stale.length} stale package(s) on npm (not in monorepo):\n\n`,
    );
    for (const name of stale) {
      this.context.stdout.write(`  - ${name}\n`);
    }
    this.context.stdout.write(
      `\nRun \`nx-npm-publications deprecate --scope ${this.scope}\` to deprecate them.\n`,
    );
    return this.failOnStale ? 1 : 0;
  }
}
