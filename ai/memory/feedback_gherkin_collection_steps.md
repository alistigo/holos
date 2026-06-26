---
name: Gherkin step style — tables for collections, drop redundant nouns
description: User's preferences for step text when an Entity is a collection — prefer headerless tables even for a single row, and let the entity noun be implicit when the verb makes it unambiguous
type: feedback
---

When writing Gherkin steps that touch a collection-Entity (a List of Elements, a Cart of LineItems, etc.), prefer **table form** and **implicit nouns** over verbose forms.

## Two rules

### 1. Always use a table for collection setup, even for one row

❌ avoid (mixes two patterns):

```gherkin
Given a list with element "Buy bread"
Given a list with elements:
  | text      |
  | Buy bread |
  | Call mom  |
```

✅ prefer (one pattern, scales from 1 to N):

```gherkin
Given a list:
  | Buy bread |

Given a list:
  | Buy bread |
  | Call mom  |
```

The table is **headerless** when the column carries the obvious entity attribute (the element's text). Add a header only when there's more than one column.

### 2. Drop the entity noun when the verb makes it unambiguous

The entity is implied by the operation; spelling it out is noise.

| ❌ Verbose | ✅ Implicit |
|-----------|------------|
| `When I add an element "Buy bread"` | `When I add "Buy bread"` |
| `When I delete the element "Buy bread"` | `When I delete "Buy bread"` |
| `Then the list should contain the element "Buy bread"` | `Then the list should contain "Buy bread"` |
| `Then the list should not contain the element "Buy bread"` | `Then the list should not contain "Buy bread"` |

Keep the noun **only** when it disambiguates — primarily in count assertions where the bare number would be confusing:

- ✅ `Then the list should contain 2 occurrences of "Buy bread"` (count of duplicates)
- For "exactly N elements without listing them", prefer the table form: `Then the list should be:` + table.

### Why

- **Table-first** scales painlessly from 1 → N. Two phrasings ("with element" vs "with elements:") create cognitive overhead and step-definition duplication.
- **Implicit nouns** read closer to natural language. Step definitions can still capture them precisely via quoted strings.
- **Headerless tables** match the user's mental model: a list of texts is *just* a list of texts. Naming the column adds nothing.

## How to apply

When proposing or refactoring `.feature` files in any project that follows the [`gherkin-features` skill](../skills/gherkin-features/SKILL.md):

- Setup → `Given <entity-collection>:` + headerless table.
- Mutation → `When I <verb> "<value>"` (no entity noun).
- Assertion of full state → `Then <entity-collection> should be:` + headerless table. **Treat as a multiset assertion** (order-insensitive) when the entity has internal-but-not-semantic order.
- Assertion of presence/absence → `Then <entity-collection> should contain "<value>"` / `should not contain`.
- Assertion of duplicates → `Then <entity-collection> should contain N occurrence(s) of "<value>"`.
- Drop `Then <entity-collection> should contain N elements` — replace with the table form (it asserts strictly more, with no extra noise).
