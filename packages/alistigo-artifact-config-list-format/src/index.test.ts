import { describe, expect, it } from "bun:test";
import { listConfigSchema, validateListConfig } from "./index.js";

describe("validateListConfig", () => {
  describe("valid configs", () => {
    it("accepts readonly=true", () => {
      const result = validateListConfig({ readonly: true });
      expect(result).toEqual({ readonly: true });
    });

    it("accepts readonly=false", () => {
      const result = validateListConfig({ readonly: false });
      expect(result).toEqual({ readonly: false });
    });

    it("defaults readonly to false when the field is missing", () => {
      const result = validateListConfig({});
      expect(result).toEqual({ readonly: false });
    });

    it("treats null as empty config (defaults apply)", () => {
      const result = validateListConfig(null);
      expect(result).toEqual({ readonly: false });
    });

    it("ignores extra fields and returns only list-relevant fields", () => {
      const result = validateListConfig({ readonly: true, app: "alistigo", lang: "en" });
      expect(result).toEqual({ readonly: true });
      expect(result).not.toHaveProperty("app");
      expect(result).not.toHaveProperty("lang");
    });

    it("ignores unknown extra fields with no readonly field", () => {
      const result = validateListConfig({ app: "alistigo", someOtherField: 42 });
      expect(result).toEqual({ readonly: false });
    });
  });

  describe("invalid configs", () => {
    it("throws if input is a string", () => {
      expect(() => validateListConfig("true")).toThrow(TypeError);
    });

    it("throws if input is a number", () => {
      expect(() => validateListConfig(42)).toThrow(TypeError);
    });

    it("throws if input is a boolean", () => {
      expect(() => validateListConfig(true)).toThrow(TypeError);
    });

    it("throws if input is an array", () => {
      expect(() => validateListConfig([])).toThrow(TypeError);
    });

    it("throws if readonly is a string instead of boolean", () => {
      expect(() => validateListConfig({ readonly: "true" })).toThrow(TypeError);
    });

    it("throws if readonly is a number instead of boolean", () => {
      expect(() => validateListConfig({ readonly: 1 })).toThrow(TypeError);
    });

    it("throws if readonly is null", () => {
      expect(() => validateListConfig({ readonly: null })).toThrow(TypeError);
    });
  });
});

describe("listConfigSchema", () => {
  it("exports the JSON Schema object", () => {
    expect(listConfigSchema).toBeDefined();
    expect(listConfigSchema.$schema).toBe("http://json-schema.org/draft-07/schema#");
    expect(listConfigSchema.type).toBe("object");
  });

  it("schema has readonly property defined", () => {
    expect(listConfigSchema.properties.readonly).toEqual({ type: "boolean", default: false });
  });

  it("schema forbids additional properties", () => {
    expect(listConfigSchema.additionalProperties).toBe(false);
  });
});
