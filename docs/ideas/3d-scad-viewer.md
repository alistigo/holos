# Idea: 3D Viewer Artifact (OpenSCAD / 3D Printing)

## Overview

An artifact that lets an AI generate a parametric 3D piece and display it directly in the chat.
The user describes what they want to print; the AI writes OpenSCAD code; the artifact compiles and renders it entirely client-side.

Scope is deliberately narrow: **pieces for home FDM 3D printing** — plastic, mostly monochrome (1–4 colours max).

---

## User Flow

1. User asks the AI: *"Create a parametric phone stand with a 15° tilt and a slot for a USB-C cable."*
2. AI generates a `.scad` file (with named parameters at the top).
3. The artifact receives the SCAD source, compiles it in a Web Worker, and shows the rendered mesh.
4. A side panel automatically lists every parameter exposed in the SCAD file as a form input.
5. User tweaks values → hits **Re-render** (or auto-debounced) → updated mesh appears.
6. User exports as `.stl` for slicing.

---

## Architecture — Three Layers

### Layer 1 — SCAD Compiler (Web Worker)

- **Runtime:** `openscad-wasm` — the full OpenSCAD engine compiled to WebAssembly.
- **Libraries bundled:** BOSL2 (standard parametric geometry library) pre-loaded into the virtual FS.
- Receives SCAD source as a string, outputs a binary STL buffer.
- Runs entirely off the main thread to keep the UI responsive.
- Error output (OpenSCAD stderr) surfaced in the UI.

### Layer 2 — 3D Viewer Component

- **Library:** Three.js with `STLLoader`.
- Minimal controls: OrbitControls (rotate / pan / zoom), ambient + directional light.
- Colour: neutral grey material matching typical print filament; optionally colour-coded by face normal to help the eye read overhangs.
- Responsive canvas that fills the artifact container.
- Exposes a simple `loadSTL(buffer: ArrayBuffer)` API so Layer 1 can push a new mesh without re-mounting.

### Layer 3 — Parametric Panel

Two sub-parts:

**3a. Parameter Extractor**
- Static regex / parser that reads the top-level SCAD source and finds lines like:
  ```openscad
  width = 80;   // [20:200] Width in mm
  tilt  = 15;   // [0:45:5] Tilt angle
  label = "stand"; // Label text
  ```
- Recognises the OpenSCAD customiser comment syntax (`[min:max]`, `[min:max:step]`, dropdown lists).
- Outputs a typed parameter schema: `{ name, type, value, min?, max?, step?, options? }[]`.

**3b. Parameter Form (UI)**
- Renders the schema as form controls: `<input type="range">` for numeric ranges, `<select>` for enums, `<input type="text">` for strings.
- Debounced change handler feeds updated values back into the SCAD source and triggers a recompile.
- Panel is hidden when no parameters are detected (static models).

---

## Technical Choices & Open Questions

| Topic | Direction |
|-------|-----------|
| OpenSCAD WASM bundle size | ~20 MB — lazy-load only when the artifact type is detected |
| BOSL2 in WASM FS | Pre-bundle the library files into the worker at build time |
| Recompile on every keystroke? | Debounce 800 ms; add a manual **Re-render** button for expensive models |
| Multi-colour printing | Out of scope for v1; could support OpenSCAD `color()` blocks visually in viewer |
| Export | STL download; OBJ/3MF could come later |
| AI model choice for SCAD | Any capable code model; prompt should include BOSL2 context and the parameter comment syntax |

---

## Decomposition for Implementation

```
packages/artifact-3d-viewer/
  src/
    compiler/        # Web Worker wrapping openscad-wasm
    viewer/          # Three.js STL viewer React component
    panel/
      extractor.ts   # Parameter parser
      ParameterForm  # Form UI component
    Artifact3DViewer # Top-level composition
```

---

## References

- openscad-wasm: `openscad-wasm` npm package / GitHub `openscad/openscad-wasm`
- BOSL2: `https://github.com/BelfrySCAD/BOSL2`
- Three.js STLLoader: `three/examples/jsm/loaders/STLLoader`
- OpenSCAD Customizer syntax: `https://en.wikibooks.org/wiki/OpenSCAD_User_Manual/Customizer`
