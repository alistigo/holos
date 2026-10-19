import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import type { CalmArchFile, CalmNode } from "./types.js";

/**
 * Node IDs whose core-npm-package is artifact-specific and must be
 * substituted when generating a concrete artifact CALM file.
 * Key = node unique-id, value = package name factory.
 */
const ARTIFACT_SLOTS: Record<string, (name: string) => string> = {
  domain: (name) => `@alistigo/${name}-domain`,
  document: (name) => `@alistigo/${name}-document`,
  ui: (name) => `@alistigo/${name}-components-react`,
  application: (name) => `@alistigo/artifact-${name}`,
  skill: (name) => `@alistigo/artifact-${name}-skill`,
};

function applyArtifactSlots(template: CalmArchFile, artifactName: string): CalmArchFile {
  const nodes: CalmNode[] = template.nodes.map((node) => {
    const factory = ARTIFACT_SLOTS[node["unique-id"]];
    if (factory === undefined) return node;
    return { ...node, "core-npm-package": factory(artifactName) };
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
  await writeFile(resolve(opts.outputPath), JSON.stringify(generated, null, 2) + "\n", "utf-8");
}
