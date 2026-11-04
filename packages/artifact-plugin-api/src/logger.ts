import type { LogLevel, PluginEventBus } from "./types.js";

export interface Logger {
  trace(message: string, data?: Record<string, unknown>): void;
  debug(message: string, data?: Record<string, unknown>): void;
  info(message: string, data?: Record<string, unknown>): void;
  warn(message: string, data?: Record<string, unknown>): void;
  error(message: string, data?: Record<string, unknown>): void;
}

/** Returns a Logger that emits "log:emitted" events on the plugin bus.
 *  When bus is undefined (e.g. in tests), all calls are no-ops. */
export function createLogger(bus: PluginEventBus | undefined, module: string): Logger {
  const emit = (level: LogLevel, message: string, data?: Record<string, unknown>) =>
    bus?.emit("log:emitted", { level, module, message, ...(data !== undefined ? { data } : {}) });
  return {
    trace: (msg, data) => emit("trace", msg, data),
    debug: (msg, data) => emit("debug", msg, data),
    info: (msg, data) => emit("info", msg, data),
    warn: (msg, data) => emit("warn", msg, data),
    error: (msg, data) => emit("error", msg, data),
  };
}
