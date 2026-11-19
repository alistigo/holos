import { describe, expect, it } from "bun:test";
import type { PlaygroundCatalog } from "./playground-config";
import { parseUrlOverrides, URL_PARAM_ARTIFACT, URL_PARAM_SOURCE } from "./playground-url";

const catalog: PlaygroundCatalog = {
  knownApps: [
    "@alistigo/artifact-list",
    "@alistigo/artifact-ai-draw-comments",
    "@alistigo/artifact-claude-capabilities-demo",
  ],
  pluginsFor: () => [],
  documentNames: [],
  modeSelectable: true,
};

/** A production build: the Source field is not rendered, so `mode` is not addressable. */
const prodCatalog: PlaygroundCatalog = { ...catalog, modeSelectable: false };

/** Two artifacts whose stripped names collide, so the short form is ambiguous. */
const ambiguous: PlaygroundCatalog = {
  ...catalog,
  knownApps: ["@alistigo/artifact-list", "@other/artifact-list"],
};

describe("parameter names", () => {
  it("are the ones the public URL contract documents", () => {
    expect(URL_PARAM_ARTIFACT).toBe("artifact");
    expect(URL_PARAM_SOURCE).toBe("source");
  });
});

describe("parseUrlOverrides — artifact", () => {
  it("resolves an exact registry key", () => {
    expect(parseUrlOverrides("?artifact=@alistigo/artifact-list", catalog).app).toBe(
      "@alistigo/artifact-list",
    );
  });

  it("resolves the scope-stripped short form", () => {
    expect(parseUrlOverrides("?artifact=artifact-list", catalog).app).toBe(
      "@alistigo/artifact-list",
    );
  });

  it("resolves the bare suffix", () => {
    expect(parseUrlOverrides("?artifact=list", catalog).app).toBe("@alistigo/artifact-list");
    expect(parseUrlOverrides("?artifact=ai-draw-comments", catalog).app).toBe(
      "@alistigo/artifact-ai-draw-comments",
    );
  });

  // U-3
  it("ignores case and surrounding whitespace", () => {
    expect(parseUrlOverrides("?artifact=%20LIST%20", catalog).app).toBe("@alistigo/artifact-list");
    expect(parseUrlOverrides("?artifact=@ALISTIGO/Artifact-List", catalog).app).toBe(
      "@alistigo/artifact-list",
    );
  });

  // U-3 — the decoded value is what gets matched
  it("matches the URL-decoded value", () => {
    expect(parseUrlOverrides("?artifact=%40alistigo%2Fartifact-list", catalog).app).toBe(
      "@alistigo/artifact-list",
    );
  });

  // U-2 / FR-010
  it("omits an artifact the playground does not offer", () => {
    expect(parseUrlOverrides("?artifact=nope", catalog)).not.toHaveProperty("app");
    expect(parseUrlOverrides("?artifact=", catalog)).not.toHaveProperty("app");
  });

  it("omits an ambiguous short form rather than guessing", () => {
    expect(parseUrlOverrides("?artifact=list", ambiguous)).not.toHaveProperty("app");
    // the exact key stays resolvable even when the short form is ambiguous
    expect(parseUrlOverrides("?artifact=@other/artifact-list", ambiguous).app).toBe(
      "@other/artifact-list",
    );
  });
});

describe("parseUrlOverrides — source", () => {
  it("resolves dev", () => {
    expect(parseUrlOverrides("?source=dev", catalog).mode).toBe("dev");
  });

  it("resolves prod-local and its spelling variants", () => {
    expect(parseUrlOverrides("?source=prod-local", catalog).mode).toBe("prod-local");
    expect(parseUrlOverrides("?source=prod%20local", catalog).mode).toBe("prod-local");
    expect(parseUrlOverrides("?source=prod_local", catalog).mode).toBe("prod-local");
    expect(parseUrlOverrides("?source=PROD-LOCAL", catalog).mode).toBe("prod-local");
  });

  // FR-008 / FR-010
  it("omits an unknown source", () => {
    expect(parseUrlOverrides("?source=staging", catalog)).not.toHaveProperty("mode");
  });

  // U-2 / data-model R-9 — inert where the Source field is not offered
  it("omits mode entirely in a production build", () => {
    expect(parseUrlOverrides("?source=prod-local", prodCatalog)).not.toHaveProperty("mode");
    expect(parseUrlOverrides("?source=dev", prodCatalog)).not.toHaveProperty("mode");
  });
});

describe("parseUrlOverrides — shape", () => {
  // U-1
  it("returns {} for an empty search string", () => {
    expect(parseUrlOverrides("", catalog)).toEqual({});
    expect(parseUrlOverrides("?", catalog)).toEqual({});
  });

  it("accepts a search string with or without the leading question mark", () => {
    expect(parseUrlOverrides("artifact=list", catalog).app).toBe("@alistigo/artifact-list");
  });

  // U-4
  it("uses the first occurrence of a repeated parameter", () => {
    expect(parseUrlOverrides("?artifact=list&artifact=ai-draw-comments", catalog).app).toBe(
      "@alistigo/artifact-list",
    );
    expect(parseUrlOverrides("?source=dev&source=prod-local", catalog).mode).toBe("dev");
  });

  // U-5
  it("returns only app and mode, whatever else the address carries", () => {
    const overrides = parseUrlOverrides("?artifact=list&source=dev&lang=fr&readonly=true", catalog);
    expect(Object.keys(overrides).sort()).toEqual(["app", "mode"]);
  });

  it("resolves both parameters together", () => {
    expect(parseUrlOverrides("?artifact=list&source=prod-local", catalog)).toEqual({
      app: "@alistigo/artifact-list",
      mode: "prod-local",
    });
  });

  it("never throws on a malformed search string", () => {
    expect(() => parseUrlOverrides("?%", catalog)).not.toThrow();
    expect(() => parseUrlOverrides("?artifact=%E0%A4%A", catalog)).not.toThrow();
  });
});
