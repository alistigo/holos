import { Command, Option } from "clipanion";
import { listNpmPackageDetails } from "../lib/list-npm-packages.js";

export class ListCommand extends Command {
  static override paths = [["list"]];

  static override usage = Command.Usage({
    description: "List all packages published to npm under the given scope",
    details: `
      Fetches all packages for the given scope from the npm registry and prints
      each one with its latest published version, sorted by name.
    `,
    examples: [
      ["List the default @alistigo scope", "npm-housekeeping list"],
      ["List a different scope", "npm-housekeeping list --scope @myorg"],
    ],
  });

  scope = Option.String("--scope", "@alistigo", {
    description: "npm organisation scope to list (default: @alistigo)",
  });

  async execute(): Promise<number> {
    this.context.stdout.write(`Fetching packages for ${this.scope} from npm...\n`);

    const packages = (await listNpmPackageDetails(this.scope)).sort((a, b) =>
      a.name.localeCompare(b.name),
    );

    if (packages.length === 0) {
      this.context.stdout.write(`No packages found for ${this.scope} on npm.\n`);
      return 0;
    }

    const width = Math.max(...packages.map((p) => p.name.length));
    this.context.stdout.write(`\nFound ${packages.length} package(s):\n\n`);
    for (const { name, version } of packages) {
      this.context.stdout.write(`  - ${name.padEnd(width)}  ${version ?? "(unknown)"}\n`);
    }
    return 0;
  }
}
