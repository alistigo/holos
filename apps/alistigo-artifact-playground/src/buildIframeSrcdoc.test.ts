import { describe, expect, it } from "bun:test";
import {
  assembleSrcdoc,
  type BuildIframeSrcdocOptions,
  buildArtifactConfig,
  buildIframeParts,
  buildIframeSrcdoc,
  type SrcdocAssets,
  type SrcdocSegment,
  segmentSource,
} from "./buildIframeSrcdoc";
import type { Config } from "./playground-config";
import BASELINE from "./srcdoc-baseline.json";

/**
 * `srcdoc-baseline.json` holds the documents the builder produced **before** the
 * part-based refactor, recorded straight off the previous implementation with the
 * two Vite-resolved imports stubbed. It is the regression guard for rule S-1: the
 * refactor has to be invisible, byte for byte, because the end-to-end suites read
 * `#alistigo-config` out of this document, route-intercept the URL its entry tag
 * requests, and assert on the draw-comments host surface it carries.
 *
 * Regenerate it only when the srcdoc is *meant* to change, and expect the suites
 * to need re-running when you do.
 */
const ASSETS: SrcdocAssets = {
  bridgeHtml: "<!--STUB-BRIDGE-->",
  htmlToImageUrl: "/stub/html-to-image.js",
};

/** The CSP string the baseline was recorded with — the dev-hostname globals are unset here. */
const CSP = [
  "default-src 'none'",
  "script-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com https://cdn.jsdelivr.net http://localhost:* http://127.0.0.1:*",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self' http://localhost:* http://127.0.0.1:* ws://localhost:* ws://127.0.0.1:*",
  "frame-src 'self' http://localhost:* http://127.0.0.1:*",
  "worker-src blob:",
  "media-src 'self' blob:",
].join("; ");

const DEV_ENTRY = "http://localhost:5173/src/artifact-entry.tsx";

const base: Config = {
  app: "@alistigo/artifact-list",
  lang: "en",
  aiContext: "claude",
  readonly: false,
  document: "",
  rawMarkdown: "",
  plugins: {},
  published: true,
  mode: "dev",
};

const CASES: Record<string, BuildIframeSrcdocOptions> = {
  claudeWithInputAndPlugins: {
    config: { ...base, plugins: { "@alistigo/artifact-list-checkbox-plugin": { a: 1 } } },
    aiInputMarkdown: "# Groceries\n\n- Bread\n",
    scriptUrl: DEV_ENTRY,
    csp: CSP,
    isDev: true,
    devPluginUrlOverrides: { "@alistigo/artifact-list-checkbox-plugin": "/@fs/x/index.js" },
    assets: ASSETS,
  },
  claudeWithoutInput: {
    config: { ...base },
    scriptUrl: DEV_ENTRY,
    csp: CSP,
    isDev: true,
    devPluginUrlOverrides: { "@alistigo/artifact-list-checkbox-plugin": "/@fs/x/index.js" },
    assets: ASSETS,
  },
  aiContextNone: {
    config: { ...base, aiContext: "none" },
    scriptUrl: DEV_ENTRY,
    csp: CSP,
    isDev: true,
    assets: ASSETS,
  },
  notPublished: {
    config: { ...base, published: false },
    scriptUrl: DEV_ENTRY,
    csp: CSP,
    isDev: true,
    assets: ASSETS,
  },
  prodLocal: {
    config: { ...base, mode: "prod-local" },
    scriptUrl: "/__local-dist/artifact-list/index.js",
    csp: CSP,
    isDev: false,
    devPluginUrlOverrides: {
      "@alistigo/artifact-list-checkbox-plugin": "/__local-dist/x/index.js",
    },
    assets: ASSETS,
  },
  drawComments: {
    config: { ...base, app: "@alistigo/artifact-ai-draw-comments" },
    scriptUrl: DEV_ENTRY,
    csp: CSP,
    isDev: true,
    assets: ASSETS,
  },
};

const SEGMENTS: readonly SrcdocSegment[] = [
  "playground",
  "ai-bridge",
  "artifact",
  "config",
  "ai-input",
];

// ---------------------------------------------------------------- S-1

describe("byte-identity with the pre-refactor builder (S-1)", () => {
  for (const [name, options] of Object.entries(CASES)) {
    it(`reproduces the recorded document for ${name}`, () => {
      const expected = (BASELINE as Record<string, string>)[name];
      expect(typeof expected).toBe("string");
      expect(assembleSrcdoc(buildIframeParts(options))).toBe(expected);
    });
  }

  it("keeps buildIframeSrcdoc as the assembled parts", () => {
    for (const options of Object.values(CASES)) {
      expect(buildIframeSrcdoc(options)).toBe(assembleSrcdoc(buildIframeParts(options)));
    }
  });
});

// ---------------------------------------------------------------- S-2, S-3, S-4

describe("the segments partition the document (S-2, S-3)", () => {
  it("leaves no part untagged", () => {
    for (const options of Object.values(CASES)) {
      for (const part of buildIframeParts(options)) {
        expect(SEGMENTS).toContain(part.segment);
      }
    }
  });

  it("reproduces the document from the segments, in document order", () => {
    for (const options of Object.values(CASES)) {
      const parts = buildIframeParts(options);
      const bySegment = parts.map((part) => part.text).join("");
      expect(bySegment).toBe(assembleSrcdoc(parts));
    }
  });

  it("accounts for every character exactly once across the five segments", () => {
    for (const [name, options] of Object.entries(CASES)) {
      const parts = buildIframeParts(options);
      const lengths = SEGMENTS.map((segment) =>
        parts
          .filter((part) => part.segment === segment)
          .reduce((total, part) => total + part.text.length, 0),
      );
      const summed = lengths.reduce((a, b) => a + b, 0);
      expect(summed, `segment lengths must sum to the document length for ${name}`).toBe(
        assembleSrcdoc(parts).length,
      );
    }
  });

  it("gives each part exactly one segment", () => {
    for (const options of Object.values(CASES)) {
      for (const part of buildIframeParts(options)) {
        expect(SEGMENTS.filter((segment) => segment === part.segment)).toHaveLength(1);
      }
    }
  });

  // S-4
  it("returns parts in document order", () => {
    const parts = buildIframeParts(CASES.claudeWithInputAndPlugins as BuildIframeSrcdocOptions);
    const document = assembleSrcdoc(parts);
    let cursor = 0;
    for (const part of parts) {
      const at = document.indexOf(part.text, cursor);
      expect(at).toBeGreaterThanOrEqual(cursor);
      cursor = at + part.text.length;
    }
  });

  it("emits no empty parts", () => {
    for (const options of Object.values(CASES)) {
      for (const part of buildIframeParts(options)) {
        expect(part.text.length).toBeGreaterThan(0);
      }
    }
  });
});

// ---------------------------------------------------------------- S-5 … S-9

describe("segment contents", () => {
  // S-5 / FR-013
  it("has no ai-bridge parts when the AI context injects none", () => {
    const parts = buildIframeParts(CASES.aiContextNone as BuildIframeSrcdocOptions);
    expect(parts.filter((part) => part.segment === "ai-bridge")).toHaveLength(0);
    expect(segmentSource(parts, "ai-bridge")).toBe("");
  });

  it("carries the bridge and the html-to-image tag under ai-bridge for a Claude context", () => {
    const source = segmentSource(
      buildIframeParts(CASES.claudeWithoutInput as BuildIframeSrcdocOptions),
      "ai-bridge",
    );
    expect(source).toContain("<!--STUB-BRIDGE-->");
    expect(source).toContain("/stub/html-to-image.js");
    expect(source).toContain('window.claudeArtifactStatus = "published"');
  });

  // S-6
  it("drops only the status script when the artifact is not published", () => {
    const source = segmentSource(
      buildIframeParts(CASES.notPublished as BuildIframeSrcdocOptions),
      "ai-bridge",
    );
    expect(source).not.toContain("claudeArtifactStatus");
    expect(source).toContain("<!--STUB-BRIDGE-->");
    expect(source).toContain("/stub/html-to-image.js");
  });

  // S-7
  it("has no ai-input parts when there is no AI input", () => {
    const parts = buildIframeParts(CASES.claudeWithoutInput as BuildIframeSrcdocOptions);
    expect(parts.filter((part) => part.segment === "ai-input")).toHaveLength(0);
    expect(segmentSource(parts, "ai-input")).toBe("");
  });

  it("wraps the markdown in the ai-input script when there is input", () => {
    const source = segmentSource(
      buildIframeParts(CASES.claudeWithInputAndPlugins as BuildIframeSrcdocOptions),
      "ai-input",
    );
    expect(source).toContain('id="ai-input-action"');
    expect(source).toContain("# Groceries");
  });

  // S-8 / FR-014 — the artifact segment loads the artifact and does nothing else
  it("keeps the artifact segment to the entry script alone", () => {
    for (const [name, options] of Object.entries(CASES)) {
      const source = segmentSource(buildIframeParts(options), "artifact");
      expect(source, name).toContain(options.scriptUrl);
      expect(source, name).toContain('<script type="module"');
      expect(source, name).not.toContain("alistigo-config");
      expect(source, name).not.toContain("ai-input-action");
      expect(source, name).not.toContain("STUB-BRIDGE");
      expect(source, name).not.toContain("html-to-image");
      expect(source, name).not.toContain("claudeArtifactStatus");
      expect(source, name).not.toContain("draw-comments-host-surface");
    }
  });

  // S-9 / FR-015 — the playground segment holds the rest, and only the rest
  it("keeps the other segments' markers out of the playground segment", () => {
    for (const [name, options] of Object.entries(CASES)) {
      const source = segmentSource(buildIframeParts(options), "playground");
      expect(source, name).not.toContain("alistigo-config");
      expect(source, name).not.toContain("ai-input-action");
      expect(source, name).not.toContain("STUB-BRIDGE");
      expect(source, name).not.toContain("claudeArtifactStatus");
      expect(source, name).not.toContain('<script type="module" src=');
    }
  });

  it("puts the host scaffolding, plugin overrides and refresh preamble under playground", () => {
    const source = segmentSource(
      buildIframeParts(CASES.claudeWithInputAndPlugins as BuildIframeSrcdocOptions),
      "playground",
    );
    expect(source).toContain("<!DOCTYPE html>");
    expect(source).toContain("Content-Security-Policy");
    expect(source).toContain("window.console");
    expect(source).toContain("__ALISTIGO_PLUGIN_URL_OVERRIDES__");
    expect(source).toContain("/@react-refresh");
    expect(source).toContain("</html>");
  });

  it("puts the draw-comments host surface under playground, not artifact", () => {
    const parts = buildIframeParts(CASES.drawComments as BuildIframeSrcdocOptions);
    expect(segmentSource(parts, "playground")).toContain("draw-comments-host-surface");
    expect(segmentSource(parts, "artifact")).not.toContain("draw-comments-host-surface");
  });

  it("carries the injected configuration under config", () => {
    const source = segmentSource(
      buildIframeParts(CASES.claudeWithoutInput as BuildIframeSrcdocOptions),
      "config",
    );
    expect(source).toContain('id="alistigo-config"');
    expect(source).toContain("@alistigo/artifact-list");
  });
});

// ---------------------------------------------------------------- S-11

describe("buildArtifactConfig (S-11)", () => {
  it("still emits exactly app, lang and readonly", () => {
    expect(buildArtifactConfig(base)).toEqual({
      app: "@alistigo/artifact-list",
      lang: "en",
      readonly: false,
    });
  });

  it("adds plugins only when some are enabled", () => {
    expect(buildArtifactConfig({ ...base, plugins: { "@stub/p": { k: 1 } } })).toEqual({
      app: "@alistigo/artifact-list",
      lang: "en",
      readonly: false,
      plugins: { "@stub/p": { k: 1 } },
    });
  });
});
