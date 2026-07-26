/// <reference types="vite/client" />

/**
 * Build-time-injected globals (see vite.config.ts `define`).
 */
declare const __ALISTIGO_LOCALE__: string;

/** Package name -> absolute filesystem path to its src/index.ts, dev only. */
declare const __ALISTIGO_DEV_PLUGIN_SRC_PATHS__: Record<string, string>;

/**
 * Per-locale Lingui catalog, resolved by Vite via an alias to the
 * compiled `.po` for the active LOCALE. See `src/i18n.ts`.
 */
declare module "virtual:alistigo-active-catalog" {
  import type { Messages } from "@lingui/core";
  export const messages: Messages;
}
