import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { PACKAGES_DIR } from "./paths.ts";

export function buildPackageDirMap(): Map<string, string> {
  const map = new Map<string, string>();
  const entries = readdirSync(PACKAGES_DIR, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const pkgJsonPath = path.join(PACKAGES_DIR, entry.name, "package.json");
    if (!existsSync(pkgJsonPath)) continue;
    try {
      const json = JSON.parse(readFileSync(pkgJsonPath, "utf-8")) as {
        name?: string;
      };
      if (json.name) {
        map.set(json.name, path.join(PACKAGES_DIR, entry.name));
      }
    } catch {
      // malformed package.json — skip
    }
  }
  return map;
}
