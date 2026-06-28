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