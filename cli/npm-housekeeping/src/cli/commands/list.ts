import { Command, Option } from "clipanion";
import { findRepoRoot, listLocalPackageDetails } from "../lib/list-local-packages.js";
import { listNpmPackageDetails } from "../lib/list-npm-packages.js";

const SOURCES = ["remote", "local", "all"] as const;
type Source = (typeof SOURCES)[number];

interface Row {
  name: string;
  remote: string | null;
  local: string | null;
}

const ABSENT = "—";

function isSource(value: string): value is Source {
  return (SOURCES as readonly string[]).includes(value);
}

function mergeRows(
  remote: Map<string, string | null> | null,
  local: Map<string, string | null> | null,
): Row[] {
  const names = new Set([...(remote?.keys() ?? []), ...(local?.keys() ?? [])]);
  return [...names]
    .sort((a, b) => a.localeCompare(b))
    .map((name) => ({
      name,
      remote: remote?.has(name) ? (remote.get(name) ?? "(unknown)") : null,
      local: local?.has(name) ? (local.get(name) ?? "(no version)") : null,
    }));
}

function formatTable(rows: Row[], source: Source): string {
  const columns: { header: string; get: (r: Row) => string }[] = [
    { header: "package", get: (r) => r.name },
  ];
  if (source !== "local") columns.push({ header: "npm", get: (r) => r.remote ?? ABSENT });
  if (source !== "remote") columns.push({ header: "local", get: (r) => r.local ?? ABSENT });

  const widths = columns.map((c) => Math.max(c.header.length, ...rows.map((r) => c.get(r).length)));
  const line = (cells: string[]) =>
    `  ${cells.map((cell, i) => cell.padEnd(widths[i] ?? 0)).join("  ")}`.trimEnd();

  return [
    line(columns.map((c) => c.header)),
    line(widths.map((w) => "-".repeat(w))),
    ...rows.map((r) => line(columns.map((c) => c.get(r)))),
  ].join("\n");
}

export class ListCommand extends Command {
  static override paths = [["list"]];

  static override usage = Command.Usage({
    description: "List packages under the given scope on npm and/or in the monorepo",
    details: `
      Lists packages for the given scope with their versions, sorted by name.

      \`--source all\` (default) merges npm and the monorepo side by side,
      showing ${ABSENT} where a package is missing on one side. \`--source remote\`
      lists only packages published to the npm registry with their latest
      version. \`--source local\` lists only packages found in the monorepo with
      their package.json version.

      Local packages are discovered from the repo root (the nearest directory
      containing pnpm-workspace.yaml), regardless of the current directory.
    `,
    examples: [
      ["Compare npm and the monorepo side by side", "npm-housekeeping list"],
      ["List packages published on npm", "npm-housekeeping list --source remote"],
      ["List packages in the monorepo", "npm-housekeeping list --source local"],
      ["List a different scope", "npm-housekeeping list --scope @myorg"],
    ],
  });

  scope = Option.String("--scope", "@alistigo", {
    description: "npm organisation scope to list (default: @alistigo)",
  });

  source = Option.String("--source", "all", {
    description: "Where to list packages from: all (default), remote (npm), or local (monorepo)",
  });

  // fallow-ignore-next-line complexity
  async execute(): Promise<number> {
    if (!isSource(this.source)) {
      this.context.stderr.write(
        `Invalid --source "${this.source}". Expected one of: ${SOURCES.join(", ")}.\n`,
      );
      return 1;
    }
    const source = this.source;

    let remote: Map<string, string | null> | null = null;
    if (source !== "local") {
      this.context.stdout.write(`Fetching packages for ${this.scope} from npm...\n`);
      const packages = await listNpmPackageDetails(this.scope);
      remote = new Map(packages.map((p) => [p.name, p.version]));
    }

    let local: Map<string, string | null> | null = null;
    if (source !== "remote") {
      const root = findRepoRoot(process.cwd());
      this.context.stdout.write(`Scanning monorepo at ${root}...\n`);
      const packages = listLocalPackageDetails(root, this.scope);
      local = new Map(packages.map((p) => [p.name, p.version]));
    }

    const rows = mergeRows(remote, local);
    if (rows.length === 0) {
      this.context.stdout.write(`No packages found for ${this.scope}.\n`);
      return 0;
    }

    this.context.stdout.write(
      `\nFound ${rows.length} package(s):\n\n${formatTable(rows, source)}\n`,
    );
    return 0;
  }
}
