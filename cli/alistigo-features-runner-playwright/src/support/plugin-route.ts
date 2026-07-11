/**
 * Plugin route injection — how the runner serves a fake plugin bundle in
 * place of a real jsDelivr fetch.
 *
 * @alistigo/artifact-plugin-api's loader always resolves a plugin package
 * name to a real jsDelivr URL with no override point (by design — see ADR
 * 0016). Tests intercept that exact URL via page.route() and fulfill it with
 * a local fixture instead, keeping the real load -> setup() -> event path
 * exercised end-to-end without any network dependency.
 */

import { resolvePluginUrl } from "@alistigo/artifact-plugin-api";
import type { Page } from "playwright";

export async function installPluginRoute(
  page: Page,
  packageName: string,
  jsSource: string,
): Promise<void> {
  const url = resolvePluginUrl(packageName);

  await page.route(url, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/javascript; charset=utf-8",
      // The dynamic import() of a cross-origin module fetches in CORS mode;
      // there's no real network response here to inherit the header from.
      headers: { "access-control-allow-origin": "*" },
      body: jsSource,
    });
  });
}
