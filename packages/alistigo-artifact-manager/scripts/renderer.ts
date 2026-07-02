import { readFileSync } from "node:fs";
import path from "node:path";
import { SKILL_PKG_DIR, TEMPLATE_PATH } from "./paths.ts";
import type { AppSkillData } from "./types.ts";

const MANAGER_TRIGGERS = [
  "Any request to embed an Alistigo list or widget in an HTML artifact",
  "Any mention of `@alistigo/artifact-*` in an HTML context",
];

function relativeSkillPath(appPkgDir: string): string {
  return path.relative(SKILL_PKG_DIR, path.join(appPkgDir, "SKILL.md"));
}

function buildTriggersBlock(apps: AppSkillData[]): string {
  const allTriggers = [...MANAGER_TRIGGERS, ...apps.flatMap((a) => a.triggers)].filter(
    (t, i, arr) => arr.indexOf(t) === i,
  );
  return allTriggers.map((t) => `- ${t}`).join("\n");
}

function buildRoutingTable(apps: AppSkillData[]): string {
  return apps.map((a) => `| \`${a.appName}\` | ${a.description} |`).join("\n");
}

function buildAppGuides(apps: AppSkillData[]): string {
  return apps
    .map((a) => `- [${a.appName}](${relativeSkillPath(a.pkgDir)}) — ${a.description}`)
    .join("\n");
}

function loadTemplate(templatePath: string): string {
  return readFileSync(templatePath, "utf-8");
}

export function renderManagerSkill(apps: AppSkillData[]): string {
  return loadTemplate(TEMPLATE_PATH)
    .replace("{{TRIGGERS_LIST}}", buildTriggersBlock(apps))
    .replace("{{ROUTING_TABLE}}", buildRoutingTable(apps))
    .replace("{{APP_GUIDES}}", buildAppGuides(apps));
}
