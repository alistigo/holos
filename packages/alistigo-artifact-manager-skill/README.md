# @alistigo/artifact-manager-skill

[![npm version](https://img.shields.io/npm/v/@alistigo/artifact-manager-skill.svg?style=flat)](https://www.npmjs.com/package/@alistigo/artifact-manager-skill)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

AI agent skill for `@alistigo/artifact-manager` — teaches an LLM to always route through the
manager as the entrypoint for embedding any Alistigo widget in an HTML artifact, instead of
loading individual artifact bundles directly.

---

## `SKILL.md` is generated

`SKILL.md` in this package is **not written by hand**. It's generated from the artifact
registry in `@alistigo/artifact-manager` (`src/registry.ts`) plus each registered app's own
skill (e.g. `@alistigo/artifact-list-skill`), so the routing table and triggers always reflect
what's actually registered. It's gitignored — not committed to git.

Regenerate it with:

```sh
nx run alistigo-artifact-manager:generate-skill
# or, equivalently:
nx run alistigo-artifact-manager-skill:build
```

---

## Usage

This package is consumed as an [Agent Skill](https://agentskills.io) — installed (or symlinked
into `.agents/skills/`), an AI agent picks up `SKILL.md` automatically to learn to always load
`@alistigo/artifact-manager` as the entrypoint for embedding Alistigo widgets.

See [@alistigo/artifact-manager](../alistigo-artifact-manager/README.md) for the full API
reference — config schema, programmatic usage, and error handling.
