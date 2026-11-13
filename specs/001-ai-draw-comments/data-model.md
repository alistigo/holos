# Data Model: AI Draw Comments

**Date**: 2026-11-13 | **Feature**: [spec.md](./spec.md) | **Research**: [research.md](./research.md)

All state is in-memory and session-scoped. No persistence.

---

## Entities

### DrawCommentSession

Represents one complete annotation cycle from selection through Claude response. Multiple sessions may exist per page load (sequential, never concurrent).

```
DrawCommentSession
├── id              : string          — runtime UUID (not a TypeID; not persisted)
├── status          : SessionStatus   — see state machine below
├── region          : SelectionRegion — set when selection is confirmed
├── shapes          : DrawShape[]     — drawn in order; empty until user draws
├── comment         : string          — empty string when not provided
├── snapshot        : AnnotatedSnapshot | null  — set on successful send
├── claudeResponse  : string | null   — set when Claude responds
└── error           : string | null   — set on send failure; cleared on retry
```

**Validation rules**:
- `Send` is only allowed when `shapes.length > 0 OR comment.trim().length > 0`
- Minimum region size: 20px × 20px
- `status` transitions are strictly one-directional (see state machine)

---

### SelectionRegion

```
SelectionRegion
├── x       : number  — px offset from artifact iframe left edge
├── y       : number  — px offset from artifact iframe top edge
├── width   : number  — px; must be ≥ 20
└── height  : number  — px; must be ≥ 20
```

Coordinates are relative to the **artifact iframe viewport**, not the page. Set once when the user completes the drag-select gesture; immutable thereafter within a session.

---

### DrawShape

```
DrawShape
├── type        : "rectangle" | "line"
├── startX      : number  — canvas-relative px
├── startY      : number  — canvas-relative px
├── endX        : number  — canvas-relative px
├── endY        : number  — canvas-relative px
└── strokeColor : string  — fixed default "#ef4444" (red) for v1
```

The canvas coordinate space is local to the overlay canvas (origin = top-left of `SelectionRegion`).

---

### AnnotatedSnapshot

The immutable deliverable produced just before submission.

```
AnnotatedSnapshot
├── pngBase64   : string  — base64-encoded PNG; composites DOM capture + drawn shapes
├── comment     : string  — may be empty string
└── capturedAt  : number  — `Date.now()` timestamp
```

Transmitted as `window.claude.complete([imageBlock, textBlock])`:
```
imageBlock = { type: "image", source: { type: "base64", media_type: "image/png", data: pngBase64 } }
textBlock  = { type: "text",  text: comment || "(no comment)" }
```

---

## State Machine: SessionStatus

```
idle
  │  user clicks "Draw Comment" button
  ▼
selecting
  │  user completes drag-select (region ≥ 20×20)
  ▼
drawing
  │  user clicks "Send" (guard: shapes > 0 OR comment non-empty)
  ▼
submitting
  │─── success → sent
  └─── failure → drawing   (error message set; toolbar + Send re-enabled)

sent
  │  Claude responds
  ▼
responded

[Escape / Cancel] from {selecting, drawing} → idle
[New "Draw Comment" click] from {responded} → selecting  (new session created)
```

**Notes**:
- `submitting` is a transient state (no user interaction possible).
- `idle` is also the initial state before the first session.
- Moving from `responded` back to `selecting` creates a *new* `DrawCommentSession`; prior sessions are retained in the display thread (read-only).

---

## Extended ClaudeApi Type (to be added to `@alistigo/claude-artifact-api`)

```typescript
export type ClaudeMessageContent =
  | { type: "text"; text: string }
  | {
      type: "image";
      source: { type: "base64"; media_type: "image/png"; data: string };
    };

export interface ClaudeApi {
  complete(prompt: string): Promise<string>;
  complete(content: ClaudeMessageContent[]): Promise<string>;
}
```

This overload is added to `packages/claude-artifact-api/src/index.ts`.
