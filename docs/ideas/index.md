# Ideas — Future Artifacts & Apps

Captured ideas for future development on the Alistigo artifact platform and standalone apps.
Each entry links to a dedicated doc with full context and design notes.

---

## Artifacts

| Idea | Summary |
|------|---------|
| [3D Viewer (OpenSCAD)](./3d-scad-viewer.md) | AI generates parametric OpenSCAD code → compiled client-side via openscad-wasm → rendered in Three.js with an auto-generated parameters panel. Scope: pieces for home 3D printing. |
| [Sketch Canvas for AI](./ai-sketch-canvas.md) | In-chat drawing tool so users can sketch a quick diagram or schema mid-conversation and inject it (text + image) directly into the AI context — no context-switch to another app. |
| [Artifact Review & Comments](./artifact-review-comments.md) | Generalize the "click-to-thread" annotation pattern already present in Claude artifacts into a drop-in tool (`<ArtifactComments />`) for any artifact, enabling async human review and AI collaboration via pointed threads. |
| [Alistigo Doc MCP Server](./alistigo-doc-mcp-server.md) | Small MCP server that stores and retrieves the "doc" layer of any Alistigo artifact — a hands-on experiment in building and shipping an MCP server. |
| [Artifact → PWA](./artifact-to-pwa.md) | One-click export of any artifact as an installable Progressive Web App (Android / desktop) — wraps the artifact in a minimal PWA shell with manifest + service worker. |
| [Save as Standalone HTML](./artifact-save-as-html.md) | Export an artifact as a fully self-contained HTML file that runs without the Alistigo platform or AI context — pure portable execution. |

## Apps

| Idea | Summary |
|------|---------|
| [Plant Manager](./plant-manager.md) | A small personal app to track house plants: watering schedules, care notes, health log — simple, mobile-friendly. |
