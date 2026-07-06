# Claude Command: Communicate

Capture a shippable idea to the communication backlog, or draft a LinkedIn/dev.to post
about work done in this repo.

## Usage

```
/communicate idea "<topic>"
/communicate draft <topic-or-recent-work> [--channel linkedin|devto]
```

## What This Command Does

### `idea` mode

0. Creates (or reuses) branch `communication/<slug>`, derived from the topic — always,
   regardless of the currently checked-out branch
1. Appends a row to `communication/ideas.md`: today's date, the given topic, source
   (inferred from recent git log/current branch if not specified), status `idea`
2. No draft content is generated — this is a quick capture, not a writing session

### `draft` mode

0. Creates (or reuses) branch `communication/<slug>`, derived from the topic — always,
   regardless of the currently checked-out branch
1. Reads `communication/voice.md` and `communication/channels.md`
2. Gathers context: recent commits/PR for the given topic via `git log`, plus relevant
   source files
3. Drafts content following the structural template in `voice.md` for **dev.to**; for
   **LinkedIn**, hands off to the vendored `linkedin-post-writer` skill to draft the
   body (hook formula, length, emoji are its rules), optionally followed by
   `linkedin-humanizer --mode audit`
4. Writes to `communication/posts/<subject>-<date>/linkedin/post.md` and/or
   `communication/posts/<subject>-<date>/devto/post.md` depending on `--channel` (both,
   if omitted and the topic has enough technical depth for dev.to; LinkedIn-only
   otherwise) — one shared directory per topic, `<date>` being when it was first
   logged to `ideas.md` — with an `attachment` frontmatter field (empty, or a sibling
   `attachment.mmd`/`attachment.png` if a diagram was proposed)
5. If a matching row exists in `communication/ideas.md`, updates its status to
   `drafted` with a link to the new file

Never publishes anything — output is always a draft file for human review. This
includes the vendored `linkedin-skills` toolkit's Publora auto-post path (in
`linkedin-post-writer`/`linkedin-comment-drafter`/`linkedin-reply-handler`) — never
invoked, draft only.

## Options

- `--channel linkedin|devto` — restrict draft mode to one channel (default: both, if
  the topic warrants dev.to's long-form depth; LinkedIn-only otherwise)

## Examples

```
/communicate idea "agent-skill-tester validate-triggers CLI"
/communicate draft "agent-skill-tester" --channel linkedin
/communicate draft "artifact-manager-skill split" --channel devto
```
