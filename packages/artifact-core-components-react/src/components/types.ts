export interface PluginInfo {
  name: string;
  version: string;
  type: string;
  status: "loaded" | "error" | "not-loaded";
  error?: string | undefined;
}
