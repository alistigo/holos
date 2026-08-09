---
status: superseded
channel: linkedin
createdAt: 2026-07-30
publishedAt:
url:
attachment:
---

<!-- SUPERSEDED 2026-08-09: `@alistigo/artifact-storage-explorer` (window.storage only)
was expanded into `@alistigo/artifact-claude-capabilities-demo`, covering all 5
inject-script APIs (storage, window.claude.complete, blob download, fetch, window.open).
This draft is not being published on its own — see
posts/artifact-claude-capabilities-demo-launch-2026-08-06/linkedin/post.md, which is
now positioned as post 2 of the origin-story arc. Kept here for reference, not deleted. -->

<!-- Original draft body below, unchanged -->


I got curious about what's actually inside the Claude artifact sandbox.

Every HTML artifact Claude generates runs in an iframe. Before it loads, Claude injects a small bridge script — not yours, not part of your artifact's code. It wires up a few APIs that your JavaScript can call: a proxied fetch, a console bridge, URL object helpers, and — the one I kept thinking about — `window.storage`.

`window.storage` is a promise-based key-value store backed by the conversation. `get`, `set`, `delete`, `list`. Private namespace (scoped to your artifact) and a shared namespace (available across artifacts in the same conversation).

I'd been using it for persistence in `@alistigo/artifact-list`. But I had no way to see what was actually accumulating in there. No inspector, no reset, nothing.

So I built one.

`@alistigo/artifact-storage-explorer` is a Claude artifact that does one thing: shows you what's in `window.storage`. Paste the script tag into a conversation, run it, and you get a split-pane explorer — private keys on one side, shared on the other. Click a key, see the JSON. Delete what you don't need.

It's out on npm now. Usable by anyone building with the Claude artifact API.

<!-- Draft notes
Formula: F3 Build-Log (concrete problem → specific solution → shipped it)
Characters: ~1,060 | Words: ~200
Audit: no em-dash chains, no "game-changing", no "seamless", no generic opener
Outbound link: put npm link in first comment to avoid reach penalty
Posting window: Tue–Thu 7:30–9:00 AM CET
Attachment: none planned (could add a screenshot later)
-->
