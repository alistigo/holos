import { describe, expect, test } from "bun:test";
import { generateAvatar, generateDefaultUser, generatePseudo } from "./generate.js";

describe("generatePseudo", () => {
  test("returns a non-empty string", () => {
    expect(generatePseudo("some-seed")).toBeTruthy();
  });

  test("is deterministic — same seed gives same pseudo", () => {
    expect(generatePseudo("abc")).toBe(generatePseudo("abc"));
  });

  test("different seeds produce different pseudos", () => {
    const a = generatePseudo("seed-a");
    const b = generatePseudo("seed-b");
    expect(a).not.toBe(b);
  });

  test("result ends with a two-digit number (10–99)", () => {
    const pseudo = generatePseudo("test");
    const digits = pseudo.match(/\d+$/)?.[0] ?? "";
    const n = Number(digits);
    expect(n).toBeGreaterThanOrEqual(10);
    expect(n).toBeLessThanOrEqual(99);
  });
});

describe("generateAvatar", () => {
  test("returns a data URL with SVG mime type", () => {
    const url = generateAvatar("test-seed");
    expect(url.startsWith("data:image/svg+xml;base64,")).toBe(true);
  });

  test("is deterministic — same seed gives same avatar", () => {
    expect(generateAvatar("abc")).toBe(generateAvatar("abc"));
  });
});

describe("generateDefaultUser", () => {
  test("returns a User with non-empty id, pseudo, and avatar", () => {
    const user = generateDefaultUser();
    expect(user.id).toBeTruthy();
    expect(user.pseudo).toBeTruthy();
    expect(user.avatar).toBeTruthy();
  });

  test("id begins with the 'usr_' prefix", () => {
    const { id } = generateDefaultUser();
    expect(id.startsWith("usr_")).toBe(true);
  });

  test("each call produces a unique id", () => {
    expect(generateDefaultUser().id).not.toBe(generateDefaultUser().id);
  });
});
