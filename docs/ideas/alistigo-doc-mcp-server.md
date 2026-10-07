# Idea: Alistigo Document MCP Server

## Overview

A small **MCP (Model Context Protocol) server** that stores and retrieves the "doc" layer of any Alistigo artifact.

This is primarily a **learning project**: a hands-on way to design, build, and ship a real MCP server while solving a genuine problem — making artifact documents accessible to AI agents beyond the browser context.

---

## Problem

Alistigo artifacts carry a "doc" — structured content that the AI writes into and reads from (the list artifact being the first example).
Today that doc lives inside the browser (in-memory or in the artifact's local storage).

An AI agent running outside the browser (e.g., a Claude Code session, an Agentic workflow, a scheduled task) cannot access it.
An MCP server bridges that gap.

---

## What the MCP Server Does

| Operation | Description |
|-----------|-------------|
| `doc.create` | Store a new Alistigo document (typed, with schema version) |
| `doc.read` | Retrieve a document by ID |
| `doc.update` | Apply a patch to an existing document |
| `doc.delete` | Remove a document |
| `doc.list` | List documents by type or tag |
| `doc.search` | Simple full-text search over document content |

The server exposes these as MCP **tools** so any MCP-compatible AI client (Claude Desktop, Claude Code, custom agents) can call them naturally in conversation.

---

## Document Model

```ts
type AlistigoDoc = {
  id: string
  type: string           // 'list' | 'sketch' | 'scad' | custom
  schemaVersion: number
  title: string
  content: unknown       // type-specific payload validated by `type`
  tags: string[]
  createdAt: Date
  updatedAt: Date
  ownerId?: string
}
```

---

## Technical Stack

| Layer | Choice | Rationale |
|-------|--------|-----------|
| Protocol | `@modelcontextprotocol/sdk` | Official MCP SDK |
| Runtime | Bun | Consistent with the monorepo |
| Storage (v1) | SQLite via Bun's built-in SQLite | Zero-dependency, file-based, easy to ship |
| Storage (v2) | Postgres (optional upgrade) | For multi-user / cloud deployment |
| Auth (v1) | None / localhost-only | Learning project, single user |
| Auth (v2) | API key header | Minimal barrier for remote access |

---

## Scope for v1 (Learning Goals)

- Implement all CRUD tools with SQLite.
- Register the server in Claude Desktop's `claude_desktop_config.json`.
- Write one end-to-end test: Claude creates a list artifact in the browser → stores it via MCP → a Claude Code session reads it back.
- Document the lessons learned.

This is intentionally small. The goal is to understand the MCP server lifecycle, tool schema design, and how errors surface to the AI client — not to build production infra.

---

## Placement in the Repo

```
apps/alistigo-doc-mcp/
  src/
    server.ts        # MCP server entry point
    tools/
      create.ts
      read.ts
      update.ts
      delete.ts
      list.ts
      search.ts
    db/
      schema.ts      # SQLite table definitions
      queries.ts
  project.json
  package.json
```

---

## Open Questions

- Should documents be stored locally (per-machine) or synced to a cloud backend?
- How does schema versioning work when the `list` artifact evolves its content shape?
- Should the MCP server also expose **resources** (not just tools) so AI clients can browse stored docs by URI?
- Worth publishing to npm so others building on the Alistigo platform can reuse it?
