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

1. Appends a row to `communication/ideas.md`: today's date, the given topic, source
   (inferred from recent git log/current branch if not specified), status `idea`
2. No draft content is generated — this is a quick capture, not a writing session

### `draft` mode

1. Reads `communication/voice.md` and `communication/channels.md`
2. Gathers context: recent commits/PR for the given topic via `git log`, plus relevant
   source files
3. Drafts content following the structural template in `voice.md`
4. Writes to `communication/posts/linkedin/YYYY-MM-DD-<slug>.md` and/or
   `communication/posts/devto/YYYY-MM-DD-<slug>.md` depending on `--channel` (both, if
   omitted and the topic has enough technical depth for dev.to; LinkedIn-only
   otherwise)
5. If a matching row exists in `communication/ideas.md`, updates its status to
   `drafted` with a link to the new file

Never publishes anything — output is always a draft file for human review.

## Options

- `--channel linkedin|devto` — restrict draft mode to one channel (default: both, if
  the topic warrants dev.to's long-form depth; LinkedIn-only otherwise)

## Examples

```
/communicate idea "agent-skill-tester validate-triggers CLI"
/communicate draft "agent-skill-tester" --channel linkedin
/communicate draft "artifact-manager-skill split" --channel devto
```
