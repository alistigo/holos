# Contract: `@alistigo/artifact-features-runner-playwright/harness`

**Status**: new public API introduced by this feature (FR-016, FR-017, FR-018)
**Stability**: versioned with the runner package; a breaking change here is a breaking
change of `@alistigo/artifact-features-runner-playwright`.

## Package entry points

| Specifier | Purpose | Consumers |
|---|---|---|
| `@alistigo/artifact-features-runner-playwright` | CLI (`bin`) | Nx targets |
| `@alistigo/artifact-features-runner-playwright/harness` | shared World, page object, routes | features packages |

```jsonc
// package.json (runner) — the shape required
{
  "private": false,
  "exports": {
    ".":         { "import": "./dist/index.js",          "types": "./dist/index.d.ts" },
    "./harness": { "import": "./dist/harness/index.js",  "types": "./dist/harness/index.d.ts" }
  },
  "bin": { "artifact-features-runner-playwright": "./dist/cli.js" },
  "files": ["dist"]
}
```

Importing `/harness` MUST NOT pull in `clipanion` or any CLI argument parsing.

## Exported values

```ts
export class ArtifactWorld extends World {
  readonly baseUrl: string;
  readonly artifact: string | undefined;
  browser: Browser;
  context: BrowserContext;
  page: Page;
  playgroundPage: PlaygroundPage;
  pageErrors: string[];

  beforeScenario(browser: Browser): Promise<void>;
  afterScenario(): Promise<void>;
  seedStorage(entries: Record<string, string>): Promise<void>;
  reloadArtifact(): Promise<void>;
  enablePlugin(packageName: string): Promise<void>;
  setPluginConfig(config: Record<string, unknown>): void;
}

export class PlaygroundPage {
  constructor(baseUrl: string, page: Page, artifact?: string);
  readonly artifactFrame: FrameLocator;
  readonly previewFrame: Frame | null;
  open(): Promise<void>;
  selectArtifact(name: string): Promise<void>;
  waitForArtifactReady(): Promise<void>;
  reload(): Promise<void>;
  enablePlugin(packageName: string): Promise<void>;
  fillPluginConfig(packageName: string, json: string): Promise<void>;
}

/** The one readiness marker every artifact and widget exposes. */
export const PLATFORM_TEST_IDS: { readonly app: "alistigo-app"; readonly actionPending: "action-pending" };

/** Route helpers, for a features package that must serve a domain fixture bundle. */
export function installBundleRoute(page: Page, packageName: string, jsSource: string): Promise<void>;
export function installDefaultRoutes(page: Page): Promise<void>;
```

## Side-effect registration module

```ts
// @alistigo/artifact-features-runner-playwright/harness — importing the entry registers nothing.
// The runner separately imports the registration module, which has side effects:
//   setDefaultTimeout, BeforeAll/AfterAll (browser), Before/After (context+page),
//   Before({tags:"@todo"}) → "skipped", AfterStep → screenshot on failure,
//   setWorldConstructor(ArtifactWorld)
```

**Registration order is part of the contract**: the runner places the harness registration
module ahead of the target package's step definitions and support files in Cucumber's
`import` list, so a features package's `setWorldConstructor(MyWorld)` wins.

## Consumer obligations

A features package consuming this entry point MUST:

1. Declare `@alistigo/artifact-features-runner-playwright` in `devDependencies` and keep
   `@cucumber/cucumber` + `playwright` in `peerDependencies`.
2. Not register `BeforeAll`/`AfterAll` browser hooks of its own.
3. Call `super.beforeScenario(browser)` first if it subclasses `ArtifactWorld`.
4. Keep every domain locator out of the harness — extend `PlaygroundPage` instead.

## Breaking-change rules

| Change | Classification |
|---|---|
| Removing or renaming an exported member | major |
| Adding an optional method or export | minor |
| Changing `PLATFORM_TEST_IDS.app` | major — every artifact and widget must change with it |
| Changing hook registration order | major — silently changes which World wins |
