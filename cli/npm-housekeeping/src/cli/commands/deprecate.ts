import { spawnSync } from "node:child_process";
import { Command, Option } from "clipanion";
import { listLocalPackages } from "../lib/list-local-packages.js";
import { listNpmPackages } from "../lib/list-npm-packages.js";
import { selectPackages } from "../ui/PackageSelector.js";

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
      Runs in three steps:

      1. Fetches all packages for the given scope from the npm registry, compares
         them against the monorepo, and lists the stale ones.
      2. Lets you pick which of them to deprecate in an interactive list
         (space to toggle, a to toggle all, enter then y to confirm). Pass
         \`--all\` to skip the selection and take every stale package; this is
         required when there is no interactive terminal (e.g. CI).
      3. Runs \`npm deprecate\` on the selected packages, or prints the commands
         with \`--dry-run\`.

      Requires npm authentication with write access to the packages. Run
      \`npm-housekeeping doctor --scope <scope>\` to check this and see how to fix it.
    `,
    examples: [
      ["Pick packages to deprecate interactively", "npm-housekeeping deprecate --scope @alistigo"],
      [
        "Preview the commands for the packages you pick",
        "npm-housekeeping deprecate --scope @alistigo --dry-run",
      ],
      [
        "Deprecate every stale package without prompting",
        "npm-housekeeping deprecate --scope @alistigo --all",
      ],
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

  all = Option.Boolean("--all", false, {
    description: "Select every stale package without the interactive selection",
  });

  dryRun = Option.Boolean("--dry-run", false, {
    description: "Print what would be deprecated without calling npm deprecate",
  });

  /** Step 2: the packages to act on, or an exit code when there is nothing to do. */
  private async choose(stale: string[]): Promise<string[] | number> {
    if (this.all) return stale;
    if (!process.stdin.isTTY) {
      this.context.stderr.write(
        "\nInteractive selection needs a terminal. Pass --all to deprecate every stale package.\n",
      );
      return 1;
    }
    const selected = await selectPackages(stale, "Deprecate");
    if (selected !== null) return selected;
    this.context.stdout.write("\nCancelled. Nothing was deprecated.\n");
    return 0;
  }

  // fallow-ignore-next-line complexity
  async execute(): Promise<number> {
    // Step 1: find stale packages.
    this.context.stdout.write(`Fetching packages for ${this.scope} from npm...\n`);

    const [npmPackages, localPackages] = await Promise.all([
      listNpmPackages(this.scope),
      listLocalPackages(this.scope),
    ]);

    const stale = npmPackages
      .filter((n) => !localPackages.has(n))
      .sort((a, b) => a.localeCompare(b));
    const message = this.message ?? defaultMessage(this.scope);

    if (stale.length === 0) {
      this.context.stdout.write("Nothing to deprecate.\n");
      return 0;
    }

    this.context.stdout.write(`\nFound ${stale.length} stale package(s):\n\n`);
    for (const name of stale) {
      this.context.stdout.write(`  - ${name}\n`);
    }

    // Step 2: select.
    const selected = await this.choose(stale);
    if (typeof selected === "number") return selected;

    // Step 3: execute.
    if (this.dryRun) {
      this.context.stdout.write("\n[dry-run] Would run:\n\n");
      for (const name of selected) {
        this.context.stdout.write(`  npm deprecate "${name}@*" "${message}"\n`);
      }
      return 0;
    }

    this.context.stdout.write(`\nDeprecating ${selected.length} package(s)...\n\n`);
    const failures = runDeprecations(selected, message, this.context.stdout, this.context.stderr);

    if (failures > 0) {
      this.context.stderr.write(`\n${failures} package(s) failed to deprecate.\n`);
      return 1;
    }

    this.context.stdout.write("\nDone.\n");
    return 0;
  }
}
