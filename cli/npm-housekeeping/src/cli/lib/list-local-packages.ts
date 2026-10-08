import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";

const SEARCH_DIRS = ["packages", "cli", "apps", "websites"];

export interface LocalPackage {
  name: string;
  version: string | null;
  private: boolean;
}

function readPackage(pkgJsonPath: string): LocalPackage | null {
  try {
    const pkg = JSON.parse(readFileSync(pkgJsonPath, "utf-8")) as {
      name?: string;
      version?: string;
      private?: boolean;
    };
    if (typeof pkg.name !== "string") return null;
    return {
      name: pkg.name,
      version: typeof pkg.version === "string" ? pkg.version : null,
      private: pkg.private === true,
    };
  } catch {
    return null;
  }
}

// fallow-ignore-next-line complexity
function collectFromDir(dirPath: string, prefix: string): LocalPackage[] {
  const packages: LocalPackage[] = [];
  for (const entry of readdirSync(dirPath, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const pkgJsonPath = path.join(dirPath, entry.name, "package.json");
    if (!existsSync(pkgJsonPath)) continue;
    const pkg = readPackage(pkgJsonPath);
    if (pkg?.name.startsWith(prefix)) packages.push(pkg);
  }
  return packages;
}

/** Walks up from `start` to the directory holding pnpm-workspace.yaml; falls back to `start`. */
export function findRepoRoot(start: string): string {
  let dir = path.resolve(start);
  while (!existsSync(path.join(dir, "pnpm-workspace.yaml"))) {
    const parent = path.dirname(dir);
    if (parent === dir) return start;
    dir = parent;
  }
  return dir;
}

export function listLocalPackageDetails(repoRoot: string, scope: string): LocalPackage[] {
  const prefix = scope.endsWith("/") ? scope : `${scope}/`;
  const packages: LocalPackage[] = [];

  for (const dir of SEARCH_DIRS) {
    const dirPath = path.join(repoRoot, dir);
    if (!existsSync(dirPath)) continue;
    packages.push(...collectFromDir(dirPath, prefix));
  }

  return packages;
}

export function listLocalPackages(repoRoot: string, scope: string): Set<string> {
  return new Set(listLocalPackageDetails(repoRoot, scope).map((p) => p.name));
}
