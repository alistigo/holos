import { getCheckableNodes, readPackageJson, resolvePackageDir } from "../calm/reader.js";
import type { CalmNode } from "../calm/types.js";
import type { CheckContext, CheckDefinition, CheckIssue, CheckResult } from "./types.js";

type AlistigoType =
  | "domain"
  | "application"
  | "presentation"
  | "infrastructure"
  | "plugin"
  | "skill";

function expectedAlistigoType(node: CalmNode): AlistigoType {
  if (node["node-type"] === "skill") return "skill";
  if (node["node-type"] === "plugin") return "plugin";

  switch (node["ddd-layer"]) {
    case "Domain":
      return "domain";
    case "Application":
      return "application";
    case "Presentation":
      return "presentation";
    case "Infrastructure":
      return "infrastructure";
    default:
      return "application";
  }
}

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

    const shortName = pkg.replace(/^@[^/]+\//, "");
    const expected = expectedAlistigoType(node);
    const alistigoField = pkgJson["alistigo"];

    if (typeof alistigoField !== "object" || alistigoField === null || !("type" in alistigoField)) {
      issues.push({
        packageName: pkg,
        message: `Missing "alistigo" metadata field`,
        fix: `Add to packages/${shortName}/package.json: "alistigo": { "type": "${expected}" }`,
        docsRef: "cli/artifact-arch-check/docs/README.md#alistigo-metadata",
      });
      continue;
    }

    const actualType = (alistigoField as Record<string, unknown>)["type"];
    if (actualType !== expected) {
      issues.push({
        packageName: pkg,
        message: `"alistigo.type" is "${String(actualType)}", expected "${expected}"`,
        fix: `Set "alistigo": { "type": "${expected}" } in packages/${shortName}/package.json`,
        docsRef: "cli/artifact-arch-check/docs/README.md#alistigo-metadata",
      });
    }
  }

  return {
    checkId: alistigoMetadataCheck.id,
    checkName: alistigoMetadataCheck.name,
    passed: issues.length === 0,
    issues,
  };
}

export const alistigoMetadataCheck: CheckDefinition = {
  id: "alistigo-metadata",
  name: "Alistigo Metadata",
  run,
};
