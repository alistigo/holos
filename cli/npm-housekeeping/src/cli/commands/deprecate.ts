import { spawnSync } from "node:child_process";
import { Command, Option } from "clipanion";
import { findRepoRoot, listLocalPackages } from "../lib/list-local-packages.js";
import { listNpmPackages } from "../lib/list-npm-packages.js";

function defaultMessage(scope: string): string {
  return `This package has been renamed or removed. Check the ${scope} scope on npm for the current packages.`;
}

function deprecatePackage(name: string, message: string): boolean {
  const result = spawnSync("npm", ["deprecate", `${name}@*`, message], {
    stdio: "inherit",
    encoding: "utf-8",
  });
  return result.error === undefined && (result.status ?? 1) === 0;
}

function runDeprecations(
  packages: string[],
  message: string,
  stdout: NodeJS.WritableStream,
  stderr: NodeJS.WritableStream,
): number {
  let failures = 0;
  for (const name of packages) {
    if (deprecatePackage(name, message)) {
      stdout.write(`  DEPRECATED  ${name}\n`);
    } else {
      stderr.write(`  FAILED  ${name}\n`);
      failures++;
    }
  }
  return failures;
}

export class DeprecateCommand extends Command {
  static override paths = [["deprecate"]];

  static override usage = Command.Usage({
    description: "Deprecate npm packages that are no longer in the monorepo",
    details: `
      Fetches all packages for the given scope from the npm registry, compares them
      against the monorepo, and runs \`npm deprecate\` on every stale package.

      Requires npm authentication. Run \`npm login\` first, or set NPM_TOKEN and
      configure your .npmrc accordingly.
    `,
    examples: [
      [
        "Dry-run to preview what would be deprecated",
        "npm-housekeeping deprecate --scope @alistigo --dry-run",
      ],
      ["Deprecate all stale packages", "npm-housekeeping deprecate --scope @alistigo"],
      [
        "Custom deprecation message",
        `npm-housekeeping deprecate --scope @alistigo --message "Renamed to @alistigo/new-name"`,
      ],
    ],
  });

  scope = Option.String("--scope", {
    required: true,
    description: "npm organisation scope to audit, e.g. @alistigo",
  });

  message = Option.String("--message,-m", {
    description:
      "Deprecation message to set on each stale package (default: points users to the scope on npm)",
  });

  dryRun = Option.Boolean("--dry-run", false, {
    description: "Print what would be deprecated without calling npm deprecate",
  });

  // fallow-ignore-next-line complexity
  async execute(): Promise<number> {
    this.context.stdout.write(`Fetching packages for ${this.scope} from npm...\n`);

    const localPackages = listLocalPackages(findRepoRoot(process.cwd()), this.scope);
    const npmPackages = await listNpmPackages(this.scope);

    const stale = npmPackages.filter((n) => !localPackages.has(n));
    const message = this.message ?? defaultMessage(this.scope);

    if (stale.length === 0) {
      this.context.stdout.write("Nothing to deprecate.\n");
      return 0;
    }

    this.context.stdout.write(`\nFound ${stale.length} stale package(s):\n\n`);
    for (const name of stale) {
      this.context.stdout.write(`  - ${name}\n`);
    }

    if (this.dryRun) {
      this.context.stdout.write("\n[dry-run] Would run:\n\n");
      for (const name of stale) {
        this.context.stdout.write(`  npm deprecate "${name}@*" "${message}"\n`);
      }
      return 0;
    }

    this.context.stdout.write("\nDeprecating...\n\n");
    const failures = runDeprecations(stale, message, this.context.stdout, this.context.stderr);

    if (failures > 0) {
      this.context.stderr.write(`\n${failures} package(s) failed to deprecate.\n`);
      return 1;
    }

    this.context.stdout.write("\nDone.\n");
    return 0;
  }
}
