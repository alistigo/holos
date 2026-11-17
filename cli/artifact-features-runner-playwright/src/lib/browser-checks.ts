import {
  BROWSERS_PATH_ENV,
  type BrowsersInit,
  bundledChromiumVersion,
  CHROMIUM_EXECUTABLE_ENV,
  type ChromiumExecutable,
  chromiumExecutableVersion,
  majorVersion,
  SKIP_HOST_REQUIREMENTS_ENV,
  validateChromiumExecutable,
} from "./browsers.js";
import { type CheckResult, check } from "./check.js";

/** Shared libraries the downloaded chromium needs, mapped to their Debian/Ubuntu packages. */
const APT_PACKAGES = new Map<string, string>([
  ["libasound.so.2", "libasound2t64"],
  ["libcairo.so.2", "libcairo2"],
  ["libcups.so.2", "libcups2t64"],
  ["libpango-1.0.so.0", "libpango-1.0-0"],
  ["libatk-1.0.so.0", "libatk1.0-0t64"],
  ["libatk-bridge-2.0.so.0", "libatk-bridge2.0-0t64"],
  ["libatspi.so.0", "libatspi2.0-0t64"],
  ["libnss3.so", "libnss3"],
  ["libxkbcommon.so.0", "libxkbcommon0"],
  ["libgbm.so.1", "libgbm1"],
  ["libdbus-1.so.3", "libdbus-1-3"],
  ["libdrm.so.2", "libdrm2"],
]);

/** Values of SKIP_HOST_REQUIREMENTS_ENV that leave Playwright's own validation on. */
const NOT_SKIPPING = ["", "0", "false"];

export function aptPackageForLibrary(library: string): string | undefined {
  return APT_PACKAGES.get(library);
}

function browsersPathOrigin(init: BrowsersInit): string {
  if (init.browsers.source === "dotenv") return `from ${init.dotEnv.file ?? ".env"}`;
  return init.browsers.source === "env" ? `from ${BROWSERS_PATH_ENV}` : "playwright default";
}

function rejectedPathCheck(
  detail: string,
  rejected: { path: string; reason: string },
): CheckResult {
  return check("Browsers path", "warn", detail, [
    `Ignored ${rejected.path} (${rejected.reason}) — it cannot serve this playwright version.`,
    `Set ${BROWSERS_PATH_ENV} in the repo .env to silence this, or unset the machine-wide value.`,
  ]);
}

function browsersPathCheck(init: BrowsersInit): CheckResult {
  const { browsers } = init;
  if (browsers.nodeModulesMode) {
    return check("Browsers path", "ok", `${BROWSERS_PATH_ENV}=0 — browsers live in node_modules`);
  }

  const detail = `${browsers.path} (${browsersPathOrigin(init)})`;
  if (browsers.rejected !== undefined) return rejectedPathCheck(detail, browsers.rejected);
  if (browsers.writable) return check("Browsers path", "ok", detail);
  return check("Browsers path", "warn", `${detail} — not writable`, [
    "Installing browsers here will fail; point the repo .env at a writable directory.",
  ]);
}

function missingRevisionCheck(init: BrowsersInit, wanted: string): CheckResult {
  const { browsers } = init;
  const found = browsers.presentDirs.length > 0 ? `; found ${browsers.presentDirs.join(", ")}` : "";
  return check(
    "Browser revision",
    "fail",
    `missing ${browsers.missingDirs.join(", ")} in ${browsers.path}`,
    [`This playwright needs ${wanted}${found}.`, "Download it — run: pnpm playwright:install"],
  );
}

function revisionCheck(init: BrowsersInit): CheckResult {
  const { browsers } = init;
  if (browsers.required.length === 0) {
    return check("Browser revision", "skip", "could not read playwright-core/browsers.json");
  }
  const wanted = browsers.required.map((build) => build.dir).join(", ");
  if (browsers.nodeModulesMode) {
    return check("Browser revision", "skip", `expects ${wanted} inside node_modules`);
  }
  if (browsers.missingDirs.length === 0) {
    return check("Browser revision", "ok", `${wanted} present`);
  }
  return missingRevisionCheck(init, wanted);
}

function executableOrigin(executable: ChromiumExecutable, init: BrowsersInit): string {
  if (executable.source === "flag") return "--chromium-executable";
  return init.dotEnv.applied.includes(CHROMIUM_EXECUTABLE_ENV)
    ? `${CHROMIUM_EXECUTABLE_ENV} (repo .env)`
    : CHROMIUM_EXECUTABLE_ENV;
}

/** Warns when the chosen browser's major version is not the one playwright bundles. */
function skewCheck(
  detail: string,
  actual: string | undefined,
  bundled: string | undefined,
): CheckResult {
  const actualMajor = majorVersion(actual);
  const bundledMajor = majorVersion(bundled);
  const skewed =
    actualMajor !== undefined && bundledMajor !== undefined && actualMajor !== bundledMajor;
  if (!skewed) return check("Chromium executable", "ok", detail);
  return check("Chromium executable", "warn", detail, [
    `This playwright bundles Chrome ${bundled} — a different major version is not guaranteed to work.`,
  ]);
}

function executableCheck(
  executable: ChromiumExecutable | undefined,
  init: BrowsersInit,
): CheckResult {
  if (executable === undefined) {
    return check("Chromium executable", "skip", "using playwright's bundled browser");
  }

  const origin = executableOrigin(executable, init);
  const problem = validateChromiumExecutable(executable.path);
  if (problem !== undefined) {
    return check("Chromium executable", "fail", `${problem} (from ${origin})`, [
      "Point it at a chrome/chrome-headless-shell binary, or unset it to use the bundled browser.",
    ]);
  }

  const actual = chromiumExecutableVersion(executable.path);
  return skewCheck(
    `${actual ?? executable.path} (from ${origin})`,
    actual,
    bundledChromiumVersion(init.browsers.required),
  );
}

function hostRequirementsCheck(): CheckResult {
  const skip = process.env[SKIP_HOST_REQUIREMENTS_ENV];
  if (skip === undefined || NOT_SKIPPING.includes(skip)) {
    return check("Host requirements", "ok", "playwright will validate its OS dependencies");
  }
  return check("Host requirements", "warn", `${SKIP_HOST_REQUIREMENTS_ENV}=${skip}`, [
    "Playwright's own missing-library check is suppressed, so a broken browser only shows up at launch.",
    "Unset it when diagnosing a browser that will not start.",
  ]);
}

/** Everything about *which* browser will be launched, before trying to launch it. */
export function browserChecks(
  init: BrowsersInit,
  executable: ChromiumExecutable | undefined,
): CheckResult[] {
  const results = [browsersPathCheck(init)];
  // With an explicit executable, playwright's own registry is bypassed entirely.
  if (executable === undefined) results.push(revisionCheck(init));
  results.push(executableCheck(executable, init), hostRequirementsCheck());
  return results;
}
