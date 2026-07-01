import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { Command, Option } from "clipanion";
import { render } from "ink";
import React from "react";
import type { EvalQuery } from "../lib/eval.js";
import { ValidationRunner } from "../ui/ValidationRunner.js";

function findWorkspaceRoot(startDir: string): string {
  let dir = startDir;
  while (dir !== dirname(dir)) {
    if (existsSync(join(dir, "nx.json"))) return dir;
    dir = dirname(dir);
  }
  throw new Error("Could not find workspace root (nx.json not found in any parent directory)");
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
      Reads eval_queries.json from the given skill package, runs each query through
      the specified agent (default: claude), and reports per-query trigger rates.

      A query passes if its trigger rate is above --threshold for should_trigger:true
      queries, or below it for should_trigger:false queries.

      Exit code 0 if all queries pass, 1 if any fail.
    `,
    examples: [
      [
        "Validate the alistigo-artifact-list-skill",
        "validate-triggers alistigo-artifact-list-skill",
      ],
      ["Run only train queries, 5 times each", "validate-triggers my-skill --split train --runs 5"],
      ["Lower pass threshold", "validate-triggers my-skill --threshold 0.3"],
    ],
  });

  packageName = Option.String({ required: true, name: "package-name" });

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

    let workspaceRoot: string;
    try {
      workspaceRoot = findWorkspaceRoot(process.cwd());
    } catch (err: unknown) {
      this.context.stderr.write(`Error: ${String(err)}\n`);
      return 1;
    }

    const pkgRoot = join(workspaceRoot, "packages", this.packageName);
    const queriesPath = join(pkgRoot, "eval_queries.json");
    const skillMdPath = join(pkgRoot, "SKILL.md");

    if (!existsSync(queriesPath)) {
      this.context.stderr.write(`Error: eval_queries.json not found at ${queriesPath}\n`);
      return 1;
    }
    if (!existsSync(skillMdPath)) {
      this.context.stderr.write(`Error: SKILL.md not found at ${skillMdPath}\n`);
      return 1;
    }

    let queries: EvalQuery[];
    let skillName: string;
    try {
      queries = JSON.parse(readFileSync(queriesPath, "utf-8")) as EvalQuery[];
      skillName = readSkillName(skillMdPath);
    } catch (err: unknown) {
      this.context.stderr.write(`Error reading skill data: ${String(err)}\n`);
      return 1;
    }

    if (this.split !== "all") {
      const filterSplit = this.split as "train" | "validation";
      queries = queries.filter((q) => q.split === filterSplit);
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
        onComplete: (code) => {
          exitCode = code;
        },
      }),
    );
    await waitUntilExit();
    return exitCode;
  }
}
