# Skill Pattern

Every `@alistigo` artifact ships an agent skill that teaches AI chat (Claude and other
LLM agents) what the artifact is, when to use it, and how to interact with it.

See [ADR 0015](../adrs/0015-agent-skills-standard.md) for the agentskills.io standard
that all Alistigo skills follow.

---

## Skill Package Location

```
packages/artifact-<name>-skill/
├── SKILL.md          ← the skill definition (source of truth)
├── package.json
├── tsconfig.json
└── project.json
```

The npm package name follows the pattern: `@alistigo/artifact-<name>-skill`.

**Reference implementation:** `packages/artifact-list-skill/SKILL.md`

---

## What a Skill Must Teach

A well-written skill covers four areas:

### 1. What the artifact is

One paragraph describing the artifact's purpose. The agent reads this to decide whether
the artifact fits the user's request.

Example (list artifact):
> Alistigo List Artifact (`@alistigo/artifact-list`) is an interactive, embeddable list
> widget. Users can add, delete, and persist text elements. It runs entirely in the browser
> with no backend required.

### 2. When to use it

Trigger phrases and use-cases. Be specific enough that the agent doesn't trigger on
every "show me a list" request, but broad enough to catch the real cases.

```yaml
triggers:
  - "create a list"
  - "add a todo list"
  - "show an interactive checklist"
  - "I need to track items"
```

Include negative triggers if needed:
```yaml
not-triggers:
  - "show me a table" → use a table artifact
  - "create a kanban board" → use a kanban artifact
```

### 3. How to write its config

Show the config document schema + a complete example:

```json
{
  "app": "@alistigo/artifact-list",
  "lang": "en",
  "readonly": false,
  "plugins": {
    "@alistigo/artifact-sentry-plugin": { "dsn": "..." }
  }
}
```

Document every field: name, type, required/optional, default, description.

The agent must know how to produce the `<script type="application/json" id="alistigo-config">` block.

### 4. How to use the AI API

Describe the available operations and how to call them. Show the `<api-calls>` tag format:

```html
<api-calls>
[
  { "action": "addElement", "params": { "text": "Buy milk" } },
  { "action": "addElement", "params": { "text": "Buy bread" } },
  { "action": "renameList", "params": { "name": "Grocery list" } }
]
</api-calls>
```

List each operation with its params and a one-line description. Reference the artifact's
`api.json` for the authoritative schema.

---

## SKILL.md Template

```markdown
# Skill: @alistigo/artifact-<name>

## What it is

<one-paragraph description>

## When to use

### Trigger phrases
- "<phrase 1>"
- "<phrase 2>"

### Not for
- "<counter-case 1>" → use <alternative artifact>

## Config document

### Fields

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `app` | string | yes | — | Must be `"@alistigo/artifact-<name>"` |
| `lang` | BCP-47 | no | `"en"` | UI language |
| ... | | | | |

### Example

\`\`\`json
{
  "app": "@alistigo/artifact-<name>",
  "lang": "en"
}
\`\`\`

### How to embed

\`\`\`html
<script type="application/json" id="alistigo-config">
{ "app": "@alistigo/artifact-<name>", "lang": "en" }
</script>
\`\`\`

## AI API

### Available operations

| Action | Params | Description |
|--------|--------|-------------|
| `<action>` | `{ field: type }` | Description |

### Example `<api-calls>` tag

\`\`\`html
<api-calls>
[
  { "action": "<action>", "params": { ... } }
]
</api-calls>
\`\`\`

## Notes

<Any artifact-specific caveats or tips for the AI>
```

---

## Registration

Skills are registered in the workspace symlink at `.claude/skills/` (→ `.agents/skills/`).
Each skill package's `SKILL.md` is the file Claude Code loads when the skill is invoked.

The `packages/artifact-<name>-skill/` package also exports the skill content programmatically
for use by the `agent-skill-tester` CLI:

```ts
export { default as skillContent } from "../SKILL.md?raw";
```
