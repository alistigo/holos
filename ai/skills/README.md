# AI Skills

Source of truth for Claude AI skill definitions.

Skills are authored here and installed to `.claude/skills/` by running:

```sh
pnpm install:ai:skills
```

## Structure

```
ai/skills/
└── <skill-name>/
    └── SKILL.md    # Skill definition document
```

## Creating a New Skill

1. Create a directory: `ai/skills/<skill-name>/`
2. Add `SKILL.md` describing the skill's purpose, trigger conditions, and steps
3. Run `pnpm install:ai:skills` to install it into `.claude/skills/`

## Skill Format (`SKILL.md`)

```markdown
# Skill Name

## Purpose
What this skill does and when Claude should use it.

## Trigger
Conditions that should activate this skill.

## Steps
1. Step one
2. Step two
```
