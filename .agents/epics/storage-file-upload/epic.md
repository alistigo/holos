---
name: storage-file-upload
status: in-progress
created: 2026-08-13T00:00:00Z
updated: 2026-08-13T00:00:00Z
progress: 0%
parent-epic: .agents/epics/artifact-claude-capabilities-demo/epic.md
github: https://github.com/alistigo/holos/issues/68
---

# Epic: Storage File Upload

## Overview

Add file upload capability to the Storage tab of `artifact-claude-capabilities-demo`. Files of any type are stored in `window.storage` as a base64-encoded JSON envelope (`_type: "file"`) alongside metadata (name, MIME type, size, upload date). A new viewer renders images inline and provides a download button for all file types.

**Parent epic**: artifact-claude-capabilities-demo (#68)

## Architecture Decisions

**No plugin API changes** — files are stored as a JSON envelope `{ _type: "file", name, mimeType, size, uploadedAt, data }` where `data` is the `FileReader.readAsDataURL()` result. The existing `KeyValueStore.set(key, value)` path handles this as-is.

**Detection** — `typeof value === "object" && value !== null && "_type" in value && value._type === "file"` distinguishes file entries from regular JSON entries.

**Data URI as storage format** — `readAsDataURL()` produces `data:<mime>;base64,<data>` which works directly as `<img src>` or `<a href>` for download. No extra encoding/decoding step.

**FileUploadForm is a standalone component** — no form submit, purely controlled via `onChange` on the file input.

## Tasks

- [ ] T001 — Create `FileUploadForm.tsx` (#87)
- [ ] T002 — Create `FileViewer.tsx` (#88)
- [ ] T003 — Update `StorageSection.tsx` — upload trigger + file routing (#89)
- [ ] T004 — Update `KeyList.tsx` — file-type badge (#90)
- [ ] T005 — Export new types/components in barrel (`index.ts`) (#91)
