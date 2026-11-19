# Contract: Srcdoc Segments

**Module**: `apps/alistigo-artifact-playground/src/buildIframeSrcdoc.ts`
(+ `src/srcdoc-assets.ts` for the Vite-resolved inputs)
**Consumers**: `src/components/HostPage.tsx`, `src/components/ArtifactViewPanel.tsx`
**Tests**: `src/buildIframeSrcdoc.test.ts` (`bun test`)

## Surface

```ts
export type SrcdocSegment = "playground" | "ai-bridge" | "artifact" | "config" | "ai-input";

export interface SrcdocPart {
  readonly segment: SrcdocSegment;
  readonly text: string;
}

/** The bridge assets, passed in so the builder stays importable without Vite. */
export interface SrcdocAssets {
  /** The claude-artifact-api inject-script HTML (?raw in the app, a stub in tests). */
  readonly bridgeHtml: string;
  /** URL of the html-to-image bundle the bridge needs (?url in the app). */
  readonly htmlToImageUrl: string;
}

export interface BuildIframeSrcdocOptions {
  config: Config;
  aiInputMarkdown?: string;
  scriptUrl: string;
  csp: string;
  isDev?: boolean;
  devPluginUrlOverrides?: Record<string, string> | undefined;
  assets: SrcdocAssets;          // NEW — previously module-scope imports
}

/** The document as an ordered list of tagged parts. */
export function buildIframeParts(options: BuildIframeSrcdocOptions): SrcdocPart[];

/** The whole document: parts joined with "" — byte-identical to the previous output. */
export function assembleSrcdoc(parts: readonly SrcdocPart[]): string;

/** One segment, for display: its parts joined with "\n". "" when the segment is empty. */
export function segmentSource(parts: readonly SrcdocPart[], segment: SrcdocSegment): string;

/** Unchanged signature apart from `assets`; equals assembleSrcdoc(buildIframeParts(o)). */
export function buildIframeSrcdoc(options: BuildIframeSrcdocOptions): string;

/** Unchanged. */
export function buildArtifactConfig(config: Config): Record<string, unknown>;
// SRCDOC_CSP lives in srcdoc-assets.ts and is NOT re-exported from here: that module
// imports the SrcdocAssets type back, so a re-export would close an import cycle and
// qa:arch-check counts type-only imports. Consumers import it from srcdoc-assets.ts.
```

## Segment assignment

| Document content | Segment |
|------------------|---------|
| `<!DOCTYPE html>`, `<html>`, `<head>`, `<body id="artifacts-component-root-html">`, closing tags, and the indentation between parts | `playground` |
| the console-shim script | `playground` |
| the `html-to-image` `<script src>` tag | `ai-bridge` |
| the `@alistigo/claude-artifact-api` inject-script HTML | `ai-bridge` |
| `<script>window.claudeArtifactStatus = "published";</script>` | `ai-bridge` |
| `<meta http-equiv="Content-Security-Policy">`, `<meta charset>`, `<meta name="viewport">`, `<title>` | `playground` |
| `<script type="application/json" id="alistigo-config">…</script>` | `config` |
| `window.__ALISTIGO_PLUGIN_URL_OVERRIDES__` script | `playground` |
| the React-refresh preamble (dev only) | `playground` |
| `<script id="ai-input-action" type="text/markdown">…</script>` | `ai-input` |
| the draw-comments host surface `<article>` | `playground` |
| the artifact entry `<script type="module" src="…">` | `artifact` |

## Rules

| ID | Rule |
|----|------|
| S-1 | **Byte-identity.** `assembleSrcdoc(buildIframeParts(o))` equals the pre-refactor `buildIframeSrcdoc(o)` character for character, for: Claude context with AI input and plugins; Claude context without AI input; `aiContext: "none"`; `published: false`; dev and prod-local modes; and the draw-comments artifact. The expected strings are recorded in the test from the current implementation before it is changed. |
| S-2 | **Completeness.** Concatenating the five segments' parts in document order reproduces the assembled document; no part is untagged (FR-017). |
| S-3 | **Non-duplication.** Each part appears under exactly one segment (FR-017). |
| S-4 | **Order.** Parts come back in document order; `segmentSource` preserves it. |
| S-5 | `aiContext` ≠ `"claude"` ⇒ the `ai-bridge` segment has no parts, and `segmentSource(…, "ai-bridge")` is `""` (FR-013's empty state). |
| S-6 | `published: false` ⇒ no `claudeArtifactStatus` part; the rest of `ai-bridge` is unchanged. |
| S-7 | No AI input ⇒ the `ai-input` segment has no parts. |
| S-8 | The `artifact` segment contains the entry script tag and nothing else — no bridge, no config tag, no AI-input tag (FR-014). A test asserts the segment contains `scriptUrl` and contains neither `alistigo-config` nor `ai-input-action` nor any bridge marker. |
| S-9 | The `playground` segment contains no text belonging to another segment — asserted the same way, by marker absence (FR-015). |
| S-10 | The builder is a pure function of its options; the only Vite-resolved values reach it through `assets`, and `srcdoc-assets.ts` is the single module that performs those imports (research R7). |
| S-11 | `buildArtifactConfig` keeps its current output exactly: the e2e harness parses `#alistigo-config` to decide which artifact the preview holds. |

## UI contract for the new tabs

| Tab | Label | Content | Empty state |
|-----|-------|---------|-------------|
| AI Bridge | `AI Bridge` | `segmentSource(parts, "ai-bridge")` | "This AI context injects no bridge code." (FR-013) |
| Artifact source | `Artifact source` | `segmentSource(parts, "artifact")` | n/a (always present) |
| Playground source | `Playground source` | `segmentSource(parts, "playground")` | n/a (always present) |

All three render through `SourceView` with its new `code` / `label` / `emptyMessage` props, so
they inherit the existing syntax colouring and copy button (FR-016) and show their segment's text
verbatim, while Config and AI Input keep their readable presentations (FR-023). `SourceView`'s copy
handler must tolerate a missing `navigator.clipboard` — four callers now depend on it, and it throws
a `TypeError` in a non-secure context (FR-016). The existing `App`, `Source`,
`Config` and `AI Input` tabs keep their labels, their relative order and their behaviour; the three
new tabs are inserted directly after `Source`, grouping the four code views together, so the row
reads `App`, `Source`, `AI Bridge`, `Artifact source`, `Playground source`, `Config`, `AI Input`
(FR-012).
