import { spawnSync } from "node:child_process";
import { isNxWorkspace, workspaceRoot } from "./list-local-packages.js";
import { fetchCollaborators } from "./list-npm-packages.js";

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

// fallow-ignore-next-line complexity
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

export function checkNxWorkspace(): CheckResult {
  if (isNxWorkspace()) return check("Nx workspace", "ok", workspaceRoot);
  return check(
    "Nx workspace",
    "fail",
    `no nx.json found in ${process.cwd()} or any parent directory`,
    [
      "This tool reads your packages from the Nx project graph. Run it from inside your",
      "Nx monorepo, and install it there: `npm install -D @alistigo/nx-npm-publications`.",
    ],
  );
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
// fallow-ignore-next-line complexity
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

/** Checks `user` is listed with write access on every package in `targets`. */
export async function checkWriteAccess(
  targets: string[],
  scope: string,
  user: string,
): Promise<CheckResult> {
  const title = `Write access (${targets.length} package(s))`;
  const results = await Promise.allSettled(targets.map((name) => fetchCollaborators(name)));

  const missing: string[] = [];
  const unknown: string[] = [];
  results.forEach((result, i) => {
    const name = targets[i] ?? "";
    if (result.status === "rejected") unknown.push(name);
    else if (result.value[user] !== "write") missing.push(name);
  });

  if (missing.length > 0) {
    return check(
      title,
      "fail",
      `${user} has no write access to ${missing.length} package(s): ${missing.join(", ")}`,
      [
        `Ask an owner of the ${scope} org to add you to a team with read-write access to these`,
        "packages (npmjs.com → org → Teams → Packages), or to run the deprecation themselves.",
      ],
    );
  }
  if (unknown.length > 0) {
    return check(
      title,
      "warn",
      `could not read the collaborators of ${unknown.length} package(s): ${unknown.join(", ")}`,
      ["Check them with `npm access list collaborators <package>`."],
    );
  }
  return check(
    title,
    "ok",
    `${user} can write all ${targets.length} package(s) (your token must also allow writes)`,
    [],
  );
}

const TFA_TITLE = "Two-factor auth";

const TFA_UNKNOWN_FIX = [
  "If your account requires 2FA for writes, either be ready to type a one-time code",
  "for each package, or use a granular token with “Bypass two-factor authentication”.",
  `Note: npm is restricting 2FA-bypass tokens, see ${BYPASS_2FA_NOTICE}`,
];

function profileUnreadable(code: string | null): CheckResult {
  const reason =
    code === "E403" || code === "E401"
      ? "this token can't read your npm profile (normal for granular access tokens)"
      : `could not read your npm profile (${code ?? "unknown error"})`;
  return check(TFA_TITLE, "warn", `${reason}, so the 2FA mode is unknown`, TFA_UNKNOWN_FIX);
}

/** 2FA mode from `npm profile get --json` output: a mode, null when disabled, undefined when unparseable. */
function parseTfaMode(stdout: string): string | null | undefined {
  try {
    const profile = JSON.parse(stdout) as { tfa?: { mode?: string } | false | null };
    return profile.tfa ? (profile.tfa.mode ?? null) : null;
  } catch {
    return undefined;
  }
}

// fallow-ignore-next-line complexity
export function checkTwoFactor(): CheckResult {
  const run = npm(["profile", "get", "--json"]);
  if (!run.ok) return profileUnreadable(run.code);

  const mode = parseTfaMode(run.stdout);
  if (mode === undefined)
    return check(TFA_TITLE, "warn", "unexpected output from `npm profile get`");
  if (mode === null) return check(TFA_TITLE, "ok", "2FA disabled");
  if (mode !== "auth-and-writes")
    return check(TFA_TITLE, "ok", `2FA mode: ${mode} (writes need no code)`);

  return check(
    TFA_TITLE,
    "warn",
    "2FA is required for writes: npm deprecate will ask for a one-time code",
    [
      "Interactively, npm prompts for the code once per package.",
      "Unattended (CI), use a granular token with “Bypass two-factor authentication”.",
      `Note: npm is restricting 2FA-bypass tokens, see ${BYPASS_2FA_NOTICE}`,
    ],
  );
}
