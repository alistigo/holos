---
status: draft
channel: linkedin
createdAt: 2026-08-06
publishedAt:
url:
attachment:
---

I built a demo of everything Claude's artifact sandbox can actually do.

Storage that persists across sessions. Calling Claude from inside the artifact itself. Real file downloads. Live network requests, no CORS drama. Even navigation. Five APIs Claude injects into every artifact iframe, all in one interactive UI.

It ships two ways. `@alistigo/artifact-claude-capabilities-demo` is the artifact itself: one script tag, no build step. `@alistigo/artifact-claude-capabilities-demo-skill` is an agent skill that teaches Claude when and how to build it, so you can just ask for the demo and it appears.

Live demo link is in the first comment. Which capability would you reach for first?

<!-- Draft notes (rewrite pass 3 — restored some breathing room, added the skill package)
- Formula: F9 Curiosity-Gap Teaser. Goal: clicks to the first-comment link. Rewrite
  pass 2 (~55 words) came back "too short" — this pass keeps the compressed capability
  list from pass 2 (one line, no per-API paragraphs) but gives the two-package split
  its own paragraph instead of a single clause, and adds the skill package.
- New in this pass: `@alistigo/artifact-claude-capabilities-demo-skill`, the agent
  skill that teaches Claude (as an AI, via SKILL.md trigger phrases) when and how to
  render the demo artifact, so a developer can just ask for it instead of pasting the
  npm config by hand. Distinct package from the artifact itself, mentioned by name.
- ~110 words / ~700 chars. No em/en dash, no double dash, no curly quotes. Clean on
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
- Outbound links: first comment carries two things now — the npm/CDN link and the
  live published-artifact demo link — not the body, to avoid the reach penalty.
  The "Live demo link is in the first comment" line is the CTA doing the pushing.
- Posting window: a few days after post 1 (not same day), Tue/Wed/Thu 7:30-9:00 AM
  local, per algorithm-heuristics.md.
- Publora auto-post path intentionally not invoked — draft only, human posts manually.
-->
