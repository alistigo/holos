---
name: project_communication_linkedin_skills
description: LinkedIn drafting in the communication workflow now hands off to the vendored linkedin-post-writer skill instead of hand-written rules in voice.md/channels.md
metadata: 
  node_type: memory
  type: project
  originSessionId: aa68ed7f-0d6a-4d13-948b-eb196066e9a2
---

As of 2026-07-03, `communication/`'s LinkedIn drafting no longer owns its own
hook/length/emoji rules. The user chose to vendor
[sergebulaev/linkedin-skills](https://github.com/sergebulaev/linkedin-skills) (MIT, 10
skills) as `vendor/linkedin-skills`, symlinked individually into `.agents/skills/` (see
[[feedback_vendor_symlink_gap]] for how that vendoring was actually wired up).

**Why:** the user felt LinkedIn drafts (e.g.
`communication/posts/linkedin/2026-07-02-agent-skill-tester-launch.md`) ran long, wanted
question-style hooks and more emojis, and preferred a tested toolkit over hand-writing
those rules into `voice.md`/`channels.md`.

**How to apply:**
- `communication/voice.md`'s Structure (Hook → Context → What was built → Insight → CTA)
  is now topic-framing input for LinkedIn — the actual hook formula, length target (the
  vendored skill's own 900–1,300 char sweet spot), and emoji density come from
  `linkedin-post-writer`. For dev.to, `voice.md` is still the full spec (no vendored
  skill covers that channel).
- `linkedin-humanizer --mode audit` is the optional pre-publish check.
- **Never invoke the Publora auto-post path** built into `linkedin-post-writer`,
  `linkedin-comment-drafter`, or `linkedin-reply-handler` — this repo never
  auto-publishes; use these skills to draft only, then stop before "on approval."
  `linkedin-hook-extractor`/`linkedin-engager-analytics`/`linkedin-thread-monitor`
  optionally use Apify (`APIFY_TOKEN`) for read-only scraping — no token is configured,
  so they fall back to manual paste; this is deliberately left unconfigured.
- A separate, unrelated addition in the same change: an optional Mermaid diagram
  attachment — a sibling `communication/posts/linkedin/<slug>.mmd` file, referenced via
  an `attachment:` frontmatter field, rendered to an image and attached manually by the
  human (LinkedIn only accepts static image uploads).
