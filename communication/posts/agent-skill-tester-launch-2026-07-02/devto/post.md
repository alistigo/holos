---
status: draft
channel: devto
createdAt: 2026-07-02
publishedAt:
url:
tags: ai, cli, testing, typescript
---

# Testing whether your agent skill descriptions actually trigger

Agent CLIs like Claude Code decide whether to invoke a "skill" based on a short
natural-language `description` field in its `SKILL.md`. That description gets matched
against whatever the user just typed. It either fires on the queries it should — and
stays quiet on the ones it shouldn't — or it doesn't, and you usually only find out by
using it and noticing something silently failed to trigger.

There wasn't a way to measure that reliability directly, so I built
[`@alistigo/agent-skill-tester`](https://www.npmjs.com/package/@alistigo/agent-skill-tester),
a CLI with one command: `validate-triggers`.

## How it works

`validate-triggers` reads a labelled `eval_queries.json` file from a skill package,
replays each query through the agent CLI, and watches the streamed output for a
`Skill` tool-use event matching the skill's name. Each query runs multiple times; a
query passes when its observed trigger rate crosses a `--threshold` in the direction
implied by its `should_trigger` label.

Concretely: for each query in the eval set, it shells out to `claude -p` in
`stream-json` output mode, counts how many of N runs actually emit a `Skill` tool-use
event for the skill under test, and compares the observed rate against the threshold —
in the direction the query claims it should go.

## The eval queries schema

`eval_queries.json` is a JSON array of `{ query, should_trigger, split }` objects. A
machine-readable [JSON Schema](https://json-schema.org/) ships with the package at
`dist/schemas/eval-queries.schema.json`. Since the file's root is an array (which can't
carry an inline `"$schema"` key), you map it via your editor's schema settings instead
— for VS Code, in `.vscode/settings.json`:

```json
{
  "json.schemas": [
    {
      "fileMatch": ["eval_queries.json"],
      "url": "./node_modules/@alistigo/agent-skill-tester/dist/schemas/eval-queries.schema.json"
    }
  ]
}
```

## Usage

```sh
agent-skill-tester validate-triggers <package> [options]
```

`<package>` accepts either a real filesystem path to the skill package, or a bare
package name if the current directory is inside a monorepo (Nx, pnpm workspaces, or
npm/yarn workspaces) — it's resolved by searching the workspace's declared package
directories (e.g. `apps/*`, `packages/*`, `cli/*`).

| Flag | Default | Description |
|------|---------|-------------|
| `--queries, -q` | `<package>/eval_queries.json` | Path to the eval queries JSON file |
| `--agent, -a` | `claude` | Agent CLI to invoke (only `claude` is currently supported) |
| `--runs, -r` | `3` | Number of times to run each query |
| `--threshold` | `0.5` | Trigger-rate threshold (0.0–1.0) a query must cross to pass |
| `--split` | `all` | Which queries to run: `all`, `train`, or `validation` |
| `--limit, -n` | (all) | Maximum number of queries to run |
| `--debug, -d` | `false` | Show per-run stream events and agent stderr |

```sh
agent-skill-tester validate-triggers alistigo-artifact-list-skill
agent-skill-tester validate-triggers packages/alistigo-artifact-list-skill
agent-skill-tester validate-triggers my-skill --split train --runs 5
agent-skill-tester validate-triggers my-skill --threshold 0.3 --debug
agent-skill-tester validate-triggers my-skill --queries ./eval.json
```

Exits `0` if every query passes, `1` otherwise — so it slots into a normal shell
pipeline or CI step once the auth limitation below is solved.

## What building the eval set actually surfaced

The useful part wasn't the CLI itself — it was being forced to write down, explicitly,
which queries a skill *should* and *shouldn't* catch, with a `train`/`validation`
split so I couldn't just tune the description against the same queries I was grading
it with. A couple of queries I assumed would obviously trigger didn't, on the first
run. That's the failure mode this tool exists to catch: a description that reads fine
to a human but doesn't actually match the model's behavior.

## Current limitations

- **Claude only.** The `--agent` flag exists, but only the `claude` CLI's
  `stream-json` output format is understood today.
- **Local, subscription-based auth only.** The tool shells out to `claude -p ...` and
  relies on an already-authenticated local CLI session. There's no support for
  `ANTHROPIC_API_KEY` or any other headless/API-key auth mode yet — so it **cannot run
  unattended in CI/CD** right now.

Roadmap: support for additional agent CLIs, and API-key-based authentication so this
can run as an actual CI gate instead of only on a developer machine with an
interactive Claude subscription.

## Install

```sh
pnpm add -D @alistigo/agent-skill-tester
```

Or without installing:

```sh
npx @alistigo/agent-skill-tester validate-triggers <skill-name>
```

Source: [github.com/alistigo/holos](https://github.com/alistigo/holos), under
`cli/agent-skill-tester`.
