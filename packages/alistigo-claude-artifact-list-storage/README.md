# @alistigo/claude-artifact-list-storage

`ClaudeArtifactListRepository` — `window.storage`-backed implementation of `AlistigoListStore` for use inside Claude artifact runtime only.

Use `isClaudeArtifactContext()` to detect the runtime before instantiating.

## Usage

```ts
import { ClaudeArtifactListRepository, isClaudeArtifactContext } from "@alistigo/claude-artifact-list-storage";

const repo = isClaudeArtifactContext()
  ? new ClaudeArtifactListRepository()
  : fallbackRepo;
```
