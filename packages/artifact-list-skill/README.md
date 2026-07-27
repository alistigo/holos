# @alistigo/artifact-list-skill

[![npm version](https://img.shields.io/npm/v/@alistigo/artifact-list-skill.svg?style=flat)](https://www.npmjs.com/package/@alistigo/artifact-list-skill)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

AI agent skill for the `@alistigo/artifact-list` artifact — teaches an LLM when and how to
render an interactive, editable list inside an HTML artifact.

---

## What's in this package

| File | Purpose |
|------|---------|
| `SKILL.md` | Skill definition: frontmatter (name, triggers, description) + AI usage guide |
| `references/document-format.md` | Alistigo document format spec (generated, see below) |
| `references/artifact-config-list-format.md` | List artifact config schema (generated, see below) |

---

## Generated references

The `references/` folder is generated at build time from the source-of-truth format packages
and is **not committed to git**:

- `references/document-format.md` ← `@alistigo/document-format` (`docs/spec.md`)
- `references/artifact-config-list-format.md` ← `@alistigo/artifact-config-list-format` (`README.md`)

Regenerate it with:

```sh
nx run alistigo-artifact-list-skill:build
```

---

## Usage

This package is consumed as an [Agent Skill](https://agentskills.io) — installed (or symlinked
into `.agents/skills/`), an AI agent building Alistigo artifacts picks up `SKILL.md`
automatically to learn when and how to embed `@alistigo/artifact-list`.

See [@alistigo/artifact-manager](../alistigo-artifact-manager/README.md) for the actual
embedding entrypoint this skill documents.
