#!/usr/bin/env node
import { initBrowsers } from "./lib/browsers.js";

// Order matters. playwright-core resolves its browsers directory once, in module
// scope, from PLAYWRIGHT_BROWSERS_PATH — so the repo `.env` has to be applied and a
// usable path chosen *before* anything that imports playwright is loaded. Hence the
// dynamic import below: static imports would be evaluated first and read the stale
// (possibly read-only, wrong-revision) value this is meant to replace.
initBrowsers();

const { main } = await import("./main.js");
await main(process.argv.slice(2));
