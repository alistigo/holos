# Contract: Features Package

A `features` package is an `@alistigo` workspace package that bundles Gherkin scenario files and their TypeScript step definitions for one artifact domain. The generic runner discovers and loads features packages entirely through this contract.

## package.json requirements

```jsonc
{
  "name": "@alistigo/${domain}-features",          // required: scope + domain + "-features"
  "type": "module",                                 // required: ESM
  "alistigo": {
    "type": "features",                             // required: exactly "features"
    "domain": "${domain}"                           // required: matches name prefix
  },
  "files": ["dist", "features"],                   // dist contains compiled step defs + path constants
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "types": "./dist/index.d.ts"
    }
  }
}
```

## TypeScript public API (exported from `src/index.ts`)

```typescript
/**
 * Absolute path to the directory containing all .feature files.
 * Resolved against the published dist/ so it works after build and in node_modules.
 */
export const FEATURES_DIR: string;

/**
 * Absolute path to the directory containing compiled step definition files (.js).
 * The runner uses this as the `import` glob base for Cucumber.
 * Resolved against the published dist/ so it works after build and in node_modules.
 */
export const STEP_DEFINITIONS_DIR: string;
```

Both constants MUST be absolute paths that remain valid when the package is installed in `node_modules`.

## File layout

```text
packages/${domain}-features/
├── package.json                 # alistigo.type="features", alistigo.domain="${domain}"
├── project.json                 # Nx tasks: build, typecheck, test, lint, clean
├── tsconfig.json
├── features/                    # Gherkin .feature files (published, not compiled)
│   └── **/*.feature
├── src/
│   ├── index.ts                 # exports FEATURES_DIR, STEP_DEFINITIONS_DIR, and tags
│   └── step-definitions/        # TypeScript step definitions
│       └── **/*.steps.ts
└── dist/                        # compiled output (not committed)
    ├── index.js / index.d.ts
    └── step-definitions/
        └── **/*.steps.js
```

## Runtime behaviour

- The runner imports the package by npm name: `const pkg = await import("@alistigo/${domain}-features")`
- It reads `pkg.FEATURES_DIR` and `pkg.STEP_DEFINITIONS_DIR` to build the cucumber options
- Step definitions receive the target host via the `PLAYWRIGHT_BASE_URL` environment variable (set by the runner before cucumber starts)

## What a features package MUST NOT do

- Import from the runner CLI — the dependency is one-way (runner → features package)
- Export framework-specific world state or runner configuration — the package owns step logic, not runner lifecycle
- Duplicate `.feature` files outside the `features/` directory
