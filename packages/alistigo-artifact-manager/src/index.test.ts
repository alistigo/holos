import { beforeEach, describe, expect, it } from "bun:test";
import init from "./init.js";
import { ARTIFACT_REGISTRY } from "./registry.js";

// Minimal DOM mock — Bun's test runner has no DOM
const appendedScripts: Array<{ tag: string; src: string }> = [];

let mockElement: { id: string; tag: string } = { id: "app", tag: "div" };
let querySelectorResult: { id: string; tag: string } | null = mockElement;

globalThis.document = {
  createElement: (tag: string) => ({ tag, src: "" }) as unknown as HTMLScriptElement,
  head: {
    appendChild: (el: HTMLScriptElement) => {
      appendedScripts.push(el as unknown as { tag: string; src: string });
    },
  },
  querySelector: (_selector: string) => querySelectorResult as unknown as Element | null,
} as unknown as Document;

describe("ARTIFACT_REGISTRY", () => {
  it("contains @alistigo/artifact-list entry", () => {
    expect(ARTIFACT_REGISTRY["@alistigo/artifact-list"]).toBeDefined();
    expect(ARTIFACT_REGISTRY["@alistigo/artifact-list"]).toContain("cdn.jsdelivr.net");
    expect(ARTIFACT_REGISTRY["@alistigo/artifact-list"]).toContain("artifact-list");
  });
});

describe("init", () => {
  beforeEach(() => {
    appendedScripts.length = 0;
    mockElement = { id: "app", tag: "div" };
    querySelectorResult = mockElement;
  });

  it("injects a script tag with the correct src for a valid config", () => {
    init("#app", { app: "@alistigo/artifact-list" });

    expect(appendedScripts).toHaveLength(1);
    expect(appendedScripts[0]?.src).toBe(ARTIFACT_REGISTRY["@alistigo/artifact-list"]);
  });

  it("sets id='app' on the target element when its id differs", () => {
    mockElement = { id: "my-container", tag: "div" };
    querySelectorResult = mockElement;

    init("#my-container", { app: "@alistigo/artifact-list" });

    expect(mockElement.id).toBe("app");
    expect(appendedScripts).toHaveLength(1);
  });

  it("leaves id unchanged when target already has id='app'", () => {
    mockElement = { id: "app", tag: "div" };
    querySelectorResult = mockElement;

    init("#app", { app: "@alistigo/artifact-list" });

    expect(mockElement.id).toBe("app");
  });

  it("throws when selector matches nothing", () => {
    querySelectorResult = null;

    expect(() => init("#missing", { app: "@alistigo/artifact-list" })).toThrow(
      'no element matches selector "#missing"',
    );
  });

  it("throws when app is not in the artifact registry", () => {
    expect(() => init("#app", { app: "@alistigo/artifact-unknown" })).toThrow(
      "Unknown artifact type",
    );
  });

  it("throws when config is missing the app field", () => {
    expect(() => init("#app", { lang: "en" })).toThrow(/missing required field "app"/);
  });

  it("throws when config is not an object", () => {
    expect(() => init("#app", "not-an-object")).toThrow(/non-null object/);
  });

  it("throws when config is null", () => {
    expect(() => init("#app", null)).toThrow(/non-null object/);
  });

  it("throws when app is an empty string", () => {
    expect(() => init("#app", { app: "" })).toThrow(/"app" must be a non-empty string/);
  });
});
