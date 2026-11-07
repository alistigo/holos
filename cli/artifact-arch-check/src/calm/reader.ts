import { access, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import type { CalmArchFile, CalmNode } from "./types.js";

export async function readCalmFile(filePath: string): Promise<CalmArchFile> {
  const content = await readFile(filePath, "utf-8");
  return JSON.parse(content) as CalmArchFile;
}

/**
 * Returns nodes that have a `package-name` pattern — these are the
 * artifact-specific modules whose implementations are checked.
 * Shared infrastructure nodes (plugin-bus, logger-plugin, etc.) are excluded.
 */
export function getCheckableNodes(calmFile: CalmArchFile): CalmNode[] {
  return calmFile.nodes.filter((n) => n["package-name"] !== undefined);
}

/**
 * Resolves the `{domain}` placeholder in a node's `package-name` and returns
 * the full scoped npm package name: `@alistigo/{resolved}`.
 * Returns undefined for nodes without a `package-name`.
 */
export function resolveImplPackage(node: CalmNode, artifactName: string): string | undefined {
  const pattern = node["package-name"];
  if (pattern === undefined) return undefined;
  return `@alistigo/${pattern.replace(/\{domain\}/g, artifactName)}`;
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
