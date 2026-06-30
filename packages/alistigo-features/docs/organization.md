# Organization

How `.feature` files are arranged in this package, and why. The conventions follow the [`gherkin-features` skill](../../../.agents/skills/gherkin-features/SKILL.md) — that document is the universal source of truth across all features packages in the repo. This file mirrors it and adds Alistigo-specific notes.

## The shape

```
features/
├── core/                         # one folder per FEATURE GROUP (not milestone)
│   ├── README.md
│   ├── add-element.feature       # one file per capability
│   ├── delete-element.feature
│   ├── display-list.feature
│   └── persist.feature
└── <plugin-name>/                # populated as plugins land (todo, checklist, …)
    └── …
```

Three rules; they account for almost all decisions:

1. **One folder per feature group.** A *group* is a cohesive set of capabilities — the base app (`core/`), or a plugin (`todo/`, `checklist/`, …). The folder name matches a tag in `src/tags.ts` (e.g. `@core`); the validator enforces that.
2. **Milestones are tags, not folders.** `@m1`, `@m2`, … are *time* markers — when something ships. Groups are *scope* markers — what something belongs to. Both dimensions are tracked via tags; the folder layout reflects scope only.
3. **One file per capability**, not per user story or UI screen. A capability is a thing the app *does*: "add an element", "delete an element", "persist state". A capability is named with a verb-first when describing an action.

## Why this layout, not others

- **By group, not by milestone.** Milestone folders (`m1-…/`, `m2-…/`) decouple from the architectural shape and bury the fact that some features are core and some are plugin-specific. Group folders carry that information at the path level.
- **By capability, not by user story.** Stories are a planning tool; the same capability often shows up in many stories. One file per capability avoids duplication and keeps related scenarios together.
- **No `unit/`, `integration/`, `e2e/` folders.** That's a *test type*, which is a tag concern (see [tags.md](tags.md)), not a folder concern. The runner picks layers via tags, not paths.

## Naming files

- `kebab-case.feature` — lowercase, hyphens.
- Verb-first when describing an action: `add-item.feature`, `complete-item.feature`.
- Noun-first when describing state or display: `display-list.feature`, `empty-state.feature`.
- Short. Two or three words. If the name needs more, the file is probably two capabilities — split it.

## Inside a feature file

```gherkin
@m1 @core @capability:element @actor:user
Feature: Add an element to a list
  As a User
  I want to add a text element to the list
  So that I can capture something into it

  @happy-path @smoke
  Scenario: Add to an empty list
    Given an empty list
    When I add "Buy bread"
    Then the list should be:
      | Buy bread |
```

Required structure:
- **Feature-level tags** on the line above `Feature:` — exactly one milestone tag (`@m1` …), exactly one group tag matching the parent folder (`@core` …), and at least one capability tag (`@capability:element` …).
- **`Feature:` line** — short, capitalised, ends with the capability name.
- **User-story stanza** — `As a / I want / So that`. Always present; this is what the feature is *for*. Use the Actors defined in [glossary.md](glossary.md) (`User`, etc.) — capitalised.
- **`Background:`** — optional, used when every scenario shares the same setup.
- **One or more `Scenario:` blocks**. Tags on each scenario for cross-cutting concerns (`@happy-path`, `@smoke`, `@edge-case`, …).

See [style-guide.md](style-guide.md) for how to *write* the steps.

## When to add a new file vs. extend an existing one

- **New scenario for an existing capability** → add to the existing file.
- **New capability** → new file.
- **Cross-cutting behavior** (e.g. "every mutation updates `dateModified`) → use a tagged scenario inside the relevant capability file, *not* a new "cross-cutting" file. Tags are the right tool for "this scenario is about X".
- **Shared `Background:` across multiple files** → consider whether the files should merge. If not, copy the Background; Gherkin doesn't share Backgrounds across files and that's fine.

## When to delete a file

If a capability is removed from the app, delete the `.feature` file. **Do not** keep "historical" features around. The git history is the historical record; the working tree is what we ship.

## See also

- [style-guide.md](style-guide.md) — writing rules
- [tags.md](tags.md) — the tag taxonomy
- [glossary.md](glossary.md) — ubiquitous language

## References

This guidance follows [Cucumber's "Solving: How to organise feature files?"](https://cucumber.io/blog/bdd/solving-how-to-organise-feature-files/) and the [andredesousa/gherkin-best-practices](https://github.com/andredesousa/gherkin-best-practices) collection — adapted to a milestone-driven monorepo.
