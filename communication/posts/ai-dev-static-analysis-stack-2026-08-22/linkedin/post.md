---
status: draft
channel: linkedin
createdAt: 2026-08-22
attachment:
publishedAt:
url:
formula: F9 Curiosity-Gap Teaser
series: ai-dev-repo-setup (2/3)
---

I run four static analysis tools that tell Claude what it can't do. One of them is called Fallow. I hadn't heard of it six months ago. I use it every day now.

The four tools in my TypeScript monorepo pre-push stack:

Biome handles linting and formatting together. One config, one command. Faster than running ESLint and Prettier separately.

Dependency-cruiser enforces architecture rules. My actual rule: route handlers cannot import repositories directly. They go through a service layer. The tool checks this on every push. If Claude writes a shortcut, the push is blocked.

TypeScript strict mode with exactOptionalPropertyTypes and noUncheckedIndexedAccess. Harder settings than most projects ship with. Catches a class of bugs that "strict: true" alone doesn't.

And then there's Fallow.

Fallow checks cyclomatic complexity, dead code, and code duplication. It also ships with an MCP server, so I can query codebase analysis from inside Claude directly. I'm still working out everything it can catch. But it's already flagged things I wouldn't have noticed in a quick review.

All four run as pre-push hooks via Lefthook. Most issues get caught before CI even sees the diff.

On CI, Nx only runs affected packages — linting, typechecking, and tests. A feature branch touching 2 packages in a 30-package monorepo runs roughly 10% of the full suite.

The static analysis layer is half the story. The other half: unit tests in Bun and e2e specs in Gherkin/Playwright. Same Nx scoping applies.

Total CI time: under 3 minutes. GitHub free tier. No cloud services.

The question I keep asking: what else can Fallow enforce? Maximum exported functions per file? Scope creep between modules? I haven't found the ceiling yet.

Anyone using Fallow? What architecture rules do you actually enforce?

#TypeScript #AIdev
