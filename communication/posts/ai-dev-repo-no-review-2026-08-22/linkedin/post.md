---
status: published
channel: linkedin
createdAt: 2026-08-22
attachment:
publishedAt: 2026-08-23
url:
formula: F10 Contrarian + Historical Receipts
series: ai-dev-repo-setup (1/3)
---

I don't review every line of code Claude writes for me.

That's not a bug in my workflow. It's the whole point.

I work alone on a personal TypeScript project. My goal isn't perfect code. It's a working app. Those are different things, and pretending otherwise is theatre.

Here's what I actually do:

I set up CI guardrails that tell Claude what it can't do. Four static analysis tools, all running on pre-push hooks so problems get caught before GitHub Actions even sees the diff.

Biome catches formatting and lint issues. Dependency-cruiser enforces architecture rules. Fallow catches dead code, duplicated logic, and functions that grew too complex. TypeScript strict mode catches the rest.

Unit tests in Bun and e2e specs in Gherkin/Playwright cover the behavioral side. Nx affected scopes all of it — only the packages the change actually touched run.

If all of that passes, the app ships.

I don't read the diff. I read the CI output.

The CI runs in under 3 minutes on GitHub free tier. No paid services. Runs locally too.

Is it the same as a senior engineer reviewing every PR? No. Do I care? Also no. I'm building for myself, not shipping to 10 million users.

The honest question isn't "did you review the code." It's "does the app work, and do the guardrails hold."

My CI answers that faster than I can read a diff.

Do you read every line your AI generates? Or have you built something else to trust it?

#AIdev
