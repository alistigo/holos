import { useState } from "react";
import { KNOWN_APPS } from "../constants";

export interface Config {
  app: string;
  lang: string;
  aiContext: string;
  readonly: boolean;
  document: string;
  /** Enabled plugins, keyed by npm package name, each with its own (currently empty) config. */
  plugins: Record<string, Record<string, unknown>>;
}

export function useHostConfig() {
  const [config, setConfig] = useState<Config>({
    app: KNOWN_APPS[0] ?? "@alistigo/artifact-list",
    lang: "en",
    aiContext: "claude",
    readonly: false,
    document: "",
    plugins: {},
  });
  return { config, setConfig };
}
