import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";

const SEARCH_DIRS = ["packages", "cli", "apps", "websites"];

function readPackageName(pkgJsonPath: string): string | null {
  try {
    const pkg = JSON.parse(readFileSync(pkgJsonPath, "utf-8")) as { name?: string };
    return typeof pkg.name === "string" ? pkg.name : null;
  } catch {
    return null;
  }
}

// fallow-ignore-next-line complexity
function collectFromDir(dirPath: string, prefix: string): string[] {
  const names: string[] = [];
  for (const entry of readdirSync(dirPath, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const pkgJsonPath = path.join(dirPath, entry.name, "package.json");
    if (!existsSync(pkgJsonPath)) continue;
    const name = readPackageName(pkgJsonPath);
    if (name !== null && name.startsWith(prefix)) names.push(name);
  }
  return names;
}

export function listLocalPackages(repoRoot: string, scope: string): Set<string> {
  const prefix = scope.endsWith("/") ? scope : `${scope}/`;
  const names: string[] = [];

  for (const dir of SEARCH_DIRS) {
    const dirPath = path.join(repoRoot, dir);
    if (!existsSync(dirPath)) continue;
    names.push(...collectFromDir(dirPath, prefix));
  }

  return new Set(names);
}
