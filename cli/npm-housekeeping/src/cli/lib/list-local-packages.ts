import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { createProjectGraphAsync, workspaceRoot } from "@nx/devkit";

export { workspaceRoot };

export interface LocalPackage {
  name: string;
  version: string | null;
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

/** Publishable package under `prefix`: has a name in scope and is not `"private": true`. */
function toPublishable(pkg: PackageJson | null, prefix: string): LocalPackage | null {
  if (typeof pkg?.name !== "string" || !pkg.name.startsWith(prefix)) return null;
  if (pkg.private === true) return null;
  return { name: pkg.name, version: typeof pkg.version === "string" ? pkg.version : null };
}

/**
 * Lists publishable packages in the Nx workspace for `scope`.
 *
 * Project locations come from the Nx project graph, so any folder layout Nx
 * knows about is covered. The workspace root is resolved by Nx (nearest
 * nx.json above the current directory, or NX_WORKSPACE_ROOT_PATH).
 */
export async function listLocalPackageDetails(scope: string): Promise<LocalPackage[]> {
  const prefix = scope.endsWith("/") ? scope : `${scope}/`;
  const graph = await createProjectGraphAsync({ exitOnError: false });

  const packages = new Map<string, LocalPackage>();
  for (const node of Object.values(graph.nodes)) {
    const pkgJsonPath = path.join(workspaceRoot, node.data.root, "package.json");
    const pkg = toPublishable(readPackageJson(pkgJsonPath), prefix);
    if (pkg) packages.set(pkg.name, pkg);
  }

  return [...packages.values()].sort((a, b) => a.name.localeCompare(b.name));
}

export async function listLocalPackages(scope: string): Promise<Set<string>> {
  return new Set((await listLocalPackageDetails(scope)).map((p) => p.name));
}
