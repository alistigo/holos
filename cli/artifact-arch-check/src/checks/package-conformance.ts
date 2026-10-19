import { getCheckableNodes, readPackageJson, resolvePackageDir } from "../calm/reader.js";
import type { CheckContext, CheckDefinition, CheckIssue, CheckResult } from "./types.js";

const REQUIRED_TOP_LEVEL_FIELDS = [
  "name",
  "version",
  "license",
  "type",
  "exports",
  "main",
  "types",
  "files",
] as const;

function hasPublishConfig(pkg: Record<string, unknown>): boolean {
  const pc = pkg["publishConfig"];
  return (
    typeof pc === "object" &&
    pc !== null &&
    "access" in pc &&
    typeof (pc as Record<string, unknown>)["access"] === "string"
  );
}

// fallow-ignore-next-line complexity
async function run(ctx: CheckContext): Promise<CheckResult> {
  const issues: CheckIssue[] = [];
  const nodes = getCheckableNodes(ctx.calmFile);

  for (const node of nodes) {
    const pkg = node["core-npm-package"];
    if (pkg === undefined) continue;

    const pkgDir = resolvePackageDir(ctx.workspaceRoot, pkg);
    let pkgJson: Record<string, unknown>;
    try {
      pkgJson = await readPackageJson(pkgDir);
    } catch {
      continue; // module-existence check handles missing packages
    }

    const missing: string[] = [];

    for (const field of REQUIRED_TOP_LEVEL_FIELDS) {
      if (!(field in pkgJson)) {
        missing.push(field);
      }
    }

    if (!hasPublishConfig(pkgJson)) {
      missing.push("publishConfig.access");
    }

    if (missing.length > 0) {
      issues.push({
        packageName: pkg,
        message: `Missing required fields: ${missing.join(", ")}`,
        fix: `Align with the package template in scripts/new-package.sh`,
        docsRef: "packages/architecture/docs/arch-check.md#package-template",
      });
    }
  }

  return {
    checkId: packageConformanceCheck.id,
    checkName: packageConformanceCheck.name,
    passed: issues.length === 0,
    issues,
  };
}

export const packageConformanceCheck: CheckDefinition = {
  id: "package-conformance",
  name: "Package Conformance",
  run,
};
