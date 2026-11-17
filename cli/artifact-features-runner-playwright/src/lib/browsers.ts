import { execFileSync } from "node:child_process";
import { accessSync, constants, existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";

/** Where Playwright looks for its downloaded browsers. */
export const BROWSERS_PATH_ENV = "PLAYWRIGHT_BROWSERS_PATH";
/** Opt out of the bundled download and drive a chromium that already works on this host. */
export const CHROMIUM_EXECUTABLE_ENV = "ARTIFACT_FEATURES_CHROMIUM_EXECUTABLE";
/** Set by some environments (nix, containers); suppresses Playwright's own missing-library report. */
export const SKIP_HOST_REQUIREMENTS_ENV = "PLAYWRIGHT_SKIP_VALIDATE_HOST_REQUIREMENTS";

/**
 * The only keys a repo-root `.env` may set through this runner. Everything else in that
 * file is left to whoever else reads it — we never source it as a shell script.
 */
const OWNED_ENV_KEYS = [BROWSERS_PATH_ENV, CHROMIUM_EXECUTABLE_ENV] as const;

/** Chromium builds `chromium.launch()` can pick, headless shell first (the headless default). */
const CHROMIUM_BUILDS = ["chromium-headless-shell", "chromium"] as const;

const REVISION_DIR = /^chromium(_headless_shell)?-\d+$/;
const QUOTES = ['"', "'"];

export interface BrowserBuild {
  /** Name as it appears in playwright-core's browsers.json. */
  name: string;
  revision: string;
  /** Directory name Playwright installs it under (underscores, not dashes). */
  dir: string;
  browserVersion: string | undefined;
}

export type BrowsersPathSource = "dotenv" | "env" | "default";

export interface BrowsersPathResolution {
  /** The path that was applied to the environment. */
  path: string;
  source: BrowsersPathSource;
  writable: boolean;
  required: BrowserBuild[];
  presentDirs: string[];
  missingDirs: string[];
  /** A candidate that was declined, with the reason, so the doctor can name it. */
  rejected: { path: string; reason: string } | undefined;
  /** `PLAYWRIGHT_BROWSERS_PATH=0` keeps browsers inside node_modules; left untouched. */
  nodeModulesMode: boolean;
}

export interface DotEnvOutcome {
  /** The `.env` that was read, if any. */
  file: string | undefined;
  /** Keys this runner took from it, overriding the inherited environment. */
  applied: string[];
}

interface BrowsersJsonEntry {
  name?: unknown;
  revision?: unknown;
  browserVersion?: unknown;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/** An environment variable's value, treating an empty string as unset. */
function envValue(name: string): string | undefined {
  const raw = process.env[name];
  return raw === undefined || raw === "" ? undefined : raw;
}

function readJsonFile(file: string): unknown {
  if (!existsSync(file)) return undefined;
  try {
    return JSON.parse(readFileSync(file, "utf8")) as unknown;
  } catch {
    // A malformed file is treated as absent — callers degrade to a skipped check.
    return undefined;
  }
}

/** Nearest directory at or above `startDir` that `matches`. */
function findAncestor(startDir: string, matches: (dir: string) => boolean): string | undefined {
  let dir = startDir;
  for (;;) {
    if (matches(dir)) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) return undefined;
    dir = parent;
  }
}

/** Nearest ancestor directory holding `pnpm-workspace.yaml`. */
function findWorkspaceRoot(startDir: string): string | undefined {
  return findAncestor(path.resolve(startDir), (dir) =>
    existsSync(path.join(dir, "pnpm-workspace.yaml")),
  );
}

function stripQuotes(raw: string): string {
  const first = raw.slice(0, 1);
  if (raw.length < 2 || !QUOTES.includes(first)) return raw;
  return raw.endsWith(first) ? raw.slice(1, -1) : raw;
}

function parseDotEnvLine(line: string): [string, string] | undefined {
  const trimmed = line.trim();
  if (trimmed === "" || trimmed.startsWith("#")) return undefined;
  const separator = trimmed.indexOf("=");
  if (separator <= 0) return undefined;
  const key = trimmed
    .slice(0, separator)
    .trim()
    .replace(/^export\s+/, "");
  return [key, stripQuotes(trimmed.slice(separator + 1).trim())];
}

/**
 * Minimal `KEY=VALUE` reader: no interpolation, no command substitution, nothing is
 * executed. Only the keys this runner owns are ever looked up in the result.
 */
function parseDotEnv(contents: string): Map<string, string> {
  const values = new Map<string, string>();
  for (const line of contents.split(/\r?\n/)) {
    const entry = parseDotEnvLine(line);
    if (entry !== undefined) values.set(entry[0], entry[1]);
  }
  return values;
}

function applyOwnedKeys(values: Map<string, string>): string[] {
  const applied: string[] = [];
  for (const key of OWNED_ENV_KEYS) {
    const value = values.get(key);
    if (value === undefined || value === "") continue;
    process.env[key] = value;
    applied.push(key);
  }
  return applied;
}

/**
 * Applies this runner's keys from the repo-root `.env`, overriding what the shell
 * exported. Deliberate: an inherited value is machine-global (a nix profile, say), while
 * `.env` is repo-scoped — and Nx's own dotenv load runs with `override: false`, so it
 * could never replace an inherited value.
 */
function loadRepoDotEnv(startDir: string): DotEnvOutcome {
  const root = findWorkspaceRoot(startDir);
  const file = root === undefined ? undefined : path.join(root, ".env");
  if (file === undefined || !existsSync(file)) return { file: undefined, applied: [] };
  return { file, applied: applyOwnedKeys(parseDotEnv(readFileSync(file, "utf8"))) };
}

function resolvePlaywrightCoreEntry(): string | undefined {
  const require = createRequire(import.meta.url);
  // playwright-core is a transitive dependency: pnpm does not link it next to this
  // package, so resolving it directly walks out of the workspace and can land on an
  // unrelated copy with a different browser revision. Go through `playwright` — a direct
  // dependency, and the very module that will launch the browser.
  try {
    return createRequire(require.resolve("playwright")).resolve("playwright-core");
  } catch {
    return undefined;
  }
}

function isPlaywrightCoreDir(dir: string): boolean {
  const parsed = readJsonFile(path.join(dir, "package.json"));
  return isRecord(parsed) && parsed["name"] === "playwright-core";
}

function playwrightCoreRoot(): string | undefined {
  const entry = resolvePlaywrightCoreEntry();
  return entry === undefined ? undefined : findAncestor(path.dirname(entry), isPlaywrightCoreDir);
}

function browsersJsonEntries(): BrowsersJsonEntry[] {
  const root = playwrightCoreRoot();
  if (root === undefined) return [];
  const parsed = readJsonFile(path.join(root, "browsers.json"));
  const browsers = isRecord(parsed) ? parsed["browsers"] : undefined;
  return Array.isArray(browsers) ? (browsers as BrowsersJsonEntry[]) : [];
}

function toBrowserBuild(
  name: string,
  entry: BrowsersJsonEntry | undefined,
): BrowserBuild | undefined {
  if (entry === undefined || typeof entry.revision !== "string") return undefined;
  return {
    name,
    revision: entry.revision,
    dir: `${name.replaceAll("-", "_")}-${entry.revision}`,
    browserVersion: typeof entry.browserVersion === "string" ? entry.browserVersion : undefined,
  };
}

/**
 * Chromium builds the *installed* playwright expects, read from its own browsers.json.
 * Never hardcoded: it has to track whatever version is in node_modules.
 */
function requiredChromiumBuilds(): BrowserBuild[] {
  const entries = browsersJsonEntries();
  return CHROMIUM_BUILDS.map((name) =>
    toBrowserBuild(
      name,
      entries.find((candidate) => candidate.name === name),
    ),
  ).filter((build): build is BrowserBuild => build !== undefined);
}

/** Chrome version the installed playwright bundles, for skew warnings. */
export function bundledChromiumVersion(builds: BrowserBuild[]): string | undefined {
  return builds.find((build) => build.browserVersion !== undefined)?.browserVersion;
}

const CACHE_ROOTS: Record<string, () => string> = {
  darwin: () => path.join(os.homedir(), "Library", "Caches"),
  win32: () => envValue("LOCALAPPDATA") ?? path.join(os.homedir(), "AppData", "Local"),
};

/** Playwright's own default cache location, per platform. */
function defaultBrowsersPath(): string {
  const platformRoot = CACHE_ROOTS[process.platform];
  const base =
    platformRoot === undefined
      ? (envValue("XDG_CACHE_HOME") ?? path.join(os.homedir(), ".cache"))
      : platformRoot();
  return path.join(base, "ms-playwright");
}

function isWritableDir(dir: string): boolean {
  try {
    accessSync(dir, constants.W_OK | constants.X_OK);
    return statSync(dir).isDirectory();
  } catch {
    return false;
  }
}

function presentChromiumDirs(dir: string): string[] {
  try {
    return readdirSync(dir)
      .filter((entry) => REVISION_DIR.test(entry))
      .sort();
  } catch {
    return [];
  }
}

function describe(
  candidate: string,
  source: BrowsersPathSource,
  required: BrowserBuild[],
  rejected: { path: string; reason: string } | undefined,
): BrowsersPathResolution {
  const presentDirs = presentChromiumDirs(candidate);
  return {
    path: candidate,
    source,
    writable: isWritableDir(candidate),
    required,
    presentDirs,
    missingDirs: required.filter((build) => !presentDirs.includes(build.dir)).map((b) => b.dir),
    rejected,
    nodeModulesMode: false,
  };
}

/**
 * Whether the default cache should take over from a configured path: always when that
 * path cannot be written to, and when it lacks the required revision while the default
 * has it. A writable path that merely needs a download should be downloaded into.
 */
function shouldDeferToDefault(
  resolution: BrowsersPathResolution,
  fallback: string,
  required: BrowserBuild[],
): boolean {
  if (!resolution.writable) return true;
  if (resolution.missingDirs.length === 0) return false;
  const fallbackDirs = presentChromiumDirs(fallback);
  return required.every((build) => fallbackDirs.includes(build.dir));
}

/**
 * Picks a browsers path that can actually serve this playwright version, declining a
 * read-only or wrong-revision candidate. That is the nix/home-manager case: a read-only
 * /nix/store path pinned to an older revision, which otherwise surfaces only as
 * "Executable doesn't exist".
 */
function nodeModulesResolution(
  required: BrowserBuild[],
  source: BrowsersPathSource,
): BrowsersPathResolution {
  return {
    path: "0",
    source,
    writable: true,
    required,
    presentDirs: [],
    missingDirs: [],
    rejected: undefined,
    nodeModulesMode: true,
  };
}

function resolveConfigured(
  candidate: string,
  source: BrowsersPathSource,
  required: BrowserBuild[],
): BrowsersPathResolution {
  const fallback = defaultBrowsersPath();
  const resolution = describe(candidate, source, required, undefined);
  if (candidate === fallback || !shouldDeferToDefault(resolution, fallback, required)) {
    return resolution;
  }
  const reason = resolution.writable
    ? `missing ${resolution.missingDirs.join(", ")}`
    : "not writable";
  return describe(fallback, "default", required, { path: candidate, reason });
}

function resolveBrowsersPath(options: { fromDotEnv: boolean }): BrowsersPathResolution {
  const required = requiredChromiumBuilds();
  const raw = envValue(BROWSERS_PATH_ENV);
  const source: BrowsersPathSource = options.fromDotEnv ? "dotenv" : "env";
  if (raw === "0") return nodeModulesResolution(required, source);
  if (raw === undefined) {
    return describe(defaultBrowsersPath(), "default", required, undefined);
  }
  return resolveConfigured(path.resolve(raw), source, required);
}

export interface ChromiumExecutable {
  path: string;
  source: "flag" | "env";
}

/** The `--chromium-executable` flag, else whatever `.env`/the shell provided. */
export function resolveChromiumExecutable(
  flag: string | undefined,
): ChromiumExecutable | undefined {
  if (flag !== undefined && flag !== "") return { path: path.resolve(flag), source: "flag" };
  const fromEnv = envValue(CHROMIUM_EXECUTABLE_ENV);
  return fromEnv === undefined ? undefined : { path: path.resolve(fromEnv), source: "env" };
}

/** Returns a problem description, or undefined when the file can be launched. */
export function validateChromiumExecutable(file: string): string | undefined {
  if (!existsSync(file)) return `no such file: ${file}`;
  try {
    accessSync(file, constants.X_OK);
  } catch {
    return `not executable: ${file}`;
  }
  return statSync(file).isFile() ? undefined : `not a file: ${file}`;
}

/** `<executable> --version`, for the doctor's skew check. Never throws. */
export function chromiumExecutableVersion(file: string): string | undefined {
  try {
    return execFileSync(file, ["--version"], {
      encoding: "utf8",
      timeout: 10_000,
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return undefined;
  }
}

/** Leading major version number of a browser version string. */
export function majorVersion(version: string | undefined): string | undefined {
  return version === undefined ? undefined : /(\d+)\./.exec(version)?.[1];
}

export interface BrowsersInit {
  dotEnv: DotEnvOutcome;
  browsers: BrowsersPathResolution;
}

let initialized: BrowsersInit | undefined;

/**
 * Reads the repo `.env`, picks a browsers path and applies it to the environment. Called
 * once from the CLI entrypoint so everything downstream — including the in-process
 * Cucumber run and its `chromium.launch()` — inherits the result.
 */
export function initBrowsers(startDir: string = process.cwd()): BrowsersInit {
  const dotEnv = loadRepoDotEnv(startDir);
  const browsers = resolveBrowsersPath({
    fromDotEnv: dotEnv.applied.includes(BROWSERS_PATH_ENV),
  });
  if (!browsers.nodeModulesMode) process.env[BROWSERS_PATH_ENV] = browsers.path;
  initialized = { dotEnv, browsers };
  return initialized;
}

/** The result of `initBrowsers`, initializing on first use if it has not run yet. */
export function browsersInit(): BrowsersInit {
  return initialized ?? initBrowsers();
}
