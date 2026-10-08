import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { createProjectGraphAsync, workspaceRoot } from "@nx/devkit";
import { UsageError } from "clipanion";

export { workspaceRoot };

/** True when the current directory is inside an Nx workspace (an nx.json was found). */
export function isNxWorkspace(): boolean {
  return existsSync(path.join(workspaceRoot, "nx.json"));
}

/** Throws a user-facing error when not run from inside an Nx workspace. */
export function assertNxWorkspace(): void {
  if (isNxWorkspace()) return;
  throw new UsageError(
    `nx-npm-publications requires an Nx workspace, but no nx.json was found in ${process.cwd()} or any parent directory. Run it from inside your Nx monorepo.`,
  );
}

export interface LocalPackage {
  name: string;
  version: string | null;
  /** True when package.json has `"private": true`. */
  private: boolean;
}

interface PackageJson {
  name?: unknown;
  version?: unknown;
  private?: unknown;
}

function readPackageJson(pkgJsonPath: string): PackageJson | null {
  if (!existsSync(pkgJsonPath)) return null;
  try {
    return JSON.parse(readFileSync(pkgJsonPath, "utf-8")) as PackageJson;
  } catch {
    return null;
  }
}

function toLocalPackage(pkg: PackageJson | null, prefix: string | null): LocalPackage | null {
  if (typeof pkg?.name !== "string") return null;
  if (prefix !== null && !pkg.name.startsWith(prefix)) return null;
  return {
    name: pkg.name,
    version: typeof pkg.version === "string" ? pkg.version : null,
    private: pkg.private === true,
  };
}

/**
 * Lists packages in the Nx workspace for `scope` (every named package when
 * `scope` is undefined). Private packages
 * (`"private": true`) are excluded unless `includePrivate` is set.
 *
 * Project locations come from the Nx project graph, so any folder layout Nx
 * knows about is covered. The workspace root is resolved by Nx (nearest
 * nx.json above the current directory, or NX_WORKSPACE_ROOT_PATH).
 */
export async function listLocalPackageDetails(
  scope: string | undefined,
  { includePrivate = false }: { includePrivate?: boolean } = {},
): Promise<LocalPackage[]> {
  assertNxWorkspace();
  const prefix = scope === undefined ? null : scope.endsWith("/") ? scope : `${scope}/`;
  const graph = await createProjectGraphAsync({ exitOnError: false });

  const packages = new Map<string, LocalPackage>();
  for (const node of Object.values(graph.nodes)) {
    const pkgJsonPath = path.join(workspaceRoot, node.data.root, "package.json");
    const pkg = toLocalPackage(readPackageJson(pkgJsonPath), prefix);
    if (pkg && (includePrivate || !pkg.private)) packages.set(pkg.name, pkg);
  }

  return [...packages.values()].sort((a, b) => a.name.localeCompare(b.name));
}

/** Names of the publishable (non-private) packages in the workspace for `scope`. */
export async function listLocalPackages(scope: string): Promise<Set<string>> {
  return new Set((await listLocalPackageDetails(scope)).map((p) => p.name));
}
