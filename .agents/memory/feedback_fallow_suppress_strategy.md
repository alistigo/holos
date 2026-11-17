---
name: feedback-fallow-suppress-strategy
description: How to correctly suppress fallow warnings — config vs inline suppression
metadata: 
  node_type: memory
  type: feedback
  originSessionId: b24b443c-927a-4bc9-995c-8b5b552cd237
---

Use `dynamicallyLoaded` in `.fallowrc.json` instead of scattering inline `// fallow-ignore-next-line unused-class-member` throughout framework-coupled files.

**Why:** When a class's methods are called by a framework (not by TS imports), every method gets its own inline ignore — noisy and easy to forget. Moving the file to `dynamicallyLoaded` tells fallow "this file's members are consumed externally" in one place.

**Concrete patterns to put in `dynamicallyLoaded`:**
- Playwright `World` subclass and Page Object files — methods called from `.steps.ts` (which are already dynamically loaded, so fallow can't trace the call chain)
- Clipanion `Command` subclasses — `static paths`, `static usage`, and `execute()` are read/called by Clipanion's router at runtime

**When inline `// fallow-ignore-next-line complexity` IS the right tool:**
- Per-function CRAP score violations (function is complex AND has no test path — fallow estimates 0% coverage)
- Genuine complexity that can't be reduced (large switch dispatchers, multi-step protocol handlers)
- The ignore sits right next to the function that actually has the problem — keeps the context local

**CRITICAL — fallow suppress comment format:**
Fallow parses EVERY whitespace-separated word after `fallow-ignore-next-line` as a separate issue kind token. Unknown tokens → stale suppression errors. Use only the bare kind name, nothing after it:
```ts
// Plain explanation comment goes here (ignored by fallow)
// fallow-ignore-next-line complexity
async function handleSend() {
```
NEVER: `// fallow-ignore-next-line complexity — description text` — the `—`, `description`, and `text` become unrecognized kind tokens and cause 3 stale suppression errors in `qa:dead-code`.

**When `ignoreDependencies` is the right tool:**
A `workspace:*` dep that is resolved at *runtime* (by name, from `process.cwd()`) and never `import`ed from source reads as an unused devDependency to fallow. That is not a false positive to argue with — add the package name to `ignoreDependencies` in `.fallowrc.json`. Example: `@alistigo/list-features` in `packages/artifact-list` exists only so the features runner can resolve it from the consumer's cwd.

**How to apply:** Before adding an inline ignore for `unused-class-member`, check if the file contains a framework-coupled class. If yes, add the file to `dynamicallyLoaded` in `.fallowrc.json` and remove all the per-method ignores.
