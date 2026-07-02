# Communication

Outward-facing communication about work done in this repo — LinkedIn posts and dev.to
writeups. This is marketing/visibility content, not project documentation (see `docs/`
for that) and not release notes (see below).

## Workflow

1. **Idea** — when something ships that's worth telling people about, add a row to
   [ideas.md](ideas.md). Low friction: date, topic, source commit/PR, nothing more.
2. **Draft** — expand an idea into an actual piece, following [voice.md](voice.md) for
   tone/structure and [channels.md](channels.md) for per-channel rules. Drafts live in
   [posts/linkedin/](posts/linkedin/) or [posts/devto/](posts/devto/), one file per post,
   `status: draft` in frontmatter.
3. **Review** — you read the draft, edit as needed.
4. **Publish** — you post it manually. Flip `status: published`, fill in `publishedAt`
   and `url` in the frontmatter.

The skill `communication` (`.agents/skills/communication/SKILL.md`) and the
`/communicate` command operate this workflow — they can log ideas and produce drafts,
but never publish anything themselves.

## What this is not

- **Not auto-publish.** There's no LinkedIn/dev.to API integration here, and none is
  planned — you always post manually. AI drafts, you hold the wheel.
- **Not changelog/release notes.** Those are already fully automated by `nx release`
  from commit messages (see [ADR 0013](../docs/adrs/0013-release-strategy.md)). This
  directory is purely for social/marketing content — a different concern.

## Files in this directory

| File | Purpose |
|------|---------|
| [channels.md](channels.md) | Which channels, why, and the norms for each |
| [voice.md](voice.md) | Audience, tone, authenticity rules, post structure |
| [ideas.md](ideas.md) | Running backlog of topics worth writing about |
| `posts/linkedin/` | LinkedIn drafts and published posts |
| `posts/devto/` | dev.to drafts and published posts |

See also: [docs/sdlc.md](../docs/sdlc.md) Stage 7 for how this fits the rest of the
delivery lifecycle.
