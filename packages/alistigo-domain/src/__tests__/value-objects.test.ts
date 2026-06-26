import { describe, expect, it } from "bun:test";
import { ListError } from "../errors/list-error.js";
import { parseActorId } from "../value-objects/actor-id.js";
import { createListElementContent } from "../value-objects/list-element-content.js";
import { parseListElementId } from "../value-objects/list-element-id.js";
import { parseListEventId } from "../value-objects/list-event-id.js";
import { parseListId } from "../value-objects/list-id.js";
import { CURRENT_SCHEMA_VERSION, createSchemaVersion } from "../value-objects/schema-version.js";
import { createTimestamp } from "../value-objects/timestamp.js";

describe("ListElementContent", () => {
  it("accepts non-empty trimmed string", () => {
    const content = createListElementContent("Buy milk");
    expect(content as string).toBe("Buy milk");
  });

  it("trims surrounding whitespace", () => {
    const content = createListElementContent("  Buy milk  ");
    expect(content as string).toBe("Buy milk");
  });

  it("throws ListError on empty string", () => {
    expect(() => createListElementContent("")).toThrow(ListError);
  });

  it("throws ListError on whitespace-only string", () => {
    expect(() => createListElementContent("   ")).toThrow(ListError);
  });

  it("throws ListError when exceeding 2000 characters", () => {
    const long = "a".repeat(2001);
    expect(() => createListElementContent(long)).toThrow(ListError);
  });

  it("accepts a string of exactly 2000 characters", () => {
    const exact = "a".repeat(2000);
    expect(() => createListElementContent(exact)).not.toThrow();
  });
});

describe("Timestamp", () => {
  it("accepts a valid ISO 8601 UTC string", () => {
    const ts = createTimestamp("2026-05-14T10:00:00Z");
    expect(ts as string).toBe("2026-05-14T10:00:00Z");
  });

  it("throws ListError on invalid date string", () => {
    expect(() => createTimestamp("not-a-date")).toThrow(ListError);
  });
});

describe("SchemaVersion", () => {
  it("accepts a valid semver string", () => {
    const v = createSchemaVersion("1.0.0");
    expect(v).toBe("1.0.0");
  });

  it("throws ListError on non-semver string", () => {
    expect(() => createSchemaVersion("1.0")).toThrow(ListError);
    expect(() => createSchemaVersion("v1.0.0")).toThrow(ListError);
  });

  it("exports the correct M1 version", () => {
    expect(CURRENT_SCHEMA_VERSION).toBe("1.0.0");
  });
});

describe("TypeID value objects", () => {
  it("parseListId parses a valid lst TypeID string", () => {
    const id = parseListId("lst_00000000000000000000000001");
    expect(id.getType()).toBe("lst");
  });

  it("parseListId throws on wrong prefix", () => {
    expect(() => parseListId("lse_00000000000000000000000001")).toThrow();
  });

  it("parseListElementId parses a valid lse TypeID string", () => {
    const id = parseListElementId("lse_00000000000000000000000001");
    expect(id.getType()).toBe("lse");
  });

  it("parseListEventId parses a valid lev TypeID string", () => {
    const id = parseListEventId("lev_00000000000000000000000001");
    expect(id.getType()).toBe("lev");
  });

  it("parseActorId parses a valid act TypeID string", () => {
    const id = parseActorId("act_00000000000000000000000001");
    expect(id.getType()).toBe("act");
  });
});
