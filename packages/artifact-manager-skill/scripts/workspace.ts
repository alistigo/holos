import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { PACKAGES_DIR } from "./paths.ts";

function readPackageName(dirPath: string): string | null {
  const pkgJsonPath = path.join(dirPath, "package.json");
  if (!existsSync(pkgJsonPath)) return null;
  try {
    const json = JSON.parse(readFileSync(pkgJsonPath, "utf-8")) as { name?: string };
    return json.name ?? null;
  } catch {
    return null;
  }
}

export function buildPackageDirMap(): Map<string, string> {
  const map = new Map<string, string>();
  for (const entry of readdirSync(PACKAGES_DIR, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const dirPath = path.join(PACKAGES_DIR, entry.name);
    const name = readPackageName(dirPath);
    if (name) map.set(name, dirPath);
  }
  return map;
}
