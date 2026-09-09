---
status: accepted
date: 2026-08-20
deciders: Mikael Labrut
---

# ADR 0022 — Artifact User Plugin: Device-Scoped Identity

**Status:** Accepted
**Date:** 2026-08-20

## Context

Alistigo artifacts have no concept of identity. Every user who opens an artifact is anonymous — there is no way to attribute an action (e.g. "added item X") to a specific person, and nothing distinguishes one device from another in multi-user scenarios.

The identity solution must operate within a strict set of constraints:

| ID | Requirement | Priority |
|----|-------------|----------|
| R1 | Works in the Claude artifact sandbox with no server-side session or redirect flow | P1 |
| R2 | Degrades gracefully when no storage plugin is active (ephemeral identity, not a crash) | P1 |
| R3 | Collects no PII — no email, name, or device fingerprint | P1 |
| R4 | IDs follow the project-wide TypeID format (see ADR 0023) | P1 |
| R5 | The artifact-list host must not import anything from the user plugin directly | P1 |
| R6 | Avatar must render as SVG, no Canvas dependency, no external network request | P2 |
| R7 | User can replace the generated avatar with an uploaded image or a new identicon | P2 |

## Decision

Introduce `@alistigo/artifact-user-plugin`. Each device is assigned a persistent identity composed of:

- **id** — a TypeID with prefix `usr` (e.g. `usr_01arZ3vDWGXSMBTPCJNMDQSKBR`) stored under key `"user"` in the active storage plugin
- **pseudo** — a human-readable name derived deterministically from the id (`AdjectiveAnimalNN`, e.g. `FrostyPanda42`)
- **avatar** — a 50×50 jdenticon SVG identicon, embedded as a base64 data URL

The identity is created on first load if none is found in storage, and updated in-place when the user edits their pseudo or avatar.

Four plugin API additions enable this without coupling `artifact-list` to the user plugin:

1. `PluginContext.store?: KeyValueStore` — gives plugins access to the active storage backend
2. `AlistigoPlugin.requires?: string[]` — declarative dependency declarations (advisory)
3. `AlistigoPlugin.renderStatusBadge?(onToggle) => ReactNode` — render-prop for the anchor menu badge slot
4. `AlistigoPlugin.renderMenuContent?() => ReactNode` — render-prop for content inside the anchor menu panel

`ArtifactRoot.tsx` activates the previously-wired-but-never-called `runtime.wrapRoot()` so that provider-style plugins (like this one) can inject React context.

## Rationale

### Identity model — device-scoped over account-based

| Criterion | Account login | Device-scoped (chosen) |
|-----------|--------------|------------------------|
| Works in Claude iframe sandbox | No — requires redirect or popup | Yes |
| Requires PII | Yes — email at minimum | No |
| Backend dependency | Yes — session store | No |
| Setup friction | High | Zero |
| Cross-device consistency | Yes | No (by design for M1) |

Account-based identity would require an OAuth redirect or a popup — neither of which works inside Claude's artifact iframe. Device-scoped identity satisfies R1–R3 with zero infrastructure cost.

### Avatar generation — jdenticon over alternatives

| Library | Size | Output | DOM dep. | License |
|---------|------|--------|----------|---------|
| **jdenticon** | ~15 KB | SVG string | None | MIT |
| identicon.js | ~8 KB | Canvas/PNG | Canvas API | BSD-2 |
| boring-avatars | ~6 KB | JSX | React required | MIT |
| DiceBear | 20–80 KB | SVG (via DOM) | Yes | MIT |

Jdenticon's `toSvg(seed, size)` returns a plain SVG string with no DOM or React dependency (R6), making it the only option that works reliably in the plugin's `setup()` lifecycle before React mounts.

### Pseudo generation — no library

32 adjectives × 32 animals × 90 two-digit suffixes = 92,160 distinct pseudos derived deterministically from the user id seed via a djb2 hash. No additional bundle cost. Future pseudos can be added by extending the arrays.

### Storage abstraction — ctx.store over direct localStorage

Writing directly to `localStorage` would bypass the storage plugin abstraction and break compatibility with the Claude storage backend and any future storage provider. `ctx.store` is the correct channel (R1).

### Plugin API — render-props over fixed slots

`artifact-list` must not hard-import components from `artifact-user-plugin` (R5), otherwise the user plugin becomes a required dependency. Render-props (`renderStatusBadge`, `renderMenuContent`) let `artifact-list` remain agnostic: it iterates plugins and calls whichever one exposes a badge renderer, with no knowledge of what it renders.

### Modal portal — createPortal over inline child

`UserEditModal` is rendered via `createPortal(..., document.body)` from inside `AvatarBadge`. The anchor menu panel uses `translateY(-100%)` animation with `overflow: hidden`, which clips any children positioned outside the panel bounds. The portal escapes the stacking context so the modal overlays the full viewport correctly.

## Consequences

**Positive:**
- Any future plugin that needs to persist data uses `ctx.store` without touching `artifact-list`
- Any future plugin that needs an anchor-menu entry point uses `renderStatusBadge` / `renderMenuContent` — no changes to `App.tsx` required
- `wrapRoot()` is now active, enabling all provider-style plugins going forward

**Negative / tradeoffs accepted:**
- Identity is not portable across browsers or devices — a future login feature would supersede this
- The `requires` field is advisory (logs a warning, does not abort); it can be promoted to a hard error when the plugin ecosystem matures
- If no storage plugin is active, identity resets on every page load with no visible warning to the user

## Alternatives considered

- **OAuth / server login** — rejected: requires a backend and a redirect flow incompatible with the Claude iframe sandbox
- **Browser fingerprinting** — rejected: fragile, privacy-hostile, and regulated in many jurisdictions
- **Host-provided identity** — rejected: Claude does not expose a stable user token to artifacts
- **Hardcoded avatar slot in App.tsx** — rejected: couples `artifact-list` to the user plugin; instead use render-props (R5)
