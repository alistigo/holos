import { messages } from "virtual:alistigo-active-catalog";
import { i18n } from "@lingui/core";

declare const __ALISTIGO_LOCALE__: string;

const ACTIVE_LOCALE: string = __ALISTIGO_LOCALE__;
const RTL_LOCALES = new Set(["ar", "fa", "he", "ur"]);

let booted = false;

export function bootI18n(): void {
  if (booted) return;
  booted = true;
  i18n.load(ACTIVE_LOCALE, messages);
  i18n.activate(ACTIVE_LOCALE);
  const root = document.documentElement;
  root.setAttribute("lang", ACTIVE_LOCALE);
  root.setAttribute("dir", RTL_LOCALES.has(ACTIVE_LOCALE) ? "rtl" : "ltr");
}
