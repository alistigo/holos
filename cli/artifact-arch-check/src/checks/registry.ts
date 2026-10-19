import { alistigoMetadataCheck } from "./alistigo-metadata.js";
import { boundariesCheck } from "./boundaries.js";
import { moduleExistenceCheck } from "./module-existence.js";
import { packageConformanceCheck } from "./package-conformance.js";
import type { CheckContext, CheckDefinition, CheckResult } from "./types.js";

export const ALL_CHECKS: CheckDefinition[] = [
  moduleExistenceCheck,
  boundariesCheck,
  packageConformanceCheck,
  alistigoMetadataCheck,
];

export async function runChecks(ctx: CheckContext, checkIds?: string[]): Promise<CheckResult[]> {
  const checks =
    checkIds !== undefined && checkIds.length > 0
      ? ALL_CHECKS.filter((c) => checkIds.includes(c.id))
      : ALL_CHECKS;
  return Promise.all(checks.map((c) => c.run(ctx)));
}

export type { CheckContext, CheckResult } from "./types.js";
