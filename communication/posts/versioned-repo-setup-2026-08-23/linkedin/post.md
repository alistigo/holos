---
status: draft
channel: linkedin
createdAt: 2026-08-23
attachment:
publishedAt:
url:
formula: F2 R.I.P. Category Obituary
---

R.I.P. GitHub repo templates.

Cause of death: they clone a repo once and disappear.

You create a template, start a new project, and the template never talks to that project again. Six months later the template adds a better lint config or a cleaner CI workflow. Your project doesn't know. You find out when you look at someone else's repo and notice it's better.

I built a TypeScript monorepo setup over the last year. Biome, dependency-cruiser, Fallow, Lefthook hooks, Nx, CLAUDE.md conventions, session hooks, agent skills. It took real time to get right. Now I want to reuse it without copying files by hand and without losing the ability to receive updates.

Two tools come closest to what I want:

Copier is a templating tool with an update story. You run copier update and it re-applies the template at its new version to your existing repo, resolving conflicts like a merge. Your customization choices are stored in a file so updates stay reproducible. It's what GitHub templates should be.

Projen takes a different approach. Your project configuration is TypeScript code. Running projen regenerates package.json, tsconfig, GitHub Actions workflows from that definition. Updates come from bumping the projen package.

Neither is quite right. I want something with a development philosophy baked in. Not just file templates, but opinions about how code should be structured, linted, and reviewed. Versioned and updatable, like a dependency.

Does something like this exist? Or is this a gap?

#TypeScript #DevTools
