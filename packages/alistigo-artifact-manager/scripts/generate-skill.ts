/**
 * Generates packages/alistigo-artifact-manager/SKILL.md from the artifact registry
 * and each registered app's own SKILL.md.
 *
 * Run: bun scripts/generate-skill.ts
 * Nx:  nx run alistigo-artifact-manager:generate-skill
 */

import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { parse as parseYaml } from "yaml";
import { ARTIFACT_REGISTRY } from "../src/registry.ts";

const SCRIPT_DIR = path.dirname(new URL(import.meta.url).pathname);
const PKG_DIR = path.resolve(SCRIPT_DIR, "..");
const PACKAGES_DIR = path.resolve(PKG_DIR, "..");
const OUTPUT_PATH = path.join(PKG_DIR, "SKILL.md");

interface AppFrontmatter {
  app?: string;
  description?: string;
  triggers?: string[];
  [key: string]: unknown;
}

interface AppSkillData {
  appName: string;
  pkgDir: string;
  description: string;
  triggers: string[];
}

function buildPackageDirMap(): Map<string, string> {
  const map = new Map<string, string>();
  const entries = readdirSync(PACKAGES_DIR, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const pkgJsonPath = path.join(PACKAGES_DIR, entry.name, "package.json");
    if (!existsSync(pkgJsonPath)) continue;
    try {
      const json = JSON.parse(readFileSync(pkgJsonPath, "utf-8")) as {
        name?: string;
      };
      if (json.name) {
        map.set(json.name, path.join(PACKAGES_DIR, entry.name));
      }
    } catch {
      // malformed package.json — skip
    }
  }
  return map;
}

function parseFrontmatter(content: string): AppFrontmatter {
  const lines = content.split("\n");
  if (lines[0]?.trim() !== "---") return {};
  const closeIdx = lines.findIndex((l, i) => i > 0 && l.trim() === "---");
  if (closeIdx === -1) return {};
  const frontmatterText = lines.slice(1, closeIdx).join("\n");
  return (parseYaml(frontmatterText) as AppFrontmatter) ?? {};
}

function loadAppSkill(
  appName: string,
  packageDirMap: Map<string, string>,
): AppSkillData | null {
  const pkgDir = packageDirMap.get(appName);
  if (!pkgDir) {
    process.stderr.write(
      `warn: no local package found for "${appName}" — skipping\n`,
    );
    return null;
  }

  const skillPath = path.join(pkgDir, "SKILL.md");
  if (!existsSync(skillPath)) {
    process.stderr.write(
      `warn: no SKILL.md found for "${appName}" at ${skillPath} — skipping triggers\n`,
    );
    return {
      appName,
      pkgDir,
      description: "see package README",
      triggers: [],
    };
  }

  const content = readFileSync(skillPath, "utf-8");
  const fm = parseFrontmatter(content);

  return {
    appName,
    pkgDir,
    description: String(fm.description ?? "").trim(),
    triggers: Array.isArray(fm.triggers)
      ? (fm.triggers as string[])
      : [],
  };
}

function relativeSkillPath(appPkgDir: string): string {
  return path.relative(PKG_DIR, path.join(appPkgDir, "SKILL.md"));
}

const MANAGER_TRIGGERS = [
  "Any request to embed an Alistigo list or widget in an HTML artifact",
  "Any mention of `@alistigo/artifact-*` in an HTML context",
];

function renderManagerSkill(apps: AppSkillData[]): string {
  const allTriggers = [
    ...MANAGER_TRIGGERS,
    ...apps.flatMap((a) => a.triggers),
  ].filter((t, i, arr) => arr.indexOf(t) === i);

  const triggersBlock = allTriggers.map((t) => `- ${t}`).join("\n");

  const routingRows = apps
    .map((a) => `| \`${a.appName}\` | ${a.description} |`)
    .join("\n");

  const appGuides = apps
    .map((a) => `- [${a.appName}](${relativeSkillPath(a.pkgDir)}) — ${a.description}`)
    .join("\n");

  return `<!-- GENERATED FILE — do not edit manually.
     Source: packages/alistigo-artifact-manager/scripts/generate-skill.ts
     Re-generate: nx run alistigo-artifact-manager:generate-skill -->
---
name: alistigo-artifact-manager
description: >
  Use @alistigo/artifact-manager as the entrypoint whenever building an HTML artifact
  that embeds an Alistigo widget. Preferred over loading individual artifact bundles directly.
metadata:
  type: embedding
  generated: true
---

# @alistigo/artifact-manager — AI usage guide

## When to use

Use this package as the entrypoint for **every** HTML page or Claude artifact that embeds
an Alistigo widget. It handles config validation, mount-target creation, and artifact
injection — AI code should not call individual artifact bundles directly.

**Triggers:**
${triggersBlock}

## Which app to use

| App | Use when |
|-----|----------|
${routingRows}

## Minimal snippet

\`\`\`html
<script src="https://cdn.jsdelivr.net/npm/@alistigo/artifact-manager@0/dist/index.umd.js"></script>
<script id="alistigo-manager-config" type="application/json">
{
  "app": "@alistigo/artifact-list"
}
</script>
\`\`\`

- No \`<div id="app">\` needed — created automatically if absent
- The config tag is **required**; omitting it renders an error banner
- \`lang\` is optional; omit it unless you have a specific locale requirement

## Config fields (manager-level)

| Field | Required | Type | Description |
|-------|----------|------|-------------|
| \`app\` | **Yes** | \`string\` | Artifact package name, e.g. \`"@alistigo/artifact-list"\` |
| \`lang\` | No | \`string\` | BCP-47 language code, e.g. \`"nl"\` |

App-specific config fields are documented in each app's SKILL.md (see below).

## Rules for AI-generated artifacts

1. Always load \`@alistigo/artifact-manager\` — never load \`@alistigo/artifact-list\` directly
2. The config tag \`id\` must be exactly \`alistigo-manager-config\`
3. The config tag \`type\` must be \`application/json\`
4. Only \`app\` is required in the config; do not add fields that are not in the schema
5. Do NOT use \`<iframe src="...">\` with external URLs — Claude CSP blocks them

## App-specific guides

${appGuides}

## Full reference

See [README.md](./README.md) for complete examples including pre-seeded documents and
programmatic API usage.
`;
}

function main(): void {
  const packageDirMap = buildPackageDirMap();
  const apps: AppSkillData[] = [];

  for (const appName of Object.keys(ARTIFACT_REGISTRY)) {
    const skill = loadAppSkill(appName, packageDirMap);
    if (skill) apps.push(skill);
  }

  const output = renderManagerSkill(apps);
  writeFileSync(OUTPUT_PATH, output, "utf-8");
  console.log(`Generated ${OUTPUT_PATH}`);
}

main();
