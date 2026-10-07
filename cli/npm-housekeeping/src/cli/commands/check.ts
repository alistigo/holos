import { Command, Option } from "clipanion";
import { listLocalPackages } from "../lib/list-local-packages.js";
import { listNpmPackages } from "../lib/list-npm-packages.js";

export class CheckCommand extends Command {
  static override paths = [Command.Default, ["check"]];

  static override usage = Command.Usage({
    description: "List packages published to npm that are no longer in the monorepo",
    details: `
      Fetches all packages for the given scope from the npm registry and compares
      them against the packages currently present in the monorepo. Packages found
      on npm but missing locally are considered stale candidates for deprecation.

      Exits 0 when no stale packages are found, exits 1 when stale packages exist
      (useful in CI checks).
    `,
    examples: [
      ["Check the default @alistigo scope", "npm-housekeeping check"],
      ["Check a different scope", "npm-housekeeping check --scope @myorg"],
    ],
  });

  scope = Option.String("--scope", "@alistigo", {
    description: "npm organisation scope to audit (default: @alistigo)",
  });

  async execute(): Promise<number> {
    this.context.stdout.write(`Fetching packages for ${this.scope} from npm...\n`);

    const [npmPackages, localPackages] = await Promise.all([
      listNpmPackages(this.scope),
      Promise.resolve(listLocalPackages(process.cwd(), this.scope)),
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
    this.context.stdout.write("\nRun `npm-housekeeping deprecate` to deprecate them.\n");
    return 1;
  }
}
