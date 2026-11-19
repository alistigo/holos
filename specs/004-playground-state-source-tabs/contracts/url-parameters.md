# Contract: Address Parameters

**Module**: `apps/alistigo-artifact-playground/src/playground-url.ts`
**Consumers**: `src/hooks/useHostConfig.ts` (only)
**Tests**: `src/playground-url.test.ts` (`bun test`)

Pure: the hook passes `window.location.search` in as a string.

## Surface

```ts
export const URL_PARAM_ARTIFACT = "artifact";
export const URL_PARAM_SOURCE = "source";

/**
 * Reads the overrides a playground address may carry.
 * Unknown or unresolvable values are omitted, never defaulted (FR-010).
 */
export function parseUrlOverrides(
  search: string,
  catalog: PlaygroundCatalog,
): Partial<Pick<Config, "app" | "mode">>;
```

## Public URL contract

```text
<playground>/?artifact=@alistigo/artifact-list
<playground>/?artifact=artifact-list
<playground>/?artifact=list&source=prod-local
<playground>/?source=dev
```

| Parameter | Target field | Resolution |
|-----------|--------------|------------|
| `artifact` | `Config.app` | exact match against `catalog.knownApps`; else match a registry key whose name after the scope equals the value; else a key whose scope-and-`artifact-`-stripped name equals the value. Ambiguous ⇒ omitted. |
| `source` | `Config.mode` | `dev` → `"dev"`; `prod-local`, `prod local`, `prod_local` → `"prod-local"`; anything else omitted. Omitted entirely when `catalog.modeSelectable` is false. |

## Rules

| ID | Rule |
|----|------|
| U-1 | `parseUrlOverrides("")` → `{}`. |
| U-2 | A parameter the playground does not know is ignored; it never blocks the page (FR-010). |
| U-3 | Value matching is case-insensitive and trims surrounding whitespace; the URL-decoded value is what is matched (so `%40alistigo%2Fartifact-list` resolves). |
| U-4 | A repeated parameter uses the first occurrence. |
| U-5 | Only `app` and `mode` are ever returned. No other field is addressable in this iteration. |
| U-6 | The module is read-only with respect to the address: nothing in this feature calls `history.pushState`/`replaceState` or assigns `location.search` (data-model R-10). |
| U-7 | An override wins over the stored value for its field (FR-009) and leaves every other field to storage — enforced by `composeConfig`'s ordering, tested there. |
| U-8 | Overrides are applied to the *initial* state only; the hook holds no effect that re-reads the address, so a later selection in the form is final (FR-011). |

## Interaction with the e2e harness

The harness navigates to the bare base URL (`ArtifactWorld.baseUrl`, no query string), so
`parseUrlOverrides` returns `{}` on every run and the suites are unaffected. The parameters are
available to a developer reproducing a scenario by hand; nothing in the harness is required to
start using them.
