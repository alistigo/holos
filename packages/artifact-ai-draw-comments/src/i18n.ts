import { messages } from "virtual:ai-draw-comments-catalog";
import { i18n } from "@lingui/core";

let booted = false;

export function bootI18n(): void {
  if (booted) return;
  booted = true;
  i18n.load("en", messages);
  i18n.activate("en");
}

export { i18n };
