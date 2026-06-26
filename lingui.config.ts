import { defineConfig } from "@lingui/cli";
import { formatter } from "@lingui/format-po";

/**
 * Workspace-level Lingui config. Lives at the repo root so both:
 *   - `lingui extract` (run from the components package) and
 *   - `@lingui/vite-plugin` (loaded by every app's Vite build, walking
 *      up the dir tree to find the config)
 * find the same single source of truth.
 *
 * The components package is the **single source of truth for catalogs**
 * across the Alistigo apps. Catalogs live next to the components, in
 * `packages/alistigo-list-components-react/src/locales/{locale}/messages.po`,
 * and consuming apps reference them through a Vite alias resolved at
 * build time (see each app's `vite.config.ts`).
 *
 * `include` therefore lists every place macros can appear: the
 * components-react package itself, plus every app that imports from it
 * and contributes app-specific `<Trans>` / `t` calls.
 */
export default defineConfig({
  sourceLocale: "en",
  locales: ["en", "fr"],
  catalogs: [
    {
      path: "<rootDir>/packages/alistigo-list-components-react/src/locales/{locale}/messages",
      include: [
        "packages/alistigo-list-components-react/src",
        "apps/alistigo-artifact-playground/src",
      ],
    },
  ],
  format: formatter({ lineNumbers: false }),
});
