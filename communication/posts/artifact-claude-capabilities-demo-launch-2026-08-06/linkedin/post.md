---
status: draft
channel: linkedin
createdAt: 2026-08-06
publishedAt:
url:
attachment:
---

Last time, Claude built me a family tree inside a chat window, live, while I was cleaning up genealogical research. That got me curious about what else that panel could actually do.

I opened the dev tools and found the artifact sandbox wired to 5 live APIs, not just HTML with no backend. I'd been building on top of them one at a time for weeks, but there was no single place to see all five together. No "try it now." Just docs.

So I built one.

Here is what the inject-script gives every Claude artifact iframe:

`window.storage`
Read, write, delete key-value pairs. Private namespace scoped to your artifact, or a shared namespace across the conversation. Data persists across sessions.

`window.claude.complete()`
Call Claude from inside Claude. Type a prompt in the artifact, get a response back. The artifact can reason about its own output.

`URL.createObjectURL`
Generate a Blob in JavaScript, trigger a real file download. Claude intercepts `blob-request://` URLs and routes the file to your desktop.

`window.fetch`
HTTP requests from a sandboxed iframe, via a network proxy. I ran `GET https://httpbin.org/get` this morning with zero CORS issues.

`window.open`
Link clicks and programmatic navigation both work. The inject-script intercepts and opens in the parent frame.

I packaged all 5 into an interactive demo and published it: `@alistigo/artifact-claude-capabilities-demo`. One script tag, no build step, no account. Paste the config into any Claude conversation and every API becomes interactive immediately.

Which one would you reach for first?

(npm + CDN link in the first comment)

<!-- Draft notes (rewrite pass — repositioned as post 2 of the origin-story arc)
- Formula: F9 Curiosity-Gap Teaser, adapted to open on a callback rather than a cold
  pitch. Goal: comments.
- ~252 words / ~1,610 chars. No em/en dash, no double dash, no curly quotes. Clean on
  the AI-vocab and phrase blacklists ("game-changing", "seamless", "deep dive", etc.
  all absent).
- This post now takes the post-2 slot in the arc: (1) discovery/insight (family tree,
  published), (2) this post — opened the dev tools, found 5 live artifact APIs, built
  and shared an interactive demo covering all of them, (3) next up — a real small app
  (a list) that actually uses the capabilities, not yet drafted (see ideas.md).
- Supersedes posts/alistigo-origin-story-devtools-2026-07-29 in the post-2 slot — that
  draft (dev-tools discovery + a to-do-list skill test) is shelved, not deleted; its
  "opened the dev tools" beat is folded into this post's second paragraph so the
  detail isn't lost. See that file's updated frontmatter/notes.
- Content lineage: this post absorbs and supersedes
  posts/claude-storage-explorer-2026-07-30 (the original `window.storage`-only
  explorer). That project was expanded into a 5-API interactive demo package
  (`@alistigo/artifact-claude-capabilities-demo`), so the storage-explorer post is
  marked superseded rather than published separately — see that file's updated
  frontmatter/notes.
- Factual API content (5 APIs, httpbin test, package name) unchanged from the prior
  draft — only the opener/framing changed to bridge from post 1 and read as "I built
  something to test all of Claude's artifact capabilities and I'm sharing it," not a
  cold pitch. Closer kept as a specific either/or-style question tied to the thesis.
- No fabricated numbers beyond what's real: 5 APIs is an accurate count of what the
  inject-script exposes; the httpbin call is a real, repeatable test.
- Attachment: none planned — text carries this one.
- Outbound links: npm + CDN link goes in the first comment, not the body, to avoid
  the reach penalty.
- Posting window: a few days after post 1 (not same day), Tue/Wed/Thu 7:30-9:00 AM
  local, per algorithm-heuristics.md.
- Publora auto-post path intentionally not invoked — draft only, human posts manually.
-->
