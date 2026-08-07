## 0.2.25 (2026-08-07)

### 🚀 Features

- **playground:** add Claude Simulator panel with sub-tabs for all Claude APIs ([dee8b2d](https://github.com/alistigo/holos/commit/dee8b2d))
- **artifact-claude-capabilities-demo:** rename from artifact-storage-explorer and init CCPM epic ([#68](https://github.com/alistigo/holos/issues/68), [#78](https://github.com/alistigo/holos/issues/78), [#69](https://github.com/alistigo/holos/issues/69), [#77](https://github.com/alistigo/holos/issues/77))

### 🩹 Fixes

- **playground:** restore inline onPublishedChange lambda — remove dangling ref ([d5e332d](https://github.com/alistigo/holos/commit/d5e332d))
- **playground:** suppress HostPage cognitive complexity — 16 hooks in orchestrator component ([ecda707](https://github.com/alistigo/holos/commit/ecda707))
- **playground:** extract handlePublishedChange to reduce HostPage cognitive complexity ([66a204b](https://github.com/alistigo/holos/commit/66a204b))
- **playground:** hide Claude Simulator tab outside claude context, default to claude, fix download postMessage ([b72444e](https://github.com/alistigo/holos/commit/b72444e))

### 🧱 Updated Dependencies

- Updated artifact-claude-capabilities-demo to 0.2.0
- Updated list-components-react to 0.2.18
- Updated list-document-format to 0.2.17
- Updated local-storage-plugin to 0.3.2
- Updated claude-artifact-api to 0.2.3
- Updated ai-chat-async-api to 0.2.6
- Updated artifact-manager to 0.2.6
- Updated artifact-list to 0.4.2

### ❤️ Thank You

- Claude Sonnet 4.6
- Mikael Labrut @MLKiiwy

## 0.2.24 (2026-08-07)

### 🚀 Features

- **playground:** add Published checkbox to simulate artifact published mode ([cc9d6bd](https://github.com/alistigo/holos/commit/cc9d6bd))

### 🧱 Updated Dependencies

- Updated artifact-storage-explorer to 0.3.1
- Updated list-components-react to 0.2.17
- Updated list-document-format to 0.2.16
- Updated local-storage-plugin to 0.3.1
- Updated claude-artifact-api to 0.2.2
- Updated ai-chat-async-api to 0.2.5
- Updated artifact-manager to 0.2.5
- Updated artifact-list to 0.4.1

### ❤️ Thank You

- Claude Sonnet 4.6
- Mikael Labrut @MLKiiwy

## 0.2.23 (2026-08-05)

### 🚀 Features

- **playground:** add suppress-responses checkbox to Claude storage simulator ([6e2e124](https://github.com/alistigo/holos/commit/6e2e124))

### 🧱 Updated Dependencies

- Updated artifact-storage-explorer to 0.3.0
- Updated list-components-react to 0.2.16
- Updated list-document-format to 0.2.15
- Updated local-storage-plugin to 0.3.0
- Updated claude-artifact-api to 0.2.1
- Updated ai-chat-async-api to 0.2.4
- Updated artifact-manager to 0.2.4
- Updated artifact-list to 0.4.0

### ❤️ Thank You

- Claude Sonnet 4.6
- Mikael Labrut @MLKiiwy

## 0.2.22 (2026-08-04)

### 🚀 Features

- **storage-explorer:** shared badge, per-key delete, edit mode, delete-all, and Load button ([caa5edb](https://github.com/alistigo/holos/commit/caa5edb))
- **claude-artifact-api:** add canonical types package and wire it into dependents ([843b307](https://github.com/alistigo/holos/commit/843b307))
- **artifact-storage-explorer:** add CRUD, debounced edit, and simulator delay ([b6d2f2f](https://github.com/alistigo/holos/commit/b6d2f2f))

### 🩹 Fixes

- **fallow:** suppress StorageExplorer complexity and apply biome format fixes ([9bce274](https://github.com/alistigo/holos/commit/9bce274))
- **fallow:** suppress processStorageMessage complexity and make window-storage reachable ([cd6f3b3](https://github.com/alistigo/holos/commit/cd6f3b3))
- **storage-explorer:** fix key display, JSON viewer layout, and delete UX ([ab1dba9](https://github.com/alistigo/holos/commit/ab1dba9))
- **storage-explorer:** suppress fallow complexity annotations on legitimate branchy functions ([53ccf85](https://github.com/alistigo/holos/commit/53ccf85))

### 🧱 Updated Dependencies

- Updated artifact-storage-explorer to 0.2.0
- Updated list-components-react to 0.2.15
- Updated list-document-format to 0.2.14
- Updated local-storage-plugin to 0.2.16
- Updated claude-artifact-api to 0.2.0
- Updated ai-chat-async-api to 0.2.3
- Updated artifact-manager to 0.2.3
- Updated artifact-list to 0.3.5

### ❤️ Thank You

- Claude Sonnet 4.6
- Mikael Labrut @MLKiiwy

## 0.2.21 (2026-08-04)

### 🩹 Fixes

- simplify config parsing and allow-list dynamic playground import ([41f513e](https://github.com/alistigo/holos/commit/41f513e))
- artifact selection in playground dev mode ([dedd071](https://github.com/alistigo/holos/commit/dedd071))

### 🧱 Updated Dependencies

- Updated artifact-storage-explorer to 0.1.2
- Updated list-components-react to 0.2.14
- Updated list-document-format to 0.2.13
- Updated local-storage-plugin to 0.2.15
- Updated ai-chat-async-api to 0.2.2
- Updated artifact-manager to 0.2.2
- Updated artifact-list to 0.3.4

### ❤️ Thank You

- Mikael Labrut @MLKiiwy

## 0.2.20 (2026-08-04)

### 🧱 Updated Dependencies

- Updated local-storage-plugin to 0.2.14
- Updated artifact-list to 0.3.3

## 0.2.19 (2026-08-04)

### 🧱 Updated Dependencies

- Updated artifact-list to 0.3.2

## 0.2.18 (2026-07-30)

### 🧱 Updated Dependencies

- Updated list-components-react to 0.2.13
- Updated list-document-format to 0.2.12
- Updated local-storage-plugin to 0.2.13
- Updated ai-chat-async-api to 0.2.1
- Updated artifact-manager to 0.2.1
- Updated artifact-list to 0.3.1

## 0.2.17 (2026-07-30)

### 🩹 Fixes

- **playground:** extract helpers to satisfy complexity thresholds ([cfe0c70](https://github.com/alistigo/holos/commit/cfe0c70))
- **playground:** address lint and complexity issues in CDN script fix ([390d401](https://github.com/alistigo/holos/commit/390d401))
- **playground:** load artifact from CDN in production instead of broken data URI ([7b9f868](https://github.com/alistigo/holos/commit/7b9f868))

### ❤️ Thank You

- Claude Sonnet 4.6
- Mikael Labrut @MLKiiwy

## 0.2.16 (2026-07-29)

### 🚀 Features

- **playground:** add AI API Simulator tab for testing artifact API calls ([#52](https://github.com/alistigo/holos/issues/52))

### 🩹 Fixes

- **playground:** suppress fallow complexity warnings in new AI API components ([79a4d31](https://github.com/alistigo/holos/commit/79a4d31))

### 🧱 Updated Dependencies

- Updated list-components-react to 0.2.12
- Updated list-document-format to 0.2.11
- Updated local-storage-plugin to 0.2.12
- Updated ai-chat-async-api to 0.2.0
- Updated artifact-manager to 0.2.0
- Updated artifact-list to 0.3.0

### ❤️ Thank You

- Claude Sonnet 4.6
- Mikael Labrut @MLKiiwy

## 0.2.15 (2026-07-27)

### 🩹 Fixes

- **playground:** load plugins from local source instead of jsDelivr in dev ([020a1bc](https://github.com/alistigo/holos/commit/020a1bc))

### 🧱 Updated Dependencies

- Updated alistigo-local-storage-plugin to 0.2.11
- Updated alistigo-artifact-list to 0.2.14

### ❤️ Thank You

- Claude Sonnet 5
- Mikael Labrut @MLKiiwy

## 0.2.14 (2026-07-26)

### 🚀 Features

- **playground:** show one storage section based on AI context ([25de63c](https://github.com/alistigo/holos/commit/25de63c))
- **playground:** two-section storage tab with Local and Claude entries (Issue #36) ([#36](https://github.com/alistigo/holos/issues/36))

### 🧱 Updated Dependencies

- Updated alistigo-list-components-react to 0.2.11
- Updated alistigo-local-storage-plugin to 0.2.10
- Updated alistigo-artifact-manager to 0.1.9
- Updated alistigo-document-format to 0.2.10
- Updated alistigo-artifact-list to 0.2.13

### ❤️ Thank You

- Claude Sonnet 4.6
- Mikael Labrut @MLKiiwy

## 0.2.13 (2026-07-24)

### 🚀 Features

- **playground:** replace react-json-view-lite with @uiw/react-json-view ([82ebce4](https://github.com/alistigo/holos/commit/82ebce4))
- **playground:** refactor to tabbed left panel and extend right panel ([1ae8b4a](https://github.com/alistigo/holos/commit/1ae8b4a))

### 🩹 Fixes

- **playground:** suppress fallow complexity on UI components with no test coverage ([83f7eb8](https://github.com/alistigo/holos/commit/83f7eb8))

### 🧱 Updated Dependencies

- Updated alistigo-list-components-react to 0.2.10
- Updated alistigo-artifact-manager to 0.1.8
- Updated alistigo-document-format to 0.2.9
- Updated alistigo-artifact-list to 0.2.12

### ❤️ Thank You

- Claude Sonnet 4.6
- Mikael Labrut @MLKiiwy

## 0.2.12 (2026-07-24)

### 🩹 Fixes

- **playground:** populate event logs in fixtures and add document validator CLI ([176e884](https://github.com/alistigo/holos/commit/176e884))

### 🧱 Updated Dependencies

- Updated alistigo-list-components-react to 0.2.9
- Updated alistigo-artifact-manager to 0.1.7
- Updated alistigo-document-format to 0.2.8
- Updated alistigo-artifact-list to 0.2.11

### ❤️ Thank You

- Claude Sonnet 4.6
- Mikael Labrut @MLKiiwy

## 0.2.11 (2026-07-23)

### 🚀 Features

- **playground,runner:** add "enter JSON" doc field; port runner to use playground UI ([a96b8bf](https://github.com/alistigo/holos/commit/a96b8bf))
- **playground:** add "none" AI context; extract Claude bridge to ai/claude/inject-script.html ([2051af9](https://github.com/alistigo/holos/commit/2051af9))
- **playground:** replace iframe.html+URL-params with srcdoc mechanism ([10cb142](https://github.com/alistigo/holos/commit/10cb142))

### 🩹 Fixes

- **runner,playground:** make all 14 Cucumber scenarios pass with srcdoc mechanism ([46a456a](https://github.com/alistigo/holos/commit/46a456a))
- **playground:** implement Claude storage simulator to unblock artifact rendering ([601cf4e](https://github.com/alistigo/holos/commit/601cf4e))
- **playground:** add explicit URI schemes to SRCDOC_CSP ([9055bc4](https://github.com/alistigo/holos/commit/9055bc4))
- **playground:** inject React Refresh preamble into srcdoc in dev mode ([ac32834](https://github.com/alistigo/holos/commit/ac32834))
- **playground:** patch Vite client to survive bridge console replacement ([a69ed08](https://github.com/alistigo/holos/commit/a69ed08))

### 🧱 Updated Dependencies

- Updated alistigo-list-components-react to 0.2.8
- Updated alistigo-artifact-manager to 0.1.6
- Updated alistigo-document-format to 0.2.7
- Updated alistigo-artifact-list to 0.2.10

### ❤️ Thank You

- Claude Sonnet 4.6
- Mikael Labrut @MLKiiwy

## 0.2.10 (2026-07-20)

### 🚀 Features

- **playground:** move document selector to host form ([ae75ba9](https://github.com/alistigo/holos/commit/ae75ba9))

### 🩹 Fixes

- **playground:** add ^build dependsOn to dev and build targets ([acdcd67](https://github.com/alistigo/holos/commit/acdcd67))
- **artifact-list:** replace form submission with JS handlers; align playground sandbox ([6811e7e](https://github.com/alistigo/holos/commit/6811e7e))
- **playground:** migrate fixtures to current AlistigoDocument format ([e22b8a8](https://github.com/alistigo/holos/commit/e22b8a8))

### 🧱 Updated Dependencies

- Updated alistigo-list-components-react to 0.2.7
- Updated alistigo-artifact-list to 0.2.9

### ❤️ Thank You

- Claude Sonnet 4.6
- Mikael Labrut @MLKiiwy

## 0.2.9 (2026-07-19)

### 🚀 Features

- **alistigo:** plugin-selection checkboxes in artifact playground ([#19](https://github.com/alistigo/holos/issues/19))

### 🧱 Updated Dependencies

- Updated alistigo-list-components-react to 0.2.6
- Updated alistigo-artifact-manager to 0.1.5
- Updated alistigo-document-format to 0.2.6
- Updated alistigo-artifact-list to 0.2.8

### ❤️ Thank You

- Claude Sonnet 5
- Mikael Labrut @MLKiiwy

## 0.2.8 (2026-07-02)

### 🧱 Updated Dependencies

- Updated alistigo-list-components-react to 0.2.5
- Updated alistigo-artifact-manager to 0.1.4
- Updated alistigo-document-format to 0.2.5
- Updated alistigo-artifact-list to 0.2.7

## 0.2.7 (2026-07-02)

### 🧱 Updated Dependencies

- Updated alistigo-list-components-react to 0.2.4
- Updated alistigo-artifact-manager to 0.1.3
- Updated alistigo-document-format to 0.2.4
- Updated alistigo-artifact-list to 0.2.6

## 0.2.6 (2026-06-29)

### 🧱 Updated Dependencies

- Updated alistigo-artifact-manager to 0.1.2

## 0.2.5 (2026-06-28)

### 🧱 Updated Dependencies

- Updated alistigo-list-components-react to 0.2.3
- Updated alistigo-artifact-manager to 0.1.1
- Updated alistigo-document-format to 0.2.3
- Updated alistigo-artifact-list to 0.2.5

## 0.2.4 (2026-06-11)

### 🧱 Updated Dependencies

- Updated alistigo-artifact to 0.2.4

## 0.2.3 (2026-06-11)

### 🩹 Fixes

- correct TypeId prefix from 'list' to 'lst' in default document ([222f6bc](https://github.com/MLKiiwy/europa/commit/222f6bc))

### 🧱 Updated Dependencies

- Updated alistigo-artifact to 0.2.3

### ❤️ Thank You

- Claude Sonnet 4.6
- Mikael Labrut @MLKiiwy

## 0.2.2 (2026-06-11)

### 🧱 Updated Dependencies

- Updated alistigo-list-components-react to 0.2.2
- Updated alistigo-document-format to 0.2.2
- Updated alistigo-artifact to 0.2.2

## 0.2.1 (2026-06-10)

### 🧱 Updated Dependencies

- Updated alistigo-list-components-react to 0.2.1
- Updated alistigo-document-format to 0.2.1
- Updated alistigo-artifact to 0.2.1

## 0.2.0 (2026-06-10)

### 🚀 Features

- **alistigo:** add structured pino logger + two-mode artifact tester ([0bcc512](https://github.com/MLKiiwy/europa/commit/0bcc512))
- **alistigo:** update llms.txt with jsDelivr URL + create Claude embedding skill (Issue #78) ([#78](https://github.com/MLKiiwy/europa/issues/78))
- **alistigo:** GitHub Pages deployment — relative base path + workflow (Issue #76) ([#76](https://github.com/MLKiiwy/europa/issues/76))
- **alistigo:** auto-detect storage backend at boot (window.storage vs localStorage) (Issue #74) ([#74](https://github.com/MLKiiwy/europa/issues/74))
- **alistigo:** extract LocalStorageListRepository as standalone private package (Issue #72) ([#72](https://github.com/MLKiiwy/europa/issues/72))
- **alistigo-ai-m1:** wire DDD layer through React and persistence (#61, #62, #64) ([#61](https://github.com/MLKiiwy/europa/issues/61), [#62](https://github.com/MLKiiwy/europa/issues/62), [#64](https://github.com/MLKiiwy/europa/issues/64))
- **alistigo:** one-command integration tests via Nx parallel ([72fb709](https://github.com/MLKiiwy/europa/commit/72fb709))
- **alistigo:** adopt Lingui v6, ship en + fr per-locale bundles ([4ec2bce](https://github.com/MLKiiwy/europa/commit/4ec2bce))
- **alistigo-list-embedded-app:** scaffold the iframe app (Vite + React) ([9152a66](https://github.com/MLKiiwy/europa/commit/9152a66))

### 🩹 Fixes

- restore @mlabrut/agent-dailylife dep; add missing @alistigo/document-format dep; fix fallow ignoreDependencies ([98f0087](https://github.com/MLKiiwy/europa/commit/98f0087))
- **alistigo-list-embedded-app:** ignore DevFixturePicker in fallow (not yet wired up) ([82490a7](https://github.com/MLKiiwy/europa/commit/82490a7))
- **alistigo-list-embedded-app:** correct DevFixturePicker import; remove spurious main.tsx import ([8fc4fe3](https://github.com/MLKiiwy/europa/commit/8fc4fe3))
- **alistigo-list-embedded-app:** add lingui as devDeps needed by artifact source alias ([247c7bb](https://github.com/MLKiiwy/europa/commit/247c7bb))
- **alistigo-list-embedded-app:** handle missing UMD bundle in vite.config.umd.ts ([607ea20](https://github.com/MLKiiwy/europa/commit/607ea20))
- **alistigo-list-embedded-app:** update stale App.tsx comment in index.html ([caa52cf](https://github.com/MLKiiwy/europa/commit/caa52cf))
- **alistigo:** resolve fallow audit gate failures ([e700eb3](https://github.com/MLKiiwy/europa/commit/e700eb3))
- **alistigo:** correct CSS import path after scope rename ([d68b0e6](https://github.com/MLKiiwy/europa/commit/d68b0e6))
- **alistigo:** update stale JSDoc comment — locale targets live in project.json ([053a8a2](https://github.com/MLKiiwy/europa/commit/053a8a2))
- **alistigo-list-embedded-app:** dev mode is now styled ([b354d01](https://github.com/MLKiiwy/europa/commit/b354d01))

### 🧱 Updated Dependencies

- Updated alistigo-list-components-react to 0.2.0
- Updated alistigo-document-format to 0.2.0
- Updated alistigo-artifact to 0.2.0

### ❤️ Thank You

- Claude Opus 4.7 (1M context)
- Claude Sonnet 4.6
- Mikael Labrut @MLKiiwy