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
 *   <script>Alistigo.mount('#root', { document: {...} });</script>
 */

/*
 * Embedded-app entry CSS. Imports the components-package CSS (which sets
 * up Tailwind v4 + Radix Colors + semantic tokens), then adds an
 * @source for this app's own files so utility classes used in
 * App.tsx / DevFixturePicker.tsx aren't tree-shaken away.
 */

import "./styles/app.css";

import { setLogLevel } from "@alistigo/logger";
import pkg from "../package.json" with { type: "json" };
import autoMount from "./auto-mount.js";
import { initMonitoring } from "./monitoring.js";

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

initMonitoring(pkg.version);

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", autoMount);
} else {
  autoMount();
}

// @public
