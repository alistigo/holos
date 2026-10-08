import { Command, Option } from "clipanion";
import { listLocalPackages } from "../lib/list-local-packages.js";
import { listNpmPackages } from "../lib/list-npm-packages.js";
import {
  type CheckResult,
  type CheckStatus,
  checkAuth,
  checkNpmInstalled,
  checkNxWorkspace,
  checkRegistry,
  checkTwoFactor,
  checkWriteAccess,
} from "../lib/npm-prereqs.js";

const ICONS: Record<CheckStatus, string> = { ok: "✓", warn: "!", fail: "✗", skip: "-" };

function skipped(title: string, reason: string): CheckResult {
  return { title, status: "skip", detail: reason, fix: [] };
}

export class DoctorCommand extends Command {
  static override paths = [["doctor"]];

  static override usage = Command.Usage({
    description: "Check the prerequisites for `deprecate` and explain how to fix them",
    details: `
      Verifies, in order:

      - you are inside an Nx workspace (an nx.json is found);
      - the npm CLI is installed and points at the public registry;
      - you are authenticated (\`npm whoami\`), telling apart missing credentials
        from a rejected or expired token;
      - you have read-write access to the packages \`deprecate\` would act on
        (the stale packages for the scope);
      - your two-factor auth mode, which decides whether npm asks for a one-time
        code on each deprecation.

      Each failing or uncertain check prints the steps to fix it. Exits 1 when a
      check fails, 0 otherwise (warnings do not fail).
    `,
    examples: [["Check before deprecating", "nx-npm-publications doctor --scope @alistigo"]],
  });

  scope = Option.String("--scope", {
    required: true,
    description: "npm organisation scope to check access for, e.g. @alistigo",
  });

  private print(result: CheckResult): void {
    const { stdout } = this.context;
    stdout.write(`  ${ICONS[result.status]} ${result.title}: ${result.detail}\n`);
    if (result.status === "warn" || result.status === "fail") {
      for (const line of result.fix) stdout.write(`      ${line}\n`);
    }
  }

  private async staleTargets(): Promise<string[]> {
    const [npmPackages, localPackages] = await Promise.all([
      listNpmPackages(this.scope),
      listLocalPackages(this.scope),
    ]);
    return npmPackages.filter((n) => !localPackages.has(n));
  }

  // fallow-ignore-next-line complexity
  async execute(): Promise<number> {
    this.context.stdout.write(
      `Checking prerequisites for deprecating ${this.scope} packages...\n\n`,
    );
    const results: CheckResult[] = [];
    const run = (result: CheckResult) => {
      results.push(result);
      this.print(result);
    };

    const nxCheck = checkNxWorkspace();
    run(nxCheck);
    if (nxCheck.status === "fail") return 1;

    const npmCheck = checkNpmInstalled();
    run(npmCheck);
    if (npmCheck.status === "fail") return 1;

    run(checkRegistry());

    const { result: authResult, user } = checkAuth();
    run(authResult);

    if (user === null) {
      run(skipped("Write access", "needs authentication"));
      run(skipped("Two-factor auth", "needs authentication"));
    } else {
      const targets = await this.staleTargets();
      run(
        targets.length === 0
          ? skipped("Write access", "no stale packages to deprecate")
          : await checkWriteAccess(targets, this.scope, user),
      );
      run(checkTwoFactor());
    }

    const failed = results.filter((r) => r.status === "fail").length;
    const warned = results.filter((r) => r.status === "warn").length;
    this.context.stdout.write(
      failed > 0
        ? `\n${failed} check(s) failed. Fix them before running \`nx-npm-publications deprecate\`.\n`
        : `\nReady to deprecate${warned > 0 ? ` (${warned} warning(s), see above)` : ""}.\n`,
    );
    return failed > 0 ? 1 : 0;
  }
}
