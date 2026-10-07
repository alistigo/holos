# Idea: Artifact Review & Comment Tool

## Overview

Generalize the annotation / thread-on-artifact pattern — already present in Claude's own artifact viewer — into a **standalone, drop-in tool** that any Alistigo artifact can adopt with a single line of code.

---

## Problem

Claude already ships a "click anywhere to start a thread" UX for its artifacts.
It lets you point at a specific piece of text or UI element and open a conversation thread about it.
That's powerful for AI collaboration.

But it's locked to the Claude environment and vanishes when you share the artifact.

The idea here is two-fold:

1. **Generalise it** — make the tool so self-contained that adding it to an artifact is trivial.
2. **Extend it to human review** — when an artifact is shared, real people can leave threaded comments anchored to any point on the artifact, exactly like annotating a Figma frame or a Google Doc.

---

## User Stories

- *As an artifact author*, I add `<ArtifactComments />` to my artifact and immediately get a review layer — no backend wiring required for basic use.
- *As a reviewer*, I open a shared artifact link, click anywhere, and leave a comment. The author sees a notification.
- *As an AI collaborator*, the AI can read comment threads anchored to specific elements and respond in context, knowing exactly what part of the artifact is being discussed.

---

## Design

### Activation

Two modes:

| Mode | Trigger |
|------|---------|
| **Review mode** | User clicks the comment icon in the artifact toolbar → cursor becomes a crosshair |
| **Always-on** | Pass `mode="always"` prop — comments icon floats on hover over any element |

### Anchor System

Comments are anchored to a **point** (x/y percentage coordinates on the artifact surface) or to a **DOM element** (via a stable `data-comment-id` attribute on the target).

- Point anchors work for any artifact (image, 3D viewer, canvas) — purely positional.
- Element anchors are smarter for text/UI artifacts — survive re-renders if the element moves.

### Thread Model

```ts
type CommentThread = {
  id: string
  anchor: PointAnchor | ElementAnchor
  author: { id: string; name: string; avatarUrl?: string }
  createdAt: Date
  messages: CommentMessage[]
  resolved: boolean
}

type CommentMessage = {
  id: string
  author: { id: string; name: string }
  body: string        // markdown
  createdAt: Date
  isAI: boolean
}
```

### Storage

- **Phase 1 (local / ephemeral):** comments live in component state — useful for single-session AI review.
- **Phase 2 (persistent):** pluggable storage adapter: `LocalStorageAdapter`, `AlistigoDocAdapter` (uses the Alistigo document layer), or a custom REST/WebSocket backend.

### AI Integration

When running inside an Alistigo artifact with an AI context:
- The AI can see all open comment threads as structured context.
- The AI can reply to a thread directly (message flagged `isAI: true`).
- The AI can *initiate* a thread (e.g., surfacing a review finding anchored to the relevant element).

---

## "One Line" Drop-in Goal

```tsx
import { ArtifactComments } from '@alistigo/artifact-comments'

export function MyArtifact() {
  return (
    <ArtifactComments>
      <MyContent />
    </ArtifactComments>
  )
}
```

That's the bar. Everything else (toolbar button, comment pins, thread popover) is handled by the library.

---

## Relationship to the Alistigo Artifact Platform ADR

This is explicitly a **platform-level tool** (not an artifact-specific feature).
It should live as a capability described in the artifact platform ADR — something the platform provides to all artifacts, similar to how a web framework provides routing.

---

## Decomposition

```
packages/artifact-comments/
  src/
    ArtifactComments.tsx   # Context provider + activation logic
    CommentPin.tsx         # Visual pin on the artifact surface
    CommentThread.tsx      # Thread popover UI
    anchors/
      point.ts
      element.ts
    storage/
      types.ts
      LocalStorageAdapter.ts
      AlistigoDocAdapter.ts
    toolbar/               # Comment mode button for artifact toolbar
```

---

## Open Questions

- Collision handling when multiple pins cluster in the same area (mini-map? numbered clusters)?
- Real-time sync across multiple reviewers — WebSocket or polling?
- Should resolved threads be hidden or shown with a strikethrough indicator?
- Mobile UX: long-press to annotate instead of click?
