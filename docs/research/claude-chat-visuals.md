# Claude Chat Visuals (non-Artifact interactive content)

> Sources:
> - [Visual and interactive content](https://support.claude.com/en/articles/13641943-visual-and-interactive-content)
> - [Custom visuals in chat and cowork](https://support.claude.com/en/articles/13979539-custom-visuals-in-chat-and-cowork)

---

## What this is

Claude can generate **interactive, visual content inline in the chat flow** — outside of images and videos — that is **not an Artifact**.

Examples include live charts, interactive tables, and company/work data visualisations (the "Custom visuals" feature in Teams/cowork plans).

## Key distinction from Artifacts

| | Chat Visuals | Artifacts |
|---|---|---|
| Rendered in chat | ✅ Inline in the conversation | ✅ Side panel |
| Saveable | ❌ | ✅ |
| Shareable | ❌ | ✅ |
| Persistent across sessions | ❌ | ✅ (via Projects) |
| User can re-open later | ❌ | ✅ |

**TL;DR:** Chat visuals are ephemeral; they live only in the conversation turn that produced them. Artifacts can be saved, kept, and shared independently.

## Relevance to Alistigo

Alistigo delivers list UX as a **Claude Artifact** (HTML artifact in a side panel). This is intentional:

- The list must survive across sessions → requires Artifact persistence, not ephemeral chat output.
- The list must be shareable (future milestone) → Artifact sharing, not chat.
- The embedding model (`alistigo-artifact` UMD bundle loaded via jsDelivr) only makes sense inside an Artifact iframe — chat visuals have no equivalent CDN loading mechanism.

Chat visual features (charts, custom visuals in Teams) are irrelevant to the Alistigo delivery model but useful context when comparing Claude's output surface types.

---

> See also: [claude-artifacts-capabilities.md](./claude-artifacts-capabilities.md) for Artifact internals (CSP, available libraries, storage API).
