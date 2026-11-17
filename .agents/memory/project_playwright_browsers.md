---
name: project_playwright_browsers
description: On this machine Playwright browsers come from a read-only nix path; the repo .env overrides it and the nix chromium is the no-sudo escape hatch.
metadata:
  type: project
---

This machine (thinkpad, Ubuntu 26.04) exports `PLAYWRIGHT_BROWSERS_PATH` from
home-manager, pointing at a **read-only** `/nix/store/…-playwright-browsers` that carries
a different chromium revision than the repo's playwright. Three consequences, all fixed
in the repo as of 2026-11-17:

- `playwright install` used to hang silently (it blocks on the registry lock in a
  read-only directory). `pnpm playwright:install` now goes through
  `scripts/playwright-install.sh`, which forces a writable path first.
- The repo-root `.env` (git-ignored, see `.env.example`) sets
  `PLAYWRIGHT_BROWSERS_PATH=/home/mikael/.cache/ms-playwright`. **Nx's own dotenv
  loading cannot do this** — `nx/src/tasks-runner/task-env.js` loads with
  `override: false`, so it never replaces an inherited variable. The runner CLI applies
  those keys itself, in `cli/artifact-features-runner-playwright/src/lib/browsers.ts`.
- The downloaded browsers still need apt packages this host lacks
  (`libasound2t64`, plus `libcairo2 libcups2t64 libpango-1.0-0` for `HEADED=1`).
  **Until that `sudo apt-get install` is run**, `.env` sets
  `ARTIFACT_FEATURES_CHROMIUM_EXECUTABLE` to the nix `chrome-headless-shell`, which runs
  natively — no sudo, no download, with a browser-version-skew warning from the doctor.
  Comment that line out after installing the libs for exact CI parity.

**Why:** the diagnosis is invisible from the error message ("Executable doesn't exist"),
and `PLAYWRIGHT_SKIP_VALIDATE_HOST_REQUIREMENTS=true` (also from nix) suppresses
Playwright's own missing-library warning.

**How to apply:** start from `nx run artifact-list:test:e2e-doctor` — its Browsers path /
Browser revision / Chromium executable / Host requirements checks name the cause and the
exact fix. Related: [[feedback_workspace_bin_invocation]].
