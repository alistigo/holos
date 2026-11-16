import type { Dirent } from "node:fs";
import { readdir, readFile } from "node:fs/promises";
import { join, relative } from "node:path";

export interface CheckIssue {
  rule: string;
  severity: "error";
  message: string;
}

export interface FeaturePackageCheckResult {
  packageName: string;
  packagePath: string;
  issues: CheckIssue[];
}

interface AlistigoMeta {
  type?: string;
  domain?: string;
}

interface PackageJson {
  name?: string;
  alistigo?: AlistigoMeta;
}

// fallow-ignore-next-line complexity
async function findPackageJsonFiles(dir: string): Promise<string[]> {
  const results: string[] = [];
  let entries: Dirent<string>[];
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return results;
  }
  for (const entry of entries) {
    if (entry.name === "node_modules" || entry.name === ".git") continue;
    if (entry.isDirectory()) {
      const sub = await findPackageJsonFiles(join(dir, entry.name));
      results.push(...sub);
    } else if (entry.name === "package.json") {
      results.push(join(dir, entry.name));
    }
  }
  return results;
}

// fallow-ignore-next-line complexity
export async function scanFeaturesPackages(
  workspaceRoot: string,
): Promise<FeaturePackageCheckResult[]> {
  const pkgJsonFiles = await findPackageJsonFiles(workspaceRoot);
  const results: FeaturePackageCheckResult[] = [];

  for (const pkgJsonPath of pkgJsonFiles) {
    let pkg: PackageJson;
    try {
      const content = await readFile(pkgJsonPath, "utf-8");
      pkg = JSON.parse(content) as PackageJson;
    } catch {
      continue;
    }

    if (pkg.alistigo?.type !== "features") continue;

    const packageName = pkg.name ?? "(unknown)";
    const packagePath = relative(workspaceRoot, join(pkgJsonPath, ".."));
    const issues: CheckIssue[] = [];
    const unscopedName = packageName.replace(/^@[^/]+\//, "");

    // Rule: features/naming-convention — name without scope must end with "-features"
    if (!unscopedName.endsWith("-features")) {
      issues.push({
        rule: "features/naming-convention",
        severity: "error",
        message: `Package name must end with "-features" after the scope. Got: "${unscopedName}"`,
      });
    }

    // Rule: features/domain-required — alistigo.domain must be present and non-empty
    const domain = pkg.alistigo?.domain;
    if (!domain || domain.trim() === "") {
      issues.push({
        rule: "features/domain-required",
        severity: "error",
        message: `"alistigo.domain" is required and must be non-empty`,
      });
    }

    // Rule: features/domain-consistent — domain must match the prefix before "-features"
    if (domain && unscopedName.endsWith("-features")) {
      const expectedDomain = unscopedName.slice(0, -"-features".length);
      if (domain !== expectedDomain) {
        issues.push({
          rule: "features/domain-consistent",
          severity: "error",
          message: `"alistigo.domain" ("${domain}") does not match the name prefix ("${expectedDomain}")`,
        });
      }
    }

    results.push({ packageName, packagePath, issues });
  }

  // Rule: features/domain-unique — domain must be unique across all features packages.
  // Deduplicate by package name first (same package appears in dist/, .nx/cache/, etc.).
  const seenNames = new Set<string>();
  const uniqueResults = results.filter((r) => {
    if (seenNames.has(r.packageName)) return false;
    seenNames.add(r.packageName);
    return true;
  });
  const domainToPackages = new Map<string, string[]>();
  for (const result of uniqueResults) {
    if (result.issues.some((i) => i.rule === "features/domain-required")) continue;
    const unscopedName = result.packageName.replace(/^@[^/]+\//, "");
    const domainValue = unscopedName.endsWith("-features")
      ? unscopedName.slice(0, -"-features".length)
      : null;
    if (domainValue === null) continue;
    const existing = domainToPackages.get(domainValue) ?? [];
    existing.push(result.packageName);
    domainToPackages.set(domainValue, existing);
  }
  for (const [domainValue, pkgNames] of domainToPackages) {
    if (pkgNames.length > 1) {
      for (const pkgName of pkgNames) {
        const result = results.find((r) => r.packageName === pkgName);
        if (result) {
          result.issues.push({
            rule: "features/domain-unique",
            severity: "error",
            message: `"alistigo.domain" ("${domainValue}") is declared by multiple packages: ${pkgNames.join(", ")}`,
          });
        }
      }
    }
  }

  return results;
}
