# ADR 0022 — Artifact User Plugin: Device-Scoped Identity via Plugin System

**Status:** Accepted  
**Date:** 2026-08-20  
**Context:** Artifact artifacts have no concept of identity. Every user who opens an artifact is anonymous, making it impossible to attribute actions or personalise the experience. This ADR captures the decisions made while introducing `@alistigo/artifact-user-plugin`.

---

## Context

Alistigo artifacts are embedded in third-party hosts (primarily Claude). There is no server-side session, no login, and no guarantee of a storage backend. Any identity solution must:

- work in a completely ephemeral environment (no storage plugin active)
- degrade gracefully when storage is available but the user is a first-time visitor
- not require a login flow or any PII
- surface the identity in the anchor menu without coupling `artifact-list` to a specific plugin

---

## Decisions

### 1. Device-scoped identity, not account-based

**Decision:** Each device/browser gets a random `crypto.randomUUID()` as its user ID, persisted in the active storage plugin under the key `"user"`.

**Rejected alternatives:**

| Alternative | Reason rejected |
|------------|----------------|
| OAuth / server login | Requires a backend, redirect flow, and PII handling — incompatible with the embedded Claude context |
| Fingerprinting | Fragile, privacy-hostile, and banned in many jurisdictions |
| Host-provided identity | Claude/host API does not expose a stable user token to artifacts |

**Consequence:** Two browsers on the same physical machine get different identities. This is acceptable for M1 — the goal is "not anonymous", not "single account across devices".

---

### 2. Human-readable pseudo + generated identicon, no PII

**Decision:** The identity is surfaced as `AdjectiveAnimalNN` (e.g. `FrostyPanda42`) and a 50×50 jdenticon SVG avatar, both derived deterministically from the UUID seed.

**Avatar library chosen: jdenticon v3**

| Library | Size | Output | License | Why not |
|---------|------|--------|---------|---------|
| **jdenticon** | ~15 KB min | SVG | MIT | — chosen |
| identicon.js | ~8 KB | Canvas/PNG | BSD-2 | Requires Canvas API, no SVG |
| boring-avatars | ~6 KB | SVG | MIT | React-only, no seed-to-SVG without mounting |
| DiceBear | ~20–80 KB | SVG | MIT | Large, many styles, more than needed |

Jdenticon's `toSvg(seed, size)` returns a plain SVG string with no DOM dependency, which is exactly what's needed for a data URL avatar in a plugin context.

**Pseudo generation:** No library. Two hardcoded arrays (32 adjectives × 32 animals) plus a djb2 hash give 32 × 32 × 90 = 92,160 distinct pseudos — enough for an MVP, deterministic, zero bundle cost.

---

### 3. Identity persisted via the storage plugin abstraction, not directly to localStorage

**Decision:** The plugin reads and writes under `ctx.store?.get("user")` / `ctx.store?.set(...)`. If `store` is absent (no storage plugin configured), the identity lives only in module-level state for the session.

**Why not write directly to `localStorage`?**

The storage plugin abstraction exists precisely so the artifact does not hard-code a storage backend. The Claude host provides Claude storage; other hosts may use localStorage or nothing. Bypassing `ctx.store` would break this contract and prevent storage plugins from managing their own key namespacing.

**Consequence:** If no storage plugin is active, the identity resets on every page load. This is surfaced to the user implicitly (the badge shows a fresh pseudo), not explicitly. A future ADR can decide whether to warn the user.

---

### 4. Plugin API extended with `store`, `requires`, and render-props

**Decision:** Rather than hardcoding the user plugin's needs into `artifact-list`, three additions were made to the plugin API:

| Addition | Purpose |
|----------|---------|
| `PluginContext.store?: KeyValueStore` | Gives plugins access to the active storage without knowing which backend is in use |
| `AlistigoPlugin.requires?: string[]` | Declarative dependency list; runtime logs a warning if a required plugin is not loaded |
| `AlistigoPlugin.renderStatusBadge?(onToggle) => ReactNode` | Lets a plugin inject a UI element to the left of the Alistigo anchor button |
| `AlistigoPlugin.renderMenuContent?() => ReactNode` | Lets a plugin inject content inside the anchor menu panel |
| `"user:changed"` event in `AlistigoPluginEventMap` | Standard event bus notification when user profile changes |

`wrapRoot()` was already defined on `AlistigoPlugin` and wired in `createPluginRuntime()`, but `ArtifactRoot.tsx` never called it. This PR activates it so provider-style plugins can inject React context.

**Why render-props instead of a fixed slot?**

`artifact-list` must not import anything from `artifact-user-plugin`. If it did, the user plugin would become a required dependency rather than an optional add-on. Render-props keep `artifact-list` clean: it iterates plugins and calls the first `renderStatusBadge` it finds, with no knowledge of what it renders.

---

### 5. Modal rendered via React portal, not inside the anchor menu DOM

**Decision:** `UserEditModal` is rendered with `createPortal(…, document.body)` from inside `AvatarBadge`, not as a child of the anchor menu panel.

The anchor menu panel uses `translateY(-100%)` and `overflow: hidden` to animate in from above. A modal rendered as its child would be clipped. The portal escapes the stacking context so the modal can overlay the full viewport correctly.

---

## Consequences

- Any future plugin that needs to persist data can access `ctx.store` without touching `artifact-list` or `artifact-core-components-react`
- Any future plugin that needs an anchor-menu entry point uses `renderStatusBadge` / `renderMenuContent` — no changes to `App.tsx` required
- Device identity is not portable across browsers or devices by design; a future "link devices" or "log in" feature would supersede this ADR
- The `requires` field is advisory today (logs a warning, does not abort); it can be promoted to a hard error when the plugin ecosystem matures
