/**
 * @alistigo/artifact-list
 *
 * Self-contained UMD bundle for Claude HTML artifacts and standalone pages.
 * Bundles React, Lingui, all Alistigo packages into one file with no
 * external dependencies.
 *
 * Auto-mount (default — no JavaScript required):
 *   <script src="index.umd.js"></script>
 *
 *   Optional config before the bundle script:
 *   <script type="application/json" id="alistigo-config">
 *     { "container": "#app", "document": { ... } }
 *   </script>
 *
 * Explicit mount (advanced — do not mix with auto-mount):
 *   <script src="index.umd.js"></script>
 *   <script>Alistigo.mount('#root', { document: {...} }).catch(console.error);</script>
 *
 * mount() is async (it dynamically imports any configured plugins before
 * rendering) — callers relying on synchronous completion must update to await it.
 */

/*
 * Embedded-app entry CSS. Imports the components-package CSS (which sets
 * up Tailwind v4 + Radix Colors + semantic tokens), then adds an
 * @source for this app's own files so utility classes used in
 * App.tsx / DevFixturePicker.tsx aren't tree-shaken away.
 */

import "./styles/app.css";

import { setLogLevel } from "@alistigo/logger";
import autoMount from "./auto-mount.js";

// Configure log level on bundle load.
(() => {
  if (import.meta.env.VITE_ALISTIGO_DEBUG === "true") {
    setLogLevel("trace");
  } else if (import.meta.env.MODE === "production") {
    setLogLevel("error");
  } else {
    setLogLevel("info");
  }
})();

// Deferred by a microtask so that synchronous code still to come in the
// importing module (e.g. writing #alistigo-config from a URL param) runs
// before autoMount() reads it — import side effects always run before the
// rest of the importing module's own top-level statements.
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => queueMicrotask(autoMount));
} else {
  queueMicrotask(autoMount);
}
