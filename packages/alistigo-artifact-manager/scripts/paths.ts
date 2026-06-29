import path from "node:path";

const SCRIPT_DIR = path.dirname(new URL(import.meta.url).pathname);

export const PKG_DIR = path.resolve(SCRIPT_DIR, "..");
export const PACKAGES_DIR = path.resolve(PKG_DIR, "..");
export const OUTPUT_PATH = path.join(PKG_DIR, "SKILL.md");
export const TEMPLATE_PATH = path.join(SCRIPT_DIR, "SKILL.md.template");
