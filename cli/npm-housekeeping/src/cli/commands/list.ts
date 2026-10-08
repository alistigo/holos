import { Command, Option } from "clipanion";
import {
  type LocalPackage,
  listLocalPackageDetails,
  workspaceRoot,
} from "../lib/list-local-packages.js";
import { listNpmPackageDetails } from "../lib/list-npm-packages.js";

const SOURCES = ["remote", "local", "all"] as const;
type Source = (typeof SOURCES)[number];

interface Row {
  name: string;
  remote: string | null;
  local: string | null;
  /** From the local package.json; null when the package is not in the monorepo. */
  isPublic: boolean | null;
}

const ABSENT = "—";
const CHECK = "✓";

function isSource(value: string): value is Source {
  return (SOURCES as readonly string[]).includes(value);
}

function mergeRows(
  remote: Map<string, string | null> | null,
  local: Map<string, LocalPackage> | null,
): Row[] {
  const names = new Set([...(remote?.keys() ?? []), ...(local?.keys() ?? [])]);
  return [...names]
    .sort((a, b) => a.localeCompare(b))
    .map((name) => ({
      name,
      remote: remote?.has(name) ? (remote.get(name) ?? "(unknown)") : null,
      local: local?.has(name) ? (local.get(name)?.version ?? "(no version)") : null,
      isPublic: local?.has(name) ? local.get(name)?.private === false : null,
    }));
}

function formatTable(rows: Row[], source: Source): string {
  const columns: { header: string; get: (r: Row) => string }[] = [
    { header: "package", get: (r) => r.name },
  ];
  if (source !== "local") columns.push({ header: "npm", get: (r) => r.remote ?? ABSENT });
  if (source !== "remote") {
    columns.push({ header: "local", get: (r) => r.local ?? ABSENT });
    columns.push({ header: "public", get: (r) => (r.isPublic ? CHECK : "") });
  }

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
      \`--scope\` is required when npm is queried (\`all\` or \`remote\`); with
      \`--source local\` it is optional, and omitting it lists every package in
      the workspace.

      \`--source all\` (default) merges npm and the monorepo side by side,
      showing ${ABSENT} where a package is missing on one side. \`--source remote\`
      lists only packages published to the npm registry with their latest
      version. \`--source local\` lists only packages found in the monorepo with
      their package.json version.

      Local packages are the Nx projects in the workspace (root found via nx.json)
      whose package.json name is in scope. Private packages ("private": true) are
      shown by default; the \`public\` column has ${CHECK} for packages that are not
      private. Pass \`--no-private\` to hide private packages.
    `,
    examples: [
      ["Compare npm and the monorepo side by side", "npm-housekeeping list --scope @alistigo"],
      ["List packages published on npm", "npm-housekeeping list --scope @alistigo --source remote"],
      ["List packages in the monorepo", "npm-housekeeping list --scope @alistigo --source local"],
      ["List every package in the monorepo, any scope", "npm-housekeeping list --source local"],
      ["Hide private packages", "npm-housekeeping list --scope @alistigo --no-private"],
    ],
  });

  scope = Option.String("--scope", {
    description: "npm organisation scope to list, e.g. @alistigo (required unless --source local)",
  });

  source = Option.String("--source", "all", {
    description: "Where to list packages from: all (default), remote (npm), or local (monorepo)",
  });

  private = Option.Boolean("--private", true, {
    description: "Include private monorepo packages (default: true; use --no-private to hide them)",
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
    const scope = this.scope;
    const label = scope ?? "all scopes";

    if (source !== "local" && scope === undefined) {
      this.context.stderr.write(
        `--scope is required with --source ${source} (npm is queried by scope).\n`,
      );
      return 1;
    }

    let remote: Map<string, string | null> | null = null;
    if (source !== "local" && scope !== undefined) {
      this.context.stdout.write(`Fetching packages for ${scope} from npm...\n`);
      const packages = await listNpmPackageDetails(scope);
      remote = new Map(packages.map((p) => [p.name, p.version]));
    }

    let local: Map<string, LocalPackage> | null = null;
    if (source !== "remote") {
      this.context.stdout.write(`Scanning Nx workspace at ${workspaceRoot}...\n`);
      const packages = await listLocalPackageDetails(scope, { includePrivate: this.private });
      local = new Map(packages.map((p) => [p.name, p]));
    }

    const rows = mergeRows(remote, local);
    if (rows.length === 0) {
      this.context.stdout.write(`No packages found for ${label}.\n`);
      return 0;
    }

    this.context.stdout.write(
      `\nFound ${rows.length} package(s):\n\n${formatTable(rows, source)}\n`,
    );
    return 0;
  }
}
