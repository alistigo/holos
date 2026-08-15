import { describe, expect, it } from "bun:test";
import { generateActorId, generateListId } from "@alistigo/list-domain";
import {
  buildListDocumentFromMarkdown,
  isValidListMarkdown,
  parseListMarkdown,
} from "../list-markdown.js";

const actorId = generateActorId();

describe("parseListMarkdown", () => {
  it("parses a title-and-items block (dash markers)", () => {
    const md = "Groceries:\n- Buy bread\n- Buy milk\n- Buy eggs";
    const { title, items } = parseListMarkdown(md);
    expect(title).toBe("Groceries");
    expect(items).toEqual(["Buy bread", "Buy milk", "Buy eggs"]);
  });

  it("parses items with asterisk markers", () => {
    const md = "Shopping:\n* Apples\n* Bananas";
    const { title, items } = parseListMarkdown(md);
    expect(title).toBe("Shopping");
    expect(items).toEqual(["Apples", "Bananas"]);
  });

  it("parses an ordered list", () => {
    const md = "Steps:\n1. First step\n2. Second step\n3. Third step";
    const { title, items } = parseListMarkdown(md);
    expect(title).toBe("Steps");
    expect(items).toEqual(["First step", "Second step", "Third step"]);
  });

  it("parses items with no title line", () => {
    const md = "- Item one\n- Item two";
    const { title, items } = parseListMarkdown(md);
    expect(title).toBeUndefined();
    expect(items).toEqual(["Item one", "Item two"]);
  });

  it("parses a title-only block (empty list)", () => {
    const md = "Empty list:";
    const { title, items } = parseListMarkdown(md);
    expect(title).toBe("Empty list");
    expect(items).toHaveLength(0);
  });

  it("trims leading/trailing whitespace from items", () => {
    const md = "List:\n-   Padded item   \n-  Another  ";
    const { items } = parseListMarkdown(md);
    expect(items).toEqual(["Padded item", "Another"]);
  });

  it("skips blank lines and non-list prose lines", () => {
    const md = "My list:\n\nSome prose.\n- Real item\n\n- Another real item";
    const { title, items } = parseListMarkdown(md);
    expect(title).toBe("My list");
    expect(items).toEqual(["Real item", "Another real item"]);
  });

  it("allows duplicate items", () => {
    const md = "Duplicates allowed:\n- Buy bread\n- Buy bread\n- Buy milk";
    const { items } = parseListMarkdown(md);
    expect(items).toEqual(["Buy bread", "Buy bread", "Buy milk"]);
  });

  it("returns empty title and no items for blank markdown", () => {
    const { title, items } = parseListMarkdown("   ");
    expect(title).toBeUndefined();
    expect(items).toHaveLength(0);
  });
});

describe("isValidListMarkdown", () => {
  it("returns true for markdown with a title", () => {
    expect(isValidListMarkdown("My list:")).toBe(true);
  });

  it("returns true for markdown with items but no title", () => {
    expect(isValidListMarkdown("- Item one\n- Item two")).toBe(true);
  });

  it("returns true for markdown with both title and items", () => {
    expect(isValidListMarkdown("Groceries:\n- Milk")).toBe(true);
  });

  it("returns false for blank markdown", () => {
    expect(isValidListMarkdown("")).toBe(false);
    expect(isValidListMarkdown("   \n   ")).toBe(false);
  });

  it("returns false for plain prose with no list markers or title colon", () => {
    expect(isValidListMarkdown("Just some plain text without list markers")).toBe(false);
  });
});

describe("buildListDocumentFromMarkdown", () => {
  // fallow-ignore-next-line complexity
  it("builds a document with title and items from a typical grocery list", () => {
    const md = "Groceries:\n- Buy bread\n- Buy milk\n- Buy eggs";
    const doc = buildListDocumentFromMarkdown(md, actorId);

    expect(doc["@type"]).toBe("ItemList");
    expect(doc.name).toBe("Groceries");
    expect(doc.itemListElement).toHaveLength(3);
    expect(doc.itemListElement[0]?.name).toBe("Buy bread");
    expect(doc.itemListElement[1]?.name).toBe("Buy milk");
    expect(doc.itemListElement[2]?.name).toBe("Buy eggs");
    expect(doc.itemListElement[0]?.position).toBe(1);
    expect(doc.itemListElement[2]?.position).toBe(3);
  });

  it("builds a document without a name when title is absent", () => {
    const md = "- Only items\n- No title";
    const doc = buildListDocumentFromMarkdown(md, actorId);
    expect(doc.name).toBeUndefined();
    expect(doc.itemListElement).toHaveLength(2);
    expect(doc.itemListElement[0]?.name).toBe("Only items");
  });

  it("builds an empty-element document when markdown has only a title", () => {
    const md = "Empty list:";
    const doc = buildListDocumentFromMarkdown(md, actorId);
    expect(doc.name).toBe("Empty list");
    expect(doc.itemListElement).toHaveLength(0);
  });

  it("preserves duplicates", () => {
    const md = "Duplicates allowed:\n- Buy bread\n- Buy bread\n- Buy milk";
    const doc = buildListDocumentFromMarkdown(md, actorId);
    expect(doc.itemListElement).toHaveLength(3);
    expect(doc.itemListElement[0]?.name).toBe("Buy bread");
    expect(doc.itemListElement[1]?.name).toBe("Buy bread");
  });

  it("handles an ordered list", () => {
    const md = "Steps:\n1. First\n2. Second\n3. Third";
    const doc = buildListDocumentFromMarkdown(md, actorId);
    expect(doc.name).toBe("Steps");
    expect(doc.itemListElement.map((i) => i.name)).toEqual(["First", "Second", "Third"]);
  });

  it("uses the provided listId", () => {
    const listId = generateListId();
    const doc = buildListDocumentFromMarkdown("List:\n- Item", actorId, listId);
    expect(doc["alistigo:listId"]).toBe(listId.toString());
  });

  it("generates a listId starting with lst_ when none is given", () => {
    const doc = buildListDocumentFromMarkdown("List:\n- Item", actorId);
    expect(doc["alistigo:listId"]).toMatch(/^lst_/);
  });

  it("event log contains ListCreated plus one ListElementAdded per item", () => {
    const md = "List:\n- A\n- B\n- C";
    const doc = buildListDocumentFromMarkdown(md, actorId);
    expect(doc["alistigo:listEventLog"]).toHaveLength(4); // 1 created + 3 added
    expect(doc["alistigo:listEventLog"][0]?.["alistigo:eventType"]).toBe("ListCreated");
    expect(doc["alistigo:listEventLog"][1]?.["alistigo:eventType"]).toBe("ListElementAdded");
  });
});
