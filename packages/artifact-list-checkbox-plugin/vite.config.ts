import externalGlobals from "rollup-plugin-external-globals";
import { definePluginConfig } from "../../scripts/vite-plugin-build.ts";

// React is provided by the artifact-list host via globalThis.__ALISTIGO_REACT__.
// external-globals rewrites bare react imports to those globals at build time.
export default definePluginConfig(__dirname, {
  external: ["react", "react/jsx-runtime"],
  rollupPlugins: [
    externalGlobals({
      react: "globalThis.__ALISTIGO_REACT__",
      "react/jsx-runtime": "globalThis.__ALISTIGO_REACT_JSX_RUNTIME__",
    }),
  ],
});
