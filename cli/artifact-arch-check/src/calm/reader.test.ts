import { describe, expect, it } from "bun:test";
import { getCheckableNodes, resolveImplPackage, resolvePackageDir } from "./reader.js";
import type { CalmArchFile, CalmNode } from "./types.js";

function node(id: string, overrides: Partial<CalmNode> = {}): CalmNode {
  return { "unique-id": id, "node-type": "module", name: id, description: "", ...overrides };
}

function calm(nodes: CalmNode[]): CalmArchFile {
  return { $schema: "", "unique-id": "t", name: "t", description: "", nodes, relationships: [] };
}

describe("getCheckableNodes", () => {
  it("returns only nodes with package-name", () => {
    const nodes = [
      node("a", { "package-name": "{domain}-domain" }),
      node("b"),
      node("c", { "package-name": "{domain}-app" }),
    ];
    const result = getCheckableNodes(calm(nodes));
    expect(result).toHaveLength(2);
    expect(result.map((n) => n["unique-id"])).toEqual(["a", "c"]);
  });

  it("returns empty array when no nodes have package-name", () => {
    expect(getCheckableNodes(calm([node("a"), node("b")]))).toHaveLength(0);
  });

  it("includes nodes regardless of node-type", () => {
    const nodes = [
      node("sk", { "node-type": "skill", "package-name": "{domain}-skill" }),
      node("pl", { "node-type": "plugin", "package-name": "{domain}-plugin" }),
    ];
    expect(getCheckableNodes(calm(nodes))).toHaveLength(2);
  });
});

describe("resolveImplPackage", () => {
  it("substitutes {domain} with the artifact name", () => {
    const n = node("domain", { "package-name": "{domain}-domain" });
    expect(resolveImplPackage(n, "list")).toBe("@alistigo/list-domain");
  });

  it("substitutes every {domain} occurrence", () => {
    const n = node("x", { "package-name": "{domain}-x-{domain}" });
    expect(resolveImplPackage(n, "list")).toBe("@alistigo/list-x-list");
  });

  it("returns undefined for nodes without package-name", () => {
    const n = node("shared", { "core-npm-package": "@alistigo/shared" });
    expect(resolveImplPackage(n, "list")).toBeUndefined();
  });

  it("handles package-name with no {domain} placeholder", () => {
    const n = node("fixed", { "package-name": "my-fixed-pkg" });
    expect(resolveImplPackage(n, "anything")).toBe("@alistigo/my-fixed-pkg");
  });
});

describe("resolvePackageDir", () => {
  it("strips @scope and maps to packages/", () => {
    expect(resolvePackageDir("/workspace", "@alistigo/list-domain")).toBe(
      "/workspace/packages/list-domain",
    );
  });

  it("works with any scope prefix", () => {
    expect(resolvePackageDir("/ws", "@org/my-pkg")).toBe("/ws/packages/my-pkg");
  });

  it("resolves absolute path from workspace root", () => {
    const result = resolvePackageDir("/root/project", "@alistigo/core");
    expect(result).toBe("/root/project/packages/core");
  });
});
