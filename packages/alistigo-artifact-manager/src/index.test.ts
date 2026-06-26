import { beforeEach, describe, expect, it } from "bun:test";
import { initArtifactManager } from "./manager.js";
import { ARTIFACT_REGISTRY } from "./registry.js";

// Minimal DOM mock — Bun's test runner has no DOM
const appendedScripts: Array<{ tag: string; src: string }> = [];

globalThis.document = {
  createElement: (tag: string) => ({ tag, src: "" }) as unknown as HTMLScriptElement,
  head: {
    appendChild: (el: HTMLScriptElement) => {
      appendedScripts.push(el as unknown as { tag: string; src: string });
    },
  },
} as unknown as Document;

describe("ARTIFACT_REGISTRY", () => {
  it("contains @alistigo/artifact-list entry", () => {
    expect(ARTIFACT_REGISTRY["@alistigo/artifact-list"]).toBeDefined();
    expect(ARTIFACT_REGISTRY["@alistigo/artifact-list"]).toContain("cdn.jsdelivr.net");
    expect(ARTIFACT_REGISTRY["@alistigo/artifact-list"]).toContain("artifact-list");
  });
});

describe("initArtifactManager", () => {
  beforeEach(() => {
    appendedScripts.length = 0;
  });

  it("injects a script tag with the correct src for a valid config", () => {
    initArtifactManager({ app: "@alistigo/artifact-list" });

    expect(appendedScripts).toHaveLength(1);
    expect(appendedScripts[0]?.src).toBe(ARTIFACT_REGISTRY["@alistigo/artifact-list"]);
  });

  it("throws when app is not in the artifact registry", () => {
    // validateArtifactConfig rejects unknown apps before the registry lookup
    expect(() => initArtifactManager({ app: "@alistigo/artifact-unknown" })).toThrow(
      "Unknown artifact type",
    );
  });

  it("throws when config is missing the app field", () => {
    expect(() => initArtifactManager({ lang: "en" })).toThrow(/missing required field "app"/);
  });

  it("throws when config is not an object", () => {
    expect(() => initArtifactManager("not-an-object")).toThrow(/non-null object/);
  });

  it("throws when config is null", () => {
    expect(() => initArtifactManager(null)).toThrow(/non-null object/);
  });

  it("throws when app is an empty string", () => {
    expect(() => initArtifactManager({ app: "" })).toThrow(/"app" must be a non-empty string/);
  });
});
