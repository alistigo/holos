/**
 * @alistigo/artifact-list
 *
 * ES module for Claude HTML artifacts and standalone pages.
 * React is externalized — the host page must provide an import map pointing
 * react / react-dom / react/jsx-runtime at jsDelivr (or equivalent CDN).
 *
 * Auto-mount (default):
 *   <script type="importmap">{ "imports": { "react": "...", ... } }</script>
 *   <script type="module" src="index.js"></script>
 *
 *   Optional config before the module script:
 *   <script type="application/json" id="alistigo-config">
 *     { "container": "#app", "document": { ... } }
 *   </script>
 */

/*
 * Embedded-app entry CSS. Imports the components-package CSS (which sets
 * up Tailwind v4 + Radix Colors + semantic tokens), then adds an
 * @source for this app's own files so utility classes used in
 * App.tsx / DevFixturePicker.tsx aren't tree-shaken away.
 */

import "./styles/app.css";

import { setLogLevel } from "@alistigo/pino-logger-plugin";
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
