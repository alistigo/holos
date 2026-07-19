## 0.2.8 (2026-07-19)

### 🚀 Features

- **sentry-plugin:** implement E2E tests for sentry-error-capture.feature ([90efc2d](https://github.com/alistigo/holos/commit/90efc2d))

### 🧱 Updated Dependencies

- Updated alistigo-claude-artifact-list-storage to 0.2.6
- Updated alistigo-local-storage-repository to 0.2.6
- Updated alistigo-list-components-react to 0.2.6
- Updated alistigo-artifact-plugin-api to 0.1.1
- Updated alistigo-document-editor to 0.2.6
- Updated alistigo-document-format to 0.2.6
- Updated alistigo-domain to 0.2.6
- Updated alistigo-logger to 0.2.6

### ❤️ Thank You

- Mikael Labrut @MLKiiwy

## 0.2.7 (2026-07-02)

### 🧱 Updated Dependencies

- Updated alistigo-claude-artifact-list-storage to 0.2.5
- Updated alistigo-local-storage-repository to 0.2.5
- Updated alistigo-list-components-react to 0.2.5
- Updated alistigo-document-editor to 0.2.5
- Updated alistigo-document-format to 0.2.5
- Updated alistigo-domain to 0.2.5
- Updated alistigo-logger to 0.2.5

## 0.2.6 (2026-07-02)

### 🧱 Updated Dependencies

- Updated alistigo-claude-artifact-list-storage to 0.2.4
- Updated alistigo-local-storage-repository to 0.2.4
- Updated alistigo-list-components-react to 0.2.4
- Updated alistigo-document-editor to 0.2.4
- Updated alistigo-document-format to 0.2.4
- Updated alistigo-domain to 0.2.4
- Updated alistigo-logger to 0.2.4

## 0.2.5 (2026-06-28)

### 🩹 Fixes

- restore --first-release and clean up temporary release trigger comments ([ea102bd](https://github.com/alistigo/holos/commit/ea102bd))
- trigger patch release for all packages ([d2a0752](https://github.com/alistigo/holos/commit/d2a0752))

### 🧱 Updated Dependencies

- Updated alistigo-claude-artifact-list-storage to 0.2.3
- Updated alistigo-local-storage-repository to 0.2.3
- Updated alistigo-list-components-react to 0.2.3
- Updated alistigo-document-editor to 0.2.3
- Updated alistigo-document-format to 0.2.3
- Updated alistigo-domain to 0.2.3
- Updated alistigo-logger to 0.2.3

### ❤️ Thank You

- Mikael Labrut @MLKiiwy

## 0.2.4 (2026-06-11)

### 🩹 Fixes

- **alistigo/artifact:** make autoMount exactOptionalPropertyTypes-safe ([bac6e6d](https://github.com/MLKiiwy/europa/commit/bac6e6d))
- **alistigo/artifact:** move inline document reading into autoMount ([ce8992e](https://github.com/MLKiiwy/europa/commit/ce8992e))

### ❤️ Thank You

- Claude Sonnet 4.6
- Mikael Labrut @MLKiiwy

## 0.2.3 (2026-06-11)

### 🩹 Fixes

- correct TypeId prefix from 'list' to 'lst' in default document ([222f6bc](https://github.com/MLKiiwy/europa/commit/222f6bc))

### ❤️ Thank You

- Claude Sonnet 4.6
- Mikael Labrut @MLKiiwy

## 0.2.2 (2026-06-11)

### 🩹 Fixes

- remove provenance repo is not public its not working ([e24d088](https://github.com/MLKiiwy/europa/commit/e24d088))

### 🧱 Updated Dependencies

- Updated alistigo-claude-artifact-list-storage to 0.2.2
- Updated alistigo-local-storage-repository to 0.2.2
- Updated alistigo-list-components-react to 0.2.2
- Updated alistigo-document-editor to 0.2.2
- Updated alistigo-document-format to 0.2.2
- Updated alistigo-domain to 0.2.2
- Updated alistigo-logger to 0.2.2

### ❤️ Thank You

- Mikael Labrut @MLKiiwy

## 0.2.1 (2026-06-10)

### 🧱 Updated Dependencies

- Updated alistigo-claude-artifact-list-storage to 0.2.1
- Updated alistigo-local-storage-repository to 0.2.1
- Updated alistigo-list-components-react to 0.2.1
- Updated alistigo-document-editor to 0.2.1
- Updated alistigo-document-format to 0.2.1
- Updated alistigo-domain to 0.2.1
- Updated alistigo-logger to 0.2.1

## 0.2.0 (2026-06-10)

### 🚀 Features

- **alistigo:** integrate PostHog EU analytics ([#92](https://github.com/MLKiiwy/europa/pull/92))
- **alistigo:** add Alistigo.version() and Alistigo.about() debug API ([#91](https://github.com/MLKiiwy/europa/pull/91))
- **alistigo:** integrate Sentry error monitoring ([#90](https://github.com/MLKiiwy/europa/pull/90))
- **alistigo-artifact:** inject CSS into UMD bundle via vite-plugin-css-injected-by-js ([4bf2474](https://github.com/MLKiiwy/europa/commit/4bf2474))
- **alistigo-artifact:** expose types from source entry ([ba7fc3e](https://github.com/MLKiiwy/europa/commit/ba7fc3e))
- **alistigo-artifact:** auto-mount widget on page load ([889ca47](https://github.com/MLKiiwy/europa/commit/889ca47))
- **alistigo:** add structured pino logger + two-mode artifact tester ([0bcc512](https://github.com/MLKiiwy/europa/commit/0bcc512))
- **alistigo:** add local artifact tester + fix README CDN url ([dfd2bda](https://github.com/MLKiiwy/europa/commit/dfd2bda))
- **alistigo:** create self-contained UMD artifact bundle for Claude HTML artifacts (Issue #75) ([#75](https://github.com/MLKiiwy/europa/issues/75))

### 🩹 Fixes

- **alistigo:** correct pino arg order and exactOptionalPropertyTypes in observability files ([6aad22d](https://github.com/MLKiiwy/europa/commit/6aad22d))
- **alistigo:** remove unused captureError, extract renderApp helper, apply biome fixes ([3b156a4](https://github.com/MLKiiwy/europa/commit/3b156a4))
- **alistigo:** fix analytics test mock hoisting and dedup widget_displayed on re-mount ([#92](https://github.com/MLKiiwy/europa/pull/92))
- **alistigo:** fix locale in version() and eliminate double console.log in about() ([#91](https://github.com/MLKiiwy/europa/pull/91))
- **alistigo:** set Sentry initialized flag only after successful init ([#90](https://github.com/MLKiiwy/europa/pull/90))
- add sourcemap to artifact build ([12bb7ba](https://github.com/MLKiiwy/europa/commit/12bb7ba))
- rebase issue ([6118ace](https://github.com/MLKiiwy/europa/commit/6118ace))
- **alistigo-artifact:** remove unused ACTIVE_LOCALE export, extract getOrCreateRoot, suppress fallow false positives ([1f0ffd3](https://github.com/MLKiiwy/europa/commit/1f0ffd3))
- **alistigo:** apply biome import-order on vite configs ([5e705fb](https://github.com/MLKiiwy/europa/commit/5e705fb))
- **alistigo:** resolve fallow audit gate failures ([e700eb3](https://github.com/MLKiiwy/europa/commit/e700eb3))
- **alistigo-artifact:** apply biome import-order fix on index.tsx ([87a5453](https://github.com/MLKiiwy/europa/commit/87a5453))
- **alistigo:** suppress fallow complexity on readInlineDocument (browser-only, untestable) ([f042a7b](https://github.com/MLKiiwy/europa/commit/f042a7b))
- **alistigo:** update alistigo-artifact README and locale option JSDoc ([a96367f](https://github.com/MLKiiwy/europa/commit/a96367f))

### 🧱 Updated Dependencies

- Updated alistigo-claude-artifact-list-storage to 0.2.0
- Updated alistigo-local-storage-repository to 0.2.0
- Updated alistigo-list-components-react to 0.2.0
- Updated alistigo-document-editor to 0.2.0
- Updated alistigo-document-format to 0.2.0
- Updated alistigo-domain to 0.2.0
- Updated alistigo-logger to 0.2.0

### ❤️ Thank You

- Claude Sonnet 4.6
- Mikael Labrut @MLKiiwy