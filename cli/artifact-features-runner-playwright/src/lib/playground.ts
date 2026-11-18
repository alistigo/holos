import { type Browser, chromium, type Page } from "playwright";
import { localBundleFor } from "../harness/routes.js";
import { aptPackageForLibrary } from "./browser-checks.js";
import { BROWSERS_PATH_ENV, CHROMIUM_EXECUTABLE_ENV } from "./browsers.js";
import { type CheckResult, check } from "./check.js";

const PREVIEW_IFRAME = 'iframe[name="artifact-preview"]';
const PLAYGROUND_MARKERS = ['id="host-root"', "Dev Playground"];
const START_PLAYGROUND = "Start it with `nx run alistigo-artifact-playground:preview`.";

interface ArtifactConfig {
  app?: string;
}

export function validateHost(host: string): string | undefined {
  let url: URL;
  try {
    url = new URL(host);
  } catch {
    return `--host "${host}" is not a valid URL`;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return `--host must be an http or https URL, got "${host}"`;
  }
  return undefined;
}

export async function fetchHost(host: string): Promise<{ result: CheckResult; html?: string }> {
  try {
    const response = await fetch(host, { signal: AbortSignal.timeout(5_000) });
    if (!response.ok) {
      return {
        result: check(
          "Host reachable",
          "fail",
          `${host} responded ${response.status} ${response.statusText}`,
          [START_PLAYGROUND],
        ),
      };
    }
    return {
      result: check("Host reachable", "ok", `${host} responded ${response.status}`),
      html: await response.text(),
    };
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    return {
      result: check("Host reachable", "fail", `${host} is unreachable (${reason})`, [
        START_PLAYGROUND,
        "Pass --host if the playground runs on another port.",
      ]),
    };
  }
}

export function checkPlaygroundMarkup(html: string): CheckResult {
  const missing = PLAYGROUND_MARKERS.filter((marker) => !html.includes(marker));
  if (missing.length === 0) {
    return check("Playground page", "ok", "served HTML carries the dev-playground markers");
  }
  return check("Playground page", "warn", `served HTML lacks ${missing.join(" and ")}`, [
    "--host may point at a different app.",
    "The artifact-selector check below is the authoritative one.",
  ]);
}

async function listArtifacts(page: Page): Promise<string[]> {
  const options = await page.getByRole("combobox", { name: "Artifact" }).locator("option").all();
  const values = await Promise.all(options.map((option) => option.getAttribute("value")));
  return values.filter((value): value is string => value !== null);
}

async function readPreviewApp(page: Page): Promise<string | undefined> {
  const text = await page
    .frameLocator(PREVIEW_IFRAME)
    .locator("#alistigo-config")
    .textContent({ timeout: 2_000 });
  if (text === null) return undefined;
  try {
    return (JSON.parse(text) as ArtifactConfig).app;
  } catch {
    return undefined;
  }
}

async function waitForPreviewApp(page: Page, expected: string): Promise<string | undefined> {
  const deadline = Date.now() + 15_000;
  let seen: string | undefined;
  while (Date.now() < deadline) {
    seen = await readPreviewApp(page).catch(() => undefined);
    if (seen === expected) return seen;
    await page.waitForTimeout(200);
  }
  return seen;
}

// fallow-ignore-next-line complexity
async function checkArtifactSelector(
  page: Page,
  requested: string | undefined,
): Promise<{ result: CheckResult; selected?: string }> {
  const selector = page.getByRole("combobox", { name: "Artifact" });
  try {
    await selector.waitFor({ state: "visible", timeout: 10_000 });
  } catch {
    return {
      result: check("Artifact selector", "fail", 'no combobox named "Artifact" on the page', [
        "The host responded but does not look like the Alistigo dev playground.",
        START_PLAYGROUND,
      ]),
    };
  }

  const artifacts = await listArtifacts(page);
  if (requested !== undefined && !artifacts.includes(requested)) {
    return {
      result: check(
        "Artifact selector",
        "fail",
        `"${requested}" is not offered by the playground`,
        [
          `Offered: ${artifacts.join(", ")}`,
          "Register the artifact in packages/artifact-manager/src/registry.ts.",
        ],
      ),
    };
  }

  const selected = requested ?? artifacts[0];
  if (selected === undefined) {
    return {
      result: check("Artifact selector", "fail", "the Artifact selector offers no artifacts", [
        "Check ARTIFACT_REGISTRY in packages/artifact-manager/src/registry.ts.",
      ]),
    };
  }

  await selector.selectOption(selected);
  return {
    result: check(
      "Artifact selector",
      "ok",
      `selected "${selected}" of ${artifacts.length} offered`,
    ),
    selected,
  };
}

async function checkPreviewConfig(page: Page, selected: string): Promise<CheckResult> {
  const seen = await waitForPreviewApp(page, selected);
  if (seen === selected) {
    return check("Preview config", "ok", `the preview iframe reports app "${selected}"`);
  }
  const detail =
    seen === undefined
      ? "the preview iframe exposes no #alistigo-config"
      : `the preview iframe reports app "${seen}", expected "${selected}"`;
  return check("Preview config", "fail", detail, [
    "The selection did not reach the artifact iframe.",
    "Rebuild the playground: nx run alistigo-artifact-playground:build",
  ]);
}

async function checkArtifactMounts(page: Page): Promise<CheckResult> {
  try {
    await page
      .frameLocator(PREVIEW_IFRAME)
      .locator("body > *:not(script)")
      .first()
      .waitFor({ state: "attached", timeout: 20_000 });
    return check("Artifact mount", "ok", "the artifact rendered inside the preview iframe");
  } catch {
    return check("Artifact mount", "fail", "the preview iframe body stayed empty", [
      "The artifact bundle did not mount — its entry module probably failed to load.",
      "Rebuild it, then re-run with --verbose to see the iframe console output.",
    ]);
  }
}

/**
 * Whether the preview will load the artifact from the working tree or from the
 * published bundle on jsDelivr.
 *
 * A `vite preview` build is not a dev build, so the playground falls back to the
 * registry's CDN URL; the harness intercepts that and serves the local `dist/`
 * instead. Without a local build the request falls through to the network, and
 * the scenarios then assert against the *published* artifact — so a
 * source-only change looks absent and every readiness wait times out.
 *
 * Warns rather than fails, so `doctor` stays usable against a real deployment.
 */
function checkLocalBundle(artifact: string | undefined, from: string): CheckResult {
  if (artifact === undefined) {
    return check("Local bundle", "skip", "no --artifact given, nothing to resolve");
  }
  const local = localBundleFor(artifact, "dist/index.js", from);
  if (local !== undefined) {
    return check("Local bundle", "ok", `serving ${local.replace(`${process.cwd()}/`, "")}`);
  }
  return check(
    "Local bundle",
    "warn",
    `no local build found for ${artifact} — the preview will fetch the published bundle from jsDelivr`,
    [
      `Build it first: nx run ${artifact.replace(/^@[^/]+\//, "")}:build`,
      "Until then, scenarios assert against the published artifact, not your working tree.",
    ],
  );
}

async function runPageChecks(
  page: Page,
  artifact: string | undefined,
  results: CheckResult[],
): Promise<void> {
  const selection = await checkArtifactSelector(page, artifact);
  results.push(selection.result);
  if (selection.selected === undefined) return;
  results.push(checkLocalBundle(selection.selected, process.cwd()));
  results.push(await checkPreviewConfig(page, selection.selected));
  results.push(await checkArtifactMounts(page));
}

const USE_OWN_BROWSER = `Or skip the download: set ${CHROMIUM_EXECUTABLE_ENV} in the repo .env to a chromium that already runs on this host.`;

function missingLibraryFix(library: string): string[] {
  const aptPackage = aptPackageForLibrary(library);
  const install =
    aptPackage === undefined
      ? "pnpm playwright:install-deps"
      : `sudo apt-get install -y ${aptPackage} (or: pnpm playwright:install-deps)`;
  return [`Missing OS library ${library} — run: ${install}`, USE_OWN_BROWSER];
}

function notDownloadedFix(): string[] {
  return [
    "Browser not downloaded — run: pnpm playwright:install",
    `See the Browsers path and Browser revision checks above; a machine-wide ${BROWSERS_PATH_ENV} is overridden by the repo .env.`,
    USE_OWN_BROWSER,
  ];
}

function chromiumLaunchFix(reason: string): string[] {
  const library = /error while loading shared libraries: ([^:]+)/.exec(reason)?.[1];
  if (library !== undefined) return missingLibraryFix(library);
  return reason.includes("Executable doesn't exist") ? notDownloadedFix() : [];
}

/**
 * Drives the playground end to end: the host is only "really the playground" if an
 * artifact can be selected and that selection reaches the preview iframe.
 */
// fallow-ignore-next-line complexity
export async function probePlayground(
  host: string,
  artifact: string | undefined,
  onConsole?: (message: string) => void,
  executablePath?: string,
): Promise<CheckResult[]> {
  let browser: Browser;
  try {
    browser = await chromium.launch(executablePath === undefined ? {} : { executablePath });
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    return [
      check("Chromium", "fail", `cannot launch chromium (${reason})`, chromiumLaunchFix(reason)),
    ];
  }

  const results: CheckResult[] = [check("Chromium", "ok", `launched ${browser.version()}`)];
  try {
    const page = await browser.newPage();
    if (onConsole !== undefined) {
      page.on("console", (message) => onConsole(`[${message.type()}] ${message.text()}`));
      page.on("pageerror", (error) => onConsole(`[pageerror] ${error.message}`));
    }
    await page.goto(host, { waitUntil: "domcontentloaded", timeout: 15_000 });
    await runPageChecks(page, artifact, results);
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    results.push(check("Playground", "fail", reason, []));
  } finally {
    await browser.close();
  }
  return results;
}
