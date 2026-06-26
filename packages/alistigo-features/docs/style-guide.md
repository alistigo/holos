# Style Guide

How to write a `.feature` that the team and the runner are happy with.

The rules in this file are universal — they come from the [`gherkin-features` skill](../../../ai/skills/gherkin-features/SKILL.md) and are identical across every features package in the repo. The Alistigo-specific vocabulary (Entities, Actors, Actions) lives in [glossary.md](glossary.md).

## The four rules that matter

1. **Declarative, not imperative.** Describe *what* should happen, never *how*.
   - ✅ `When I add "Buy bread"`
   - ❌ `When I type "Buy bread" into the input #new-element and click button.add`
2. **Use the [glossary](glossary.md).** Every domain word that appears in a step must come from it. New word → add it to the glossary first.
3. **Tables for collections, implicit nouns.** A list is set up with `Given a list:` + a headerless table (even for one row). The Element noun is dropped from step text where the verb makes it unambiguous (`When I add "X"`, not `When I add an element "X"`). See the glossary for the canonical phrasings.
4. **One scenario, one outcome.** A scenario asserts one observable behavior. Multiple `Then`s are fine; multiple unrelated assertions are not.
5. **Keep it short.** A scenario over ~10 lines is usually two scenarios pretending to be one.

## Anatomy of a scenario

```gherkin
@happy-path @smoke
Scenario: Add to an empty list
  Given an empty list           # the world before
  When I add "Buy bread"        # the action under test (one)
  Then the list should be:      # the visible consequence
    | Buy bread |
```

- **Title**: starts with a verb, ends without a period, capitalised normally. Reads as a one-line spec.
- **`Given`** sets up state. No more than two `Given`s in a scenario; if you need more, move to `Background:`.
- **`When`** performs the action under test. **One per scenario** in almost all cases. If you have two, ask whether you've smashed two scenarios together.
- **`Then`** asserts the consequence. As many as you need, but they should all be about the *same* outcome.
- **`And` / `But`** continue the previous keyword. Use them; they read better than repeating `Given` / `Then`.

## Writing steps

- **Subject = "I"** for the user-driven scenarios; `the user`, `the AI`, `the host` for non-user actors. Tag with `@actor:*` when the actor matters.
- **Quote noun phrases**: `the item "Buy bread"`, `the list "Today"`. Step definitions parse out the quoted strings.
- **Numbers in digits**: `1 item`, `3 items`, never `one item`.
- **Avoid pronouns** like "it" or "them" beyond the immediate previous step — they break when scenarios are reordered.
- **Reuse step text**. Two scenarios doing the same thing should use the *exact same* sentence. Refactoring tags or names later depends on this.

## Backgrounds

Use `Background:` when **every** scenario in the file needs the same setup.

```gherkin
Background:
  Given an empty list
```

If 3 of 5 scenarios need a Background, do not add it — repeat the `Given` in those 3 scenarios. Backgrounds that don't apply to every scenario are confusing and slow.

## Scenario Outlines

Use `Scenario Outline:` when the same steps run against different inputs. The `Examples:` table **is** typed (with a header row); data tables inside steps are headerless.

```gherkin
Scenario Outline: Adding "<text>" to an empty list shows just that one element
  Given an empty list
  When I add "<text>"
  Then the list should be:
    | <text> |

  Examples:
    | text       |
    | Buy bread  |
    | Call mom   |
    | 🍞         |
```

- Examples are the data; the steps are the spec.
- One Outline ≠ one giant table. If the table needs comments to explain what each row is testing, split it into named scenarios.

## Tags

See [tags.md](tags.md) for the full taxonomy. The minimum:

- **Feature-level (above `Feature:`)** — exactly one milestone tag, exactly one group tag matching the parent folder, and at least one capability tag.
- **Scenario-level (above `Scenario:`)** — `@happy-path`, `@edge-case`, `@error-path`, `@smoke`, `@todo`, `@actor:*` as appropriate.

## Things to avoid

- ❌ **UI selectors in steps.** `When I click #submit` is wrong. The step *definition* may interact with the DOM; the step *text* should not.
- ❌ **Test data leakage.** Hard-coding "Today" as the list title is fine if the test is about display; if it isn't, use a neutral name (`a list`).
- ❌ **Hidden assertions.** Don't put assertions inside `Given`. If a precondition is also a check, split it.
- ❌ **Long scenarios that "set up the whole world"**. Split into smaller scenarios, each making one point.
- ❌ **`Then` followed by `When`**. Once you start asserting, the action is over. Two cycles → two scenarios.
- ❌ **Comments**. If a scenario needs a comment, the scenario isn't clear enough. Rewrite it.

## A worked example

❌ Bad:
```gherkin
Scenario: Add and delete an element
  Given the user opens the app and sees an empty list
  When the user types "Buy bread" into the new element input
  And the user presses Enter to submit
  Then the list shows "Buy bread"
  When the user clicks the X button next to "Buy bread"
  Then "Buy bread" should disappear with a fade animation
  And the count should say "0 elements"
```

Problems: two `When` cycles → two scenarios; UI selectors ("input", "button", "fade animation") leak in; mixed verbiage; "user" subject inconsistently used.

✅ Better — two scenarios, each about one thing:
```gherkin
Scenario: Add to an empty list
  Given an empty list
  When I add "Buy bread"
  Then the list should be:
    | Buy bread |

Scenario: Delete an existing element
  Given a list:
    | Buy bread |
  When I delete "Buy bread"
  Then the list should be empty
```

## See also

- [organization.md](organization.md) — folder/file layout
- [tags.md](tags.md) — the tag taxonomy
- [glossary.md](glossary.md) — domain words allowed in steps
- [Gherkin reference](https://cucumber.io/docs/gherkin/reference/)
