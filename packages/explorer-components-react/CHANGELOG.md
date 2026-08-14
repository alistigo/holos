## 0.3.0 (2026-08-14)

### 🚀 Features

- **explorer:** DocumentViewer rename, KeyContentViewer with View/Raw tabs, specific file type badges ([0b13fee](https://github.com/alistigo/holos/commit/0b13fee))
- **explorer:** show Format button in edit mode, not only on new entry ([828fb42](https://github.com/alistigo/holos/commit/828fb42))
- **explorer-components-react:** add experimental binary storage format selector ([7f3a090](https://github.com/alistigo/holos/commit/7f3a090))
- **explorer-components-react:** wrap JSON/YAML docs in metadata envelope on create ([187a400](https://github.com/alistigo/holos/commit/187a400))
- **explorer:** enforce 5 MiB/key and 17 MiB total storage limits ([4bae4df](https://github.com/alistigo/holos/commit/4bae4df))
- **explorer-components:** unified New Entry panel with File/Text document tabs ([35a905b](https://github.com/alistigo/holos/commit/35a905b))
- **storage:** add StorageUsageBar, per-key size validation, and Storybook stories ([#93](https://github.com/alistigo/holos/issues/93), [#94](https://github.com/alistigo/holos/issues/94), [#95](https://github.com/alistigo/holos/issues/95))
- **storage:** add file upload, FileViewer, and file-type badges to storage explorer ([#87](https://github.com/alistigo/holos/issues/87), [#88](https://github.com/alistigo/holos/issues/88), [#89](https://github.com/alistigo/holos/issues/89), [#90](https://github.com/alistigo/holos/issues/90), [#91](https://github.com/alistigo/holos/issues/91))

### 🩹 Fixes

- tab order ([9714f89](https://github.com/alistigo/holos/commit/9714f89))
- **explorer:** suppress fallow complexity on handleFormat in JsonDocumentViewer ([a75e829](https://github.com/alistigo/holos/commit/a75e829))
- **explorer:** disable Format button for plain text and YAML (JSON only) ([c34743c](https://github.com/alistigo/holos/commit/c34743c))
- **explorer:** add fallow complexity suppressions for FileUploadForm and demo wrapper ([d1ef27f](https://github.com/alistigo/holos/commit/d1ef27f))
- **storage:** resolve pre-push hook failures from binary format selector ([8c4c8b8](https://github.com/alistigo/holos/commit/8c4c8b8))
- **explorer-components-react:** use Storybook 10 import conventions in stories ([8982657](https://github.com/alistigo/holos/commit/8982657))
- **explorer-components-react:** add textFormat to handleSaveText deps ([c097da4](https://github.com/alistigo/holos/commit/c097da4))
- **storage:** resolve circular dep and suppress fallow complexity findings ([d6bd911](https://github.com/alistigo/holos/commit/d6bd911))

### 🧱 Updated Dependencies

- Updated claude-artifact-api to 0.2.4

### ❤️ Thank You

- Claude Sonnet 4.6
- Mikael Labrut @MLKiiwy

## 0.2.3 (2026-08-07)

### 🧱 Updated Dependencies

- Updated claude-artifact-api to 0.2.3

## 0.2.2 (2026-08-07)

### 🧱 Updated Dependencies

- Updated claude-artifact-api to 0.2.2

## 0.2.1 (2026-08-05)

### 🧱 Updated Dependencies

- Updated claude-artifact-api to 0.2.1

## 0.2.0 (2026-08-04)

### 🚀 Features

- **explorer-components-react:** unify storage key list with shared badge and checkbox ([52d4e23](https://github.com/alistigo/holos/commit/52d4e23))
- **storage-explorer:** shared badge, per-key delete, edit mode, delete-all, and Load button ([caa5edb](https://github.com/alistigo/holos/commit/caa5edb))
- **claude-artifact-api:** add canonical types package and wire it into dependents ([843b307](https://github.com/alistigo/holos/commit/843b307))
- **artifact-storage-explorer:** add CRUD, debounced edit, and simulator delay ([b6d2f2f](https://github.com/alistigo/holos/commit/b6d2f2f))

### 🩹 Fixes

- **fallow:** suppress fetchEntry complexity in StorageExplorerApp ([7602320](https://github.com/alistigo/holos/commit/7602320))
- **storage-explorer:** fix key display, JSON viewer layout, and delete UX ([ab1dba9](https://github.com/alistigo/holos/commit/ab1dba9))
- **storage-explorer:** add role=img to status badge spans for a11y ([610c724](https://github.com/alistigo/holos/commit/610c724))
- **storage-explorer:** suppress fallow complexity annotations on legitimate branchy functions ([53ccf85](https://github.com/alistigo/holos/commit/53ccf85))

### 🧱 Updated Dependencies

- Updated claude-artifact-api to 0.2.0

### ❤️ Thank You

- Claude Sonnet 4.6
- Mikael Labrut @MLKiiwy



## 0.1.1 (2026-07-30)

### 🚀 Features

- **claude-storage-explorer:** add storage explorer artifact and component library ([a0ba41a](https://github.com/alistigo/holos/commit/a0ba41a))

### 🩹 Fixes

- **explorer-components-react:** extract helpers to satisfy complexity thresholds ([7fcfe82](https://github.com/alistigo/holos/commit/7fcfe82))

### ❤️ Thank You

- Claude Sonnet 4.6
- Mikael Labrut @MLKiiwy