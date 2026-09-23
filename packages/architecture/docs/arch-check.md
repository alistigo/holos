# Architectural Linting (`arch-check`)

Holos uses [dependency-cruiser](https://github.com/sverweij/dependency-cruiser) to enforce
architectural boundaries across `apps/`, `packages/`, `agents/`, and `cli/`.

Run it with:

```sh
pnpm qa:arch-check
```

This is enforced in:
- **Pre-push hook** (`lefthook.yml` → `pre-push`) — runs on every `git push`
- **CI** (`.github/workflows/ci.yml` and `ci-full.yml`) — runs after lint on every PR and weekly

---

## Rules

Configured in `.dependency-cruiser.cjs`. All rules are `error` severity.

### `no-circular`
**No circular dependencies.** A module that (transitively) imports itself causes
build-time and runtime surprises.

**Fix:** Identify the cycle by running:
```sh
pnpm depcruise --include-only <path> --output-type dot . | dot -Tsvg > graph.svg
```
Then break the cycle by extracting shared logic into a new module that both sides import.

---

### `no-handler-to-repo`
**Route handlers / controllers cannot import repositories directly.**

- Matched from: `/(routes|handlers|controllers)/`
- Forbidden target: `/(repositories|repos|repository)/`

**Why:** Handlers must go through a service. This enforces the classic
Routes → Services → Repositories layering and keeps business logic out of HTTP concerns.

**Fix:** Move the repository call into a service function; import the service from the handler.

---

### `no-service-to-handler`
**Services cannot import route handlers / controllers.**

- Matched from: `/services?/`
- Forbidden target: `/(routes|handlers|controllers)/`

**Why:** Dependency direction must flow downward (handlers use services, not the reverse).
A service importing a handler is an inversion of control that makes services untestable.

**Fix:** Extract the shared logic into a lower-level utility or into the service itself;
remove the handler import.

---

### `no-cross-package-relative-import`
**Cross-package imports must use workspace package names, not `../../` relative paths.**

- Matched from: any file under `apps/<pkg>/`, `packages/<pkg>/`, `agents/<pkg>/`, or `cli/<pkg>/`
- Forbidden: any import via `../` that escapes the package root

**Why:** Relative paths that cross package boundaries bypass the workspace dependency graph,
break `nx affected`, and make packages impossible to publish individually.

**Fix:** Add the target package as a dependency in the consuming package's `package.json`
using `workspace:*`, then import by package name:
```ts
// Before (forbidden)
import { foo } from "../../other-package/src/foo";

// After
import { foo } from "@mlabrut/other-package";
```

---

## Adding New Rules

Edit `.dependency-cruiser.cjs` and add a new entry to the `forbidden` array.
Re-run `pnpm qa:arch-check` to verify the rule behaves as expected.
Full rule reference: [dependency-cruiser docs](https://github.com/sverweij/dependency-cruiser/blob/main/docs/rules-reference.md).
