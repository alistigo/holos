---
name: Gherkin step language — domain terms only, implicit setup
description: User's preferences for what words may appear in Gherkin step text — domain terms (User mental model) over implementation terms, and which setup steps may be implicit
type: feedback
---

Two rules for the language of Gherkin step text in any features package the user owns. Both came from review of the alistigo-features package; both belong in the [`gherkin-features` skill](../skills/gherkin-features/SKILL.md) and should propagate to every new features package.

## Rule 1 — Step text uses the User's mental model, not the implementation

A User opens, reads, and reloads the *list* — never the *iframe*, *web view*, *DOM*, *page*, or any other implementation noun. Implementation terms belong in architecture docs and READMEs, not in step text or in the User-story stanza of a `.feature`.

| ❌ Implementation term | ✅ Domain term |
|------------------------|------------------|
| `When I reload the iframe` | `When I reload the list` |
| `Then the iframe shows "X"` | `Then the list should contain "X"` |
| `Given the page is loaded` | `Given an empty list` (or whatever the actual setup is) |
| `As a User opening the iframe` | `As a User opening the list` |

**Why:** the User doesn't know an iframe exists. Step text is the contract between Product, Specs, and Code; using an implementation word leaks abstraction in the wrong direction and ages badly when the implementation changes (M4 host protocol may not even use an iframe long-term).

## Rule 2 — Setup that the runner could do on the User's behalf stays implicit

A scenario about an action does **not** spell out the prerequisite display/open step. The `When` block contains only the **action under test**.

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

The runner performs the implicit setup (opening, navigating, signing into a fixture account, …) before `When I add`, `When I delete`, etc. — even when the open step is not written.

**Write the open/setup step explicitly only when:**

- The scenario is *about* the open/display behavior (the open IS the action under test).
- The scenario specifically asserts state at the moment of opening.

**Why:** the User does open the list before adding to it; they just don't *think about it*. Spelling it out at every scenario makes the spec longer, harder to read, and offers nothing testable beyond what the runner already proves.

## How to apply

When proposing or refactoring `.feature` files in any project that follows the [`gherkin-features` skill](../skills/gherkin-features/SKILL.md):

- Scrub implementation nouns from step text and User-story stanzas. Use the corresponding entity from the project's glossary.
- Before adding a `When I open …` step, ask: "is this scenario *about* opening?" If no, drop it.
- Each project's glossary should declare which actions are implicit (under a dedicated "Implicit *X*" subsection) so newcomers know not to spell them out.
