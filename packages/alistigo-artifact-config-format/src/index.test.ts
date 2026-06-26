import { describe, expect, it } from "bun:test";
import { artifactConfigSchema, KNOWN_ARTIFACTS, validateArtifactConfig } from "./index.js";

describe("validateArtifactConfig", () => {
  describe("valid list config", () => {
    it("accepts a minimal list config with app only", () => {
      const result = validateArtifactConfig({ app: "@alistigo/artifact-list" });
      expect(result.app).toBe("@alistigo/artifact-list");
      expect(result.readonly).toBe(false);
    });

    it("accepts a full list config with readonly=true", () => {
      const result = validateArtifactConfig({
        app: "@alistigo/artifact-list",
        readonly: true,
      });
      expect(result.app).toBe("@alistigo/artifact-list");
      expect(result.readonly).toBe(true);
    });

    it("accepts a list config with lang field", () => {
      const result = validateArtifactConfig({
        app: "@alistigo/artifact-list",
        lang: "en-NL",
        readonly: false,
      });
      expect(result.app).toBe("@alistigo/artifact-list");
      expect(result.lang).toBe("en-NL");
      expect(result.readonly).toBe(false);
    });

    it("defaults readonly to false when omitted", () => {
      const result = validateArtifactConfig({
        app: "@alistigo/artifact-list",
        lang: "nl",
      });
      expect(result.readonly).toBe(false);
    });
  });

  describe("unknown app throws with actionable message", () => {
    it("throws Error for an unknown artifact type", () => {
      expect(() => validateArtifactConfig({ app: "@alistigo/artifact-unknown" })).toThrow(Error);
    });

    it("error message names the unknown type", () => {
      expect(() => validateArtifactConfig({ app: "@alistigo/artifact-unknown" })).toThrow(
        "@alistigo/artifact-unknown",
      );
    });

    it("error message lists known types", () => {
      expect(() => validateArtifactConfig({ app: "@alistigo/artifact-unknown" })).toThrow(
        "@alistigo/artifact-list",
      );
    });

    it("error message uses 'Unknown artifact type' prefix", () => {
      expect(() => validateArtifactConfig({ app: "@alistigo/artifact-unknown" })).toThrow(
        "Unknown artifact type",
      );
    });
  });

  describe("missing required 'app' throws", () => {
    it("throws TypeError when app is missing", () => {
      expect(() => validateArtifactConfig({ lang: "en" })).toThrow(TypeError);
    });

    it("throws TypeError when app is empty string", () => {
      expect(() => validateArtifactConfig({ app: "" })).toThrow(TypeError);
    });

    it("throws TypeError when app is a number", () => {
      expect(() => validateArtifactConfig({ app: 42 })).toThrow(TypeError);
    });
  });

  describe("invalid config shapes throw", () => {
    it("throws TypeError for null input", () => {
      expect(() => validateArtifactConfig(null)).toThrow(TypeError);
    });

    it("throws TypeError for array input", () => {
      expect(() => validateArtifactConfig([])).toThrow(TypeError);
    });

    it("throws TypeError for string input", () => {
      expect(() => validateArtifactConfig("config")).toThrow(TypeError);
    });

    it("throws TypeError for number input", () => {
      expect(() => validateArtifactConfig(42)).toThrow(TypeError);
    });

    it("throws TypeError when lang is not a string", () => {
      expect(() => validateArtifactConfig({ app: "@alistigo/artifact-list", lang: 42 })).toThrow(
        TypeError,
      );
    });

    it("throws TypeError when readonly is not a boolean on a list config", () => {
      expect(() =>
        validateArtifactConfig({
          app: "@alistigo/artifact-list",
          readonly: "true",
        }),
      ).toThrow(TypeError);
    });
  });
});

describe("KNOWN_ARTIFACTS", () => {
  it("contains @alistigo/artifact-list", () => {
    expect(KNOWN_ARTIFACTS).toContain("@alistigo/artifact-list");
  });
});

describe("artifactConfigSchema", () => {
  it("exports the JSON Schema object", () => {
    expect(artifactConfigSchema).toBeDefined();
    expect(artifactConfigSchema.$schema).toBe("http://json-schema.org/draft-07/schema#");
    expect(artifactConfigSchema.type).toBe("object");
  });

  it("requires the app field", () => {
    expect(artifactConfigSchema.required).toContain("app");
  });

  it("has if/then/else for discriminated union", () => {
    expect(artifactConfigSchema.if).toBeDefined();
    expect(artifactConfigSchema.then).toBeDefined();
    expect(artifactConfigSchema.else).toBeDefined();
  });
});
