export type CheckStatus = "ok" | "warn" | "fail" | "skip";

export interface CheckResult {
  title: string;
  status: CheckStatus;
  detail: string;
  /** Steps to fix, shown when status is warn or fail. */
  fix: string[];
}

export const CHECK_ICONS: Record<CheckStatus, string> = {
  ok: "✓",
  warn: "!",
  fail: "✗",
  skip: "-",
};

export function check(
  title: string,
  status: CheckStatus,
  detail: string,
  fix: string[] = [],
): CheckResult {
  return { title, status, detail, fix };
}
