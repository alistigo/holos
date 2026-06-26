/**
 * Document injection — how the runner seeds the app's boot document.
 *
 * The Alistigo app's `index.html` ships a single inline JSON-LD script tag
 * (`<script type="application/json" id="alistigo-document">`) that the app
 * reads on boot. In tests, the runner is the authoring authority — it
 * intercepts the HTML response and rewrites the tag's content with a
 * fixture document before the SPA hydrates.
 */

import type { AlistigoDocument } from "@alistigo/document-format";
import type { Page, Route } from "playwright";
import { HTML_IDS } from "./selectors";

const SCRIPT_TAG_REGEX = new RegExp(
  `<script\\b[^>]*\\bid=["']${HTML_IDS.document}["'][^>]*>[\\s\\S]*?</script>`,
  "i",
);

export async function installDocumentRoute(
  page: Page,
  baseUrl: string,
  getDocument: () => AlistigoDocument,
): Promise<void> {
  const target = new URL(baseUrl);

  await page.route(`${target.protocol}//${target.host}/**`, async (route: Route) => {
    let response: Awaited<ReturnType<Route["fetch"]>>;
    try {
      response = await route.fetch();
    } catch {
      // Page closed or server unreachable — abort so goto() fails fast instead of timing out.
      await route.abort().catch(() => undefined);
      return;
    }
    let rewritten: string | undefined;
    try {
      const headers = response.headers();
      const contentType = headers["content-type"] ?? "";
      if (!contentType.toLowerCase().includes("text/html")) {
        await route.fulfill({ response }).catch(() => undefined);
        return;
      }
      const original = await response.text();
      rewritten = injectDocument(original, getDocument());
    } catch (err) {
      await route.abort().catch(() => undefined);
      throw err;
    }
    await route
      .fulfill({ response, body: rewritten, headers: response.headers() })
      .catch(() => undefined);
  });
}

function injectDocument(html: string, document: AlistigoDocument): string {
  if (!SCRIPT_TAG_REGEX.test(html)) {
    throw new Error(
      `Alistigo document tag <script id="${HTML_IDS.document}"> not found in HTML response. ` +
        "The app's index.html must include this tag for the runner to seed fixtures.",
    );
  }
  const safeJson = JSON.stringify(document).replace(/<\/script/gi, "<\\/script");
  const replacement = `<script type="application/json" id="${HTML_IDS.document}">${safeJson}</script>`;
  return html.replace(SCRIPT_TAG_REGEX, replacement);
}
