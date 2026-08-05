import { describe, expect, it } from "bun:test";
import { withStorageRetry } from "./retry.js";

// Use a very short timeout (10 ms) so tests complete in milliseconds.
const T = 10;

describe("withStorageRetry", () => {
  it("resolves immediately when the factory succeeds on first attempt", async () => {
    const result = await withStorageRetry(() => Promise.resolve(42), T);
    expect(result).toBe(42);
  });

  it("throws immediately on a non-timeout error without retrying", async () => {
    let calls = 0;
    await expect(
      withStorageRetry(() => {
        calls++;
        return Promise.reject(new Error("key not found"));
      }, T),
    ).rejects.toThrow("key not found");
    expect(calls).toBe(1);
  });

  it("retries on timeout and succeeds on second attempt", async () => {
    let calls = 0;
    const result = await withStorageRetry(() => {
      calls++;
      if (calls < 2) {
        return new Promise<number>(() => {}); // never resolves → timeout fires
      }
      return Promise.resolve(99);
    }, T);
    expect(calls).toBe(2);
    expect(result).toBe(99);
  });

  it("throws after exhausting all 3 retries (4 total attempts)", async () => {
    let calls = 0;
    await expect(
      withStorageRetry(() => {
        calls++;
        return new Promise<never>(() => {}); // never resolves
      }, T),
    ).rejects.toThrow("timed out");
    expect(calls).toBe(4); // 1 original + 3 retries
  });
});
