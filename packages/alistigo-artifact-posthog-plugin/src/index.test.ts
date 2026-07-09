import { describe, expect, it, mock } from "bun:test";

// Mock posthog-js before importing the plugin.
await mock.module("posthog-js", () => ({
  default: {
    init: mock(() => {}),
    capture: mock(() => {}),
  },
}));

const { createPluginBus } = await import("@alistigo/artifact-plugin-api");
const posthogPlugin = (await import("./index.js")).default;
const posthog = (await import("posthog-js")).default;

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

describe("@alistigo/artifact-posthog-plugin", () => {
  it("reports its own npm package name", () => {
    expect(posthogPlugin.name).toBe("@alistigo/artifact-posthog-plugin");
  });

  it("does nothing when VITE_POSTHOG_KEY is absent", () => {
    // import.meta.env.VITE_POSTHOG_KEY is undefined in bun test by default.
    posthogPlugin.setup?.(makeContext());
    expect(posthog.init).not.toHaveBeenCalled();
  });

  it("does not throw when setup is called without an API key", () => {
    expect(() => posthogPlugin.setup?.(makeContext())).not.toThrow();
  });

  it("does not subscribe to widget:displayed when no API key is configured", () => {
    const ctx = makeContext();
    posthogPlugin.setup?.(ctx);
    expect(() =>
      ctx.emit("widget:displayed", { locale: "en", storageType: "memory", version: "1.0.0" }),
    ).not.toThrow();
    expect(posthog.capture).not.toHaveBeenCalled();
  });
});
