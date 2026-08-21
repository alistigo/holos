import { describe, expect, test } from "bun:test";
import { deserializeUser, serializeUser } from "./user.js";

const VALID_USER = {
  id: "usr_01",
  pseudo: "FrostyPanda42",
  avatar: "data:image/svg+xml;base64,abc",
};

describe("serializeUser", () => {
  test("returns a plain object with id, pseudo, avatar", () => {
    const result = serializeUser(VALID_USER);
    expect(result).toEqual({
      id: "usr_01",
      pseudo: "FrostyPanda42",
      avatar: "data:image/svg+xml;base64,abc",
    });
  });

  test("round-trips through deserializeUser", () => {
    const serialized = serializeUser(VALID_USER);
    expect(deserializeUser(serialized)).toEqual(VALID_USER);
  });
});

describe("deserializeUser", () => {
  test("returns null for null", () => {
    expect(deserializeUser(null)).toBeNull();
  });

  test("returns null for a non-object", () => {
    expect(deserializeUser("string")).toBeNull();
    expect(deserializeUser(42)).toBeNull();
  });

  test("returns null when a required field is missing", () => {
    expect(deserializeUser({ id: "x", pseudo: "y" })).toBeNull();
    expect(deserializeUser({ id: "x", avatar: "z" })).toBeNull();
    expect(deserializeUser({ pseudo: "y", avatar: "z" })).toBeNull();
  });

  test("returns null when a field has the wrong type", () => {
    expect(deserializeUser({ id: 1, pseudo: "y", avatar: "z" })).toBeNull();
    expect(deserializeUser({ id: "x", pseudo: null, avatar: "z" })).toBeNull();
  });

  test("returns the User when all fields are valid strings", () => {
    const result = deserializeUser(VALID_USER);
    expect(result).toEqual(VALID_USER);
  });
});
