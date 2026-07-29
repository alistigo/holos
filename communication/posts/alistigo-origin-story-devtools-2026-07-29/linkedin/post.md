---
status: draft
channel: linkedin
createdAt: 2026-07-29
publishedAt:
url:
attachment:
---

Last time, Claude built me a family tree inside a chat window, live, while I was cleaning up genealogical research. This time I did something else. I opened the dev tools to see how it was actually building it.

Under the hood, it's plain and almost boring: a regular HTML page, dropped into a sandboxed iframe, running under a strict content security policy. The libraries it reaches for come straight from a CDN, jsdelivr, pulled in fresh each time.

My first reaction: that's a genuinely careful security model. Locked down, nothing calling home, nothing it shouldn't touch.

My second reaction, a few seconds later: could I teach it to reach for something of mine instead?

So I ran a small test. I built a to-do list, made specifically to be picked up inside an artifact, and published it as a skill so an AI could actually understand how to use it, not just guess at it.

It worked. Claude picked it up and built with it like it would with any other library.

That was round one. I've gone a lot further with the idea since, but that little list is still out there, working, today.

If you could hand an AI one tool built specifically for it, what would you give it?

<!--
Draft notes (linkedin-post-writer + linkedin-humanizer --mode audit — not part of the post):
- Formula: F9 Curiosity-Gap Teaser (topic type = emergent/surprise story), adapted to
  a developer's own curiosity rather than a system surprising the author. Goal: comments.
- 1,173 chars, 213 words. No em/en dash, no double dash, no curly quotes. Clean on the
  full AI-vocab blacklist and phrase blacklist. Closer is a specific question tied to
  the thesis.
- Opener revised: the user flagged that "After that family tree..." assumes readers
  remember post 1, and floated a "Have you ever checked the code of a Claude artifact?"
  rhetorical-question opener as an alternative. Rejected that literal phrasing —
  "Have you ever...?" is on the hard-fail opener blacklist in
  audit-ai-tells.md ("dead on LinkedIn") and the linkedin-post-writer anti-patterns
  list — and instead folded the user's other suggestion ("put back some context")
  into a concrete, non-rhetorical opener: one clause recapping what happened in post 1
  (a Claude artifact building a family tree, live) so this post stands alone for
  anyone who never saw it, then pivots into the dev-tools hook.
- Named entities: Claude, jsdelivr (both real, factual). No fabricated numbers, no
  invented package name, star count, or download count for the to-do skill.
- Positioned as post 2 of what is now a 3-post arc: (1) discovery/insight — published,
  (2) this dev-tools + first-library-experiment post, (3) the limitation + why-Alistigo
  post, which is being reworked (see alistigo-origin-story-why-alistigo-2026-07-29) to
  add the consistency/token-cost angle before it's finalized.
- Intentionally does not name "Alistigo" here — the brand reveal is saved for post 3's
  resolution, per voice.md's "one mention max, natural conclusion" rule, so it isn't
  repeated across two consecutive posts in one week.
- Suggested posting window: a few days after post 1 (not same day), Tue/Wed/Thu
  7:30-9:00 AM local, per algorithm-heuristics.md.
- No external links in body. No attachment planned yet — text carries this one; add
  a screenshot of actual dev-tools output only if it doesn't reveal anything sensitive.
- Publora auto-post path intentionally not invoked — draft only, human posts manually.
-->
