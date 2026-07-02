import { afterEach, describe, expect, it } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  findWorkspaceRoot,
  getWorkspacePackageDirs,
  resolvePackageDir,
} from "./validate-triggers.js";

const tmpDirs: string[] = [];

function makeTmpDir(): string {
  const dir = mkdtempSync(join(tmpdir(), "agent-skill-tester-test-"));
  tmpDirs.push(dir);
  return dir;
}

afterEach(() => {
  while (tmpDirs.length > 0) {
    const dir = tmpDirs.pop();
    if (dir) rmSync(dir, { recursive: true, force: true });
  }
});

describe("resolvePackageDir", () => {
  it("resolves a relative path directly", () => {
    const root = makeTmpDir();
    mkdirSync(join(root, "my-skill"));
    expect(resolvePackageDir("my-skill", root)).toBe(join(root, "my-skill"));
  });

  it("resolves an absolute path directly", () => {
    const root = makeTmpDir();
    const pkgDir = join(root, "my-skill");
    mkdirSync(pkgDir);
    expect(resolvePackageDir(pkgDir, "/somewhere/else")).toBe(pkgDir);
  });

  it("resolves a bare name via pnpm-workspace.yaml globs", () => {
    const root = makeTmpDir();
    writeFileSync(
      join(root, "pnpm-workspace.yaml"),
      "packages:\n  - apps/*\n  - packages/*\n  - cli/*\n",
    );
    mkdirSync(join(root, "packages", "my-skill"), { recursive: true });

    expect(resolvePackageDir("my-skill", root)).toBe(join(root, "packages", "my-skill"));
  });

  it("resolves a bare name via package.json workspaces when no pnpm-workspace.yaml exists", () => {
    const root = makeTmpDir();
    writeFileSync(
      join(root, "package.json"),
      JSON.stringify({ name: "root", workspaces: ["packages/*"] }),
    );
    mkdirSync(join(root, "packages", "my-skill"), { recursive: true });

    expect(resolvePackageDir("my-skill", root)).toBe(join(root, "packages", "my-skill"));
  });

  it("throws when the name isn't a path and isn't found in the workspace", () => {
    const root = makeTmpDir();
    writeFileSync(join(root, "nx.json"), "{}");

    expect(() => resolvePackageDir("does-not-exist", root)).toThrow("Could not resolve");
  });

  it("throws when there is no path and no monorepo workspace root", () => {
    const root = makeTmpDir();

    expect(() => resolvePackageDir("does-not-exist", root)).toThrow("no monorepo workspace root");
  });
});

describe("findWorkspaceRoot", () => {
  it("finds a root via pnpm-workspace.yaml from a nested directory", () => {
    const root = makeTmpDir();
    writeFileSync(join(root, "pnpm-workspace.yaml"), "packages:\n  - packages/*\n");
    const nested = join(root, "packages", "my-skill");
    mkdirSync(nested, { recursive: true });

    expect(findWorkspaceRoot(nested)).toBe(root);
  });

  it("returns undefined when no workspace markers exist", () => {
    const root = makeTmpDir();
    expect(findWorkspaceRoot(root)).toBeUndefined();
  });
});

describe("getWorkspacePackageDirs", () => {
  it("parses pnpm-workspace.yaml globs into directory names", () => {
    const root = makeTmpDir();
    writeFileSync(
      join(root, "pnpm-workspace.yaml"),
      "packages:\n  - apps/*\n  - packages/*\n  - cli/*\n",
    );

    expect(getWorkspacePackageDirs(root)).toEqual(["apps", "packages", "cli"]);
  });

  it("falls back to defaults when nothing is declared", () => {
    const root = makeTmpDir();
    expect(getWorkspacePackageDirs(root)).toEqual(["packages", "apps", "cli", "libs"]);
  });
});
