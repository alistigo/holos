/**
 * Generates packages/alistigo-artifact-manager/SKILL.md from the artifact registry
 * and each registered app's own SKILL.md.
 *
 * Run: bun scripts/generate-skill.ts
 * Nx:  nx run alistigo-artifact-manager:generate-skill
 */

import { writeFileSync } from "node:fs";
import { ARTIFACT_REGISTRY } from "../src/registry.ts";
import { OUTPUT_PATH } from "./paths.ts";
import { loadAppSkill } from "./skill-loader.ts";
import { renderManagerSkill } from "./renderer.ts";
import { buildPackageDirMap } from "./workspace.ts";

function main(): void {
  const packageDirMap = buildPackageDirMap();
  const apps = Object.keys(ARTIFACT_REGISTRY).flatMap((appName) => {
    const skill = loadAppSkill(appName, packageDirMap);
    return skill ? [skill] : [];
  });

  const output = renderManagerSkill(apps);
  writeFileSync(OUTPUT_PATH, output, "utf-8");
  console.log(`Generated ${OUTPUT_PATH}`);
}

main();
