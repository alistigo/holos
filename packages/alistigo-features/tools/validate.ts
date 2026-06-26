#!/usr/bin/env bun
/**
 * Structural validation pass for the features package.
 *
 * Complements the Gherklin linter and Prettier formatter:
 * - Parses every `.feature` with the official Gherkin parser (catches syntax
 *   errors the linter might miss).
 * - Checks that every tag used in the package is part of the typed taxonomy
 *   in `src/tags.ts`.
 * - Checks that every Feature has at least one milestone tag.
 *
 * Exits non-zero on the first failure. Designed to be cheap enough to run on
 * every commit.
 */

import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { AstBuilder, GherkinClassicTokenMatcher, Parser } from "@cucumber/gherkin";
import { IdGenerator } from "@cucumber/messages";
import { ALL_TAGS, GROUP_TAGS, isKnownTag, MILESTONE_TAGS } from "../src/tags.ts";

const FEATURES_DIR = path.resolve(import.meta.dir, "..", "features");

type Failure = { file: string; reason: string };
const failures: Failure[] = [];

async function findFeatureFiles(dir: string): Promise<string[]> {
  const out: string[] = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await findFeatureFiles(full)));
    else if (entry.isFile() && entry.name.endsWith(".feature")) out.push(full);
  }
  return out;
}

async function validate(file: string): Promise<void> {
  const source = await readFile(file, "utf8");
  const parser = new Parser(new AstBuilder(IdGenerator.uuid()), new GherkinClassicTokenMatcher());

  let doc: ReturnType<Parser["parse"]>;
  try {
    doc = parser.parse(source);
  } catch (err) {
    failures.push({ file, reason: `parse error: ${(err as Error).message}` });
    return;
  }

  const feature = doc.feature;
  if (!feature) {
    failures.push({ file, reason: "file has no Feature: header" });
    return;
  }

  const featureTags = feature.tags.map((t) => t.name);
  const allTags = new Set<string>(featureTags);
  for (const child of feature.children) {
    if (child.scenario) for (const t of child.scenario.tags) allTags.add(t.name);
  }

  // Every Feature must declare exactly one milestone tag.
  const milestones = featureTags.filter((t) => (MILESTONE_TAGS as readonly string[]).includes(t));
  if (milestones.length === 0) {
    failures.push({
      file,
      reason: `no milestone tag — expected one of ${MILESTONE_TAGS.join(", ")}`,
    });
  } else if (milestones.length > 1) {
    failures.push({ file, reason: `multiple milestone tags: ${milestones.join(", ")}` });
  }

  // Every Feature must declare exactly one group tag, and it must match the
  // immediate parent folder under features/.
  const groups = featureTags.filter((t) => (GROUP_TAGS as readonly string[]).includes(t));
  if (groups.length === 0) {
    failures.push({ file, reason: `no group tag — expected one of ${GROUP_TAGS.join(", ")}` });
  } else if (groups.length > 1) {
    failures.push({ file, reason: `multiple group tags: ${groups.join(", ")}` });
  } else {
    const expectedGroup = `@${path.basename(path.dirname(file))}`;
    if (groups[0] !== expectedGroup) {
      failures.push({
        file,
        reason: `group tag ${groups[0]} does not match folder ${expectedGroup}`,
      });
    }
  }

  // Every tag in the file must be in the taxonomy.
  for (const tag of allTags) {
    if (!isKnownTag(tag)) {
      failures.push({
        file,
        reason: `unknown tag "${tag}" — add it to src/tags.ts and docs/tags.md, or remove it`,
      });
    }
  }
}

const files = await findFeatureFiles(FEATURES_DIR);
if (files.length === 0) {
  console.error(`No .feature files found in ${FEATURES_DIR}`);
  process.exit(1);
}

await Promise.all(files.map(validate));

if (failures.length > 0) {
  console.error(`\nFAIL — ${failures.length} issue(s):\n`);
  for (const { file, reason } of failures) {
    console.error(`  ${path.relative(process.cwd(), file)}`);
    console.error(`    ${reason}\n`);
  }
  process.exit(1);
}

console.log(`OK — ${files.length} feature file(s) validated, ${ALL_TAGS.length} tags in taxonomy`);
