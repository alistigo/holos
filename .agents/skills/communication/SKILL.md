---
name: communication
description: Use when a change just shipped (PR merged, package published, feature completed) that's worth telling people about, or when explicitly asked to draft a LinkedIn post or dev.to writeup about work in this repo. Offers to log shippable work to communication/ideas.md, and on request drafts channel-appropriate content into communication/posts/ following communication/voice.md and communication/channels.md.
---

# Communication

## Overview

Operates the `communication/` directory's idea → draft → review → publish workflow.
The human always reviews and publishes manually — this skill never calls a posting
API and never publishes anything itself.

## Two modes

### 1. Passive idea-capture

When you notice, in the course of other work, that something just shipped — a PR
merged, a package published, a CLI feature landed, a milestone hit — **offer** to log
it to `communication/ideas.md`. Never append automatically without asking.

A logged row needs: today's date, a short topic description, and the source (commit
hash(es) or PR link). Nothing more — this is a backlog entry, not a draft.

### 2. Active drafting

Triggers on explicit request ("draft a LinkedIn post about X", "write a dev.to piece
about Y", or via `/communicate draft ...`).

1. Re-read `communication/voice.md` and `communication/channels.md` before drafting —
   every time, don't rely on memory of the rules.
2. Gather real context: `git log` for the relevant commits, and read the actual source
   files / READMEs involved. Don't draft from assumption.
3. Apply the structural template from `voice.md` (Hook → Context → What was built →
   Insight/lesson → Soft CTA).
4. Ground every technical claim in something actually read. No invented metrics, no
   invented adoption numbers, no invented URLs (see the repo-wide rule against
   guessing URLs — link only to things you've verified exist).
5. Write the draft to `communication/posts/<channel>/YYYY-MM-DD-<slug>.md` with
   frontmatter `status: draft`, `channel`, `createdAt`, empty `publishedAt`/`url`.
6. If the topic warrants both channels, draft LinkedIn first (short, links out to the
   dev.to piece), then dev.to (long-form, real code/detail).
7. If a matching row exists in `communication/ideas.md`, update its status to
   `drafted` with a link to the new file(s).

## Rules

- Never publish. No API calls, no browser automation to post anything — the human
  copies the draft and posts it manually.
- Never fabricate technical details, metrics, quotes, or URLs.
- Write in first person, matching `communication/voice.md` — this is Mikael's voice,
  not a generic brand voice.
- A dev.to companion isn't required for every LinkedIn post, and vice versa — check
  `communication/channels.md` for when each channel actually applies.

## Not this skill's job

- No auto-publish integration — doesn't exist, isn't planned.
- No changelog/release-note generation — `nx release` handles that from commit
  messages (see `docs/adrs/0013-release-strategy.md`). Don't conflate the two.
- No X/Twitter or other channels.
- No automatic git-hook triggering — invocation is always explicit (this skill's
  natural-language trigger, or the `/communicate` command).

## Optional validation

`cli/agent-skill-tester`'s `validate-triggers` command can check whether this skill's
own `description` reliably triggers, by running it against a filesystem path:

```sh
agent-skill-tester validate-triggers .agents/skills/communication --queries <path-to-eval-queries.json>
```

This is optional — `communication/` isn't an agentskills.io package, so there's no
required `eval_queries.json` for it. Only worth doing if trigger reliability becomes
a real problem in practice.
