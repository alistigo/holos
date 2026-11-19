import { describe, expect, it } from "bun:test";
import type { Config, PlaygroundCatalog } from "./playground-config";
import {
  composeConfig,
  defaultConfig,
  PLAYGROUND_STATE_KEY,
  PLAYGROUND_STATE_VERSION,
  parsePlaygroundState,
  serializePlaygroundState,
} from "./playground-state";

/**
 * A hand-built catalogue, never the real registry: these rules are about
 * validation, not about which artifacts happen to be registered today.
 */
const PLUGINS: Record<string, readonly string[]> = {
  "@stub/artifact-alpha": ["@stub/plugin-one", "@stub/plugin-two"],
  "@stub/artifact-beta": ["@stub/plugin-beta-only"],
};

const catalog: PlaygroundCatalog = {
  knownApps: ["@stub/artifact-alpha", "@stub/artifact-beta"],
  pluginsFor: (app) => PLUGINS[app] ?? [],
  documentNames: ["groceries", "empty"],
  modeSelectable: true,
};

const prodCatalog: PlaygroundCatalog = { ...catalog, modeSelectable: false };

function fullConfig(overrides: Partial<Config> = {}): Config {
  return {
    app: "@stub/artifact-alpha",
    lang: "fr",
    aiContext: "none",
    readonly: true,
    document: "groceries",
    rawMarkdown: "# hello",
    plugins: { "@stub/plugin-one": { a: 1 } },
    published: false,
    mode: "prod-local",
    ...overrides,
  };
}

function stored(config: unknown, version: unknown = PLAYGROUND_STATE_VERSION): string {
  return JSON.stringify({ v: version, config });
}

describe("defaultConfig", () => {
  it("falls back to the catalogue's first artifact", () => {
    expect(defaultConfig(catalog).app).toBe("@stub/artifact-alpha");
  });

  it("honours an explicit default artifact", () => {
    expect(defaultConfig(catalog, "@stub/artifact-beta").app).toBe("@stub/artifact-beta");
  });

  it("ignores a default artifact the catalogue does not offer", () => {
    expect(defaultConfig(catalog, "@stub/not-registered").app).toBe("@stub/artifact-alpha");
  });

  it("returns the documented defaults for every other field", () => {
    const c = defaultConfig(catalog);
    expect(c.lang).toBe("en");
    expect(c.aiContext).toBe("claude");
    expect(c.readonly).toBe(false);
    expect(c.document).toBe("");
    expect(c.rawMarkdown).toBe("");
    expect(c.plugins).toEqual({});
    expect(c.published).toBe(true);
    expect(c.mode).toBe("dev");
  });

  it("copes with an empty catalogue rather than producing undefined", () => {
    const empty: PlaygroundCatalog = { ...catalog, knownApps: [] };
    expect(defaultConfig(empty).app).toBe("");
  });
});

describe("composeConfig", () => {
  // C-13
  it("applies later arguments at higher precedence, per field", () => {
    const defaults = defaultConfig(catalog);
    const composed = composeConfig(
      defaults,
      { lang: "fr", app: "@stub/artifact-beta" },
      { app: "@stub/artifact-alpha" },
    );
    expect(composed.app).toBe("@stub/artifact-alpha"); // override wins
    expect(composed.lang).toBe("fr"); // stored wins where no override
    expect(composed.aiContext).toBe("claude"); // default survives
  });

  it("ignores undefined fields instead of blanking the layer below", () => {
    const defaults = defaultConfig(catalog);
    const composed = composeConfig(defaults, { lang: undefined }, { app: undefined });
    expect(composed.lang).toBe("en");
    expect(composed.app).toBe("@stub/artifact-alpha");
  });

  it("leaves a stored field untouched when neither later layer mentions it", () => {
    const defaults = defaultConfig(catalog);
    const composed = composeConfig(defaults, { rawMarkdown: "# kept" }, {});
    expect(composed.rawMarkdown).toBe("# kept");
  });

  // U-7 / FR-009: an override claims its own field and nothing else
  it("lets an override take its field while storage keeps the rest", () => {
    const defaults = defaultConfig(catalog);
    const fromStorage: Partial<Config> = {
      app: "@stub/artifact-beta",
      lang: "fr",
      readonly: true,
      document: "groceries",
    };
    const composed = composeConfig(defaults, fromStorage, { app: "@stub/artifact-alpha" });
    expect(composed.app).toBe("@stub/artifact-alpha");
    expect(composed.lang).toBe("fr");
    expect(composed.readonly).toBe(true);
    expect(composed.document).toBe("groceries");
  });
});

describe("the storage key and envelope", () => {
  // C-1 / FR-006 — useLocalStorageEntries lists keys by startsWith("alistigo")
  // and presents them to the developer as the artifact's own storage.
  it("uses a key the artifact-storage inspector does not pick up", () => {
    expect(PLAYGROUND_STATE_KEY).toBe("dev-playground:config:v1");
    expect(PLAYGROUND_STATE_KEY.startsWith("alistigo")).toBe(false);
  });

  it("is version 1", () => {
    expect(PLAYGROUND_STATE_VERSION).toBe(1);
  });

  // FR-002: all nine fields are written
  it("serialises the whole config under a versioned envelope", () => {
    const config = fullConfig();
    const parsed = JSON.parse(serializePlaygroundState(config)) as {
      v: number;
      config: Record<string, unknown>;
    };
    expect(parsed.v).toBe(1);
    expect(parsed.config).toEqual(config);
    expect(Object.keys(parsed.config).sort()).toEqual([
      "aiContext",
      "app",
      "document",
      "lang",
      "mode",
      "plugins",
      "published",
      "rawMarkdown",
      "readonly",
    ]);
  });

  it("never throws, even on a config carrying something unserialisable", () => {
    const cyclic: Record<string, unknown> = {};
    cyclic.self = cyclic;
    const config = fullConfig({ plugins: { "@stub/plugin-one": cyclic } });
    expect(() => serializePlaygroundState(config)).not.toThrow();
  });
});

describe("parsePlaygroundState — rejection", () => {
  it("returns {} for an absent entry (C-2)", () => {
    expect(parsePlaygroundState(null, catalog)).toEqual({});
  });

  it("returns {} for non-JSON input, without throwing (C-3)", () => {
    expect(() => parsePlaygroundState("not json", catalog)).not.toThrow();
    expect(parsePlaygroundState("not json", catalog)).toEqual({});
  });

  it("returns {} when the version is missing or unknown, even if the config is valid (C-4)", () => {
    expect(parsePlaygroundState(JSON.stringify({ config: fullConfig() }), catalog)).toEqual({});
    expect(parsePlaygroundState(stored(fullConfig(), 99), catalog)).toEqual({});
    expect(parsePlaygroundState(stored(fullConfig(), "1"), catalog)).toEqual({});
  });

  it("returns {} when config is absent or not a plain object (C-5)", () => {
    expect(parsePlaygroundState(stored(undefined), catalog)).toEqual({});
    expect(parsePlaygroundState(stored("a string"), catalog)).toEqual({});
    expect(parsePlaygroundState(stored([1, 2]), catalog)).toEqual({});
    expect(parsePlaygroundState(stored(null), catalog)).toEqual({});
  });

  it("returns {} for a JSON scalar at the top level", () => {
    expect(parsePlaygroundState("42", catalog)).toEqual({});
    expect(parsePlaygroundState("null", catalog)).toEqual({});
  });
});

describe("parsePlaygroundState — field validation", () => {
  // C-6
  it("keeps app only when the catalogue offers it", () => {
    expect(parsePlaygroundState(stored({ app: "@stub/artifact-beta" }), catalog).app).toBe(
      "@stub/artifact-beta",
    );
    expect(parsePlaygroundState(stored({ app: "@stub/gone" }), catalog)).not.toHaveProperty("app");
  });

  // C-7
  it("filters plugin keys against the effective artifact and repairs non-object values", () => {
    const restored = parsePlaygroundState(
      stored({
        app: "@stub/artifact-alpha",
        plugins: {
          "@stub/plugin-one": { k: 1 },
          "@stub/plugin-beta-only": {},
          "@stub/plugin-two": "not an object",
        },
      }),
      catalog,
    );
    expect(restored.plugins).toEqual({ "@stub/plugin-one": { k: 1 }, "@stub/plugin-two": {} });
  });

  it("validates plugins against the default artifact when the stored app was rejected", () => {
    const restored = parsePlaygroundState(
      stored({ app: "@stub/gone", plugins: { "@stub/plugin-beta-only": {} } }),
      catalog,
    );
    expect(restored).not.toHaveProperty("app");
    expect(restored.plugins).toEqual({});
  });

  // C-8
  it("keeps document only when it is empty, raw, or a known fixture", () => {
    expect(parsePlaygroundState(stored({ document: "" }), catalog).document).toBe("");
    expect(parsePlaygroundState(stored({ document: "__raw__" }), catalog).document).toBe("__raw__");
    expect(parsePlaygroundState(stored({ document: "groceries" }), catalog).document).toBe(
      "groceries",
    );
    expect(parsePlaygroundState(stored({ document: "deleted" }), catalog)).not.toHaveProperty(
      "document",
    );
  });

  // C-9
  it("keeps aiContext only when the playground can simulate it", () => {
    expect(parsePlaygroundState(stored({ aiContext: "none" }), catalog).aiContext).toBe("none");
    expect(parsePlaygroundState(stored({ aiContext: "gpt" }), catalog)).not.toHaveProperty(
      "aiContext",
    );
  });

  it("keeps mode only when it is a real mode and the field is offered", () => {
    expect(parsePlaygroundState(stored({ mode: "prod-local" }), catalog).mode).toBe("prod-local");
    expect(parsePlaygroundState(stored({ mode: "staging" }), catalog)).not.toHaveProperty("mode");
    expect(parsePlaygroundState(stored({ mode: "prod-local" }), prodCatalog)).not.toHaveProperty(
      "mode",
    );
  });

  // C-10 — a wrong type omits the field rather than coercing it
  it("omits fields of the wrong type instead of coercing them", () => {
    const restored = parsePlaygroundState(
      stored({
        lang: 42,
        rawMarkdown: { not: "a string" },
        readonly: "true",
        published: 1,
        plugins: "nope",
      }),
      catalog,
    );
    expect(restored).not.toHaveProperty("lang");
    expect(restored).not.toHaveProperty("rawMarkdown");
    expect(restored).not.toHaveProperty("readonly");
    expect(restored).not.toHaveProperty("published");
    expect(restored).not.toHaveProperty("plugins");
  });
});

describe("parsePlaygroundState — integrity", () => {
  // C-11 / FR-004
  it("never lets one invalid field discard a valid one", () => {
    const restored = parsePlaygroundState(
      stored({ app: "@alistigo/does-not-exist", lang: "fr" }),
      catalog,
    );
    expect(restored.lang).toBe("fr");
    expect(restored).not.toHaveProperty("app");
  });

  it("keeps every still-valid field when several are broken", () => {
    const restored = parsePlaygroundState(
      stored({
        app: "@stub/gone",
        lang: "fr",
        aiContext: "gpt",
        readonly: true,
        document: "deleted",
        rawMarkdown: "# kept",
        published: false,
      }),
      catalog,
    );
    expect(restored).toEqual({
      lang: "fr",
      readonly: true,
      rawMarkdown: "# kept",
      published: false,
    });
  });

  // C-12
  it("round-trips a fully valid config", () => {
    const config = fullConfig();
    expect(parsePlaygroundState(serializePlaygroundState(config), catalog)).toEqual(config);
  });

  it("round-trips the defaults", () => {
    const config = defaultConfig(catalog);
    expect(parsePlaygroundState(serializePlaygroundState(config), catalog)).toEqual(config);
  });

  // Validation order: app resolves before the fields scoped to it
  it("resolves the artifact before the fields scoped to it", () => {
    const withBeta = parsePlaygroundState(
      stored({ app: "@stub/artifact-beta", plugins: { "@stub/plugin-beta-only": {} } }),
      catalog,
    );
    expect(withBeta.app).toBe("@stub/artifact-beta");
    expect(withBeta.plugins).toEqual({ "@stub/plugin-beta-only": {} });

    const withoutApp = parsePlaygroundState(
      stored({ app: "@stub/gone", plugins: { "@stub/plugin-beta-only": {} } }),
      catalog,
    );
    expect(withoutApp.plugins).toEqual({});
  });
});
