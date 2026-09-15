/// <reference types="vite/client" />

/**
 * Build-time-injected globals (see vite.config.ts `define`).
 */
declare const __ALISTIGO_LOCALE__: string;

/** Package name -> absolute filesystem path to its src/index.ts, dev only. */
declare const __ALISTIGO_DEV_PLUGIN_SRC_PATHS__: Record<string, string>;

/** Hostname baked in at dev-server time for Tailscale/LAN CSP expansion; empty string in production. */
declare const __ALISTIGO_DEV_HOSTNAME__: string;

/**
 * Per-locale Lingui catalog, resolved by Vite via an alias to the
 * compiled `.po` for the active LOCALE. See `src/i18n.ts`.
 */
declare module "virtual:alistigo-active-catalog" {
  import type { Messages } from "@lingui/core";
  export const messages: Messages;
}
