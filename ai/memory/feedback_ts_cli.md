---
name: TypeScript CLI convention
description: Use Clipanion + Ink for all TypeScript CLI tools in the repo
type: feedback
originSessionId: 53096787-d543-4125-83b9-a3760d180d2c
---
When building CLI tools or runners in TypeScript, use the `ts-cli` skill (Clipanion + Ink). This is the repo standard established 2026-04-14.

**Why:** Consistent CLI patterns across agents and tools. Clipanion handles arg parsing cleanly, Ink gives rich terminal UI with progress reporting.

**How to apply:** Check `ai/skills/ts-cli/SKILL.md` for file structure, patterns, and gotchas. Reference implementation at `agents/_core/src/cli/`.
