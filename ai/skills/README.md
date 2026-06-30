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

Every skill is a `SKILL.md` file with two parts: YAML frontmatter between `---` markers, then a markdown body with the instructions Claude follows when the skill runs.

### Minimal example

```yaml
---
description: Summarizes uncommitted changes and flags anything risky. Use when the user asks what changed, wants a commit message, or asks to review their diff.
---

Summarize the changes in two or three bullet points, then list any risks.
```

### Frontmatter reference

All fields are optional. Only `description` is strongly recommended — it is the primary mechanism Claude uses to decide when to load the skill automatically.

| Field | Notes |
|---|---|
| `name` | Display name in skill listings. Command name always comes from the **directory name**, not this field. |
| `description` | **Recommended.** What the skill does and when to use it. Put the key use case first — truncated at 1,536 chars. |
| `when_to_use` | Extra trigger context (example phrases, edge cases). Appended to `description` in the listing. |
| `argument-hint` | Hint shown in autocomplete, e.g. `[issue-number]` or `[filename] [format]`. |
| `arguments` | Named positional args for `$name` substitution. Space-separated string or YAML list. |
| `disable-model-invocation` | `true` — only the user can invoke. Use for skills with side effects: `/deploy`, `/commit`. |
| `user-invocable` | `false` — hide from the `/` menu. Use for background knowledge Claude loads silently. |
| `allowed-tools` | Tools Claude may use without per-use approval while this skill is active. Space- or comma-separated. |
| `disallowed-tools` | Tools removed from Claude's pool while this skill is active. Cleared on the next user message. |
| `context` | `fork` — run the skill in an isolated subagent instead of inline. |
| `agent` | Subagent type when `context: fork` — e.g. `Explore`, `Plan`, `general-purpose`, or a custom agent name. |
| `model` | Model override for this skill's turn only. Same values as `/model`. |
| `effort` | Effort level override: `low`, `medium`, `high`, `xhigh`, `max`. |
| `paths` | Glob patterns — only activate when working with matching files (monorepo-friendly). |
| `hooks` | Lifecycle hooks scoped to this skill. See Claude Code hooks docs for format. |
| `shell` | Shell for `!` injection blocks: `bash` (default) or `powershell`. |

### Invocation control

| Frontmatter | User can invoke | Claude can invoke |
|---|---|---|
| *(default)* | Yes | Yes |
| `disable-model-invocation: true` | Yes | No |
| `user-invocable: false` | No | Yes |

### Dynamic context injection

Use `` !`command` `` to run a shell command before Claude sees the skill. The output replaces the placeholder — Claude receives actual data, not the command itself.

```markdown
## Current diff
!`git diff HEAD`

## Environment
```!
node --version
git status --short
```
```

### Argument substitution

| Placeholder | Expands to |
|---|---|
| `$ARGUMENTS` | Full string typed after the skill name |
| `$ARGUMENTS[0]` / `$0` | First argument (0-based) |
| `$name` | Named arg declared in `arguments:` frontmatter |
| `${CLAUDE_SESSION_ID}` | Current session ID |
| `${CLAUDE_SKILL_DIR}` | Directory containing this `SKILL.md` |
| `${CLAUDE_PROJECT_DIR}` | Project root (same as hooks/MCP servers receive) |

### Supporting files

Keep `SKILL.md` under 500 lines. Move large reference material to sibling files and link to them from the body:

```
my-skill/
├── SKILL.md          # required — main instructions
├── reference.md      # detailed docs, loaded on demand
├── examples/
│   └── sample.md
└── scripts/
    └── helper.py     # executed by Claude, not loaded into context
```

### Full example

```yaml
---
description: Fix a GitHub issue end-to-end. Use when the user says "fix issue #N" or "work on issue".
argument-hint: "[issue-number]"
disable-model-invocation: true
allowed-tools: Bash(gh *) Bash(git *)
---

Fix GitHub issue $ARGUMENTS:

1. Read the issue: `gh issue view $ARGUMENTS`
2. Understand the requirements
3. Implement the fix following our coding standards
4. Write or update tests
5. Commit with `fix: <summary> (closes #$ARGUMENTS)`
```

---

## Cross-Tool Compatibility

`SKILL.md` is the **[Agent Skills open standard](https://agentskills.io)**, open-sourced by Anthropic in December 2025 and adopted by all major AI coding tools. A skill in `~/.agents/skills/<name>/SKILL.md` works across Claude Code, Gemini CLI, GitHub Copilot CLI, and OpenAI Codex without modification — as long as it uses only the shared baseline fields.

### Shared baseline (all tools)

Both `name` and `description` are supported everywhere. Gemini CLI is the strictest: it **requires** both fields, silently skips the skill if either is missing, and rejects any text (including a blank line or H1) before the opening `---`.

Cross-tool skill dirs:

| Scope | Path |
|---|---|
| Personal (all tools) | `~/.agents/skills/<name>/SKILL.md` |
| Project (all tools) | `.agents/skills/<name>/SKILL.md` |

### Feature comparison

| Feature | Claude Code | Gemini CLI | Copilot CLI | OpenAI Codex |
|---|---|---|---|---|
| Standard | agentskills.io | agentskills.io | agentskills.io | agentskills.io |
| Tool-specific dir | `.claude/skills/` | `.gemini/skills/` | `.github/skills/` | `.codex/skills/` |
| Personal dir | `~/.claude/skills/` | `~/.gemini/skills/` | `~/.copilot/skills/` | `~/.codex/skills/` |
| `disable-model-invocation` | ✓ | ✗ | ✗ | via `agents/openai.yaml` |
| `user-invocable` | ✓ | ✗ | ✗ | ✗ |
| `context: fork` (subagent) | ✓ | ✗ | ✗ | ✗ |
| `allowed-tools` | ✓ | ✗ | ✓ | ✗ |
| `!` shell injection | ✓ | ✗ | ✗ | ✗ |
| `model` / `effort` override | ✓ | ✗ | ✗ | ✗ |
| `paths` (file-scoped) | ✓ | ✗ | ✗ | ✗ |
| Argument substitution | ✓ | ✗ | ✗ | ✗ |

**OpenAI Codex** puts tool-specific metadata in a sibling `agents/openai.yaml` file (display name, icon, brand color, MCP tool dependencies, `allow_implicit_invocation: false`) rather than in frontmatter.

**GitHub Copilot** supports only `name`, `description`, `license`, and `allowed-tools` in frontmatter. Project skills live in `.github/skills/`.

**Gemini CLI** is the strictest parser — design cross-tool skills with Gemini's rules in mind and they will work everywhere.
