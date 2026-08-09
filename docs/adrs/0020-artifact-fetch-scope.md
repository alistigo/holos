# ADR 0020 — Claude Artifact `window.fetch` is Anthropic-API-Only

**Status:** Accepted  
**Date:** 2026-08-09  
**Context:** `artifact-claude-capabilities-demo` v0.2 shipped with an API Calls tab using httpbingo.org examples, the README described `window.fetch` as a general HTTP proxy, and the skill described pre-filled examples from httpbin.org. A live testing session on 2026-08-08 found all of this to be incorrect.

---

## Context

Claude's inject-script replaces `window.fetch` in every artifact iframe with a postMessage proxy that forwards the request to the parent Claude frame. The project assumed this proxy was a general-purpose HTTP client — equivalent to fetching from a server-side node with no CORS restrictions. That assumption was wrong.

### What was tested and found

| Test | Result |
|------|--------|
| `fetch('https://httpbingo.org/get')` from artifact | `NetworkError` — rejected at network layer |
| `fetch('https://api.anthropic.com/v1/messages')` from artifact | Success — response received |
| Adding httpbingo.org to Capabilities → Domain allowlist | No effect on artifact fetch |
| Loading jsDelivr bundle from `cdn.jsdelivr.net` | Loads fine (different gate: `script-src`, not `connect-src`) |
| Regenerating the artifact HTML file | Byte-identical — domain lists are not in the artifact file |

### The key architectural insight

`script-src` and `connect-src` are independent CSP directives. A CDN loading correctly from
`cdn.jsdelivr.net` says nothing about whether `fetch()` can reach that same origin.

The inject-script's `window.fetch` is a **mediation layer**, not a proxy. The parent frame
receives the `proxyFetch` postMessage and decides which destinations to forward it to. Based on
observed behaviour, the parent forwards only `api.anthropic.com` — no other origin.

The Capabilities domain allowlist controls the **code-execution sandbox** (Bash environment),
not artifact iframe network access. There is no user-facing setting that extends the artifact
`connect-src` allowlist.

### Escape hatches for external data

| Mechanism | How it works |
|-----------|-------------|
| `web_search` tool via `api.anthropic.com/v1/messages` | Claude performs the fetch server-side; the iframe never contacts the external origin |
| MCP connectors | Separate bridge channel, not `window.fetch` |

**Caveat:** Any artifact that calls back to `api.anthropic.com` requires the viewer to have an
active Claude session. Artifacts relying on this cannot be shared fully publicly.

---

## Decision

1. **Rename the mental model.** `window.fetch` in an artifact iframe is an *Anthropic API bridge*, not a generic network proxy. All documentation, READMEs, and skill files must reflect this.

2. **Replace the API Calls tab examples.** Remove all httpbingo.org endpoints. Replace with Anthropic API calls: simple completion, streaming completion, web search tool. Retain two blocked examples (httpbingo.org, api.github.com) with a "fails" badge to demonstrate the failure mode explicitly rather than hiding it.

3. **Add a scope notice to the UI.** A persistent amber banner in the API Calls tab explains the constraint before the user sends a request that will fail.

4. **Correct all downstream documentation.** The skill SKILL.md, skill README, artifact README, and `docs/research/claude-artifacts-capabilities.md` all contained incorrect or incomplete information about this behaviour. Each is updated to reflect the confirmed findings.

5. **Add the PostMessage Log tab.** To make the bridge protocol observable (and to help future debugging of similar questions), add a new tab that captures all postMessage traffic in both directions.

---

## Consequences

- Developers reading the documentation will no longer attempt arbitrary `fetch()` calls from artifacts and be confused by the `NetworkError`.
- The API Calls tab now demonstrates what actually works — Anthropic API calls — instead of endpoints that always fail.
- The PostMessage Log tab makes the bridge protocol transparent, which aids debugging and further research into undocumented CSP behaviour.
- The confirmed pattern (`window.fetch` → `api.anthropic.com` only) is documented and referenced from the research doc, even though Anthropic has not published an official CSP policy.

---

## Still unverified

- The exact `connect-src` policy seen by the parent frame. Inferred from two data points; the authoritative version is readable at runtime via `securitypolicyviolation` event listener.
- Whether other Anthropic-owned origins (e.g., `api2.anthropic.com`) are forwarded by the parent.
- Whether jsDelivr is explicitly allowlisted for `script-src` or whether the policy permits any CDN. One third-party source claims only cdnjs is allowed; the jsDelivr result contradicts this.

---

## Related

- [ADR 0005](0005-claude-artifact-storage.md) — Storage in Claude Artifact Context
- [ADR 0019](0019-claude-artifact-draft-vs-published.md) — Claude Artifact Lifecycle: Draft vs. Published
- `docs/research/claude-artifacts-capabilities.md` — CSP details and full capability inventory
