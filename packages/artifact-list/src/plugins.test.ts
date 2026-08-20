import { describe, expect, it, mock } from "bun:test";

const fakePluginA = { name: "plugin-a" };

await mock.module("@alistigo/artifact-plugin-api", () => ({
  loadPlugin: mock(async (packageName: string) => {
    if (packageName === "plugin-a") return fakePluginA;
    throw new Error(`cannot load ${packageName}`);
  }),
}));

const { buildPluginSpec, loadPlugins } = await import("./plugins.js");

describe("buildPluginSpec", () => {
  it("always includes default storage plugins first", () => {
    const spec = buildPluginSpec();
    const keys = Object.keys(spec);
    expect(keys[0]).toBe("@alistigo/claude-storage-plugin");
    expect(keys[1]).toBe("@alistigo/local-storage-plugin");
  });

  it("always includes artifact-user-plugin after storage plugins", () => {
    const spec = buildPluginSpec();
    const keys = Object.keys(spec);
    const userIdx = keys.indexOf("@alistigo/artifact-user-plugin");
    expect(userIdx).toBeGreaterThan(1);
  });

  it("user-supplied spec can override default plugin config", () => {
    const spec = buildPluginSpec({ "@alistigo/claude-storage-plugin": { foo: "bar" } });
    expect(spec["@alistigo/claude-storage-plugin"]).toEqual({ foo: "bar" });
  });

  it("user-supplied spec can opt out of a default feature plugin", () => {
    const spec = buildPluginSpec({ "@alistigo/artifact-user-plugin": { disabled: true } });
    expect(spec["@alistigo/artifact-user-plugin"]).toEqual({ disabled: true });
    const keys = Object.keys(spec);
    expect(keys.filter((k) => k === "@alistigo/artifact-user-plugin")).toHaveLength(1);
  });
});

describe("loadPlugins", () => {
  it("returns an empty array when spec is undefined", async () => {
    expect(await loadPlugins(undefined)).toEqual([]);
  });

  it("returns an empty array when spec is empty", async () => {
    expect(await loadPlugins({})).toEqual([]);
  });

  it("loads a plugin successfully", async () => {
    const plugins = await loadPlugins({ "plugin-a": {} });
    expect(plugins).toEqual([fakePluginA]);
  });

  it("drops a plugin that fails to load, without throwing", async () => {
    const plugins = await loadPlugins({ "plugin-a": {}, "plugin-b": {} });
    expect(plugins).toEqual([fakePluginA]);
  });

  it("does not throw when every plugin fails to load", async () => {
    const plugins = await loadPlugins({ "plugin-b": {}, "plugin-c": {} });
    expect(plugins).toEqual([]);
  });
});
