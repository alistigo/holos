# Alistigo Platform Documentation

Alistigo is a **platform for AI artifacts** — a set of shared libraries and conventions
that let developers build any artifact (list, kanban, table, form, timeline…) with a
consistent quality floor and minimal boilerplate.

The **list artifact** (`@alistigo/artifact-list`) is the reference implementation.
All platform concepts are demonstrated there first.

See [ADR 0018](../adrs/0018-alistigo-platform.md) for the decision record capturing
this scope change.

---

## Platform Documents

| Document | What it covers |
|---|---|
| [artifact-contract.md](artifact-contract.md) | What every artifact must implement |
| [skill-pattern.md](skill-pattern.md) | How each artifact publishes an agent skill |
| [plugin-types.md](plugin-types.md) | Plugin type taxonomy (infra, domain, storage, auth) |
| [layer-diagram.md](layer-diagram.md) | Full layer diagram with all package names |

---

## Quick Navigation

- **Building a new artifact?** Start with [artifact-contract.md](artifact-contract.md)
- **Understanding the package structure?** See [layer-diagram.md](layer-diagram.md)
- **Adding a plugin?** See [plugin-types.md](plugin-types.md)
- **Teaching AI about your artifact?** See [skill-pattern.md](skill-pattern.md)
- **Implementation tracking?** See [Epic #44](https://github.com/alistigo/holos/issues/44)
