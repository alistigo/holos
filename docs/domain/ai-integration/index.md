# AI Integration Context — Overview

**Type:** Generic Subdomain

Responsible for making Alistigo discoverable and usable by AI systems without custom prompt engineering. Publishes a machine-readable guide (F10) that teaches any AI how to produce a valid `AlistigoDocument` and embed the `ListWidget`.

---

## Status

**Placeholder — populated when Task 008 (AI integration guide) begins.**

## Planned contents

- `llms.txt` spec document — how to produce an `AlistigoDocument` step-by-step
- MCP tool description (`create_alistigo_list`) — JSON Schema for agent tool use
- Hosting and discovery strategy

## Relationship to other contexts

- Consumes the `AlistigoDocument` format from the Document Context (read-only)
- Produces no internal domain objects — output is purely a public integration guide
