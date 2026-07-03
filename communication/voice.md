# Voice

## Audience

Developers, architects, and technical hiring managers/recruiters evaluating technical
depth. This is professional visibility content tied to an active career transition —
write like you're demonstrating how you think, not like you're running a marketing
account.

## Authenticity rules

Things that make a post read as AI-generated — avoid them:

- Em dashes as a crutch for every other sentence.
- Openers like "In today's fast-paced world of..." or "Ever wondered how...".
- Generic hype adjectives: "game-changing", "revolutionary", "seamless", "cutting-edge".
- Listicle-of-three-adjectives openers ("It's fast, flexible, and powerful").
- Abstract claims with no specifics ("massively improves developer experience").

What to do instead:

- Concrete specifics: a real command, a real error message, a real number, a real
  file path. If you can't point to something real, cut the claim.
- First person, active voice: "I built", "I ran into", not "we are excited to
  announce".
- It's fine — good, even — to say something didn't work on the first try, or that a
  tool has a real current limitation. That reads as credible, not weak.

## Structure

1. **Hook** — one line, concrete, no throat-clearing. It has to work standalone,
   because it's all that shows before the fold.
2. **Context** — what problem existed, why it mattered enough to build something.
3. **What was built** — the actual thing, described accurately. No embellishment
   beyond what the code/README actually does.
4. **Insight or lesson** — ideally something non-obvious you'd only know from having
   built it. This is the part worth reading.
5. **Soft CTA** — invite conversation or point at the repo/writeup. Not "buy now"
   energy — something like "curious if others have hit this" or a plain link.

For **LinkedIn**, this structure is the topic-framing input handed to the vendored
`linkedin-post-writer` skill (see `communication/channels.md`), which owns the actual
hook formula, length target, and emoji density — don't re-derive those here. For
**dev.to**, this Structure section is the full spec, since no vendored skill covers
that channel.

## Example hooks

> I spent an afternoon trying to figure out why a skill's trigger description worked
> in testing and silently failed in real use. Turned out "silently failed" was the
> whole problem — there was no way to measure it.

> Most agent skill descriptions are never tested against the queries they're supposed
> to catch. I built a CLI to fix that for mine.

## A useful cross-check

The trigger-reliability discipline behind `cli/agent-skill-tester` — labelled queries,
a `should_trigger` expectation, measuring against a threshold instead of trusting a
gut feel — is a decent mental model for a hook too: read it back cold and ask whether
it'd actually stop a scroll, rather than assuming it does.
