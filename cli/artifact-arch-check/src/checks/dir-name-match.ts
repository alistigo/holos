import { readdir } from "node:fs/promises";
import { join } from "node:path";
import { readPackageJson } from "../calm/reader.js";
import type { CheckContext, CheckDefinition, CheckIssue, CheckResult } from "./types.js";

const SCAN_DIRS = ["packages", "cli", "apps"];

async function run(ctx: CheckContext): Promise<CheckResult> {
  const issues: CheckIssue[] = [];

  for (const scanDir of SCAN_DIRS) {
    let entries: string[];
    try {
      entries = await readdir(join(ctx.workspaceRoot, scanDir));
    } catch {
      continue;
    }

    for (const entry of entries) {
      let pkgJson: Record<string, unknown>;
      try {
        pkgJson = await readPackageJson(join(ctx.workspaceRoot, scanDir, entry));
      } catch {
        continue;
      }

      const pkgName = pkgJson.name;
      if (typeof pkgName !== "string") continue;

      const expectedDir = pkgName.replace(/^@[^/]+\//, "");

      if (expectedDir !== entry) {
        issues.push({
          packageName: pkgName,
          message: `Directory "${scanDir}/${entry}" does not match package name "${pkgName}" (expected "${scanDir}/${expectedDir}")`,
          fix: `Rename the directory: git mv ${scanDir}/${entry} ${scanDir}/${expectedDir}`,
          docsRef: "cli/artifact-arch-check/README.md#dir-name-match",
        });
      }
    }
  }

  return {
    checkId: dirNameMatchCheck.id,
    checkName: dirNameMatchCheck.name,
    passed: issues.length === 0,
    issues,
  };
}

export const dirNameMatchCheck: CheckDefinition = {
  id: "dir-name-match",
  name: "Directory Name Match",
  run,
};
