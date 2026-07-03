---
name: feedback_vendor_symlink_gap
description: The repo's documented "submodule + symlink" vendoring pattern isn't actually wired up for caveman/superpowers/ccpm — check disk state before trusting the docs
metadata:
  type: feedback
  originSessionId: aa68ed7f-0d6a-4d13-948b-eb196066e9a2
---

`CLAUDE.md` and `.agents/skills/REGISTRY.md` describe caveman/superpowers/ccpm as git
submodules in `vendor/`, symlinked into `.agents/skills/`. On inspection (2026-07-03),
none of that is actually true on disk: `.gitmodules` declares the three submodules, but
`vendor/` doesn't exist in the checkout, and `.agents/skills/caveman` (etc.) are plain
copied files (`file` reports "directory", not "symbolic link").

**Why:** Found while vendoring `sergebulaev/linkedin-skills` for LinkedIn post drafting
— the user asked to "follow the documented pattern," which turned out not to match
reality for the existing three tools. Rather than silently mimicking the broken
pattern, flagged it and did `linkedin-skills` properly: a real `git submodule add
vendor/linkedin-skills` plus real `ln -s` symlinks per skill folder — see
[[project_communication_linkedin_skills]].

**How to apply:** Don't trust CLAUDE.md/REGISTRY.md's "symlink" label at face value for
caveman/superpowers/ccpm — verify with `ls -la` / `file` before assuming an update via
`git submodule update --remote` will actually propagate into `.agents/skills/`. Fixing
the pre-existing three is out of scope unless the user asks for it directly.
