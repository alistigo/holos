import { access, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import type { CalmArchFile, CalmNode } from "./types.js";

export async function readCalmFile(filePath: string): Promise<CalmArchFile> {
  const content = await readFile(filePath, "utf-8");
  return JSON.parse(content) as CalmArchFile;
}

/** Returns all nodes that carry a core-npm-package field (checkable packages). */
export function getCheckableNodes(calmFile: CalmArchFile): CalmNode[] {
  return calmFile.nodes.filter((n) => n["core-npm-package"] !== undefined);
}

/** Maps @alistigo/package-name → packages/package-name absolute path. */
export function resolvePackageDir(workspaceRoot: string, npmPackageName: string): string {
  const withoutScope = npmPackageName.replace(/^@[^/]+\//, "");
  return resolve(workspaceRoot, "packages", withoutScope);
}

/**
 * Searches packages/, cli/, apps/ for a workspace package directory.
 * Returns the first hit containing a package.json, or undefined if not found.
 */
export async function tryResolveWorkspacePackageDir(
  workspaceRoot: string,
  npmPackageName: string,
): Promise<string | undefined> {
  const withoutScope = npmPackageName.replace(/^@[^/]+\//, "");
  const candidates = ["packages", "cli", "apps"].map((dir) =>
    resolve(workspaceRoot, dir, withoutScope),
  );
  for (const candidate of candidates) {
    try {
      await access(`${candidate}/package.json`);
      return candidate;
    } catch {
      // not here, try next
    }
  }
  return undefined;
}

export async function readPackageJson(packageDir: string): Promise<Record<string, unknown>> {
  const content = await readFile(`${packageDir}/package.json`, "utf-8");
  return JSON.parse(content) as Record<string, unknown>;
}
