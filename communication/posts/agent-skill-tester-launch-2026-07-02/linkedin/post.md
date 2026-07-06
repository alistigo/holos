---
status: published
channel: linkedin
createdAt: 2026-07-03
publishedAt: 2026-07-06
url:
attachment: attachment.png
---

I shipped a skill last month and never tested it properly. You probably have too.

Hard to validate by hand, isn't it? Time to ship a tool that helps.

Sound familiar? "Just ship it, we'll add tests later."

Every time, the same ending: tech debt piles up, and nobody can prove anything still works.

Here's the nuance nobody adds: the architecture question and the test question are the same question, asked at the same time. If you can't say how you'll validate a thing, you haven't finished designing it. That's the case for TDD, write the test first, then build to satisfy it.

When I started writing agent skills for Claude Code, that question got concrete fast: does this skill's description actually trigger on the queries it's supposed to catch? Reading the SKILL.md back and feeling good about it isn't an answer.

So I built @alistigo/agent-skill-tester: an open source CLI tool that evaluates whether a list of sentences actually trigger your skills. Now I can be sure what I'm building triggers in the right context. Soon you'll be able to run it in CI/CD as a QA step too.

Credit where it's due: part of the thinking came from agentskills.io's guide on evaluating skills. Good framework, no shipped tool, and a few gaps I ended up filling.

And you, what's your experience writing skills?

<!--
Draft notes (linkedin-post-writer approval card + linkedin-humanizer --mode audit — not part of the post):
- Hook fixed per audit: swapped the "Have you ever...?" rhetorical-question opener
  (flagged in linkedin-humanizer/references/audit-ai-tells.md as "dead on LinkedIn")
  for a direct first-person statement with the same pain point.
- Re-audited: 1,302 chars (900-1,300 sweet spot), 224 words, 17 sentences, length
  variance 2-27 words. Clean on em/en dash, double dash, curly quotes, and the full
  AI-vocab blacklist. No opener-tell match. Close is a specific open question.
- Attachment: attachment.png (sibling file in this same directory, 1080x1350,
  upload-ready). Replaced by hand with a polished version of the same 3-box flow
  (Write Skill -> Test Skill -> Deploy Skill): Test Skill carries a "CRITICAL STEP"
  badge, a checkmark icon, and the `@alistigo/agent-skill-tester` name, since that box
  is the post's thesis (test before you ship). No source file for this version is
  tracked here — it was authored/edited externally.
- Links to add in the first comment when posting: agentskills.io/skill-creation/evaluating-skills,
  the dev.to writeup, github/npm for @alistigo/agent-skill-tester
- Suggested posting window: Tue/Wed 7:30-9:00 AM (local)
- Publora auto-post path intentionally not invoked — draft only, human posts manually
-->
