import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { parse as parseYaml } from "yaml";
import type { AppFrontmatter, AppSkillData } from "./types.ts";

function parseFrontmatter(content: string): AppFrontmatter {
  const lines = content.split("\n");
  if (lines[0]?.trim() !== "---") return {};
  const closeIdx = lines.findIndex((l, i) => i > 0 && l.trim() === "---");
  if (closeIdx === -1) return {};
  const frontmatterText = lines.slice(1, closeIdx).join("\n");
  return (parseYaml(frontmatterText) as AppFrontmatter) ?? {};
}

function skillFromFrontmatter(appName: string, pkgDir: string, content: string): AppSkillData {
  const fm = parseFrontmatter(content);
  return {
    appName,
    pkgDir,
    description: String(fm.description ?? "").trim(),
    triggers: Array.isArray(fm.triggers) ? (fm.triggers as string[]) : [],
  };
}

export function loadAppSkill(
  appName: string,
  packageDirMap: Map<string, string>,
): AppSkillData | null {
  const pkgDir = packageDirMap.get(appName);
  if (!pkgDir) {
    process.stderr.write(`warn: no local package found for "${appName}" — skipping\n`);
    return null;
  }

  const skillPath = path.join(pkgDir, "SKILL.md");
  if (!existsSync(skillPath)) {
    process.stderr.write(
      `warn: no SKILL.md found for "${appName}" at ${skillPath} — skipping triggers\n`,
    );
    return { appName, pkgDir, description: "see package README", triggers: [] };
  }

  return skillFromFrontmatter(appName, pkgDir, readFileSync(skillPath, "utf-8"));
}
