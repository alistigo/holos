import type { LevelWithSilent, Logger } from "pino";
import pino from "pino";

export type { Logger, LevelWithSilent };

// Root logger — starts silent. App entry points call setLogLevel() before rendering.
// Changing root.level propagates to all child loggers at write time (pino checks the
// root level before forwarding to its transport).
const root = pino({
  level: "silent",
  browser: { asObject: true },
});

export const setLogLevel = (level: LevelWithSilent): void => {
  root.level = level;
};

// Creates a child logger with a bound `module` field on every log entry.
// Optionally accepts additional static context (e.g. { listId }).
export const createLogger = (module: string, ctx?: Record<string, unknown>): Logger =>
  root.child({ module, ...ctx });

// @public
