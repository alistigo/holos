## 0.6.0 (2026-08-21)

### 🚀 Features

- **user-plugin:** auto-save user edits with debounce + global progress bar ([119f606](https://github.com/alistigo/holos/commit/119f606))
- **artifact-list:** add artifact-user-plugin as default plugin ([5ba2976](https://github.com/alistigo/holos/commit/5ba2976))
- **plugin-api:** add store/requires/renderStatusBadge/renderMenuContent + activate wrapRoot ([00fb992](https://github.com/alistigo/holos/commit/00fb992))

### 🩹 Fixes

- add fallow complexity suppresses and unused var fix to pass pre-push gate ([7a1c57b](https://github.com/alistigo/holos/commit/7a1c57b))

### 🧱 Updated Dependencies

- Updated artifact-core-components-react to 0.4.1
- Updated list-components-react to 0.3.1
- Updated list-document-editor to 0.3.1
- Updated list-document-format to 0.3.1
- Updated artifact-plugin-api to 0.4.1
- Updated claude-artifact-api to 0.3.1
- Updated artifact-core to 0.3.1
- Updated list-domain to 0.3.1
- Updated logger to 0.3.1

### ❤️ Thank You

- Claude Sonnet 4.6
- Mikael Labrut @MLKiiwy

## 0.5.0 (2026-08-16)

### 🚀 Features

- extract markdown parsing to list-document-format, add AiInitialInput to editor, delete ai-chat-async-api ([53fea52](https://github.com/alistigo/holos/commit/53fea52))
- **artifact-list:** replace JSON-LD injection with markdown #ai-input-action ([67035f0](https://github.com/alistigo/holos/commit/67035f0))

### 🩹 Fixes

- **playwright:** replace stale UI selectors with localStorage injection + fixed storage key ([b39a583](https://github.com/alistigo/holos/commit/b39a583))
- **lint:** fix fallow suppress placement and biome errors ([afe0e30](https://github.com/alistigo/holos/commit/afe0e30))

### 🧱 Updated Dependencies

- Updated artifact-core-components-react to 0.4.0
- Updated list-components-react to 0.3.0
- Updated list-document-editor to 0.3.0
- Updated list-document-format to 0.3.0
- Updated artifact-plugin-api to 0.4.0
- Updated claude-artifact-api to 0.3.0
- Updated artifact-core to 0.3.0
- Updated list-domain to 0.3.0
- Updated logger to 0.3.0

### ❤️ Thank You

- Claude Sonnet 4.6
- Mikael Labrut @MLKiiwy

## 0.4.2 (2026-08-07)

### 🧱 Updated Dependencies

- Updated artifact-core-components-react to 0.3.6
- Updated list-components-react to 0.2.18
- Updated list-document-editor to 0.2.17
- Updated list-document-format to 0.2.17
- Updated artifact-plugin-api to 0.3.2
- Updated artifact-core to 0.2.7
- Updated list-domain to 0.2.17
- Updated logger to 0.2.17

## 0.4.1 (2026-08-07)

### 🧱 Updated Dependencies

- Updated artifact-core-components-react to 0.3.5
- Updated list-components-react to 0.2.17
- Updated list-document-editor to 0.2.16
- Updated list-document-format to 0.2.16
- Updated artifact-plugin-api to 0.3.1
- Updated artifact-core to 0.2.6
- Updated list-domain to 0.2.16
- Updated logger to 0.2.16

## 0.4.0 (2026-08-05)

### 🚀 Features

- **artifact-list:** introduce ListKeyValueAdapter to bridge KeyValueStore → AlistigoListStore ([93929dd](https://github.com/alistigo/holos/commit/93929dd))

### 🩹 Fixes

- **fallow:** remove unused exports and suppress duck-typed class member ([da8fd46](https://github.com/alistigo/holos/commit/da8fd46))
- **lint:** fix import order in claude-storage-plugin and artifact-list ([06473a1](https://github.com/alistigo/holos/commit/06473a1))

### 🧱 Updated Dependencies

- Updated artifact-core-components-react to 0.3.4
- Updated list-components-react to 0.2.16
- Updated list-document-editor to 0.2.15
- Updated list-document-format to 0.2.15
- Updated artifact-plugin-api to 0.3.0
- Updated artifact-core to 0.2.5
- Updated list-domain to 0.2.15
- Updated logger to 0.2.15

### ❤️ Thank You

- Claude Sonnet 4.6
- Mikael Labrut @MLKiiwy

## 0.3.5 (2026-08-04)

### 🧱 Updated Dependencies

- Updated artifact-core-components-react to 0.3.3
- Updated list-components-react to 0.2.15
- Updated list-document-editor to 0.2.14
- Updated list-document-format to 0.2.14
- Updated artifact-plugin-api to 0.2.2
- Updated artifact-core to 0.2.4
- Updated list-domain to 0.2.14
- Updated logger to 0.2.14

## 0.3.4 (2026-08-04)

### 🧱 Updated Dependencies

- Updated artifact-core-components-react to 0.3.2
- Updated list-components-react to 0.2.14
- Updated list-document-editor to 0.2.13
- Updated list-document-format to 0.2.13
- Updated artifact-plugin-api to 0.2.1
- Updated artifact-core to 0.2.3
- Updated list-domain to 0.2.13
- Updated logger to 0.2.13

## 0.3.3 (2026-08-04)

### 🩹 Fixes

- **artifact-list:** update buildPluginInfos to use new PluginInfo status values ([3abc6d8](https://github.com/alistigo/holos/commit/3abc6d8))

### 🧱 Updated Dependencies

- Updated artifact-core-components-react to 0.3.1
- Updated artifact-plugin-api to 0.2.0
- Updated artifact-core to 0.2.2

### ❤️ Thank You

- Claude Sonnet 4.6
- Mikael Labrut @MLKiiwy

## 0.3.2 (2026-08-04)

### 🚀 Features

- **artifact-core-components-react:** add Modal, PluginList, refactor context menu to modal trigger ([2a0d9c8](https://github.com/alistigo/holos/commit/2a0d9c8))
- **artifact-core-components-react:** wire AlistigoBadge sheet API through ([5d724c3](https://github.com/alistigo/holos/commit/5d724c3))

### 🩹 Fixes

- modal ui ([7b675ef](https://github.com/alistigo/holos/commit/7b675ef))

### 🧱 Updated Dependencies

- Updated artifact-core-components-react to 0.3.0

### ❤️ Thank You

- Claude Sonnet 4.6
- Claude Sonnet 5
- Mikael Labrut @MLKiiwy

## 0.3.1 (2026-07-30)

### 🧱 Updated Dependencies

- Updated artifact-core-components-react to 0.2.1
- Updated list-components-react to 0.2.13
- Updated list-document-editor to 0.2.12
- Updated list-document-format to 0.2.12
- Updated artifact-plugin-api to 0.1.8
- Updated artifact-core to 0.2.1
- Updated list-domain to 0.2.12
- Updated logger to 0.2.12

## 0.3.0 (2026-07-29)

### 🚀 Features

- **playground:** add AI API Simulator tab for testing artifact API calls ([#52](https://github.com/alistigo/holos/issues/52))
- **ai-chat-async-api:** scaffold @alistigo/ai-chat-async-api package ([#51](https://github.com/alistigo/holos/issues/51))
- **artifact-list:** integrate artifact-core and artifact-core-components-react ([#50](https://github.com/alistigo/holos/issues/50))

### 🩹 Fixes

- **artifact-list:** remove useless Fragment wrapper in ArtifactRoot ([43d1efe](https://github.com/alistigo/holos/commit/43d1efe))
- **artifact-list:** suppress fallow complexity and break storybook clone ([79f6757](https://github.com/alistigo/holos/commit/79f6757))
- **artifact-list:** extract MountOptions to types.ts to break circular dep ([#50](https://github.com/alistigo/holos/issues/50))

### 🧱 Updated Dependencies

- Updated artifact-core-components-react to 0.2.0
- Updated list-components-react to 0.2.12
- Updated list-document-editor to 0.2.11
- Updated list-document-format to 0.2.11
- Updated artifact-plugin-api to 0.1.7
- Updated artifact-core to 0.2.0
- Updated list-domain to 0.2.11
- Updated logger to 0.2.11

### ❤️ Thank You

- Claude Sonnet 4.6
- Mikael Labrut @MLKiiwy

## 0.2.14 (2026-07-27)

### 🧱 Updated Dependencies

- Updated alistigo-artifact-plugin-api to 0.1.6

## 0.2.13 (2026-07-26)

### 🚀 Features

- **artifact-list:** use storage plugins via CDN with in-memory fallback (Issue #35) ([#35](https://github.com/alistigo/holos/issues/35))
- **storage:** create alistigo-claude-storage-plugin (Issue #34) ([#34](https://github.com/alistigo/holos/issues/34))

### 🧱 Updated Dependencies

- Updated alistigo-list-components-react to 0.2.11
- Updated alistigo-artifact-plugin-api to 0.1.5
- Updated alistigo-document-editor to 0.2.10
- Updated alistigo-document-format to 0.2.10
- Updated alistigo-domain to 0.2.10
- Updated alistigo-logger to 0.2.10

### ❤️ Thank You

- Claude Sonnet 4.6
- Mikael Labrut @MLKiiwy

## 0.2.12 (2026-07-24)

### 🧱 Updated Dependencies

- Updated alistigo-claude-artifact-list-storage to 0.2.9
- Updated alistigo-local-storage-repository to 0.2.9
- Updated alistigo-list-components-react to 0.2.10
- Updated alistigo-artifact-plugin-api to 0.1.4
- Updated alistigo-document-editor to 0.2.9
- Updated alistigo-document-format to 0.2.9
- Updated alistigo-domain to 0.2.9
- Updated alistigo-logger to 0.2.9

## 0.2.11 (2026-07-24)

### 🧱 Updated Dependencies

- Updated alistigo-claude-artifact-list-storage to 0.2.8
- Updated alistigo-local-storage-repository to 0.2.8
- Updated alistigo-list-components-react to 0.2.9
- Updated alistigo-artifact-plugin-api to 0.1.3
- Updated alistigo-document-editor to 0.2.8
- Updated alistigo-document-format to 0.2.8
- Updated alistigo-domain to 0.2.8
- Updated alistigo-logger to 0.2.8

## 0.2.10 (2026-07-23)

### 🧱 Updated Dependencies

- Updated alistigo-claude-artifact-list-storage to 0.2.7
- Updated alistigo-local-storage-repository to 0.2.7
- Updated alistigo-list-components-react to 0.2.8
- Updated alistigo-artifact-plugin-api to 0.1.2
- Updated alistigo-document-editor to 0.2.7
- Updated alistigo-document-format to 0.2.7
- Updated alistigo-domain to 0.2.7
- Updated alistigo-logger to 0.2.7

## 0.2.9 (2026-07-20)

### 🩹 Fixes

- **artifact-list:** show error message in ArtifactErrorBoundary instead of blank iframe ([fbdbaf9](https://github.com/alistigo/holos/commit/fbdbaf9))

### 🧱 Updated Dependencies

- Updated alistigo-list-components-react to 0.2.7

### ❤️ Thank You

- Mikael Labrut @MLKiiwy

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