/// <reference types="vite/client" />

/**
 * Per-locale Lingui catalog, resolved by Vite via an alias to the
 * compiled `.po` for the active LOCALE. See `i18n.ts`.
 */
declare module "virtual:alistigo-active-catalog" {
  import type { Messages } from "@lingui/core";
  export const messages: Messages;
}
