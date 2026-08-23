---
status: draft
channel: linkedin
createdAt: 2026-08-23
attachment:
publishedAt:
url:
formula: F10 Contrarian + Historical Receipts
series: ai-dev-repo-setup (continuation)
---

Everyone is working on better prompts.

I spent six months configuring the repo instead.

Not because prompts don't matter. They do. But prompts are the last mile. The setup layer is what makes the difference between Claude guessing and Claude knowing.

Here's what the setup layer looks like in mine:

Two shell scripts run before the first message is typed. One activates the toolchain so Claude can run commands without guessing where bun and pnpm live. The other bootstraps the workflow: plan before code, TDD, verify before declaring done. These are hooks. Not habits.

CLAUDE.md documents the directory structure, the command conventions, the QA stack. Written for Claude, not for me. If a new junior engineer could onboard from it, it's good enough for Claude.

Skills live in .agents/skills/ — 25 instruction sets that activate on context. Building a CLI? The Clipanion skill loads. Writing BDD scenarios? The Gherkin skill loads. Most came from packages I installed as git submodules.

Memory sits in .agents/memory/, git-tracked so it survives machine changes. My preferences, active projects, things Claude got wrong that I told it to avoid.

The result: Claude walks into every session knowing the project, the constraints, and what it last got wrong.

That's not prompting. That's environment configuration.

What does your AI setup look like? CLAUDE.md only, or something more?

#AIdev
