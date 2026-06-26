---
status: accepted
date: 2026-05-02
deciders: Mikael Labrut
---

# ADR 0001 — UI Library & i18n Stack

**Status:** Accepted  
**Date:** 2026-05-02

## Context

Alistigo is an iframe-embedded `ListWidget` used primarily on mobile. The host page
injects a JSON theme envelope over `postMessage` (M4). AI assistants are first-class
contributors — library tooling (MCP server, `llms.txt`, agent skills) is a real
selection criterion, not a nice-to-have. The full requirements are listed in §1 below.

Two decisions had to be made together because they affect the same package boundary
(`apps/alistigo-artifact-playground/` and the future components package):

1. **Which UI library / composable stack** handles components, animations, theming, icons, and accessibility.
2. **How to ship per-locale static bundles** — the architecture calls for one bundle per
   language (switching languages reloads the iframe with a different `src`) rather than
   runtime locale switching inside the bundle.

## Decision

**UI stack: shadcn/ui composable stack**

```
shadcn/ui (copied components)
├── Radix Primitives   (headless ARIA — battle-tested, 35k stars)
├── Vaul               (mobile drawer / bottom sheet with gesture + snap points)
├── Motion             (layout, spring, gesture, exit animations)
├── Tailwind CSS v4    (utility CSS — theme tokens are CSS vars)
├── Radix Colors       (~30 scales, light/dark/alpha, OKLCH)
├── Lucide             (~1.5K+ icons, MIT, best tree-shaking)
└── shadcn/skills + MCP  (agent context for Claude Code / Cursor)
```

**i18n: Lingui v6** (`@lingui/macro` + `@lingui/react` + `@lingui/vite-plugin`)

Per-locale bundles, ~2 KB runtime, ICU MessageFormat, `t` and `<Trans>` macros,
Vite plugin for build-time catalog compilation. Already wired in — `en` and `fr` ship
as of 2026-05-02.

**Scope:** This decision covers every package and app in the Alistigo project,
including developer tooling such as `apps/alistigo-artifact-playground`. Dev
tools are exempt from the i18n/Lingui requirement (§8) but must use the
Tailwind + shadcn composable stack for all their own UI. Plain CSS stylesheets
and inline `style` props are not permitted in any Alistigo package.

## Consequences

**Positive:**
- Full component code ownership (shadcn copies files; we fork freely)
- Best mobile UX in the ecosystem: Vaul gestures + snap points for bottom sheets
- Best React animation API: Motion handles layout, gesture, spring, and exit transitions
- JSON theming is trivial: host JSON → CSS vars on `:root` → Tailwind utilities consume them; theme switching is a var swap, zero re-render
- First-class AI agent tooling: shadcn/skills + MCP, `llms.txt` — agents install components correctly without hand-rolled prompts
- Zero i18n footprint per locale: Lingui runtime is not shipped in the per-locale bundle; no extra HTTP request; no runtime locale state

**Negative / tradeoffs accepted:**
- Assembly cost (~7 packages instead of 1) — mitigated by shadcn CLI + agent skills workflow
- Component updates are manual (shadcn copies, not npm) — mitigated by `shadcn diff`
- Lint stack split: Biome stays primary; for M1, ship without the Tailwind class-ordering ESLint plugin (Option A — revisit if drift becomes visible in PRs)
- Two animation systems coexist (CSS transitions for cheap things, Motion for layout/gesture) — acceptable

**Fallback:** HeroUI v3 — honest second place (React Aria ARIA story, official MCP +
`llms.txt`, Tailwind v4). Blocked only by lack of gesture-native mobile drawer and
animation ceiling in v3's CSS-only approach. Re-evaluate if M1 spike reveals the
shadcn stack is too much assembly.

---

## 1. Requirements

| # | Priority | Requirement | What "good" looks like |
|---|----------|-------------|------------------------|
| R1 | **P1** | **Mobile-first UX** | Native-feeling bottom sheets, drawers, gesture support (drag, snap points) |
| R2 | **P1** | **Rich animations** | First-class layout, gesture, spring, and exit animations — not just CSS transitions |
| R3 | **P1** | **ARIA / accessibility** | WAI-ARIA primitives, screen-reader tested, keyboard navigation, focus management |
| R4 | **P1** | **Small bundle + tree-shaking** | Only ship what we use — the widget loads inside an iframe in someone else's chat |
| R5 | **P1** | **Themable: JSON-injectable + advanced CSS** | Host injects `{primary, radius, fontFamily, …}` over `postMessage`; second path lets advanced hosts ship a CSS override file |
| R6 | **P2** | **Complete basic component set** | Button, Input, Checkbox, Dialog, Drawer/Sheet, Popover, Tooltip, Tabs, Toggle, Toast, Menu, ContextMenu — without us re-implementing primitives |
| R7 | **P2** | **AI docs / skills / MCP** | Official `llms.txt` + MCP server + agent skill so coding agents have first-class context |
| R8 | **P2** | **Community + release cadence** | Active maintenance, frequent releases, real ecosystem |
| R9 | **P2** | **Icon library — clean + tree-shakeable** | Per-icon imports, ~1.5K+ icons, consistent stroke/style, MIT-licensed |
| R10 | **P3** | **Color system / palette** | Pre-built accessible scales (light/dark/alpha), OKLCH-aware |
| R11 | **P3** | **Linting tool** | Library-aware lint rules so agents + humans don't drift from idiomatic usage |
| R12 | **P1** | **Internationalizable** | All user-visible strings replaceable per language; per-locale static bundles |
| R13 | **P1** | **Localizable via browser settings** | Locale-sensitive formatting (dates, numbers, relative time, RTL) from browser locale — no per-component code changes |

---

## 2. Candidates evaluated

| Candidate | Approach | Why considered |
|-----------|----------|----------------|
| **shadcn/ui + Radix Primitives + Vaul + Motion + Lucide + Radix Colors** | Composable stack — copy-paste components on top of headless primitives | Maximum control, best mobile drawer (Vaul), top-tier AI tooling |
| **HeroUI v3** (formerly NextUI) | Batteries-included, built on React Aria + Tailwind v4 | Beautiful by default, official MCP + llms.txt, React Aria has the strongest ARIA story |
| **Base UI 1.0** (MUI's headless) | Headless primitives | Just hit 1.0 (Feb 2026), made by the creators of Radix + Floating UI + MUI |
| **Mantine v8** | Full-feature library (120+ components) | Mature, comprehensive, excellent DX |
| **Park UI / Ark UI / Chakra v3** | Headless logic (Zag.js) + Panda CSS | Multi-framework, strong WAI-ARIA |
| **Konsta UI** | Mobile-first iOS/Material kit on Tailwind | Pure mobile-first specialty |
| **MUI / Ant** | Big design systems | Industry default — disqualified for size + ergonomics on mobile |

---

## 3. Comparison matrix

Legend: ✅ strong match · 🟡 partial · ❌ poor · — irrelevant

| Requirement | shadcn-stack | HeroUI v3 | Base UI 1.0 | Mantine | Park UI | Konsta UI |
|---|---|---|---|---|---|---|
| R1 Mobile-first UX | ✅ Vaul — gestures, snap points, drag-to-resize | 🟡 Responsive but no built-in gesture/sheet primitives | 🟡 Drawer stable Mar 2026, no gesture primitives | ❌ Desktop-feel | 🟡 Multi-framework, no mobile primitives | ✅✅ Pure mobile-first |
| R2 Animations | ✅ Motion (best React anim lib, 30k stars) | 🟡 All CSS in v3 — light but capped | 🟡 Built-in transitions only | 🟡 Built-in transitions only | ❌ BYO animations | ✅ Native iOS/Material feel |
| R3 ARIA | ✅ Radix Primitives, 35k stars, well-tested | ✅✅ Built on React Aria (Adobe research) | ✅ Same lineage as Radix | ✅ Good | ✅ WAI-ARIA tested | 🟡 Less battle-tested |
| R4 Bundle / tree-shake | ✅✅ Only ships copied code | ✅ Tailwind v4 CSS-first, auto safelist | ✅ Modular | 🟡 120+ components, bigger surface | 🟡 Panda CSS overhead | ✅ Tailwind |
| R5 Themable JSON + CSS | ✅✅ CSS vars driven by JSON, total CSS ownership | 🟡 Tailwind config; JSON-injection needs a mapping layer | ✅ BYO CSS | ❌ Deep TS theme object, not JSON | ✅ Panda tokens | 🟡 Tailwind only |
| R6 Component coverage | ✅ via shadcn registry + community blocks | ✅ 75+ components | 🟡 35 components, growing | ✅✅ 120+ | ✅ Full | 🟡 40+, mobile-only |
| R7 AI docs / skills / MCP | ✅✅ Official MCP, `llms.txt`, **shadcn/skills** (Mar 2026) | ✅✅ Official MCP (`@heroui/react-mcp`), `llms.txt`, `llms-full.txt`, agent skills | 🟡 Inherits MUI docs, no dedicated MCP yet | 🟡 Good docs, no official MCP | 🟡 Chakra v3 docs | ❌ |
| R8 Community / releases | ✅✅ Massive ecosystem | ✅ Strong, faster cadence since rebrand | ✅ MUI-backed, just hit 1.0 | ✅ Mature | 🟡 Smaller | 🟡 Framework7 team |
| R9 Icons | ✅ Lucide (1.5K+, ~16× more popular than Phosphor, best tree-shake) | ✅ Pluggable | ✅ Pluggable | ✅ Tabler bundled | ✅ Pluggable | ✅ Bundled |
| R10 Color system | ✅✅ Radix Colors (30 scales, light/dark/alpha, OKLCH) | 🟡 Tailwind palette | 🟡 BYO | ✅ Mantine palette | ✅ Panda tokens | 🟡 Tailwind |
| R11 Lint tool | ✅ shadcn CLI (`diff`, `add --overwrite`) + `eslint-plugin-tailwindcss` + `jsx-a11y` | 🟡 Tailwind/jsx-a11y plugins; nothing HeroUI-specific | 🟡 jsx-a11y | 🟡 jsx-a11y | 🟡 jsx-a11y | 🟡 Tailwind plugins |

---

## 4. Why not the alternatives

### HeroUI v3 — strong second place

HeroUI v3 is genuinely impressive: official MCP + llms.txt + llms-full.txt + agent skills
(matches shadcn's AI tooling), built on React Aria (slightly better ARIA than Radix per
Adobe research), Tailwind v4 CSS-first theming.

**Why we don't pick it as the default:**

1. **Mobile gestures.** No built-in equivalent of Vaul. We'd have to bolt Vaul on anyway — at which point the shadcn stack wins on integration coherence.
2. **Animations capped.** v3's "all CSS" approach forecloses gesture-driven animations and FLIP-style layout transitions that Motion provides.
3. **Customization ceiling.** ~50% control vs. shadcn's ~95%. Our `ListWidget` needs to deeply re-skin per host theme.

### Base UI 1.0 — promising but early

Just hit 1.0 in Feb 2026 (35 components). MUI-backed, made by the same people who made
Radix and Floating UI. Real long-term contender, but component count is still building
out and no dedicated MCP / agent skill yet. Worth re-evaluating in 6 months.

### Mantine — wrong shape

120+ components, deep theme — but a TS theme object (not JSON-friendly), desktop-first
feel, no gesture primitives. Right for an admin dashboard, wrong for a mobile-first iframe widget.

### Park UI / Ark UI / Chakra v3 — animation gap

Strong headless layer (Zag.js state machines). But their docs tell you to bring your own
animations, and there's no mobile sheet primitive. We'd still end up adding Motion + Vaul.

### Konsta UI — too opinionated

Pure mobile-first kit (iOS/Material). Locks us into a visual language that's the wrong
default for a themable widget meant to blend into arbitrary host chat surfaces.

### MUI / Ant Design — disqualified

Bundle size and ergonomics rule them out. Both ship a heavy runtime; both fight you on theming.

---

## 5. How JSON theming works

The host passes a JSON theme envelope over `postMessage` (M4):

```jsonc
{
  "primary": "violet",        // a Radix Colors scale name
  "neutral": "slate",
  "radius": "0.625rem",
  "fontFamily": "Inter, system-ui, sans-serif",
  "appearance": "auto"        // "light" | "dark" | "auto"
}
```

The `ListWidget` translates that to CSS variables on `:root` (or a scoped class):

```css
:root {
  --color-primary-1: var(--violet-1);
  --color-primary-9: var(--violet-9);
  --radius: 0.625rem;
  --font-sans: Inter, system-ui, sans-serif;
}
```

Tailwind utilities consume those vars (`bg-primary`, `rounded-[var(--radius)]`). Theme
switching is a CSS-var swap — no re-render, no JS theme runtime.

For advanced hosts, a `themeStylesheetUrl` field in the same envelope lets them inject
their own CSS file that overrides vars / utilities.

---

## 6. How rich animations work

- **Layout animations** (ListElement add/remove/reorder): `<AnimatePresence>` + `<motion.li layout>`
- **Bottom sheet on mobile**: Vaul's `Drawer` (gestures + snap points)
- **Micro-interactions** (button press, checkbox tick): Motion `whileTap` / `whileHover` or CSS keyframes via Tailwind
- **Page-level transitions**: Motion `<motion.div initial/animate/exit>`

---

## 7. Open questions

### 7.1 Bundle budget — *deferred*

No target yet — measure during the M1 spike, then set a budget based on actual numbers.

### 7.2 Theme envelope shape — *deferred*

Defined when M4 (host ↔ iframe protocol) starts. Lives in
[`packages/alistigo-host-protocol/`](../../packages/alistigo-host-protocol/).
Components internally expose theme as plain CSS variables so any envelope shape can map onto them.

### 7.3 Biome plugins — *answered*

**Biome cannot run ESLint plugins.** The plugin system is GritQL-only. Biome already
covers a working subset of `jsx-a11y` natively but does not have Tailwind class
ordering.

**Decision for M1:** Option **A — ship without ESLint**. Re-evaluate after building real
components: if Tailwind drift becomes visible in PRs, write a GritQL plugin (B) before
adding ESLint (C).

| Aspect | Biome status (May 2026, v2.4) |
|---|---|
| Plugin format | GritQL-only since Biome 2.0 (June 2025) |
| JS/TS plugins | Not yet — on roadmap |
| ESLint plugin compatibility | None — Biome ports some ESLint rules natively |
| Tailwind class sorting | Not in Biome — tracking [#7030](https://github.com/biomejs/biome/discussions/7030) |
| `jsx-a11y` | Partial port — covers most common rules |
| `react-hooks` | Not yet in Biome — roadmap item for 2026 |

### 7.4 Vaul on desktop — *open*

Vaul is mobile-first; on desktop we want a side `Sheet`. shadcn ships both — verify prop
API symmetry during the M1 spike.

### 7.5 Motion bundle cost — *open*

Motion is ~30 KB minified. Decide after the M1 spike with a real list re-order animation
in hand. Fallback: CSS `@starting-style` + `view-transition-name` + Tailwind keyframes.

---

## 8. Internationalization & Localization

### Architecture

- **l10n (runtime):** the chosen stack handles it — RTL via shadcn/ui + Tailwind logical
  utilities (`ms-*`, `me-*`), `dir` attribute propagation via Radix Primitives, date/number
  formatting via browser `Intl.*` APIs. Nothing extra to install.
- **i18n (translation):** per-language static bundles via **Lingui v6**. One build per
  locale → one static bundle. Switching languages = reloading the iframe with a different `src`.
  No runtime locale switching, no language-switcher inside the bundle, no extra HTTP request.

### Lingui v6 — why

| Option | Bundle cost | Compile-time bundles | Verdict |
|---|---|---|---|
| **Lingui v6** | ~2 KB | ✅ First-class | ✅ **Chosen** |
| DIY (`messages.<locale>.ts`) | ~0 KB | ✅ Trivial | 🟡 Good for tiny string counts |
| FormatJS / react-intl | ~20 KB+ | 🟡 Possible | ❌ Too heavy |

Lingui-specific wins: per-locale bundles are a documented pattern, Vite plugin compiles
catalogs at build time, ICU MessageFormat handles plurals/selects correctly across all
languages.

### Build-time wiring

```ts
// vite.config.ts
import { lingui } from "@lingui/vite-plugin";
const LOCALE = process.env.LOCALE ?? "en";
export default defineConfig({
  plugins: [react(), tailwindcss(), lingui()],
  define: { "import.meta.env.VITE_LOCALE": JSON.stringify(LOCALE) },
});
```

```tsx
import { Trans } from "@lingui/react/macro";
import { t } from "@lingui/core/macro";

<Trans>Delete "{name}"</Trans>
<input aria-label={t`Add element`} />
```

### Status — implemented (en + fr, 2026-05-02)

- ✅ Workspace-level `lingui.config.ts` — source `en`, locales `[en, fr]`
- ✅ Components package switched to Vite library mode for macro transforms
- ✅ Embedded app reads `LOCALE` env, resolves build-time catalog alias, emits to `dist/${LOCALE}/`
- ✅ Boot module sets `<html lang>` / `<html dir>` before React mounts
- ✅ Per-locale build scripts: `build:en`, `build:fr`, `build:all`
- ✅ Workspace scripts: `pnpm i18n:extract`, `pnpm i18n:extract:clean`, `pnpm i18n:compile`
- ✅ Verified: `dist/en/` contains zero occurrences of French strings and vice versa

**Adding a new locale:**
1. Add BCP-47 code to `locales` in `lingui.config.ts`
2. `pnpm i18n:extract` — generates empty `.po` for the new locale
3. Translate `packages/alistigo-list-components-react/src/locales/<code>/messages.po`
4. Add `build:<code>` script in the embedded app `package.json`
5. If RTL, add to `RTL_LOCALES` in `apps/alistigo-artifact-playground/src/i18n.ts`

---

## 9. Sources

- [shadcn/ui CLI v4 + agent skills (March 2026)](https://ui.shadcn.com/docs/changelog/2026-03-cli-v4)
- [shadcn/ui MCP Server](https://ui.shadcn.com/docs/registry/mcp)
- [shadcn/ui RTL support](https://ui.shadcn.com/docs/rtl)
- [Vaul — Drawer for React](https://allshadcn.com/tools/vaul/)
- [Motion (formerly Framer Motion)](https://motion.dev/)
- [Radix Colors](https://www.radix-ui.com/colors)
- [Lucide vs. Phosphor 2026](https://www.wmtips.com/technologies/compare/lucide-vs-phosphor-icons/)
- [Introducing HeroUI v3](https://heroui.com/docs/react/releases/v3-0-0)
- [HeroUI MCP Server](https://heroui.com/docs/react/getting-started/mcp-server)
- [MUI Releases Base UI 1.0](https://www.infoq.com/news/2026/02/baseui-v1-accessible/)
- [Lingui — Internationalization Framework](https://lingui.dev/)
- [Lingui Vite Plugin](https://lingui.dev/ref/vite-plugin)
- [Biome — GritQL plugins](https://biomejs.dev/reference/gritql/)
- [Biome v2.4 — HTML accessibility rules](https://biomejs.dev/blog/biome-v2-4/)
- [Biome 2026 Roadmap](https://biomejs.dev/blog/roadmap-2026/)
- [Biome plugins distribution — discussion #6265](https://github.com/biomejs/biome/discussions/6265)
- [Biome — discussion #7030 — Tailwind class sorting](https://github.com/biomejs/biome/discussions/7030)
- [Konsta UI](https://konstaui.com/)
- [Park UI joins Chakra](https://park-ui.com/blog/park-ui-joins-the-chakra-ui-organization)
