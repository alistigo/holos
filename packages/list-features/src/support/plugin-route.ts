/**
 * Plugin route injection — how the runner serves a fake plugin bundle in
 * place of a real plugin fetch.
 *
 * In dev mode the playground injects __ALISTIGO_PLUGIN_URL_OVERRIDES__ into
 * the iframe, pointing each package to a Vite /@fs/ URL (see ADR 0016 and
 * buildIframeSrcdoc.ts). Tests intercept both that path and the jsDelivr
 * fallback URL, fulfilling each with a local fixture instead, keeping the
 * real load -> setup() -> event path exercised end-to-end without any
 * network dependency.
 */

import { resolvePluginUrl } from "@alistigo/artifact-plugin-api";
import type { Page, Route } from "playwright";

export async function installPluginRoute(
  page: Page,
  packageName: string,
  jsSource: string,
): Promise<void> {
  async function fulfill(route: Route): Promise<void> {
    await route.fulfill({
      status: 200,
      contentType: "application/javascript; charset=utf-8",
      // The dynamic import() of a cross-origin module fetches in CORS mode;
      // there's no real network response here to inherit the header from.
      headers: { "access-control-allow-origin": "*" },
      body: jsSource,
    });
  }

  // Dev server overrides point plugins at /@fs/<abs-path>/src/index.ts.
  // After P0 renames, the packages/ directory name equals the unscoped package name
  // (the part after @scope/), e.g. @alistigo/artifact-sentry-plugin → artifact-sentry-plugin.
  const dirName = packageName.replace(/^@[^/]+\//, "");
  await page.route(`**/${dirName}/src/**`, fulfill);

  // jsDelivr fallback for non-dev environments.
  await page.route(resolvePluginUrl(packageName), fulfill);
}
