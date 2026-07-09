import { describe, expect, it } from "bun:test";
import { createPluginBus, createPluginRuntime } from "./runtime.js";
import type { AlistigoPlugin, PluginHostInfo, PluginLogger } from "./types.js";

const HOST: PluginHostInfo = {
  packageName: "@alistigo/artifact-list",
  version: "1.0.0",
  locale: "en",
  environment: "test",
};

function makeLogger(): PluginLogger & { errors: unknown[] } {
  const errors: unknown[] = [];
  return {
    errors,
    info: () => {},
    error: (obj) => {
      errors.push(obj);
    },
  };
}

describe("createPluginBus", () => {
  it("delivers emitted events to subscribed handlers", () => {
    const bus = createPluginBus();
    const received: unknown[] = [];
    bus.on("widget:displayed", (payload) => received.push(payload));
    bus.emit("widget:displayed", { locale: "en", storageType: "memory", version: "1.0.0" });
    expect(received).toEqual([{ locale: "en", storageType: "memory", version: "1.0.0" }]);
  });

  it("stops delivering events after unsubscribe", () => {
    const bus = createPluginBus();
    const received: unknown[] = [];
    const off = bus.on("widget:displayed", (payload) => received.push(payload));
    off();
    bus.emit("widget:displayed", { locale: "en", storageType: "memory", version: "1.0.0" });
    expect(received).toEqual([]);
  });

  it("does not throw when emitting an event with no subscribers", () => {
    const bus = createPluginBus();
    expect(() => bus.emit("error:uncaught", { error: new Error("boom") })).not.toThrow();
  });
});

describe("createPluginRuntime", () => {
  it("invokes setup on every plugin with its own config slice", async () => {
    const seen: Record<string, unknown>[] = [];
    const pluginA: AlistigoPlugin = {
      name: "plugin-a",
      setup: (ctx) => {
        seen.push(ctx.config);
      },
    };
    const runtime = createPluginRuntime([pluginA], HOST, makeLogger(), {
      "plugin-a": { foo: "bar" },
    });
    await runtime.setup();
    expect(seen).toEqual([{ foo: "bar" }]);
  });

  it("continues to the next plugin when one plugin's hook throws", async () => {
    const calls: string[] = [];
    const throwing: AlistigoPlugin = {
      name: "throwing",
      setup: () => {
        throw new Error("boom");
      },
    };
    const fine: AlistigoPlugin = {
      name: "fine",
      setup: () => {
        calls.push("fine");
      },
    };
    const logger = makeLogger();
    const runtime = createPluginRuntime([throwing, fine], HOST, logger, {});
    await runtime.setup();
    expect(calls).toEqual(["fine"]);
    expect(logger.errors.length).toBe(1);
  });

  it("runs plugin hooks in configByPlugin insertion order", async () => {
    const order: string[] = [];
    const pluginA: AlistigoPlugin = {
      name: "a",
      setup: () => {
        order.push("a");
      },
    };
    const pluginB: AlistigoPlugin = {
      name: "b",
      setup: () => {
        order.push("b");
      },
    };
    const runtime = createPluginRuntime([pluginA, pluginB], HOST, makeLogger(), {});
    await runtime.setup();
    expect(order).toEqual(["a", "b"]);
  });

  it("lets a plugin react to an emitted event via ctx.on", async () => {
    const received: unknown[] = [];
    const plugin: AlistigoPlugin = {
      name: "listener",
      setup: (ctx) => {
        ctx.on("error:uncaught", (payload) => received.push(payload));
      },
    };
    const runtime = createPluginRuntime([plugin], HOST, makeLogger(), {});
    await runtime.setup();
    runtime.bus.emit("error:uncaught", { error: new Error("x") });
    expect(received.length).toBe(1);
  });

  it("exposes loadedPluginNames", () => {
    const plugin: AlistigoPlugin = { name: "solo" };
    const runtime = createPluginRuntime([plugin], HOST, makeLogger(), {});
    expect(runtime.loadedPluginNames).toEqual(["solo"]);
  });

  it("continues wrapping with remaining plugins when one wrapRoot throws", () => {
    const throwing: AlistigoPlugin = {
      name: "throwing",
      wrapRoot: () => {
        throw new Error("boom");
      },
    };
    const wrapping: AlistigoPlugin = {
      name: "wrapping",
      wrapRoot: (tree) => `wrapped(${String(tree)})`,
    };
    const logger = makeLogger();
    const runtime = createPluginRuntime([throwing, wrapping], HOST, logger, {});
    const result = runtime.wrapRoot("tree");
    expect(result).toBe("wrapped(tree)");
    expect(logger.errors.length).toBe(1);
  });
});
