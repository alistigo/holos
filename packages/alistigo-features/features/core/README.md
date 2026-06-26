# core — Base list app

The foundational feature group for Alistigo AI. Every list type the project will ever support (todo, checklist, grocery, wishlist, …) is built **on top of** the core list app via plugins.

These features describe what the **base list** does — without any plugin loaded.

| File | Capability |
|------|------------|
| [display-list.feature](display-list.feature) | Render the list (empty, populated, with duplicates) |
| [add-element.feature](add-element.feature) | Append a text element |
| [delete-element.feature](delete-element.feature) | Remove an element by identity (or by row when duplicates collide) |
| [persist.feature](persist.feature) | Survive a reload |

## Scope

The base list:

- holds a sequence of **text elements** — nothing else (no checkbox, no priority, no due date — those are plugin behaviors)
- has an **internal order** that is preserved on read but **NOT displayed** to the user (the user sees rows; positions are not shown)
- supports **add** and **delete**
- **allows duplicates** — two elements with the same text are two distinct elements with distinct identities

What's deliberately out of scope at this layer:
- Completion / checkbox state → todo plugin (later)
- Sorting, ordered display → ordering plugin (later)
- Editing element text → edit plugin (later)
- Categories, priorities, dates, images → respective plugins (later)

## Definition of Done

The base list (and its M1 milestone) is done when every scenario in this folder is green via the runner *and* replaying the event log produces the same projection.

See:
- [`projects/alistigo-ai/milestones.md`](../../../../projects/alistigo-ai/milestones.md) for the milestone roadmap
- [`docs/glossary.md`](../../docs/glossary.md) for the entities, actors, and actions that may appear in step text
- [`docs/style-guide.md`](../../docs/style-guide.md) for how to write a scenario
