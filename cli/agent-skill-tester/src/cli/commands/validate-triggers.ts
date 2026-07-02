import { existsSync, readFileSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { Command, Option } from "clipanion";
import { render } from "ink";
import React from "react";
import { type EvalQuery, parseEvalQueries } from "../lib/eval.js";
import { ValidationRunner } from "../ui/ValidationRunner.js";

const DEFAULT_PACKAGE_DIRS = ["packages", "apps", "cli", "libs"];

function isDirectory(path: string): boolean {
  return existsSync(path) && statSync(path).isDirectory();
}

export function findWorkspaceRoot(startDir: string): string | undefined {
  let dir = startDir;
  while (dir !== dirname(dir)) {
    if (
      existsSync(join(dir, "pnpm-workspace.yaml")) ||
      existsSync(join(dir, "nx.json")) ||
      hasNpmWorkspaces(join(dir, "package.json"))
    ) {
      return dir;
    }
    dir = dirname(dir);
  }
  return undefined;
}

function hasNpmWorkspaces(packageJsonPath: string): boolean {
  if (!existsSync(packageJsonPath)) return false;
  try {
    const pkg = JSON.parse(readFileSync(packageJsonPath, "utf-8")) as { workspaces?: unknown };
    return pkg.workspaces !== undefined;
  } catch {
    return false;
  }
}

function globsToDirs(globs: string[]): string[] {
  return globs.map((glob) => glob.replace(/\/\*+$/, "")).filter((glob) => !glob.includes("*"));
}

function parsePnpmWorkspaceGlobs(yamlContent: string): string[] {
  const lines = yamlContent.split("\n");
  const startIdx = lines.findIndex((line) => /^packages:\s*$/.test(line.trim()));
  if (startIdx === -1) return [];

  const globs: string[] = [];
  for (let i = startIdx + 1; i < lines.length; i++) {
    const line = lines[i] ?? "";
    const match = /^\s*-\s*['"]?([^'"#]+?)['"]?\s*$/.exec(line);
    if (!match?.[1]) break;
    globs.push(match[1]);
  }
  return globsToDirs(globs);
}

export function getWorkspacePackageDirs(root: string): string[] {
  const pnpmWorkspacePath = join(root, "pnpm-workspace.yaml");
  if (existsSync(pnpmWorkspacePath)) {
    const dirs = parsePnpmWorkspaceGlobs(readFileSync(pnpmWorkspacePath, "utf-8"));
    if (dirs.length > 0) return dirs;
  }

  const packageJsonPath = join(root, "package.json");
  if (existsSync(packageJsonPath)) {
    try {
      const pkg = JSON.parse(readFileSync(packageJsonPath, "utf-8")) as {
        workspaces?: string[] | { packages?: string[] };
      };
      const globs = Array.isArray(pkg.workspaces) ? pkg.workspaces : pkg.workspaces?.packages;
      if (globs && globs.length > 0) return globsToDirs(globs);
    } catch {
      // fall through to defaults
    }
  }

  return DEFAULT_PACKAGE_DIRS;
}

export function resolvePackageDir(input: string, cwd: string): string {
  const asPath = resolve(cwd, input);
  if (isDirectory(asPath)) return asPath;

  const workspaceRoot = findWorkspaceRoot(cwd);
  if (workspaceRoot) {
    const packageDirs = getWorkspacePackageDirs(workspaceRoot);
    for (const dir of packageDirs) {
      const candidate = join(workspaceRoot, dir, input);
      if (isDirectory(candidate)) return candidate;
    }
    throw new Error(
      `Could not resolve '${input}': not a directory at ${asPath}, and no matching package ` +
        `found under ${packageDirs.map((dir) => `${dir}/`).join(", ")} in workspace root ${workspaceRoot}`,
    );
  }

  throw new Error(
    `Could not resolve '${input}': not a directory at ${asPath}, and no monorepo workspace root ` +
      "(pnpm-workspace.yaml / nx.json / package.json workspaces) was found from the current directory",
  );
}

function readSkillName(skillMdPath: string): string {
  const content = readFileSync(skillMdPath, "utf-8");
  const match = /^---\s*\n(?:[\s\S]*?\n)?name:\s*(.+?)(?:\s*\n)/m.exec(content);
  if (!match?.[1]) throw new Error(`Could not find 'name:' field in ${skillMdPath}`);
  return match[1].trim();
}

export class ValidateTriggersCommand extends Command {
  // fallow-ignore-next-line unused-class-member
  static override paths = [["validate-triggers"]];

  // fallow-ignore-next-line unused-class-member
  static override usage = Command.Usage({
    description: "Evaluate whether a skill's description triggers correctly on labelled queries",
    details: `
      Reads eval_queries.json (or the file passed via --queries) from the given skill
      package, runs each query through the specified agent (default: claude), and
      reports per-query trigger rates.

      The package argument accepts a real filesystem path to the skill package. If it
      isn't a path, and the current directory is inside a monorepo (Nx, pnpm workspaces,
      or npm/yarn workspaces), it's treated as a package name and resolved by searching
      the workspace's declared package directories.

      A query passes if its trigger rate is above --threshold for should_trigger:true
      queries, or below it for should_trigger:false queries.

      Exit code 0 if all queries pass, 1 if any fail.
    `,
    examples: [
      [
        "Validate the alistigo-artifact-list-skill by name (resolved via the monorepo workspace)",
        "validate-triggers alistigo-artifact-list-skill",
      ],
      [
        "Validate a skill package by path",
        "validate-triggers packages/alistigo-artifact-list-skill",
      ],
      ["Run only train queries, 5 times each", "validate-triggers my-skill --split train --runs 5"],
      ["Lower pass threshold", "validate-triggers my-skill --threshold 0.3"],
      [
        "Use a queries file outside the package",
        "validate-triggers my-skill --queries ./eval.json",
      ],
    ],
  });

  packageArg = Option.String({ required: true, name: "package" });

  queriesArg = Option.String("--queries,-q", {
    description: "Path to the eval queries JSON file (default: <package>/eval_queries.json)",
    required: false,
  });

  agent = Option.String("--agent,-a", "claude", {
    description: "Agent CLI to use for triggering (currently only 'claude' is supported)",
  });

  runs = Option.String("--runs,-r", "3", {
    description: "Number of times to run each query (computes trigger rate as triggers/runs)",
  });

  threshold = Option.String("--threshold", "0.5", {
    description: "Minimum trigger rate for a should_trigger:true query to pass (0.0–1.0)",
  });

  split = Option.String("--split", "all", {
    description: "Which query split to run: 'all', 'train', or 'validation'",
  });

  debug = Option.Boolean("--debug,-d", false, {
    description: "Show per-run trigger results and agent stderr",
  });

  limit = Option.String("--limit,-n", {
    description: "Maximum number of queries to run (default: all)",
    required: false,
  });

  // fallow-ignore-next-line unused-class-member complexity
  async execute(): Promise<number> {
    const runsCount = parseInt(this.runs, 10);
    const thresholdValue = parseFloat(this.threshold);

    if (Number.isNaN(runsCount) || runsCount < 1) {
      this.context.stderr.write("Error: --runs must be a positive integer\n");
      return 1;
    }
    if (Number.isNaN(thresholdValue) || thresholdValue < 0 || thresholdValue > 1) {
      this.context.stderr.write("Error: --threshold must be a number between 0.0 and 1.0\n");
      return 1;
    }
    if (!["all", "train", "validation"].includes(this.split)) {
      this.context.stderr.write("Error: --split must be 'all', 'train', or 'validation'\n");
      return 1;
    }

    let pkgRoot: string;
    try {
      pkgRoot = resolvePackageDir(this.packageArg, process.cwd());
    } catch (err: unknown) {
      this.context.stderr.write(`Error: ${String(err)}\n`);
      return 1;
    }

    const queriesPath = this.queriesArg
      ? resolve(process.cwd(), this.queriesArg)
      : join(pkgRoot, "eval_queries.json");
    const skillMdPath = join(pkgRoot, "SKILL.md");

    if (!existsSync(queriesPath)) {
      const hint = this.queriesArg
        ? `Error: queries file not found at ${queriesPath}\n`
        : `Error: eval_queries.json not found at ${queriesPath} (pass --queries to use a different file)\n`;
      this.context.stderr.write(hint);
      return 1;
    }
    if (!existsSync(skillMdPath)) {
      this.context.stderr.write(`Error: SKILL.md not found at ${skillMdPath}\n`);
      return 1;
    }

    let queries: EvalQuery[];
    let skillName: string;
    try {
      queries = parseEvalQueries(JSON.parse(readFileSync(queriesPath, "utf-8")), queriesPath);
      skillName = readSkillName(skillMdPath);
    } catch (err: unknown) {
      this.context.stderr.write(`Error reading skill data: ${String(err)}\n`);
      return 1;
    }

    if (this.split !== "all") {
      const filterSplit = this.split as "train" | "validation";
      queries = queries.filter((q) => q.split === filterSplit);
    }

    if (this.limit !== undefined) {
      const limitCount = parseInt(this.limit, 10);
      if (Number.isNaN(limitCount) || limitCount < 1) {
        this.context.stderr.write("Error: --limit must be a positive integer\n");
        return 1;
      }
      queries = queries.slice(0, limitCount);
    }

    if (queries.length === 0) {
      this.context.stderr.write(`No queries found for split '${this.split}'\n`);
      return 1;
    }

    let exitCode = 0;
    const { waitUntilExit } = render(
      React.createElement(ValidationRunner, {
        queries,
        skillName,
        agent: this.agent,
        runs: runsCount,
        threshold: thresholdValue,
        debug: this.debug,
        onComplete: (code) => {
          exitCode = code;
        },
      }),
    );
    await waitUntilExit();
    return exitCode;
  }
}
