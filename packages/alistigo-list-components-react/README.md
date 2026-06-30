# @alistigo/list-components-react

[![npm version](https://img.shields.io/npm/v/@alistigo/list-components-react.svg?style=flat)](https://www.npmjs.com/package/@alistigo/list-components-react)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue?logo=typescript)](https://www.typescriptlang.org/)
[![CI](https://github.com/alistigo/holos/actions/workflows/ci.yml/badge.svg)](https://github.com/alistigo/holos/actions/workflows/ci.yml)

React presentational components for the Alistigo base list app, built on
the repo's chosen stack (see
[`projects/alistigo-ai/ui-library-research.md`](../../projects/alistigo-ai/ui-library-research.md)
and [`.agents/skills/react-component/SKILL.md`](../../.agents/skills/react-component/SKILL.md)):

- **Tailwind CSS v4** — utility CSS, theme tokens via CSS variables
- **Radix Primitives** (`@radix-ui/react-slot`) + room to add Dialog, Drawer, etc. as needed
- **Vaul** — gesture-aware drawer/bottom sheet (mobile)
- **Motion** — list add/remove/reorder animations
- **Lucide** — icon set
- **Radix Colors** — accessible palette (light/dark/alpha, OKLCH-aware)
- `class-variance-authority` + `clsx` + `tailwind-merge` for class composition

This is the UI surface the [cucumber-js runner](../../cli/alistigo-features-runner-playwright/)
contract pins down — the `roles`, `data-testid`s, and accessible names exported from
[`cli/alistigo-features-runner-playwright/src/support/selectors.ts`](../../cli/alistigo-features-runner-playwright/src/support/selectors.ts)
are what the components in this package satisfy.

## Layout

```
src/
├── index.ts                      # public exports
├── styles/globals.css            # @import "tailwindcss"; + Radix Colors + token surface
├── lib/cn.ts                     # cn() helper (clsx + tailwind-merge)
├── ui/                           # shadcn-style primitives — owned, copy-style
│   ├── button.tsx
│   └── input.tsx
├── context/                      # AlistigoProvider + hooks (app glue)
├── AlistigoApp/                  # app root sentinel + composition example
├── AddElementInput/              # `role=textbox` + `role=button` add form
├── ListView/                     # `<ul>` with motion'd `<li>`s + delete buttons
└── EmptyState/                   # `data-testid="empty-state"` with Lucide icon
```

## Components

| Component | Role / data-testid | Notes |
|-----------|--------------------|-------|
| `<AlistigoApp>` | `[data-testid="alistigo-app"]` | App root sentinel — the runner's "page is loaded" cue. |
| `<AddElementInput>` | `role=textbox` (aria-label "Add element") + `role=button` ("Add") | Pressing Enter submits. |
| `<ListView>` | `role=list` (implicit on `<ul>`) + `role=listitem` per element | Row delete button: `role=button` with name `Delete "<text>"`. Items animate in/out via Motion. |
| `<EmptyState>` | `[data-testid="empty-state"]` | Shown automatically by `<ListView>` when `numberOfItems === 0`. |

All components are **pure presentational**: they accept props and call back. State, persistence, command/event flow, and document hydration live in the app, not here.

## Using the styles

The package ships its CSS as a side-effectful import:

```ts
// once, at app boot
import "@alistigo/list-components-react/styles.css";
```

This pulls in Tailwind v4, the Radix Colors scales, and the semantic
tokens (`--color-bg`, `--color-fg`, `--color-primary-9`, `--radius`, …).
Override any of those on `:root` (or a scoped class) to re-theme — no
JS theme runtime needed.

## Adding a shadcn primitive

The package has `components.json` set up for shadcn CLI v4. From inside
the package directory:

```sh
npx shadcn@latest add <name>     # e.g. dialog, drawer, dropdown-menu
```

Files land in `src/ui/`. We own them — edit freely. The shadcn agent
skill at [`.agents/skills/shadcn/`](../../.agents/skills/shadcn/) is auto-loaded
and will guide rules + composition patterns.

## Storybook

This package ships its own Storybook (per-package, not workspace-wide).

```sh
nx run alistigo-list-components-react:storybook       # dev server on http://localhost:6006
nx run alistigo-list-components-react:build-storybook # static build → storybook-static/
```

Stories live next to the component they exercise: `src/<Component>/<Component>.stories.tsx`.
The Storybook Vite config wires in `@tailwindcss/vite` and the preview
imports `globals.css`, so stories see the same styles the iframe app
will.

## Adding a component

1. Create `src/<Name>/<Name>.tsx` — keep it presentational; props in, callbacks out. Compose from `src/ui/`.
2. Add `src/<Name>/<Name>.stories.tsx` covering at least the default + edge states.
3. Add `src/<Name>/index.ts` re-exporting the component and its props type.
4. Re-export from [`src/index.ts`](src/index.ts).
5. If the component introduces a new role / testid, mirror it in [`cli/alistigo-features-runner-playwright/src/support/selectors.ts`](../../cli/alistigo-features-runner-playwright/src/support/selectors.ts) — that file is the contract.
