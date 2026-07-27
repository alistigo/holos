/**
 * @experimental
 * Placeholder for future auth plugin extension point.
 * No implementation ships in P0 — typed stub for forward compatibility.
 */
export interface AuthPlugin {
  readonly type: "auth";
  getToken(): Promise<string | undefined>;
}
