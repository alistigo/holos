import { describe, expect, it, mock } from "bun:test";

const fakePluginA = { name: "plugin-a" };

await mock.module("@alistigo/artifact-plugin-api", () => ({
  loadPlugin: mock(async (packageName: string) => {
    if (packageName === "plugin-a") return fakePluginA;
    throw new Error(`cannot load ${packageName}`);
  }),
}));

const { loadPlugins } = await import("./plugins.js");

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
