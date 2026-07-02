import { describe, expect, it } from "bun:test";
import { type EvalQuery, evalQueriesSchema, parseEvalQueries } from "./eval.js";

describe("evalQueriesSchema", () => {
  it("declares the same required fields that parseEvalQueries enforces", () => {
    expect(evalQueriesSchema.items.required).toEqual(["query", "should_trigger", "split"]);
    expect(evalQueriesSchema.items.properties.split.enum).toEqual(["train", "validation"]);
  });
});

describe("parseEvalQueries", () => {
  it("accepts a valid array of queries", () => {
    const raw: EvalQuery[] = [
      { query: "hello", should_trigger: true, split: "train" },
      { query: "world", should_trigger: false, split: "validation" },
    ];
    expect(parseEvalQueries(raw, "queries.json")).toEqual(raw);
  });

  it("throws when the root is not an array", () => {
    expect(() => parseEvalQueries({ query: "hello" }, "queries.json")).toThrow(
      "queries.json: expected a JSON array of queries",
    );
  });

  it("throws when an item is not an object", () => {
    expect(() => parseEvalQueries(["not an object"], "queries.json")).toThrow(
      "queries.json[0]: expected an object",
    );
  });

  it("throws when query is missing or empty", () => {
    expect(() =>
      parseEvalQueries([{ query: "", should_trigger: true, split: "train" }], "queries.json"),
    ).toThrow("queries.json[0].query: expected a non-empty string");
  });

  it("throws when should_trigger is not a boolean", () => {
    expect(() =>
      parseEvalQueries([{ query: "hello", should_trigger: "yes", split: "train" }], "queries.json"),
    ).toThrow("queries.json[0].should_trigger: expected a boolean");
  });

  it("throws when split is not train or validation", () => {
    expect(() =>
      parseEvalQueries([{ query: "hello", should_trigger: true, split: "test" }], "queries.json"),
    ).toThrow('queries.json[0].split: expected "train" or "validation"');
  });

  it("reports the index of the failing item in a larger array", () => {
    const raw = [
      { query: "ok", should_trigger: true, split: "train" },
      { query: "bad", should_trigger: true, split: "nope" },
    ];
    expect(() => parseEvalQueries(raw, "queries.json")).toThrow("queries.json[1].split");
  });
});
