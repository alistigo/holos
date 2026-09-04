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

My CI takes 3 minutes 🚄 . But that's with only a few e2e tests. And I know what's coming ... 💥

So I'm thinking about it now, before it becomes a problem.

The stack: TypeScript NX monorepo, Bun for unit tests, Playwright with Gherkin/Cucumber for e2e. GitHub free tier only. No paid services.

Unit tests aren't the issue. Bun runs them in under a second per package. Nx affected narrows CI scope to the packages actually touched by the change, so a typical branch runs maybe 10% of the full suite.

The e2e layer is the variable. A Cucumber scenario through Playwright is slower by nature. Right now it's fine. Six months from now, with real coverage across every feature, it becomes the bottleneck.

What I've tried: Nx affected for scope reduction, Nx cache to skip unchanged inputs.

What I'm planning next: split CI jobs so static analysis / unit tests and e2e tests run in parallel. Tighter caching.

What I haven't figured out: code coverage thresholds for unit and e2e tests. I want them because metric matters and that will be another guardrail for AIAD. I'm also not sure what they cost at runtime.

So, how fast is your CI? What was the single change that dropped the time the most? Do you have some ideas?

#CI #AiDev #Playwright #Gherkin #Cucumber #AIAD
