import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import type { CalmArchFile, CalmNode } from "./types.js";

/** Resolve `{domain}` in a `package-name` pattern and return the full scoped name. */
function resolvePackageName(pattern: string, artifactName: string): string {
  return `@alistigo/${pattern.replace(/\{domain\}/g, artifactName)}`;
}

/**
 * Produce a per-artifact CALM file for visualization (archify).
 * Nodes with a `package-name` get their `core-npm-package` set to the resolved
 * implementation name so archify can display the correct package label.
 * The original `core-npm-package` (the mandatory base dep) is preserved under
 * `base-npm-package` for documentation purposes.
 */
function applyArtifactSlots(template: CalmArchFile, artifactName: string): CalmArchFile {
  const nodes: CalmNode[] = template.nodes.map((node) => {
    const pattern = node["package-name"];
    if (pattern === undefined) return node;
    const resolved = resolvePackageName(pattern, artifactName);
    return {
      ...node,
      "core-npm-package": resolved,
    };
  });

  return {
    ...template,
    "unique-id": `${artifactName}-artifact-module-composition`,
    name: `${artifactName} artifact — module composition`,
    description: `Module composition and dependency boundaries for the ${artifactName} artifact. Generated from the canonical alistigo-artifact-module-composition template.`,
    nodes,
  };
}

export async function generateArtifactCalmFile(opts: {
  artifactName: string;
  templatePath: string;
  outputPath: string;
}): Promise<void> {
  const templateContent = await readFile(resolve(opts.templatePath), "utf-8");
  const template = JSON.parse(templateContent) as CalmArchFile;
  const generated = applyArtifactSlots(template, opts.artifactName);
  await writeFile(resolve(opts.outputPath), `${JSON.stringify(generated, null, 2)}\n`, "utf-8");
}
