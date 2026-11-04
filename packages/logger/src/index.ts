import type { LoggerPlugin } from "@alistigo/artifact-plugin-api";
import type { LevelWithSilent } from "pino";
import pino from "pino";

export type { LevelWithSilent };

const root = pino({
  level: "silent",
  browser: { asObject: true },
});

export const setLogLevel = (level: LevelWithSilent): void => {
  root.level = level;
};

/** Creates a pino child logger. For application/infrastructure use only — domain/presentation layers should use createLogger from @alistigo/artifact-plugin-api instead. */
export const createLogger = (
  module: string,
  ctx?: Record<string, unknown>,
): ReturnType<typeof root.child> => root.child({ module, ...ctx });

const pinoCreateLogger = createLogger;

export const pinoLoggerPlugin: LoggerPlugin = {
  name: "@alistigo/pino-logger-plugin",
  type: "logger",
  setup(ctx) {
    ctx.on("log:emitted", ({ level, module, message, data }) => {
      pinoCreateLogger(module)[level](data ?? {}, message);
    });
  },
};

export default pinoLoggerPlugin;
