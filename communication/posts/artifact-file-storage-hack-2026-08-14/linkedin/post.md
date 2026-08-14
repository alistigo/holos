---
status: published
channel: linkedin
createdAt: 2026-08-14
publishedAt: 2026-08-14
url:
attachment: hackerman.gif
---

If you can store text in a Claude artifact, can you store files?

I spent an afternoon finding out.

The storage API takes strings. Base64 is a string. I added a file tab to my demo and tried it.

It worked.

You can store files in a Claude artifact. Images, PDFs, CSVs, whatever fits. And because the storage API has a public/private flag, you can share them. One link to the artifact, and the file is there.

Then I started pushing on the limits.

Max per key: 5MB.
Max per artifact: 17MB total.
Allowance: per artifact, not per account.
Keys: no hard cap, but the 17MB ceiling applies across all of them.

Each artifact you publish is a 17MB hard drive. For something built on top of a text storage API, that is not nothing.

I'm disappointed you cannot store a movie ... But sharing a picture with no backend, no hosting, no server? That works.

Updated demo in the first comment. Open to all, give it a try.

<!-- Draft notes
- Formula: F9 Curiosity-Gap Teaser. Goal: comments (people testing limits, sharing what they tried).
- This is post 3 in the artifact arc: (1) Claude family tree/origin (published), (2) demo launch
  (artifact-claude-capabilities-demo-launch-2026-08-06, published 2026-08-10), (3) this post —
  file storage discovery and limit-probing.
- Hook in first 63 chars, well under 210-char cutoff.
- ~840 chars. Below the 900-char ideal but content is dense with numbers; dwell time should hold.
- No em/en dashes, no "game-changer", "deep dive", "leverage", "fundamentally", no external links
  in body. No "effectively" or "actually" in the close.
- Concrete numbers: 5MB, 17MB. First-person moment: "I spent an afternoon finding out."
  Vulnerability beat: the playful disappointment about movies.
- First comment: link to updated demo with file storage tab.
- Posting window: Tue/Wed/Thu 7:30-9:00 AM local.
- Publora auto-post path not invoked — draft only, human posts manually.
-->
