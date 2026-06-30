# @alistigo/features

[![npm version](https://img.shields.io/npm/v/@alistigo/features.svg?style=flat)](https://www.npmjs.com/package/@alistigo/features)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue?logo=typescript)](https://www.typescriptlang.org/)
[![CI](https://github.com/alistigo/holos/actions/workflows/ci.yml/badge.svg)](https://github.com/alistigo/holos/actions/workflows/ci.yml)

Behavior specifications for Alistigo AI, written in [Gherkin](https://cucumber.io/docs/gherkin/reference/).

These `.feature` files are the **source of truth for what the app should do**. The runner ([`@alistigo/features-runner-playwright`](../../cli/alistigo-features-runner-playwright/)) reads them and asserts the app conforms. We follow TDD — features are written and reviewed *before* the code that satisfies them.

The package follows the universal conventions of the [`gherkin-features` skill](../../.agents/skills/gherkin-features/SKILL.md). The skill is the source of truth for the structure (organization, tooling, tag categories, glossary sections); this package fills in the Alistigo-specific contents.

## What lives here

```
packages/alistigo-features/
├── features/                 # the .feature files (the actual specs)
│   └── core/                 # one folder per FEATURE GROUP (mirrors @core tag)
├── src/
│   ├── index.ts              # exports FEATURES_DIR + tag types
│   └── tags.ts               # the typed tag taxonomy (Milestone / Group / Capability / …)
├── tools/
│   └── validate.ts           # structural validator (taxonomy + parse + folder/group parity)
├── docs/
│   ├── organization.md       # how features are organized
│   ├── style-guide.md        # how to write a feature
│   ├── tags.md               # the tag taxonomy with descriptions
│   └── glossary.md           # ubiquitous language: Entities / Actors / Actions
├── .prettierrc.json          # Prettier (with prettier-plugin-gherkin)
├── gherklin.config.ts        # Gherkin lint rules
├── biome.json                # Biome config (extends root, ignores .feature)
├── package.json
└── project.json              # Nx targets
```

## Tooling

| Tool | What it does | When it runs |
|------|--------------|--------------|
| [Prettier](https://prettier.io/) + [`prettier-plugin-gherkin`](https://www.npmjs.com/package/prettier-plugin-gherkin) | Formats `.feature` files (indentation, alignment, tag placement) | `pnpm format` / on save |
| [Gherklin](https://github.com/cjmarkham/Gherklin) | Lints `.feature` files (structural rules, naming, duplicates, tag presence) | `pnpm nx qa:lint` |
| `tools/validate.ts` (custom) | Parses every feature with `@cucumber/gherkin` and checks the **tag taxonomy** is respected | `pnpm validate` |
| [Biome](https://biomejs.dev/) | Lints/formats TS/JS in this package only (ignores `features/`) | repo standard |

Why this combination:
- **Biome doesn't speak Gherkin** — Prettier + the gherkin plugin is the most-maintained option in 2026.
- **Gherklin > older `gherkin-lint`** — modern TS/ESM, extensible, actively maintained.
- The custom validator is a tiny TypeScript script that catches what the linter can't: tags that exist in files but aren't in the typed taxonomy. This keeps `src/tags.ts` and the actual `.feature` files in sync.

## Conventions, in three places

| If you want to know… | Read this |
|----------------------|-----------|
| **How features and folders are organized** | [docs/organization.md](docs/organization.md) |
| **How to write a good Gherkin scenario** | [docs/style-guide.md](docs/style-guide.md) |
| **What tags exist and what they mean** | [docs/tags.md](docs/tags.md) |
| **What domain words mean (ubiquitous language)** | [docs/glossary.md](docs/glossary.md) |

The tag taxonomy is also typed in [`src/tags.ts`](src/tags.ts). When you add or rename a tag, update *both* files — the validator enforces it.

## Common Commands

```sh
pnpm format         # format all .feature files with Prettier
pnpm format:check   # check formatting without writing
pnpm nx qa:lint           # Biome (TS) + Gherklin (.feature)
pnpm nx qa:lint:gherkin   # Gherklin only
pnpm validate       # parse every .feature and check the tag taxonomy
pnpm typecheck      # TypeScript check on src/ and tools/
```

Or via Nx from the repo root:

```sh
nx run alistigo-features:lint
nx run alistigo-features:format
nx run alistigo-features:validate
```

## Programmatic access

```ts
import { FEATURES_DIR, MILESTONE_TAGS, isKnownTag } from "@alistigo/features";

// FEATURES_DIR is an absolute path — pass it to a runner.
console.log(FEATURES_DIR);

// MILESTONE_TAGS, CAPABILITY_TAGS, TEST_TYPE_TAGS, SUITE_TAGS, ACTOR_TAGS exported.
console.log(MILESTONE_TAGS);  // ['@m1', '@m2', '@m3', '@m4', '@v1']

// Validate a tag at runtime.
isKnownTag("@m1");  // true
isKnownTag("@made-up");  // false
```

## Contributing a feature

See [docs/organization.md](docs/organization.md) and [docs/style-guide.md](docs/style-guide.md). In short:

1. Pick the group folder (`features/core/`, or a plugin folder once those land).
2. Name the file after the **capability** it covers, kebab-case (`add-element.feature`, `display-list.feature`).
3. Tag the `Feature:` with exactly one milestone tag (`@m1` …), exactly one group tag matching the folder (`@core`), and one or more capability tags (`@capability:element` …).
4. Use only words from [docs/glossary.md](docs/glossary.md) in step text.
5. Write declarative scenarios (business language, not UI selectors).
6. Run `pnpm format && pnpm nx qa:lint && pnpm validate` before committing.
