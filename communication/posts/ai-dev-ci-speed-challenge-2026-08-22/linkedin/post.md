---
status: draft
channel: linkedin
createdAt: 2026-08-22
attachment:
publishedAt:
url:
formula: F4 Time-Anchor Confession
series: ai-dev-repo-setup (3/3)
---

My CI takes 3 minutes. That's with only a handful of e2e tests. I know what's coming.

So I'm thinking about this now, before it becomes a problem.

The stack: TypeScript monorepo, Bun for unit tests, Playwright with Gherkin/Cucumber for e2e. GitHub free tier only. No paid services.

Unit tests aren't the issue. Bun runs them in under a second per package. Nx affected narrows CI scope to the packages actually touched by the change, so a typical branch runs maybe 10% of the full suite.

The e2e layer is the variable. A Cucumber scenario through Playwright is slower by nature. Right now it's fine. Six months from now, with real coverage across every feature, it becomes the bottleneck.

What I've tried: Nx affected for scope reduction, Nx cache to skip unchanged inputs.

What I'm planning next: split CI jobs so static analysis and tests run in parallel. Tighter caching.

What I haven't figured out: code coverage thresholds. I want them. I'm also not sure what they cost at runtime.

There's also a principle I haven't enforced yet: Claude writes app code and cannot touch test files. If e2e breaks, fix the app. I need to build that barrier before the rule has teeth.

How fast is your CI? What was the single change that dropped the time the most?

#TypeScript #CI
