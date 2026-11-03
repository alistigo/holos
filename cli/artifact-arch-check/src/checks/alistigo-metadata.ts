import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { getCheckableNodes, readPackageJson, resolvePackageDir } from "../calm/reader.js";
import type { CalmNode } from "../calm/types.js";
import type { CheckContext, CheckDefinition, CheckIssue, CheckResult } from "./types.js";

async function readValidAlistigoTypes(workspaceRoot: string): Promise<string[]> {
  const schemaPath = resolve(
    workspaceRoot,
    "packages/architecture/extensions/alistigo-package-metadata.schema.json",
  );
  const content = await readFile(schemaPath, "utf-8");
  const schema = JSON.parse(content) as {
    properties: { type: { enum: string[] } };
  };
  return schema.properties.type.enum;
}

// fallow-ignore-next-line complexity
function expectedAlistigoType(node: CalmNode): string {
  if (node["node-type"] === "skill") return "skill";
  if (node["node-type"] === "plugin") return "plugin";

  // Document modules use the "document" type regardless of their ddd-layer
  const pkg = node["core-npm-package"];
  if (pkg !== undefined && pkg.endsWith("-document")) return "document";

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

// fallow-ignore-next-line complexity
async function run(ctx: CheckContext): Promise<CheckResult> {
  const issues: CheckIssue[] = [];
  const nodes = getCheckableNodes(ctx.calmFile);

  let validTypes: string[];
  try {
    validTypes = await readValidAlistigoTypes(ctx.workspaceRoot);
  } catch {
    validTypes = [
      "domain",
      "application",
      "document",
      "presentation",
      "infrastructure",
      "plugin",
      "skill",
      "tool",
    ];
  }

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
        docsRef: "cli/artifact-arch-check/README.md#alistigo-metadata",
      });
      continue;
    }

    const actualType = (alistigoField as Record<string, unknown>)["type"];
    const actualTypeStr = String(actualType);

    if (!validTypes.includes(actualTypeStr)) {
      issues.push({
        packageName: pkg,
        message: `"alistigo.type" is "${actualTypeStr}", which is not a valid type`,
        fix: `Set "alistigo": { "type": "${expected}" } in packages/${shortName}/package.json. Valid types: ${validTypes.join(", ")}`,
        docsRef: "cli/artifact-arch-check/README.md#alistigo-metadata-field",
      });
      continue;
    }

    if (actualTypeStr !== expected) {
      issues.push({
        packageName: pkg,
        message: `"alistigo.type" is "${actualTypeStr}", expected "${expected}"`,
        fix: `Set "alistigo": { "type": "${expected}" } in packages/${shortName}/package.json`,
        docsRef: "cli/artifact-arch-check/README.md#alistigo-metadata",
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
