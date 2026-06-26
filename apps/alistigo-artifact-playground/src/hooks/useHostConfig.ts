import { useState } from "react";
import { KNOWN_APPS } from "../constants";

export interface Config {
  app: string;
  lang: string;
  aiContext: string;
  readonly: boolean;
}

export function useHostConfig() {
  const [config, setConfig] = useState<Config>({
    app: KNOWN_APPS[0] ?? "@alistigo/artifact-list",
    lang: "en",
    aiContext: "claude",
    readonly: false,
  });
  return { config, setConfig };
}
