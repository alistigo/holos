---
status: published
channel: linkedin
createdAt: 2026-08-22
attachment:
publishedAt: 2026-08-26
url:
formula: F10 Contrarian
series: ai-dev-repo-setup (2/3)
---

AI forgets. AI makes mistakes. AI ignores some of the instructions you gave it. It's non-deterministic, every single time.

So I stopped trying to fix that with better prompts.

A prompt is a request. AI can drop it, half-follow it, or forget it three sessions later. Static analysis tool does not have that option. It reads the diff, checks it against rules I defined, and either the rule pass or the push does not go through. Simple.

That is what "Fallow" does for me. It checks cyclomatic complexity, dead code, and duplicated logic. When AI reintroduces a helper it already wrote somewhere else, or a function creeps past a complexity threshold, the push fails before I ever open the diff.

The tool does not make AI a better coder. It makes the loop faster: write, fail, fix, push. All of it before a human reviews anything.

That is the real answer to "how much do you review AI code." Not less review, a faster loop that catches what review was for in the first place.

What is the rule you want to enforce before AI can push?

#AIdev #Claude #ClaudeCode #Fallow #TypeScript
