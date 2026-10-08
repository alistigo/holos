import { spawnSync } from "node:child_process";

export type CheckStatus = "ok" | "warn" | "fail" | "skip";

export interface CheckResult {
  title: string;
  status: CheckStatus;
  detail: string;
  /** Steps to fix, shown when status is warn or fail. */
  fix: string[];
}

const NPMJS_REGISTRY = "https://registry.npmjs.org/";
// biome-ignore lint/suspicious/noTemplateCurlyInString: literal .npmrc placeholder that npm expands itself
const AUTH_LINE = "//registry.npmjs.org/:_authToken=${NPM_TOKEN}";
const BYPASS_2FA_NOTICE = "https://gh.io/npm-gat-bypass2fa-deprecation";

interface NpmRun {
  ok: boolean;
  stdout: string;
  /** npm error code such as E401 or ENEEDAUTH, when npm reported one. */
  code: string | null;
}

function npm(args: string[]): NpmRun {
  const result = spawnSync("npm", args, { encoding: "utf-8" });
  const output = `${result.stdout ?? ""}\n${result.stderr ?? ""}`;
  return {
    ok: result.error === undefined && result.status === 0,
    stdout: (result.stdout ?? "").trim(),
    code: /npm error code (\w+)/.exec(output)?.[1] ?? (result.error ? "ENOENT" : null),
  };
}

function check(
  title: string,
  status: CheckStatus,
  detail: string,
  fix: string[] = [],
): CheckResult {
  return { title, status, detail, fix };
}

export function checkNpmInstalled(): CheckResult {
  const run = npm(["--version"]);
  if (run.ok) return check("npm CLI", "ok", `npm ${run.stdout}`);
  return check("npm CLI", "fail", "npm was not found on PATH", [
    "Install Node.js (it ships npm), e.g. via `mise install` in this repo.",
  ]);
}

export function checkRegistry(): CheckResult {
  const registry = npm(["config", "get", "registry"]).stdout;
  if (registry === NPMJS_REGISTRY) return check("Registry", "ok", registry);
  return check(
    "Registry",
    "warn",
    `registry is ${registry || "(unknown)"}, not ${NPMJS_REGISTRY}`,
    [
      `Deprecation targets the public registry. Run \`npm config set registry ${NPMJS_REGISTRY}\`,`,
      "or remove the registry override from your .npmrc.",
    ],
  );
}

const TOKEN_SETUP = [
  "Locally: run `npm login`.",
  "With a token (CI or scripted): create a granular access token on npmjs.com",
  "  (Access Tokens → Generate New Token → Granular) with Packages and scopes:",
  "  Read and write on the scope, then:",
  "    export NPM_TOKEN=npm_xxx",
  `    echo '${AUTH_LINE}' >> ~/.npmrc`,
  "  npm only reads the token through that .npmrc line, not from NPM_TOKEN directly.",
];

/** Returns the check plus the npm username when authenticated. */
export function checkAuth(): { result: CheckResult; user: string | null } {
  const run = npm(["whoami"]);
  if (run.ok)
    return {
      result: check("Authentication", "ok", `logged in as ${run.stdout}`),
      user: run.stdout,
    };

  const tokenEnv = process.env.NPM_TOKEN
    ? "NPM_TOKEN is set in the environment"
    : "NPM_TOKEN is not set";
  if (run.code === "E401") {
    return {
      user: null,
      result: check(
        "Authentication",
        "fail",
        `a token is configured but npm rejects it (401). ${tokenEnv}.`,
        [
          "The token is invalid, revoked or expired (npm write tokens expire after at most 90 days).",
          ...TOKEN_SETUP,
          "Replace the old `_authToken` line in ~/.npmrc rather than adding a second one.",
        ],
      ),
    };
  }
  return {
    user: null,
    result: check(
      "Authentication",
      "fail",
      `no npm credentials found (${run.code ?? "unknown error"}). ${tokenEnv}.`,
      TOKEN_SETUP,
    ),
  };
}

/** Checks the current user has read-write access to every package in `targets`. */
export function checkWriteAccess(targets: string[], scope: string): CheckResult {
  const title = `Write access (${targets.length} package(s))`;
  const run = npm(["access", "list", "packages", "--json"]);
  if (!run.ok) {
    return check(
      title,
      "warn",
      `could not list your package access (${run.code ?? "unknown error"})`,
      ["Run `npm access list packages` to see the error."],
    );
  }

  let access: Record<string, string>;
  try {
    access = JSON.parse(run.stdout || "{}") as Record<string, string>;
  } catch {
    return check(title, "warn", "unexpected output from `npm access list packages`");
  }

  const missing = targets.filter((name) => access[name] !== "read-write");
  if (missing.length === 0) return check(title, "ok", "read-write on every package");
  return check(
    title,
    "fail",
    `no read-write access to ${missing.length} package(s): ${missing.join(", ")}`,
    [
      `Ask an owner of the ${scope} org to add you to a team with read-write access to these`,
      "packages (npmjs.com → org → Teams → Packages), or to run the deprecation themselves.",
      "If you authenticate with a granular token, make sure its Packages and scopes",
      `permission is Read and write on ${scope} (or on these packages).`,
    ],
  );
}

export function checkTwoFactor(): CheckResult {
  const run = npm(["profile", "get", "--json"]);
  if (!run.ok) {
    return check(
      "Two-factor auth",
      "warn",
      "could not read your npm profile (granular tokens may not be allowed to)",
      [
        "If your account requires 2FA for writes, either be ready to type a one-time code",
        "for each package, or use a granular token with “Bypass two-factor authentication”.",
        `Note: npm is restricting 2FA-bypass tokens, see ${BYPASS_2FA_NOTICE}`,
      ],
    );
  }

  let mode: string | null = null;
  try {
    const profile = JSON.parse(run.stdout) as { tfa?: { mode?: string } | false | null };
    mode = profile.tfa ? (profile.tfa.mode ?? null) : null;
  } catch {
    return check("Two-factor auth", "warn", "unexpected output from `npm profile get`");
  }

  if (mode === "auth-and-writes") {
    return check(
      "Two-factor auth",
      "warn",
      "2FA is required for writes: npm deprecate will ask for a one-time code",
      [
        "Interactively, npm prompts for the code once per package.",
        "Unattended (CI), use a granular token with “Bypass two-factor authentication”.",
        `Note: npm is restricting 2FA-bypass tokens, see ${BYPASS_2FA_NOTICE}`,
      ],
    );
  }
  return check(
    "Two-factor auth",
    "ok",
    mode ? `2FA mode: ${mode} (writes need no code)` : "2FA disabled",
  );
}
