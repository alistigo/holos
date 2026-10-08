# @alistigo/nx-npm-publications

[![npm version](https://img.shields.io/npm/v/@alistigo/nx-npm-publications.svg?style=flat)](https://www.npmjs.com/package/@alistigo/nx-npm-publications)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue?logo=typescript)](https://www.typescriptlang.org/)
[![CI](https://github.com/alistigo/holos/actions/workflows/ci.yml/badge.svg)](https://github.com/alistigo/holos/actions/workflows/ci.yml)

CLI to manage the npm packages you publish from an [Nx](https://nx.dev) monorepo. It compares
what is on npm under your scope with the projects in your workspace, finds packages you no longer
maintain, and helps you deprecate them.

> [!IMPORTANT]
> **Nx is required.** The tool reads your packages from the Nx project graph, so it must run from
> inside an Nx workspace (a directory with an `nx.json`, or below one). Outside an Nx workspace
> every command that looks at local packages stops with an error.

## How it works

- **npm side:** lists every package published under your scope (for example `@myorg`) with its
  latest version, using the public npm registry.
- **Workspace side:** finds the Nx workspace root, asks Nx for the project graph, and reads each
  project's `package.json`. Any folder layout Nx knows about is covered.
- **Stale packages** are packages that exist on npm under your scope but are no longer a
  publishable project in your workspace (missing, or now `"private": true`). These are the
  candidates for deprecation.

## Requirements

- An **Nx workspace**, Nx 21 to 23 (declared as a peer dependency).
- **Node.js ≥ 18** and the **npm CLI** on `PATH`.
- An npm **scope** you publish under, such as `@myorg`.
- For `deprecate` only: an npm login with **write access** to the packages. Run
  [`doctor`](#doctor) to check this. See [npm authentication](#npm-authentication).

## Install

Install it as a dev dependency of your Nx workspace, so it uses your workspace's Nx:

```sh
npm install -D @alistigo/nx-npm-publications
# or
pnpm add -D @alistigo/nx-npm-publications
# or
yarn add -D @alistigo/nx-npm-publications
```

Then run it from anywhere inside the workspace:

```sh
npx nx-npm-publications help
```

## Quick start

```sh
npx nx-npm-publications doctor    --scope @myorg   # check npm login and access rights
npx nx-npm-publications list      --scope @myorg   # compare npm with the workspace
npx nx-npm-publications check     --scope @myorg   # find stale packages
npx nx-npm-publications deprecate --scope @myorg   # pick and deprecate stale packages
```

## Commands

`--scope` is required on every command that queries npm. Run
`nx-npm-publications help <command>` for the full help of any command.

### `list`

Lists packages side by side: their latest version on npm, their version in the workspace, and
whether the workspace package is public.

```sh
nx-npm-publications list --scope @myorg
```

```
  package                 npm    local  public
  ----------------------  -----  -----  ------
  @myorg/core             1.4.0  1.4.0  ✓
  @myorg/legacy-utils     0.9.2  —
  @myorg/docs-site        —      0.0.1
```

`—` means the package is missing on that side. The `public` column is blank for private
packages and for packages that only exist on npm.

**Options**

| Flag | Default | Description |
|------|---------|-------------|
| `--scope <scope>` | | npm scope, e.g. `@myorg`. Optional with `--source local`, where omitting it lists every package in the workspace. |
| `--source <source>` | `all` | `all` (npm and workspace), `remote` (npm only) or `local` (workspace only) |
| `--private` / `--no-private` | `--private` | Include or hide private workspace packages |

### `check` (default)

Lists the stale packages: on npm, but no longer a publishable project in the workspace.

```sh
nx-npm-publications check --scope @myorg
nx-npm-publications check --scope @myorg --fail-on-stale   # in CI
```

**Options**

| Flag | Description |
|------|-------------|
| `--scope <scope>` | npm scope, e.g. `@myorg` (required) |
| `--fail-on-stale` | Exit 1 when stale packages are found. Without it, `check` always exits 0. |

### `deprecate`

Runs in three steps:

1. Lists the stale packages, like `check`.
2. Lets you pick which ones to deprecate: ↑/↓ to move, space to toggle, `a` to toggle all,
   enter to continue, then `y` to confirm (`n` goes back, `q` cancels).
3. Runs `npm deprecate "<package>@*" "<message>"` on the packages you picked.

```sh
nx-npm-publications deprecate --scope @myorg --dry-run   # pick, then print the commands only
nx-npm-publications deprecate --scope @myorg             # pick, then deprecate
nx-npm-publications deprecate --scope @myorg --all       # no prompt: every stale package
```

**Options**

| Flag | Description |
|------|-------------|
| `--scope <scope>` | npm scope, e.g. `@myorg` (required) |
| `--message,-m <text>` | Deprecation message. Default: points users to the scope on npm. |
| `--all` | Skip the selection and take every stale package. Required when there is no interactive terminal (CI). |
| `--dry-run` | Print the `npm deprecate` commands instead of running them |

Deprecation is reversible: `npm deprecate "<package>@*" ""` removes the message.

### `doctor`

Checks everything `deprecate` needs and explains how to fix what is missing:

```sh
nx-npm-publications doctor --scope @myorg
```

```
  ✓ Nx workspace: /path/to/your/workspace
  ✓ npm CLI: npm 11.13.0
  ✓ Registry: https://registry.npmjs.org/
  ✗ Authentication: a token is configured but npm rejects it (401).
      The token is invalid, revoked or expired ...
  - Write access: needs authentication
  - Two-factor auth: needs authentication
```

| Check | What it verifies |
|-------|------------------|
| Nx workspace | An `nx.json` is found from the current directory |
| npm CLI | `npm` is installed |
| Registry | npm points at `https://registry.npmjs.org/` |
| Authentication | `npm whoami` succeeds. A missing login and a rejected token are reported differently. |
| Write access | Your npm user is listed with write access on every stale package (npm's public collaborators list). Your token must also allow writes: Read and write on the scope. |
| Two-factor auth | Whether npm will ask for a one-time code on each deprecation |

### `help`

```sh
nx-npm-publications help          # what the tool does, the workflow and all commands
nx-npm-publications help list     # detailed help for one command
nx-npm-publications --version
```

## npm authentication

`deprecate` changes packages on npm, so npm must know who you are, and that account must have
write access to the packages.

**On your machine**, the simplest option is:

```sh
npm login
```

**With a token** (CI or scripts), create a granular access token on npmjs.com
(Access Tokens → Generate New Token → Granular access token) with:

| Setting | Value |
|---------|-------|
| Packages and scopes | **Read and write** on your scope, or on the packages to deprecate |
| Organizations | Not needed |
| Bypass two-factor authentication | Only if your account requires 2FA for writes and nobody will type a one-time code |

npm does not read a token from an environment variable on its own. It reads it from an `.npmrc`
line, which can refer to a variable:

```sh
export NPM_TOKEN=npm_xxx
echo '//registry.npmjs.org/:_authToken=${NPM_TOKEN}' >> ~/.npmrc
```

Then run `nx-npm-publications doctor --scope @myorg` to confirm.

> [!NOTE]
> npm's trusted publishing (GitHub OIDC) only covers `npm publish`, not `npm deprecate`, so a CI
> job that deprecates packages needs a token. npm is also restricting tokens that bypass 2FA, see
> [npm's notice](https://gh.io/npm-gat-bypass2fa-deprecation).

## Exit codes

| Command | 0 | 1 |
|---------|---|---|
| `list` | Success | Invalid options, or not in an Nx workspace |
| `check` | Success, stale packages or not | Stale packages found with `--fail-on-stale`, or not in an Nx workspace |
| `deprecate` | Done, nothing to do, or cancelled | A deprecation failed, or no terminal and no `--all` |
| `doctor` | No failed check (warnings allowed) | At least one check failed |

## Limitations

- The scope is read from npm's organisation package list. For a personal scope (`@username`),
  only packages named `@username/...` are taken into account.
- Only the public npm registry is supported.

## Build

```sh
nx run nx-npm-publications:build
```
