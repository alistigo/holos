# Quickstart: Validating Generic Features Runner

End-to-end validation scenarios that prove the feature works. All commands run from the workspace root.

## Prerequisites

- Node 22, pnpm, Bun installed (managed by mise: `mise install`)
- Workspace dependencies installed: `pnpm install`
- Playground built: `pnpm nx build artifact-list-playground` (or relevant playground)

---

## Scenario 1: Run list-features against the local playground

Validates the core migration — the new runner replaces the old one.

```sh
# 1. Start the playground in the background
pnpm nx serve artifact-list-playground &
PLAYGROUND_PID=$!

# 2. Build the runner and the features package
pnpm nx run artifact-features-runner-playwright:build
pnpm nx run list-features:build

# 3. Run with the new generic runner (no --host needed; defaults to http://localhost:4173)
pnpm nx run artifact-features-runner-playwright:test:list

# OR invoke the CLI directly:
bun cli/artifact-features-runner-playwright/src/cli.ts \
  --target=@alistigo/list-features

# Expected: All previously passing list scenarios pass. Exit code 0.

# 4. Test with an explicit host
bun cli/artifact-features-runner-playwright/src/cli.ts \
  --target=@alistigo/list-features \
  --host=http://localhost:4173

# Expected: Same results. Exit code 0.

kill $PLAYGROUND_PID
```

---

## Scenario 2: Verify the runner rejects an invalid target

```sh
bun cli/artifact-features-runner-playwright/src/cli.ts \
  --target=@alistigo/list-document

# Expected: Exit code 1
# Error message: "@alistigo/list-document" is not a features package
#   (alistigo.type is "document", expected "features")
```

```sh
bun cli/artifact-features-runner-playwright/src/cli.ts \
  --target=@alistigo/does-not-exist

# Expected: Exit code 1
# Error message: Cannot resolve package "@alistigo/does-not-exist"
```

---

## Scenario 3: Verify list-features metadata is accepted by arch-check

```sh
# After metadata has been added to packages/list-features/package.json
pnpm nx run artifact-arch-check:qa:artifact-arch-check:features

# Expected: Exit code 0
# Output: "✓ @alistigo/list-features (packages/list-features)"
```

---

## Scenario 4: Verify arch-check catches a deliberately malformed features package

Create a temporary test package at `packages/bad-features-test/package.json`:

```json
{
  "name": "@alistigo/bad-features-test",
  "alistigo": {
    "type": "features",
    "domain": "wrong-domain"
  }
}
```

```sh
pnpm nx run artifact-arch-check:qa:artifact-arch-check:features

# Expected: Exit code 1
# Output includes:
#   [features/naming-convention] "bad-features-test" does not end with "-features" matching domain
#   [features/domain-consistent] domain "wrong-domain" does not match name prefix "bad"
```

Remove the test package afterward.

---

## Scenario 5: Verify the old runner no longer exists

```sh
ls cli/list-features-runner-playwright

# Expected: "No such file or directory"
# (The old runner was deleted as part of this migration)
```

---

## Validation of regression-free migration

Run the full QA suite:

```sh
pnpm nx run holos:qa
```

**Expected**: All QA gates pass, including:
- `qa:lint` — no Biome issues in the new runner or refactored features package
- `qa:arch-check` — no dependency-cruiser violations
- `qa:dead-code` — `list-features-runner-playwright` no longer referenced
- `qa:artifact-arch-check` — all existing artifacts pass + new `features` check passes for `list-features`

The number of passing Gherkin scenarios is identical to or greater than before the migration.
