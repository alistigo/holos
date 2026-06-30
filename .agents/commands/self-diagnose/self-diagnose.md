# Claude Command: Self-Diagnose

Self-diagnose Claude's ability to operate in this repo. Runs setup, then checks that required tools are on PATH, dependencies are installed, and Nx resolves. Prints a result table and a fix list for any failures.

## Usage

```
/self-diagnose
```

## What This Command Does

Each step requires the previous one to succeed. If any step fails, stop and print the summary with the failure marked.

### Step 0 — Run repo setup (always first)

```bash
bash scripts/setup.sh
```

`setup.sh` installs mise tool versions, wires mise activation into shell profiles, runs `mise exec -- pnpm install`, initialises git submodules, and creates the Claude memory symlink. This step must succeed before any other check is meaningful.

If `mise` is not found, `setup.sh` installs it automatically and asks you to restart your shell, then re-run.

### Check 1 — Environment: required tools on PATH

```bash
node --version
bun --version
pnpm --version
```

All three must print a version string without error.

### Check 2 — Install dependencies

```bash
pnpm install
```

Must complete without errors. Confirms `node_modules` is populated.

### Check 3 — Nx

```bash
pnpm nx --version
```

Must complete without errors. Confirms Nx is properly installed and resolves via the local install.

---

## Summary Table

After all checks, print:

| Check | Command | Result |
|---|---|---|
| Setup | `bash scripts/setup.sh` | ✅ / ❌ / (skipped) |
| Environment | `node / bun / pnpm` | ✅ / ❌ / (skipped) |
| Dependencies | `pnpm install` | ✅ / ❌ / (skipped) |
| Nx | `pnpm nx --version` | ✅ / ❌ / (skipped) |

---

## Fix Table

If any check fails, print only the relevant rows:

| Failure | Fix |
|---|---|
| `mise` not found | `setup.sh` auto-installs it — restart shell and re-run `bash scripts/setup.sh` |
| `pnpm` / `node` / `bun` not found | Mise install has failed — fix mise setup first |
| `pnpm nx` not found | Run `pnpm install` first to populate `node_modules`; check `node_modules/.bin/nx` exists |
| `pnpm install` fails | Check network / npm registry; try `pnpm store prune` then retry |
