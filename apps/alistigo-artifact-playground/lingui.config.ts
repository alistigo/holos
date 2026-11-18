import path from "node:path";
import { defineConfig } from "@lingui/cli";
import { formatter } from "@lingui/format-po";

/**
 * Lingui config for the playground's Vite build **only**.
 *
 * Why this file exists, when the repo root already has one: the playground is
 * the single place that loads catalogs from more than one package. It aliases
 * each artifact to its source (see `vite.config.ts`), so `@lingui/vite-plugin`
 * is asked to transform `.po` files belonging to those artifacts — and the
 * plugin rejects any catalog path its resolved config does not declare.
 *
 * The root `lingui.config.ts` deliberately declares exactly one catalog, the
 * one in `list-components-react`, as the single source of truth for the list
 * stack. The draw-comments widget is a separately publishable artifact that
 * owns its own catalog, which is correct — but it means the root config cannot
 * resolve it, and the plugin walks *up* from the app directory, so it never
 * finds the widget's own config either. The result was a hard 500 on
 * `src/locales/en/messages.po?import` and a widget that could not mount in dev.
 *
 * Scope, so this does not quietly diverge from the root config:
 *
 *   - This file is read ONLY by `@lingui/vite-plugin`, and only because
 *     `vite.config.ts` passes it explicitly as `configPath`. Nothing discovers
 *     it by directory walking.
 *   - `pnpm i18n:extract` still uses the ROOT config. Do not add `include`
 *     globs here expecting extraction to honour them — it will not. Message
 *     extraction for the playground's own `<Trans>` / `t` calls stays in the
 *     root config's `include`.
 *   - Adding an artifact to `vite.config.ts`'s alias list means adding its
 *     catalog path here too.
 */
export default defineConfig({
  // `<rootDir>` defaults to the directory holding this file, which would make
  // every path below resolve inside the app. Pin it to the repo root so the
  // catalog paths are identical to the ones in the root config, and so the
  // plugin's `path.relative(rootDir, id)` yields a clean `packages/...` path.
  rootDir: path.resolve(import.meta.dirname, "../.."),
  sourceLocale: "en",
  locales: ["en", "fr"],
  catalogs: [
    {
      // The list stack's shared catalog — the root config's single source of truth.
      path: "<rootDir>/packages/list-components-react/src/locales/{locale}/messages",
      include: ["packages/list-components-react/src"],
    },
    {
      // The draw-comments widget owns its own catalog; it ships `en` only.
      path: "<rootDir>/packages/artifact-ai-draw-comments/src/locales/{locale}/messages",
      include: ["packages/artifact-ai-draw-comments/src"],
    },
  ],
  format: formatter({ lineNumbers: false }),
});
