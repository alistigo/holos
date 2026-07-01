---
name: react-component
description: React component conventions for this repo — semantic HTML first, then the chosen stack (shadcn/ui + Radix Primitives + Vaul + Motion + Tailwind v4 + Lucide + Radix Colors), package layout, theming, animations, and the dos & don'ts. INVOKE WHEN building React UI components or apps in this repo, scaffolding a new presentational package, or making styling/animation decisions.
---

# React component skill — semantic HTML, owned components, mobile-aware

The standard for React UI work in this repo. The bar is **low on framework
runtime, high on accessibility, mobile feel, and animation richness**. The
stack was chosen in
[`projects/alistigo-ai/ui-library-research.md`](../../../projects/alistigo-ai/ui-library-research.md);
this skill is what that decision actually *means* when you sit down to write
a component.

## Principles (non-negotiable)

1. **Semantic HTML wins.** Use the element that already means what you want
   — `<button>`, `<input>`, `<ul>/<li>`, `<form>`, `<dialog>`, `<details>`,
   `<label>`. Reach for `role="…"` only to clarify, never to *replace* a
   real element.
2. **The unstyled page must be usable.** Strip all CSS — your component
   still works. Focus order is correct, every action is reachable by
   keyboard, every interactive element announces itself to a screen
   reader. If it doesn't, the markup is wrong, not the styling.
3. **ARIA is metadata, not behavior.** `role="button"` on a `<div>` does
   not make it focusable, keyboard-activatable, or announce as a button.
   Use `<button>`. ARIA exists to *fill gaps* in HTML semantics
   (live regions, expanded/selected/checked state on custom widgets), not
   to paper over the wrong element.
4. **Keyboard is the API.** Every interaction reachable by mouse must be
   reachable by keyboard alone. Tab order follows DOM order — fight it
   only with intent.
5. **Mobile is the design target.** This repo's apps are used mostly on
   mobile. Hit areas ≥ 44 × 44 px, gestures over hover-only affordances,
   bottom-sheet drawers over centered modals on small screens.
6. **Props in, callbacks out.** Presentational components never own
   domain state. They render what they're given and emit what the user
   did. Domain state lives in a context/store, not duplicated across
   components.

## The stack (chosen, not a menu)

| Layer | Library | What it gives us |
|-------|---------|------------------|
| Headless ARIA primitives | **Radix Primitives** (`@radix-ui/react-*`) | Battle-tested ARIA + keyboard semantics for Dialog, Dropdown, Tooltip, Popover, Tabs, Toggle, Checkbox, RadioGroup, Switch, etc. |
| Component templates (copied) | **shadcn/ui** | Pre-styled wrappers we *own* (no version drift) on top of Radix |
| Mobile drawer / bottom sheet | **Vaul** | Gesture-aware drawer with snap points — used as shadcn's `Drawer` |
| Animations | **Motion** (`motion/react`) | Layout, gesture, spring, exit animations |
| Styling engine | **Tailwind CSS v4** | Utility CSS via CSS variables — theme tokens are CSS vars, swap at runtime |
| Utility merge | **`clsx` + `tailwind-merge`** via `cn()` | Class composition without conflicts |
| Variants | **`class-variance-authority` (cva)** | Type-safe component variants |
| Color system | **`@radix-ui/colors`** | ~30 accessible scales, light/dark/alpha, OKLCH-aware |
| Icons | **`lucide-react`** | ~1.5K SVG icons, per-icon imports, MIT |

**Don't reach for:** MUI, Ant Design, Chakra UI, Mantine, Bootstrap-React.
They were considered and rejected — see the research doc for why. If you
think you have a reason to add one, write it in the research doc first.

### When you still write the element by hand

Even with shadcn in the package, **don't reach for shadcn for trivial
primitives**. A literal `<button>` is fine for a one-off action. The
shadcn `Button` exists for variant consistency across the app, not as
a mandatory wrapper.

| Need | Native enough? | Stack answer |
|------|----------------|--------------|
| Single action button | ✅ `<button>` | Native — only use shadcn `Button` if you want variants |
| Text input | ✅ `<input>` | Native + shadcn `Input` for consistent styling |
| Checkbox / radio | ⚠️ native works, but tristate + custom checkmark are fiddly | Radix `Checkbox` / `RadioGroup` (via shadcn) |
| Form / list / details | ✅ `<form>` / `<ul>` / `<details>` | Native |
| Dialog (modal) on desktop | ⚠️ `<dialog>` is fine but focus-trap fiddly | Radix `Dialog` (via shadcn) |
| Drawer / sheet on mobile | ❌ no native | **Vaul `Drawer`** (via shadcn) — *required* for mobile |
| Combobox / autocomplete | ❌ no native | Radix `Combobox` (via shadcn) |
| Listbox / select with rich content | ❌ `<select>` can't render rich content | Radix `Select` (via shadcn) |
| Menu / dropdown / tooltip / popover | ❌ no native semantics | Radix `DropdownMenu` / `Tooltip` / `Popover` (via shadcn) |
| Tabs | ⚠️ doable by hand, ARIA is fiddly | Radix `Tabs` (via shadcn) |
| Toast | ❌ no native | shadcn `Sonner` |
| Date picker | ❌ `<input type="date">` is inconsistent | Radix-based date picker (via shadcn) |

## Theming — JSON-injectable, CSS-overridable

Theming flows through CSS variables. **No JS theme runtime, no theme
provider.** Components consume `var(--color-…)` / `var(--radius)` /
`var(--font-…)` and the host (or app boot code) writes the variables.

```css
/* src/styles/globals.css — token surface */
:root {
  --color-bg: var(--gray-1);
  --color-fg: var(--gray-12);
  --color-primary-9: var(--violet-9);
  --color-primary-fg: white;
  --color-border: var(--gray-6);
  --radius: 0.625rem;
  --font-sans: Inter, system-ui, sans-serif;
}

[data-theme="dark"] {
  --color-bg: var(--gray-1-dark);
  --color-fg: var(--gray-12-dark);
  /* … */
}
```

Tailwind v4 reads those vars natively (`bg-[var(--color-primary-9)]` or
via the configured `@theme` block). Switching themes is a CSS-var swap
— no re-render.

For the iframe widget (Alistigo), the host injects the theme as a JSON
envelope over `postMessage`; the widget translates that into CSS vars
on `:root`. See [`packages/alistigo-host-protocol/`](../../../packages/alistigo-host-protocol/)
(when M4 lands) for the envelope shape.

## Animations — Motion is the default, CSS for cheap things

| Animation kind | Tool |
|---|---|
| Hover / pressed states | Tailwind utilities (`hover:`, `active:`) |
| Show/hide a popover or dialog | Radix data attributes (`data-[state=open]:animate-in`) + Tailwind keyframes |
| List add / remove / reorder | **Motion `<AnimatePresence>` + `<motion.li layout>`** |
| Gesture-driven drawer | **Vaul** (handles drag, snap points, momentum) |
| Page-level transition | Motion `<motion.div initial/animate/exit>` |

Motion is ~30KB. Worth it for layout/gesture animations. Don't reach for
it for a 200ms fade — Tailwind keyframes are cheaper.

## Internationalization & localization

The architecture is **per-language bundles**: one build per supported
locale, browser-detected on the host page, served as a different
iframe `src`. **No runtime translation, no language switcher inside
the bundle.** Full rationale and tooling choice in
[research doc §9](../../../projects/alistigo-ai/ui-library-research.md#9-internationalization--localization).

What this means for any component you write:

1. **No string literals in JSX.** User-visible text comes from a
   centralized `messages.ts` (today), or from Lingui macros (`t`,
   `<Trans>`) once we adopt Lingui. Either way, the *literal* doesn't
   live in the component.
2. **Use logical Tailwind utilities — never physical ones.** This is
   the cheapest path to RTL working out of the box.

   | Don't | Do |
   |---|---|
   | `ml-2` `mr-2` | `ms-2` `me-2` |
   | `pl-3` `pr-3` | `ps-3` `pe-3` |
   | `left-0` `right-0` | `start-0` `end-0` |
   | `text-left` | `text-start` |
   | `border-l` `border-r` | `border-s` `border-e` |
   | `rounded-l-*` `rounded-r-*` | `rounded-s-*` `rounded-e-*` |
3. **Localized values use `Intl.*`.** Dates → `Intl.DateTimeFormat`,
   numbers → `Intl.NumberFormat`, relative time → `Intl.RelativeTimeFormat`,
   plurals → `Intl.PluralRules`, sorting → `Intl.Collator`. No date
   library, no `date-fns`. The browser already knows.
4. **Set `lang` and `dir` on the HTML root, not on individual
   components.** Components inherit. shadcn/ui + Radix respect the
   inherited `dir` automatically.
5. **Directional icons from Lucide need an RTL flip.** For arrows /
   chevrons that mean "back / next", either pick the right Lucide
   icon based on `dir` or use `rtl:rotate-180` on the icon.

### What our chosen stack handles for free

| Concern | Handled by |
|---|---|
| RTL layout, animation direction, focus-ring positioning | shadcn/ui + Radix + Tailwind logical utilities |
| Date / number / list / relative-time formatting | `Intl.*` (browser) |
| Native input localization (`<input type="date">` etc.) | Browser |
| Locale-aware sort | `Intl.Collator` (browser) |
| Spell-check + screen reader pronunciation | `lang="<bcp47>"` on the HTML root |

### Lingui v6 — installed and active

The repo runs Lingui v6 with English (source) and French already
shipped. Lingui's official skills (mirrored from
[`lingui/skills`](https://github.com/lingui/skills)) are installed
locally and auto-trigger on i18n work — read them when you write
translatable code:

- [`lingui-best-practices`](../lingui-best-practices/SKILL.md) —
  the playbook (Trans / `t` / `useLingui` / Plural; extraction;
  catalog compilation; common patterns).
- [`lingui-enhanced-message-context`](../lingui-enhanced-message-context/SKILL.md)
  — when and how to add translator comments so translators have the
  context they need.
- [`lingui-migrate-i18next-to-lingui`](../lingui-migrate-i18next-to-lingui/SKILL.md)
  — for migrating from i18next (we don't, but kept for reference).
- [`lingui-swc-plugin-compatibility`](../lingui-swc-plugin-compatibility/SKILL.md)
  — only relevant if we ever adopt SWC; we use Babel today.

Quick reference for our setup:

| Where | What |
|---|---|
| Catalogs | `packages/alistigo-list-components-react/src/locales/{en,fr}/messages.po` |
| Workspace config | [`lingui.config.ts`](../../../lingui.config.ts) at repo root |
| Build mode | Components: Vite library mode (so the Babel macro plugin runs); Apps: `@lingui/vite-plugin` + `@lingui/babel-plugin-lingui-macro` via `react()` |
| App boot | `apps/<app>/src/i18n.ts` loads + activates the baked catalog, sets `<html lang>` / `<html dir>` before React mounts |
| Per-locale bundle | App's `vite.config.ts` reads `LOCALE` env, alias `virtual:alistigo-active-catalog → .../locales/${LOCALE}/messages.po`, output to `dist/${LOCALE}/` |
| Build commands | `pnpm -F <app> build:en`, `… build:fr`, `… build:all` |
| Workspace scripts | `pnpm i18n:extract`, `pnpm i18n:extract:clean`, `pnpm i18n:compile` |

#### Writing translatable components

```tsx
import { msg } from "@lingui/core/macro";
import { useLingui } from "@lingui/react";
import { Trans } from "@lingui/react/macro";

function MyButton() {
  const { _ } = useLingui();
  return (
    <button aria-label={_(msg`Close`)}>
      <Trans>OK</Trans>
    </button>
  );
}
```

- `<Trans>` for content (children of JSX).
- `t\`...\`` or `_(msg\`...\`)` for **values** (props like `aria-label`,
  `placeholder`, `title`).
- `msg\`...\`` for declaring messages outside render scope (e.g. in a
  module-level constant) — call `_()` at the use site to resolve.
- **Interpolation** is implicit: `` _(msg`Delete "${name}"`) `` —
  Lingui rewrites to ICU `Delete "{name}"` at build time and the
  translator sees the placeholder.
- **No string literals in JSX text or in user-visible props.** Every
  string the user can see goes through a macro.

#### Adding a new locale

1. Add the BCP-47 code to `locales` in [`lingui.config.ts`](../../../lingui.config.ts).
2. `pnpm i18n:extract` — generates an empty `.po` for the new locale.
3. Translate `.../locales/<code>/messages.po` (or hand it to a
   localization service that speaks `.po`).
4. Add a `build:<code>` script in the consuming app's `package.json`.
5. If RTL, add the code to `RTL_LOCALES` in the app's
   `src/i18n.ts` so `<html dir="rtl">` is set at boot.

## Linting — Biome only on day one

Repo standard is **Biome**. We do *not* run ESLint. Biome cannot run
ESLint plugins (Biome's plugin system is GritQL-only and not for
distribution; see the
[research doc §8.3](../../../projects/alistigo-ai/ui-library-research.md#83-biome-plugins--answered)).

What this means in practice:

- **Tailwind class ordering is not auto-enforced.** Use `cva` and `cn()`
  to keep class strings short and structured. If a component's class
  list grows past one line, that's the smell — extract a variant or a
  child component.
- **`jsx-a11y` coverage is partial.** Biome's a11y ports + the v2.4 HTML
  rules cover the common cases (alt text, label association, button
  type, redundant roles). Catching the rest is review discipline.
- **`react-hooks/rules-of-hooks` is not enforced.** Discipline + TS
  exhaustive deps + tests. If we miss a stale-closure bug because of
  this, that's the trigger to revisit (research doc option B/C).

If you ever feel the missing rules are biting:
- **First**: write a 1-page GritQL plugin in `tools/biome-plugins/` for
  the specific pattern.
- **Last**: add ESLint as a focused secondary linter scoped to the rules
  Biome doesn't cover.

## Package layout

```
packages/<lib>/
├── components.json                  # shadcn registry config
├── .storybook/                      # per-package Storybook
│   ├── main.ts
│   └── preview.ts
├── src/
│   ├── index.ts                     # public exports
│   ├── styles/
│   │   └── globals.css              # @import "tailwindcss"; + token surface
│   ├── lib/
│   │   └── cn.ts                    # cn(...inputs) = twMerge(clsx(inputs))
│   ├── ui/                          # shadcn-owned primitives (button, input, drawer, dialog, …)
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   └── …
│   └── <Component>/                 # app-shaped components (composed from ui/)
│       ├── <Component>.tsx
│       ├── <Component>.stories.tsx
│       └── index.ts
├── package.json
├── project.json
└── tsconfig.json
```

Conventions:

- **`src/ui/` is shadcn's territory.** Run `npx shadcn@latest add <name>`
  from the package; the file lands in `src/ui/`. We own those files —
  edit freely.
- **`src/<Component>/` is app-shaped.** `AlistigoApp`, `ListView`,
  `AddElementInput`. Built by composing things from `src/ui/`.
- **One component per folder.** `<Component>/<Component>.tsx` +
  `<Component>.stories.tsx` + optional `<Component>.test.tsx`. Re-export
  from a barrel `<Component>/index.ts`.
- **Named exports only.** No default exports for components.
- **`type="button"` on every `<button>`** that isn't a form submit.
- **`htmlFor` + `id` on every label/input pair.** Don't rely on `<label>`
  wrapping alone for screen readers.
- **`aria-label` only when there's no visible text.**
- **`role="…"` only on custom widgets.** Never on native elements that
  already have a role.

## Component shape

Two flavors live next to each other.

**`src/ui/button.tsx` (a shadcn primitive — owned, copied):**

```tsx
import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/cn.js";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[var(--radius)] text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-9)] disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-[var(--color-primary-9)] text-[var(--color-primary-fg)] hover:bg-[var(--color-primary-10)]",
        ghost: "hover:bg-[var(--color-bg-subtle)]",
        outline: "border border-[var(--color-border)] bg-transparent hover:bg-[var(--color-bg-subtle)]",
      },
      size: {
        default: "h-11 px-4 py-2", // ≥44px hit area for mobile
        sm: "h-9 px-3",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild, type = "button", ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        type={asChild ? undefined : type}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";
```

**`src/ListView/ListView.tsx` (an app-shaped component):**

```tsx
import { AnimatePresence, motion } from "motion/react";
import { Trash2 } from "lucide-react";
import type { JSX } from "react";
import { Button } from "../ui/button.js";

export interface ListViewProps {
  items: { id: string; name: string }[];
  onDelete: (id: string) => void;
}

export function ListView({ items, onDelete }: ListViewProps): JSX.Element {
  return (
    <ul role="list" className="flex flex-col gap-2">
      <AnimatePresence initial={false}>
        {items.map((item) => (
          <motion.li
            key={item.id}
            layout
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -16 }}
            className="flex items-center justify-between rounded-[var(--radius)] border border-[var(--color-border)] px-3 py-2"
          >
            <span>{item.name}</span>
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Delete "${item.name}"`}
              onClick={() => onDelete(item.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </motion.li>
        ))}
      </AnimatePresence>
    </ul>
  );
}
```

## State / data flow (presentational packages)

```
┌────────────────────────────────────────────────────────────┐
│  Pure domain package (e.g. alistigo-document-editor)       │
│  - Takes input state, accepts commands, returns new state. │
│  - Zero React, zero DOM.                                   │
└─────────────────────────▲──────────────────────────────────┘
                          │
┌─────────────────────────┴──────────────────────────────────┐
│  React context layer (in the components package)           │
│  - Owns the editor instance.                               │
│  - Exposes useFooState() (read) + useFooActions() (write). │
└─────────────────────────▲──────────────────────────────────┘
                          │
┌─────────────────────────┴──────────────────────────────────┐
│  Presentational components                                 │
│  - Read via the hook, dispatch via the action callbacks.   │
│  - Stay testable in isolation by accepting props directly. │
└────────────────────────────────────────────────────────────┘
```

A component should work in Storybook from props alone (no Provider
needed). The Provider is glue for the *app*, not a requirement for
every component.

## Storybook (per-package)

Storybook is set up **per package**, not at the workspace root. Each
package owns its own Storybook so review stays scoped. Stories live next
to the component they exercise. Run `nx run <package>:storybook` to
launch on http://localhost:6006.

## shadcn skill — installed

The official shadcn agent skill (mirrored from
[`shadcn-ui/ui` `skills/shadcn/`](https://github.com/shadcn-ui/ui/tree/main/skills/shadcn))
lives at [`.agents/skills/shadcn/`](../shadcn/). It's auto-triggered by the
harness when the user mentions shadcn, presets, or works in a project
with a `components.json`. It tells the agent what shadcn CLI flags to
use, when to call `add` vs `view`, how the registry layout works, plus
detailed rules for [`styling.md`](../shadcn/rules/styling.md),
[`composition.md`](../shadcn/rules/composition.md),
[`forms.md`](../shadcn/rules/forms.md),
[`icons.md`](../shadcn/rules/icons.md), and
[`base-vs-radix.md`](../shadcn/rules/base-vs-radix.md). **Read it before
adding a new shadcn component.**

> **Note:** the upstream skill expects `npx shadcn@latest info --json`
> to succeed. That requires a `components.json` in the cwd — initialize
> per-package by running `npx shadcn@latest init` from inside the
> package whose components are being managed.

## Don'ts

- ❌ `onClick` on `<div>` / `<span>` — use `<button>`.
- ❌ `role="button" tabIndex={0}` on a `<div>` — use `<button>`.
- ❌ Custom CSS that breaks `:focus-visible`. The default is fine; if
  you remove it, replace it.
- ❌ `aria-hidden="true"` on focusable elements.
- ❌ Spreading `...props` into a native element without typing.
- ❌ Pulling in MUI / Ant / Chakra / Mantine / Bootstrap "just for one
  component."
- ❌ Mounting a global theme provider with a JS theme object — use CSS
  variables.
- ❌ Centered modal on mobile when a bottom-sheet `Drawer` is the right
  shape.
- ❌ `npm install <component-package>` for something shadcn ships — copy
  it via the CLI so we own the file.

## Versions (pin in package.json)

| Tool | Version |
|------|---------|
| React | ^19.2 |
| Tailwind CSS | ^4.0 |
| `motion` | ^11 |
| `vaul` | ^1.0 |
| `lucide-react` | ^0.456 |
| `@radix-ui/colors` | ^3.0 |
| `class-variance-authority` | ^0.7 |
| `clsx` | ^2.1 |
| `tailwind-merge` | ^2.5 |
| Storybook | ^10.3 |
| Vite | ^7 |
| `@vitejs/plugin-react` | ^4.3 |

## Reference implementation

- Components: [`packages/alistigo-list-components-react/`](../../../packages/alistigo-list-components-react/)
- The driver-playwright contract that pins ARIA roles on the rendered
  output: [`packages/alistigo-features-driver-playwright/src/selectors.ts`](../../../packages/alistigo-features-driver-playwright/src/selectors.ts)
- The library research that picked the stack: [`projects/alistigo-ai/ui-library-research.md`](../../../projects/alistigo-ai/ui-library-research.md)
