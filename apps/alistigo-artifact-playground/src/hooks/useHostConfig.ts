import { useState } from "react";
import { KNOWN_APPS } from "../constants";

export interface Config {
  app: string;
  lang: string;
  aiContext: string;
  readonly: boolean;
  document: string;
  /** Raw markdown string, used when document === "__raw__". */
  rawMarkdown: string;
  /** Enabled plugins, keyed by npm package name, each with its own (currently empty) config. */
  plugins: Record<string, Record<string, unknown>>;
  /** Simulates a published artifact — injects window.claudeArtifactStatus into the iframe. Only relevant when aiContext === "claude". */
  published: boolean;
}

/** Set VITE_DEFAULT_ARTIFACT at build time to pin a specific artifact as the landing default. */
const DEFAULT_ARTIFACT: string =
  import.meta.env.VITE_DEFAULT_ARTIFACT || KNOWN_APPS[0] || "@alistigo/artifact-list";

export function useHostConfig() {
  const [config, setConfig] = useState<Config>({
    app: DEFAULT_ARTIFACT,
    lang: "en",
    aiContext: "claude",
    readonly: false,
    document: "",
    rawMarkdown: "",
    plugins: {},
    published: true,
  });
  return { config, setConfig };
}
