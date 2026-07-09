import { describe, expect, it } from "bun:test";
import { resolvePluginUrl } from "./loader.js";

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
});
