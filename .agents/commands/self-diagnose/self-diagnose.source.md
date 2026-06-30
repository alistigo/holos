# self-diagnose — Source & Changelog

## Origin

Created 2026-05-29 during the `chore/repo-exec-improvements` branch.

**Motivation:** During the alistigo-ai-m1 session, Claude repeatedly failed on missing PATH entries (pnpm/node/bun not found) with no quick way to self-diagnose the issue. This command gives Claude a structured runbook to verify the full toolchain before starting work on any task.

## Changelog

| Date | Change |
|---|---|
| 2026-05-29 | Initial version — setup + 5 checks + summary + fix table |
| 2026-06-01 | Reduced scope — removed build/test/settings-PATH checks; kept setup + env + deps + nx only. Renamed command to `self-diagnose`. |
