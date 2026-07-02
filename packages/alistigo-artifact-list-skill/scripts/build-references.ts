/**
 * Copies the format specs this skill documents from their source-of-truth packages
 * into references/ so the skill never hand-maintains a second copy.
 *
 * Run: bun scripts/build-references.ts
 * Nx:  nx run alistigo-artifact-list-skill:build
 */

import { copyFileSync, mkdirSync } from "node:fs";
import path from "node:path";

const SCRIPT_DIR = path.dirname(new URL(import.meta.url).pathname);
const PKG_DIR = path.resolve(SCRIPT_DIR, "..");
const PACKAGES_DIR = path.resolve(PKG_DIR, "..");
const REFERENCES_DIR = path.join(PKG_DIR, "references");

const SOURCES = [
  {
    from: path.join(PACKAGES_DIR, "alistigo-document-format", "docs", "spec.md"),
    to: path.join(REFERENCES_DIR, "document-format.md"),
  },
  {
    from: path.join(PACKAGES_DIR, "alistigo-artifact-config-list-format", "README.md"),
    to: path.join(REFERENCES_DIR, "artifact-config-list-format.md"),
  },
];

function main(): void {
  mkdirSync(REFERENCES_DIR, { recursive: true });
  for (const { from, to } of SOURCES) {
    copyFileSync(from, to);
    console.log(`Copied ${from} -> ${to}`);
  }
}

main();
