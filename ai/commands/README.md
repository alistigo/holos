# AI Commands

Source of truth for Claude AI slash command definitions.

Commands are authored here and installed to `.claude/commands/` by running:

```sh
pnpm install:ai:commands
```

## Structure

```
ai/commands/
└── <command-name>/
    ├── <command-name>.md          # Command definition (installed to .claude/commands/)
    └── <command-name>.source.md   # Origin and changelog (stays in ai/commands/ only)
```

## Creating a New Command

1. Create a directory: `ai/commands/<command-name>/`
2. Add `<command-name>.md` describing the command's usage, steps, and examples
3. Run `pnpm install:ai:commands` to install it into `.claude/commands/`

## Command Format

```markdown
# Claude Command: <Name>

Short description of what the command does.

## Usage

/command-name
/command-name --flag

## What This Command Does

1. Step one
2. Step two
```
