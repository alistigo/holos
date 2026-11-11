/**
 * @alistigo/artifact-list
 *
 * ES module for Claude HTML artifacts and standalone pages.
 * React is bundled — no host-page import map required. The bundled React
 * instance is exposed on globalThis.__ALISTIGO_REACT__ so plugins loaded
 * later via dynamic import share the same React instance without bundling
 * their own copy.
 *
 * Auto-mount (default):
 *   <script type="module" src="index.js"></script>
 *
 *   Optional config before the module script:
 *   <script type="application/json" id="alistigo-config">
 *     { "container": "#app", "document": { ... } }
 *   </script>
 */

import "./styles/app.css";

// Expose bundled React on globalThis so dynamically-loaded plugins can share
// the same instance. Must run before any plugin import.
import * as React from "react";
import * as ReactJSXRuntime from "react/jsx-runtime";
import * as ReactDOM from "react-dom";

(globalThis as Record<string, unknown>).__ALISTIGO_REACT__ = React;
(globalThis as Record<string, unknown>).__ALISTIGO_REACT_DOM__ = ReactDOM;
(globalThis as Record<string, unknown>).__ALISTIGO_REACT_JSX_RUNTIME__ = ReactJSXRuntime;

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
