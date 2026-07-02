/**
 * Generates packages/alistigo-artifact-manager-skill/SKILL.md from the artifact registry
 * and each registered app's own SKILL.md.
 *
 * Run: bun scripts/generate-skill.ts
 * Nx:  nx run alistigo-artifact-manager-skill:generate-skill
 */

import { writeFileSync } from "node:fs";
import { ARTIFACT_REGISTRY } from "@alistigo/artifact-manager";
import { OUTPUT_PATH } from "./paths.ts";
import { renderManagerSkill } from "./renderer.ts";
import { loadAppSkill } from "./skill-loader.ts";
import { buildPackageDirMap } from "./workspace.ts";

function main(): void {
  const packageDirMap = buildPackageDirMap();
  const apps = Object.entries(ARTIFACT_REGISTRY).flatMap(([appName, entry]) => {
    const skill = loadAppSkill(appName, entry.skillPackage, packageDirMap);
    return skill ? [skill] : [];
  });

  const output = renderManagerSkill(apps);
  writeFileSync(OUTPUT_PATH, output, "utf-8");
  console.log(`Generated ${OUTPUT_PATH}`);
}

main();
