import { definePluginConfig } from "../../scripts/vite-plugin-build.ts";

// React is a required peer dependency — externalize it so the host app's
// React instance is used instead of bundling a second copy.
export default definePluginConfig(__dirname, {
  external: ["react", "react-dom", "react/jsx-runtime"],
});
