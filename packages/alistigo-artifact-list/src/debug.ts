import pkg from "../package.json" with { type: "json" };
import { getLoadedPluginNames, getMountedContainers } from "./runtime-state.js";

export interface VersionInfo {
  version: string;
  locale: string;
  buildTime: string;
  dependencies: Record<string, string>;
}

export interface AboutInfo extends VersionInfo {
  runtime: {
    storageType: string;
    mountedContainers: readonly string[];
    logLevel: string;
  };
  plugins: readonly string[];
}

function detectStorageType(): string {
  if (typeof window !== "undefined" && "storage" in window) return "window.storage";
  if (typeof localStorage !== "undefined") return "localStorage";
  return "none";
}

function buildVersionInfo(): VersionInfo {
  return {
    version: pkg.version,
    locale: (import.meta.env.VITE_LOCALE as string | undefined) ?? "en",
    buildTime: (import.meta.env.VITE_BUILD_TIME as string | undefined) ?? "unknown",
    dependencies: {
      react: pkg.dependencies.react,
      "@lingui/core": pkg.dependencies["@lingui/core"],
    },
  };
}

export function version(): VersionInfo {
  const info = buildVersionInfo();
  console.log(info);
  return info;
}

export function about(): AboutInfo {
  const info: AboutInfo = {
    ...buildVersionInfo(),
    runtime: {
      storageType: detectStorageType(),
      mountedContainers: getMountedContainers(),
      logLevel:
        (import.meta.env.VITE_ALISTIGO_DEBUG as string | undefined) === "true" ? "trace" : "error",
    },
    plugins: getLoadedPluginNames(),
  };
  console.log(info);
  return info;
}
