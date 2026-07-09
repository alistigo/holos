import { describe, expect, it, mock } from "bun:test";

// Mock @sentry/browser before importing the plugin.
await mock.module("@sentry/browser", () => ({
  init: mock(() => {}),
  captureException: mock(() => {}),
}));

const { createPluginBus } = await import("@alistigo/artifact-plugin-api");
const sentryPlugin = (await import("./index.js")).default;
const Sentry = await import("@sentry/browser");

function makeContext() {
  const bus = createPluginBus();
  return {
    config: {},
    host: {
      packageName: "@alistigo/artifact-list",
      version: "1.0.0",
      locale: "en",
      environment: "test",
    },
    logger: { info: () => {}, error: () => {} },
    on: bus.on,
    emit: bus.emit,
  };
}

describe("@alistigo/artifact-sentry-plugin", () => {
  it("reports its own npm package name", () => {
    expect(sentryPlugin.name).toBe("@alistigo/artifact-sentry-plugin");
  });

  it("does nothing when VITE_SENTRY_DSN is absent", () => {
    // import.meta.env.VITE_SENTRY_DSN is undefined in bun test by default.
    sentryPlugin.setup?.(makeContext());
    expect(Sentry.init).not.toHaveBeenCalled();
  });

  it("does not throw when setup is called without a DSN", () => {
    expect(() => sentryPlugin.setup?.(makeContext())).not.toThrow();
  });

  it("does not subscribe to error:uncaught when no DSN is configured", () => {
    const ctx = makeContext();
    sentryPlugin.setup?.(ctx);
    expect(() => ctx.emit("error:uncaught", { error: new Error("boom") })).not.toThrow();
    expect(Sentry.captureException).not.toHaveBeenCalled();
  });

  it("has no wrapRoot hook — the plugin never touches React", () => {
    expect(sentryPlugin.wrapRoot).toBeUndefined();
  });
});
