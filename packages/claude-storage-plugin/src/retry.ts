import { createLogger } from "@alistigo/logger";

const log = createLogger("alistigo:claude-storage:retry");

const STORAGE_TIMEOUT_MS = 1000;
const STORAGE_MAX_RETRIES = 3;

type AttemptResult<T> =
  | { tag: "ok"; value: T }
  | { tag: "timeout" }
  | { tag: "error"; err: unknown };

function attemptWithTimeout<T>(
  factory: () => Promise<T>,
  timeoutMs: number,
): Promise<AttemptResult<T>> {
  return Promise.race([
    factory()
      .then((value): AttemptResult<T> => ({ tag: "ok", value }))
      .catch((err): AttemptResult<T> => ({ tag: "error", err })),
    new Promise<AttemptResult<T>>((resolve) =>
      setTimeout(() => resolve({ tag: "timeout" }), timeoutMs),
    ),
  ]);
}

/**
 * Calls `factory()` and waits up to `timeoutMs` (default 1 s). On timeout retries up to
 * `maxRetries` (default 3) times. Non-timeout errors are re-thrown immediately.
 * After all attempts time out, throws a descriptive error.
 */
export async function withStorageRetry<T>(
  factory: () => Promise<T>,
  timeoutMs = STORAGE_TIMEOUT_MS,
  maxRetries = STORAGE_MAX_RETRIES,
): Promise<T> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const result = await attemptWithTimeout(factory, timeoutMs);
    if (result.tag === "ok") return result.value;
    if (result.tag === "error") throw result.err;
    if (attempt < maxRetries) {
      log.debug({ attempt }, "claude storage timed out, retrying");
    }
  }
  throw new Error(`Claude storage timed out after ${maxRetries + 1} attempts`);
}
