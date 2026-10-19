import { readFile } from "node:fs/promises";
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

export async function readPackageJson(packageDir: string): Promise<Record<string, unknown>> {
  const content = await readFile(`${packageDir}/package.json`, "utf-8");
  return JSON.parse(content) as Record<string, unknown>;
}
