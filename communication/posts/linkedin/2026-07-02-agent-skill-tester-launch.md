---
status: draft
channel: linkedin
createdAt: 2026-07-02
publishedAt:
url:
---

Most agent skill descriptions ship on a gut feeling. Mine kept silently failing to
trigger, and I had no way to measure it — so I built a CLI to fix that.

Claude Code (and other agent CLIs) decide whether to use a skill based on a short
natural-language `description` in its `SKILL.md`. That description either matches the
queries it's supposed to catch, or it doesn't — and until now, the only way to find
out was to use it for a while and eventually notice something didn't fire.

`@alistigo/agent-skill-tester` takes a labelled set of queries (a query, whether it
*should* trigger the skill, train/validation split), replays each one through the
`claude` CLI, and watches the streamed output for the actual `Skill` tool-use event.
Every query runs multiple times, and passes only when its trigger rate crosses a
threshold in the direction it's supposed to.

Writing the eval set for my first skill was more revealing than writing the skill
itself — two queries I was sure would trigger, didn't.

Honest limitation: right now it only works against an authenticated Claude
subscription, no API key mode yet — so it's a local dev-loop tool, not a CI gate.
That's next.

Wrote up how the mechanism actually works — stream parsing, the eval schema, the
threshold logic — here: [dev.to link — add once published]

Code: github.com/alistigo/holos · Package: npmjs.com/package/@alistigo/agent-skill-tester

Curious if anyone else testing agent skills has hit the same blind spot.
