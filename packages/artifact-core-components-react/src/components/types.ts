export interface PluginInfo {
  name: string;
  version: string;
  type: string;
  status: "inactive" | "loading" | "active" | "error";
  error?: string | undefined;
}
