# Idea: Sketch Canvas Artifact (AI Visual Input)

## Problem

AI chatbots accept text, voice, and files.
But there are situations where none of these work well: when you need to quickly sketch a schema, a diagram, a rough UI layout, or a spatial relationship **mid-conversation**.

The current workaround is to draw it in another app (Excalidraw, Paint, a whiteboard) and attach the result as a file — but that breaks the conversational flow.
Sometimes you just need to *scratch something down* without leaving the chat.

---

## Idea

An in-chat artifact that is essentially a **lightweight drawing canvas**.
After drawing, the artifact converts the sketch into a **text + image bundle** that the user can inject directly into the next AI message.

The heart of the project is that conversion step — making a quick drawing *legible to an AI*.

---

## User Flow

1. User opens the canvas artifact (or AI suggests it: *"Want to sketch that?"*).
2. User draws with available tools: pencil, shapes, arrows, text labels.
3. Clicks **Send to AI** → the artifact produces:
   - A **PNG or SVG** of the sketch (the visual).
   - A **short text description** auto-generated from the canvas contents (shapes detected, text labels extracted, connectivity inferred from arrows).
4. Both are inserted into the next chat message as context.
5. AI responds with full understanding of the visual intent.

---

## Canvas Features

Keep it **simple and opinionated** — this is not a general diagramming tool:

| Feature | Notes |
|---------|-------|
| Pencil (freehand) | Basic pressure-insensitive strokes |
| Rectangle / Circle | Click-drag primitives |
| Arrow / connector | Magnetic snap to shape edges — links shapes visually and semantically |
| Text label | Click anywhere to add text |
| Undo / redo | Standard Ctrl+Z |
| Clear | Wipe the canvas |

**Magnetic / smart connect:** when you drag an arrow near a shape border, it snaps and creates a semantic link stored in the canvas model (not just visually implied). This connectivity is used in the text description generation.

**Library choice:** use an existing library as much as possible to avoid reinventing the wheel. Candidates:
- **Excalidraw** (React component — rich features, open source, MIT)
- **tldraw** (React component — clean API, extensible)
- **Fabric.js** (lower level but widely used)

Excalidraw or tldraw are preferred because they handle connectivity natively and already export to SVG/PNG.

---

## The Key Part: Sketch → AI Context Conversion

This is what makes the artifact useful, not just pretty.

### Step 1 — Export
Export the canvas as:
- **PNG** (for the image attachment to AI)
- **JSON** (the internal canvas model — shapes, positions, labels, connections)

### Step 2 — Text Description Generation
Parse the JSON model to produce a human-readable description:

```
Canvas contains:
- Rectangle labeled "User"
- Rectangle labeled "API Server"
- Arrow from "User" → "API Server" labeled "POST /login"
- Rectangle labeled "DB"
- Arrow from "API Server" → "DB" labeled "SELECT users"
- Freehand annotation near "API Server": "add rate limit here"
```

This description is injected alongside the image so the AI has both the visual and a structured text summary.

### Step 3 — Inject into Chat
The bundle (image + text description) is formatted as a multipart message and handed to the chat input.

---

## Phase 2 — AI Edition

Once the core canvas works, extend it to accept **AI-driven edits** using the same document-mutation system built for the list artifact:

1. AI receives the canvas JSON representation.
2. AI produces a diff/patch (add shape, move shape, change label, add connection).
3. The artifact reads the patch and applies it to the existing canvas — no full re-render, incremental updates.

This enables a back-and-forth: *"Add a cache layer between the API and the DB"* → AI patches the canvas → user sees the update live.

---

## Decomposition

```
packages/artifact-sketch-canvas/
  src/
    canvas/          # Wrapper around chosen library (Excalidraw/tldraw)
    export/
      toImage.ts     # PNG/SVG export
      toDescription.ts  # JSON model → text description
    inject/          # Formats the bundle for chat injection
    ArtifactSketchCanvas  # Top-level component
```

---

## Open Questions

- Which library fits best: Excalidraw (feature-rich) vs tldraw (cleaner API)?
- How detailed should the auto-description be? Aim for *useful*, not exhaustive.
- Should the canvas persist across sessions (stored as part of the artifact doc)?
- Touch / stylus support on mobile for a more natural sketching experience?
