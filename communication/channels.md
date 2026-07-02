# Channels

Two channels, chosen deliberately over spreading across more. Both are reevaluated
informally — if one isn't earning its keep after a few posts, drop it before adding a
third.

## LinkedIn

**Why:** short-form, career-narrative reach. The audience skews toward technical
decision-makers, recruiters, and potential clients — directly relevant to an ongoing
employment/freelance search, not just tool promotion. Even though LinkedIn's raw
developer audience is smaller than X or dev.to, it's the strongest channel for the
people actually evaluating "would I hire/work with this person."

**Format constraints:**
- Short. Hook in the first line — it's what shows before "see more," and the algorithm
  rewards early engagement.
- No real code blocks (LinkedIn doesn't render them) — describe mechanisms in prose,
  link out to dev.to or the repo for the real detail.
- At most one outbound link. Posting a link in the body can suppress reach; consider
  putting it in the first comment instead, or just accept the tradeoff — judgment call
  per post, not a hard rule.

**Cadence:** opportunistic, tied to what actually ships. Not a fixed schedule — the
backlog is short and this is one person, not a content calendar to feed.

## dev.to

**Why:** technical-depth audience, markdown-native, SEO-durable. It's the canonical
home for the "how it actually works" writeup that LinkedIn's format can't hold —
real code, real command output, real mechanism detail.

**Format constraints:**
- Full markdown, code blocks, front-matter tags — write it like a technical README
  section, not a pitch.
- Long-form is fine. No artificial length cap.

**Cadence:** only when there's real technical substance to cover. Not every LinkedIn
post needs a dev.to companion — a pure career-narrative post can stand alone.

## How the two relate

When both exist for the same topic, the LinkedIn post is the short hook and links out
to the dev.to piece for depth. The reverse isn't required — a dev.to deep-dive doesn't
need a LinkedIn companion if there's no career-narrative angle to it.

## Explicitly not doing (for now)

- No auto-publish integration to either channel — always posted manually.
- No X/Twitter or other channels yet.
- No vendored third-party "growth" skill packs (comment drafters, engagement monitors,
  etc.) — this is a low-cadence, one-person workflow, not a content operation.
- No changelog/release-note overlap — that's `nx release`'s job.
- No automatic git-hook trigger (e.g. post-merge reminders) — invocation stays
  explicit, via the `communication` skill or `/communicate` command.
