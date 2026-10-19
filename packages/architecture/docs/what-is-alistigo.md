# What is Alistigo?

Alistigo is a framework and collection of embeddable AI artifacts — a shared set of libraries and
conventions that let developers build any artifact (list, kanban, table, form, timeline…)
with a consistent quality floor, running 100% in the browser without a backend.

The **list artifact** (`@alistigo/artifact-list`) is the reference implementation.

## The Problem

When an AI is asked to create a shareable list artifact today, it writes a full app from
scratch — picking a UI library, wiring state management, handling persistence. Three
problems follow:

1. **Token cost.** Writing an entire app takes a lot of tokens for something as common as
   a list.
2. **Non-determinism.** Because AI is non-deterministic, every generated app looks and
   behaves differently. There is no consistent user experience.
3. **Limited features.** A generated app only has what the AI happened to include — no
   shared feature baseline, no way to extend it.

Alistigo solves this: the AI describes a *document*, not an app. Alistigo handles
rendering, interaction, and persistence. The AI stays in its lane (data and intent).

## The Framework

Alistigo started as a single-purpose list app. The scope expanded: Alistigo is now a **framework
for AI artifacts** — a shared set of libraries (`artifact-core`, `artifact-plugin-api`,
, …) that any artifact type plugs into. The list artifact became the
reference implementation, not the product.

## How It Works

Say a user asks their AI assistant: *"Write me a todo list."*

1. The AI has `artifact-list-skill` installed in its environment — a short skill file that
   teaches it about `@alistigo/artifact-list` and how to invoke it.
2. The AI writes a tiny HTML artifact. Because the request is a list, the skill tells it to
   load `@alistigo/artifact-list` from jsDelivr — no bundler, no backend, one `<script>` tag.
3. The AI writes the todo items as plain markdown inside a `<script type="text/markdown">`
   tag. The artifact picks that up and renders a fully interactive todo list.
4. Done. A handful of tokens. A small, shareable HTML file. Full todo features — check off,
   reorder, persist — out of the box.

The AI described *content*, not an app. Alistigo handled the rest.

See [`architecture.md`](architecture.md) for the full set of load-bearing constraints and
the [`framework/`](framework/README.md) docs for the four-tier architecture diagram.
