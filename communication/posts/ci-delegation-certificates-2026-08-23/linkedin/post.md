---
status: draft
channel: linkedin
createdAt: 2026-08-23
attachment:
publishedAt:
url:
formula: F9 Curiosity-Gap Teaser
---

My local machine already ran the tests before they hit GitHub Actions.

GitHub Actions doesn't know that. So it runs them again.

I wait 3 minutes. The result is the same.

I've been thinking about this because I run Claude locally as a dev agent. Claude writes code, runs the tests, commits. The result is already known. By the time CI starts, the work is done. I'm paying to re-run something I trust.

The trust problem: how does a CI server know the local result is real?

Some tools have partial answers.

Bazel is built on hermetic builds. Same inputs, same outputs, every time. If the build is fully hermetic, any machine running it produces a trustworthy result by construction. Trust lives in the build definition, not the machine.

SLSA is a framework for signed provenance records: I ran command X with input Y and produced output Z, signed by key K. GitHub Actions generates this natively now. Sigstore provides the signing layer.

Nx Cloud is already in my stack. It stores task results by content hash. If the hash matches a cached result, that result is used regardless of which machine produced it.

The gap: these work when builds are hermetic. Most real projects aren't. Environment state, local tool versions, secrets. The "certificate of done" idea only holds when you can prove the environment was clean.

Maybe that's a fundamental constraint. Maybe it's a task delegation problem someone has already solved.

What's the closest pattern you've seen?

#CI #DevTools
