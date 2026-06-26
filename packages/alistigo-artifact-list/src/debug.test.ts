import { describe, expect, it, spyOn } from "bun:test";

describe("version()", () => {
  it("returns an object with version, locale, buildTime, and dependencies", async () => {
    const { version } = await import("./debug.js");
    const consoleSpy = spyOn(console, "log");
    const result = version();

    expect(typeof result.version).toBe("string");
    expect(typeof result.locale).toBe("string");
    expect(typeof result.buildTime).toBe("string");
    expect(typeof result.dependencies).toBe("object");
    expect(consoleSpy).toHaveBeenCalledWith(result);
    consoleSpy.mockRestore();
  });

  it("includes react and @lingui/core in dependencies", async () => {
    const { version } = await import("./debug.js");
    const consoleSpy = spyOn(console, "log");
    const result = version();

    expect(typeof result.dependencies.react).toBe("string");
    expect(typeof result.dependencies["@lingui/core"]).toBe("string");
    consoleSpy.mockRestore();
  });
});

describe("about()", () => {
  it("returns a superset of version() with runtime, monitoring, analytics", async () => {
    const { about } = await import("./debug.js");
    const consoleSpy = spyOn(console, "log");
    const result = about();

    expect(typeof result.version).toBe("string");
    expect(typeof result.locale).toBe("string");
    expect(typeof result.buildTime).toBe("string");
    expect(typeof result.dependencies).toBe("object");
    expect(result.runtime).toBeDefined();
    expect(Array.isArray(result.runtime.mountedContainers)).toBe(true);
    expect(typeof result.runtime.storageType).toBe("string");
    expect(typeof result.runtime.logLevel).toBe("string");
    expect(typeof result.monitoring.sentry.enabled).toBe("boolean");
    expect(typeof result.analytics.posthog.enabled).toBe("boolean");
    consoleSpy.mockRestore();
  });

  it("analytics.posthog.enabled is false when VITE_POSTHOG_KEY is absent", async () => {
    const { about } = await import("./debug.js");
    const consoleSpy = spyOn(console, "log");
    const result = about();

    expect(result.analytics.posthog.enabled).toBe(false);
    consoleSpy.mockRestore();
  });

  it("calls console.log with the result", async () => {
    const { about } = await import("./debug.js");
    const consoleSpy = spyOn(console, "log");
    const result = about();

    // about() calls version() internally which also logs — last call is the about result
    expect(consoleSpy).toHaveBeenCalledWith(result);
    consoleSpy.mockRestore();
  });
});

describe("registerMount / getMountedContainers", () => {
  it("tracks registered mount containers", async () => {
    const { registerMount, getMountedContainers } = await import("./runtime-state.js");
    registerMount("#test-container");
    expect(getMountedContainers()).toContain("#test-container");
  });

  it("does not duplicate the same container", async () => {
    const { registerMount, getMountedContainers } = await import("./runtime-state.js");
    const before = getMountedContainers().length;
    registerMount("#test-container");
    expect(getMountedContainers().length).toBe(before);
  });
});
