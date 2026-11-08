import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { CalmArchFile, CalmNode, CalmRelationship } from "../calm/types.js";
import type { CheckContext } from "./types.js";

export async function createTempRoot(): Promise<string> {
  return mkdtemp(join(tmpdir(), "arch-check-test-"));
}

export async function cleanupRoot(root: string): Promise<void> {
  await rm(root, { recursive: true, force: true });
}

export async function writePackageJson(
  root: string,
  pkgName: string,
  content: Record<string, unknown>,
  subdir = "packages",
): Promise<void> {
  const name = pkgName.replace(/^@[^/]+\//, "");
  const dir = join(root, subdir, name);
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, "package.json"), JSON.stringify(content));
}

export async function writeEmptyDir(
  root: string,
  pkgName: string,
  subdir = "packages",
): Promise<void> {
  const name = pkgName.replace(/^@[^/]+\//, "");
  await mkdir(join(root, subdir, name), { recursive: true });
}

export async function writeAlistigoSchema(root: string): Promise<void> {
  const dir = join(root, "packages", "architecture", "extensions");
  await mkdir(dir, { recursive: true });
  await writeFile(
    join(dir, "alistigo-package-metadata.schema.json"),
    JSON.stringify({
      properties: {
        type: {
          enum: [
            "domain",
            "application",
            "document",
            "presentation",
            "infrastructure",
            "plugin",
            "skill",
            "tool",
          ],
        },
      },
    }),
  );
}

export function makeContext(
  root: string,
  calmFile: CalmArchFile,
  artifactName = "myart",
): CheckContext {
  return {
    artifactName,
    calmFile,
    calmFilePath: join(root, "arch.calm.json"),
    workspaceRoot: root,
  };
}

export function makeCalmFile(
  nodes: CalmNode[],
  relationships: CalmRelationship[] = [],
): CalmArchFile {
  return {
    $schema: "https://calm.finos.org/release/1.2/meta/calm.json",
    "unique-id": "test-arch",
    name: "Test Architecture",
    description: "Test",
    nodes,
    relationships,
  };
}

export function node(id: string, overrides: Partial<CalmNode> = {}): CalmNode {
  return {
    "unique-id": id,
    "node-type": "module",
    name: id,
    description: "",
    ...overrides,
  };
}

export function connects(id: string, sourceId: string, destId: string): CalmRelationship {
  return {
    "unique-id": id,
    description: "",
    "relationship-type": {
      connects: {
        source: { node: sourceId },
        destination: { node: destId },
      },
    },
  };
}
