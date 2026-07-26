import { afterEach, describe, expect, it } from "bun:test";
import { resolvePluginUrl } from "./loader.js";

type OverridableGlobal = typeof globalThis & {
  __ALISTIGO_PLUGIN_URL_OVERRIDES__?: Record<string, string>;
};

afterEach(() => {
  delete (globalThis as OverridableGlobal).__ALISTIGO_PLUGIN_URL_OVERRIDES__;
});

describe("resolvePluginUrl", () => {
  it("builds a jsDelivr URL pinned to major version 0", () => {
    expect(resolvePluginUrl("@alistigo/artifact-sentry-plugin")).toBe(
      "https://cdn.jsdelivr.net/npm/@alistigo/artifact-sentry-plugin@0/dist/index.js",
    );
  });

  it("works for any package name, not just @alistigo scoped ones", () => {
    expect(resolvePluginUrl("some-plugin")).toBe(
      "https://cdn.jsdelivr.net/npm/some-plugin@0/dist/index.js",
    );
  });

  it("returns the override URL when one is set for the package", () => {
    (globalThis as OverridableGlobal).__ALISTIGO_PLUGIN_URL_OVERRIDES__ = {
      "@alistigo/claude-storage-plugin": "http://localhost:5173/@fs/repo/packages/foo/src/index.ts",
    };
    expect(resolvePluginUrl("@alistigo/claude-storage-plugin")).toBe(
      "http://localhost:5173/@fs/repo/packages/foo/src/index.ts",
    );
  });

  it("falls back to the jsDelivr URL when the override map doesn't cover the package", () => {
    (globalThis as OverridableGlobal).__ALISTIGO_PLUGIN_URL_OVERRIDES__ = {
      "@alistigo/local-storage-plugin": "http://localhost:5173/@fs/repo/packages/bar/src/index.ts",
    };
    expect(resolvePluginUrl("@alistigo/claude-storage-plugin")).toBe(
      "https://cdn.jsdelivr.net/npm/@alistigo/claude-storage-plugin@0/dist/index.js",
    );
  });
});
