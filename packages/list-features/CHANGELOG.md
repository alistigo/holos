## 0.5.12 (2026-11-24)

### 🧱 Updated Dependencies

- Updated artifact-features-runner-playwright to 0.3.1

## 0.5.11 (2026-11-18)

### 🚀 Features

- **artifact-features-runner-playwright:** share the browser harness and convert draw-comments features ([592234a](https://github.com/alistigo/holos/commit/592234a))

### 🧱 Updated Dependencies

- Updated list-document to 0.5.12
- Updated artifact-features-runner-playwright to 0.3.0

### ❤️ Thank You

- Claude Opus 5
- Mikael Labrut @MLKiiwy

## 0.5.10 (2026-11-17)

### 🚀 Features

- **artifact-features-runner-playwright:** implement generic Playwright Cucumber runner ([d513359](https://github.com/alistigo/holos/commit/d513359))

### 🩹 Fixes

- **artifact-features-runner-playwright:** launch a chromium that this host can actually run ([7b4e3a7](https://github.com/alistigo/holos/commit/7b4e3a7))
- **list-features:** move playwright to peerDependencies to fix BeforeAll hook ([5ac2a6f](https://github.com/alistigo/holos/commit/5ac2a6f))
- **artifact-list:** fix e2e infrastructure — vite PATH, two-mode targets, Cucumber v12 ([8a49429](https://github.com/alistigo/holos/commit/8a49429))

### 🧱 Updated Dependencies

- Updated artifact-plugin-api to 0.6.10
- Updated list-document to 0.5.11

### ❤️ Thank You

- Claude Opus 5
- Claude Sonnet 4.6
- Mikael Labrut @MLKiiwy

























## 0.4.0 (2026-08-21)

### 🚀 Features

- **list-features:** add Gherkin feature specs for artifact-user-plugin ([f08ed17](https://github.com/alistigo/holos/commit/f08ed17))

### ❤️ Thank You

- Claude Sonnet 4.6
- Mikael Labrut @MLKiiwy

























## 0.2.6 (2026-07-19)

### 🚀 Features

- **sentry-plugin:** implement E2E tests for sentry-error-capture.feature ([90efc2d](https://github.com/alistigo/holos/commit/90efc2d))
- **features:** Gherkin specs for the Sentry and PostHog plugins ([#21](https://github.com/alistigo/holos/issues/21))

### 🩹 Fixes

- **features-runner:** make the @todo tag actually skip scenarios ([#21](https://github.com/alistigo/holos/issues/21))

### ❤️ Thank You

- Claude Sonnet 5
- Mikael Labrut @MLKiiwy





## 0.2.3 (2026-06-28)

### 🩹 Fixes

- restore --first-release and clean up temporary release trigger comments ([ea102bd](https://github.com/alistigo/holos/commit/ea102bd))
- trigger patch release for all packages ([d2a0752](https://github.com/alistigo/holos/commit/d2a0752))

### ❤️ Thank You

- Mikael Labrut @MLKiiwy

## 0.2.2 (2026-06-11)

### 🩹 Fixes

- remove provenance repo is not public its not working ([e24d088](https://github.com/MLKiiwy/europa/commit/e24d088))

### ❤️ Thank You

- Mikael Labrut @MLKiiwy



## 0.2.0 (2026-06-10)

### 🚀 Features

- **alistigo-features:** add @artifact group tag to taxonomy ([d92a9ba](https://github.com/MLKiiwy/europa/commit/d92a9ba))
- **alistigo-ai-m1:** wire DDD layer through React and persistence (#61, #62, #64) ([#61](https://github.com/MLKiiwy/europa/issues/61), [#62](https://github.com/MLKiiwy/europa/issues/62), [#64](https://github.com/MLKiiwy/europa/issues/64))
- **alistigo-document-format:** extract format to its own package + restructure into 3 sections ([ff4175e](https://github.com/MLKiiwy/europa/commit/ff4175e))
- **alistigo-features:** domain-only step language + implicit-open convention ([d7f1dbb](https://github.com/MLKiiwy/europa/commit/d7f1dbb))
- **alistigo-features:** table-first step style — 'Given a list:' + implicit nouns ([#3](https://github.com/MLKiiwy/europa/issues/3))
- **alistigo-features:** create features package with tooling and minimal M1 specs ([735bfb8](https://github.com/MLKiiwy/europa/commit/735bfb8))

### 🩹 Fixes

- linting ([998f3d1](https://github.com/MLKiiwy/europa/commit/998f3d1))
- ci run tests ([4bf7263](https://github.com/MLKiiwy/europa/commit/4bf7263))
- **alistigo-features:** unblock gherklin under Node 24 + align config to v1.0.12 ([01ed21f](https://github.com/MLKiiwy/europa/commit/01ed21f))
- **lint:** migrate Biome config to v2 + clean lint diagnostics ([6341e6d](https://github.com/MLKiiwy/europa/commit/6341e6d))
- **build:** correct dist layout + workspace path resolution ([b7d3df8](https://github.com/MLKiiwy/europa/commit/b7d3df8))
- **alistigo-features:** unblock package build ([3bd3245](https://github.com/MLKiiwy/europa/commit/3bd3245))

### ❤️ Thank You

- Claude Opus 4.7 (1M context)
- Claude Sonnet 4.6
- Mikael Labrut @MLKiiwy