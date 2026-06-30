---
name: gherkin-features
description: BDD via Gherkin — universal conventions for a `<project>-features` package. Covers folder organization (by group, not milestone), tag taxonomy structure, glossary structure (Entities / Actors / Actions), tooling (Prettier+plugin / Gherklin / custom validator), and the writing style guide. INVOKE WHEN scaffolding or refactoring a Gherkin features package, when adding `.feature` files to such a package, or when the user mentions "feature files", "Gherkin", "BDD", "scenario", "step definitions", or asks to organize behavior specs.
---

# Gherkin Features Package — Universal Conventions

Every project that uses Gherkin/BDD in this repo lives in a dedicated `<project>-features` package, scaffolded the same way. **The structure is universal across projects; only the content (tags, glossary, features) changes per project.**

This skill gives you the universal parts: folder layout, tag-taxonomy structure, glossary structure, tooling, and the style guide.

The first project to use this convention is `packages/alistigo-features/` — keep it as a reference when ambiguous.

---

## When to use this skill

- A user asks to set up a BDD / behavior-spec package for a new project.
- A user wants to add `.feature` files to an existing project that should follow these conventions.
- A user is reviewing or refactoring features and uses words like "scenario", "Gherkin", "step", "tag", "glossary".
- A user invokes BDD/TDD methodology and the project already follows these conventions.

If the project does **not** want a separate features package (e.g. tiny script, prototype), do not force this skill on them — link to it instead.

---

## Output: a `<project>-features` package

```
packages/<project>-features/
├── package.json
├── project.json                  # Nx targets: build, typecheck, lint, lint:gherkin, format, format:check, validate
├── tsconfig.json                 # extends ../../tsconfig.base.json
├── biome.json                    # extends root, ignores `features/`
├── .prettierrc.json              # configures prettier-plugin-gherkin
├── .prettierignore               # restricts prettier to *.feature files only
├── gherklin.config.ts            # gherklin lint rules
├── README.md                     # package overview, tooling, conventions
│
├── docs/
│   ├── organization.md           # PORTABLE — copy from this skill
│   ├── style-guide.md            # PORTABLE — copy from this skill
│   ├── tags.md                   # PROJECT-SPECIFIC — must exist
│   └── glossary.md               # PROJECT-SPECIFIC — must exist
│
├── src/
│   ├── index.ts                  # exports FEATURES_DIR + tag types
│   └── tags.ts                   # PROJECT-SPECIFIC typed tag taxonomy
│
├── tools/
│   └── validate.ts               # parses every .feature, enforces tag taxonomy
│
└── features/
    ├── <group-1>/                # ONE FOLDER PER FEATURE GROUP (not per milestone)
    │   ├── README.md
    │   └── *.feature
    └── <group-2>/
        └── *.feature
```

---

## The four hard rules

1. **Folders are groups, not milestones.** `features/core/`, `features/<plugin-name>/`, `features/<area>/` — never `features/m1-…/`. Milestones are tags. Groups are folders.
2. **Every features package has a `tags.md` AND a `glossary.md`.** No exceptions. The validator script checks both exist.
3. **Glossary is split into Entities / Actors / Actions** — three top-level sections, in that order. Entities have **definitions** AND **rules**.
4. **Step text must use only words defined in the glossary.** No paraphrasing, no synonyms. The glossary is the contract.

---

## Folder organization

### Groups, not milestones

A group is a cohesive set of capabilities — usually a domain area, a sub-product, or a plugin scope.

| Universal | Project-specific examples |
|-----------|----------------------------|
| `features/core/` | the foundational app — always present |
| `features/<plugin>/` | per-plugin feature group when plugins are added |
| `features/<area>/` | a non-plugin domain area (admin, settings, etc.) |

If a feature crosses groups, pick the group that owns the *behavior under test*, and tag the scenario with the secondary group via a capability tag.

### File naming

- `kebab-case.feature` — lowercase, hyphens.
- Verb-first when describing an action: `add-element.feature`, `delete-element.feature`.
- Noun-first when describing display/state: `display-list.feature`, `empty-state.feature`.
- Two or three words. Anything longer is probably two capabilities — split.

### Inside a group folder

Each group has a `README.md` linking the files and stating what's in scope for that group.

---

## Tag taxonomy — five categories

The set of tags is **typed** in `src/tags.ts` and **documented** in `docs/tags.md`. The validator (`pnpm validate`) enforces parity.

| Category | Required? | Where applied | Purpose |
|----------|-----------|---------------|---------|
| **Milestone** | yes — exactly one | Feature-level | Which milestone (`@m1`, `@m2`, …, `@v1`) |
| **Group** | yes — exactly one | Feature-level | Which feature group (`@core`, `@<plugin>`, …) — mirrors the folder |
| **Capability** | yes — at least one | Feature-level | What the app does (`@capability:list`, `@capability:element`, …) |
| **Test type** | optional, ≤1 | Scenario-level | `@happy-path` / `@edge-case` / `@error-path` |
| **Suite** | optional, any | Scenario-level | `@smoke` / `@regression` / `@wip` |
| **Actor** | optional, ≤1 | Either | `@actor:user` / `@actor:ai` / `@actor:host` (project may extend) |

The Group tag matches the folder name — this is intentional redundancy that makes scenarios discoverable both by directory traversal and tag query.

---

## Glossary structure — three sections

`docs/glossary.md` ALWAYS has these three top-level sections, in this order:

### 1. Entities

Things stored in the data layer. **Each entity has:**

- **Definition** — one paragraph; what is it, what role does it play.
- **Rules** — bullet list of domain invariants (must always be true). At least one rule per entity. If you can't think of a rule, you haven't defined the entity well enough.

Example:

```markdown
### List
A collection of Elements. The fundamental container of the app.

**Rules:**
- A List has zero or more Elements
- A List has a name
- Elements have an internal order; this order is preserved across reads
- The internal order is NOT semantically meaningful in the base list (but always present)
```

### 2. Actors

Who triggers scenarios. Most projects start with just `User`. Add Actors as the system grows (AI, Host, System, …).

For each Actor, one paragraph describing who they are and the kind of action they take.

### 3. Actions

The verbs that may appear in step text. Each action lists:
- The verb
- A one-line meaning
- The canonical step phrasings that use it (so reusing them is mechanical)

```markdown
| Verb | Means |
|------|-------|
| **add** | Append an element to a list |
| **delete** | Remove an element by identity |
| **reload** | Force a re-boot of the app |
```

Then a "Canonical phrasings" sub-section listing the exact `Given/When/Then` strings to copy verbatim.

---

## Style guide

**Five rules that matter:**

1. **Declarative, not imperative.** Describe *what* should happen, never *how*.
   - ✅ `When I add "Buy bread"`
   - ❌ `When I type "Buy bread" into #new-element-input and click .add-btn`
2. **Use only glossary words.** New domain word → add it to the glossary first.
3. **Tables for collections, implicit nouns** (see "Collection step style" below).
4. **One scenario, one outcome.** Multiple `Then`s OK; multiple unrelated assertions = two scenarios pretending to be one.
5. **Keep scenarios short.** Anything over ~10 lines is usually two scenarios.

### Collection step style

When an Entity is a collection (a List of Elements, a Cart of LineItems, …), use these patterns universally — they scale 1 → N without changing shape and read closer to natural language:

**Rule A — Tables for collection setup, even for one row.** A headerless one-column table is the canonical setup form when the column carries the obvious entity attribute (e.g. an Element's text). Add a header only if the row has more than one column.

```gherkin
# ❌ avoid (mixes two phrasings)
Given a list with element "Buy bread"
Given a list with elements:
  | text      |
  | Buy bread |
  | Call mom  |

# ✅ prefer (one phrasing, scales 1 → N)
Given a list:
  | Buy bread |

Given a list:
  | Buy bread |
  | Call mom  |
```

**Rule B — Drop the entity noun where the verb makes it unambiguous.** The Element is implied by the operation; spelling it out adds noise.

| ❌ Verbose | ✅ Implicit |
|-----------|------------|
| `When I add an element "Buy bread"` | `When I add "Buy bread"` |
| `When I delete the element "Buy bread"` | `When I delete "Buy bread"` |
| `Then the list should contain the element "Buy bread"` | `Then the list should contain "Buy bread"` |

Keep the noun **only** when it disambiguates — primarily in count assertions (`Then the list should contain N occurrences of "X"`).

**Rule C — Prefer full-state assertions over count-only.** Replace `Then the list should contain N elements` with `Then the list should be:` + a headerless table; the table form asserts strictly more (values *and* count) with no extra noise.

```gherkin
# ❌ avoid (weak)
Then the list should contain 2 elements

# ✅ prefer (strict, multiset)
Then the list should be:
  | Buy bread |
  | Call mom  |
```

`Then the list should be:` is a **multiset assertion** when the entity has internal-but-not-semantic order: `[a, b, a]` matches `[a, a, b]`. Document this in the project's glossary if it applies.

**Rule D — Positions appear only as a Gherkin disambiguator** (`row N`) when duplicates make identity ambiguous. They are never visible to the User in the rendered UI, and they are never used elsewhere in step text.

**Rule E — Use the User's mental model in step text, not the implementation.** A User opens, reads, and reloads the *list* — not the *iframe*, *web view*, *DOM*, or any other implementation noun. Implementation terms belong in architecture docs, never in step text.

| ❌ Implementation term | ✅ Domain term |
|------------------------|------------------|
| `When I reload the iframe` | `When I reload the list` |
| `Then the iframe should show "X"` | `Then the list should contain "X"` |
| `Given the page is loaded` | `Given an empty list` (or whatever the actual setup is) |

The same applies to user-story stanzas: write `As a User opening the list`, not `As a User opening the iframe`. Iframes are how we ship; lists are what the User sees.

### Implicit setup steps

A scenario about an action does **not** need to spell out the prerequisite display/open step. The runner does it.

```gherkin
# ✅ implicit open — action under test is the add
Scenario: Add to an empty list
  Given an empty list
  When I add "Buy bread"
  Then the list should be:
    | Buy bread |

# ✅ explicit open — display behavior IS the action under test
Scenario: An empty list shows an empty state
  Given an empty list
  When I open the list
  Then the list should be empty
  And an empty-state message should be visible
```

**The rule:** the `When` block contains only the **action(s) under test**. Setup that the runner could have done on the User's behalf — opening the viewer, navigating to a route, signing in to a fixture account — stays implicit. Explicit `When I open …` is reserved for scenarios where opening *is* the action under test (display features) or where the scenario specifically asserts state at the moment of opening.

The project's glossary should call out which actions are implicit; document them under a dedicated subsection so newcomers know not to spell them out.

**Anatomy of a scenario:**

```gherkin
@happy-path @smoke
Scenario: Short title that reads like a one-line spec
  Given the world before                # 1–2 Givens; more → move to Background
  When I perform the action under test  # ONE When
  Then the visible consequence          # As many Thens as needed, one outcome
```

- **Given** sets up state. ≤2 per scenario; if more needed, move to `Background:`.
- **When** performs the action. **One per scenario** unless you have a strong reason. Two `When` cycles = two scenarios.
- **Then** asserts the consequence. All `Then`s should be about the same outcome.
- **And / But** continue the previous keyword. Use them; they read better than repeating `Given/Then`.

**Step text rules:**

- Quote noun phrases: `the element "Buy bread"`, `the list "Today"`. Step definitions parse the quoted strings.
- Numbers as digits: `1 element`, `3 elements`.
- No pronouns beyond the immediately previous step — they break under reordering.
- Reuse step text **verbatim**. Same idea → same sentence.
- Subject is `I` for user-driven scenarios. For non-user actors, write `the AI`, `the host`, etc., AND tag with `@actor:*`.

**Backgrounds:**

Use `Background:` only when **every** scenario in the file needs the same setup. If 3 of 5 scenarios need it, repeat the `Given` instead.

**Scenario Outlines:**

Use `Scenario Outline:` when the same steps run against different inputs. The Examples table is the data; the steps are the spec. If the table needs comments to explain rows, split into named scenarios.

**Things to avoid:**

- ❌ UI selectors in step text (CSS, IDs, aria roles).
- ❌ Hidden assertions inside `Given`. Preconditions are not checks.
- ❌ Long scenarios that "set up the whole world".
- ❌ `Then` followed by `When` (one cycle ends when assertions start).
- ❌ Comments inside scenarios. If a scenario needs a comment, rewrite it.
- ❌ Synonyms for glossary words (e.g. "tick" / "check" / "mark done" instead of `complete`).

---

## Tooling

The exact same three-tool setup for every features package:

| Tool | Role | Scope |
|------|------|-------|
| **Prettier 3** + [`prettier-plugin-gherkin`](https://www.npmjs.com/package/prettier-plugin-gherkin) | Format `.feature` files | only `*.feature` (via `.prettierignore`) |
| **[Gherklin](https://github.com/cjmarkham/Gherklin)** | Lint Gherkin (structural rules, naming, duplicates, tag presence) | `features/**/*.feature` |
| **`tools/validate.ts`** (custom; `@cucumber/gherkin` parser) | Enforce typed tag taxonomy parity (`src/tags.ts` ↔ actual tags in features) | every `.feature` |

**Why this combination:** Biome doesn't speak Gherkin. Prettier scoped to `.feature` only is the cleanest way. Gherklin > older `gherkin-lint` (modern TS/ESM, extensible). The custom validator catches what neither does: drift between the typed taxonomy and the files.

### Templates

#### `package.json` (relevant fields)

```json
{
  "name": "@<scope>/<project>-features",
  "type": "module",
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "typecheck": "tsc -p tsconfig.json --noEmit",
    "lint": "biome check . && pnpm nx qa:lint:gherkin",
    "lint:gherkin": "gherklin",
    "format": "prettier --write 'features/**/*.feature'",
    "format:check": "prettier --check 'features/**/*.feature'",
    "validate": "bun tools/validate.ts"
  },
  "dependencies": {
    "@cucumber/gherkin": "^30.0.0",
    "@cucumber/messages": "^27.0.0"
  },
  "devDependencies": {
    "gherklin": "^4.0.0",
    "prettier": "^3.3.0",
    "prettier-plugin-gherkin": "^3.1.2"
  }
}
```

#### `.prettierrc.json`

```json
{
  "plugins": ["prettier-plugin-gherkin"],
  "overrides": [
    {
      "files": "*.feature",
      "options": { "parser": "gherkin", "printWidth": 100, "tabWidth": 2, "useTabs": false }
    }
  ]
}
```

#### `.prettierignore` (Prettier touches only `.feature` files)

```
**/*
!features/
!features/**/
!**/*.feature
node_modules/
dist/
```

#### `biome.json` (Biome ignores `features/`)

```json
{
  "$schema": "https://biomejs.dev/schemas/2.4.6/schema.json",
  "extends": ["//"],
  "files": { "ignore": ["features/**", "dist/**", "node_modules/**"] }
}
```

#### `gherklin.config.ts`

```ts
export default {
  featureDirectory: "./features",
  rules: {
    "no-empty-file": "error",
    "no-empty-feature": "error",
    "no-empty-scenarios": "error",
    "no-duplicate-features": "error",
    "no-duplicate-scenarios": "error",
    "no-duplicate-tags": "error",
    "feature-name": "error",
    "scenario-name": "error",
    "no-unnamed-features": "error",
    "no-unnamed-scenarios": "error",
    "required-tags": ["error", { tags: ["@m1", "@m2", "@m3", "@m4", "@v1"], atLeast: 1 }],
    "indentation": ["error", { Feature: 0, Background: 0, Scenario: 0, Step: 2, Examples: 2 }],
    "no-trailing-spaces": "error",
    "allowed-tags": "off"
  },
};
```

> Adjust the `required-tags` list to match the project's actual milestone tags.

#### `tools/validate.ts`

A Bun script that:

1. Recursively finds every `.feature` under `features/`.
2. Parses each with `@cucumber/gherkin` (catches syntax issues).
3. Collects all tags used in each file.
4. Checks every tag is present in `src/tags.ts` (`isKnownTag`).
5. Checks every Feature has exactly one milestone tag and exactly one group tag.

See `packages/alistigo-features/tools/validate.ts` for the canonical implementation.

#### `src/tags.ts` (project-specific — the *categories* are universal, the values are not)

```ts
export const MILESTONE_TAGS = ["@m1", "@m2", "@m3", "@m4", "@v1"] as const;
export const GROUP_TAGS = ["@core" /* + project-specific groups */] as const;
export const CAPABILITY_TAGS = [/* project-specific */] as const;
export const TEST_TYPE_TAGS = ["@happy-path", "@edge-case", "@error-path"] as const;
export const SUITE_TAGS = ["@smoke", "@regression", "@wip"] as const;
export const ACTOR_TAGS = ["@actor:user" /* + project actors */] as const;

export type AlistigoTag /* rename per project */ =
  | (typeof MILESTONE_TAGS)[number]
  | (typeof GROUP_TAGS)[number]
  | (typeof CAPABILITY_TAGS)[number]
  | (typeof TEST_TYPE_TAGS)[number]
  | (typeof SUITE_TAGS)[number]
  | (typeof ACTOR_TAGS)[number];

export const ALL_TAGS = [
  ...MILESTONE_TAGS, ...GROUP_TAGS, ...CAPABILITY_TAGS,
  ...TEST_TYPE_TAGS, ...SUITE_TAGS, ...ACTOR_TAGS,
] as const;

const SET = new Set<string>(ALL_TAGS);
export function isKnownTag(tag: string): boolean { return SET.has(tag); }
```

---

## Scaffolding steps (when invoked)

1. Run `bash scripts/new-package.sh <project>-features` to bootstrap from the repo's standard scaffolder.
2. Replace `package.json` scripts/deps with the template above.
3. Add `project.json` Nx targets for `lint`, `lint:gherkin`, `format`, `format:check`, `validate`.
4. Drop in the config files: `.prettierrc.json`, `.prettierignore`, `biome.json`, `gherklin.config.ts`.
5. Create `src/tags.ts` from the template; **fill in the project-specific tag values**.
6. Create `src/index.ts` exporting `FEATURES_DIR` + the tag taxonomy.
7. Copy `tools/validate.ts` from the reference implementation.
8. Copy `docs/organization.md` and `docs/style-guide.md` from `packages/alistigo-features/docs/` (PORTABLE — same content for every project).
9. Author `docs/tags.md` and `docs/glossary.md` for this project (PROJECT-SPECIFIC — required, must follow the structure above).
10. Create `features/core/` (the always-present foundational group) and one or two starter `.feature` files.
11. Run `pnpm install`, then `pnpm format`, `pnpm nx qa:lint`, `pnpm validate` to confirm the pipeline is green.

The `core` group is always created first, even if empty initially — it's the universal foundation slot.

---

## Reference implementation

`packages/alistigo-features/` is the canonical example in this repo. When ambiguous, look there.

When the user evolves these conventions (e.g. a new tag category, a new doc), update **this skill** AND `packages/alistigo-features/` together. They are the source of truth, in lockstep.
