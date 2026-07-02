# @alistigo/agent-skill-tester

[![npm version](https://img.shields.io/npm/v/@alistigo/agent-skill-tester.svg?style=flat)](https://www.npmjs.com/package/@alistigo/agent-skill-tester)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue?logo=typescript)](https://www.typescriptlang.org/)
[![CI](https://github.com/alistigo/holos/actions/workflows/ci.yml/badge.svg)](https://github.com/alistigo/holos/actions/workflows/ci.yml)

CLI that evaluates whether an agent skill's trigger description (`SKILL.md`) reliably fires on
the queries it should — and stays silent on the ones it shouldn't.

## How it works

`validate-triggers` reads a labelled `eval_queries.json` file from a skill package, replays each
query through the agent CLI, and watches the streamed output for a `Skill` tool-use event
matching the skill's name. Each query is run multiple times; a query passes when its observed
trigger rate crosses `--threshold` in the direction implied by its `should_trigger` label.

## Requirements

- A `eval_queries.json` file into the package containing the SKILL.

### Temporary requirement

- The `claude` CLI installed, on `PATH`, and **already authenticated with a Claude
  subscription** (Claude Pro/Max/Team login — not an API key).

## Install

```sh
pnpm add -D @alistigo/agent-skill-tester
```

Or run it without installing:

```sh
npx @alistigo/agent-skill-tester validate-triggers <skill-name>
```

## Usage

```sh
agent-skill-tester validate-triggers <skill-name> [options]
```

| Flag | Default | Description |
|------|---------|-------------|
| `--agent, -a` | `claude` | Agent CLI to invoke (only `claude` is currently supported) |
| `--runs, -r` | `3` | Number of times to run each query |
| `--threshold` | `0.5` | Trigger-rate threshold (0.0–1.0) a query must cross to pass |
| `--split` | `all` | Which queries to run: `all`, `train`, or `validation` |
| `--limit, -n` | (all) | Maximum number of queries to run |
| `--debug, -d` | `false` | Show per-run stream events and agent stderr |

Examples:

```sh
agent-skill-tester validate-triggers alistigo-artifact-list-skill
agent-skill-tester validate-triggers my-skill --split train --runs 5
agent-skill-tester validate-triggers my-skill --threshold 0.3 --debug
```

Exits `0` if every query passes, `1` otherwise.

## Current limitations: Only support Claude with subscription (not api)

- **Claude only.** The `--agent` flag exists, but only the `claude` CLI's `stream-json` output
  format is understood today.
- **Local, subscription-based auth only.** The tool shells out to `claude -p ...` and relies on
  an already-authenticated local CLI session. There is no support for `ANTHROPIC_API_KEY` or any
  other headless/API-key auth mode yet — so it **cannot run unattended in CI/CD**.

### Roadmap

- Support for additional agent CLIs.
- API-key-based authentication, to unlock running this in CI/CD pipelines instead of only on a
  developer machine with an interactive Claude subscription.

## Build

```sh
nx run agent-skill-tester:build
```
